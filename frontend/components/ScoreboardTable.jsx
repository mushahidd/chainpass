export default function ScoreboardTable({ fans, startIndex = 3 }) {
  const getBadge = (score) => {
    if (score >= 10) return "💎 Diamond Legend";
    if (score >= 5) return "🪙 Gold Supporter";
    if (score >= 2) return "🟢 Verified Fan";
    return "⚪ Rookie";
  };

  const formatWallet = (wallet) => {
    if (!wallet || wallet === "0x0000000000000000000000000000000000000000") return null;
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  };

  const remainingFans = fans.slice(startIndex).filter(f => formatWallet(f.wallet) !== null);

  if (remainingFans.length === 0) {
    return null;
  }

  return (
    <div style={styles.tableContainer}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Rank</th>
            <th style={styles.th}>Wallet</th>
            <th style={styles.th}>Matches</th>
            <th style={styles.th}>Tier</th>
          </tr>
        </thead>
        <tbody>
          {remainingFans.map((fan, idx) => (
            <tr key={idx} style={styles.tr}>
              <td style={styles.td}>#{startIndex + idx + 1}</td>
              <td style={{ ...styles.td, fontFamily: "var(--mono)", color: "var(--g)" }}>
                {formatWallet(fan.wallet)}
              </td>
              <td style={{ ...styles.td, fontFamily: "var(--display)", fontSize: "20px" }}>
                {fan.score}
              </td>
              <td style={{ ...styles.td, color: "var(--gold2)" }}>
                {getBadge(fan.score)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  tableContainer: {
    width: "100%",
    maxWidth: "800px",
    margin: "0 auto",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    overflow: "hidden"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left"
  },
  th: {
    padding: "16px",
    fontFamily: "var(--mono)",
    fontSize: "12px",
    color: "var(--muted)",
    textTransform: "uppercase",
    borderBottom: "1px solid var(--border)"
  },
  tr: {
    borderBottom: "1px solid var(--border2)",
    transition: "background 0.2s"
  },
  td: {
    padding: "16px",
    fontSize: "14px"
  }
};
