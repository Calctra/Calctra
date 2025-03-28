const { 
  SolanaWallet, 
  SolanaTokenManager, 
  TransactionManager,
  initializeSolanaServices 
} = require('./solana');

/**
 * Initialize blockchain services
 * @param {Object} config Configuration object
 * @returns {Object} Object containing initialized blockchain services
 */
function initializeBlockchainServices(config = {}) {
  const solanaConfig = {
    rpcUrl: process.env.SOLANA_RPC_URL,
    network: process.env.SOLANA_NETWORK || 'mainnet-beta',
    ...config.solana
  };
  
  // Initialize Solana services
  const solana = initializeSolanaServices(solanaConfig);
  
  return {
    solana
  };
}

module.exports = {
  SolanaWallet,
  SolanaTokenManager,
  TransactionManager,
  initializeSolanaServices,
  initializeBlockchainServices
}; 