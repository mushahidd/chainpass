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

function syncFrontendContractConfig(address, abi) {
  const contractDataPath = path.join(__dirname, "../../frontend/utils/contractData.json");
  fs.writeFileSync(contractDataPath, JSON.stringify({ address, abi }, null, 2));

  const envPath = path.join(__dirname, "../../frontend/.env.local");
  try {
    let envData = fs.readFileSync(envPath, "utf8");
    envData = upsertEnvVar(envData, "WIREFLUID_RPC_URL", hre.network.config.url || "https://evm.wirefluid.com");
    envData = upsertEnvVar(envData, "NEXT_PUBLIC_CHAIN_ID", 92533);
    envData = upsertEnvVar(envData, "NEXT_PUBLIC_NETWORK_NAME", "WireFluid Testnet");
    envData = upsertEnvVar(envData, "NEXT_PUBLIC_CONTRACT_ADDRESS", address);

    if (process.env.PRIVATE_KEY) {
      envData = upsertEnvVar(envData, "SCANNER_PRIVATE_KEY", process.env.PRIVATE_KEY);
    }

    fs.writeFileSync(envPath, envData);
  } catch (error) {
    console.log("Could not auto-update frontend/.env.local:", error.message);
  }
}

async function main() {
  if (hre.network.name !== "wirefluid") {
    throw new Error("This deployment is locked to WireFluid. Use --network wirefluid or npm run deploy:wirefluid.");
  }

  const [deployer] = await hre.ethers.getSigners();

  console.log("----------------------------------------------------");
  console.log("CHAINPASS PSL - DEPLOYMENT READY");
  console.log("----------------------------------------------------");
  console.log("Network:", hre.network.name);
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy ChainPass Contract
  const ChainPass = await hre.ethers.getContractFactory("ChainPass");
  const chainpass = await ChainPass.deploy();

  await chainpass.waitForDeployment();
  const contractAddress = await chainpass.getAddress();

  console.log("ChainPass contract deployed to:", contractAddress);

  // Authorize deployer as scanner for testing
  const scannerTx = await chainpass.setScanner(deployer.address, true);
  await scannerTx.wait();
  console.log("Set deployer as authorized scanner.");

  const artifactPath = path.join(__dirname, "../artifacts/contracts/ChainPass.sol/ChainPass.json");
  const artifact = require(artifactPath);
  syncFrontendContractConfig(contractAddress, artifact.abi);
  console.log("Updated frontend contract address and ABI.");
  console.log("Updated frontend WireFluid RPC, chain id, and network label.");
  console.log("Next step: run `npm run initialize:wirefluid` to seed demo matches.");

  console.log("----------------------------------------------------");
  console.log("DEPLOYMENT COMPLETE");
  console.log("----------------------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
