const STEPS = [
  {
    num: '01',
    title: 'LOGIN_WITH_GOOGLE',
    desc: 'Connect with MetaMask and authorize actions with your wallet signature. Keys remain under user control while ticket ownership is verified fully on-chain.',
  },
  {
    num: '02',
    title: 'PAY_PKR_VIA_EASYPAISA',
    desc: 'Complete payment in Pakistani rupees. The backend liquidity bridge converts PKR to MATIC and mints the NFT ticket — all handled transparently in the background.',
  },
  {
    num: '03',
    title: 'NFT_APPEARS_IN_MY_TICKETS',
    desc: 'The ticket appears in the "My Tickets" tab. Clean, simple interface — no wallet jargon, no blockchain complexity exposed to the end user.',
  },
  {
    num: '04',
    title: 'SCAN_AT_STADIUM_GATE',
    desc: 'Present the live-refreshing QR code. The gate scanner verifies on-chain ownership in real time. Verification confirmed — entry granted.',
  },
];

export default function HowItWorks() {
  return (
    <div className="how-section" style={styles.section}>
      <div className="how-left" style={styles.left}>
        <div style={styles.tag}>// V3</div>
        <div style={styles.title}>HOW_IT<br />WORKS</div>
        <div style={styles.subtitle}>
          No crypto background required. Four steps from purchase to stadium gate.
        </div>
      </div>
      <div className="how-right" style={styles.right}>
        {STEPS.map((step, i) => (
          <div
            key={step.num}
            style={{
              ...styles.stepRow,
              borderBottom: i < STEPS.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <div style={styles.stepNum}>{step.num}</div>
            <div>
              <div style={styles.stepTitle}>{step.title}</div>
              <div style={styles.stepDesc}>{step.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  section: {
    display: 'grid',
    gridTemplateColumns: '320px 1fr',
    borderBottom: '1px solid var(--border)',
  },
  left: {
    padding: '64px 40px',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  tag: {
    fontFamily: 'var(--mono)',
    fontSize: '9px',
    color: 'var(--muted)',
    letterSpacing: '2px',
    marginBottom: '12px',
  },
  title: {
    fontFamily: 'var(--display)',
    fontSize: '40px',
    color: 'var(--text)',
    letterSpacing: '2px',
    marginBottom: '16px',
    lineHeight: 1,
  },
  subtitle: {
    fontFamily: 'var(--body)',
    fontSize: '13px',
    color: 'var(--muted)',
    lineHeight: 1.8,
    fontWeight: 300,
  },
  right: {
    padding: '64px 48px',
  },
  stepRow: {
    display: 'flex',
    gap: '20px',
    padding: '24px 0',
  },
  stepNum: {
    width: '32px',
    height: '32px',
    border: '1px solid var(--border2)',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--mono)',
    fontSize: '10px',
    color: 'var(--muted)',
    marginTop: '2px',
  },
  stepTitle: {
    fontFamily: 'var(--mono)',
    fontSize: '11px',
    color: 'var(--text)',
    letterSpacing: '1px',
    marginBottom: '6px',
  },
  stepDesc: {
    fontFamily: 'var(--body)',
    fontSize: '12px',
    color: 'var(--muted)',
    lineHeight: 1.7,
    fontWeight: 300,
  },
};
