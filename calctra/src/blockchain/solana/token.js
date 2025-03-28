const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const { 
  Token, 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  MintLayout
} = require('@solana/spl-token');
const logger = require('../../utils/logger');
const { throwError } = require('../../utils/errors');

/**
 * Solana Token Manager
 * Handles CAL token operations including creating tokens and managing token accounts
 */
class SolanaTokenManager {
  /**
   * Constructor
   * @param {Object} config Configuration object
   * @param {string} config.rpcUrl Solana RPC URL
   * @param {string} [config.network='mainnet-beta'] Network name
   * @param {string} [config.mintAddress] Mint address of the token to manage (e.g. CAL token)
   */
  constructor(config = {}) {
    this.rpcUrl = config.rpcUrl || process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    this.network = config.network || process.env.SOLANA_NETWORK || 'mainnet-beta';
    this.mintAddress = config.mintAddress || process.env.CAL_TOKEN_MINT_ADDRESS;
    this.connection = new Connection(this.rpcUrl);
    
    logger.info(`SolanaTokenManager initialized with network: ${this.network}`);
    if (this.mintAddress) {
      logger.info(`Default token mint address set to: ${this.mintAddress}`);
    }
  }

  /**
   * Get token account for a specific owner and token mint
   * @param {PublicKey} owner Account owner public key
   * @param {PublicKey} mint Token mint public key
   * @returns {Promise<Object>} Token account public key
   */
  async getTokenAccount(owner, mint) {
    try {
      // Find associated token address
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        owner,
        { mint }
      );

      if (tokenAccounts.value.length === 0) {
        return null;
      }

      return tokenAccounts.value[0].pubkey;
    } catch (error) {
      logger.error('Failed to get token account', { 
        owner: owner.toString(), 
        mint: mint.toString(), 
        error: error.message 
      });
      throw throwError('BlockchainError', `Failed to get token account: ${error.message}`);
    }
  }

  /**
   * Get token info including supply, decimals, and other metadata
   * @param {string} mintAddress Token mint address
   * @returns {Promise<Object>} Token info
   */
  async getTokenInfo(mintAddress) {
    try {
      const address = mintAddress || this.mintAddress;
      
      if (!address) {
        throw new Error('Token mint address is required');
      }
      
      const mintPublicKey = new PublicKey(address);
      const token = new Token(
        this.connection,
        mintPublicKey,
        TOKEN_PROGRAM_ID,
        Keypair.generate() // We don't need a real signer for this operation
      );

      const mintInfo = await token.getMintInfo();
      
      return {
        address,
        supply: mintInfo.supply.toString(),
        decimals: mintInfo.decimals,
        isInitialized: mintInfo.isInitialized,
        freezeAuthority: mintInfo.freezeAuthority?.toString() || null,
        mintAuthority: mintInfo.mintAuthority?.toString() || null
      };
    } catch (error) {
      logger.error('Failed to get token info', { 
        mintAddress, 
        error: error.message 
      });
      throw throwError('BlockchainError', `Failed to get token info: ${error.message}`);
    }
  }

  /**
   * Create associated token account for a user
   * @param {Object} params Parameters object
   * @param {Keypair} params.payer Payer account keypair that will pay for the transaction
   * @param {PublicKey} params.owner Owner public key for whom to create the token account
   * @param {PublicKey} params.mint Token mint public key
   * @returns {Promise<string>} Public key of the created token account
   */
  async createAssociatedTokenAccount({ payer, owner, mint }) {
    try {
      const ownerPublicKey = typeof owner === 'string' ? new PublicKey(owner) : owner;
      const mintPublicKey = typeof mint === 'string' ? new PublicKey(mint) : mint;
      
      // Create Token class instance
      const token = new Token(
        this.connection,
        mintPublicKey,
        TOKEN_PROGRAM_ID,
        payer
      );

      // Create associated token account
      const associatedTokenAccount = await token.getOrCreateAssociatedAccountInfo(
        ownerPublicKey
      );

      logger.info('Associated token account created', {
        owner: ownerPublicKey.toString(),
        mint: mintPublicKey.toString(),
        tokenAccount: associatedTokenAccount.address.toString()
      });

      return associatedTokenAccount.address.toString();
    } catch (error) {
      logger.error('Failed to create associated token account', {
        owner: owner.toString?.() || owner,
        mint: mint.toString?.() || mint,
        error: error.message
      });
      throw throwError('BlockchainError', `Failed to create associated token account: ${error.message}`);
    }
  }

  /**
   * Get all token accounts for an owner
   * @param {string|PublicKey} owner Owner public key
   * @returns {Promise<Array>} Array of token accounts with parsed info
   */
  async getAllTokenAccounts(owner) {
    try {
      const ownerPublicKey = typeof owner === 'string' ? new PublicKey(owner) : owner;
      
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        ownerPublicKey,
        { programId: TOKEN_PROGRAM_ID }
      );

      return tokenAccounts.value.map(account => {
        const { mint, tokenAmount, owner } = account.account.data.parsed.info;
        
        return {
          address: account.pubkey.toString(),
          mint,
          owner,
          amount: tokenAmount.uiAmount,
          decimals: tokenAmount.decimals
        };
      });
    } catch (error) {
      logger.error('Failed to get all token accounts', { 
        owner: owner.toString?.() || owner, 
        error: error.message 
      });
      throw throwError('BlockchainError', `Failed to get all token accounts: ${error.message}`);
    }
  }

  /**
   * Get token holders for a specific mint
   * @param {string|PublicKey} mint Token mint address
   * @param {number} limit Maximum number of holders to return
   * @returns {Promise<Array>} Array of token holders with their balances
   */
  async getTokenHolders(mint = this.mintAddress, limit = 100) {
    try {
      const mintPublicKey = typeof mint === 'string' ? new PublicKey(mint) : mint;
      
      // This method returns the largest token accounts for a specific mint
      const tokenAccounts = await this.connection.getTokenLargestAccounts(mintPublicKey);
      
      // Limit the number of accounts to process
      const accountsToProcess = tokenAccounts.value.slice(0, limit);
      
      // Get detailed information for each account
      const holders = await Promise.all(accountsToProcess.map(async account => {
        const accountInfo = await this.connection.getParsedAccountInfo(account.address);
        
        if (!accountInfo.value || !accountInfo.value.data) {
          return null;
        }
        
        const parsedData = accountInfo.value.data.parsed.info;
        
        return {
          address: account.address.toString(),
          owner: parsedData.owner,
          amount: account.amount,
          uiAmount: account.uiAmount
        };
      }));
      
      // Filter out null values and return the holders
      return holders.filter(holder => holder !== null);
    } catch (error) {
      logger.error('Failed to get token holders', { 
        mint: mint.toString?.() || mint, 
        error: error.message 
      });
      throw throwError('BlockchainError', `Failed to get token holders: ${error.message}`);
    }
  }

  /**
   * Get current circulation supply of a token
   * @param {string|PublicKey} mint Token mint address
   * @returns {Promise<string>} Current circulation supply
   */
  async getCirculationSupply(mint = this.mintAddress) {
    try {
      const mintPublicKey = typeof mint === 'string' ? new PublicKey(mint) : mint;
      const tokenInfo = await this.getTokenInfo(mintPublicKey.toString());
      
      return tokenInfo.supply;
    } catch (error) {
      logger.error('Failed to get circulation supply', { 
        mint: mint.toString?.() || mint, 
        error: error.message 
      });
      throw throwError('BlockchainError', `Failed to get circulation supply: ${error.message}`);
    }
  }
}

module.exports = SolanaTokenManager; 