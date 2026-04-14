import { useEffect, useRef, useState } from 'react';
import { useWeb3 } from '../utils/Web3Context';
import { ethers } from 'ethers';

function makeQRPattern(seed) {
  const cells = [];
  let s = seed;
  for (let i = 0; i < 49; i++) {
    s = (s * 1664525 + 1013904223) >>> 0;
    cells.push((s >>> 28) > 5);
  }
  return cells;
}

function QRCode({ id, match, enclosure }) {
  const { account, contract } = useWeb3();
  const [cells, setCells] = useState(() => makeQRPattern(Date.now() + id * 9999));
  const [timer, setTimer] = useState(id === 1 ? 30 : 18);
  const [signed, setSigned] = useState(false);

  async function handleSign() {
    if (!window.ethereum || !account) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const message = `VERIFY_TICKET_${id}_TIMESTAMP_${Date.now()}`;
      const signature = await signer.signMessage(message);
      // Use signature to re-seed the QR
      const sigHash = ethers.keccak256(ethers.toUtf8Bytes(signature));
      setCells(makeQRPattern(parseInt(sigHash.slice(0, 10), 16)));
      setSigned(true);
      setTimer(30);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          // If signed, we'd ideally require a re-sign or auto-rotate
          setCells(makeQRPattern(Date.now() + id * 9999));
          setSigned(false);
          return 30;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [id]);

  return (
    <div style={{...styles.ticket, borderColor: signed ? 'var(--g)' : 'var(--border2)'}}>
      <div style={styles.qrGrid}>
        {cells.map((on, i) => (
          <div
            key={i}
            style={{
              ...styles.qrCell,
              background: on ? 'var(--g)' : 'var(--surface)',
            }}
          />
        ))}
      </div>
      <div style={{ flex: 1 }}>
        <div style={styles.match}>{match}</div>
        <div style={styles.seat}>{enclosure}</div>
        <div style={styles.timerText}>
          {signed ? `SECURE_TOKEN: ACTIVE (${timer}s)` : 'TOKEN_EXPIRED (RE-SIGN)'}
        </div>
      </div>
      {account ? (
        <button onClick={handleSign} style={{...styles.validBadge, cursor: 'pointer', background: signed ? 'rgba(0,255,106,0.1)' : 'transparent'}}>
          {signed ? 'VERIFIED' : 'SIGN_TO_ENTRY'}
        </button>
      ) : (
        <div style={{...styles.validBadge, borderColor: 'var(--muted)', color: 'var(--muted)'}}>LOCKED</div>
      )}
    </div>
  );
}

