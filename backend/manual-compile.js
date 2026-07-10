// Workaround for sandboxed environments that block binaries.soliditylang.org
// (Hardhat's default compiler downloader). Uses the npm-distributed solc
// (WASM) package - same compiler version, same output - and writes the
// artifact in the exact format Hardhat expects, so `hardhat run --no-compile`
// and `hardhat test --no-compile` work normally afterward.
const fs = require("fs");
const path = require("path");
const solc = require("solc");

function findImports(importPath) {
  const p = path.join(__dirname, "node_modules", importPath);
  if (fs.existsSync(p)) return { contents: fs.readFileSync(p, "utf8") };
  return { error: `File not found: ${importPath}` };
}

const source = fs.readFileSync(
  path.join(__dirname, "contracts", "LandRegistry.sol"),
  "utf8"
);

const input = {
  language: "Solidity",
  sources: { "contracts/LandRegistry.sol": { content: source } },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: {
      "*": { "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object"] },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

let hasError = false;
for (const err of output.errors || []) {
  if (err.severity === "error") {
    hasError = true;
    console.error(err.formattedMessage);
  }
}
if (hasError) {
  console.error("Compilation failed.");
  process.exit(1);
}

const contract = output.contracts["contracts/LandRegistry.sol"]["LandRegistry"];

const artifact = {
  _format: "hh-sol-artifact-1",
  contractName: "LandRegistry",
  sourceName: "contracts/LandRegistry.sol",
  abi: contract.abi,
  bytecode: "0x" + contract.evm.bytecode.object,
  deployedBytecode: "0x" + contract.evm.deployedBytecode.object,
  linkReferences: {},
  deployedLinkReferences: {},
};

const outDir = path.join(__dirname, "artifacts", "contracts", "LandRegistry.sol");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, "LandRegistry.json"),
  JSON.stringify(artifact, null, 2)
);

console.log("Wrote artifacts/contracts/LandRegistry.sol/LandRegistry.json");
console.log("ABI entries:", artifact.abi.length);
console.log("Bytecode length (bytes):", (artifact.bytecode.length - 2) / 2);
