import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useWeb3 } from '../utils/Web3Context';

export default function Navbar() {
  const router = useRouter();
  const { account, connectWallet, disconnectWallet, loading, isOwner, isScanner } = useWeb3();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { label: 'HOME', href: '/' },
    { label: 'MARKETPLACE', href: '/marketplace' },
    { label: 'LEADERBOARD', href: '/leaderboard' },
    { label: 'MY TICKETS', href: '/tickets' },
    { label: 'DOCS', href: '/docs' },
  ];

  if (isOwner) {
    links.push({ label: 'ADMIN', href: '/admin' });
  }

  if (isOwner || isScanner) {
    links.push({ label: 'SCANNER', href: '/scanner' });
  }

  const walletLabel = loading
    ? '// CONNECTING...'
    : account
    ? `// ${account.slice(0, 6)}...${account.slice(-4)}`
    : 'LOGIN_WALLET →';

  return (
    <>
      <nav style={styles.nav} className="nav-container">
        {/* Logo */}
        <Link href="/" style={styles.logoMark} className="navbar-logo" onClick={() => setMenuOpen(false)}>
          <img
            src="/chainpass-logo.png"
            alt="ChainPass logo"
            style={styles.logoImage}
            className="navbar-logo-img"
          />
          <div>
            <div style={styles.logoText} className="navbar-logo-text">
              <span style={{ color: 'var(--g)' }}>CHAIN</span>PASS
            </div>
            <div style={styles.logoSub} className="navbar-logo-sub">PSL · BLOCKCHAIN TICKETING</div>
          </div>
        </Link>

        {/* Desktop nav links */}
        <div style={styles.navCenter} className="nav-center-links">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-item ${router.pathname === link.href ? 'nav-item-active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side: wallet + hamburger */}
        <div style={styles.navRight} className="nav-right-container">
          {!account ? (
            <button
              className="nav-cta header-wallet-btn"
              onClick={connectWallet}
              disabled={loading}
            >
              {walletLabel}
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }} className="nav-right-container">
              <div className="nav-cta nav-cta--dark header-wallet-btn" style={{ cursor: 'default', pointerEvents: 'none', padding: '0 16px' }}>
                {walletLabel}
              </div>
              <button className="nav-cta desktop-only-btn" onClick={disconnectWallet}>
                LOGOUT
              </button>
            </div>
          )}

          {/* Hamburger */}
          <button
            className={`hamburger-icon ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      {/* Mobile overlay menu */}
      <div className={`mobile-menu-overlay ${menuOpen ? 'open' : ''}`}>
        <button
          className="mobile-menu-close"
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
        >
          ✕
        </button>

        <div style={styles.mobileLogoRow}>
          <span style={{ color: 'var(--g)', fontFamily: 'var(--display)', fontSize: '22px' }}>CHAIN</span>
          <span style={{ fontFamily: 'var(--display)', fontSize: '22px', color: 'var(--text)' }}>PASS</span>
        </div>

        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`nav-item nav-item--${link.variant} ${router.pathname === link.href ? 'nav-item-active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            {link.label}
          </Link>
        ))}

        {!account ? (
          <button
            className="nav-cta"
            onClick={() => { connectWallet(); setMenuOpen(false); }}
            disabled={loading}
            style={{ marginTop: '8px', width: '100%', maxWidth: '320px' }}
          >
            {walletLabel}
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '320px', marginTop: '8px' }}>
            <div className="nav-cta nav-cta--dark" style={{ flex: 1, cursor: 'default', pointerEvents: 'none', justifyContent: 'center' }}>
              {walletLabel}
            </div>
            <button className="nav-cta" onClick={() => { disconnectWallet(); setMenuOpen(false); }}>
              LOGOUT
            </button>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .hamburger-icon { display: none; flex-direction: column; gap: 5px; cursor: pointer; padding: 8px; background: transparent; border: 1px solid var(--border2); border-radius: 6px; }
        .hamburger-icon span { display: block; width: 22px; height: 2px; background: var(--g); transition: all 0.3s ease; }
        .hamburger-icon.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
        .hamburger-icon.open span:nth-child(2) { opacity: 0; }
        .hamburger-icon.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
        
        .mobile-menu-overlay { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(4, 8, 10, 0.97); backdrop-filter: blur(16px); z-index: 999; flex-direction: column; alignItems: center; justify-content: center; gap: 16px; padding: 20px; text-align: center; }
        .mobile-menu-overlay.open { display: flex; }
        .mobile-menu-overlay .nav-item { margin: 0 auto; width: 100%; max-width: 320px; justify-content: center; }
        
        @media (max-width: 1180px) {
          .nav-center-links { display: none !important; }
          .hamburger-icon { display: flex !important; }
          .desktop-only-btn { display: none !important; }
        }
        @media (max-width: 480px) {
          .navbar-logo-img { width: 34px !important; height: 34px !important; }
          .navbar-logo-text { font-size: 15px !important; letter-spacing: 2px !important; }
          .navbar-logo-sub { display: none !important; }
          .header-wallet-btn { padding: 0 10px !important; font-size: 9px !important; height: 36px !important; letter-spacing: 0.5px !important; }
          .nav-right-container { gap: 6px !important; }
          .nav-container { padding: 12px 16px !important; }
        }
      `}} />
    </>
  );
}

const styles = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px clamp(16px, 4vw, 48px)',
    borderBottom: '1px solid var(--border)',
    background: 'rgba(4,8,10,0.95)',
    backdropFilter: 'blur(12px)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    gap: '12px',
  },
  logoMark: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none',
    flexShrink: 0,
  },
  logoImage: {
    width: '48px',
    height: '48px',
    objectFit: 'cover',
    borderRadius: '50%',
    flexShrink: 0,
  },
  logoText: {
    fontFamily: 'var(--display)',
    fontSize: 'clamp(16px, 3vw, 22px)',
    letterSpacing: '3px',
    color: 'var(--text)',
  },
  logoSub: {
    fontFamily: 'var(--mono)',
    fontSize: '10px',
    color: 'var(--muted)',
    letterSpacing: '2px',
    marginTop: '2px',
  },
  navCenter: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'nowrap',
    overflow: 'hidden',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexShrink: 0,
  },
  mobileLogoRow: {
    display: 'flex',
    gap: '2px',
    marginBottom: '16px',
  },
};
