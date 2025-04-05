// Simple script to check the environment configuration
const fs = require('fs');
const path = require('path');

// Read .env file manually
function readEnvFile() {
  try {
    const envPath = path.resolve(__dirname, '../.env');
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    
    content.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        env[key.trim()] = value.trim();
      }
    });
    
    return env;
  } catch (error) {
    console.error('Error reading .env file:', error.message);
    return {};
  }
}

async function main() {
  console.log("Checking environment configuration for World Chain deployment...");
  
  // Load environment variables
  const env = readEnvFile();
  
  // Check required variables
  const required = [
    'PRIVATE_KEY',
    'POOL_MANAGER_ADDRESS',
    'WORLD_ID_ADDRESS',
    'QUOTE_TOKEN_ADDRESS',
    'TOKEN0_ADDRESS',
    'TOKEN1_ADDRESS',
    'ETH_RPC_URL'
  ];
  
  let missingVars = [];
  required.forEach(variable => {
    if (!env[variable]) {
      missingVars.push(variable);
    }
  });
  
  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars.join(', '));
    process.exit(1);
  }
  
  console.log("Environment configuration complete!");
  
  // Display deployment info
  console.log("\nDeployment will use:");
  console.log("ETH_RPC_URL:", env.ETH_RPC_URL);
  console.log("POOL_MANAGER_ADDRESS:", env.POOL_MANAGER_ADDRESS);
  console.log("WORLD_ID_ADDRESS:", env.WORLD_ID_ADDRESS);
  console.log("QUOTE_TOKEN_ADDRESS:", env.QUOTE_TOKEN_ADDRESS);
  console.log("TOKEN0_ADDRESS:", env.TOKEN0_ADDRESS);
  console.log("TOKEN1_ADDRESS:", env.TOKEN1_ADDRESS);
  
  // Show hook address if available
  if (env.HOOK_ADDRESS) {
    console.log("HOOK_ADDRESS:", env.HOOK_ADDRESS);
  } else {
    console.log("\nNo HOOK_ADDRESS found - you should deploy the hook first.");
  }
  
  console.log("\nDeployment Instructions:");
  console.log("1. Deploy hook: forge script script/DeployWorldChain.s.sol --rpc-url $ETH_RPC_URL --private-key $PRIVATE_KEY --broadcast -vvvv");
  console.log("2. Update .env with HOOK_ADDRESS from step 1");
  console.log("3. Create pool: forge script script/CreatePoolWorldChain.s.sol --rpc-url $ETH_RPC_URL --private-key $PRIVATE_KEY --broadcast -vvvv");
  
  console.log("\nSee DEPLOYMENT-GUIDE.md for more details.");
}

// Execute check
main().catch((error) => {
  console.error(error);
  process.exit(1);
});