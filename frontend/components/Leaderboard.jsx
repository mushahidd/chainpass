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
        if (active) {
          setRows([]);
          setError(web3Error);
          setLoading(false);
        }
        return;
      }

      if (!contract) {
        if (active) {
          setRows([]);
          setError('');
          setLoading(false);
        }
        return;
      }

      try {
        const tallies = new Map();
        const totalSupply = await contract.totalSupply();

        for (let tokenId = 0; tokenId < Number(totalSupply); tokenId++) {
          const [owner, ticketObj] = await Promise.all([
            contract.ownerOf(tokenId),
            contract.getTicketData(tokenId),
          ]);
          const wallet = owner.toLowerCase();
          if (!wallet) continue;

          const current = tallies.get(wallet) || { wallet, count: 0 };
          current.count += Number(ticketObj.personCount || 1);
          tallies.set(wallet, current);
        }

        const sortedRows = [...tallies.values()].sort((left, right) => {
          if (right.count !== left.count) return right.count - left.count;
          return left.wallet.localeCompare(right.wallet);
        });

        if (active) {
          setRows(sortedRows);
          setError('');
        }
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
        if (active) {
          setRows([]);
          setError('Unable to load leaderboard data.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    setLoading(true);
    loadLeaderboard();

    return () => {
      active = false;
    };
  }, [account, contract, web3Error]);

  return (
    <section style={styles.panel}>
      <div style={styles.header}>
        <div style={styles.tag}>// LIFETIME_LEADERBOARD</div>
        <h2 style={styles.title}>TOP_WALLET_RANKINGS</h2>
        <p style={styles.copy}>
          Ranked by total lifetime people covered by each family pass. Because passes are soulbound, the leaderboard reflects the actual buyers over time.
        </p>
      </div>

      <div style={styles.summaryRow}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryValue}>{rows.length.toLocaleString()}</div>
          <div style={styles.summaryLabel}>WALLETS_TRACKED</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryValue}>{rows.reduce((sum, row) => sum + row.count, 0).toLocaleString()}</div>
          <div style={styles.summaryLabel}>PEOPLE_TRACKED</div>
        </div>
      </div>

      {loading ? (
        <div style={styles.state}>// LOADING_LEADERBOARD...</div>
      ) : error ? (
        <div style={{ ...styles.state, ...styles.error }}>{error}</div>
      ) : rows.length === 0 ? (
        <div style={styles.state}>NO_TICKET_ACTIVITY_YET.</div>
      ) : (
        <div style={styles.table}>
          <div style={styles.tableHead}>
            <span>RANK</span>
            <span>WALLET</span>
            <span>TICKETS</span>
            <span>STATUS</span>
          </div>

          {rows.slice(0, 10).map((row, index) => {
            const isCurrentWallet = account && row.wallet === account.toLowerCase();

            return (
              <div key={row.wallet} style={{ ...styles.tableRow, ...(isCurrentWallet ? styles.currentRow : {}) }}>
                <span style={styles.rank}>#{String(index + 1).padStart(2, '0')}</span>
                <span style={styles.wallet}>{row.wallet}</span>
                <span style={styles.count}>{row.count.toLocaleString()}</span>
                <span style={styles.status}>{isCurrentWallet ? 'YOU' : index === 0 ? 'LEADER' : 'TRACKED'}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

const styles = {
  panel: {
    border: '1px solid var(--border)',
    background: 'linear-gradient(180deg, rgba(0,255,106,0.04), rgba(255,255,255,0.015))',
    padding: '28px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  tag: {
    fontFamily: 'var(--mono)',
    fontSize: '10px',
    color: 'var(--g)',
    letterSpacing: '2.5px',
  },
  title: {
    fontFamily: 'var(--display)',
    fontSize: '32px',
    letterSpacing: '1px',
  },
  copy: {
    fontFamily: 'var(--mono)',
    fontSize: '12px',
    lineHeight: 1.7,
    color: 'var(--muted)',
    maxWidth: '640px',
  },
  summaryRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '12px',
  },
  summaryCard: {
    border: '1px solid var(--border)',
    background: 'rgba(255,255,255,0.02)',
    padding: '16px',
  },
  summaryValue: {
    fontFamily: 'var(--display)',
    fontSize: '28px',
    color: 'var(--text)',
    marginBottom: '4px',
  },
  summaryLabel: {
    fontFamily: 'var(--mono)',
    fontSize: '9px',
    color: 'var(--dim)',
    letterSpacing: '1.5px',
  },
  state: {
    border: '1px dashed var(--border2)',
    padding: '18px',
    fontFamily: 'var(--mono)',
    fontSize: '11px',
    color: 'var(--muted)',
  },
  error: {
    color: 'red',
    borderColor: 'red',
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  tableHead: {
    display: 'grid',
    gridTemplateColumns: '72px minmax(0, 1fr) 90px 90px',
    gap: '12px',
    fontFamily: 'var(--mono)',
    fontSize: '9px',
    color: 'var(--dim)',
    letterSpacing: '1.5px',
    padding: '0 8px',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '72px minmax(0, 1fr) 90px 90px',
    gap: '12px',
    alignItems: 'center',
    border: '1px solid var(--border)',
    background: 'rgba(255,255,255,0.02)',
    padding: '14px 8px',
  },
  currentRow: {
    borderColor: 'var(--g)',
    boxShadow: '0 0 0 1px rgba(0,255,106,0.14) inset',
  },
  rank: {
    fontFamily: 'var(--display)',
    fontSize: '18px',
    color: 'var(--g)',
  },
  wallet: {
    fontFamily: 'var(--mono)',
    fontSize: '11px',
    wordBreak: 'break-all',
    color: 'var(--text)',
  },
  count: {
    fontFamily: 'var(--display)',
    fontSize: '20px',
    color: 'var(--text)',
    textAlign: 'center',
  },
  status: {
    fontFamily: 'var(--mono)',
    fontSize: '10px',
    color: 'var(--muted)',
    textAlign: 'right',
    letterSpacing: '1px',
  },
};