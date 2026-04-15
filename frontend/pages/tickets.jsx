import { useState, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Ticker from '../components/Ticker';
import { useWeb3 } from '../utils/Web3Context';
import { ethers } from 'ethers';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '../utils/ToastContext';

const QR_TTL_SECONDS = 90;
const QR_VERSION = 2;
const QR_SIZE = 260;

function toBase64Url(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function sigToBase64Url(sig) {
  const bytes = ethers.getBytes(sig);
  return toBase64Url(bytes);
}

function DynamicQRCode({ ticket, account, provider }) {
  const [qrData, setQrData] = useState(null);
  const [timer, setTimer] = useState(QR_TTL_SECONDS);
  const [sessionWallet, setSessionWallet] = useState(null);
  const [delegationSig, setDelegationSig] = useState(null);
  const [isSigning, setIsSigning] = useState(false);
  const { addToast } = useToast();

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
      addToast("Failed to authorize session key.", 'error');
    }
  };

  useEffect(() => {
    if (!sessionWallet || !delegationSig) return;

    const generatePayload = async () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const payloadObj = { t: ticket.id, u: account, ts: timestamp, v: QR_VERSION };
      const payloadStr = JSON.stringify(payloadObj);
      const payloadHash = ethers.id(payloadStr);
      const qrSig = await sessionWallet.signMessage(ethers.getBytes(payloadHash));
      const qrSigCompact = sigToBase64Url(qrSig);
      const delegationSigCompact = sigToBase64Url(delegationSig);
      const finalData = JSON.stringify({
        p: payloadObj,
        qS: qrSigCompact,
        sP: sessionWallet.address,
        dS: delegationSigCompact
      });
      setQrData(finalData);
      setTimer(QR_TTL_SECONDS);
    };

    generatePayload();
    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) { generatePayload(); return QR_TTL_SECONDS; }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionWallet, delegationSig, ticket.id, account, QR_VERSION]);

  if (!sessionWallet) {
    return (
      <div style={qrStyles.authBox}>
        <button onClick={initSession} style={qrStyles.authBtn} disabled={isSigning}>
          {isSigning ? 'SIGNING...' : 'AUTHORIZE_PASS'}
        </button>
        <div style={qrStyles.authNote}>REQUIRES 1-TIME METAMASK SIGNATURE</div>
      </div>
    );
  }

  return (
    <div style={qrStyles.qrCard}>
      <div style={qrStyles.qrWrapper}>
        {qrData ? (
          <QRCodeSVG
            value={qrData}
            size={QR_SIZE}
            fgColor="#111111"
            bgColor="#ffffff"
            includeMargin={true}
            level="M"
          />
        ) : (
          <div style={{ height: QR_SIZE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)' }}>GENERATING...</div>
        )}
      </div>
      <div style={qrStyles.qrMeta}>
        <div style={qrStyles.qrTimer}>TTL: {timer}s</div>
        <div style={qrStyles.qrStatus}>SECURE_TOTP_ACTIVE</div>
      </div>
    </div>
  );
}

