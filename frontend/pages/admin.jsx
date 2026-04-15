import { useState, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import { useWeb3 } from '../utils/Web3Context';
import { useNotification } from '../utils/NotificationContext';
import { ethers } from 'ethers';

export default function AdminDashboard() {
  const { contract, account, web3Error, chainId, expectedChainId } = useWeb3();
  const { addNotification } = useNotification();
  const [isOwner, setIsOwner] = useState(false);
  const [ownerAddress, setOwnerAddress] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [form, setForm] = useState({
    teams: '',
    stadium: '',
    enclosures: [
      { name: 'General', price: '0.01', capacity: '30000' }
    ]
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

  const handleEnclosureChange = (index, field, value) => {
    setForm((prev) => {
      const next = [...prev.enclosures];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, enclosures: next };
    });
  };

  const addEnclosureRow = () => {
    setForm((prev) => ({
      ...prev,
      enclosures: [...prev.enclosures, { name: '', price: '0.01', capacity: '1000' }]
    }));
  };

  const removeEnclosureRow = (index) => {
    setForm((prev) => {
      if (prev.enclosures.length <= 1) return prev;
      const next = prev.enclosures.filter((_, i) => i !== index);
      return { ...prev, enclosures: next };
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.teams || !form.stadium) {
      addNotification('Fill all required fields!', 'error');
      return;
    }
    if (!form.enclosures.length) {
      addNotification('Add at least one enclosure.', 'error');
      return;
    }
    if (!contract) {
      addNotification('Contract is unavailable on the active wallet network.', 'error');
      return;
    }
    if (!isOwner) {
      addNotification('Only the contract owner can initialize matches.', 'error');
      return;
    }

    setCreating(true);
    try {
      const sanitizedEnclosures = form.enclosures.map((enc) => ({
        name: enc.name.trim(),
        price: enc.price,
        capacity: enc.capacity
      }));

      if (sanitizedEnclosures.some((enc) => !enc.name)) {
        throw new Error('Each enclosure must have a non-empty name.');
      }

      if (sanitizedEnclosures.some((enc) => Number(enc.price) <= 0)) {
        throw new Error('Each enclosure must have a price greater than zero.');
      }

      if (sanitizedEnclosures.some((enc) => !/^[1-9]\d*$/.test(String(enc.capacity)))) {
        throw new Error('Each enclosure capacity must be a positive whole number.');
      }

      const lowered = sanitizedEnclosures.map((enc) => enc.name.toLowerCase());
      if (new Set(lowered).size !== lowered.length) {
        throw new Error('Duplicate enclosure names are not allowed.');
      }

      const enclosureNames = sanitizedEnclosures.map((enc) => enc.name);
      const enclosurePrices = sanitizedEnclosures.map((enc) => ethers.parseEther(enc.price.toString()));
      const enclosureCapacities = sanitizedEnclosures.map((enc) => BigInt(enc.capacity));
      
      const tx = await contract.createMatch(
        form.teams, 
        form.stadium, 
        enclosureNames,
        enclosurePrices,
        enclosureCapacities
      );
      await tx.wait();
      
      addNotification(`SUCCESS: Active Match Initialized For: ${form.teams}`, 'success');
      setForm({
        teams: '',
        stadium: '',
        enclosures: [{ name: 'General', price: '0.01', capacity: '30000' }]
      });
    } catch (err) {
      console.error("Match Admin failed:", err);
      addNotification(err?.message || "FAILED to initialize match. Check console.", 'error');
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

                   <div style={styles.enclosurePanel}>
                     <div style={styles.enclosureHeaderRow}>
                       <label style={styles.label}>ENCLOSURE_CONFIGURATION</label>
                       <button type="button" onClick={addEnclosureRow} style={styles.ghostBtn}>+ ADD ENCLOSURE</button>
                     </div>

                     {form.enclosures.map((enc, idx) => (
                       <div key={idx} style={styles.enclosureRow}>
                         <input
                           required
                           value={enc.name}
                           onChange={(e) => handleEnclosureChange(idx, 'name', e.target.value)}
                           style={{ ...styles.input, ...styles.inlineInput, flex: 2 }}
                           placeholder="ENCLOSURE NAME"
                         />
                         <input
                           required
                           type="number"
                           min="0"
                           step="0.001"
                           value={enc.price}
                           onChange={(e) => handleEnclosureChange(idx, 'price', e.target.value)}
                           style={{ ...styles.input, ...styles.inlineInput, flex: 1 }}
                           placeholder="PRICE WIRE"
                         />
                         <input
                           required
                           type="number"
                           min="1"
                           step="1"
                           value={enc.capacity}
                           onChange={(e) => handleEnclosureChange(idx, 'capacity', e.target.value)}
                           style={{ ...styles.input, ...styles.inlineInput, flex: 1 }}
                           placeholder="CAPACITY"
                         />
                         <button
                           type="button"
                           onClick={() => removeEnclosureRow(idx)}
                           style={styles.removeBtn}
                           disabled={form.enclosures.length === 1}
                         >
                           REMOVE
                         </button>
                       </div>
                     ))}
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
                   <div style={styles.infoVal}>ENCLOSURE_MATRIX</div>
                   <div style={styles.infoDesc}>Define each enclosure's price and capacity per match. Fan minting options are derived strictly from this matrix.</div>
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
  desc: { fontFamily: 'var(--body)', fontSize: '16px', color: 'var(--text)', lineHeight: 1.6, maxWidth: '600px', opacity: 0.9 },
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
  enclosurePanel: { display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid var(--border)', padding: '16px' },
  enclosureHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' },
  enclosureRow: { display: 'flex', gap: '10px', alignItems: 'center' },
  inlineInput: { padding: '12px' },
  ghostBtn: {
    border: '1px solid var(--g)', background: 'transparent', color: 'var(--g)',
    fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1px', padding: '8px 12px', cursor: 'pointer'
  },
  removeBtn: {
    border: '1px solid var(--border2)', background: 'transparent', color: 'var(--muted)',
    fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1px', padding: '8px 10px', cursor: 'pointer',
    opacity: 0.9
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
