import { useState, useEffect } from 'react';
import { useWeb3 } from '../utils/Web3Context';
import { ethers } from 'ethers';
import contractInfo from '../utils/contractData.json';

export default function MintForm() {
  const { contract, account, web3Error } = useWeb3();
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(true);

  const [form, setForm] = useState({
    matchId: '',
    enclosure: '',
    cnic: '',
    personCount: '1'
  });

  const [minting, setMinting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchMatches = async () => {
      if (web3Error) { setMatches([]); setLoadingMatches(false); return; }
      if (!contract) { setLoadingMatches(false); return; }
      try {
        const count = await contract.getMatchCount();
        const activeMatches = [];
        for (let i = 0; i < Number(count); i++) {
          const matchData = await contract.matches(i);
          if (matchData.isActive) {
            const [enclosureNames, enclosurePrices, enclosureCapacities, enclosureMinted] = await contract.getMatchEnclosures(i);
            const enclosures = enclosureNames.map((name, idx) => ({
              name,
              price: enclosurePrices[idx],
              capacity: enclosureCapacities[idx],
              minted: enclosureMinted[idx]
            }));
            activeMatches.push({ id: i, teams: matchData.teams, stadium: matchData.stadium, maxCapacity: matchData.maxCapacity, currentMinted: matchData.currentMinted, enclosures });
          }
        }
        setMatches(activeMatches);
        if (activeMatches.length > 0) {
          const firstMatch = activeMatches[0];
          const firstAvailable = firstMatch.enclosures.find((enc) => Number(enc.minted) < Number(enc.capacity));
          setForm(prev => ({ ...prev, matchId: firstMatch.id.toString(), enclosure: firstAvailable ? firstAvailable.name : '' }));
        }
      } catch (err) {
        console.error("Failed to fetch matches", err);
        setError('Unable to load active matches. Confirm wallet network and contract address.');
      }
      setLoadingMatches(false);
    };
    fetchMatches();
  }, [contract, web3Error]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'matchId') {
      const selected = matches.find((m) => m.id.toString() === value);
      const firstAvailable = selected?.enclosures.find((enc) => Number(enc.minted) < Number(enc.capacity));
      setForm((prev) => ({ ...prev, matchId: value, enclosure: firstAvailable ? firstAvailable.name : '' }));
      return;
    }
    setForm({ ...form, [name]: value });
  };

  const handleMint = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (web3Error) return setError(web3Error);
    if (!account) return setError("Please connect your wallet first.");
    if (!contract) return setError("Contract connection is not ready.");
    if (!form.matchId || !form.enclosure || !form.cnic || !form.personCount) return setError("Please fill all fields.");

    const personCount = Number(form.personCount);
    if (!Number.isInteger(personCount) || personCount < 1 || personCount > 5) return setError('Family pass size must be between 1 and 5 people.');

    const cnicRegex = /^[0-9]{5}-[0-9]{7}-[0-9]{1}$/;
    if (!cnicRegex.test(form.cnic)) return setError("CNIC must be in format XXXXX-XXXXXXX-X");

    setMinting(true);
    try {
      const contractAddress = contract?.target || process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || contractInfo.address;
      const rpcUrl = process.env.NEXT_PUBLIC_WIREFLUID_RPC_URL || 'https://evm.wirefluid.com';
      const readOnlyProvider = new ethers.JsonRpcProvider(rpcUrl);
      const readOnlyContract = new ethers.Contract(contractAddress, contractInfo.abi, readOnlyProvider);

      const cnicHash = ethers.id(form.cnic);
      const selectedMatch = matches.find(m => m.id.toString() === form.matchId);
      const selectedEnclosure = selectedMatch?.enclosures.find((enc) => enc.name === form.enclosure);

      if (!selectedMatch) { setError('Selected match not found. Refresh and re-select a match.'); return; }
      if (!selectedEnclosure) { setError('Selected enclosure is invalid for this match.'); return; }

      const [onChainMatch, enclosureDetails, alreadyMinted] = await Promise.all([
        readOnlyContract.matches(form.matchId),
        readOnlyContract.getEnclosureDetails(form.matchId, form.enclosure),
        readOnlyContract.matchWalletMintCount(form.matchId, account),
      ]);

      if (!onChainMatch.isActive) { setError('This match is not active for minting.'); return; }

      const [priceWei, capacity, currentMinted, exists] = enclosureDetails;
      if (!exists) { setError('Selected enclosure does not exist on-chain for this match.'); return; }
      if (currentMinted >= capacity) { setError('Selected enclosure is sold out. Choose another.'); return; }
      if (alreadyMinted !== 0n) { setError('You can only mint one family pass per match for this wallet.'); return; }

      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="400" height="600" style="background-color:#0c1812;font-family:monospace;">
          <rect width="100%" height="100%" fill="#0c1812" />
          <path d="M 0 150 L 400 150 M 0 450 L 400 450" stroke="#0f2415" stroke-width="2" />
          <text x="24" y="60" fill="#00ff6a" font-family="sans-serif" font-size="28" font-weight="900" letter-spacing="2">CHAINPASS</text>
          <text x="24" y="90" fill="#4a7055" font-size="12" letter-spacing="1.5">// ON_CHAIN_SECURE_TICKET</text>
          
          <text x="24" y="240" fill="#d4edd8" font-size="24" font-weight="bold">${selectedMatch.teams}</text>
          <text x="24" y="280" fill="#e8b84b" font-size="18">${form.enclosure.toUpperCase()} ENCLOSURE</text>
          <text x="24" y="320" fill="#d4edd8" font-size="16">PERSON COUNT: ${personCount}</text>
          <text x="24" y="390" fill="#00ff6a" font-size="14">PRICE: ${Number(ethers.formatEther(priceWei)) * personCount} WIRE</text>

          <rect x="24" y="480" width="80" height="80" fill="#1a3520" />
          <rect x="34" y="490" width="20" height="20" fill="#00ff6a" />
          <rect x="64" y="530" width="20" height="20" fill="#00ff6a" />
          
          <text x="124" y="500" fill="#4a7055" font-size="11" letter-spacing="1">STRICTLY SOULBOUND (NON-TRANSFERABLE)</text>
          <text x="124" y="525" fill="#4a7055" font-size="11" letter-spacing="1">ISSUED ON: WIREFLUID TESTNET</text>
          <text x="124" y="550" fill="#4a7055" font-size="11" letter-spacing="1">ID: ${cnicHash.slice(0, 15)}...</text>
        </svg>
      `;

      const encodedSvg = btoa(unescape(encodeURIComponent(svg)));
      const imageUri = `data:image/svg+xml;base64,${encodedSvg}`;

      const meta = {
        name: `PSL Pass: ${selectedMatch.teams}`,
        description: `Verified soulbound ticket for ${form.enclosure} enclosure. Valid for ${personCount} person(s). Backed securely on the WireFluid blockchain.`,
        image: imageUri,
        attributes: [
          { trait_type: "Match", value: selectedMatch.teams },
          { trait_type: "Enclosure", value: form.enclosure },
          { trait_type: "Persons", value: personCount }
        ]
      };

      const encodedMeta = btoa(unescape(encodeURIComponent(JSON.stringify(meta))));
      const tokenUri = `data:application/json;base64,${encodedMeta}`;

      const totalPrice = priceWei * BigInt(personCount);
      const tx = await contract.mintTicket(form.matchId, form.enclosure, cnicHash, personCount, tokenUri, { value: totalPrice, gasLimit: 500000 });
      await tx.wait();

      setSuccess(`FAMILY_PASS SECURED FOR ${personCount} PEOPLE. Proceed to 'My Tickets' vault.`);
      setForm({ ...form, cnic: '', personCount: '1' });
    } catch (err) {
      console.error(err);
      if (err.message.includes("EnclosureSoldOut")) setError("Selected enclosure is sold out. Choose another.");
      else if (err.message.includes("WalletLimitReached")) setError("You can only mint one family pass per match for this wallet.");
      else if (err.message.includes("InvalidPersonCount")) setError("Family pass size must be between 1 and 5 people.");
      else if (err.message.includes('user rejected') || err.code === 'ACTION_REJECTED') setError('Transaction was rejected in wallet.');
      else setError("Transaction failed. If this keeps happening, your RPC may be rejecting simulations; try again or switch RPC in MetaMask.");
    } finally {
      setMinting(false);
    }
  };

  const selectedMatchForMap = matches.find((m) => m.id.toString() === form.matchId);

  return (
    <div 
      style={styles.container} 
      data-stadium-name={selectedMatchForMap?.stadium || ''}
      data-active-enclosures={JSON.stringify(selectedMatchForMap?.enclosures.map(e => e.name) || [])}
    >
      <div style={styles.header}>
        <div style={styles.secTag}>// PUBLIC_MINT</div>
        <h2 style={styles.title}>SECURE_YOUR_SEAT</h2>
      </div>

      {web3Error && <div style={styles.warn}>{web3Error}</div>}

      <form onSubmit={handleMint} style={styles.form}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>SELECT_MATCH</label>
          {!account ? (
            <div style={styles.placeholder}>Waiting for Wallet Connection...</div>
          ) : web3Error ? (
            <div style={{ ...styles.placeholder, ...styles.warnInline }}>Cannot load matches until wallet is on the expected chain.</div>
          ) : !contract ? (
            <div style={styles.placeholder}>Preparing contract connection...</div>
          ) : loadingMatches ? (
            <div style={styles.placeholder}>Loading active matches...</div>
          ) : matches.length === 0 ? (
            <div style={styles.placeholder}>No active matches available.</div>
          ) : (
            <select name="matchId" value={form.matchId} onChange={handleChange} style={styles.input}>
              {matches.map(m => (
                <option key={m.id} value={m.id}>
                  {m.teams} ({m.currentMinted.toString()}/{m.maxCapacity.toString()} seats)
                </option>
              ))}
            </select>
          )}
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>SELECT_ENCLOSURE</label>
          {(() => {
            const selectedMatch = matches.find((m) => m.id.toString() === form.matchId);
            if (!selectedMatch) return <div style={styles.placeholder}>Select a match first.</div>;
            const available = selectedMatch.enclosures.filter((enc) => Number(enc.minted) < Number(enc.capacity));
            if (!available.length) return <div style={{ ...styles.placeholder, ...styles.warnInline }}>All enclosures sold out for this match.</div>;
            return (
              <select name="enclosure" value={form.enclosure} onChange={handleChange} style={styles.input}>
                {available.map((enc) => {
                  const remaining = Number(enc.capacity) - Number(enc.minted);
                  return (
                    <option key={enc.name} value={enc.name}>
                      {enc.name} — {ethers.formatEther(enc.price)} WIRE ({remaining} left)
                    </option>
                  );
                })}
              </select>
            );
          })()}
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>PERSON_COUNT</label>
          <select name="personCount" value={form.personCount} onChange={handleChange} style={styles.input}>
            {[1, 2, 3, 4, 5].map((count) => (
              <option key={count} value={count}>
                {count} PERSON{count > 1 ? 'S' : ''}
              </option>
            ))}
          </select>
          <p style={styles.privacyNote}>* One NFT minted for the whole family pass. Price updates based on headcount.</p>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>CNIC (REAL_WORLD_BINDING)</label>
          <input
            required
            name="cnic"
            value={form.cnic}
            onChange={handleChange}
            style={styles.input}
            placeholder="XXXXX-XXXXXXX-X"
          />
          <p style={styles.privacyNote}>* Your CNIC is hashed locally in your browser. Raw numbers are never sent.</p>
        </div>

        {error && (
          <div style={styles.error}>
            <span style={styles.errorIcon}>⚠</span>
            {error}
          </div>
        )}
        {success && (
          <div style={styles.success}>
            <span style={styles.successIcon}>✓</span>
            {success}
          </div>
        )}

        <button type="submit" disabled={minting} style={{ ...styles.btn, opacity: minting ? 0.55 : 1 }}>
          {minting ? '// MINTING_TO_CHAIN...' : 'INITIATE_BINDING →'}
        </button>
      </form>

      <style>{`
        select option { background: #0c1812; color: #d4edd8; }
        input:focus, select:focus { border-color: var(--g) !important; outline: none; }
        select { text-overflow: ellipsis; white-space: nowrap; overflow: hidden; }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    height: '100%',
    padding: 'clamp(20px, 4vw, 32px)',
    background: 'var(--surface)',
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid var(--border)',
    borderRadius: '4px',
  },
  header: { marginBottom: '24px', borderBottom: '1px solid var(--border2)', paddingBottom: '20px' },
  secTag: { fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--g)', letterSpacing: '2.5px', marginBottom: '8px' },
  title: { fontFamily: 'var(--mono)', fontSize: 'clamp(16px, 2.5vw, 20px)', letterSpacing: '1px', color: 'var(--text)' },
  warn: {
    color: 'var(--danger)', fontFamily: 'var(--mono)', fontSize: '11px',
    border: '1px solid var(--danger)', background: 'rgba(255,59,59,0.05)',
    padding: '10px 12px', marginBottom: '16px', lineHeight: 1.5, borderRadius: '2px',
  },
  warnInline: { color: 'var(--danger)', borderColor: 'var(--danger)', fontSize: '11px', lineHeight: 1.5 },
  form: { flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(14px, 2.5vw, 20px)' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--g)', letterSpacing: '1.5px' },
  input: {
    background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border2)',
    color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: 'clamp(12px, 2vw, 14px)', padding: '12px 14px',
    width: '100%', boxSizing: 'border-box', borderRadius: '2px', transition: 'border-color 0.2s',
  },
  placeholder: {
    background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)',
    color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: '12px', padding: '12px 14px',
    borderRadius: '2px', fontStyle: 'italic',
  },
  privacyNote: { fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--muted)', lineHeight: 1.5 },
  btn: {
    background: 'linear-gradient(180deg, #14ff78 0%, #00d95a 100%)',
    color: 'var(--bg)', border: 'none', padding: 'clamp(14px, 2vw, 18px)',
    fontFamily: 'var(--mono)', fontSize: 'clamp(11px, 2vw, 14px)', fontWeight: 'bold', cursor: 'pointer',
    letterSpacing: '1px', marginTop: 'auto', transition: 'all 0.2s', borderRadius: '2px',
    boxShadow: '0 6px 20px rgba(0,255,106,0.25)',
  },
  error: {
    color: 'var(--danger)', fontFamily: 'var(--mono)', fontSize: '11px',
    border: '1px solid var(--danger)', background: 'rgba(255,59,59,0.05)',
    padding: '10px 12px', display: 'flex', gap: '8px', alignItems: 'flex-start',
    lineHeight: 1.5, borderRadius: '2px',
  },
  errorIcon: { flexShrink: 0, marginTop: '1px' },
  success: {
    color: 'var(--g)', fontFamily: 'var(--mono)', fontSize: '11px',
    border: '1px solid var(--g)', background: 'rgba(0,255,106,0.05)',
    padding: '10px 12px', display: 'flex', gap: '8px', alignItems: 'flex-start',
    lineHeight: 1.5, borderRadius: '2px',
  },
  successIcon: { flexShrink: 0, marginTop: '1px' },
};
