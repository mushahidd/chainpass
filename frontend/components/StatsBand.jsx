import { useEffect, useRef, useState } from 'react';

function useCountUp(target, duration = 1800, prefix = '', startDelay = 500) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      let start = 0;
      const step = target / (duration / 16);
      const interval = setInterval(() => {
        start = Math.min(start + step, target);
        setValue(Math.round(start));
        if (start >= target) clearInterval(interval);
      }, 16);
      return () => clearInterval(interval);
    }, startDelay);
    return () => clearTimeout(timer);
  }, [target, duration, startDelay]);

  return prefix + value.toLocaleString();
}

function StatBlock({ idx, value, label, pill, pillGold, gold, delay }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="stat-block"
      style={{
        ...styles.block,
        ...(hovered ? styles.blockHover : {}),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={styles.idx}>{idx}</div>
      <div style={{ ...styles.num, color: gold ? 'var(--gold)' : 'var(--g)' }}>{value}</div>
      <div style={styles.label}>{label}</div>
      <span style={{ ...styles.pill, ...(pillGold ? styles.pillGold : {}) }}>{pill}</span>
      <div
        style={{
          ...styles.underline,
          transform: hovered ? 'scaleX(1)' : 'scaleX(0)',
        }}
      />
    </div>
  );
}

export default function StatsBand() {
  const minted = useCountUp(10240, 1800, '', 500);
  const blocked = useCountUp(342, 1200, '', 600);
  const saved = useCountUp(8550000, 2000, 'PKR ', 700);

  return (
    <div className="stats-band" style={styles.band}>
      <StatBlock idx="STATS_01 //" value={minted} label="TICKETS_MINTED" pill="STATUS: VERIFIED" />
      <StatBlock idx="STATS_02 //" value="0" label="FAKE_TICKETS" pill="STATUS: CLEAN" gold pillGold />
      <StatBlock idx="STATS_03 //" value={blocked} label="SCALP_TXN_BLOCKED" pill="CONTRACT: ENFORCED" />
      <StatBlock idx="STATS_04 //" value={saved} label="SAVED_FROM_SCALPERS" pill="IMPACT: LIVE" gold pillGold />

      <style>{`
        @media (max-width: 860px) {
          .stats-band { grid-template-columns: repeat(2, 1fr) !important; }
          .stat-block { border-bottom: 1px solid var(--border) !important; padding: 24px 20px !important; }
          .stat-block:nth-child(2), .stat-block:nth-child(4) { border-right: none !important; }
          .stat-block:nth-child(3), .stat-block:nth-child(4) { border-bottom: none !important; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  band: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    borderBottom: '1px solid var(--border)',
    // Responsive via className .stats-band applied below
  },
  block: {
    padding: 'clamp(20px, 4vw, 36px) clamp(16px, 3vw, 40px)',
    borderRight: '1px solid var(--border)',
    position: 'relative',
    overflow: 'hidden',
    transition: 'background 0.3s',
    cursor: 'default',
  },
  blockHover: {
    background: 'var(--surface)',
  },
  idx: {
    fontFamily: 'var(--mono)',
    fontSize: '11px',
    color: 'var(--dim)',
    letterSpacing: '2px',
    marginBottom: '14px',
  },
  num: {
    fontFamily: 'var(--display)',
    fontSize: 'clamp(28px, 4vw, 44px)',
    letterSpacing: '1px',
    lineHeight: 1,
  },
  label: {
    fontFamily: 'var(--mono)',
    fontSize: '11px',
    color: 'var(--muted)',
    letterSpacing: '1.5px',
    marginTop: '8px',
  },
  pill: {
    display: 'inline-block',
    fontFamily: 'var(--mono)',
    fontSize: '10px',
    color: 'var(--g)',
    border: '1px solid var(--border2)',
    padding: '3px 8px',
    marginTop: '10px',
    letterSpacing: '1px',
  },
  pillGold: {
    color: 'var(--gold)',
    borderColor: 'var(--gold2)',
  },
  underline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '2px',
    background: 'var(--g)',
    transformOrigin: 'left',
    transition: 'transform 0.5s ease',
  },
};
