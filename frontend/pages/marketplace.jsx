import Head from 'next/head';
import dynamic from 'next/dynamic';
import Navbar from '../components/Navbar';
import Ticker from '../components/Ticker';
import MintForm from '../components/MintForm';

const ParticleBackground = dynamic(() => import('../components/ParticleBackground'), { ssr: false });

export default function Marketplace() {
  return (
    <>
      <Head>
        <title>Marketplace | ChainPass PSL</title>
        <meta name="description" content="Buy PSL tickets and monitor live demand on ChainPass." />
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
                <span style={styles.eyebrowText}>// MARKETPLACE_EXCHANGE</span>
              </div>
              <h1 style={styles.title}>BUY TICKETS IN WIRE.</h1>
              <p style={styles.desc}>
                This page is dedicated to ticket purchases. The lifetime leaderboard now lives on its own page.
              </p>
            </header>

            <div style={styles.marketShell}>
              <MintForm />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

const styles = {
  main: {
    padding: '56px 48px 80px',
    maxWidth: '1440px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '44px',
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
  },
  eyebrowText: {
    fontFamily: 'var(--mono)',
    fontSize: '10px',
    color: 'var(--muted)',
    letterSpacing: '2.5px',
  },
  title: {
    fontFamily: 'var(--display)',
    fontSize: 'clamp(40px, 5vw, 72px)',
    lineHeight: 0.96,
    letterSpacing: '1px',
    marginBottom: '16px',
  },
  desc: {
    fontFamily: 'var(--mono)',
    fontSize: '13px',
    lineHeight: 1.8,
    color: 'var(--muted)',
    maxWidth: '760px',
  },
  marketShell: {
    maxWidth: '760px',
  },
};