import { useEffect, useState } from 'react';
import Head from 'next/head';
import { ethers } from 'ethers';
import Navbar from '../components/Navbar';
import Ticker from '../components/Ticker';
import TxConfirmModal from '../components/TxConfirmModal';
import { useWeb3, WEB3_UI_STATES } from '../utils/Web3Context';

function makeQRPattern(seed) {
  const cells = [];
  let value = seed;
  for (let i = 0; i < 49; i++) {
    value = (value * 1664525 + 1013904223) >>> 0;
    cells.push((value >>> 28) > 5);
  }
  return cells;
}

function QRCode({ id }) {
  const [cells, setCells] = useState(() => makeQRPattern(Date.now()));
  const [timer, setTimer] = useState(30);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          setCells(makeQRPattern(Date.now() + id));
          return 30;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [id]);

  return (
    <div style={styles.qrCard}>
      <div style={styles.qrGrid}>
        {cells.map((on, i) => (
          <div key={i} style={{ ...styles.qrCell, background: on ? 'var(--g)' : 'rgba(255,255,255,0.02)' }} />
        ))}
      </div>
      <div style={styles.qrMeta}>DYNAMIC ENTRY TOKEN · TTL {timer}s</div>
    </div>
  );
}

export default function Tickets() {
  const {
    contract,
    walletAddress,
    isCorrectNetwork,
    contractReady,
    runTransaction,
    currentState,
    errorMessage,
    connectWallet,
  } = useWeb3();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listPriceById, setListPriceById] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingListing, setPendingListing] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const txPending = currentState === WEB3_UI_STATES.TX_PENDING;

  const loadMyTickets = async () => {
    if (!contract || !walletAddress || !isCorrectNetwork || !contractReady) {
      setTickets([]);
      return;
    }

    setLoading(true);
    try {
      const total = await contract.totalSupply();
      const owned = [];

      for (let i = 0; i < Number(total); i++) {
        const owner = await contract.ownerOf(i);
        if (owner.toLowerCase() !== walletAddress.toLowerCase()) continue;

        const ticket = await contract.getTicket(i);
        owned.push({
          id: i,
          originalPrice: ethers.formatEther(ticket.originalPrice),
          currentPrice: ethers.formatEther(ticket.currentPrice),
          isForSale: ticket.isForSale,
          matchDetails: ticket.matchDetails,
        });
      }

      setTickets(owned);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyTickets();
  }, [contractReady, contract, walletAddress, isCorrectNetwork]);

  const openListConfirm = (ticket) => {
    const askedPrice = listPriceById[ticket.id] || '';
    if (!askedPrice) return;

    const parsedPrice = parseFloat(askedPrice);
    const maxAllowed = parseFloat(ticket.originalPrice) * 1.1;

    if (Number.isNaN(parsedPrice) || parsedPrice <= 0 || parsedPrice > maxAllowed) {
      return;
    }

    setPendingListing({ ticket, askedPrice });
    setConfirmOpen(true);
  };

  const executeListing = async () => {
    if (!pendingListing || !contract) return;

    setConfirmBusy(true);
    const hash = await runTransaction(() =>
      contract.listTicket(pendingListing.ticket.id, ethers.parseEther(pendingListing.askedPrice))
    );
    setConfirmBusy(false);
    setConfirmOpen(false);

    if (hash) {
      setListPriceById((prev) => ({ ...prev, [pendingListing.ticket.id]: '' }));
      await loadMyTickets();
    }
  };

  return (
    <>
      <Head>
        <title>My Tickets | ChainPass PSL</title>
      </Head>

      <div className="tickets-page" style={styles.page}>
        <Navbar />
        <Ticker />

        <main className="tickets-main page-fade-in" style={styles.main}>
          <header className="tickets-header" style={styles.header}>
            <div style={styles.secTag}>My Vault</div>
            <h1 className="tickets-title" style={styles.title}>My Tickets</h1>
            <p style={styles.desc}>List tickets with enforced anti-scalp constraints and on-chain confirmation visibility.</p>
            <div className="tickets-badges" style={styles.badges}>
              <span style={styles.badge}>STATE: {currentState}</span>
              <span style={styles.badge}>WALLET: {walletAddress ? 'CONNECTED' : 'DISCONNECTED'}</span>
              <span style={styles.badge}>NETWORK: {isCorrectNetwork ? 'WIREFLUID' : 'BLOCKED'}</span>
            </div>
            {errorMessage ? <div style={styles.errorBox}>ERROR: {errorMessage}</div> : null}
          </header>

          {!walletAddress ? (
            <div className="tickets-empty premium-card" style={styles.emptyBox}>
              <div style={styles.emptyTitle}>Connect wallet to open your vault</div>
              <button style={styles.ctaButton} className="primary-action" onClick={connectWallet}>CONNECT WALLET</button>
            </div>
          ) : loading ? (
            <div className="tickets-grid" style={styles.grid}>
              {[1, 2, 3].map((key) => (
                <article key={key} style={styles.skeletonCard} className="premium-card tickets-skeleton-card">
                  <div style={{ ...styles.skeletonLine, width: '30%' }} className="skeleton" />
                  <div style={{ ...styles.skeletonLine, width: '64%', height: '28px', marginTop: '14px' }} className="skeleton" />
                  <div style={{ ...styles.skeletonLine, width: '46%', marginTop: '10px' }} className="skeleton" />
                  <div style={{ ...styles.skeletonLine, width: '55%', marginTop: '16px' }} className="skeleton" />
                  <div style={styles.skeletonInput} className="skeleton" />
                  <div style={styles.skeletonButton} className="skeleton" />
                </article>
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="tickets-empty premium-card" style={styles.emptyBox}>
              <div style={styles.emptyTitle}>No NFT tickets in your vault</div>
            </div>
          ) : (
            <div className="tickets-grid" style={styles.grid}>
              {tickets.map((ticket, index) => {
                const [match] = ticket.matchDetails.split('|');
                const userPrice = listPriceById[ticket.id] || '';
                const parsed = parseFloat(userPrice || '0');
                const maxAllowed = parseFloat(ticket.originalPrice) * 1.1;
                const validPrice = userPrice && parsed > 0 && parsed <= maxAllowed;
                const actionable = walletAddress && isCorrectNetwork && contractReady && !txPending;

                return (
                  <article
                    className="premium-card premium-card-hover tickets-card"
                    key={ticket.id}
                    style={{ ...styles.card, ...(actionable ? styles.cardReady : styles.cardBlocked), ...(txPending ? styles.cardPending : {}), animationDelay: `${index * 55}ms` }}
                  >
                    <div style={styles.cardHeader}>
                      <span style={styles.token}>#NFT_{String(ticket.id).padStart(3, '0')}</span>
                      <span style={styles.statusChip}>{ticket.isForSale ? 'LISTED' : 'VAULTED'}</span>
                    </div>

                    <div className="tickets-row" style={styles.rowLayout}>
                      <div style={styles.infoArea}>
                        <h3 style={styles.match}>{match}</h3>
                        <div style={styles.meta}>MINT PRICE: {ticket.originalPrice} ETH</div>
                        <div style={styles.meta}>MAX RESALE (110%): {maxAllowed.toFixed(4)} ETH</div>

                        {!ticket.isForSale ? (
                          <div className="tickets-listbox" style={styles.listBox}>
                            <input
                              type="number"
                              placeholder="Set resale price in ETH"
                              value={userPrice}
                              onChange={(e) => setListPriceById((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                              style={styles.input}
                              className="premium-input"
                            />
                            <button
                              className="primary-action"
                              style={{ ...styles.listBtn, ...(!validPrice || !actionable ? styles.listBtnBlocked : {}) }}
                              onClick={() => openListConfirm(ticket)}
                              disabled={!validPrice || !actionable}
                            >
                              {txPending ? 'PROCESSING TX...' : 'LIST TICKET'}
                            </button>
                            {userPrice && !validPrice ? (
                              <div style={styles.validation}>Invalid price: must be &gt; 0 and ≤ {maxAllowed.toFixed(4)} ETH</div>
                            ) : null}
                          </div>
                        ) : (
                          <div style={styles.listedText}>ACTIVE SALE ORDER ON CHAIN</div>
                        )}
                      </div>

                      <div className="tickets-qr">
                        <QRCode id={ticket.id} />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>

      <TxConfirmModal
        open={confirmOpen}
        title={pendingListing ? `List #NFT_${String(pendingListing.ticket.id).padStart(3, '0')}` : ''}
        details={pendingListing ? `match: ${pendingListing.ticket.matchDetails}\nresale price: ${pendingListing.askedPrice} ETH\nmax allowed (110%): ${(parseFloat(pendingListing.ticket.originalPrice) * 1.1).toFixed(4)} ETH\nnetwork: WireFluid (92533)` : ''}
        onConfirm={executeListing}
        onCancel={() => setConfirmOpen(false)}
        pending={confirmBusy}
      />
    </>
  );
}

const styles = {
  page: {
    background: 'radial-gradient(circle at 16% -18%, rgba(0,255,106,0.1), transparent 42%), radial-gradient(circle at 90% 118%, rgba(232,184,75,0.08), transparent 42%), var(--bg)',
    minHeight: '100vh',
    color: 'var(--text)',
  },
  main: {
    maxWidth: '1240px',
    margin: '0 auto',
    padding: '56px 24px 88px',
  },
  header: { marginBottom: '38px' },
  secTag: {
    fontFamily: 'var(--body)',
    color: 'var(--dim)',
    fontWeight: 600,
    fontSize: '13px',
    letterSpacing: '0.3px',
    marginBottom: '12px',
  },
  title: {
    fontFamily: 'var(--display)',
    fontSize: 'clamp(44px, 7vw, 64px)',
    fontWeight: 800,
    letterSpacing: '-0.04em',
    marginBottom: '14px',
    lineHeight: 1.05,
  },
  desc: {
    fontFamily: 'var(--body)',
    fontSize: '16px',
    color: 'var(--muted)',
    maxWidth: '700px',
    lineHeight: 1.75,
  },
  badges: {
    marginTop: '20px',
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  badge: {
    fontFamily: 'var(--body)',
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '0.4px',
    border: '1px solid rgba(232,184,75,0.4)',
    borderRadius: '999px',
    color: 'var(--gold)',
    background: 'rgba(232,184,75,0.08)',
    padding: '7px 12px',
  },
  errorBox: {
    marginTop: '12px',
    border: '1px solid rgba(255,107,107,0.42)',
    background: 'rgba(255,107,107,0.08)',
    color: '#ffc2c2',
    fontFamily: 'var(--body)',
    fontSize: '13px',
    borderRadius: '12px',
    padding: '11px 14px',
  },
  loading: {
    fontFamily: 'var(--body)',
    color: 'var(--g)',
    fontSize: '13px',
  },
  emptyBox: {
    padding: '34px',
    borderRadius: '18px',
  },
  emptyTitle: {
    fontFamily: 'var(--display)',
    fontSize: '30px',
    letterSpacing: '-0.02em',
    color: 'var(--text)',
    fontWeight: 700,
  },
  ctaButton: {
    marginTop: '14px',
    fontFamily: 'var(--body)',
    fontSize: '11px',
    fontWeight: 600,
    padding: '12px 16px',
    letterSpacing: '0.4px',
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  skeletonCard: {
    padding: '22px',
    borderRadius: '16px',
  },
  skeletonLine: {
    height: '12px',
    borderRadius: '8px',
  },
  skeletonInput: {
    height: '44px',
    borderRadius: '12px',
    marginTop: '16px',
  },
  skeletonButton: {
    height: '42px',
    borderRadius: '12px',
    marginTop: '10px',
  },
  card: {
    padding: '20px',
    animation: 'fadeInUp 280ms ease-in-out both',
  },
  cardReady: {
    borderColor: 'rgba(0,255,106,0.42)',
  },
  cardBlocked: {
    opacity: 0.62,
    filter: 'saturate(0.75)',
  },
  cardPending: {
    borderColor: 'rgba(232,184,75,0.52)',
    animation: 'pulseSoft 1.8s ease-in-out infinite',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
  },
  token: {
    fontFamily: 'var(--mono)',
    color: 'var(--dim)',
    fontSize: '10px',
    letterSpacing: '0.6px',
  },
  statusChip: {
    fontFamily: 'var(--body)',
    color: 'var(--gold)',
    border: '1px solid rgba(232,184,75,0.45)',
    borderRadius: '999px',
    padding: '4px 9px',
    fontSize: '9px',
    fontWeight: 600,
    letterSpacing: '0.5px',
  },
  rowLayout: {
    display: 'grid',
    gridTemplateColumns: '1fr minmax(180px, 230px)',
    gap: '18px',
    alignItems: 'center',
  },
  infoArea: { minWidth: 0 },
  match: {
    fontFamily: 'var(--display)',
    fontSize: '30px',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    marginBottom: '8px',
  },
  meta: {
    fontFamily: 'var(--body)',
    fontSize: '12px',
    color: 'var(--muted)',
    marginBottom: '6px',
  },
  listBox: {
    marginTop: '14px',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.03)',
    padding: '12px',
  },
  input: {
    width: '100%',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: 'var(--text)',
    fontFamily: 'var(--body)',
    fontSize: '14px',
    padding: '12px',
    marginBottom: '10px',
    outline: 'none',
  },
  listBtn: {
    width: '100%',
    fontFamily: 'var(--body)',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.4px',
    padding: '11px 12px',
    borderRadius: '12px',
  },
  listBtnBlocked: {
    borderColor: 'rgba(255,255,255,0.1)',
    color: 'var(--muted)',
    background: 'rgba(255,255,255,0.03)',
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  validation: {
    marginTop: '8px',
    fontFamily: 'var(--body)',
    fontSize: '12px',
    color: '#ff8f8f',
  },
  listedText: {
    marginTop: '12px',
    fontFamily: 'var(--body)',
    fontSize: '12px',
    color: 'var(--g)',
    fontWeight: 600,
    letterSpacing: '0.2px',
  },
  qrCard: {
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '14px',
    background: 'rgba(255,255,255,0.02)',
    padding: '14px',
  },
  qrGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '1.5px',
    width: '132px',
    height: '132px',
    margin: '0 auto',
  },
  qrCell: { borderRadius: '1px' },
  qrMeta: {
    marginTop: '12px',
    textAlign: 'center',
    fontFamily: 'var(--body)',
    fontSize: '9px',
    color: 'var(--muted)',
    letterSpacing: '0.4px',
  },
};