const qrStyles = {
  authBox: { padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' },
  authBtn: {
    background: 'var(--g)', color: 'var(--bg)', border: 'none', padding: '12px 20px',
    fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer',
    clipPath: 'polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%)',
    transition: 'opacity 0.2s',
  },
  authNote: { fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '1px' },
  qrCard: { background: '#0e1113', padding: '14px', border: '1px solid var(--border2)', width: '100%', maxWidth: '300px' },
  qrWrapper: {
    width: '100%',
    aspectRatio: '1 / 1',
    background: '#ffffff',
    border: '1px solid #d9d9d9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  qrMeta: { display: 'flex', justifyContent: 'space-between', marginTop: '10px' },
  qrTimer: { fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--g)' },
  qrStatus: { fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)' },
};

export default function MyTickets() {
  const { contract, account, provider } = useWeb3();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

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
      addToast("Failed to load tickets. Ensure you are connected to the right network.", 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Vault | ChainPass PSL</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
              <p style={styles.emptyText}>PLEASE CONNECT YOUR WALLET TO VIEW YOUR TICKETS.</p>
            </div>
          ) : loading ? (
            <div style={styles.loading}>// QUERYING_COLLECTION...</div>
          ) : tickets.length === 0 ? (
            <div style={styles.empty}>
              <div style={styles.emptyHex}>0</div>
              <p style={styles.emptyText}>YOU DO NOT OWN ANY PSL TICKETS YET.</p>
            </div>
          ) : (
            <div style={styles.grid}>
              {tickets.map((t) => (
                <div key={t.id} style={styles.card}>
                  {/* Card top strip */}
                  <div style={styles.cardStrip}>
                    <span style={styles.tokenId}>#NFT_{t.id.toString().padStart(3, '0')}</span>
                    <span style={{
                      ...styles.statusPill,
                      background: t.isUsed ? 'rgba(255,59,59,0.12)' : 'rgba(0,255,106,0.12)',
                      color: t.isUsed ? 'var(--danger)' : 'var(--g)',
                      borderColor: t.isUsed ? 'var(--danger)' : 'var(--g)',
                    }}>
                      {t.isUsed ? 'USED' : 'VALID'}
                    </span>
                  </div>

                  <div style={styles.cardBody}>
                    {/* Info column */}
                    <div style={styles.info}>
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
                          <span style={{ ...styles.detVal, color: t.isUsed ? 'var(--danger)' : 'var(--g)' }}>
                            {t.isUsed ? 'SCANNED / USED' : 'VALID ENTRY'}
                          </span>
                        </div>
                      </div>

                      <div style={styles.listedMsg}>// STRICTLY_SOULBOUND (NON-TRANSFERABLE)</div>
                    </div>

                    {/* QR column */}
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

      <style>{`
        input:focus { border-color: var(--g) !important; outline: none; }
        @media (max-width: 700px) {
          .ticket-card-body { flex-direction: column !important; }
          .ticket-qr-side { width: 100% !important; border-left: none !important; border-top: 1px solid var(--border) !important; padding: 24px !important; }
          .ticket-details { flex-wrap: wrap !important; gap: 20px !important; }
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
  header: { marginBottom: 'clamp(32px, 5vw, 60px)' },
  secTag: { fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--g)', letterSpacing: '3px', marginBottom: '12px' },
  title: {
    fontFamily: 'var(--display)',
    fontSize: 'clamp(36px, 6vw, 64px)',
    letterSpacing: '2px',
    marginBottom: '16px',
  },
  desc: { fontFamily: 'var(--body)', fontSize: 'clamp(13px, 2vw, 16px)', color: 'var(--muted)', lineHeight: 1.6, maxWidth: '600px' },
  loading: { fontFamily: 'var(--mono)', fontSize: '14px', color: 'var(--muted)', textAlign: 'center', padding: 'clamp(40px, 10vw, 100px) 20px' },
  empty: {
    textAlign: 'center',
    padding: 'clamp(40px, 10vw, 100px) 20px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '4px',
  },
  emptyHex: {
    width: '48px', height: '48px', background: 'var(--border2)', margin: '0 auto 20px',
    clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--mono)', color: 'var(--text)', fontSize: '16px',
  },
  emptyText: { fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--muted)', letterSpacing: '1px' },
  grid: { display: 'flex', flexDirection: 'column', gap: '20px' },
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    position: 'relative',
    overflow: 'hidden',
    transition: 'border-color 0.2s',
    borderRadius: '4px',
  },
  cardStrip: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 20px',
    borderBottom: '1px solid var(--border)',
    background: 'rgba(0,255,106,0.02)',
  },
  tokenId: { fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--dim)' },
  statusPill: {
    fontFamily: 'var(--mono)',
    fontSize: '9px',
    letterSpacing: '1.5px',
    padding: '4px 10px',
    border: '1px solid',
    borderRadius: '999px',
  },
  cardBody: {
    display: 'flex',
    flexWrap: 'wrap',
    minHeight: '200px',
  },
  info: {
    flex: '1 1 280px',
    padding: 'clamp(20px, 3vw, 32px)',
    borderRight: '1px solid var(--border)',
  },
  matchTitle: {
    fontFamily: 'var(--display)',
    fontSize: 'clamp(22px, 3vw, 32px)',
    marginBottom: '6px',
    letterSpacing: '1px',
  },
  seatInfo: { fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)', marginBottom: '20px' },
  details: { marginBottom: '24px', display: 'flex', gap: '32px', flexWrap: 'wrap' },
  detRow: { display: 'flex', flexDirection: 'column', gap: '4px' },
  detLabel: { fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '0.5px' },
  detVal: { fontFamily: 'var(--mono)', fontSize: '13px' },
  listedMsg: { fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '1px' },
  qrSide: {
    flex: '0 1 320px',
    minWidth: '240px',
    background: 'rgba(255,255,255,0.01)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '20px',
  },
  qrInstruction: { fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '2px' },
  usedBadge: {
    fontFamily: 'var(--display)',
    fontSize: '24px',
    color: 'var(--danger)',
    border: '1px solid var(--danger)',
    padding: '12px 24px',
  },
};
