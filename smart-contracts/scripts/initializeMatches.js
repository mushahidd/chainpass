const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

function upsertEnvVar(envData, key, value) {
  const escaped = String(value).replace(/\\/g, "\\\\").replace(/\"/g, "\\\"");
  const line = `${key}="${escaped}"`;

  if (new RegExp(`^${key}=.*$`, "m").test(envData)) {
    return envData.replace(new RegExp(`^${key}=.*$`, "m"), line);
  }

  return `${envData.trimEnd()}\n${line}\n`;
}

async function main() {
  if (hre.network.name !== "wirefluid") {
    throw new Error("This initializer is locked to WireFluid. Use --network wirefluid or npm run initialize:wirefluid.");
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
    "Group Match",
    "Karachi Kings vs Lahore Qalandars",
    "National Bank Cricket Arena, Karachi",
    Math.floor(Date.now() / 1000) + 86400, // +1 day
    ["Iqbal Qasim", "Wasim Akram", "Hanif Mohammad"],
    [
      hre.ethers.parseEther("0.10"),
      hre.ethers.parseEther("0.20"),
      hre.ethers.parseEther("0.30")
    ],
    [5000, 2000, 1000]
  );
  await tx.wait();
  console.log("-> Match Created: KK vs LQ at National Stadium");

  // Match 1
  tx = await chainpass.createMatch(
    "Qualifier",
    "Islamabad United vs Multan Sultans",
    "Rawalpindi Cricket Stadium, Rawalpindi",
    Math.floor(Date.now() / 1000) + 172800, // +2 days
    ["Sohail Tanvir", "Azhar Mahmood", "Imran Khan"],
    [
      hre.ethers.parseEther("0.10"),
      hre.ethers.parseEther("0.20"),
      hre.ethers.parseEther("0.30")
    ],
    [5000, 2000, 1000]
  );
  await tx.wait();
  console.log("-> Match Created: IU vs MS at Rawalpindi");

  // Match 2
  tx = await chainpass.createMatch(
    "Final",
    "PSL GRAND FINAL",
    "Gaddafi Stadium, Lahore",
    Math.floor(Date.now() / 1000) + 604800, // +7 days
    ["Saeed Ahmad", "Rajas", "Fazal Mahmood"],
    [
      hre.ethers.parseEther("0.10"),
      hre.ethers.parseEther("0.20"),
      hre.ethers.parseEther("0.30")
    ],
    [5000, 2000, 1000]
  );
  await tx.wait();
  console.log("-> Match Created: PSL GRAND FINAL at Gaddafi Stadium");

  // Write contract.json dynamically
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
    envData = upsertEnvVar(envData, "WIREFLUID_RPC_URL", hre.network.config.url || "https://evm.wirefluid.com");
    envData = upsertEnvVar(envData, "NEXT_PUBLIC_CHAIN_ID", 92533);
    envData = upsertEnvVar(envData, "NEXT_PUBLIC_NETWORK_NAME", "WireFluid Testnet");
    envData = upsertEnvVar(envData, "NEXT_PUBLIC_CONTRACT_ADDRESS", address);

    if (process.env.PRIVATE_KEY) {
      envData = upsertEnvVar(envData, "SCANNER_PRIVATE_KEY", process.env.PRIVATE_KEY);
    }

    fs.writeFileSync(envPath, envData);
  } catch (e) {
    console.log("Could not auto-update .env.local:", e.message);
  }

  console.log("----------------------------------------------------");
  console.log("DEPLOYMENT COMPLETE");
  console.log("-> Automatically updated frontend/utils/contractData.json with ABI & Address:", address);
  console.log("-> Automatically updated frontend/.env.local with WireFluid network config and address");
  console.log("----------------------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
