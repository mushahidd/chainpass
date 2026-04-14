import { ethers } from 'ethers';
import contractInfo from '../../utils/contractData.json';

const QR_TTL_SECONDS = 30;

const ABI = [
  "function getTicketData(uint256 tokenId) view returns (address owner, tuple(uint256 matchId, string enclosure, uint256 paidPrice, bytes32 cnicHash, bool isUsed) ticketObj, tuple(string teams, string stadium, uint256 maxCapacity, uint256 currentMinted, bool isActive) matchObj)",
  "function markTicketAsUsed(uint256 tokenId)",
  "function ownerOf(uint256 tokenId) view returns (address)"
];

const RPC_URL = process.env.WIREFLUID_RPC_URL || "https://evm.wirefluid.com";
const SCANNER_PK = process.env.SCANNER_PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || contractInfo.address;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!SCANNER_PK) {
    return res.status(500).json({ valid: false, message: 'SCANNER_PRIVATE_KEY_NOT_CONFIGURED' });
  }

  if (!CONTRACT_ADDRESS) {
    return res.status(500).json({ valid: false, message: 'NEXT_PUBLIC_CONTRACT_ADDRESS_NOT_CONFIGURED' });
  }

  try {
    const { qrData, cnicHash } = req.body;
    
    // 1. Parse JSON
    const parsed = JSON.parse(qrData);
    const { p, qS, sP, dS } = parsed;
    
    // 2. Verify Timestamp
    const now = Math.floor(Date.now() / 1000);
    if (now - p.timestamp > QR_TTL_SECONDS) {
      return res.status(400).json({ valid: false, message: 'QR_EXPIRED' });
    }

    // 3. Verify Session Signature
    const payloadStr = JSON.stringify(p);
    const payloadHash = ethers.id(payloadStr);
    const recoveredSessionPubKey = ethers.verifyMessage(ethers.getBytes(payloadHash), qS);
    if (recoveredSessionPubKey.toLowerCase() !== sP.toLowerCase()) {
      return res.status(400).json({ valid: false, message: 'INVALID_SESSION_SIG' });
    }

    // 4. Verify Delegation Signature
    const expectedMessage = `Authorize ChainPass Session Key:\n${sP}`;
    const recoveredUser = ethers.verifyMessage(expectedMessage, dS);
    if (recoveredUser.toLowerCase() !== p.userAddress.toLowerCase()) {
      return res.status(400).json({ valid: false, message: 'INVALID_DELEGATION_SIG' });
    }

    // 5. Connect to Contract
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(SCANNER_PK, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

    // 6. Verify Ownership & State
    const [ownerAddr, ticketInfo, matchInfo] = await contract.getTicketData(p.tokenId);
    
    if (ownerAddr.toLowerCase() !== p.userAddress.toLowerCase()) {
      return res.status(400).json({ valid: false, message: 'NOT_TICKET_OWNER' });
    }

    if (ticketInfo.isUsed) {
      return res.status(400).json({ valid: false, message: 'TICKET_ALREADY_USED' });
    }

    // --- STEP 7: CNIC FRAUD PREVENTION HASH CHECK ---
    if (ticketInfo.cnicHash !== cnicHash) {
      return res.status(400).json({ valid: false, message: 'CNIC MISMATCH. PHYSICAL ID REJECTED.' });
    }

    // 8. Execute State Change
    const tx = await contract.markTicketAsUsed(p.tokenId);
    await tx.wait();

    // 9. Format Success Return string with precise routing
    const routingStr = `${matchInfo.teams}|${matchInfo.stadium}|ENCLOSURE: ${ticketInfo.enclosure}`;

    return res.status(200).json({ valid: true, message: routingStr, txHash: tx.hash });

  } catch (error) {
    console.error("Scan verification error:", error);
    return res.status(500).json({ valid: false, message: 'INTERNAL_ERROR_OR_TX_FAILED' });
  }
}
