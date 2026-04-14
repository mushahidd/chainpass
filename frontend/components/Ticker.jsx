export default function Ticker() {
  const items = [
    { label: 'CONTRACT', value: 'ACTIVE', gold: false },
    { label: 'BLOCK', value: '#48,291,774', gold: false },
    { label: 'MINTED', value: '10,240 NFTs', gold: false },
    { label: 'FAKE_TICKETS', value: '0', gold: true },
    { label: 'NETWORK', value: 'POLYGON', gold: false },
    { label: 'RESALE_CAP', value: '+10%', gold: true },
    { label: 'GAS', value: '0.001 MATIC', gold: false },
    { label: 'SEASON', value: 'PSL 2026', gold: false },
    { label: 'PCB_ROYALTY', value: '3%', gold: false },
    { label: 'BLOCKED_TXN', value: '342', gold: true },
  ];

  const TickerItems = () => (
    <div style={styles.seg}>
      {items.map((item, i) => (
        <span key={i} style={styles.item}>
          {item.label}:{' '}
          <b style={{ color: item.gold ? 'var(--gold)' : 'var(--g)', fontWeight: 400 }}>
            {item.value}
          </b>
        </span>
      ))}
    </div>
  );

  return (
    <div style={styles.ticker}>
      <div style={styles.track}>
        <TickerItems />
        <TickerItems />
      </div>
      <style>{`
        @keyframes tick {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  ticker: {
    background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    padding: '8px 0',
    overflow: 'hidden',
  },
  track: {
    display: 'flex',
    animation: 'tick 28s linear infinite',
    whiteSpace: 'nowrap',
  },
  seg: {
    display: 'flex',
    flexShrink: 0,
  },
  item: {
    fontFamily: 'var(--mono)',
    fontSize: '9px',
    letterSpacing: '1.5px',
    color: 'var(--dim)',
    padding: '0 24px',
    borderRight: '1px solid var(--border)',
    whiteSpace: 'nowrap',
  },
};
