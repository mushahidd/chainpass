const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

function syncFrontendContractConfig(address, abi) {
  const contractDataPath = path.join(__dirname, "../../frontend/utils/contractData.json");
  fs.writeFileSync(contractDataPath, JSON.stringify({ address, abi }, null, 2));

  const envPath = path.join(__dirname, "../../frontend/.env.local");
  try {
    let envData = fs.readFileSync(envPath, "utf8");
    if (/NEXT_PUBLIC_CONTRACT_ADDRESS=.*/.test(envData)) {
      envData = envData.replace(/NEXT_PUBLIC_CONTRACT_ADDRESS=.*/, `NEXT_PUBLIC_CONTRACT_ADDRESS="${address}"`);
    } else {
      envData += `\nNEXT_PUBLIC_CONTRACT_ADDRESS="${address}"\n`;
    }
    fs.writeFileSync(envPath, envData);
  } catch (error) {
    console.log("Could not auto-update frontend/.env.local:", error.message);
  }
}

async function main() {
  if (hre.network.name === 'hardhat') {
    throw new Error("Refusing to deploy on transient 'hardhat' network. Use --network localhost or npm run deploy:local.");
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
  console.log("Next step: run `npm run initialize:local` to seed demo matches.");

  console.log("----------------------------------------------------");
  console.log("DEPLOYMENT COMPLETE");
  console.log("----------------------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
