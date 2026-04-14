import Link from 'next/link';
import { useRouter } from 'next/router';
import { useWeb3, WEB3_UI_STATES } from '../utils/Web3Context';

export default function Navbar() {
  const router = useRouter();
  const { walletAddress, connectWallet, loading, currentState } = useWeb3();

  const links = [
    { label: 'HOME', href: '/', variant: 'secondary' },
    { label: 'MARKETPLACE', href: '/marketplace', variant: 'primary' },
    { label: 'MY TICKETS', href: '/tickets', variant: 'primary' },
    { label: 'DOCS', href: '/docs', variant: 'secondary' },
  ];

  return (
    <nav className="app-nav" style={styles.nav}>
      <Link href="/" style={styles.logoMark}>
        <img
          src="/chainpass-logo.png"
          alt="ChainPass logo"
          style={styles.logoImage}
        />
        <div>
          <div style={styles.logoText}>
            <span style={{ color: 'var(--g)' }}>Chain</span>Pass
          </div>
          <div style={styles.logoSub}>WireFluid Blockchain Ticketing</div>
        </div>
      </Link>

      <div className="app-nav-center" style={styles.navCenter}>
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
        disabled={loading || currentState === WEB3_UI_STATES.TX_PENDING}
      >
        {loading
          ? '// CONNECTING...'
          : walletAddress
            ? currentState === WEB3_UI_STATES.CORRECT_NETWORK
              ? `// CONNECTED ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
              : `// CHAIN_BLOCKED ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
            : '// CONNECT_WALLET'}
      </button>

    </nav>
  );
}

const styles = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 32px',
    borderBottom: '1px solid var(--border)',
    background: 'rgba(4,8,10,0.92)',
    backdropFilter: 'blur(14px)',
    position: 'sticky',
    top: 0,
    zIndex: 200,
    boxShadow: '0 8px 22px rgba(0, 0, 0, 0.3)',
  },
  logoMark: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none',
  },
  logoImage: {
    width: '46px',
    height: '46px',
    objectFit: 'cover',
    borderRadius: '14px',
    flexShrink: 0,
    border: '1px solid var(--border2)',
    boxShadow: '0 8px 18px rgba(0, 255, 106, 0.14)',
  },
  logoText: {
    fontFamily: 'var(--display)',
    fontSize: '20px',
    fontWeight: 700,
    letterSpacing: '0.2px',
    color: 'var(--text)',
  },
  logoSub: {
    fontFamily: 'var(--body)',
    fontSize: '11px',
    color: 'var(--muted)',
    letterSpacing: '0.2px',
    marginTop: '2px',
  },
  navCenter: {
    display: 'flex',
    gap: '8px',
  },
};
