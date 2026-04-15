import { useState, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Ticker from '../components/Ticker';
import { useWeb3 } from '../utils/Web3Context';
import { ethers } from 'ethers';
import { QRCodeSVG } from 'qrcode.react';

const QR_TTL_SECONDS = 30;

function DynamicQRCode({ ticket, account, provider }) {
  const [qrData, setQrData] = useState(null);
  const [timer, setTimer] = useState(QR_TTL_SECONDS);
  const [sessionWallet, setSessionWallet] = useState(null);
  const [delegationSig, setDelegationSig] = useState(null);
  const [isSigning, setIsSigning] = useState(false);

  const initSession = async () => {
    try {
      setIsSigning(true);
      const randomWallet = ethers.Wallet.createRandom();
      const signer = await provider.getSigner();
      
      const message = `Authorize ChainPass Session Key:\n${randomWallet.address}`;
      const sig = await signer.signMessage(message);
      
      setSessionWallet(randomWallet);
      setDelegationSig(sig);
      setIsSigning(false);
    } catch (err) {
      console.error(err);
      setIsSigning(false);
      alert("Failed to authorize session key.");
    }
  };

  useEffect(() => {
    if (!sessionWallet || !delegationSig) return;

    const generatePayload = async () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const payloadObj = {
        tokenId: ticket.id.toString(),
        userAddress: account,
        timestamp: timestamp
      };
      const payloadStr = JSON.stringify(payloadObj);
      const payloadHash = ethers.id(payloadStr);
      const qrSig = await sessionWallet.signMessage(ethers.getBytes(payloadHash));

      const finalData = JSON.stringify({
        p: payloadObj,
        qS: qrSig,
        sP: sessionWallet.address,
        dS: delegationSig
      });

      setQrData(finalData);
      setTimer(QR_TTL_SECONDS);
    };

    generatePayload();
    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          generatePayload();
          return QR_TTL_SECONDS;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionWallet, delegationSig, ticket.id, account]);

  if (!sessionWallet) {
    return (
      <div style={styles.qrCard}>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <button onClick={initSession} style={styles.authBtn} disabled={isSigning}>
            {isSigning ? 'SIGNING...' : 'AUTHORIZE_PASS'}
          </button>
          <div style={{ marginTop: '12px', fontSize: '9px', color: 'var(--dim)', fontFamily: 'var(--mono)' }}>
            REQUIRES 1-TIME METAMASK SIGNATURE
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.qrCard}>
      <div style={styles.qrWrapper}>
        {qrData ? (
          <QRCodeSVG
            value={qrData}
            size={288}
            fgColor="#111111"
            bgColor="#ffffff"
            includeMargin={true}
            level="L"
          />
        ) : (
          <div style={{ height: 288, display: 'flex', alignItems: 'center' }}>GENERATING...</div>
        )}
      </div>
      <div style={styles.qrMeta}>
        <div style={styles.qrTimer}>TTL: {timer}s</div>
        <div style={styles.qrStatus}>SECURE_TOTP_ACTIVE</div>
      </div>
    </div>
  );
}

export default function MyTickets() {
  const { contract, account, provider } = useWeb3();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

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
          const [ownerAddr, t, m] = await contract.getTicketData(i);
          myItems.push({
            id: i,
            originalPrice: ethers.formatEther(t.paidPrice),
            personCount: Number(t.personCount),
            matchDetails: m.teams,
            stadium: m.stadium,
            enclosure: t.enclosure,
            isUsed: t.isUsed,
          });
        }
      }
      setTickets(myItems);
    } catch (err) {
      console.error("Error loading tickets:", err);
    } finally {
      setLoading(false);
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
              Manage your verified PSL tickets. Your soulbound passes reside here safely. Generating secure gate codes is now continuous and invisible.
            </p>
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
                      <h3 style={styles.matchTitle}>{t.matchDetails}</h3>
                      <p style={styles.seatInfo}>{t.stadium} · ENCLOSURE: {t.enclosure}</p>
                      
                      <div style={styles.details}>
                        <div style={styles.detRow}>
                          <span style={styles.detLabel}>PERSON_COUNT</span>
                          <span style={styles.detVal}>{t.personCount}</span>
                        </div>
                        <div style={styles.detRow}>
                          <span style={styles.detLabel}>TOTAL_PRICE</span>
                          <span style={styles.detVal}>{t.originalPrice} WIRE</span>
                        </div>
                        <div style={styles.detRow}>
                          <span style={styles.detLabel}>ENTRY_STATUS</span>
                          <span style={{...styles.detVal, color: t.isUsed ? 'red' : 'var(--g)'}}>
                            {t.isUsed ? 'SCANNED / USED' : 'VALID ENTRY'}
                          </span>
                        </div>
                      </div>

                      <div style={styles.listedMsg}>// STRICTLY_SOULBOUND (NON-TRANSFERABLE)</div>
                    </div>

                    <div style={styles.qrSide}>
                      {t.isUsed ? (
                        <div style={styles.usedBadge}>TICKET USED</div>
                      ) : (
                        <DynamicQRCode ticket={t} account={account} provider={provider} />
                      )}
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
  listedMsg: { fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px' },
  qrSide: { width: '380px', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' },
  qrCard: { background: '#0e1113', padding: '18px', border: '1px solid var(--border2)' },
  qrWrapper: {
    width: '316px',
    height: '316px',
    background: '#ffffff',
    border: '1px solid #d9d9d9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  qrMeta: { display: 'flex', justifyContent: 'space-between', marginTop: '12px' },
  qrTimer: { fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--g)' },
  qrStatus: { fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--dim)' },
  qrInstruction: { fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--dim)', letterSpacing: '2px' },
  usedBadge: { fontFamily: 'var(--display)', fontSize: '24px', color: 'red', border: '1px solid red', padding: '10px' },
  authBtn: {
    background: 'var(--g)', color: 'var(--bg)', border: 'none', padding: '12px 20px',
    fontFamily: 'var(--mono)', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer',
    clipPath: 'polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%)'
  }
};
