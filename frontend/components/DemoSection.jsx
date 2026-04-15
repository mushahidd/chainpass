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
  // IMPORTANT: initial render must be deterministic to avoid Next.js hydration mismatch.
  // We re-seed with real time only after mount (see interval effect below).
  const [cells, setCells] = useState(() => makeQRPattern(id * 9999));
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

export default function DemoSection() {
  return (
    <section className="demo-section" style={styles.section}>
      <div className="demo-head" style={styles.sectionHead}>
        <div style={styles.secNum}>V4</div>
        <div>
          <div style={styles.secTag}>// LIVE_DEMO</div>
          <div style={styles.secTitle}>CONTRACT_INTERACTION</div>
        </div>
      </div>
      <div className="demo-grid" style={styles.grid}>
        <div style={styles.demoCard}>
          <div style={styles.demoLabel}>
            DYNAMIC_QR_DEMO — Live refreshing every 60 seconds
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
  grid: { display: 'grid', gridTemplateColumns: '1fr', gap: '40px' },
  demoCard: { background: 'var(--surface)', border: '1px solid var(--border)', padding: '32px' },
  demoLabel: { fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '2px', marginBottom: '20px' },
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
