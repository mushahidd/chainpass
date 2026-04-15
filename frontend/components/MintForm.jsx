import { useState, useEffect } from 'react';
import { useWeb3 } from '../utils/Web3Context';
import CustomSelect from './CustomSelect';
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
    if (!form.matchId || !form.enclosure || !form.cnic || !form.personCount) {
      return setError("Please fill all fields.");
    }

    const personCount = Number(form.personCount);
    if (!Number.isInteger(personCount) || personCount < 1 || personCount > 5) {
      return setError('Family pass size must be between 1 and 5 people.');
    }

    // Basic regex for CNIC format XXXXX-XXXXXXX-X
    const cnicRegex = /^[0-9]{5}-[0-9]{7}-[0-9]{1}$/;
    if (!cnicRegex.test(form.cnic)) {
      return setError("CNIC must be in format XXXXX-XXXXXXX-X");
    }

    setMinting(true);
    try {
      const contractAddress = contract?.target || process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || contractInfo.address;
      const rpcUrl = process.env.NEXT_PUBLIC_WIREFLUID_RPC_URL || 'https://evm.wirefluid.com';
      const readOnlyProvider = new ethers.JsonRpcProvider(rpcUrl);
      const readOnlyContract = new ethers.Contract(contractAddress, contractInfo.abi, readOnlyProvider);

      // PRIVACY PRESERVING LOCALLY HASHED CNIC
      const cnicHash = ethers.id(form.cnic);
      const selectedMatch = matches.find(m => m.id.toString() === form.matchId);
      const selectedEnclosure = selectedMatch?.enclosures.find((enc) => enc.name === form.enclosure);

      if (!selectedMatch) {
        setError('Selected match not found. Refresh and re-select a match.');
        return;
      }

      if (!selectedEnclosure) {
        setError('Selected enclosure is invalid for this match.');
        return;
      }

      // Read-only preflight checks via RPC (avoids MetaMask console spam).
      const [onChainMatch, enclosureDetails, alreadyMinted] = await Promise.all([
        readOnlyContract.matches(form.matchId),
        readOnlyContract.getEnclosureDetails(form.matchId, form.enclosure),
        readOnlyContract.matchWalletMintCount(form.matchId, account),
      ]);

      if (!onChainMatch.isActive) {
        setError('This match is not active for minting.');
        return;
      }

      const [priceWei, capacity, currentMinted, exists] = enclosureDetails;
      if (!exists) {
        setError('Selected enclosure does not exist on-chain for this match.');
        return;
      }

      if (currentMinted >= capacity) {
        setError('Selected enclosure is sold out. Choose another.');
        return;
      }

      if (alreadyMinted !== 0n) {
        setError('You can only mint one family pass per match for this wallet.');
        return;
      }

      const totalPrice = priceWei * BigInt(personCount);
      
      const tx = await contract.mintTicket(
        form.matchId,
        form.enclosure,
        cnicHash,
        personCount,
        "ipfs://QmDefaultHashTicketURI",
        // Provide explicit gasLimit so the wallet doesn't have to rely on flaky estimateGas.
        { value: totalPrice, gasLimit: 500000 }
      );
      
      await tx.wait();
      setSuccess(`FAMILY_PASS SECURED FOR ${personCount} PEOPLE. Proceed to 'My Tickets' vault.`);
      setForm({ ...form, cnic: '', personCount: '1' }); // clear sensitive data
    } catch (err) {
      console.error(err);
      if (err.message.includes("EnclosureSoldOut")) {
        setError("Selected enclosure is sold out. Choose another.");
      } else if (err.message.includes("WalletLimitReached")) {
        setError("You can only mint one family pass per match for this wallet.");
      } else if (err.message.includes("InvalidPersonCount")) {
        setError("Family pass size must be between 1 and 5 people.");
      } else if (err.message.includes('user rejected') || err.code === 'ACTION_REJECTED') {
        setError('Transaction was rejected in wallet.');
      } else {
        setError("Transaction failed. If this keeps happening, your RPC may be rejecting simulations; try again or switch RPC in MetaMask.");
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
            <CustomSelect
              name="matchId"
              value={form.matchId}
              onChange={handleChange}
              options={matches.map(m => ({
                value: m.id.toString(),
                label: `${m.teams} (${m.currentMinted.toString()}/${m.maxCapacity.toString()} seats)`
              }))}
              placeholder="Select a match..."
            />
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
              <CustomSelect
                name="enclosure"
                value={form.enclosure}
                onChange={handleChange}
                options={available.map((enc) => {
                  const remaining = Number(enc.capacity) - Number(enc.minted);
                  return {
                    value: enc.name,
                    label: `${enc.name} - ${ethers.formatEther(enc.price)} WIRE (${remaining} left)`
                  };
                })}
                placeholder="Select an enclosure..."
              />
            );
          })()}
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>PERSON_COUNT</label>
          <CustomSelect
            name="personCount"
            value={form.personCount}
            onChange={handleChange}
            options={[1, 2, 3, 4, 5].map((count) => ({
              value: count.toString(),
              label: `${count} PERSON${count > 1 ? 'S' : ''}`
            }))}
          />
          <p style={styles.privacyNote}>* One NFT will be minted for the whole family pass. The price updates automatically based on the selected headcount.</p>
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
