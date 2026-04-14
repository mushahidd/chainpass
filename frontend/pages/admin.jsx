import { useState, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import { useWeb3 } from '../utils/Web3Context';
import { ethers } from 'ethers';

export default function AdminDashboard() {
  const { contract, account, web3Error, chainId, expectedChainId } = useWeb3();
  const [isOwner, setIsOwner] = useState(false);
  const [ownerAddress, setOwnerAddress] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [form, setForm] = useState({
    teams: '',
    stadium: '',
    price: '0.01',
    maxCapacity: '50000'
  });
  
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const checkOwner = async () => {
      setLoading(true);

      if (!account) {
        setIsOwner(false);
        setOwnerAddress('');
        setLoading(false);
        return;
      }

      if (web3Error || !contract) {
        setIsOwner(false);
        setOwnerAddress('');
        setLoading(false);
        return;
      }

      try {
        const onChainOwner = await contract.owner();
        setOwnerAddress(onChainOwner);
        setIsOwner(onChainOwner.toLowerCase() === account.toLowerCase());
      } catch (err) {
        console.error("Failed to check owner:", err);
        setIsOwner(false);
        setOwnerAddress('');
      }

      setLoading(false);
    };

    checkOwner();
  }, [contract, account, web3Error]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.teams || !form.stadium) return alert('Fill all required fields!');
    if (!contract) return alert('Contract is unavailable on the active wallet network.');
    if (!isOwner) return alert('Only the contract owner can initialize matches.');

    setCreating(true);
    try {
      const priceWei = ethers.parseEther(form.price.toString());
      
      // Call createMatch from the smart contract!
      const tx = await contract.createMatch(
        form.teams, 
        form.stadium, 
        priceWei, 
        form.maxCapacity
      );
      await tx.wait();
      
      alert(`SUCCESS: Active Match Initialized For: ${form.teams}`);
      setForm({ teams: '', stadium: '', price: '0.01', maxCapacity: '50000' });
    } catch (err) {
      console.error("Match Admin failed:", err);
      alert("FAILED to initialize match. Check console.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Head>
        <title>Admin Command | ChainPass PSL</title>
      </Head>

      <div style={styles.container}>
        <Navbar />

        <main style={styles.main}>
          <header style={styles.header}>
            <div style={styles.secTag}>// ADMIN_SYS</div>
            <h1 style={styles.title}>MATCH_DEPLOYMENT_CENTER</h1>
            <p style={styles.desc}>
              Global overview and Match initialization pipeline. Spin up active stadium matches directly onto the blockchain for public fan minting.
            </p>
          </header>

          {loading ? (
            <div style={styles.loading}>// VERIFYING_AUTHORITY...</div>
          ) : !account ? (
            <div style={styles.empty}>
              <div style={styles.emptyHex}>!</div>
              <p>CONNECT WALLET TO ACCESS COMMAND CENTER.</p>
            </div>
          ) : web3Error ? (
            <div style={styles.empty}>
              <div style={{...styles.emptyHex, color: 'red', borderColor: 'red'}}>X</div>
              <p style={{color: 'red'}}>ACCESS BLOCKED: CONTRACT NOT REACHABLE</p>
              <p style={styles.diagnostic}>{web3Error}</p>
              <p style={styles.diagnostic}>CONNECTED_CHAIN: {chainId ?? 'unknown'} | EXPECTED_CHAIN: {expectedChainId}</p>
            </div>
          ) : !isOwner ? (
            <div style={styles.empty}>
              <div style={styles.emptyHex} style={{...styles.emptyHex, color: 'red', borderColor: 'red'}}>X</div>
              <p style={{color: 'red'}}>ACCESS DENIED: NOT CONTRACT OWNER</p>
              <p style={styles.diagnostic}>CONNECTED_WALLET: {account}</p>
              {ownerAddress && <p style={styles.diagnostic}>CONTRACT_OWNER: {ownerAddress}</p>}
            </div>
          ) : (
             <div style={styles.adminGrid}>
               {/* Match Form */}
               <div style={styles.card}>
                 <div style={styles.cardHeader}>
                   <h2 style={styles.cardTitle}>INITIALIZE_NEW_MATCH</h2>
                 </div>
                 <form onSubmit={handleCreate} style={styles.form}>
                   <div style={styles.inputGroup}>
                     <label style={styles.label}>TEAMS_PLAYING</label>
                     <input required autoFocus name="teams" value={form.teams} onChange={handleChange} style={styles.input} placeholder="e.g. Quetta Gladiators vs Peshawar Zalmi" />
                   </div>
                   
                   <div style={styles.inputGroup}>
                     <label style={styles.label}>STADIUM_VENUE</label>
                     <input required name="stadium" value={form.stadium} onChange={handleChange} style={styles.input} placeholder="e.g. Bugti Stadium, Quetta" />
                   </div>

                   <div style={{ display: 'flex', gap: '20px' }}>
                     <div style={{...styles.inputGroup, flex: 1}}>
                       <label style={styles.label}>TICKET_PRICE (ETH)</label>
                       <input required type="number" step="0.001" name="price" value={form.price} onChange={handleChange} style={styles.input} />
                     </div>
                     <div style={{...styles.inputGroup, flex: 1}}>
                       <label style={styles.label}>MAX_CAPACITY (SEATS)</label>
                       <input required type="number" name="maxCapacity" value={form.maxCapacity} onChange={handleChange} style={styles.input} />
                     </div>
                   </div>

                   <button type="submit" disabled={creating} style={{...styles.btn, opacity: creating ? 0.5 : 1}}>
                     {creating ? '// DEPLOYING_MATCH_TO_CHAIN...' : 'INITIALIZE_MATCH_EVENT →'}
                   </button>
                 </form>
               </div>

               {/* Quick Info */}
               <div style={styles.infoCol}>
                 <div style={styles.infoBox}>
                   <div style={styles.infoTag}>SYS_ROLE</div>
                   <div style={styles.infoVal}>CONTRACT_OWNER</div>
                   <div style={styles.infoDesc}>Verified Authority</div>
                 </div>
                 <div style={styles.infoBox}>
                   <div style={styles.infoTag}>ARCHITECTURE</div>
                   <div style={styles.infoVal}>EVENT_FACTORY</div>
                   <div style={styles.infoDesc}>Matches you create here will immediately appear on the Public Fan Minting interface.</div>
                 </div>
               </div>
             </div>
          )}
        </main>
      </div>

      <style>{`
        input:focus { border-color: var(--g) !important; outline: none; }
        button:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,255,106,0.1); }
      `}</style>
    </>
  );
}

