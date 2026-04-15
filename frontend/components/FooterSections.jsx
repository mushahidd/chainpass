import Link from 'next/link';

export function ScaleSection() {
  return (
    <div className="footer-scale-section" style={styles.section}>
      <div style={styles.col}>
        <div style={styles.tag}>// PRIMARY_USE_CASE</div>
        <div style={styles.big}>PSL<br /><span style={{ color: 'var(--g)' }}>2026</span></div>
        <div style={styles.desc}>
          Solving Pakistan's most visible ticketing crisis — scalping, counterfeits, and zero safe
          resale infrastructure. Built for the biggest cricket league in the country.
        </div>
      </div>
      <div style={styles.col}>
        <div style={styles.tag}>// EXPANSION_TARGETS</div>
        <div style={styles.big}>NEXT<br /><span style={{ color: 'var(--g)' }}>STEP</span></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
          {['Concerts — Atif Aslam, Kaifi Khalil', 'University Olympiads — FAST / LUMS / IBA', 'Cinema chains — nationwide rollout', 'Other sports leagues and tournaments'].map((item) => (
            <div key={item} style={styles.scItem}>
              <div style={styles.dot} />
              {item}
            </div>
          ))}
        </div>
      </div>
      <div style={{ ...styles.col, borderRight: 'none' }}>
        <div style={styles.tag}>// TECH_STACK</div>
        <div style={styles.big}>POLY<br /><span style={{ color: 'var(--g)' }}>GON</span></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
          {['Solidity smart contracts (ERC-721)', 'Web3Auth — social login abstraction', 'Chainlink oracles for match data', 'Safepay / PayMob PKR fiat bridge'].map((item) => (
            <div key={item} style={styles.scItem}>
              <div style={styles.dot} />
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CTASection() {
  const params = [
    { k: 'NETWORK', v: 'POLYGON MAINNET', gold: false },
    { k: 'TOKEN_STANDARD', v: 'ERC-721', gold: false },
    { k: 'RESALE_CAP', v: 'ORIGINAL + 10%', gold: false },
    { k: 'ROYALTY_SPLIT', v: '3% → PCB', gold: true },
    { k: 'QR_REFRESH', v: 'EVERY 30s', gold: false },
    { k: 'AUTH', v: 'WEB3AUTH', gold: false },
    { k: 'PAYMENT', v: 'EASYPAY BRIDGE', gold: true },
  ];

  return (
    <div className="footer-cta-section" style={styles.cta}>
      <div>
        <div style={styles.ctaTag}>// INITIALIZE_REGISTRATION</div>
        <div style={styles.ctaTitle}>
          SCALPING<br />ENDS <span style={{ color: 'var(--g)' }}>HERE.</span>
        </div>
        <div style={styles.ctaSub}>
          SECURE YOUR TICKET.<br />OWN IT ON-CHAIN.<br />ENTER THE STADIUM.
        </div>
        <div style={styles.ctaBtns}>
          <Link href="/marketplace" className="nav-cta">BROWSE_TICKETS →</Link>
          <Link href="/docs" className="nav-cta nav-cta--dark">WHITEPAPER ↗</Link>
        </div>
      </div>
      <div style={styles.contractCard}>
        <div style={styles.contractTitle}>CONTRACT_PARAMETERS</div>
        {params.map((p) => (
          <div key={p.k} style={styles.paramRow}>
            <span style={styles.paramKey}>{p.k}</span>
            <span style={{ ...styles.paramVal, color: p.gold ? 'var(--gold)' : 'var(--g)' }}>{p.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="site-footer" style={styles.footer}>
      <div style={styles.footerLeft}>
        CHAINPASS_PSL © 2026 · BUILT ON POLYGON · ALL RIGHTS RESERVED
      </div>
      <div style={styles.footerRight}>
        <Link href="/docs" style={styles.footerLink}>DOCS</Link>
        <a href="https://github.com" style={styles.footerLink}>GITHUB</a>
        <Link href="/docs" style={styles.footerLink}>CONTRACT</Link>
        <a href="#" style={styles.footerLink}>CONTACT</a>
      </div>
    </footer>
  );
}

const styles = {
  section: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    borderBottom: '1px solid var(--border)',
  },
  col: {
    padding: '48px',
    borderRight: '1px solid var(--border)',
  },
  tag: { fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '2px', marginBottom: '24px' },
  big: { fontFamily: 'var(--display)', fontSize: '56px', color: 'var(--text)', lineHeight: 1, marginBottom: '12px' },
  desc: { fontFamily: 'var(--body)', fontSize: '13px', color: 'var(--muted)', lineHeight: 1.7, fontWeight: 300 },
  scItem: { display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.5px' },
  dot: { width: '4px', height: '4px', background: 'var(--g)', flexShrink: 0 },

  cta: {
    padding: '100px 48px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '80px',
    alignItems: 'center',
    borderBottom: '1px solid var(--border)',
  },
  ctaTag: { fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--muted)', letterSpacing: '2.5px', marginBottom: '20px' },
  ctaTitle: { fontFamily: 'var(--display)', fontSize: '52px', lineHeight: 1, letterSpacing: '2px', color: 'var(--text)', marginBottom: '12px' },
  ctaSub: { fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--dim)', letterSpacing: '1.5px', marginBottom: '32px', lineHeight: 2 },
  ctaBtns: { display: 'flex', gap: '12px' },
  contractCard: { background: 'var(--surface)', border: '1px solid var(--border)', padding: '32px' },
  contractTitle: { fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '2px', marginBottom: '20px' },
  paramRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 0', borderBottom: '1px solid var(--border)',
    fontFamily: 'var(--mono)', fontSize: '11px',
  },
  paramKey: { color: 'var(--dim)', letterSpacing: '1px' },
  paramVal: { color: 'var(--g)' },

  footer: {
    padding: '28px 48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTop: '1px solid var(--border)',
  },
  footerLeft: { fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '1.5px' },
  footerRight: { display: 'flex', gap: '24px' },
  footerLink: { fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '1px', textDecoration: 'none' },
};
