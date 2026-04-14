import { useState, useEffect } from "react";
import { useWeb3 } from "../utils/Web3Context";
import { fetchGlobalTop10, fetchTeamTop10 } from "../utils/scoreboard";
import TopPodium from "../components/TopPodium";
import ScoreboardTable from "../components/ScoreboardTable";
import Navbar from "../components/Navbar";
import Ticker from "../components/Ticker";

const TEAMS = [
  "Global",
  "Karachi Kings",
  "Lahore Qalandars",
  "Peshawar Zalmi",
  "Islamabad United",
  "Multan Sultans",
  "Quetta Gladiators"
];

export default function Scoreboard() {
  const { contract } = useWeb3();
  const [activeTab, setActiveTab] = useState("Global");
  const [fans, setFans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!contract) return;
      setLoading(true);
      
      let data = [];
      if (activeTab === "Global") {
        data = await fetchGlobalTop10(contract);
      } else {
        data = await fetchTeamTop10(contract, activeTab);
      }
      
      setFans(data);
      setLoading(false);
    }

    loadData();
  }, [contract, activeTab]);

  return (
    <div style={styles.container}>
      <Navbar />
      <Ticker />
      <main style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>CHAMPIONS OF THE STANDS</h1>
          <p style={styles.subtitle}>Verified On-Chain Stadium Attendance. Real fans, genuine rankings.</p>
        </div>

        <div style={styles.tabContainer}>
          {TEAMS.map(team => (
            <button 
              key={team} 
              style={{
                ...styles.tab, 
                ...(activeTab === team ? styles.activeTab : {})
              }}
              onClick={() => setActiveTab(team)}
            >
              {team}
            </button>
          ))}
        </div>

        {!contract ? (
          <div style={styles.loading}>Connect your wallet to view the scoreboard.</div>
        ) : loading ? (
          <div style={styles.loading}>Scanning Blockchain...</div>
        ) : fans.length === 0 ? (
          <div style={styles.loading}>No attendance data yet. Deploy contract and redeem tickets first.</div>
        ) : (
          <>
            <TopPodium fans={fans} />
            <ScoreboardTable fans={fans} startIndex={3} />
          </>
        )}
      </main>
    </div>
  );
}

const styles = {
  container: {
    background: "var(--bg)",
    minHeight: "100vh",
    color: "var(--text)"
  },
  content: {
    padding: "40px 48px",
    maxWidth: "1200px",
    margin: "0 auto"
  },
  header: {
    textAlign: "center",
    marginBottom: "40px"
  },
  title: {
    fontFamily: "var(--display)",
    fontSize: "64px",
    color: "var(--g)",
    textShadow: "0 0 20px rgba(0, 255, 106, 0.4)",
    letterSpacing: "2px",
    margin: 0
  },
  subtitle: {
    fontFamily: "var(--mono)",
    color: "var(--muted)",
    marginTop: "10px",
    fontSize: "14px"
  },
  tabContainer: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "10px",
    marginBottom: "40px"
  },
  tab: {
    background: "transparent",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "var(--dim)",
    color: "var(--text)",
    padding: "8px 16px",
    borderRadius: "20px",
    fontFamily: "var(--mono)",
    fontSize: "12px",
    transition: "all 0.2s"
  },
  activeTab: {
    background: "var(--g)",
    color: "var(--bg)",
    borderColor: "var(--g)",
    boxShadow: "0 0 10px rgba(0, 255, 106, 0.5)"
  },
  loading: {
    textAlign: "center",
    color: "var(--g)",
    fontFamily: "var(--mono)",
    animation: "blink 1s infinite",
    marginTop: "60px"
  }
};