const styles = {
  container: { background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' },
  main: { padding: '60px 48px', maxWidth: '1440px', margin: '0 auto' },
  header: { marginBottom: '60px' },
  secTag: { fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--g)', letterSpacing: '3px', marginBottom: '12px' },
  title: { fontFamily: 'var(--display)', fontSize: '64px', letterSpacing: '2px', marginBottom: '20px' },
  desc: { fontFamily: 'var(--body)', fontSize: '16px', color: 'var(--muted)', lineHeight: 1.6, maxWidth: '600px' },
  loading: { fontFamily: 'var(--mono)', fontSize: '14px', color: 'var(--muted)', textAlign: 'center', padding: '100px' },
  diagnostic: { fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)', marginTop: '12px', wordBreak: 'break-all' },
  empty: { textAlign: 'center', padding: '100px', background: 'var(--surface)', border: '1px solid var(--border)' },
  emptyHex: { 
    width: '40px', height: '40px', background: 'var(--border2)', margin: '0 auto 20px',
    clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--mono)', color: 'var(--text)'
  },
  adminGrid: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '32px' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', padding: '32px' },
  cardHeader: { borderBottom: '1px solid var(--border2)', paddingBottom: '20px', marginBottom: '32px' },
  cardTitle: { fontFamily: 'var(--mono)', fontSize: '16px', letterSpacing: '2px' },
  form: { display: 'flex', flexDirection: 'column', gap: '24px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--g)', letterSpacing: '1px' },
  input: {
    background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border2)',
    color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '14px', padding: '16px',
    transition: 'border-color 0.2s', width: '100%', boxSizing: 'border-box'
  },
  btn: {
    background: 'var(--g)', color: 'var(--bg)', border: 'none', padding: '20px',
    fontFamily: 'var(--mono)', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer',
    letterSpacing: '1px', marginTop: '12px', transition: 'all 0.2s',
  },
  infoCol: { display: 'flex', flexDirection: 'column', gap: '24px' },
  infoBox: { background: 'var(--bg)', border: '1px solid var(--border)', padding: '24px' },
  infoTag: { fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', marginBottom: '8px' },
  infoVal: { fontFamily: 'var(--display)', fontSize: '20px', color: 'var(--text)', marginBottom: '8px' },
  infoDesc: { fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)', lineHeight: 1.5 },
};
