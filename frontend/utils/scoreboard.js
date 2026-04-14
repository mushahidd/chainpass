export async function fetchGlobalTop10(contract) {
  if (!contract) return [];
  try {
    const rawData = await contract.getTopGlobalFans();
    return formatLeaderboard(rawData);
  } catch (error) {
    // Contract may not be deployed on the current network yet — this is expected
    if (error?.code === "BAD_DATA" || error?.message?.includes("could not decode")) {
      console.warn("[Scoreboard] Contract not found on current network. Deploy it first.");
    } else {
      console.error("Error fetching global scoreboard", error);
    }
    return [];
  }
}

export async function fetchTeamTop10(contract, teamName) {
  if (!contract || !teamName) return [];
  try {
    const rawData = await contract.getTopTeamFans(teamName);
    return formatLeaderboard(rawData);
  } catch (error) {
    if (error?.code === "BAD_DATA" || error?.message?.includes("could not decode")) {
      // Silently handle — contract not deployed on this chain
    } else {
      console.error(`Error fetching team scoreboard for ${teamName}`, error);
    }
    return [];
  }
}

export async function fetchMyPersonalScore(contract, userAddress) {
    if (!contract || !userAddress) return 0;
    try {
        const score = await contract.totalMatchesAttended(userAddress);
        return Number(score);
    } catch (error) {
        if (error?.code !== "BAD_DATA") {
          console.error("Error fetching personal score", error);
        }
        return 0;
    }
}

function formatLeaderboard(rawData) {
    // rawData is an array of FanScore structs: [ [wallet, score], [wallet, score], ... ]
    return rawData
      .map(entry => ({
          wallet: entry.wallet,
          score: Number(entry.score)
      }))
      .filter(entry => entry.score > 0)
      .sort((a,b) => b.score - a.score);
}
