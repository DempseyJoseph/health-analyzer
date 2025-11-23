import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const CONTRACT_NAME = "HealthAnalyzer";

// <root>/backend
const rel = "../backend";

// <root>/frontend/abi
const outdir = path.resolve("./abi");

if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir);
}

const dir = path.resolve(rel);
const dirname = path.basename(dir);

const line =
  "\n===================================================================\n";

if (!fs.existsSync(dir)) {
  console.error(
    `${line}Unable to locate ${rel}. Expecting <root>/backend${line}`
  );
  process.exit(1);
}

if (!fs.existsSync(outdir)) {
  console.error(`${line}Unable to locate ${outdir}.${line}`);
  process.exit(1);
}

const deploymentsDir = path.join(dir, "deployments");

// Chain configuration mapping: chainName -> { chainId, chainName }
const CHAIN_CONFIG = {
  localhost: { chainId: 31337, chainName: "hardhat" },
  sepolia: { chainId: 11155111, chainName: "sepolia" },
};

/**
 * Read deployment information for a specific chain
 * @param {string} chainName - The chain name (e.g., "localhost", "sepolia")
 * @param {string} contractName - The contract name
 * @returns {Object|undefined} Deployment object with address, abi, and chainId, or undefined if not found
 */
function readDeployment(chainName, contractName) {
  const chainDeploymentDir = path.join(deploymentsDir, chainName);

  if (!fs.existsSync(chainDeploymentDir)) {
    console.log(`Skipping ${chainName}: deployment directory not found`);
    return undefined;
  }

  const contractFile = path.join(chainDeploymentDir, `${contractName}.json`);
  if (!fs.existsSync(contractFile)) {
    console.log(`Skipping ${chainName}: contract file not found`);
    return undefined;
  }

  try {
    const jsonString = fs.readFileSync(contractFile, "utf-8");
    const obj = JSON.parse(jsonString);
    const config = CHAIN_CONFIG[chainName];
    if (config) {
      obj.chainId = config.chainId;
      obj.chainName = config.chainName;
    }
    console.log(`Found deployment on ${chainName}: ${obj.address}`);
    return obj;
  } catch (error) {
    console.log(`Skipping ${chainName}: error reading deployment - ${error.message}`);
    return undefined;
  }
}

// Collect all deployments
const deployments = {};
let referenceABI = null;

// Try to read deployments for all known chains
for (const [chainName, config] of Object.entries(CHAIN_CONFIG)) {
  const deployment = readDeployment(chainName, CONTRACT_NAME);
  if (deployment) {
    deployments[config.chainId.toString()] = {
      address: deployment.address,
      chainId: config.chainId,
      chainName: config.chainName,
    };
    // Use the first found deployment's ABI as reference
    if (!referenceABI) {
      referenceABI = deployment.abi;
    }
  }
}

// If no deployments found, exit with error
if (Object.keys(deployments).length === 0) {
  console.error(
    `${line}No deployments found. Please deploy the contract first.\n\n1. Goto '${dirname}' directory\n2. Run 'npx hardhat deploy --network <network>'.${line}`
  );
  process.exit(1);
}

// Ensure we have a reference ABI
if (!referenceABI) {
  console.error(`${line}No ABI found in any deployment.${line}`);
  process.exit(1);
}

// Ensure Sepolia (11155111) is in the addresses, even if not deployed
if (!deployments["11155111"]) {
  console.log("Sepolia deployment not found, using zero address");
  deployments["11155111"] = {
    address: "0x0000000000000000000000000000000000000000",
    chainId: 11155111,
    chainName: "sepolia",
  };
}

// Ensure localhost (31337) is in the addresses, even if not deployed
if (!deployments["31337"]) {
  console.log("Localhost deployment not found, using zero address");
  deployments["31337"] = {
    address: "0x0000000000000000000000000000000000000000",
    chainId: 31337,
    chainName: "hardhat",
  };
}

// Generate TypeScript code for ABI
const tsCode = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}ABI = ${JSON.stringify({ abi: referenceABI }, null, 2)} as const;
\n`;

// Generate TypeScript code for addresses
// Sort by chainId for consistent output
const sortedChainIds = Object.keys(deployments).sort((a, b) => parseInt(a) - parseInt(b));
const addressEntries = sortedChainIds
  .map((chainId) => {
    const deployment = deployments[chainId];
    return `  "${chainId}": { address: "${deployment.address}", chainId: ${deployment.chainId}, chainName: "${deployment.chainName}" }`;
  })
  .join(",\n");

const tsAddresses = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}Addresses = { 
${addressEntries}
};
`;

console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}ABI.ts`)}`);
console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}Addresses.ts`)}`);
console.log(`Found deployments for chains: ${sortedChainIds.join(", ")}`);

fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}ABI.ts`), tsCode, "utf-8");
fs.writeFileSync(
  path.join(outdir, `${CONTRACT_NAME}Addresses.ts`),
  tsAddresses,
  "utf-8"
);

