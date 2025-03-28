const SolanaWallet = require('./wallet');
const SolanaTokenManager = require('./token');
const TransactionManager = require('./transaction');

/**
 * Initialize Solana-related services
 * @param {Object} config Configuration object
 * @returns {Object} Object containing initialized Solana services
 */
function initializeSolanaServices(config = {}) {
  const wallet = new SolanaWallet(config);
  const tokenManager = new SolanaTokenManager(config);
  const transactionManager = new TransactionManager(config);
  
  return {
    wallet,
    tokenManager,
    transactionManager
  };
}

module.exports = {
  SolanaWallet,
  SolanaTokenManager,
  TransactionManager,
  initializeSolanaServices
}; 