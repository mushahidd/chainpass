import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useWeb3 } from '../utils/Web3Context';

export default function Navbar() {
  const router = useRouter();
  const { account, connectWallet, loading, isOwner, isScanner } = useWeb3();
  const navCenterRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const railKey = isMobile ? `mobile-rail-${router.pathname}` : 'desktop-rail';

  const links = useMemo(() => {
    const baseLinks = [
      { label: 'HOME', href: '/', variant: 'secondary' },
      { label: 'MARKETPLACE', href: '/marketplace', variant: 'primary' },
      { label: 'LEADERBOARD', href: '/leaderboard', variant: 'primary' },
      { label: 'MY TICKETS', href: '/tickets', variant: 'primary' },
      { label: 'DOCS', href: '/docs', variant: 'secondary' },
    ];

    if (isMobile) {
      return baseLinks;
    }

    if (isOwner) {
      baseLinks.push({ label: 'ADMIN', href: '/admin', variant: 'primary' });
    }

    if (isOwner || isScanner) {
      baseLinks.push({ label: 'SCANNER', href: '/scanner', variant: 'secondary' });
    }

    return baseLinks;
  }, [isMobile, isOwner, isScanner]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia('(max-width: 760px)');
    const updateMobile = () => setIsMobile(media.matches);
    updateMobile();

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', updateMobile);
      return () => media.removeEventListener('change', updateMobile);
    }

    media.addListener(updateMobile);
    return () => media.removeListener(updateMobile);
  }, []);

  useEffect(() => {
    const rail = navCenterRef.current;
    if (!rail || !isMobile) return;

    const resetToStart = () => {
      rail.scrollTo({ left: 0, behavior: 'auto' });
    };

    // Reset immediately and again after paint/focus restoration.
    resetToStart();
    const frame = requestAnimationFrame(resetToStart);
    const timeout = setTimeout(resetToStart, 120);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
    };
  }, [isMobile, router.pathname, links.length]);

  return (
    <nav className="site-navbar" style={styles.nav}>
      <div style={styles.brandDock}>
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
      </div>

      <div
        key={railKey}
        ref={navCenterRef}
        className="site-navbar-center"
        style={{
          ...styles.navCenter,
          justifyContent: isMobile ? 'flex-start' : 'center',
        }}
      >
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
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto',
    alignItems: 'center',
    columnGap: '22px',
    padding: '20px 48px',
    borderBottom: '1px solid var(--border)',
    background: 'rgba(4,8,10,0.92)',
    backdropFilter: 'blur(12px)',
    position: 'sticky',
    top: 0,
    zIndex: 9999,
    willChange: 'z-index',
  },
  brandDock: {
    justifySelf: 'start',
    width: '300px',
    minWidth: '300px',
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
    gap: '8px',
    justifySelf: 'center',
  },
};
