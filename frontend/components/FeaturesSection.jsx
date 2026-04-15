import { useState } from 'react';

const FEATURES = [
  {
    idx: 'C_01 //',
    title: 'PRICE_CAP_ENFORCEMENT',
    desc: 'A hard resale limit is permanently encoded in the smart contract. Any transaction above original price + 10% is automatically rejected by the blockchain. No admin override — ever.',
    pill: 'STRICTLY_BLOCKCHAIN',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--g)" strokeWidth="1.5" strokeLinecap="round">
        <rect x="3" y="11" width="18" height="11" rx="1" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    idx: 'C_02 //',
    title: 'DYNAMIC_QR_PROTOCOL',
    desc: 'The QR code cryptographically regenerates every 60 seconds using the holder\'s private key signature. Screenshots are useless — the ticket expires the moment it is captured.',
    pill: 'ANTI_SCREENSHOT',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--g)" strokeWidth="1.5" strokeLinecap="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    idx: 'C_03 //',
    title: 'AUTO_ROYALTY_SPLIT',
    desc: 'Every secondary sale automatically routes 3% to PCB on-chain. Zero manual intervention — the smart contract handles the atomic split at transaction execution.',
    pill: 'ZERO_MANUAL',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--g)" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    idx: 'C_04 //',
    title: 'FIAT_PAYMENT_BRIDGE',
    desc: 'Pay in PKR via EasyPaisa or JazzCash. The liquidity bridge silently converts PKR to MATIC and mints the NFT ticket. Zero crypto knowledge required from the user.',
    pill: 'FIAT_ABSTRACTION',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--g)" strokeWidth="1.5" strokeLinecap="round">
        <rect x="1" y="4" width="22" height="16" rx="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    idx: 'C_05 //',
    title: 'WEB3_ABSTRACT_LOGIN',
    desc: 'Sign in with Google or phone number. Web3Auth silently provisions a non-custodial blockchain wallet — no seed phrase, no private key shown. Pure Web2 experience, Web3 security.',
    pill: 'ZERO_CRYPTO_UX',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--g)" strokeWidth="1.5" strokeLinecap="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    idx: 'C_06 //',
    title: 'PUBLIC_LEDGER_AUDIT',
    desc: 'Every ticket\'s complete ownership history is publicly verifiable on-chain. Anyone can audit — transparent, immutable, and tamper-proof by mathematical design.',
    pill: 'OPEN_LEDGER',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--g)" strokeWidth="1.5" strokeLinecap="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
];

function FeatureCard({ feature }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        ...styles.card,
        background: hovered ? 'var(--surface)' : 'var(--bg)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          ...styles.leftBar,
          height: hovered ? '100%' : '0%',
        }}
      />
      <div style={styles.idx}>{feature.idx}</div>
      <div style={styles.iconWrap}>{feature.icon}</div>
      <div style={styles.title}>{feature.title}</div>
      <div style={styles.desc}>{feature.desc}</div>
      <span style={styles.pill}>{feature.pill}</span>
    </div>
  );
}

export default function FeaturesSection() {
  return (
    <section className="features-section" style={styles.section}>
      <div className="features-head" style={styles.sectionHead}>
        <div style={styles.secNum}>V2</div>
        <div>
          <div style={styles.secTag}>// MODULE_FEATURES</div>
          <div style={styles.secTitle}>CORE_PROTOCOLS</div>
        </div>
      </div>
      <div className="features-grid" style={styles.grid}>
        {FEATURES.map((f) => (
          <FeatureCard key={f.idx} feature={f} />
        ))}
      </div>
    </section>
  );
}

const styles = {
  section: {
    padding: '80px 48px',
    borderBottom: '1px solid var(--border)',
  },
  sectionHead: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '20px',
    marginBottom: '64px',
  },
  secNum: {
    fontFamily: 'var(--display)',
    fontSize: '72px',
    color: 'var(--border2)',
    lineHeight: 1,
  },
  secTag: {
    fontFamily: 'var(--mono)',
    fontSize: '9px',
    color: 'var(--muted)',
    letterSpacing: '2px',
    marginBottom: '6px',
  },
  secTitle: {
    fontFamily: 'var(--display)',
    fontSize: '36px',
    color: 'var(--text)',
    letterSpacing: '2px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1px',
    background: 'var(--border)',
  },
  card: {
    padding: '36px',
    transition: 'background 0.3s',
    cursor: 'default',
    position: 'relative',
    overflow: 'hidden',
  },
  leftBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '3px',
    background: 'var(--g)',
    transition: 'height 0.35s ease',
  },
  idx: {
    fontFamily: 'var(--mono)',
    fontSize: '9px',
    color: 'var(--dim)',
    letterSpacing: '2px',
    marginBottom: '20px',
  },
  iconWrap: {
    width: '44px',
    height: '44px',
    border: '1px solid var(--border2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  title: {
    fontFamily: 'var(--mono)',
    fontSize: '12px',
    color: 'var(--text)',
    letterSpacing: '1px',
    marginBottom: '10px',
  },
  desc: {
    fontFamily: 'var(--body)',
    fontSize: '12.5px',
    color: 'var(--muted)',
    lineHeight: 1.8,
    fontWeight: 300,
  },
  pill: {
    display: 'inline-block',
    fontFamily: 'var(--mono)',
    fontSize: '8px',
    color: 'var(--g)',
    border: '1px solid var(--border2)',
    padding: '3px 10px',
    marginTop: '16px',
    letterSpacing: '1.5px',
    background: 'rgba(0,255,106,0.03)',
  },
};
