const { Connection, Keypair, PublicKey, Transaction } = require('@solana/web3.js');
const { Token, TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const bs58 = require('bs58');
const logger = require('../utils/logger');

/**
 * SolanaClient - Handles interaction with the Solana blockchain
 */
class SolanaClient {
  constructor(options = {}) {
    this.config = {
      rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      adminPrivateKey: process.env.SOLANA_ADMIN_PRIVATE_KEY,
      calTokenMint: process.env.CAL_TOKEN_MINT_ADDRESS,
      resourceMatchingProgram: process.env.RESOURCE_MATCHING_PROGRAM_ID,
      tokenPaymentProgram: process.env.TOKEN_PAYMENT_PROGRAM_ID,
      ...options
    };
    
    // Initialize connection
    this.connection = new Connection(this.config.rpcUrl, 'confirmed');
    this.adminKeypair = null;
    this.calToken = null;
    
    logger.info(`Solana client initialized with RPC URL: ${this.config.rpcUrl}`);
  }
  
  /**
   * Initialize the Solana client and load necessary keys
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    try {
      // Load admin keypair if private key is provided
      if (this.config.adminPrivateKey) {
        const privateKeyBytes = bs58.decode(this.config.adminPrivateKey);
        this.adminKeypair = Keypair.fromSecretKey(privateKeyBytes);
        logger.info('Admin keypair loaded successfully');
      } else {
        logger.warn('No admin private key provided, some operations will be unavailable');
      }
      
      // Initialize CAL token if mint address is provided
      if (this.config.calTokenMint) {
        const mintPublicKey = new PublicKey(this.config.calTokenMint);
        this.calToken = new Token(
          this.connection,
          mintPublicKey,
          TOKEN_PROGRAM_ID,
          this.adminKeypair
        );
        logger.info('CAL token initialized successfully');
      } else {
        logger.warn('No CAL token mint address provided, token operations will be unavailable');
      }
      
      return true;
    } catch (error) {
      logger.error('Error initializing Solana client:', error);
      throw error;
    }
  }
  
  /**
   * Get information about a Solana account
   * @param {string} address - Solana account address
   * @returns {Promise<Object>} Account information
   */
  async getAccountInfo(address) {
    try {
      const publicKey = new PublicKey(address);
      const accountInfo = await this.connection.getAccountInfo(publicKey);
      
      return {
        address,
        exists: accountInfo !== null,
        lamports: accountInfo?.lamports || 0,
        owner: accountInfo?.owner?.toBase58() || null,
        executable: accountInfo?.executable || false,
        rentEpoch: accountInfo?.rentEpoch || 0,
        dataSize: accountInfo?.data.length || 0
      };
    } catch (error) {
      logger.error(`Error getting account info for ${address}:`, error);
      throw error;
    }
  }
  
  /**
   * Get SOL balance for an account
   * @param {string} address - Solana account address
   * @returns {Promise<number>} Balance in SOL
   */
  async getSolBalance(address) {
    try {
      const publicKey = new PublicKey(address);
      const balance = await this.connection.getBalance(publicKey);
      
      // Convert lamports to SOL (1 SOL = 1e9 lamports)
      return balance / 1e9;
    } catch (error) {
      logger.error(`Error getting SOL balance for ${address}:`, error);
      throw error;
    }
  }
  
  /**
   * Get CAL token balance for an account
   * @param {string} address - Solana account address
   * @returns {Promise<number>} Balance in CAL tokens
   */
  async getTokenBalance(address) {
    try {
      if (!this.calToken) {
        throw new Error('CAL token not initialized');
      }
      
      const publicKey = new PublicKey(address);
      const tokenAccounts = await this.connection.getTokenAccountsByOwner(
        publicKey,
        { mint: this.calToken.publicKey }
      );
      
      if (tokenAccounts.value.length === 0) {
        return 0;
      }
      
      // Get the balance of the first token account
      const tokenAccount = tokenAccounts.value[0];
      const accountInfo = await this.calToken.getAccountInfo(tokenAccount.pubkey);
      
      return accountInfo.amount.toNumber() / 1e6; // Assuming 6 decimal places
    } catch (error) {
      logger.error(`Error getting CAL token balance for ${address}:`, error);
      throw error;
    }
  }
  
  /**
   * Create a new Solana wallet
   * @returns {Object} New wallet details
   */
  createWallet() {
    try {
      const keypair = Keypair.generate();
      const publicKey = keypair.publicKey.toBase58();
      const privateKey = bs58.encode(keypair.secretKey);
      
      return {
        publicKey,
        privateKey
      };
    } catch (error) {
      logger.error('Error creating wallet:', error);
      throw error;
    }
  }
  
  /**
   * Airdrop SOL to an account (for development and testing)
   * @param {string} address - Solana account address
   * @param {number} amount - Amount to airdrop in SOL
   * @returns {Promise<Object>} Transaction details
   */
  async airdropSol(address, amount = 1) {
    try {
      const publicKey = new PublicKey(address);
      
      // Convert SOL to lamports (1 SOL = 1e9 lamports)
      const lamports = amount * 1e9;
      
      const signature = await this.connection.requestAirdrop(publicKey, lamports);
      await this.connection.confirmTransaction(signature);
      
      return {
        success: true,
        signature,
        amount
      };
    } catch (error) {
      logger.error(`Error airdropping SOL to ${address}:`, error);
      throw error;
    }
  }
  
  /**
   * Transfer CAL tokens from admin to a user
   * @param {string} recipient - Recipient Solana address
   * @param {number} amount - Amount to transfer
   * @returns {Promise<Object>} Transaction details
   */
  async transferTokens(recipient, amount) {
    try {
      if (!this.calToken || !this.adminKeypair) {
        throw new Error('CAL token or admin keypair not initialized');
      }
      
      const recipientPublicKey = new PublicKey(recipient);
      
      // Check if recipient has a token account
      let recipientTokenAccount;
      const tokenAccounts = await this.connection.getTokenAccountsByOwner(
        recipientPublicKey,
        { mint: this.calToken.publicKey }
      );
      
      // If recipient has no token account, create one
      if (tokenAccounts.value.length === 0) {
        recipientTokenAccount = await this.calToken.createAssociatedTokenAccount(
          recipientPublicKey
        );
      } else {
        recipientTokenAccount = tokenAccounts.value[0].pubkey;
      }
      
      // Get admin token account
      const adminTokenAccounts = await this.connection.getTokenAccountsByOwner(
        this.adminKeypair.publicKey,
        { mint: this.calToken.publicKey }
      );
      
      if (adminTokenAccounts.value.length === 0) {
        throw new Error('Admin has no CAL token account');
      }
      
      const adminTokenAccount = adminTokenAccounts.value[0].pubkey;
      
      // Transfer tokens
      const signature = await this.calToken.transfer(
        adminTokenAccount,
        recipientTokenAccount,
        this.adminKeypair,
        [],
        amount * 1e6 // Assuming 6 decimal places
      );
      
      return {
        success: true,
        signature,
        amount,
        recipient
      };
    } catch (error) {
      logger.error(`Error transferring tokens to ${recipient}:`, error);
      throw error;
    }
  }
  
  /**
   * Register a computing resource on the blockchain
   * @param {Object} resource - Resource details
   * @param {string} ownerWallet - Resource owner's wallet address
   * @returns {Promise<Object>} Transaction details
   */
  async registerResource(resource, ownerWallet) {
    try {
      if (!this.config.resourceMatchingProgram) {
        throw new Error('Resource matching program ID not configured');
      }
      
      // In a production environment, this would call the actual Solana program
      // For this MVP, we'll log the action and return a mock response
      
      logger.info(`[BLOCKCHAIN] Registering resource from owner ${ownerWallet}:`, {
        resourceId: resource._id.toString(),
        specs: {
          cpuCores: resource.specs.cpuCores,
          memoryGb: resource.specs.memoryGb,
          storageGb: resource.specs.storageGb,
          hasGpu: resource.specs.gpuCount > 0
        },
        pricePerUnit: resource.pricePerUnit,
        pricingModel: resource.pricingModel
      });
      
      // Generate a mock blockchain ID
      const blockchainResourceId = `resource_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      return {
        success: true,
        blockchainResourceId,
        transactionId: `mock_tx_${Date.now()}`,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Error registering resource on blockchain:', error);
      throw error;
    }
  }
  
  /**
   * Submit a job matching request to the blockchain
   * @param {Object} job - Job details
   * @param {string} clientWallet - Client's wallet address
   * @returns {Promise<Object>} Transaction details
   */
  async submitJobMatching(job, clientWallet) {
    try {
      if (!this.config.resourceMatchingProgram) {
        throw new Error('Resource matching program ID not configured');
      }
      
      // In a production environment, this would call the actual Solana program
      // For this MVP, we'll log the action and return a mock response
      
      logger.info(`[BLOCKCHAIN] Submitting job matching from client ${clientWallet}:`, {
        jobId: job._id.toString(),
        requirements: {
          cpuCores: job.requirements.cpuCores,
          memoryGb: job.requirements.memoryGb,
          storageGb: job.requirements.storageGb,
          needsGpu: job.requirements.needsGpu
        },
        estimatedDuration: job.requirements.estimatedDuration,
        maxPrice: job.requirements.maxPrice
      });
      
      // Generate a mock blockchain ID
      const blockchainJobId = `job_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      return {
        success: true,
        blockchainJobId,
        transactionId: `mock_tx_${Date.now()}`,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Error submitting job matching on blockchain:', error);
      throw error;
    }
  }
  
  /**
   * Process payment for a job
   * @param {Object} job - Job details
   * @param {string} clientWallet - Client's wallet address
   * @param {string} providerWallet - Provider's wallet address
   * @param {number} amount - Payment amount
   * @returns {Promise<Object>} Transaction details
   */
  async processJobPayment(job, clientWallet, providerWallet, amount) {
    try {
      if (!this.config.tokenPaymentProgram || !this.calToken) {
        throw new Error('Token payment program ID or CAL token not configured');
      }
      
      // In a production environment, this would call the actual Solana program
      // For this MVP, we'll log the action and return a mock response
      
      logger.info(`[BLOCKCHAIN] Processing job payment:`, {
        jobId: job._id.toString(),
        blockchainJobId: job.blockchainJobId,
        from: clientWallet,
        to: providerWallet,
        amount
      });
      
      return {
        success: true,
        transactionId: `mock_payment_${Date.now()}`,
        timestamp: new Date(),
        amount,
        from: clientWallet,
        to: providerWallet
      };
    } catch (error) {
      logger.error('Error processing job payment on blockchain:', error);
      throw error;
    }
  }
  
  /**
   * Get the latest status of a resource from the blockchain
   * @param {string} blockchainResourceId - Blockchain resource ID
   * @returns {Promise<Object>} Resource status
   */
  async getResourceStatus(blockchainResourceId) {
    try {
      // In a production environment, this would query the actual Solana program
      // For this MVP, we'll return a mock response
      
      logger.info(`[BLOCKCHAIN] Querying resource status for ${blockchainResourceId}`);
      
      return {
        blockchainResourceId,
        status: 'active',
        lastUpdated: new Date(),
        totalJobs: Math.floor(Math.random() * 10),
        reputation: 4.5 + (Math.random() * 0.5),
        // Additional blockchain-specific details would be included here
      };
    } catch (error) {
      logger.error(`Error getting resource status for ${blockchainResourceId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get the latest status of a job from the blockchain
   * @param {string} blockchainJobId - Blockchain job ID
   * @returns {Promise<Object>} Job status
   */
  async getJobStatus(blockchainJobId) {
    try {
      // In a production environment, this would query the actual Solana program
      // For this MVP, we'll return a mock response
      
      logger.info(`[BLOCKCHAIN] Querying job status for ${blockchainJobId}`);
      
      return {
        blockchainJobId,
        status: 'running',
        assignedResources: Math.floor(Math.random() * 3) + 1,
        paymentStatus: 'escrowed',
        lastUpdated: new Date(),
        estimatedCompletion: new Date(Date.now() + 3600000), // 1 hour from now
        // Additional blockchain-specific details would be included here
      };
    } catch (error) {
      logger.error(`Error getting job status for ${blockchainJobId}:`, error);
      throw error;
    }
  }
  
  /**
   * Verify a wallet signature
   * @param {string} message - Original message
   * @param {string} signature - Signature to verify
   * @param {string} publicKey - Public key of the signer
   * @returns {Promise<boolean>} Whether signature is valid
   */
  async verifySignature(message, signature, publicKey) {
    try {
      // In a production environment, this would use proper signature verification
      // For this MVP, we'll return a mock response
      
      logger.info(`[BLOCKCHAIN] Verifying signature for ${publicKey}`);
      
      // Mock verification - always succeeds
      return true;
    } catch (error) {
      logger.error('Error verifying signature:', error);
      throw error;
    }
  }
  
  /**
   * Get network status and health
   * @returns {Promise<Object>} Network status
   */
  async getNetworkStatus() {
    try {
      const version = await this.connection.getVersion();
      const slot = await this.connection.getSlot();
      const blockHeight = await this.connection.getBlockHeight();
      const blockTime = await this.connection.getBlockTime(blockHeight);
      
      return {
        version: version['solana-core'],
        slot,
        blockHeight,
        blockTime: new Date(blockTime * 1000),
        rpcUrl: this.config.rpcUrl
      };
    } catch (error) {
      logger.error('Error getting network status:', error);
      throw error;
    }
  }
}

// Export a singleton instance
module.exports = new SolanaClient(); 