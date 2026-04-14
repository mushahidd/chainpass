const hre = require("hardhat");
const contractInfo = require("../../frontend/utils/contract.json");

async function main() {
  const [deployer, pcbVault, user1, user2] = await hre.ethers.getSigners();
  const ChainPass = await hre.ethers.getContractAt("ChainPass", contractInfo.address);

  console.log("Mocking Stadium Gateway Check-ins...");

  // Let's assume user1 has ticket 0, 1, 2 from the deployment script
  try {
      await (await ChainPass.redeemTicket(0, "Karachi Kings", "Lahore Qalandars")).wait();
      console.log("- User1 redeemed Ticket 0 (KK vs LQ)");
      
      await (await ChainPass.redeemTicket(1, "Islamabad United", "Multan Sultans")).wait();
      console.log("- User1 redeemed Ticket 1 (IU vs MS)");

      await (await ChainPass.redeemTicket(2, "Karachi Kings", "Peshawar Zalmi")).wait();
      console.log("- User1 redeemed Ticket 2 (KK vs PZ)");
  } catch(e) {
      console.log("Redeem failed:", e.message);
  }

  // Assign user2 a ticket and redeem it
  try {
      const txMint = await ChainPass.mintTicket(user2.address, "ipfs://test", hre.ethers.parseEther("0.1"), "PSL - QG vs KK");
      await txMint.wait();
      // Since 0,1,2 were minted, this should be token 3
      await (await ChainPass.redeemTicket(3, "Quetta Gladiators", "Karachi Kings")).wait();
      console.log("- User2 redeemed Ticket 3 (QG vs KK)");
      
      // And one more
      const txMint4 = await ChainPass.mintTicket(user2.address, "ipfs://test2", hre.ethers.parseEther("0.1"), "PSL - PZ vs LQ");
      await txMint4.wait();
      await (await ChainPass.redeemTicket(4, "Peshawar Zalmi", "Lahore Qalandars")).wait();
      console.log("- User2 redeemed Ticket 4 (PZ vs LQ)");
  } catch(e) {
      console.log("Redeem failed user2:", e.message);
  }

  console.log("Global scoreboard state:");
  const global = await ChainPass.getTopGlobalFans();
  global.forEach((fan, index) => {
      if (Number(fan.score) > 0) {
          console.log(` Rank ${index+1}: ${fan.wallet} - ${fan.score} Matches`);
      }
  });
}

main().catch(console.error);
