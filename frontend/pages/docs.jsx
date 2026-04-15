import Head from 'next/head';
import Navbar from '../components/Navbar';
import Ticker from '../components/Ticker';

export default function Docs() {
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || 'Not configured';

  const sections = [
    {
      tag: '01',
      title: 'THE_MISSION',
      content: 'ChainPass PSL was built to solve the systemic problem of ticket scalping in Pakistan\'s premier cricket league. Conventionally, fans are forced to pay 5x-10x the original price on the black market. We use the blockchain to ensure that the code is the law.'
    },
    {
      tag: '02',
      title: 'ANTI_SCALP_ENFORCEMENT',
      content: 'Every ticket is a unique NFT. Our smart contract contains a hard-coded "Price Cap" logic. No ticket can be listed for more than 110% of its original mint price. If a seller tries to list it for more, the blockchain transaction itself is rejected.'
    },
    {
      tag: '03',
      title: 'ROYALTY_DISTRIBUTION',
      content: 'On every secondary sale, 3% of the transaction value is automatically routed back to the PCB (Pakistan Cricket Board) vault. This ensures the organizers benefit from the ecosystem\'s growth while fans get fair prices.'
    },
    {
      tag: '04',
      title: 'SECURE_ENTRY_QR',
      content: 'To prevent screenshot fraud, entry QR codes are generated dynamically. They require a cryptographic signature from the owner\'s private key and refresh every 60 seconds. Your ticket is tied to your wallet, and only you can produce a valid gate entry token.'
    }
  ];

  return (
    <>
      <Head>
        <title>Protocol Docs | ChainPass PSL</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={styles.container}>
        <Navbar />
        <Ticker />

        <main style={styles.main}>
          <div className="docs-wrapper" style={styles.docWrapper}>
            {/* Sidebar */}
            <aside className="docs-sidebar" style={styles.sidebar}>
              <div style={styles.sideLabel}>// SYSTEM_DOCUMENTATION</div>
              <ul style={styles.sideList}>
                {sections.map(s => (
                  <li key={s.tag} style={styles.sideItem}>
                    <span style={styles.sideNum}>{s.tag}</span>
                    <span>{s.title}</span>
                  </li>
                ))}
              </ul>
              <div style={styles.contractBox}>
                <div style={styles.detLabel}>CONTRACT_ADDRESS</div>
                <div style={styles.address}>{contractAddress}</div>
              </div>
            </aside>

            {/* Main content */}
            <section style={styles.content}>
              <header style={styles.header}>
                <div style={styles.secTag}>// TECHNICAL_OVERVIEW</div>
                <h1 style={styles.title}>PROTOCOL_ARCHITECTURE</h1>
              </header>

              <div style={styles.sections}>
                {sections.map(s => (
                  <div key={s.tag} style={styles.docSection}>
                    <div style={styles.secLine} />
                    <div style={styles.secHeader}>
                      <span style={styles.secNum}>{s.tag}</span>
                      <h2 style={styles.secTitle}>{s.title}</h2>
                    </div>
                    <div style={styles.secText}>{s.content}</div>
                  </div>
                ))}
              </div>

              <div style={styles.footerInfo}>
                <div style={styles.infoHex}>i</div>
                <p style={styles.footerText}>
                  This system is configured for <strong>WireFluid Testnet</strong> (Chain ID: <strong>92533</strong>){' '}
                  using RPC <strong>https://evm.wirefluid.com</strong>.
                </p>
              </div>
            </section>
          </div>
        </main>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .docs-wrapper { grid-template-columns: 1fr !important; }
          .docs-sidebar { position: static !important; display: flex; flex-direction: column; gap: 16px; border-bottom: 1px solid var(--border); padding-bottom: 28px; margin-bottom: 8px; }
        }
      `}</style>
    </>
  );
}

const styles = {
  container: { background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' },
  main: {
    padding: 'clamp(32px, 6vw, 60px) clamp(16px, 5vw, 48px)',
    maxWidth: '1440px',
    margin: '0 auto',
  },
  docWrapper: {
    display: 'grid',
    gridTemplateColumns: 'clamp(200px, 25vw, 300px) 1fr',
    gap: 'clamp(32px, 6vw, 80px)',
  },
  sidebar: {
    position: 'sticky',
    top: '100px',
    alignSelf: 'start',
    height: 'fit-content',
  },
  sideLabel: {
    fontFamily: 'var(--mono)',
    fontSize: '10px',
    color: 'var(--dim)',
    letterSpacing: '2px',
    marginBottom: '28px',
  },
  sideList: { listStyle: 'none', padding: 0, margin: '0 0 48px 0' },
  sideItem: {
    fontFamily: 'var(--mono)',
    fontSize: '11px',
    color: 'var(--muted)',
    marginBottom: '18px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    letterSpacing: '1px',
    transition: 'color 0.2s',
  },
  sideNum: { color: 'var(--g)', fontSize: '10px', flexShrink: 0 },
  contractBox: {
    background: 'rgba(255,255,255,0.02)',
    padding: '16px',
    border: '1px solid var(--border)',
    borderRadius: '4px',
  },
  detLabel: { fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', marginBottom: '8px', letterSpacing: '1.5px' },
  address: { fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--g)', wordBreak: 'break-all' },
  content: { minWidth: 0 },
  header: {
    marginBottom: 'clamp(40px, 6vw, 80px)',
    borderBottom: '1px solid var(--border)',
    paddingBottom: 'clamp(24px, 4vw, 40px)',
  },
  secTag: {
    fontFamily: 'var(--mono)',
    fontSize: '10px',
    color: 'var(--muted)',
    letterSpacing: '3px',
    marginBottom: '12px',
  },
  title: {
    fontFamily: 'var(--display)',
    fontSize: 'clamp(32px, 5vw, 56px)',
    letterSpacing: '2px',
    lineHeight: 1.0,
  },
  sections: { display: 'flex', flexDirection: 'column', gap: 'clamp(40px, 7vw, 80px)' },
  docSection: { position: 'relative' },
  secLine: {
    width: '32px',
    height: '2px',
    background: 'var(--g)',
    marginBottom: '20px',
    boxShadow: '0 0 8px rgba(0,255,106,0.4)',
  },
  secHeader: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' },
  secNum: { fontFamily: 'var(--display)', fontSize: '28px', color: 'var(--border2)', flexShrink: 0 },
  secTitle: { fontFamily: 'var(--display)', fontSize: 'clamp(20px, 3vw, 28px)', letterSpacing: '2px' },
  secText: {
    fontFamily: 'var(--body)',
    fontSize: 'clamp(14px, 2vw, 17px)',
    color: 'var(--muted)',
    lineHeight: 1.8,
  },
  footerInfo: {
    marginTop: 'clamp(48px, 8vw, 100px)',
    padding: 'clamp(20px, 4vw, 32px)',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    display: 'flex',
    gap: '20px',
    alignItems: 'flex-start',
    borderRadius: '4px',
    flexWrap: 'wrap',
  },
  infoHex: {
    width: '32px',
    height: '32px',
    background: 'var(--dim)',
    clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--mono)',
    fontSize: '12px',
    color: 'var(--bg)',
    flexShrink: 0,
  },
  footerText: {
    fontFamily: 'var(--mono)',
    fontSize: 'clamp(11px, 1.5vw, 12px)',
    color: 'var(--dim)',
    lineHeight: 1.7,
    flex: 1,
  },
};