function PriceCapDemo() {
  const { contract, account } = useWeb3();
  const [price, setPrice] = useState('');
  const [verdict, setVerdict] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const MAX = 2200; // Simplified for demo parity with the hardcoded PKR labels
  const pct = Math.min(((parseFloat(price) || 0) / MAX) * 100, 100);
  const over = parseFloat(price) > MAX;

  async function handleSubmit() {
    if (!contract || !price) return;
    setLoading(true);
    setVerdict(null);
    setErrorMsg('');

    try {
      // For the demo, we try to list Token ID 0 (the first KK vs LQ ticket minted)
      // The contract will check the price cap logic
      const priceInWei = ethers.parseEther((parseFloat(price) / 20000).toString()); // Mocking exchange rate to ETH
      
      const tx = await contract.listTicket(0, priceInWei);
      await tx.wait();
      setVerdict('approve');
    } catch (err) {
      console.error(err);
      setVerdict('reject');
      // Extract revert reason
      if (err.message.includes("Price exceeds 110% cap")) {
        setErrorMsg("ANTI-SCALP RULE VIOLATION: Price exceeds 110% of original mint value.");
      } else {
        setErrorMsg(err.reason || "Transaction failed at smart contract level.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.demoCard}>
      <div style={styles.demoLabel}>
        PRICE_CAP_TEST — Original: PKR 2,000 · Max Allowed: PKR 2,200
      </div>
      <div style={styles.inputRow}>
        <input
          type="number"
          placeholder="Enter resale price (PKR)"
          value={price}
          onChange={(e) => { setPrice(e.target.value); setVerdict(null); }}
          style={styles.input}
        />
        <button 
          onClick={handleSubmit} 
          style={{...styles.submitBtn, borderColor: loading ? 'var(--dim)' : 'var(--border2)'}}
          disabled={loading}
        >
          {loading ? 'WAITING_FOR_MINING...' : 'SUBMIT_TXN →'}
        </button>
      </div>
      <div style={styles.capLabel}>CAP UTILIZATION</div>
      <div style={styles.barWrap}>
        <div style={{ ...styles.barFill, width: `${pct}%`, background: over ? 'var(--danger)' : 'var(--g)' }} />
      </div>
      <div style={styles.barEnds}>
        <span>PKR 0</span>
        <span>MAX: PKR 2,200</span>
      </div>
      {verdict && (
        <div style={{
          ...styles.verdict,
          borderColor: verdict === 'approve' ? 'var(--g)' : 'var(--danger)',
          background: verdict === 'approve' ? 'rgba(0,255,106,0.04)' : 'rgba(255,59,59,0.04)',
          color: verdict === 'approve' ? 'var(--g)' : '#ff6666',
        }}>
          {verdict === 'reject'
            ? `> TRANSACTION REJECTED\n> Reason: ${errorMsg || 'Price cap exceeded'}\n> Smart contract logic: Code is the Law.`
            : `> TRANSACTION APPROVED\n> Listing successfully recorded on the blockchain.\n> Verified safe for the secondary market.`
          }
        </div>
      )}
    </div>
  );
}

export default function DemoSection() {
  return (
    <section style={styles.section}>
      <div style={styles.sectionHead}>
        <div style={styles.secNum}>V4</div>
        <div>
          <div style={styles.secTag}>// LIVE_DEMO</div>
          <div style={styles.secTitle}>CONTRACT_INTERACTION</div>
        </div>
      </div>
      <div style={styles.grid}>
        <PriceCapDemo />
        <div style={styles.demoCard}>
          <div style={styles.demoLabel}>
            DYNAMIC_QR_DEMO — Live refreshing every 30 seconds
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <QRCode id={1} match="KK vs LQ — 18 APR 2026" enclosure="UPPER_TIER_A" />
            <QRCode id={2} match="PZ vs QG — 21 APR 2026" enclosure="LOWER_TIER_B" />
          </div>
        </div>
      </div>
    </section>
  );
}

const styles = {
  section: { padding: '80px 48px', borderBottom: '1px solid var(--border)' },
  sectionHead: { display: 'flex', alignItems: 'baseline', gap: '20px', marginBottom: '48px' },
  secNum: { fontFamily: 'var(--display)', fontSize: '72px', color: 'var(--border2)', lineHeight: 1 },
  secTag: { fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--muted)', letterSpacing: '2px', marginBottom: '6px' },
  secTitle: { fontFamily: 'var(--display)', fontSize: '36px', color: 'var(--text)', letterSpacing: '2px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' },
  demoCard: { background: 'var(--surface)', border: '1px solid var(--border)', padding: '32px' },
  demoLabel: { fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '2px', marginBottom: '20px' },
  inputRow: { display: 'flex', gap: '10px', marginBottom: '16px' },
  input: {
    flex: 1, background: 'var(--bg)', border: '1px solid var(--border2)',
    color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '13px',
    padding: '12px 16px', outline: 'none', letterSpacing: '1px',
  },
  submitBtn: {
    fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '1.5px',
    padding: '12px 20px', background: 'transparent', border: '1px solid var(--border2)',
    color: 'var(--muted)', cursor: 'pointer', whiteSpace: 'nowrap',
    transition: 'all 0.2s',
  },
  capLabel: { fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--dim)', marginBottom: '12px', letterSpacing: '1px' },
  barWrap: { height: '3px', background: 'var(--border2)', marginBottom: '6px', overflow: 'hidden' },
  barFill: { height: '100%', transition: 'width 0.35s ease, background 0.3s' },
  barEnds: { display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)' },
  verdict: {
    marginTop: '16px', padding: '14px 16px', fontFamily: 'var(--mono)',
    fontSize: '11px', letterSpacing: '1px', borderLeft: '2px solid',
    whiteSpace: 'pre-line', lineHeight: 1.8,
  },
  ticket: {
    background: 'var(--bg)', border: '1px solid var(--border2)',
    padding: '20px', display: 'flex', gap: '16px', alignItems: 'center',
  },
  qrGrid: {
    width: '72px', height: '72px', flexShrink: 0,
    border: '1px solid var(--border2)', background: 'var(--surface)',
    display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '1.5px', padding: '6px',
  },
  qrCell: { borderRadius: '1px' },
  match: { fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--text)', letterSpacing: '1px', marginBottom: '4px' },
  seat: { fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)', marginBottom: '8px' },
  timerText: { fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--g)', letterSpacing: '1px' },
  validBadge: {
    fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '1px',
    padding: '4px 10px', border: '1px solid var(--g)', color: 'var(--g)', alignSelf: 'flex-start',
  },
};
