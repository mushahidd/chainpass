const hre = require("hardhat");

async function main() {
  const [deployer, pcbVault, user1, user2] = await hre.ethers.getSigners();

  console.log("----------------------------------------------------");
  console.log("CHAINPASS PSL - DEPLOYMENT READY");
  console.log("----------------------------------------------------");
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("PCB Vault Address:", pcbVault.address);

  // Deploy ChainPass Contract
  const ChainPass = await hre.ethers.getContractFactory("ChainPass");
  const chainpass = await ChainPass.deploy(pcbVault.address);

  await chainpass.waitForDeployment();
  const contractAddress = await chainpass.getAddress();

  console.log("ChainPass Contract deployed to:", contractAddress);

  // Minting initial batch of match tickets for the demo
  const sampleTickets = [
    {
      name: "PSL ELIMINATOR - KK vs LQ",
      price: hre.ethers.parseEther("0.1"), // 0.1 ETH/MATIC
      details: "General Enclosure, Row 4",
      uri: "ipfs://test-ticket-1"
    },
    {
      name: "PSL QUALIFIER - IU vs MS",
      price: hre.ethers.parseEther("0.2"),
      details: "VIP Box 12, Level 2",
      uri: "ipfs://test-ticket-2"
    },
    {
      name: "PSL FINAL - FINAL MATCH",
      price: hre.ethers.parseEther("0.5"),
      details: "Presidential Enclosure",
      uri: "ipfs://test-ticket-3"
    }
  ];

  console.log("\nMinting sample tickets...");
  for (let i = 0; i < sampleTickets.length; i++) {
    const t = sampleTickets[i];
    const tx = await chainpass.mintTicket(
      user1.address,
      t.uri,
      t.price,
      `${t.name} | ${t.details}`
    );
    await tx.wait();
    console.log(`- Minted: ${t.name} (ID: ${i}) to ${user1.address}`);
  }

  console.log("\n----------------------------------------------------");
  console.log("DEPLOYMENT COMPLETE");
  console.log("----------------------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
