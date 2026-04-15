import { useState, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import StadiumMap from '../components/StadiumMap';
import { useWeb3 } from '../utils/Web3Context';
import { useToast } from '../utils/ToastContext';
import { ethers } from 'ethers';
import { PSL_TEAMS, PSL_STADIUMS, STADIUM_ENCLOSURES } from '../utils/stadiumData';

const MATCH_CATEGORIES = ['Group Match', 'Qualifier', 'Eliminator 1', 'Eliminator 2', 'Final'];

const CATEGORY_COLORS = {
  'General': '#8eb79b',
  'First-Class': '#5ec4e8',
  'Premium': '#e8b84b',
  'VIP': '#ff6b6b',
  'VIP Ground Floor': '#ff4ecf',
  'VVIP': '#c084fc',
};

export default function AdminDashboard() {
  const { contract, account, web3Error, chainId, expectedChainId } = useWeb3();
  const { addToast } = useToast();
  const [isOwner, setIsOwner] = useState(false);
  const [ownerAddress, setOwnerAddress] = useState('');
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    category: 'Group Match',
    matchTime: '',
    teamA: '',
    teamB: '',
    stadium: '',
    enclosures: []
  });

  const teamBOptions = PSL_TEAMS.filter((t) => t !== form.teamA);

  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const checkOwner = async () => {
      setLoading(true);
      if (!account) { setIsOwner(false); setOwnerAddress(''); setLoading(false); return; }
      if (web3Error || !contract) { setIsOwner(false); setOwnerAddress(''); setLoading(false); return; }
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

  const handleStadiumChange = (stadiumName) => {
    const presets = (STADIUM_ENCLOSURES[stadiumName] || []).map((e) => ({ ...e }));
    setForm((prev) => ({ ...prev, stadium: stadiumName, enclosures: presets }));
  };

  const handleEnclosureChange = (index, field, value) => {
    setForm((prev) => {
      const next = [...prev.enclosures];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, enclosures: next };
    });
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
    if (!form.teamA || !form.teamB) return addToast('Select both teams!', 'error');
    if (form.teamA === form.teamB) return addToast('Cannot select the same team twice!', 'error');
    if (!form.stadium) return addToast('Fill all required fields!', 'error');
    if (!form.matchTime) return addToast('Select match date and time!', 'error');
    
    const teamsPlaying = `${form.teamA} vs ${form.teamB}`;
    if (!form.enclosures.length) return addToast('Add at least one enclosure.', 'error');
    if (!contract) return addToast('Contract is unavailable on the active wallet network.', 'error');
    if (!isOwner) return addToast('Only the contract owner can initialize matches.', 'error');

    setCreating(true);
    try {
      const sanitizedEnclosures = form.enclosures.map((enc) => ({
        name: enc.name.trim(),
        price: enc.price,
        capacity: enc.capacity
      }));

      if (sanitizedEnclosures.some((enc) => !enc.name)) throw new Error('Each enclosure must have a non-empty name.');
      if (sanitizedEnclosures.some((enc) => Number(enc.price) <= 0)) throw new Error('Each enclosure must have a price greater than zero.');
      if (sanitizedEnclosures.some((enc) => !/^[1-9]\d*$/.test(String(enc.capacity)))) throw new Error('Each enclosure capacity must be a positive whole number.');

      const lowered = sanitizedEnclosures.map((enc) => enc.name.toLowerCase());
      if (new Set(lowered).size !== lowered.length) throw new Error('Duplicate enclosure names are not allowed.');

      const enclosureNames = sanitizedEnclosures.map((enc) => enc.name);
      const enclosurePrices = sanitizedEnclosures.map((enc) => ethers.parseEther(enc.price.toString()));
      const enclosureCapacities = sanitizedEnclosures.map((enc) => BigInt(enc.capacity));

      const unixTime = Math.floor(new Date(form.matchTime).getTime() / 1000);

      const tx = await contract.createMatch(form.category, teamsPlaying, form.stadium, unixTime, enclosureNames, enclosurePrices, enclosureCapacities);
      await tx.wait();

      addToast(`SUCCESS: Active Match Initialized For: ${teamsPlaying}`, 'success');
      setForm({ category: 'Group Match', matchTime: '', teamA: '', teamB: '', stadium: '', enclosures: [] });
    } catch (err) {
      console.error("Match Admin failed:", err);
      addToast(err?.message || "FAILED to initialize match. Check console.", 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Head>
        <title>Admin Command | ChainPass PSL</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
              <p style={styles.emptyText}>CONNECT WALLET TO ACCESS COMMAND CENTER.</p>
            </div>
          ) : web3Error ? (
            <div style={{ ...styles.empty, borderColor: 'var(--danger)' }}>
              <div style={{ ...styles.emptyHex, color: 'var(--danger)', borderColor: 'var(--danger)', background: 'rgba(255,59,59,0.1)' }}>✕</div>
              <p style={{ color: 'var(--danger)', fontFamily: 'var(--mono)', fontSize: '13px', marginBottom: '12px' }}>ACCESS BLOCKED: CONTRACT NOT REACHABLE</p>
              <p style={styles.diagnostic}>{web3Error}</p>
              <p style={styles.diagnostic}>CONNECTED_CHAIN: {chainId ?? 'unknown'} | EXPECTED_CHAIN: {expectedChainId}</p>
            </div>
          ) : !isOwner ? (
            <div style={{ ...styles.empty, borderColor: 'var(--danger)' }}>
              <div style={{ ...styles.emptyHex, color: 'var(--danger)', borderColor: 'var(--danger)', background: 'rgba(255,59,59,0.1)' }}>✕</div>
              <p style={{ color: 'var(--danger)', fontFamily: 'var(--mono)', fontSize: '13px', marginBottom: '12px' }}>ACCESS DENIED: NOT CONTRACT OWNER</p>
              <p style={styles.diagnostic}>CONNECTED_WALLET: {account}</p>
              {ownerAddress && <p style={styles.diagnostic}>CONTRACT_OWNER: {ownerAddress}</p>}
            </div>
          ) : (
            <div className="admin-grid" style={styles.adminGrid}>
              {/* Match Form */}
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <h2 style={styles.cardTitle}>INITIALIZE_NEW_MATCH</h2>
                </div>
                <form onSubmit={handleCreate} style={styles.form}>
                  <div style={{ display: 'flex', gap: '16px', flexDirection: 'row', flexWrap: 'wrap' }}>
                    <div style={{ ...styles.inputGroup, flex: 1, minWidth: '160px' }}>
                      <label style={styles.label}>MATCH_CATEGORY</label>
                      <select required name="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={styles.select}>
                        {MATCH_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div style={{ ...styles.inputGroup, flex: 1, minWidth: '160px' }}>
                      <label style={styles.label}>START_TIME (PKT)</label>
                      <input required type="datetime-local" value={form.matchTime} onChange={(e) => setForm({ ...form, matchTime: e.target.value })} style={styles.input} />
                    </div>
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>TEAMS_PLAYING</label>
                    <div style={styles.teamSelectRow}>
                      <div style={styles.teamSelectWrap}>
                        <label style={styles.teamSubLabel}>TEAM A</label>
                        <select
                          required
                          value={form.teamA}
                          onChange={(e) => setForm({ ...form, teamA: e.target.value, teamB: e.target.value === form.teamB ? '' : form.teamB })}
                          style={styles.select}
                        >
                          <option value="" disabled>Select team...</option>
                          {PSL_TEAMS.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div style={styles.vsLabel}>VS</div>
                      <div style={styles.teamSelectWrap}>
                        <label style={styles.teamSubLabel}>TEAM B</label>
                        <select
                          required
                          value={form.teamB}
                          onChange={(e) => setForm({ ...form, teamB: e.target.value })}
                          style={styles.select}
                          disabled={!form.teamA}
                        >
                          <option value="" disabled>Select team...</option>
                          {teamBOptions.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>STADIUM_VENUE</label>
                    <select
                      required
                      value={form.stadium}
                      onChange={(e) => handleStadiumChange(e.target.value)}
                      style={styles.select}
                    >
                      <option value="" disabled>Select stadium...</option>
                      {PSL_STADIUMS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.enclosurePanel}>
                    <div style={styles.enclosureHeaderRow}>
                      <label style={styles.label}>ENCLOSURE_CONFIGURATION</label>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--dim)' }}>
                        {form.enclosures.length} ACTIVE
                      </span>
                    </div>

                    {!form.stadium && (
                      <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)', padding: '20px 0', textAlign: 'center' }}>
                        SELECT A STADIUM TO LOAD ENCLOSURES
                      </div>
                    )}

                    {form.enclosures.length > 0 && (
                      <div className="enclosure-row" style={{ ...styles.enclosureRow, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '4px' }}>
                        <div style={{ flex: 2, minWidth: '100px' }}>
                          <span style={styles.colHeader}>ENCLOSURE</span>
                        </div>
                        <div style={{ flex: 1, minWidth: '70px' }}>
                          <span style={styles.colHeader}>PRICE (WIRE)</span>
                        </div>
                        <div style={{ flex: 1, minWidth: '70px' }}>
                          <span style={styles.colHeader}>CAPACITY</span>
                        </div>
                        <div style={{ width: '36px', flexShrink: 0 }} />
                      </div>
                    )}

                    {form.enclosures.map((enc, idx) => (
                      <div key={enc.name} className="enclosure-row" style={styles.enclosureRow}>
                        <div style={{ flex: 2, minWidth: '100px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--text)' }}>{enc.name}</div>
                            <div className="enc-info-wrap" style={{ position: 'relative', display: 'inline-flex' }}>
                              <div className="enc-info-dot" style={{
                                width: '18px', height: '18px', borderRadius: '50%',
                                border: `1px solid ${CATEGORY_COLORS[enc.category] || 'var(--g)'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontFamily: 'var(--mono)', fontSize: '10px', cursor: 'help',
                                color: CATEGORY_COLORS[enc.category] || 'var(--g)',
                                background: 'rgba(255,255,255,0.03)', flexShrink: 0,
                                transition: 'all 0.2s',
                              }}>i</div>
                              <div className="enc-tooltip" style={{
                                position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
                                transform: 'translateX(-50%)', minWidth: '180px', padding: '10px 14px',
                                background: '#0c1812', border: '1px solid var(--border2)',
                                borderRadius: '4px', zIndex: 50, pointerEvents: 'none',
                                opacity: 0, transition: 'opacity 0.2s',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                              }}>
                                <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text)', marginBottom: '6px', fontWeight: 700 }}>{enc.name}</div>
                                <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: CATEGORY_COLORS[enc.category] || 'var(--g)', marginBottom: '4px', letterSpacing: '1px' }}>{enc.category}</div>
                                <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)' }}>DEFAULT: {enc.price} WIRE · {Number(enc.capacity).toLocaleString()} SEATS</div>
                              </div>
                            </div>
                          </div>
                          <span style={{ ...styles.categoryBadge, color: CATEGORY_COLORS[enc.category] || 'var(--g)', borderColor: CATEGORY_COLORS[enc.category] || 'var(--g)' }}>
                            {enc.category}
                          </span>
                        </div>
                        <input
                          required
                          type="number"
                          min="0"
                          step="0.01"
                          value={enc.price}
                          onChange={(e) => handleEnclosureChange(idx, 'price', e.target.value)}
                          style={{ ...styles.input, ...styles.inlineInput, flex: 1, minWidth: '70px' }}
                          placeholder="PRICE"
                        />
                        <input
                          required
                          type="number"
                          min="1"
                          step="1"
                          value={enc.capacity}
                          onChange={(e) => handleEnclosureChange(idx, 'capacity', e.target.value)}
                          style={{ ...styles.input, ...styles.inlineInput, flex: 1, minWidth: '70px' }}
                          placeholder="CAP"
                        />
                        <button
                          type="button"
                          onClick={() => removeEnclosureRow(idx)}
                          style={styles.removeBtn}
                          disabled={form.enclosures.length <= 1}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  <button type="submit" disabled={creating} style={{ ...styles.btn, opacity: creating ? 0.5 : 1 }}>
                    {creating ? '// DEPLOYING_MATCH_TO_CHAIN...' : 'INITIALIZE_MATCH_EVENT →'}
                  </button>
                </form>
              </div>

              {/* Info sidebar */}
              <div style={styles.infoCol}>
                {form.stadium && (
                  <div style={styles.infoBox}>
                    <StadiumMap
                      allEnclosures={STADIUM_ENCLOSURES[form.stadium] || []}
                      activeEnclosures={form.enclosures}
                      stadiumName={form.stadium}
                    />
                  </div>
                )}
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
                <div style={styles.infoBox}>
                  <div style={styles.infoTag}>WALLET</div>
                  <div style={{ ...styles.infoDesc, wordBreak: 'break-all', color: 'var(--g)', fontFamily: 'var(--mono)', fontSize: '11px' }}>{account}</div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <div dangerouslySetInnerHTML={{ __html: `<style>
        input:focus, select:focus { border-color: var(--g) !important; outline: none; }
        select:disabled { opacity: 0.4; cursor: not-allowed; }
        select option { background: #0c1812; color: var(--text); font-family: Space Mono, monospace; padding: 8px; }
        button:hover:not(:disabled) { opacity: 0.85; }
        .enc-info-wrap:hover .enc-tooltip { opacity: 1 !important; }
        .enc-info-wrap:hover .enc-info-dot { background: rgba(255,255,255,0.08) !important; transform: scale(1.15); }
        @media (max-width: 900px) {
          .admin-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 540px) {
          .enclosure-row { flex-wrap: wrap !important; }
        }
      </style>` }} />
    </>
  );
}

const styles = {
  container: { background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' },
  main: {
    padding: 'clamp(32px, 6vw, 60px) clamp(16px, 5vw, 48px)',
    maxWidth: '1440px',
    margin: '0 auto',
  },
  header: { marginBottom: 'clamp(32px, 5vw, 60px)' },
  secTag: { fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--g)', letterSpacing: '3px', marginBottom: '12px' },
  title: {
    fontFamily: 'var(--display)',
    fontSize: 'clamp(32px, 6vw, 64px)',
    letterSpacing: '2px',
    marginBottom: '16px',
    lineHeight: 1.0,
  },
  desc: { fontFamily: 'var(--body)', fontSize: 'clamp(13px, 2vw, 16px)', color: 'var(--muted)', lineHeight: 1.6, maxWidth: '600px' },
  loading: { fontFamily: 'var(--mono)', fontSize: '14px', color: 'var(--muted)', textAlign: 'center', padding: 'clamp(40px, 10vw, 100px) 20px' },
  diagnostic: { fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)', marginTop: '8px', wordBreak: 'break-all' },
  empty: {
    textAlign: 'center',
    padding: 'clamp(40px, 10vw, 100px) 20px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '4px',
  },
  emptyHex: {
    width: '48px', height: '48px', background: 'var(--border2)', margin: '0 auto 20px',
    clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--mono)', color: 'var(--text)', fontSize: '16px',
  },
  emptyText: { fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--muted)', letterSpacing: '1px' },
  adminGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) min(340px, 100%)',
    gap: 'clamp(20px, 4vw, 32px)',
    alignItems: 'start',
  },
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    padding: 'clamp(20px, 4vw, 32px)',
    borderRadius: '4px',
  },
  cardHeader: { borderBottom: '1px solid var(--border2)', paddingBottom: '16px', marginBottom: '28px' },
  cardTitle: { fontFamily: 'var(--mono)', fontSize: 'clamp(13px, 2vw, 16px)', letterSpacing: '2px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--g)', letterSpacing: '1.5px' },
  input: {
    background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border2)',
    color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '13px', padding: '13px 14px',
    transition: 'border-color 0.2s', width: '100%', boxSizing: 'border-box', borderRadius: '2px',
  },
  teamSelectRow: {
    display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
  },
  teamSelectWrap: {
    flex: 1, minWidth: '140px', display: 'flex', flexDirection: 'column', gap: '6px',
  },
  teamSubLabel: {
    fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '1.5px',
  },
  select: {
    background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border2)',
    color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '13px', padding: '13px 14px',
    transition: 'border-color 0.2s', width: '100%', boxSizing: 'border-box', borderRadius: '2px',
    cursor: 'pointer', appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2300ff6a' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', backgroundSize: '12px',
  },
  vsLabel: {
    fontFamily: 'var(--display)', fontSize: '24px', color: 'var(--g)',
    letterSpacing: '2px', paddingTop: '18px', flexShrink: 0,
    textShadow: '0 0 12px rgba(0,255,106,0.4)',
  },
  enclosurePanel: { display: 'flex', flexDirection: 'column', gap: '10px', border: '1px solid var(--border)', padding: '16px', borderRadius: '2px' },
  enclosureHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' },
  enclosureRow: { className: 'enclosure-row', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' },
  inlineInput: { padding: '10px 8px' },
  ghostBtn: {
    border: '1px solid var(--g)', background: 'transparent', color: 'var(--g)',
    fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1px', padding: '8px 12px',
    cursor: 'pointer', borderRadius: '2px', whiteSpace: 'nowrap',
  },
  removeBtn: {
    border: '1px solid var(--border2)', background: 'transparent', color: 'var(--muted)',
    fontFamily: 'var(--mono)', fontSize: '12px', padding: '8px 10px', cursor: 'pointer',
    borderRadius: '2px', flexShrink: 0,
  },
  categoryBadge: {
    display: 'inline-block', fontFamily: 'var(--mono)', fontSize: '9px',
    letterSpacing: '1px', padding: '2px 8px', border: '1px solid',
    borderRadius: '2px', background: 'rgba(255,255,255,0.02)', width: 'fit-content',
  },
  colHeader: {
    fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)',
    letterSpacing: '1.5px', textTransform: 'uppercase',
  },
  btn: {
    background: 'var(--g)', color: 'var(--bg)', border: 'none', padding: '16px',
    fontFamily: 'var(--mono)', fontSize: 'clamp(11px, 2vw, 14px)', fontWeight: 'bold', cursor: 'pointer',
    letterSpacing: '1px', marginTop: '8px', transition: 'all 0.2s', borderRadius: '2px',
  },
  infoCol: { display: 'flex', flexDirection: 'column', gap: '16px' },
  infoBox: { background: 'var(--bg)', border: '1px solid var(--border)', padding: 'clamp(16px, 3vw, 24px)', borderRadius: '4px' },
  infoTag: { fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', marginBottom: '8px', letterSpacing: '1.5px' },
  infoVal: { fontFamily: 'var(--display)', fontSize: 'clamp(16px, 2.5vw, 20px)', color: 'var(--text)', marginBottom: '8px' },
  infoDesc: { fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)', lineHeight: 1.5 },
};
