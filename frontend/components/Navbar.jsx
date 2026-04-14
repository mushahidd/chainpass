import Link from 'next/link';
import { useRouter } from 'next/router';
import { useWeb3 } from '../utils/Web3Context';

export default function Navbar() {
  const router = useRouter();
  const { account, connectWallet, loading } = useWeb3();

    const links = [
    { label: 'HOME', href: '/', variant: 'secondary' },
    { label: 'MARKETPLACE', href: '/marketplace', variant: 'primary' },
    { label: 'MY TICKETS', href: '/tickets', variant: 'primary' },
    { label: 'SCOREBOARD', href: '/scoreboard', variant: 'primary' },
    { label: 'DOCS', href: '/docs', variant: 'secondary' },
  ];

  return (
    <nav style={styles.nav}>
      <Link href="/" style={styles.logoMark}>
        <img
          src="/chainpass-logo.png"
          alt="ChainPass logo"
          style={styles.logoImage}
        />
        <div>
          <div style={styles.logoText}>
            <span style={{ color: 'var(--g)' }}>CHAIN</span>PASS
          </div>
          <div style={styles.logoSub}>PSL · BLOCKCHAIN TICKETING</div>
        </div>
      </Link>

      <div style={styles.navCenter}>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`nav-item nav-item--${link.variant} ${router.pathname === link.href ? 'nav-item-active' : ''}`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <button 
        className="nav-cta"
        onClick={connectWallet}
        disabled={loading}
      >
        {loading ? '// CONNECTING...' : account ? `// ${account.slice(0, 6)}...${account.slice(-4)}` : '// CONNECT_WALLET'}
      </button>

    </nav>
  );
}

const styles = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 48px',
    borderBottom: '1px solid var(--border)',
    background: 'rgba(4,8,10,0.92)',
    backdropFilter: 'blur(12px)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logoMark: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    textDecoration: 'none',
  },
  logoImage: {
    width: '60px',
    height: '60px',
    objectFit: 'cover',
    borderRadius: '50%',
    flexShrink: 0,
  },
  logoText: {
    fontFamily: 'var(--display)',
    fontSize: '22px',
    letterSpacing: '3px',
    color: 'var(--text)',
  },
  logoSub: {
    fontFamily: 'var(--mono)',
    fontSize: '8px',
    color: 'var(--muted)',
    letterSpacing: '2px',
    marginTop: '1px',
  },
  navCenter: {
    display: 'flex',
    gap: '10px',
  },
};
