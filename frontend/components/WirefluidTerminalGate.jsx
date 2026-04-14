import { useMemo } from 'react';
import { useWeb3 } from '../utils/Web3Context';

export default function WirefluidTerminalGate() {
  const { chainId, expectedChainId, switchToWirefluid, errorMessage } = useWeb3();

  const logs = useMemo(() => ([
    'detecting wallet...',
    'chainId mismatch detected',
    `expected: ${expectedChainId}`,
    `current: ${chainId || 'unknown'}`,
  ]), [chainId, expectedChainId]);

  return (
    <div style={styles.backdrop}>
      <div style={styles.scanline} />
      <div style={styles.terminal}>
        <div style={styles.header}>WIREFLUID TERMINAL GATE</div>
        <div style={styles.body}>
          {logs.map((line) => (
            <div key={line} style={styles.line}>
              <span style={styles.prompt}>&gt;</span> {line}
            </div>
          ))}
          <div style={styles.cursorRow}>
            <span style={styles.prompt}>&gt;</span> awaiting operator action
            <span style={styles.cursor}>_</span>
          </div>
          {errorMessage ? <div style={styles.error}>ERROR: {errorMessage}</div> : null}
        </div>
        <button style={styles.switchButton} onClick={switchToWirefluid}>
          OPEN METAMASK SWITCH
        </button>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 800,
    background: 'radial-gradient(circle at 15% 20%, rgba(0,255,106,0.16), transparent 45%), radial-gradient(circle at 85% 80%, rgba(232,184,75,0.1), transparent 40%), rgba(2, 5, 7, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  scanline: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    backgroundImage: 'radial-gradient(circle at 20% 0%, rgba(0,255,106,0.14), transparent 44%)',
    opacity: 0.9,
  },
  terminal: {
    width: 'min(920px, 100%)',
    border: '1px solid rgba(0,255,106,0.35)',
    borderRadius: '18px',
    background: 'linear-gradient(180deg, rgba(10, 20, 15, 0.97) 0%, rgba(5, 12, 10, 0.98) 100%)',
    boxShadow: '0 24px 52px rgba(0, 26, 10, 0.45)',
    overflow: 'hidden',
    animation: 'modalIn 240ms ease-in-out',
  },
  header: {
    fontFamily: 'var(--body)',
    color: 'var(--gold)',
    fontSize: '18px',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    padding: '16px 18px',
    borderBottom: '1px solid rgba(232,184,75,0.35)',
    background: 'rgba(20, 13, 4, 0.75)',
  },
  body: {
    padding: '24px 18px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    fontFamily: 'var(--body)',
    fontSize: '14px',
    lineHeight: 1.6,
    color: 'var(--text)',
  },
  line: {
    color: 'var(--text)',
  },
  prompt: {
    color: 'var(--g)',
    marginRight: '8px',
  },
  cursorRow: {
    color: 'var(--muted)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '6px',
  },
  cursor: {
    color: 'var(--g)',
    animation: 'blink 1s step-end infinite',
  },
  error: {
    marginTop: '8px',
    border: '1px solid rgba(255,59,59,0.42)',
    borderRadius: '12px',
    background: 'rgba(255,59,59,0.08)',
    color: '#ffc2c2',
    padding: '10px 12px',
  },
  switchButton: {
    width: '100%',
    border: 'none',
    borderTop: '1px solid rgba(0,255,106,0.2)',
    background: 'linear-gradient(180deg, rgba(0,255,106,0.2), rgba(232,184,75,0.16))',
    color: 'var(--text)',
    fontFamily: 'var(--body)',
    fontWeight: 600,
    fontSize: '13px',
    letterSpacing: '0.4px',
    padding: '16px',
    cursor: 'pointer',
  },
};
