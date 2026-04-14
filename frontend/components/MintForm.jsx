import { useState, useEffect } from 'react';
import { useWeb3 } from '../utils/Web3Context';
import { ethers } from 'ethers';

export default function MintForm() {
  const { contract, account, web3Error } = useWeb3();
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  
  const [form, setForm] = useState({
    matchId: '',
    enclosure: '',
    cnic: ''
  });
  
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchMatches = async () => {
      if (web3Error) {
        setMatches([]);
        setLoadingMatches(false);
        return;
      }

      if (!contract) {
        setLoadingMatches(false);
        return;
      }
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

            activeMatches.push({
              id: i,
              teams: matchData.teams,
              stadium: matchData.stadium,
              maxCapacity: matchData.maxCapacity,
              currentMinted: matchData.currentMinted,
              enclosures
            });
          }
        }
        setMatches(activeMatches);
        if (activeMatches.length > 0) {
          const firstMatch = activeMatches[0];
          const firstAvailable = firstMatch.enclosures.find(
            (enc) => Number(enc.minted) < Number(enc.capacity)
          );

          setForm(prev => ({
            ...prev,
            matchId: firstMatch.id.toString(),
            enclosure: firstAvailable ? firstAvailable.name : ''
          }));
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
      const firstAvailable = selected?.enclosures.find(
        (enc) => Number(enc.minted) < Number(enc.capacity)
      );

      setForm((prev) => ({
        ...prev,
        matchId: value,
        enclosure: firstAvailable ? firstAvailable.name : ''
      }));
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
    if (!form.matchId || !form.enclosure || !form.cnic) {
      return setError("Please fill all fields.");
    }

    // Basic regex for CNIC format XXXXX-XXXXXXX-X
    const cnicRegex = /^[0-9]{5}-[0-9]{7}-[0-9]{1}$/;
    if (!cnicRegex.test(form.cnic)) {
      return setError("CNIC must be in format XXXXX-XXXXXXX-X");
    }

    setMinting(true);
    try {
      // PRIVACY PRESERVING LOCALLY HASHED CNIC
      const cnicHash = ethers.id(form.cnic);
      const selectedMatch = matches.find(m => m.id.toString() === form.matchId);
      const selectedEnclosure = selectedMatch?.enclosures.find((enc) => enc.name === form.enclosure);

      if (!selectedMatch) {
        throw new Error('Selected match not found on current chain state.');
      }

      if (!selectedEnclosure) {
        throw new Error('Selected enclosure is invalid for this match.');
      }
      
      const tx = await contract.mintTicket(
        form.matchId,
        form.enclosure,
        cnicHash,
        "ipfs://QmDefaultHashTicketURI",
        { value: selectedEnclosure.price }
      );
      
      await tx.wait();
      setSuccess("TICKET SECURED. Proceed to 'My Tickets' vault.");
      setForm({ ...form, cnic: '' }); // clear sensitive data
    } catch (err) {
      console.error(err);
      if (err.message.includes("EnclosureSoldOut")) {
        setError("Selected enclosure is sold out. Choose another.");
      } else if (err.message.includes("WalletLimitReached")) {
        setError("You can only mint a maximum of 5 tickets for this match.");
      } else {
        setError("Transaction failed. Check console or wallet limit.");
      }
    } finally {
      setMinting(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.secTag}>// PUBLIC_MINT</div>
        <h2 style={styles.title}>SECURE_YOUR_SEAT</h2>
      </div>

      {web3Error && <div style={styles.warn}>{web3Error}</div>}

      <form onSubmit={handleMint} style={styles.form}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>SELECT_MATCH</label>
         {!account ? (
           <div style={styles.input}>Waiting for Wallet Connection...</div>
         ) : web3Error ? (
           <div style={{ ...styles.input, ...styles.warnInline }}>Cannot load matches until wallet is on the expected chain.</div>
         ) : !contract ? (
           <div style={styles.input}>Preparing contract connection...</div>
          ) : loadingMatches ? (
             <div style={styles.input}>Loading active matches...</div>
          ) : matches.length === 0 ? (
             <div style={styles.input}>No active matches available.</div>
          ) : (
            <select name="matchId" value={form.matchId} onChange={handleChange} style={styles.input}>
              {matches.map(m => (
                <option key={m.id} value={m.id}>
                  {m.teams} ({m.currentMinted.toString()}/{m.maxCapacity.toString()} minted)
                </option>
              ))}
            </select>
          )}
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>SELECT_ENCLOSURE</label>
          {(() => {
            const selectedMatch = matches.find((m) => m.id.toString() === form.matchId);
            if (!selectedMatch) return <div style={styles.input}>Select a match first.</div>;

            const available = selectedMatch.enclosures.filter(
              (enc) => Number(enc.minted) < Number(enc.capacity)
            );

            if (!available.length) {
              return <div style={{ ...styles.input, ...styles.warnInline }}>All enclosures sold out for this match.</div>;
            }

            return (
              <select name="enclosure" value={form.enclosure} onChange={handleChange} style={styles.input}>
                {available.map((enc) => {
                  const remaining = Number(enc.capacity) - Number(enc.minted);
                  return (
                    <option key={enc.name} value={enc.name}>
                      {enc.name} - {ethers.formatEther(enc.price)} ETH ({remaining} left)
                    </option>
                  );
                })}
              </select>
            );
          })()}
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>CNIC (REAL_WORLD_BINDING)</label>
          <input required name="cnic" value={form.cnic} onChange={handleChange} style={styles.input} placeholder="XXXXX-XXXXXXX-X" />
          <p style={styles.privacyNote}>* Your CNIC is strictly hashed locally in your browser. Raw numbers are never sent, maintaining absolute privacy.</p>
        </div>

        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

        <button type="submit" disabled={minting} style={{...styles.btn, opacity: minting ? 0.5 : 1}}>
          {minting ? '// MINTING_TO_CHAIN...' : 'INITIATE_BINDING →'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: { height: '100%', padding: '32px', background: 'var(--surface)', display: 'flex', flexDirection: 'column' },
  header: { marginBottom: '24px' },
  secTag: { fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--g)', letterSpacing: '2px', marginBottom: '8px' },
  title: { fontFamily: 'var(--mono)', fontSize: '20px', letterSpacing: '1px' },
  warn: {
    color: 'red',
    fontFamily: 'var(--mono)',
    fontSize: '11px',
    border: '1px dotted red',
    padding: '10px',
    marginBottom: '12px',
    lineHeight: 1.5
  },
  warnInline: { color: 'red', borderColor: 'red', fontSize: '11px', lineHeight: 1.5 },
  form: { flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text)', letterSpacing: '1px' },
  input: {
    background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
    color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '14px', padding: '12px',
    width: '100%', boxSizing: 'border-box'
  },
  privacyNote: { fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--muted)', marginTop: '4px' },
  btn: {
    background: 'var(--g)', color: 'var(--bg)', border: 'none', padding: '16px',
    fontFamily: 'var(--mono)', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer',
    letterSpacing: '1px', marginTop: 'auto'
  },
  error: { color: 'red', fontFamily: 'var(--mono)', fontSize: '11px', border: '1px dotted red', padding: '10px' },
  success: { color: 'var(--g)', fontFamily: 'var(--mono)', fontSize: '11px', border: '1px dotted var(--g)', padding: '10px' }
};
