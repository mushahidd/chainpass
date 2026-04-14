# Comprehensive Feature Specification: Decentralized PSL Scoreboard & Hall of Fame

## 1. Executive Summary
The goal of this feature is to introduce a 100% decentralized, zero-database Scoreboard and Hall of Fame for the ChainPass PSL platform. It gamifies the stadium attendance experience by ranking users based on the number of matches they have physically attended. To prevent manipulation by scalpers or bots, points are awarded *only* upon physical ticket scanning at the stadium gates, where the user's identity is verified against the encrypted NIC enclosed in the NFT ticket.

---

## 2. Core Constraints & Guiding Principles
- **No Database**: All persistent data must reside on the blockchain.
- **WireFluid Chain Deployment**: The smart contracts will be deployed to **WireFluid** (EVM compatible). Thanks to WireFluid's ~5 second block times and near-zero gas costs, we can maintain the scoreboard entirely on-chain without worrying about massive gas fees for daily user updates. 
- **Sybil Resistance**: A user cannot buy 100 tickets on one wallet to top the leaderboard. Attendance is confirmed physically at the stadium gate. 
- **NIC-Bound**: 1 human = 1 NIC = 1 Wallet. The encrypted NIC is the ultimate source of truth for identity.
- **Gas Optimized Reads**: Sorting thousands of wallets on the frontend via standard RPC calls can be slow. We will implement fixed-size arrays (Top 10) directly in the Smart Contract for O(1) instant reads via WireFluid RPC.
- **UI/UX Consistency**: Must match the existing neon cyberpunk aesthetics (neon green, dark surface, monospace tech fonts).

---

## 3. Smart Contract Architecture (Solidity updates)

### 3.1 State Variables
We need to track raw attendance counts, and simultaneously maintain sorted arrays of the Top Fans so the frontend doesn't have to download the entire state to figure out who is ranked #1.

```solidity
// Raw Counters
mapping(address => uint256) public totalMatchesAttended;
mapping(address => mapping(string => uint256)) public teamMatchesAttended; // address => TeamName => count

// Struct for Leaderboard Representation
struct FanScore {
    address wallet;
    uint256 score;
}

// Gas-Efficient Top 10 Arrays maintained on-chain
FanScore[10] public topGlobalFans;
mapping(string => FanScore[10]) public topTeamFans;

// Prevent double counting
mapping(uint256 => bool) public isTicketRedeemed;
```

### 3.2 Security & Minter Setup
- **`onlyValidator` Role**: Only authorized stadium scanners (a specific admin wallet) can call the `redeemTicket` function.
- The validator physically checks the attendee's NIC against the decrypted NIC from the NFT ticket.

### 3.3 Core Functions

**`redeemTicket(uint256 tokenId, string memory team1, string memory team2)`**
1. **Validation**: Check `!isTicketRedeemed[tokenId]`. Revert if already used.
2. **State Updates**: 
   - `isTicketRedeemed[tokenId] = true;`
   - `address attendee = ownerOf(tokenId);`
   - `totalMatchesAttended[attendee] += 1;`
   - `teamMatchesAttended[attendee][team1] += 1;`
   - `teamMatchesAttended[attendee][team2] += 1;`
3. **Leaderboard Sorting (Insertion Sort)**:
   - Call internal function `_updateGlobalLeaderboard(attendee, newTotalScore)`.
   - Call internal function `_updateTeamLeaderboard(attendee, team1, newTeam1Score)`.
   - Call internal function `_updateTeamLeaderboard(attendee, team2, newTeam2Score)`.

**`getTopGlobalFans() external view returns (FanScore[10] memory)`**
Returns the sorted top 10 list instantly.

**`getTopTeamFans(string calldata team) external view returns (FanScore[10] memory)`**
Returns the sorted top 10 list for a specific team instantly.

---

## 4. Frontend Architecture (Next.js & React)

### 4.1 UI Design Guidelines
- **Typography**: Uses `Bebas Neue` for large impactful headers ("PSL HALL OF FAME"), and `Space Mono` for addresses and numbers.
- **Color Palette**: 
  - Background: `var(--bg)` / `#04080a`
  - Cards: `var(--surface)` / `#0c1812` bordered by `var(--border)` `#0f2415`.
  - Accents: `var(--g)` `#00ff6a` (Neon Green) and `var(--gold)` `#e8b84b`.

