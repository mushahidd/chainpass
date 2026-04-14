const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  if (hre.network.name !== "wirefluid") {
    throw new Error(`Invalid network: ${hre.network.name}. Use --network wirefluid`);
  }

  if (Number(hre.network.config.chainId) !== 92533) {
    throw new Error(`Invalid chainId: ${hre.network.config.chainId}. Expected 92533`);
  }

  if (!process.env.PRIVATE_KEY) {
    throw new Error("Missing deployer private key");
  }

  const signers = await hre.ethers.getSigners();
  const deployer = signers[0];

  if (!deployer) {
    throw new Error(
      "No deployer signer available. Set PRIVATE_KEY in smart-contracts/.env for WireFluid deployment."
    );
  }

  const pcbVaultAddress = process.env.PCB_VAULT || deployer.address;
  const demoMintTo = process.env.DEMO_MINT_TO || "";

  console.log("----------------------------------------------------");
  console.log("CHAINPASS PSL - DEPLOYMENT READY");
  console.log("----------------------------------------------------");
  console.log("NETWORK_USED:", hre.network.name);
  console.log("CHAIN_ID:", hre.network.config.chainId);
  console.log("DEPLOYER_ADDRESS:", deployer.address);
  console.log("PCB_VAULT_ADDRESS:", pcbVaultAddress);

  // Deploy ChainPass Contract
  const ChainPass = await hre.ethers.getContractFactory("ChainPass");
  const chainpass = await ChainPass.deploy(pcbVaultAddress);
  const deployTx = chainpass.deploymentTransaction();

  if (!deployTx || !deployTx.hash) {
    throw new Error("Deployment transaction missing hash");
  }

  console.log("DEPLOY_TX_HASH:", deployTx.hash);

  const deployReceipt = await deployTx.wait();
  console.log("DEPLOY_CONFIRMED_BLOCK:", deployReceipt.blockNumber);

  const resolvedAddress = deployTx.contractAddress || chainpass.target;

  if (!resolvedAddress || typeof resolvedAddress !== "string") {
    throw new Error("Unable to resolve deployed contract address from blockchain response");
  }

  if (!resolvedAddress.startsWith("0x") || resolvedAddress.length !== 42) {
    throw new Error(`Invalid deployed contract address: ${resolvedAddress}`);
  }

  const contractAddress = resolvedAddress;

  console.log("CONTRACT_DEPLOYED_ADDRESS:", contractAddress);

  if (demoMintTo) {
    console.log("\nMinting one demo ticket to:", demoMintTo);
    const mintTx = await chainpass.mintTicket(
      demoMintTo,
      "ipfs://wirefluid-demo-ticket-1",
      hre.ethers.parseEther("0.1"),
      "PSL DEMO MATCH | General Enclosure"
    );
    await mintTx.wait();
    console.log("Demo mint tx hash:", mintTx.hash);
  }

  const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", "ChainPass.sol", "ChainPass.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const frontendConfigPath = path.join(__dirname, "..", "..", "frontend", "utils", "contract.json");
  const frontendConfig = {
    address: contractAddress,
    chainId: 92533,
    abi: artifact.abi,
  };
  fs.writeFileSync(frontendConfigPath, JSON.stringify(frontendConfig, null, 2));
  console.log("FRONTEND_CONFIG_UPDATED:", frontendConfigPath);

  console.log("\n----------------------------------------------------");
  console.log("DEPLOYMENT COMPLETE");
  console.log("----------------------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
