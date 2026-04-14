import { useState, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Ticker from '../components/Ticker';
import { useWeb3 } from '../utils/Web3Context';
import { ethers } from 'ethers';

export default function Marketplace() {
  const { contract, account } = useWeb3();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState(null);

  useEffect(() => {
    if (contract) {
      loadTickets();
    }
  }, [contract]);

  const loadTickets = async () => {
    try {
      const total = await contract.totalSupply();
      const items = [];
      for (let i = 0; i < Number(total); i++) {
        const t = await contract.getTicket(i);
        if (t.isForSale) {
          const owner = await contract.ownerOf(i);
          items.push({
            id: i,
            originalPrice: ethers.formatEther(t.originalPrice),
            currentPrice: ethers.formatEther(t.currentPrice),
            matchDetails: t.matchDetails,
            owner: owner
          });
        }
      }
      setTickets(items);
    } catch (err) {
      if (err?.code === "BAD_DATA" || err?.message?.includes("could not decode")) {
        console.warn("[Marketplace] Contract not found on current network. Deploy it first.");
      } else {
        console.error("Error loading tickets:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const buyTicket = async (id, price) => {
    if (!account) return alert("Please connect your wallet first!");
    setBuyingId(id);
    try {
      const tx = await contract.buyTicket(id, { value: ethers.parseEther(price) });
      await tx.wait();
      alert("Ticket Purchased Successfully!");
      loadTickets();
    } catch (err) {
      console.error("Purchase failed:", err);
      alert("Transaction Failed. Check console for details.");
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <>
      <Head>
        <title>Marketplace | ChainPass PSL</title>
      </Head>

      <div style={styles.container}>
        <Navbar />
        <Ticker />

        <main style={styles.main}>
          <header style={styles.header}>
            <div style={styles.secTag}>// SECONDARY_MARKET</div>
            <h1 style={styles.title}>LIVE_LISTINGS</h1>
            <p style={styles.desc}>
              Verified PSL tickets listed by fans. Every price is strictly within the 110% cap logic. 
              <br />Powered by smart contract enforcement.
            </p>
          </header>

          {loading ? (
            <div style={styles.loading}>// SCANNING_BLOCKCHAIN...</div>
          ) : tickets.length === 0 ? (
            <div style={styles.empty}>
              <div style={styles.emptyHex}>!</div>
              <p>NO TICKETS CURRENTLY LISTED FOR RESALE.</p>
            </div>
          ) : (
            <div style={styles.grid}>
              {tickets.map((t) => (
                <div key={t.id} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <span style={styles.tokenId}>#NFT_{t.id.toString().padStart(3, '0')}</span>
                    <span style={styles.status}>ACTIVE_LISTING</span>
                  </div>
                  
                  <h3 style={styles.matchTitle}>{t.matchDetails.split('|')[0]}</h3>
                  <p style={styles.matchSub}>{t.matchDetails.split('|')[1] || 'Standard Admission'}</p>
                  
                  <div style={styles.stats}>
                    <div style={styles.statBox}>
                      <div style={styles.statLabel}>MINT_PRICE</div>
                      <div style={styles.statVal}>{t.originalPrice} ETH</div>
                    </div>
                    <div style={styles.statBox}>
                      <div style={styles.statLabel}>RESALE_PRICE</div>
                      <div style={{...styles.statVal, color: 'var(--g)'}}>{t.currentPrice} ETH</div>
                    </div>
                  </div>

                  <div style={styles.ownerInfo}>
                    <div style={styles.statLabel}>SELLER_NODE</div>
                    <div style={styles.address}>{t.owner.slice(0, 12)}...{t.owner.slice(-8)}</div>
                  </div>

                  <button 
                    style={styles.buyBtn} 
                    onClick={() => buyTicket(t.id, t.currentPrice)}
                    disabled={buyingId === t.id}
                  >
                    {buyingId === t.id ? 'PENDING_CONFIRMATION...' : 'PURCHASE_NFT →'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <style>{`
        button:hover { opacity: 0.9; transform: translateY(-1px); }
        button:active { transform: translateY(0); }
      `}</style>
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
  loading: { fontFamily: 'var(--mono)', fontSize: '14px', color: 'var(--muted)', textAlign: 'center', padding: '100px' },
  empty: { textAlign: 'center', padding: '100px', background: 'var(--surface)', border: '1px solid var(--border)' },
  emptyHex: { 
    width: '40px', height: '40px', background: 'var(--border2)', margin: '0 auto 20px',
    clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--mono)', color: 'var(--text)'
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', padding: '24px', position: 'relative' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' },
  tokenId: { fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--dim)' },
  status: { fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--g)', background: 'rgba(0,255,106,0.05)', padding: '2px 8px', border: '1px solid var(--g)' },
  matchTitle: { fontFamily: 'var(--display)', fontSize: '24px', marginBottom: '4px', letterSpacing: '1px' },
  matchSub: { fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)', marginBottom: '24px' },
  stats: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' },
  statBox: { background: 'var(--bg)', padding: '12px', border: '1px solid var(--border2)' },
  statLabel: { fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', marginBottom: '4px' },
  statVal: { fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: 'bold' },
  ownerInfo: { marginBottom: '24px' },
  address: { fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)' },
  buyBtn: {
    width: '100%', padding: '14px', background: 'var(--g)', color: 'var(--bg)',
    border: 'none', fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 'bold',
    cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '1px',
    clipPath: 'polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%)',
  }
};
