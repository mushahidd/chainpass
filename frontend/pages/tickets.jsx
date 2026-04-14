import { useState, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Ticker from '../components/Ticker';
import { useWeb3 } from '../utils/Web3Context';
import { ethers } from 'ethers';

function makeQRPattern(seed) {
  const cells = [];
  let s = seed;
  for (let i = 0; i < 49; i++) {
    s = (s * 1664525 + 1013904223) >>> 0;
    cells.push((s >>> 28) > 5);
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
          <div key={i} style={{...styles.qrCell, background: on ? 'var(--g)' : 'rgba(255,255,255,0.02)'}} />
        ))}
      </div>
      <div style={styles.qrMeta}>
        <div style={styles.qrTimer}>TTL: {timer}s</div>
        <div style={styles.qrStatus}>SECURE_TOKEN</div>
      </div>
    </div>
  );
}

export default function MyTickets() {
  const { contract, account } = useWeb3();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listingId, setListingId] = useState(null);
  const [listPrice, setListPrice] = useState('');
  const [txStatus, setTxStatus] = useState({ type: '', message: '' });

  const getRevertReason = (err) => {
    return (
      err?.reason ||
      err?.shortMessage ||
      err?.info?.error?.message ||
      err?.error?.message ||
      err?.message ||
      'Unknown transaction error'
    );
  };

  useEffect(() => {
    if (contract && account) {
      loadMyTickets();
    } else {
      setLoading(false);
    }
  }, [contract, account]);

  const loadMyTickets = async () => {
    try {
      const total = await contract.totalSupply();
      const myItems = [];
      for (let i = 0; i < Number(total); i++) {
        const owner = await contract.ownerOf(i);
        if (owner.toLowerCase() === account.toLowerCase()) {
          const t = await contract.getTicket(i);
          myItems.push({
            id: i,
            originalPrice: ethers.formatEther(t.originalPrice),
            currentPrice: ethers.formatEther(t.currentPrice),
            isForSale: t.isForSale,
            matchDetails: t.matchDetails,
          });
        }
      }
      setTickets(myItems);
    } catch (err) {
      if (err?.code === "BAD_DATA" || err?.message?.includes("could not decode")) {
        console.warn("[MyTickets] Contract not found on current network. Deploy it first.");
      } else {
        console.error("Error loading tickets:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleList = async (id, originalPrice) => {
    if (!listPrice) {
      setTxStatus({ type: 'error', message: 'Please enter a price.' });
      return null;
    }

    if (!contract || !account) {
      setTxStatus({ type: 'error', message: 'Connect MetaMask first.' });
      return null;
    }

    const parsed = parseFloat(listPrice);
    if (Number.isNaN(parsed) || parsed <= 0) {
      setTxStatus({ type: 'error', message: 'Enter a valid price greater than 0.' });
      return null;
    }

    const maxAllowed = parseFloat(originalPrice) * 1.1;
    if (parsed > maxAllowed) {
      setTxStatus({
        type: 'error',
        message: `ANTI-SCALP ALERT: Max allowed price is ${maxAllowed.toFixed(4)} ETH (110% cap).`,
      });
      return null;
    }

    setListingId(id);
    setTxStatus({ type: '', message: '' });

    try {
      const network = await contract.runner.provider.getNetwork();
      const chainId = Number(network.chainId);
      const contractAddress = contract.target;

      console.log('[TX_DEBUG] wallet address:', account);
      console.log('[TX_DEBUG] network chainId:', chainId);
      console.log('[TX_DEBUG] contract address:', contractAddress);
      console.log('[TX_DEBUG] contract instance:', contract);

      const tx = await contract.listTicket(id, ethers.parseEther(listPrice));
      console.log('[TX_DEBUG] transaction hash:', tx.hash);

      const receipt = await tx.wait();
      console.log('[TX_DEBUG] confirmation block:', receipt.blockNumber);

      setTxStatus({
        type: 'success',
        message: `Success: ticket listed on-chain. Tx: ${tx.hash.slice(0, 10)}...`,
      });

      loadMyTickets();
      setListingId(null);
      setListPrice('');
      return tx.hash;
    } catch (err) {
      const reason = getRevertReason(err);
      console.error('Listing failed:', err);
      console.error('[TX_DEBUG] revert reason:', reason);
      setTxStatus({ type: 'error', message: `Transaction failed: ${reason}` });
      setListingId(null);
      return null;
    }
  };

  return (
    <>
      <Head>
        <title>Vault | ChainPass PSL</title>
      </Head>

      <div style={styles.container}>
        <Navbar />
        <Ticker />

        <main style={styles.main}>
          <header style={styles.header}>
            <div style={styles.secTag}>// FAN_VAULT</div>
            <h1 style={styles.title}>MY_COLLECTION</h1>
            <p style={styles.desc}>
              Manage your verified PSL tickets. View your secure entry tokens or list tickets for resale within fair-play limits.
            </p>
            {txStatus.message ? (
              <div style={{ ...styles.txBanner, ...(txStatus.type === 'error' ? styles.txError : styles.txSuccess) }}>
                {txStatus.message}
              </div>
            ) : null}
          </header>

          {!account ? (
            <div style={styles.empty}>
              <div style={styles.emptyHex}>?</div>
              <p>PLEASE CONNECT YOUR WALLET TO VIEW YOUR TICKETS.</p>
            </div>
          ) : loading ? (
            <div style={styles.loading}>// QUERYING_COLLECTION...</div>
          ) : tickets.length === 0 ? (
            <div style={styles.empty}>
              <div style={styles.emptyHex}>0</div>
              <p>YOU DO NOT OWN ANY PSL TICKETS YET.</p>
            </div>
          ) : (
            <div style={styles.grid}>
              {tickets.map((t) => (
                <div key={t.id} style={styles.card}>
                  <div style={styles.cardBody}>
                    <div style={styles.info}>
                      <span style={styles.tokenId}>#NFT_{t.id.toString().padStart(3, '0')}</span>
                      <h3 style={styles.matchTitle}>{t.matchDetails.split('|')[0]}</h3>
                      <p style={styles.seatInfo}>STANDARD_ADMISSION · GATE_4 · ROW_12</p>
                      
                      <div style={styles.details}>
                        <div style={styles.detRow}>
                          <span style={styles.detLabel}>ORIGINAL_PRICE</span>
                          <span style={styles.detVal}>{t.originalPrice} ETH</span>
                        </div>
                        <div style={styles.detRow}>
                          <span style={styles.detLabel}>CURRENT_STATUS</span>
                          <span style={{...styles.detVal, color: t.isForSale ? 'var(--g)' : 'var(--muted)'}}>
                            {t.isForSale ? 'LISTED_FOR_SALE' : 'IN_VAULT'}
                          </span>
                        </div>
                      </div>

                      {!t.isForSale ? (
                        <div style={styles.listAction}>
                          <input 
                            type="number" 
                            placeholder="Set Resale Price (ETH)" 
                            style={styles.input}
                            value={listingId === t.id ? listPrice : ''}
                            onChange={(e) => { setListingId(t.id); setListPrice(e.target.value); }}
                          />
                          <button 
                            style={styles.listBtn} 
                            onClick={() => handleList(t.id, t.originalPrice)}
                            disabled={listingId === t.id && !listPrice}
                          >
                            {listingId === t.id && listPrice ? 'LISTING...' : 'LIST_FOR_SALE'}
                          </button>
                        </div>
                      ) : (
                        <div style={styles.listedMsg}>// UNDER_ACTIVE_SALE_CONTRACT</div>
                      )}
                    </div>

                    <div style={styles.qrSide}>
                      <QRCode id={t.id} />
                      <div style={styles.qrInstruction}>PRESENT_AT_GATE</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}

const styles = {
  container: { background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' },
  main: { padding: '60px 48px', maxWidth: '1440px', margin: '0 auto' },
  header: { marginBottom: '60px' },
  secTag: { fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--g)', letterSpacing: '3px', marginBottom: '12px' },
  title: { fontFamily: 'var(--display)', fontSize: '64px', letterSpacing: '2px', marginBottom: '20px' },
  desc: { fontFamily: 'var(--body)', fontSize: '16px', color: 'var(--muted)', lineHeight: 1.6, maxWidth: '600px' },
  txBanner: {
    marginTop: '16px',
    padding: '12px 14px',
    border: '1px solid',
    fontFamily: 'var(--mono)',
    fontSize: '10px',
    letterSpacing: '0.8px',
    background: 'rgba(255,255,255,0.03)',
  },
  txSuccess: {
    borderColor: 'var(--g)',
    color: 'var(--g)',
  },
  txError: {
    borderColor: 'var(--danger)',
    color: '#ff7a7a',
  },
  loading: { fontFamily: 'var(--mono)', fontSize: '14px', color: 'var(--muted)', textAlign: 'center', padding: '100px' },
  empty: { textAlign: 'center', padding: '100px', background: 'var(--surface)', border: '1px solid var(--border)' },
  emptyHex: { 
    width: '40px', height: '40px', background: 'var(--border2)', margin: '0 auto 20px',
    clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--mono)', color: 'var(--text)'
  },
  grid: { display: 'flex', flexDirection: 'column', gap: '24px' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', padding: '0', position: 'relative', overflow: 'hidden' },
  cardBody: { display: 'flex', minHeight: '220px' },
  info: { flex: 1, padding: '32px', borderRight: '1px solid var(--border)' },
  tokenId: { fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--dim)', display: 'block', marginBottom: '8px' },
  matchTitle: { fontFamily: 'var(--display)', fontSize: '32px', marginBottom: '6px', letterSpacing: '1px' },
  seatInfo: { fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)', marginBottom: '24px' },
  details: { marginBottom: '32px', display: 'flex', gap: '40px' },
  detRow: { display: 'flex', flexDirection: 'column', gap: '4px' },
  detLabel: { fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)' },
  detVal: { fontFamily: 'var(--mono)', fontSize: '13px' },
  listAction: { display: 'flex', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '12px', border: '1px solid var(--border2)' },
  input: {
    background: 'transparent', border: 'none', borderBottom: '1px solid var(--border2)',
    color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '12px', padding: '6px',
    outline: 'none', flex: 1
  },
  listBtn: {
    background: 'transparent', border: '1px solid var(--g)', color: 'var(--g)',
    fontFamily: 'var(--mono)', fontSize: '10px', padding: '8px 16px', cursor: 'pointer',
    letterSpacing: '1px'
  },
  listedMsg: { fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px' },
  qrSide: { width: '280px', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' },
  qrCard: { background: 'var(--bg)', padding: '16px', border: '1px solid var(--border2)' },
  qrGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1.5px', width: '120px', height: '120px' },
  qrCell: { borderRadius: '1px' },
  qrMeta: { display: 'flex', justifyContent: 'space-between', marginTop: '12px' },
  qrTimer: { fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--g)' },
  qrStatus: { fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--dim)' },
  qrInstruction: { fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--dim)', letterSpacing: '2px' }
};
