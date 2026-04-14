const hre = require("hardhat");

async function main() {
  if (hre.network.name === 'hardhat') {
    throw new Error("Refusing to initialize on transient 'hardhat' network. Use --network localhost or npm run initialize:local.");
  }

  const [deployer] = await hre.ethers.getSigners();
  console.log("----------------------------------------------------");
  console.log("CHAINPASS PSL - SUPER MATCH INITIALIZATION");
  console.log("----------------------------------------------------");
  console.log("Deploying contract with the account:", deployer.address);

  // Deploy Contract
  const ChainPass = await hre.ethers.getContractFactory("ChainPass");
  const chainpass = await ChainPass.deploy();
  await chainpass.waitForDeployment();
  const address = await chainpass.getAddress();
  
  console.log("ChainPass Contract deployed to:", address);

  // Set deployer as scanner
  let tx = await chainpass.setScanner(deployer.address, true);
  await tx.wait();
  console.log("-> Set Deployer as authorized scanner!");

  console.log("\nInitializing Active Matches...");

  // Match 0
  tx = await chainpass.createMatch(
    "Karachi Kings vs Lahore Qalandars",
    "National Stadium Karachi",
    hre.ethers.parseEther("0.01"), // keep it cheap for demo
    50000
  );
  await tx.wait();
  console.log("-> Match Created: KK vs LQ at National Stadium");

  // Match 1
  tx = await chainpass.createMatch(
    "Islamabad United vs Multan Sultans",
    "Rawalpindi Cricket Stadium",
    hre.ethers.parseEther("0.01"),
    30000
  );
  await tx.wait();
  console.log("-> Match Created: IU vs MS at Rawalpindi");

  // Match 2
  tx = await chainpass.createMatch(
    "PSL GRAND FINAL",
    "Gaddafi Stadium Lahore",
    hre.ethers.parseEther("0.02"),
    60000
  );
  await tx.wait();
  console.log("-> Match Created: PSL GRAND FINAL at Gaddafi Stadium");

  // Write contract.json dynamically
  const fs = require('fs');
  const path = require('path');
  const artifactPath = path.join(__dirname, "../artifacts/contracts/ChainPass.sol/ChainPass.json");
  const artifact = require(artifactPath);
  
  const contractJson = {
    address: address,
    abi: artifact.abi
  };
  
  const outPath = path.join(__dirname, "../../frontend/utils/contractData.json");
  fs.writeFileSync(outPath, JSON.stringify(contractJson, null, 2));

  // Write env.local dynamically
  const envPath = path.join(__dirname, "../../frontend/.env.local");
  try {
    let envData = fs.readFileSync(envPath, 'utf8');
    envData = envData.replace(/NEXT_PUBLIC_CONTRACT_ADDRESS=.*/, `NEXT_PUBLIC_CONTRACT_ADDRESS="${address}"`);
    fs.writeFileSync(envPath, envData);
  } catch (e) {
    console.log("Could not auto-update .env.local:", e.message);
  }

  console.log("----------------------------------------------------");
  console.log("DEPLOYMENT COMPLETE");
  console.log("-> Automatically updated frontend/utils/contractData.json with ABI & Address:", address);
  console.log("-> Automatically updated frontend/.env.local with new address");
  console.log("----------------------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
