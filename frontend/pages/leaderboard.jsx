import Head from 'next/head';
import dynamic from 'next/dynamic';
import Navbar from '../components/Navbar';
import Ticker from '../components/Ticker';
import Leaderboard from '../components/Leaderboard';

const ParticleBackground = dynamic(() => import('../components/ParticleBackground'), { ssr: false });

export default function LeaderboardPage() {
  return (
    <>
      <Head>
        <title>Leaderboard | ChainPass PSL</title>
        <meta name="description" content="Track the lifetime ticket leaderboard on ChainPass." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{ position: 'relative', minHeight: '100vh' }}>
        <ParticleBackground />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Navbar />
          <Ticker />

          <main style={styles.main}>
            <header style={styles.header}>
              <div style={styles.eyebrow}>
                <div style={styles.dot} />
                <span style={styles.eyebrowText}>// LIFETIME_LEADERBOARD</span>
              </div>
              <h1 style={styles.title}>TOP WALLETS BY TOTAL TICKETS.</h1>
              <p style={styles.desc}>
                This page ranks wallet addresses by the number of PSL tickets they have minted across all time.
              </p>
            </header>

            <div style={styles.content}>
              <Leaderboard />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

const styles = {
  main: {
    padding: 'clamp(32px, 6vw, 56px) clamp(16px, 5vw, 48px) clamp(40px, 8vw, 80px)',
    maxWidth: '1440px',
    margin: '0 auto',
  },
  header: {
    marginBottom: 'clamp(28px, 5vw, 44px)',
    maxWidth: '840px',
  },
  eyebrow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '16px',
  },
  dot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: 'var(--g)',
    boxShadow: '0 0 18px rgba(0,255,106,0.6)',
    flexShrink: 0,
  },
  eyebrowText: {
    fontFamily: 'var(--mono)',
    fontSize: '10px',
    color: 'var(--muted)',
    letterSpacing: '2.5px',
  },
  title: {
    fontFamily: 'var(--display)',
    fontSize: 'clamp(32px, 6vw, 72px)',
    lineHeight: 0.96,
    letterSpacing: '1px',
    marginBottom: '16px',
  },
  desc: {
    fontFamily: 'var(--mono)',
    fontSize: 'clamp(11px, 2vw, 13px)',
    lineHeight: 1.8,
    color: 'var(--muted)',
    maxWidth: '760px',
  },
  content: {
    width: '100%',
    maxWidth: '1040px',
    overflowX: 'auto',
  },
};