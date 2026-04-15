import { useEffect, useState } from 'react';
import { useWeb3 } from '../utils/Web3Context';

export default function Leaderboard() {
  const { contract, account, web3Error } = useWeb3();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const loadLeaderboard = async () => {
      if (web3Error) {
        if (active) { setRows([]); setError(web3Error); setLoading(false); }
        return;
      }
      if (!contract) {
        if (active) { setRows([]); setError(''); setLoading(false); }
        return;
      }
      try {
        const tallies = new Map();
        const totalSupply = await contract.totalSupply();
        for (let tokenId = 0; tokenId < Number(totalSupply); tokenId++) {
          const ticketData = await contract.getTicketData(tokenId);
          const owner = (ticketData?.owner ?? ticketData?.[0] ?? '').toString();
          const ticketObj = ticketData?.ticketObj ?? ticketData?.[1];
          const wallet = owner.toLowerCase();
          if (!wallet) continue;
          const current = tallies.get(wallet) || { wallet, count: 0 };
          const personCount = Number(ticketObj?.personCount ?? 1n);
          current.count += personCount;
          tallies.set(wallet, current);
        }
        const sortedRows = [...tallies.values()].sort((left, right) => {
          if (right.count !== left.count) return right.count - left.count;
          return left.wallet.localeCompare(right.wallet);
        });
        if (active) { setRows(sortedRows); setError(''); }
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
        if (active) { setRows([]); setError('Unable to load leaderboard data.'); }
      } finally {
        if (active) setLoading(false);
      }
    };
    setLoading(true);
    loadLeaderboard();
    return () => { active = false; };
  }, [account, contract, web3Error]);

  const totalPeople = rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <section style={styles.panel}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.tag}>// LIFETIME_LEADERBOARD</div>
        <h2 style={styles.title}>TOP_WALLET_RANKINGS</h2>
        <p style={styles.copy}>
          Ranked by total lifetime people covered by each family pass. Because passes are soulbound, the leaderboard reflects the actual buyers over time.
        </p>
      </div>

      {/* Summary stats */}
      <div className="leaderboard-summary" style={styles.summaryRow}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryValue}>{rows.length.toLocaleString()}</div>
          <div style={styles.summaryLabel}>WALLETS_TRACKED</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryValue}>{totalPeople.toLocaleString()}</div>
          <div style={styles.summaryLabel}>PEOPLE_TRACKED</div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={styles.state}>
          <div style={styles.spinner} />
          <span>// LOADING_LEADERBOARD...</span>
        </div>
      ) : error ? (
        <div style={{ ...styles.state, ...styles.errorState }}>{error}</div>
      ) : rows.length === 0 ? (
        <div style={styles.state}>NO_TICKET_ACTIVITY_YET.</div>
      ) : (
        <div style={styles.tableWrapper}>
          <div style={styles.table}>
            <div style={styles.tableHead}>
              <span>RANK</span>
              <span>WALLET</span>
              <span style={{ textAlign: 'right' }}>PEOPLE</span>
              <span style={{ textAlign: 'right' }}>STATUS</span>
            </div>

            {rows.slice(0, 10).map((row, index) => {
              const isCurrentWallet = account && row.wallet === account.toLowerCase();
              const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;

              return (
                <div
                  key={row.wallet}
                  style={{
                    ...styles.tableRow,
                    ...(isCurrentWallet ? styles.currentRow : {}),
                    ...(index === 0 ? styles.topRow : {}),
                  }}
                >
                  <span style={styles.rank}>
                    {medal || `#${String(index + 1).padStart(2, '0')}`}
                  </span>
                  <span style={styles.wallet}>
                    {row.wallet.slice(0, 6)}...{row.wallet.slice(-6)}
                  </span>
                  <span style={styles.count}>{row.count.toLocaleString()}</span>
                  <span style={{
                    ...styles.status,
                    color: isCurrentWallet ? 'var(--g)' : index === 0 ? 'var(--gold)' : 'var(--muted)',
                  }}>
                    {isCurrentWallet ? 'YOU' : index === 0 ? 'LEADER' : 'TRACKED'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes rotateSpinner { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 500px) {
          .leaderboard-summary { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

const styles = {
  panel: {
    border: '1px solid var(--border)',
    background: 'linear-gradient(180deg, rgba(0,255,106,0.03), rgba(255,255,255,0.01))',
    padding: 'clamp(20px, 4vw, 28px)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    borderRadius: '4px',
  },
  header: { display: 'flex', flexDirection: 'column', gap: '10px' },
  tag: { fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--g)', letterSpacing: '2.5px' },
  title: { fontFamily: 'var(--display)', fontSize: 'clamp(24px, 4vw, 32px)', letterSpacing: '1px' },
  copy: { fontFamily: 'var(--mono)', fontSize: '11px', lineHeight: 1.7, color: 'var(--muted)', maxWidth: '640px' },
  summaryRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '12px',
  },
  summaryCard: {
    border: '1px solid var(--border)',
    background: 'rgba(255,255,255,0.02)',
    padding: 'clamp(14px, 3vw, 20px)',
    borderRadius: '4px',
  },
  summaryValue: { fontFamily: 'var(--display)', fontSize: 'clamp(22px, 4vw, 32px)', color: 'var(--text)', marginBottom: '6px' },
  summaryLabel: { fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--dim)', letterSpacing: '1.5px' },
  state: {
    border: '1px dashed var(--border2)',
    padding: '20px',
    fontFamily: 'var(--mono)',
    fontSize: '11px',
    color: 'var(--muted)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderRadius: '4px',
  },
  errorState: { color: 'var(--danger)', borderColor: 'var(--danger)' },
  spinner: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    border: '2px solid var(--border2)',
    borderTopColor: 'var(--g)',
    animation: 'rotateSpinner 0.8s linear infinite',
    flexShrink: 0,
  },
  tableWrapper: { overflowX: 'auto', width: '100%' },
  table: { display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '420px' },
  tableHead: {
    display: 'grid',
    gridTemplateColumns: '60px minmax(0, 1fr) 80px 90px',
    gap: '12px',
    fontFamily: 'var(--mono)',
    fontSize: '9px',
    color: 'var(--dim)',
    letterSpacing: '1.5px',
    padding: '0 14px',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '60px minmax(0, 1fr) 80px 90px',
    gap: '12px',
    alignItems: 'center',
    border: '1px solid var(--border)',
    background: 'rgba(255,255,255,0.02)',
    padding: '12px 14px',
    transition: 'border-color 0.2s, background 0.2s',
    borderRadius: '2px',
  },
  currentRow: {
    borderColor: 'var(--g)',
    background: 'rgba(0,255,106,0.04)',
    boxShadow: '0 0 0 1px rgba(0,255,106,0.1) inset',
  },
  topRow: {
    borderColor: 'var(--gold2)',
    background: 'rgba(232,184,75,0.04)',
  },
  rank: {
    fontFamily: 'var(--display)',
    fontSize: '18px',
    color: 'var(--g)',
  },
  wallet: {
    fontFamily: 'var(--mono)',
    fontSize: 'clamp(10px, 1.5vw, 12px)',
    color: 'var(--text)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  count: {
    fontFamily: 'var(--display)',
    fontSize: '20px',
    color: 'var(--text)',
    textAlign: 'right',
  },
  status: {
    fontFamily: 'var(--mono)',
    fontSize: '10px',
    textAlign: 'right',
    letterSpacing: '1px',
  },
};