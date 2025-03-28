const { Keypair, Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const nacl = require('tweetnacl');
const bs58 = require('bs58');
const logger = require('../../utils/logger');

/**
 * Solana wallet manager class for handling wallet operations
 */
class SolanaWallet {
  /**
   * Create a SolanaWallet instance
   * @param {Object} config - Configuration object
   * @param {string} config.rpcUrl - Solana RPC URL
   * @param {string} config.network - Solana network (mainnet-beta, testnet, devnet)
   */
  constructor(config = {}) {
    this.rpcUrl = config.rpcUrl || process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    this.network = config.network || process.env.SOLANA_NETWORK || 'mainnet-beta';
    this.connection = new Connection(this.rpcUrl);
    
    logger.info(`SolanaWallet initialized with network: ${this.network}`);
  }
  
  /**
   * Create a new Solana wallet
   * @returns {Object} Wallet object with keypair, public key and secret key
   */
  createWallet() {
    try {
      const keypair = Keypair.generate();
      const publicKey = keypair.publicKey.toString();
      const secretKey = bs58.encode(keypair.secretKey);
      
      return {
        keypair,
        publicKey,
        secretKey
      };
    } catch (error) {
      logger.error('Failed to create wallet', { error: error.message });
      throw new Error(`Failed to create wallet: ${error.message}`);
    }
  }
  
  /**
   * Import wallet from private key
   * @param {string} privateKey - Private key in base58 format
   * @returns {Object} Wallet object with keypair, public key and secret key
   */
  importWalletFromPrivateKey(privateKey) {
    try {
      // If the private key is in base58 format, decode it
      const secretKey = bs58.decode(privateKey);
      const keypair = Keypair.fromSecretKey(secretKey);
      const publicKey = keypair.publicKey.toString();
      
      return {
        keypair,
        publicKey,
        secretKey: privateKey
      };
    } catch (error) {
      logger.error('Failed to import wallet', { error: error.message });
      throw new Error(`Failed to import wallet: ${error.message}`);
    }
  }
  
  /**
   * Get SOL balance for an address
   * @param {string} address - Solana wallet address
   * @returns {number} Balance in SOL
   */
  async getSolBalance(address) {
    try {
      const publicKey = new PublicKey(address);
      const balance = await this.connection.getBalance(publicKey);
      // Convert lamports to SOL
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      logger.error('Failed to get SOL balance', { address, error: error.message });
      throw new Error(`Failed to get SOL balance: ${error.message}`);
    }
  }
  
  /**
   * Get token balance for an address
   * @param {string} address - Solana wallet address
   * @param {string} [tokenMintAddress] - Token mint address (optional, uses CAL token if not provided)
   * @returns {number} Token balance
   */
  async getTokenBalance(address, tokenMintAddress) {
    try {
      const mintAddress = tokenMintAddress || process.env.CAL_TOKEN_MINT_ADDRESS;
      
      if (!mintAddress) {
        throw new Error('Token mint address is required');
      }
      
      const publicKey = new PublicKey(address);
      const mint = new PublicKey(mintAddress);
      
      // Get all token accounts owned by this address
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        publicKey,
        { mint }
      );
      
      // Sum all balances (normally there would be only one account per token)
      let balance = 0;
      if (tokenAccounts.value.length > 0) {
        for (const accountInfo of tokenAccounts.value) {
          const parsedInfo = accountInfo.account.data.parsed.info;
          balance += parsedInfo.tokenAmount.uiAmount;
        }
      }
      
      return balance;
    } catch (error) {
      logger.error('Failed to get token balance', { address, error: error.message });
      throw new Error(`Failed to get token balance: ${error.message}`);
    }
  }
  
  /**
   * Get transaction history for an address
   * @param {string} address - Solana wallet address
   * @param {number} [limit=10] - Max number of transactions to return
   * @returns {Array} Array of transactions
   */
  async getTransactionHistory(address, limit = 10) {
    try {
      const publicKey = new PublicKey(address);
      const transactions = await this.connection.getSignaturesForAddress(publicKey, { limit });
      
      return transactions.map(tx => ({
        signature: tx.signature,
        slot: tx.slot,
        timestamp: tx.blockTime ? new Date(tx.blockTime * 1000).toISOString() : null,
        confirmationStatus: tx.confirmationStatus,
        err: tx.err
      }));
    } catch (error) {
      logger.error('Failed to get transaction history', { address, error: error.message });
      throw new Error(`Failed to get transaction history: ${error.message}`);
    }
  }
  
  /**
   * Send SOL from one account to another
   * @param {Object} params - Transaction parameters
   * @param {string} params.fromSecretKey - Sender's secret key
   * @param {string} params.toPublicKey - Recipient's public key
   * @param {number} params.amount - Amount in SOL
   * @returns {string} Transaction signature
   */
  async sendSol({ fromSecretKey, toPublicKey, amount }) {
    try {
      // Import the sender's wallet
      const fromWallet = this.importWalletFromPrivateKey(fromSecretKey);
      const toWalletPublicKey = new PublicKey(toPublicKey);
      
      // Create a transfer instruction
      const transaction = await this.createSolTransferTransaction({
        fromPublicKey: fromWallet.keypair.publicKey,
        toPublicKey: toWalletPublicKey,
        amount
      });
      
      // Sign and send transaction
      const signature = await this.connection.sendTransaction(transaction, [fromWallet.keypair]);
      
      // Wait for confirmation
      await this.connection.confirmTransaction(signature);
      
      logger.info('SOL transfer completed', { 
        from: fromWallet.publicKey, 
        to: toPublicKey, 
        amount, 
        signature 
      });
      
      return signature;
    } catch (error) {
      logger.error('Failed to send SOL', { to: toPublicKey, amount, error: error.message });
      throw new Error(`Failed to send SOL: ${error.message}`);
    }
  }
  
  /**
   * Create a SOL transfer transaction (without sending)
   * @param {Object} params - Transaction parameters
   * @param {PublicKey} params.fromPublicKey - Sender's public key
   * @param {PublicKey} params.toPublicKey - Recipient's public key
   * @param {number} params.amount - Amount in SOL
   * @returns {Transaction} Solana transaction
   */
  async createSolTransferTransaction({ fromPublicKey, toPublicKey, amount }) {
    try {
      const { SystemProgram, Transaction } = require('@solana/web3.js');
      
      // Convert SOL to lamports
      const lamports = amount * LAMPORTS_PER_SOL;
      
      // Create transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: fromPublicKey,
          toPubkey: toPublicKey,
          lamports
        })
      );
      
      // Get recent blockhash
      const { blockhash } = await this.connection.getRecentBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromPublicKey;
      
      return transaction;
    } catch (error) {
      logger.error('Failed to create SOL transfer transaction', { error: error.message });
      throw new Error(`Failed to create SOL transfer transaction: ${error.message}`);
    }
  }
  
  /**
   * Sign a message using a private key
   * @param {string} message - Message to sign
   * @param {string} privateKey - Private key in base58 format
   * @returns {Object} Signature and public key
   */
  signMessage(message, privateKey) {
    try {
      const secretKey = bs58.decode(privateKey);
      const messageBytes = Buffer.from(message);
      const signature = nacl.sign.detached(messageBytes, secretKey);
      
      // Get the public key
      const keypair = Keypair.fromSecretKey(secretKey);
      const publicKey = keypair.publicKey.toString();
      
      return {
        signature: bs58.encode(signature),
        publicKey
      };
    } catch (error) {
      logger.error('Failed to sign message', { error: error.message });
      throw new Error(`Failed to sign message: ${error.message}`);
    }
  }
  
  /**
   * Verify a message signature
   * @param {string} message - Original message
   * @param {string} signature - Signature in base58 format
   * @param {string} publicKey - Public key that signed the message
   * @returns {boolean} Whether the signature is valid
   */
  verifySignature(message, signature, publicKey) {
    try {
      const messageBytes = Buffer.from(message);
      const signatureBytes = bs58.decode(signature);
      const publicKeyBytes = new PublicKey(publicKey).toBytes();
      
      return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
    } catch (error) {
      logger.error('Failed to verify signature', { error: error.message });
      throw new Error(`Failed to verify signature: ${error.message}`);
    }
  }
}

module.exports = SolanaWallet; 