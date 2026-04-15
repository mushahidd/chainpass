import Head from 'next/head';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Ticker from '../components/Ticker';
import StatsBand from '../components/StatsBand';
import FeaturesSection from '../components/FeaturesSection';
import HowItWorks from '../components/HowItWorks';
import DemoSection from '../components/DemoSection';
import { ScaleSection, CTASection, Footer } from '../components/FooterSections';

const ParticleBackground = dynamic(() => import('../components/ParticleBackground'), { ssr: false });

export default function Home() {
  return (
    <>
      <Head>
        <title>ChainPass PSL — Blockchain Ticketing</title>
        <meta name="description" content="PSL tickets as NFTs. Price cap enforced by smart contract. No scalping. No fakes." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
      </Head>

      <div style={{ position: 'relative', minHeight: '100vh' }}>
        <ParticleBackground />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Navbar />
          <Ticker />

          {/* HERO */}
          <section className="page-home-hero" style={styles.hero}>
            <div className="page-home-hero-left" style={styles.heroLeft}>
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

              <div className="page-home-badges" style={styles.badges}>
                {[
                  { label: 'POLYGON_MAINNET', gold: false },
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

            <div className="page-home-hero-right" style={styles.heroRight}>
              <div className="page-home-market-preview" style={styles.marketPreview}>
                <div style={styles.marketTag}>// MARKETPLACE</div>
                <h2 style={styles.marketTitle}>
                  <span style={styles.marketAccentGreen}>BUY TICKETS</span>, SEE THE LEADERBOARD, AND{' '}
                  <span style={styles.marketAccentGold}>TRACK LIVE DEMAND</span>.
                </h2>
                <p style={styles.marketCopy}>
                  The purchasing flow now lives in the marketplace. Use it to mint tickets, then watch the leaderboard update as the lifetime ticket counts shift.
                </p>
                <Link href="/marketplace" className="nav-cta nav-cta--dark">OPEN_MARKETPLACE ↗</Link>
                <div className="page-home-market-stats" style={styles.marketStats}>
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

          <StatsBand />
          <FeaturesSection />
          <HowItWorks />
          <DemoSection />
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
      `}</style>
    </>
  );
}

const styles = {
  hero: {
    minHeight: '88vh',
    display: 'grid',
    gridTemplateColumns: '1fr 440px',
    alignItems: 'stretch',
    borderBottom: '1px solid var(--border)',
  },
  heroLeft: {
    padding: '80px 48px',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  eyebrow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '32px',
  },
  pulseDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: 'var(--g)',
    animation: 'pulse 2s ease-in-out infinite',
  },
  eyebrowText: {
    fontFamily: 'var(--mono)',
    fontSize: '10px',
    letterSpacing: '2.5px',
    color: 'var(--muted)',
  },
  heroTitle: {
    fontFamily: 'var(--display)',
    fontSize: 'clamp(64px, 8vw, 108px)',
    lineHeight: 0.92,
    letterSpacing: '2px',
    color: 'var(--text)',
    marginBottom: '24px',
  },
  heroDesc: {
    fontFamily: 'var(--body)',
    fontSize: '15px',
    fontWeight: 400,
    color: 'var(--text)',
    lineHeight: 1.8,
    maxWidth: '480px',
    marginBottom: '40px',
    letterSpacing: '0.3px',
    opacity: 0.9,
  },
  heroActions: {
    display: 'flex',
    gap: '12px',
    marginBottom: '48px',
  },
  badges: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  badge: {
    fontFamily: 'var(--mono)',
    fontSize: '9px',
    letterSpacing: '1.5px',
    padding: '5px 12px',
    border: '1px solid',
  },
  heroRight: {
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--surface)',
    padding: '32px',
    justifyContent: 'center',
  },
  marketPreview: {
    border: '1px solid var(--border)',
    background: 'linear-gradient(180deg, rgba(0,255,106,0.04), rgba(255,255,255,0.015))',
    padding: '28px',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  marketTag: {
    fontFamily: 'var(--mono)',
    fontSize: '10px',
    color: 'var(--g)',
    letterSpacing: '2.5px',
  },
  marketTitle: {
    fontFamily: 'var(--display)',
    fontSize: '28px',
    lineHeight: 1.06,
    letterSpacing: '1px',
    color: 'var(--text)',
    textShadow: '0 0 14px rgba(255, 255, 255, 0.06)',
  },
  marketAccentGreen: {
    color: 'var(--g)',
    textShadow: '0 0 14px rgba(0, 255, 106, 0.25)',
  },
  marketAccentGold: {
    color: 'var(--gold)',
    textShadow: '0 0 12px rgba(232, 184, 75, 0.24)',
  },
  marketCopy: {
    fontFamily: 'var(--mono)',
    fontSize: '13px',
    lineHeight: 1.7,
    color: 'var(--text)',
    opacity: 0.88,
  },
  marketStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '12px',
    marginTop: '6px',
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
    fontSize: '9px',
    color: 'var(--dim)',
    letterSpacing: '1.5px',
  },
};
