export default function TopPodium({ fans }) {
  if (!fans || fans.length === 0) {
    return <div style={{ textAlign: "center", color: "var(--muted)", margin: "40px 0" }}>No Data Yet</div>;
  }

  // Ensure we have exactly 3 slots to render podium
  const top3 = [
    fans[1] || { wallet: "N/A", score: 0 }, // 2nd Place (Left)
    fans[0] || { wallet: "N/A", score: 0 }, // 1st Place (Center)
    fans[2] || { wallet: "N/A", score: 0 }, // 3rd Place (Right)
  ];

  const formatWallet = (wallet) => {
    if (wallet === "N/A" || !wallet || wallet === "0x0000000000000000000000000000000000000000") return "TBA";
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  };

  return (
    <div style={styles.container}>
      {/* 2nd Place */}
      <div style={{ ...styles.podiumBlock, ...styles.silverBlock }}>
        <div style={styles.rank}>#2</div>
        <div style={styles.wallet}>{formatWallet(top3[0].wallet)}</div>
        <div style={styles.score}>{top3[0].score} PTS</div>
      </div>

      {/* 1st Place */}
      <div style={{ ...styles.podiumBlock, ...styles.goldBlock }}>
        <div style={styles.rankFirst}>#1</div>
        <div style={{...styles.wallet, color: "var(--gold)"}}>{formatWallet(top3[1].wallet)}</div>
        <div style={styles.scoreFirst}>{top3[1].score} PTS</div>
      </div>

      {/* 3rd Place */}
      <div style={{ ...styles.podiumBlock, ...styles.bronzeBlock }}>
        <div style={styles.rank}>#3</div>
        <div style={styles.wallet}>{formatWallet(top3[2].wallet)}</div>
        <div style={styles.score}>{top3[2].score} PTS</div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: "16px",
    margin: "40px auto",
    paddingBottom: "20px"
  },
  podiumBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: "20px 10px",
    width: "140px",
    background: "var(--surface)",
    borderTopLeftRadius: "8px",
    borderTopRightRadius: "8px",
    boxShadow: "0 -4px 20px rgba(0,0,0,0.5)",
    border: "1px solid var(--border)",
    borderBottom: "none"
  },
  goldBlock: {
    height: "220px",
    borderColor: "var(--gold)",
    boxShadow: "0 -8px 30px rgba(232, 184, 75, 0.2)",
    zIndex: 2,
    transform: "translateY(0)"
  },
  silverBlock: {
    height: "170px",
    borderColor: "#a8b5b2",
    opacity: 0.9
  },
  bronzeBlock: {
    height: "140px",
    borderColor: "#cd7f32",
    opacity: 0.8
  },
  rankFirst: {
    fontFamily: "var(--display)",
    fontSize: "48px",
    color: "var(--gold)",
    textShadow: "0 0 10px rgba(232, 184, 75, 0.5)",
  },
  rank: {
    fontFamily: "var(--display)",
    fontSize: "36px",
    color: "var(--text)"
  },
  wallet: {
    fontFamily: "var(--mono)",
    fontSize: "12px",
    margin: "12px 0 4px 0",
    color: "var(--text)"
  },
  scoreFirst: {
    fontFamily: "var(--display)",
    fontSize: "24px",
    color: "var(--g)"
  },
  score: {
    fontFamily: "var(--display)",
    fontSize: "20px",
    color: "var(--muted)"
  }
};
