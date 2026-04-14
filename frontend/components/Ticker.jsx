import { useWeb3, WEB3_UI_STATES } from '../utils/Web3Context';

export default function Ticker() {
  const { walletAddress, chainId, currentState, expectedChainId } = useWeb3();

  const isActive =
    currentState === WEB3_UI_STATES.CORRECT_NETWORK ||
    currentState === WEB3_UI_STATES.TX_PENDING ||
    currentState === WEB3_UI_STATES.TX_SUCCESS;

  const items = [
    { icon: '[N]', label: 'NETWORK', value: 'WIREFLUID', tone: 'accent' },
    { icon: '[C]', label: 'CHAIN', value: chainId ? String(chainId) : `N/A / ${expectedChainId}`, tone: 'default' },
    { icon: '[W]', label: 'WALLET', value: walletAddress ? 'CONNECTED' : 'DISCONNECTED', tone: walletAddress ? 'accent' : 'muted' },
    { icon: '[S]', label: 'STATUS', value: isActive ? 'ACTIVE' : 'BLOCKED', tone: isActive ? 'accent' : 'danger' },
  ];

  const TickerItems = () => (
    <div style={styles.seg}>
      {items.map((item, i) => (
        <span key={i} style={styles.item}>
          <span style={styles.icon}>{item.icon}</span>
          <span style={styles.label}>{item.label}:</span>{' '}
          <b
            style={{
              ...styles.value,
              ...(item.tone === 'accent' ? styles.valueAccent : {}),
              ...(item.tone === 'danger' ? styles.valueDanger : {}),
              ...(item.tone === 'muted' ? styles.valueMuted : {}),
            }}
          >
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
    padding: '9px 0',
    overflow: 'hidden',
  },
  track: {
    display: 'flex',
    animation: 'tick 34s linear infinite',
    whiteSpace: 'nowrap',
  },
  seg: {
    display: 'flex',
    flexShrink: 0,
  },
  item: {
    fontFamily: 'var(--mono)',
    fontSize: '10px',
    letterSpacing: '0.4px',
    color: 'var(--muted)',
    padding: '0 28px',
    borderRight: '1px solid var(--border)',
    whiteSpace: 'nowrap',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  },
  icon: {
    color: 'var(--dim)',
    fontSize: '9px',
    letterSpacing: '0',
  },
  label: {
    color: 'var(--muted)',
  },
  value: {
    fontWeight: 600,
    color: 'var(--text)',
  },
  valueAccent: {
    color: 'var(--g)',
  },
  valueDanger: {
    color: '#ff8e8e',
  },
  valueMuted: {
    color: 'var(--muted)',
  },
};
