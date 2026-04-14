import { useWeb3, WEB3_UI_STATES } from '../utils/Web3Context';

function statusLabel(currentState) {
  if (currentState === WEB3_UI_STATES.TX_PENDING) return 'PROCESSING';
  if (currentState === WEB3_UI_STATES.CORRECT_NETWORK || currentState === WEB3_UI_STATES.TX_SUCCESS) return 'READY';
  return 'BLOCKED';
}

export default function NetworkStatusBar() {
  const { walletAddress, chainId, currentState, expectedChainId } = useWeb3();
  const status = statusLabel(currentState);

  return (
    <div style={styles.wrap}>
      <div style={styles.row}>
        <span style={styles.label}>NETWORK:</span>
        <span style={styles.valueGold}>WIREFLUID</span>
      </div>
      <div style={styles.row}>
        <span style={styles.label}>CHAIN ID:</span>
        <span style={styles.value}>{chainId || 'N/A'} / {expectedChainId}</span>
      </div>
      <div style={styles.row}>
        <span style={styles.label}>WALLET:</span>
        <span style={walletAddress ? styles.valueGreen : styles.valueDanger}>
          {walletAddress ? 'CONNECTED' : 'DISCONNECTED'}
        </span>
      </div>
      <div style={styles.row}>
        <span style={styles.label}>STATUS:</span>
        <span style={status === 'READY' ? styles.valueGreen : status === 'PROCESSING' ? styles.valueGold : styles.valueDanger}>
          {status}
        </span>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    position: 'sticky',
    top: 0,
    zIndex: 300,
    background: 'linear-gradient(90deg, rgba(3, 8, 8, 0.96) 0%, rgba(16, 13, 5, 0.96) 100%)',
    borderBottom: '1px solid rgba(0,255,106,0.35)',
    borderTop: '1px solid rgba(232,184,75,0.35)',
    display: 'flex',
    gap: '16px',
    overflowX: 'auto',
    whiteSpace: 'nowrap',
    padding: '10px 18px',
    fontFamily: 'var(--mono)',
    fontSize: '10px',
    letterSpacing: '1.2px',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    minWidth: 0,
  },
  label: {
    color: 'var(--muted)',
    whiteSpace: 'nowrap',
  },
  value: {
    color: 'var(--text)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  valueGreen: {
    color: 'var(--g)',
    textShadow: '0 0 12px rgba(0,255,106,0.45)',
    whiteSpace: 'nowrap',
  },
  valueGold: {
    color: 'var(--gold)',
    textShadow: '0 0 10px rgba(232,184,75,0.4)',
    whiteSpace: 'nowrap',
  },
  valueDanger: {
    color: '#ff7272',
    whiteSpace: 'nowrap',
  },
};
