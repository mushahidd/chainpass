import { useEffect, useState } from 'react';
import Head from 'next/head';
import { ethers } from 'ethers';
import Navbar from '../components/Navbar';
import Ticker from '../components/Ticker';
import TxConfirmModal from '../components/TxConfirmModal';
import { useWeb3, WEB3_UI_STATES } from '../utils/Web3Context';

export default function Marketplace() {
  const {
    contract,
    walletAddress,
    contractReady,
    currentState,
    runTransaction,
    errorMessage,
    isCorrectNetwork,
    connectWallet,
  } = useWeb3();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingTicket, setPendingTicket] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const txPending = currentState === WEB3_UI_STATES.TX_PENDING;

  const loadTickets = async () => {
    if (!contract || !contractReady || !isCorrectNetwork) {
      setTickets([]);
      return;
    }

    setLoading(true);
    try {
      const total = await contract.totalSupply();
      const items = [];
      for (let i = 0; i < Number(total); i++) {
        const ticket = await contract.getTicket(i);
        if (!ticket.isForSale) continue;

        const owner = await contract.ownerOf(i);
        items.push({
          id: i,
          originalPrice: ethers.formatEther(ticket.originalPrice),
          currentPrice: ethers.formatEther(ticket.currentPrice),
          matchDetails: ticket.matchDetails,
          owner,
        });
      }
      setTickets(items);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [contractReady, contract, isCorrectNetwork]);

  const openBuyConfirm = (ticket) => {
    setPendingTicket(ticket);
    setConfirmOpen(true);
  };

  const executePurchase = async () => {
    if (!pendingTicket || !contract) return;

    setConfirmBusy(true);
    const hash = await runTransaction(() =>
      contract.buyTicket(pendingTicket.id, {
        value: ethers.parseEther(pendingTicket.currentPrice),
      })
    );

    setConfirmBusy(false);
    setConfirmOpen(false);

    if (hash) {
      await loadTickets();
    }
  };

  const cardStateStyle = !walletAddress || !isCorrectNetwork
    ? styles.cardDisabled
    : txPending
      ? styles.cardPending
      : styles.cardReady;

  return (
    <>
      <Head>
        <title>Marketplace | ChainPass PSL</title>
      </Head>

      <div className="marketplace-page" style={styles.page}>
        <Navbar />
        <Ticker />

        <main className="marketplace-main page-fade-in" style={styles.main}>
          <header className="marketplace-header" style={styles.header}>
            <div style={styles.secTag}>Marketplace</div>
            <h1 className="marketplace-title" style={styles.title}>Live Listings</h1>
            <p style={styles.desc}>
              Every listing is validated on-chain. The UI reflects exact wallet and network state before you execute.
            </p>
            <div className="marketplace-badges" style={styles.badges}>
              <span style={styles.badge}>STATE: {currentState}</span>
              <span style={styles.badge}>CONTRACT_READY: {contractReady ? 'YES' : 'NO'}</span>
              <span style={styles.badge}>WALLET: {walletAddress ? 'CONNECTED' : 'DISCONNECTED'}</span>
            </div>
            {errorMessage ? <div style={styles.errorBox}>ERROR: {errorMessage}</div> : null}
          </header>

          {!walletAddress ? (
            <div className="marketplace-empty premium-card" style={styles.emptyBox}>
              <div style={styles.emptyTitle}>WALLET NOT CONNECTED</div>
              <p style={styles.emptyText}>Connect MetaMask to initialize market reads and purchases.</p>
              <button style={styles.ctaButton} className="primary-action" onClick={connectWallet}>CONNECT WALLET</button>
            </div>
          ) : loading ? (
            <div className="marketplace-grid" style={styles.grid}>
              {[1, 2, 3, 4, 5, 6].map((key) => (
                <article key={key} style={styles.skeletonCard} className="premium-card marketplace-skeleton-card">
                  <div style={{ ...styles.skeletonLine, width: '34%' }} className="skeleton" />
                  <div style={{ ...styles.skeletonLine, width: '72%', height: '26px', marginTop: '14px' }} className="skeleton" />
                  <div style={{ ...styles.skeletonLine, width: '46%', marginTop: '10px' }} className="skeleton" />
                  <div style={styles.skeletonMetrics}>
                    <div style={{ ...styles.skeletonMetricBox }} className="skeleton" />
                    <div style={{ ...styles.skeletonMetricBox }} className="skeleton" />
                  </div>
                  <div style={{ ...styles.skeletonLine, width: '82%', marginTop: '12px' }} className="skeleton" />
                  <div style={{ ...styles.skeletonButton }} className="skeleton" />
                </article>
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="marketplace-empty premium-card" style={styles.emptyBox}>
              <div style={styles.emptyTitle}>No active listings yet</div>
              <p style={styles.emptyText}>When fans list tickets for resale, they will appear here instantly.</p>
            </div>
          ) : (
            <div className="marketplace-grid" style={styles.grid}>
              {tickets.map((ticket, index) => {
                const canBuy = walletAddress && isCorrectNetwork && contractReady && !txPending;
                const [match, seat] = ticket.matchDetails.split('|');
                return (
                  <article
                    className="premium-card premium-card-hover marketplace-card"
                    key={ticket.id}
                    style={{ ...styles.card, ...cardStateStyle, animationDelay: `${index * 55}ms` }}
                  >
                    <div style={styles.cardHead}>
                      <span style={styles.token}>#NFT_{String(ticket.id).padStart(3, '0')}</span>
                      <span style={styles.stateChip}>{canBuy ? 'READY' : 'BLOCKED'}</span>
                    </div>

                    <h3 style={styles.match}>{match}</h3>
                    <p style={styles.seat}>{seat || 'STANDARD ADMISSION'}</p>

                    <div className="marketplace-metrics" style={styles.metrics}>
                      <div style={styles.metricBox}>
                        <div style={styles.metricLabel}>MINT PRICE</div>
                        <div style={styles.metricValue}>{ticket.originalPrice} ETH</div>
                      </div>
                      <div style={styles.metricBox}>
                        <div style={styles.metricLabel}>RESALE PRICE</div>
                        <div style={{ ...styles.metricValue, color: 'var(--gold)' }}>{ticket.currentPrice} ETH</div>
                      </div>
                    </div>

                    <div style={styles.owner}>SELLER: {ticket.owner.slice(0, 12)}...{ticket.owner.slice(-8)}</div>

                    <button
                      className="primary-action"
                      style={{ ...styles.buyButton, ...(canBuy ? {} : styles.buyDisabled) }}
                      onClick={() => openBuyConfirm(ticket)}
                      disabled={!canBuy}
                    >
                      {txPending ? 'PROCESSING TX...' : 'PURCHASE TICKET'}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>

      <TxConfirmModal
        open={confirmOpen}
        title={pendingTicket ? `Buy #NFT_${String(pendingTicket.id).padStart(3, '0')}` : ''}
        details={pendingTicket ? `match: ${pendingTicket.matchDetails}\nprice: ${pendingTicket.currentPrice} ETH\nnetwork: WireFluid (92533)` : ''}
        onConfirm={executePurchase}
        onCancel={() => setConfirmOpen(false)}
        pending={confirmBusy}
      />
    </>
  );
}

const styles = {
  page: {
    background: 'radial-gradient(circle at 12% -12%, rgba(0,255,106,0.1), transparent 42%), radial-gradient(circle at 88% 120%, rgba(232,184,75,0.08), transparent 42%), var(--bg)',
    minHeight: '100vh',
    color: 'var(--text)',
  },
  main: {
    maxWidth: '1240px',
    margin: '0 auto',
    padding: '56px 24px 88px',
  },
  header: { marginBottom: '40px' },
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
    flexWrap: 'wrap',
    gap: '8px',
  },
  badge: {
    fontFamily: 'var(--body)',
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '0.4px',
    color: 'var(--gold)',
    border: '1px solid rgba(232,184,75,0.4)',
    borderRadius: '999px',
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
    fontSize: '13px',
    color: 'var(--g)',
  },
  emptyBox: {
    padding: '34px',
    borderRadius: '18px',
  },
  emptyTitle: {
    fontFamily: 'var(--display)',
    fontSize: '30px',
    letterSpacing: '-0.02em',
    fontWeight: 700,
    color: 'var(--text)',
  },
  emptyText: {
    marginTop: '10px',
    fontFamily: 'var(--body)',
    color: 'var(--muted)',
    fontSize: '15px',
  },
  ctaButton: {
    marginTop: '16px',
    fontFamily: 'var(--body)',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.4px',
    padding: '12px 16px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px',
  },
  skeletonCard: {
    padding: '20px',
    borderRadius: '16px',
  },
  skeletonLine: {
    height: '12px',
    borderRadius: '8px',
  },
  skeletonMetrics: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    marginTop: '14px',
  },
  skeletonMetricBox: {
    height: '44px',
    borderRadius: '10px',
  },
  skeletonButton: {
    height: '42px',
    borderRadius: '12px',
    marginTop: '18px',
  },
  card: {
    padding: '22px',
    animation: 'fadeInUp 280ms ease-in-out both',
  },
  cardReady: {
    borderColor: 'rgba(0,255,106,0.42)',
  },
  cardDisabled: {
    opacity: 0.62,
    filter: 'saturate(0.75)',
  },
  cardPending: {
    borderColor: 'rgba(232,184,75,0.52)',
    animation: 'pulseSoft 1.8s ease-in-out infinite',
  },
  cardHead: {
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
  stateChip: {
    fontFamily: 'var(--body)',
    color: 'var(--gold)',
    border: '1px solid rgba(232,184,75,0.45)',
    borderRadius: '999px',
    padding: '4px 9px',
    fontSize: '9px',
    fontWeight: 600,
    letterSpacing: '0.5px',
  },
  match: {
    fontFamily: 'var(--display)',
    fontSize: '28px',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    marginBottom: '5px',
  },
  seat: {
    fontFamily: 'var(--body)',
    color: 'var(--muted)',
    fontSize: '12px',
    marginBottom: '16px',
  },
  metrics: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    marginBottom: '14px',
  },
  metricBox: {
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.03)',
    padding: '12px',
  },
  metricLabel: {
    fontFamily: 'var(--body)',
    fontSize: '9px',
    color: 'var(--dim)',
    marginBottom: '5px',
    fontWeight: 600,
    letterSpacing: '0.4px',
  },
  metricValue: {
    fontFamily: 'var(--body)',
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text)',
  },
  owner: {
    fontFamily: 'var(--mono)',
    fontSize: '10px',
    color: 'var(--muted)',
    marginBottom: '16px',
    wordBreak: 'break-all',
  },
  buyButton: {
    width: '100%',
    fontFamily: 'var(--body)',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.4px',
    padding: '12px 14px',
    borderRadius: '12px',
  },
  buyDisabled: {
    borderColor: 'rgba(255,255,255,0.1)',
    color: 'var(--muted)',
    background: 'rgba(255,255,255,0.03)',
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
};
