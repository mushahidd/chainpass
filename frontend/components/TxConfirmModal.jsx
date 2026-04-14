export default function TxConfirmModal({ open, title, details, onConfirm, onCancel, pending }) {
  if (!open) return null;

  return (
    <div style={styles.wrap}>
      <div style={styles.panel}>
        <div style={styles.title}>Execute Transaction</div>
        <div style={styles.subtitle}>{title}</div>
        <div style={styles.divider} />
        {details ? <pre style={styles.details}>{details}</pre> : null}
        <div style={styles.actions}>
          <button className="secondary-action" style={styles.cancel} onClick={onCancel} disabled={pending}>ABORT</button>
          <button className="primary-action" style={styles.confirm} onClick={onConfirm} disabled={pending}>
            {pending ? 'EXECUTING...' : 'CONFIRM EXECUTION'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    position: 'fixed',
    inset: 0,
    zIndex: 850,
    background: 'rgba(4, 6, 7, 0.78)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  panel: {
    width: 'min(620px, 100%)',
    border: '1px solid rgba(0,255,106,0.4)',
    borderRadius: '18px',
    background: 'linear-gradient(180deg, rgba(8, 18, 13, 0.98) 0%, rgba(4, 10, 8, 0.98) 100%)',
    padding: '22px',
    fontFamily: 'var(--body)',
    animation: 'modalIn 220ms ease-in-out',
    boxShadow: '0 24px 52px rgba(0, 24, 10, 0.45)',
  },
  title: {
    fontSize: '22px',
    fontWeight: 700,
    color: 'var(--text)',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    marginTop: '10px',
    fontSize: '14px',
    color: 'var(--muted)',
  },
  divider: {
    marginTop: '12px',
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(0,255,106,0.28), transparent)',
  },
  details: {
    marginTop: '16px',
    border: '1px solid rgba(255,255,255,0.16)',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.02)',
    padding: '14px',
    fontFamily: 'var(--mono)',
    fontSize: '12px',
    whiteSpace: 'pre-wrap',
    lineHeight: 1.75,
    color: 'var(--muted)',
  },
  actions: {
    marginTop: '20px',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
  },
  cancel: {
    padding: '10px 16px',
    fontFamily: 'var(--body)',
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.4px',
  },
  confirm: {
    padding: '10px 16px',
    fontFamily: 'var(--body)',
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.4px',
  },
};
