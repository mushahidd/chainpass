import Head from 'next/head';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Ticker from '../components/Ticker';
import StatsBand from '../components/StatsBand';
import FeaturesSection from '../components/FeaturesSection';
import HowItWorks from '../components/HowItWorks';
import { ScaleSection, CTASection, Footer } from '../components/FooterSections';

const ParticleBackground = dynamic(() => import('../components/ParticleBackground'), { ssr: false });

export default function Home() {
  return (
    <>
      <Head>
        <title>ChainPass PSL — Blockchain Ticketing</title>
        <meta name="description" content="PSL tickets as NFTs. Price cap enforced by smart contract. No scalping. No fakes." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
      </Head>

      <div style={{ position: 'relative', minHeight: '100vh' }}>
        <ParticleBackground />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <Ticker />

          <main className="hero-main" style={styles.main}>
            <section className="hero-grid" style={styles.hero}>
              <div className="hero-col-left" style={styles.heroLeft}>
                <div style={styles.eyebrow}>
                  <div style={styles.pulseDot} />
                  <span style={styles.eyebrowText}>SYS_READY: V26.0 // PSL_SEASON_2026</span>
                </div>

                <h1 style={styles.heroTitle}>
                  END<br />
                  <span style={{ color: 'var(--g)', display: 'block' }}>THE</span>
                  <span style={{ color: 'var(--gold)', display: 'block' }}>SCALPER.</span>
                </h1>

                <p style={styles.heroDesc}>
                  Every PSL ticket is a <strong style={{ color: 'var(--text)', fontWeight: 400 }}>blockchain NFT</strong> —
                  price cap <strong style={{ color: 'var(--text)', fontWeight: 400 }}>enforced by smart contract</strong>,
                  fake tickets mathematically impossible, and resale only happens at a fair price.{' '}
                  <strong style={{ color: 'var(--text)', fontWeight: 400 }}>The code is the law.</strong>
                </p>

                <div style={styles.heroActions}>
                  <Link href="/docs" className="nav-cta nav-cta--dark">VIEW_CONTRACT ↗</Link>
                </div>

                <div style={styles.badges}>
                  {[
                    { label: 'WIREFLUID_TESTNET', gold: false },
                    { label: 'WEB3AUTH', gold: false },
                    { label: 'EASYPAY_BRIDGE', gold: true },
                    { label: 'CHAINLINK_ORACLE', gold: false },
                  ].map((b) => (
                    <span
                      key={b.label}
                      style={{
                        ...styles.badge,
                        borderColor: b.gold ? 'var(--gold2)' : 'var(--g)',
                        color: b.gold ? 'var(--gold)' : 'var(--g)',
                        background: b.gold ? 'rgba(232,184,75,0.04)' : 'rgba(0,255,106,0.04)',
                      }}
                    >
                      {b.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="hero-col-right" style={styles.heroRight}>
                <div style={styles.marketPreview}>
                  <div style={styles.marketTag}>// MARKETPLACE</div>
                  <h2 style={styles.marketTitle}>BUY TICKETS, SEE THE LEADERBOARD, AND TRACK LIVE DEMAND.</h2>
                  <p style={styles.marketCopy}>
                    The purchasing flow now lives in the marketplace. Use it to mint tickets, then watch the leaderboard update as the lifetime ticket counts shift.
                  </p>
                  <Link href="/marketplace" className="nav-cta nav-cta--dark">OPEN_MARKETPLACE ↗</Link>
                  <div className="stats-wrap" style={styles.marketStats}>
                    <div style={styles.marketStat}>
                      <div style={styles.marketStatValue}>LIVE</div>
                      <div style={styles.marketStatLabel}>LEADERBOARD</div>
                    </div>
                    <div style={styles.marketStat}>
                      <div style={styles.marketStatValue}>WIRE</div>
                      <div style={styles.marketStatLabel}>PAYMENTS</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </main>

          <StatsBand />
          <FeaturesSection />
          <HowItWorks />
          <ScaleSection />
          <CTASection />
          <Footer />
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
        button:hover { opacity: 0.9; }

        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-col-left { border-right: none !important; padding: 40px 20px !important; }
          .hero-col-right { border-top: 1px solid var(--border) !important; padding: 40px 20px !important; }
        }
        @media (max-width: 480px) {
          .stats-wrap { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}

const styles = {
  main: {
    flex: 1,
  },
  hero: {
    minHeight: 'min(88vh, 900px)',
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) min(440px, 100%)',
    alignItems: 'stretch',
    borderBottom: '1px solid var(--border)',
  },
  heroLeft: {
    padding: 'clamp(40px, 8vw, 80px) clamp(20px, 5vw, 48px)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  eyebrow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '28px',
  },
  pulseDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: 'var(--g)',
    animation: 'pulse 2s ease-in-out infinite',
    flexShrink: 0,
  },
  eyebrowText: {
    fontFamily: 'var(--mono)',
    fontSize: 'clamp(11px, 1.5vw, 12px)',
    letterSpacing: '2.5px',
    color: 'var(--muted)',
  },
  heroTitle: {
    fontFamily: 'var(--display)',
    fontSize: 'clamp(52px, 8vw, 108px)',
    lineHeight: 0.92,
    letterSpacing: '2px',
    color: 'var(--text)',
    marginBottom: '24px',
  },
  heroDesc: {
    fontFamily: 'var(--body)',
    fontSize: 'clamp(13px, 1.5vw, 14px)',
    fontWeight: 300,
    color: 'var(--muted)',
    lineHeight: 1.8,
    maxWidth: '480px',
    marginBottom: '36px',
    letterSpacing: '0.3px',
  },
  heroActions: {
    display: 'flex',
    gap: '12px',
    marginBottom: '40px',
    flexWrap: 'wrap',
  },
  badges: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  badge: {
    fontFamily: 'var(--mono)',
    fontSize: 'clamp(11px, 1.2vw, 13px)',
    letterSpacing: '1.5px',
    padding: '5px 10px',
    border: '1px solid',
  },
  heroRight: {
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--surface)',
    padding: 'clamp(20px, 4vw, 32px)',
    justifyContent: 'center',
  },
  marketPreview: {
    border: '1px solid var(--border)',
    background: 'linear-gradient(180deg, rgba(0,255,106,0.04), rgba(255,255,255,0.015))',
    padding: 'clamp(18px, 3vw, 28px)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  marketTag: {
    fontFamily: 'var(--mono)',
    fontSize: '10px',
    color: 'var(--g)',
    letterSpacing: '2.5px',
  },
  marketTitle: {
    fontFamily: 'var(--display)',
    fontSize: 'clamp(20px, 3vw, 28px)',
    lineHeight: 1.06,
    letterSpacing: '1px',
  },
  marketCopy: {
    fontFamily: 'var(--mono)',
    fontSize: '12px',
    lineHeight: 1.7,
    color: 'var(--muted)',
  },
  marketStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '12px',
    marginTop: '4px',
  },
  marketStat: {
    border: '1px solid var(--border)',
    padding: '14px',
    background: 'rgba(255,255,255,0.02)',
  },
  marketStatValue: {
    fontFamily: 'var(--display)',
    fontSize: '22px',
    color: 'var(--text)',
    marginBottom: '6px',
  },
  marketStatLabel: {
    fontFamily: 'var(--mono)',
    fontSize: '11px',
    color: 'var(--dim)',
    letterSpacing: '1.5px',
  },
};
