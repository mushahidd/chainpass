import { useState, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import { useWeb3 } from '../utils/Web3Context';
import { ethers } from 'ethers';

export default function Marketplace() {
  const { contract, account, web3Error } = useWeb3();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);

  // Minting state
  const [enclosure, setEnclosure] = useState('');
  const [cnic, setCnic] = useState('');
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchMatches = async () => {
      if (!contract) {
        setLoading(false);
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
              date: Number(matchData.date) || 0, // Fallback if date is not in struct but assuming it isn't based on MintForm, wait ChainPass might not have match date in struct. We'll order by ID which is chronological.
              enclosures
            });
          }
        }
        setMatches(activeMatches);
      } catch (err) {
        console.error("Failed to fetch matches", err);
      }
      setLoading(false);
    };
    fetchMatches();
  }, [contract]);

  const handleSelectMatch = (match) => {
    setSelectedMatch(match);
    setError('');
    setSuccess('');
    setCnic('');
    const firstAvailable = match.enclosures.find((enc) => Number(enc.minted) < Number(enc.capacity));
    setEnclosure(firstAvailable ? firstAvailable.name : '');
  };

  const handleCancelSelection = () => {
    setSelectedMatch(null);
    setError('');
    setSuccess('');
    setCnic('');
  };

  const handleMint = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (web3Error) return setError(web3Error);
    if (!account) return setError("Please connect your wallet first.");
    if (!contract) return setError("Contract connection is not ready.");
    if (!selectedMatch || !enclosure || !cnic) {
      return setError("Please fill all fields.");
    }

    const cnicRegex = /^[0-9]{5}-[0-9]{7}-[0-9]{1}$/;
    if (!cnicRegex.test(cnic)) {
      return setError("CNIC must be in format XXXXX-XXXXXXX-X");
    }

    setMinting(true);
    try {
      const cnicHash = ethers.id(cnic);
      const selectedEncData = selectedMatch.enclosures.find(e => e.name === enclosure);

      if (!selectedEncData) throw new Error('Selected enclosure is invalid.');
      
      const tx = await contract.mintTicket(
        selectedMatch.id,
        enclosure,
        cnicHash,
        "ipfs://QmDefaultHashTicketURI",
        { value: selectedEncData.price }
      );
      
      await tx.wait();
      setSuccess("TICKET SECURED SUCCESSFULLY! View it in 'My Tickets'.");
      setCnic('');
      
      // Update minted count locally to reflect instantly
      selectedEncData.minted = Number(selectedEncData.minted) + 1;
      selectedMatch.currentMinted = Number(selectedMatch.currentMinted) + 1;
      
    } catch (err) {
      console.error(err);
      if (err.message.includes("EnclosureSoldOut")) {
        setError("Selected enclosure is sold out. Choose another.");
      } else if (err.message.includes("WalletLimitReached")) {
        setError("You can only mint a maximum of 5 tickets for this match.");
      } else {
        setError("Transaction failed. Check your wallet balance.");
      }
    } finally {
      setMinting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Marketplace | ChainPass</title>
      </Head>

      <div style={styles.container}>
        <Navbar />

        <main style={styles.main}>
          <header style={styles.header}>
            <div style={styles.secTag}>// PUBLIC_MARKETPLACE</div>
            <h1 style={styles.title}>MATCH_TICKETS</h1>
            <p style={styles.tip}>Browse active upcoming matches. Purchase blockchain-enforced tickets with zero scalping.</p>
          </header>

          {loading ? (
            <div style={styles.loading}>
              <div style={styles.spinner} />
              <p style={{ marginTop: '20px', fontFamily: 'var(--mono)', color: 'var(--muted)' }}>LOADING ON-CHAIN MATCHES...</p>
            </div>
          ) : web3Error ? (
            <div style={styles.errorBox}>{web3Error}</div>
          ) : matches.length === 0 ? (
            <div style={styles.emptyBox}>No active matches available currently.</div>
          ) : (
            <div style={styles.layout}>
              {/* Match Grid */}
              <div style={styles.grid}>
                {matches.map(m => (
                  <div 
                    key={m.id} 
                    style={{
                      ...styles.card,
                      borderColor: selectedMatch?.id === m.id ? 'var(--g)' : 'var(--border2)'
                    }}
                    onClick={() => handleSelectMatch(m)}
                  >
                    <div style={styles.cardHeader}>
                      <span style={styles.matchId}>MATCH_#{m.id.toString().padStart(2, '0')}</span>
                      <span style={styles.statusLive}>● PUBLIC_MINT</span>
                    </div>
                    <div style={styles.teams}>{m.teams}</div>
                    <div style={styles.stadium}>📍 {m.stadium}</div>
                    <div style={styles.progressBox}>
                      <div style={styles.progressMeta}>
                        <span>MINTED</span>
                        <span>{m.currentMinted.toString()} / {m.maxCapacity.toString()}</span>
                      </div>
                      <div style={styles.progressBar}>
                        <div style={{
                          ...styles.progressFill,
                          width: `${(Number(m.currentMinted) / Number(m.maxCapacity)) * 100}%`
                        }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Purchase Sidebar */}
              <div style={styles.sidebar}>
                {selectedMatch ? (
                  <div style={styles.purchaseFormWrapper}>
                    <div style={{ marginBottom: '24px' }}>
                      <div style={styles.secTag}>// SECURE_YOUR_SEAT</div>
                      <h2 style={{ fontFamily: 'var(--display)', fontSize: '24px' }}>{selectedMatch.teams}</h2>
                      <p style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--muted)' }}>{selectedMatch.stadium}</p>
                    </div>

                    <form onSubmit={handleMint} style={styles.form}>
                      <div style={styles.inputGroup}>
                        <label style={styles.label}>SELECT_ENCLOSURE</label>
                        {(() => {
                          const available = selectedMatch.enclosures.filter(
                            (enc) => Number(enc.minted) < Number(enc.capacity)
                          );

                          if (!available.length) {
                            return <div style={{ ...styles.input, color: 'red', borderColor: 'red' }}>All enclosures sold out for this match.</div>;
                          }

                          return (
                            <select 
                              required 
                              value={enclosure} 
                              onChange={(e) => setEnclosure(e.target.value)} 
                              style={styles.input}
                            >
                              <option value="" disabled>-- Choose Enclosure --</option>
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
                        <input 
                          required 
                          disabled={minting}
                          value={cnic} 
                          onChange={(e) => setCnic(e.target.value)} 
                          style={styles.input} 
                          placeholder="XXXXX-XXXXXXX-X" 
                        />
                        <p style={styles.privacyNote}>* Your CNIC is securely hashed locally. Raw ID is never published.</p>
                      </div>

                      {error && <div style={styles.error}>{error}</div>}
                      {success && <div style={styles.success}>{success}</div>}

                      <button type="submit" disabled={minting} style={{...styles.btn, opacity: minting ? 0.5 : 1}}>
                        {minting ? '// MINTING_TO_CHAIN...' : 'SECURE_TICKET →'}
                      </button>
                      <button type="button" onClick={handleCancelSelection} disabled={minting} style={styles.cancelBtn}>
                        CANCEL
                      </button>
                    </form>
                  </div>
                ) : (
                  <div style={styles.emptySidebar}>
                    <div style={{ fontSize: '32px', marginBottom: '16px' }}>🏟️</div>
                    <p>Select a match from the marketplace to securely mint your NFT ticket.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      <style>{`
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: var(--surface); }
        ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 4px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

const styles = {
  container: { background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' },
  main: { padding: '48px', maxWidth: '1400px', margin: '0 auto' },
  header: { marginBottom: '40px' },
  secTag: { fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--g)', letterSpacing: '3px', marginBottom: '12px' },
  title: { fontFamily: 'var(--display)', fontSize: '48px', letterSpacing: '2px' },
  tip: { fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--muted)', marginTop: '8px', lineHeight: 1.5, maxWidth: '600px' },
  loading: { padding: '100px 0', textAlign: 'center' },
  spinner: { width: '40px', height: '40px', border: '3px solid var(--border)', borderTop: '3px solid var(--g)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' },
  errorBox: { padding: '24px', border: '1px solid #FF003C', background: 'rgba(255,0,60,0.05)', color: '#FF003C', fontFamily: 'var(--mono)', fontSize: '13px' },
  emptyBox: { padding: '60px', textAlign: 'center', border: '1px dashed var(--border2)', color: 'var(--muted)', fontFamily: 'var(--mono)' },
  
  layout: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 440px', gap: '32px', alignItems: 'start' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
  
  card: { padding: '24px', background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  matchId: { fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '1px' },
  statusLive: { fontFamily: 'var(--mono)', fontSize: '9px', padding: '4px 8px', background: 'rgba(0,255,106,0.1)', color: 'var(--g)', letterSpacing: '1px' },
  teams: { fontFamily: 'var(--display)', fontSize: '28px', color: 'var(--text)', marginBottom: '8px', lineHeight: 1.1 },
  stadium: { fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)' },
  progressBox: { marginTop: '32px' },
  progressMeta: { display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', marginBottom: '8px', letterSpacing: '1px' },
  progressBar: { height: '2px', background: 'var(--border2)', width: '100%' },
  progressFill: { height: '100%', background: 'var(--g)', transition: 'width 0.3s ease' },

  sidebar: { position: 'sticky', top: '100px', border: '1px solid var(--border)', background: 'var(--surface)', padding: '32px' },
  emptySidebar: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--muted)', lineHeight: 1.6 },
  
  purchaseFormWrapper: { display: 'flex', flexDirection: 'column' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text)', letterSpacing: '1px' },
  input: { background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '14px', padding: '12px', width: '100%', boxSizing: 'border-box' },
  privacyNote: { fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--muted)', marginTop: '4px' },
  btn: { background: 'var(--g)', color: 'var(--bg)', border: 'none', padding: '16px', fontFamily: 'var(--mono)', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '1px', marginTop: '16px' },
  cancelBtn: { background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border2)', padding: '12px', fontFamily: 'var(--mono)', fontSize: '12px', cursor: 'pointer', letterSpacing: '1px' },
  error: { color: 'red', fontFamily: 'var(--mono)', fontSize: '11px', border: '1px dotted red', padding: '10px' },
  success: { color: 'var(--g)', fontFamily: 'var(--mono)', fontSize: '11px', border: '1px dotted var(--g)', padding: '10px' }
};
