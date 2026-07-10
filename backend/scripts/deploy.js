const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying LandRegistry with account:", deployer.address);

  const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
  const registry = await LandRegistry.deploy(deployer.address);
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log("LandRegistry deployed to:", address);

  // Persist address + ABI where the Express server expects to find them.
  const artifact = await hre.artifacts.readArtifact("LandRegistry");
  const outDir = path.join(__dirname, "..", "server", "config");
  fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(
    path.join(outDir, "contract.json"),
    JSON.stringify(
      {
        address,
        network: hre.network.name,
        chainId: hre.network.config.chainId,
        abi: artifact.abi,
      },
      null,
      2
    )
  );

  console.log(`Contract address + ABI written to server/config/contract.json`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
