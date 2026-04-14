import { useMemo } from 'react';
import { useWeb3, WEB3_UI_STATES } from '../utils/Web3Context';

function pendingMessage(step) {
  if (step === 'broadcasting') return 'broadcasting...';
  if (step === 'waiting_for_confirmation') return 'waiting for confirmation...';
  if (step === 'mining_block') return 'mining block...';
  return 'processing...';
}

export default function TxStateOverlay() {
  const { currentState, txStep, txHash, errorMessage, resetTxOverlay, explorerTxBase } = useWeb3();
  const explorerLink = txHash ? `${explorerTxBase}${txHash}` : '';

  const config = useMemo(() => {
    if (currentState === WEB3_UI_STATES.TX_PENDING) {
      return {
        tone: 'pending',
        title: 'TRANSACTION TERMINAL',
        body: pendingMessage(txStep),
      };
    }

    if (currentState === WEB3_UI_STATES.TX_SUCCESS) {
      return {
        tone: 'success',
        title: 'TX CONFIRMED',
        body: 'Block confirmation received. State committed to chain.',
      };
    }

    if (currentState === WEB3_UI_STATES.TX_FAILED) {
      return {
        tone: 'failed',
        title: 'TX FAILED',
        body: errorMessage || 'Transaction reverted by EVM.',
      };
    }

    return null;
  }, [currentState, txStep, errorMessage]);

  if (!config) return null;

  return (
    <div style={{ ...styles.wrap, ...(config.tone === 'failed' ? styles.failedWrap : {}) }}>
      <div style={styles.scanline} />
      <div style={{ ...styles.card, ...(config.tone === 'success' ? styles.successCard : {}), ...(config.tone === 'failed' ? styles.failedCard : {}) }}>
        <div style={styles.title}>{config.title}</div>
        {config.tone === 'pending' ? (
          <div style={styles.progressRow}>
            <span style={styles.spinner} />
            <span style={styles.progressText}>Awaiting chain confirmation</span>
          </div>
        ) : null}
        <div style={styles.logLine}>
          <span style={styles.prompt}>&gt;</span> {config.body}
        </div>
        {txHash ? (
          <div style={styles.hashBlock}>
            <div style={styles.hashLabel}>TX HASH</div>
            <div style={styles.hashValue}>{txHash}</div>
            <a href={explorerLink} target="_blank" rel="noreferrer" style={styles.link}>OPEN EXPLORER ↗</a>
          </div>
        ) : null}
        {config.tone !== 'pending' ? (
          <button style={styles.closeButton} onClick={resetTxOverlay}>CLOSE TERMINAL</button>
        ) : null}
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    position: 'fixed',
    inset: 0,
    zIndex: 900,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background: 'rgba(1, 4, 4, 0.76)',
  },
  failedWrap: {
    background: 'rgba(18, 2, 2, 0.82)',
  },
  scanline: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    backgroundImage: 'radial-gradient(circle at 20% 10%, rgba(0,255,106,0.08), transparent 36%)',
  },
  card: {
    width: 'min(700px, 100%)',
    border: '1px solid rgba(0,255,106,0.38)',
    borderRadius: '18px',
    padding: '24px',
    background: 'linear-gradient(180deg, rgba(4, 17, 11, 0.98) 0%, rgba(3, 11, 8, 0.98) 100%)',
    fontFamily: 'var(--body)',
    color: 'var(--text)',
    boxShadow: '0 24px 52px rgba(0, 30, 12, 0.45)',
    animation: 'modalIn 240ms ease-in-out',
  },
  successCard: {
    borderColor: 'rgba(232,184,75,0.45)',
    boxShadow: '0 22px 48px rgba(232,184,75,0.24)',
  },
  failedCard: {
    borderColor: 'rgba(255,59,59,0.5)',
    background: 'linear-gradient(180deg, rgba(44, 20, 26, 0.98) 0%, rgba(27, 13, 17, 0.98) 100%)',
    boxShadow: '0 22px 48px rgba(84, 24, 37, 0.38)',
  },
  title: {
    fontSize: '26px',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: 'var(--text)',
    marginBottom: '12px',
  },
  progressRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px',
  },
  spinner: {
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    border: '2px solid rgba(0,255,106,0.28)',
    borderTopColor: 'rgba(0,255,106,0.95)',
    animation: 'spin 900ms linear infinite',
  },
  progressText: {
    fontSize: '13px',
    color: 'var(--muted)',
  },
  logLine: {
    fontSize: '14px',
    lineHeight: 1.7,
    color: 'var(--text)',
  },
  prompt: {
    color: 'var(--g)',
    marginRight: '6px',
  },
  hashBlock: {
    marginTop: '18px',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.03)',
    padding: '14px',
  },
  hashLabel: {
    fontSize: '11px',
    color: 'var(--muted)',
    marginBottom: '6px',
    letterSpacing: '0.3px',
    fontWeight: 600,
  },
  hashValue: {
    fontSize: '12px',
    lineHeight: 1.6,
    wordBreak: 'break-all',
  },
  link: {
    display: 'inline-block',
    marginTop: '10px',
    color: 'var(--g)',
    textDecoration: 'underline',
    fontSize: '12px',
    fontWeight: 600,
  },
  closeButton: {
    marginTop: '20px',
    border: '1px solid rgba(0,255,106,0.42)',
    background: 'rgba(0,255,106,0.12)',
    color: 'var(--text)',
    fontFamily: 'var(--body)',
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.4px',
    padding: '12px 16px',
    borderRadius: '12px',
  },
};