### 4.2 Page Structure: `pages/scoreboard.jsx`

**1. Page Header Section**
- Title: "CHAMPIONS OF THE STANDS"
- Subtext: "Verified on-chain stadium attendance. Real fans, real rankings."

**2. Navigation / Filters**
- A tab or dropdown selector: [Global Hall of Fame] | [Karachi Kings] | [Lahore Qalandars] | [Peshawar Zalmi] etc.
- Clicking a team fetches the specific `getTopTeamFans(team)` array.

**3. The Podium Component (`components/TopPodium.jsx`)**
- Visually highlights Rank 1, 2, and 3.
- Rank 1: Larger avatar/hex shape, glowing gold border.
- Rank 2 & 3: Slightly smaller, silver/bronze distinct tints.
- Displays abbreviated wallet `0xABCD...1234` and the Score number.

**4. The Leaderboard List Component (`components/ScoreboardTable.jsx`)**
- Ranks 4 through 10 displayed in a clean, glassmorphic table.
- Columns: `RANK` | `WALLET ADDRESS` | `MATCHES ATTENDED` | `FAN TIER`
- **Fan Tiers (Calculated dynamically on frontend)**:
  - `> 10`: 💎 Diamond Legend
  - `> 5`: 🪙 Gold Supporter
  - `> 2`: 🟢 Verified Fan

**5. Personal Stats Pane (`components/MyFanStats.jsx`)**
- Stickied to the right side (or bottom on mobile).
- Calls `totalMatchesAttended(myAddress)`.
- Displays the user's personal attendance record and a progress bar to the next Fan Tier.

---

## 5. Implementation Workflow & Milestones

### Phase 1: Smart Contract Modifications
1. Open `smart-contracts/contracts/ChainPass.sol`.
2. Introduce the mapping variables, `FanScore` struct, and Top 10 arrays.
3. Write `_updateLeaderboard` internal logic (iterate backwards from 9 to 0, shift lower scores down, insert new score).
4. Create the `redeemTicket` functionality.
5. Add getter functions.
6. Configure `hardhat.config.js` to include the **WireFluid** testnet (`https://evm.wirefluid.com`).
7. Compile and test deployment script updates. 

### Phase 2: Web3 Integration (Frontend Utils)
1. Update `frontend/utils/contract.json` with the new compiled ABI after deploying the updated contract.
2. Add helper functions inside a new `frontend/utils/scoreboard.js`:
   - `fetchGlobalTop10(contract)`
   - `fetchTeamTop10(contract, teamName)`
   - `fetchMyPersonalScore(contract, address)`

### Phase 3: UI Implementation
1. Create `frontend/pages/scoreboard.jsx` layout wrapper.
2. Create `TopPodium` React component with custom CSS mimicking the neon aesthetic.
3. Create `ScoreboardTable` React component.
4. Implement React state (`useState`, `useEffect`) to fetch Web3 data on page load.
5. Handle loading states with a cyberpunk scanline animation (reusing animations from `globals.css`).

### Phase 4: Full End-to-End Testing (Localhost)
1. Deploy contract on Hardhat localhost.
2. Mint 20 tickets across 5 different dummy wallets.
3. Simulate the "Stadium Gate" by calling `redeemTicket` from the Admin wallet for various tickets and teams.
4. Verify the frontend updates the Top 10 list live without requiring page refreshes (listen to `TicketRedeemed` events to trigger a re-fetch).

---

## 6. Security and Edge Cases Addressed
- **Re-entrancy Guard**: Used on `redeemTicket` to prevent double-increment attacks.
- **Array Shifting Logic**: The Top 10 insertion algorithm must ensure that if a wallet is *already* in the Top 10 and increases its score, it shifts up correctly without duplicating the wallet entry in the array.
- **Gas Costs**: Keeping the array bounded to strictly 10 items ensures the insertion loop costs are fixed and negligible.
