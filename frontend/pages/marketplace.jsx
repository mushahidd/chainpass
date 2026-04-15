import { useState, useEffect } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import Navbar from '../components/Navbar';
import Ticker from '../components/Ticker';
import MintForm from '../components/MintForm';
import StadiumMap from '../components/StadiumMap';
import { STADIUM_ENCLOSURES } from '../utils/stadiumData';

const ParticleBackground = dynamic(() => import('../components/ParticleBackground'), { ssr: false });

export default function Marketplace() {
  return (
    <>
      <Head>
        <title>Marketplace | ChainPass PSL</title>
        <meta name="description" content="Buy PSL tickets and monitor live demand on ChainPass." />
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
                <span style={styles.eyebrowText}>// MARKETPLACE_EXCHANGE</span>
              </div>
              <h1 style={styles.title}>BUY TICKETS IN WIRE.</h1>
              <p style={styles.desc}>
                This page is dedicated to ticket purchases. The lifetime leaderboard now lives on its own page.
              </p>
            </header>

            <div className="market-grid" style={styles.marketGrid}>
              <div style={styles.marketShell}>
                <MintForm />
              </div>
              <div className="market-map" style={styles.mapShell}>
                <MintMapBridge />
              </div>
            </div>
          </main>
        </div>
      </div>

      <div dangerouslySetInnerHTML={{ __html: `<style>
        @media (max-width: 960px) {
          .market-grid { grid-template-columns: 1fr !important; }
          .market-map { order: -1; }
        }
      </style>` }} />
    </>
  );
}

function MintMapBridge() {
  // Listen to MintForm's selected match via a shared DOM attribute
  const [stadiumName, setStadiumName] = useState('');
  const [allEnclosures, setAllEnclosures] = useState([]);
  const [activeEnclosures, setActiveEnclosures] = useState([]);

  useEffect(() => {
    const updateMapData = () => {
      const el = document.querySelector('[data-stadium-name]');
      if (el) {
        const name = el.getAttribute('data-stadium-name');
        const activeEncStr = el.getAttribute('data-active-enclosures');
        let activeNames = [];
        try {
          if (activeEncStr) activeNames = JSON.parse(activeEncStr);
        } catch (e) {}

        if (name && (name !== stadiumName || activeNames.length !== activeEnclosures.length)) {
          setStadiumName(name);
          const fullEnclosures = STADIUM_ENCLOSURES[name] || [];
          setAllEnclosures(fullEnclosures);
          setActiveEnclosures(fullEnclosures.filter(enc => activeNames.includes(enc.name)));
        }
      }
    };

    const observer = new MutationObserver(updateMapData);
    observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['data-stadium-name', 'data-active-enclosures'] });
    updateMapData(); // Initial check

    return () => observer.disconnect();
  }, [stadiumName, activeEnclosures.length]);

  if (!stadiumName || allEnclosures.length === 0) {
    return (
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '4px', padding: '40px 24px', textAlign: 'center',
      }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px' }}>
          SELECT A MATCH TO VIEW STADIUM MAP
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', padding: 'clamp(16px, 3vw, 24px)' }}>
      <StadiumMap
        allEnclosures={allEnclosures}
        activeEnclosures={activeEnclosures}
        stadiumName={stadiumName}
      />
    </div>
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
    fontSize: 'clamp(36px, 7vw, 72px)',
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
  marketGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr min(380px, 100%)',
    gap: 'clamp(20px, 4vw, 32px)',
    alignItems: 'start',
  },
  marketShell: {
    width: '100%',
  },
  mapShell: {
    position: 'sticky',
    top: '100px',
  },
};