const {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  Keypair,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL
} = require('@solana/web3.js');
const bs58 = require('bs58');
const logger = require('../../utils/logger');
const { throwError } = require('../../utils/errors');

/**
 * Solana Transaction Manager
 * Provides utility functions for creating and managing Solana transactions
 */
class TransactionManager {
  /**
   * Constructor
   * @param {Object} config Configuration object
   * @param {string} config.rpcUrl Solana RPC URL
   * @param {string} [config.network='mainnet-beta'] Network name
   */
  constructor(config = {}) {
    this.rpcUrl = config.rpcUrl || process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    this.network = config.network || process.env.SOLANA_NETWORK || 'mainnet-beta';
    this.connection = new Connection(this.rpcUrl);
    
    logger.info(`TransactionManager initialized with network: ${this.network}`);
  }

  /**
   * Create a new transaction
   * @returns {Object} Transaction object
   */
  createTransaction() {
    try {
      const transaction = new Transaction();
      return {
        instructions: [],
        transaction
      };
    } catch (error) {
      logger.error('Failed to create transaction', { error: error.message });
      throw new Error(`Failed to create transaction: ${error.message}`);
    }
  }

  /**
   * Add instructions to a transaction
   * @param {Object} transactionWrapper - Transaction wrapper object
   * @param {Array|Object} instructions - Instruction or array of instructions to add
   * @returns {Object} Updated transaction wrapper
   */
  addInstructions(transactionWrapper, instructions) {
    try {
      const instructionsArray = Array.isArray(instructions) ? instructions : [instructions];
      
      // Add instructions to our tracking array
      transactionWrapper.instructions.push(...instructionsArray);
      
      // Add to the actual transaction
      transactionWrapper.transaction.add(...instructionsArray);
      
      return transactionWrapper;
    } catch (error) {
      logger.error('Failed to add instructions to transaction', { error: error.message });
      throw new Error(`Failed to add instructions to transaction: ${error.message}`);
    }
  }

  /**
   * Sign and send a transaction
   * @param {Object} params - Parameters
   * @param {Object} params.transaction - Transaction wrapper object
   * @param {Array} params.signers - Array of signers (keypairs)
   * @returns {string} Transaction signature
   */
  async signAndSendTransaction({ transaction, signers }) {
    try {
      if (!transaction.transaction) {
        throw new Error('Invalid transaction wrapper');
      }
      
      if (!signers || signers.length === 0) {
        throw new Error('No signers provided');
      }
      
      // Set fee payer if not already set
      if (!transaction.transaction.feePayer) {
        transaction.transaction.feePayer = signers[0].publicKey;
      }
      
      // Get a recent blockhash
      const { blockhash } = await this.connection.getRecentBlockhash();
      transaction.transaction.recentBlockhash = blockhash;
      
      // Sign and send
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction.transaction,
        signers,
        {
          commitment: 'confirmed'
        }
      );
      
      logger.info('Transaction sent and confirmed', { signature });
      
      return signature;
    } catch (error) {
      logger.error('Failed to sign and send transaction', { error: error.message });
      throw new Error(`Failed to sign and send transaction: ${error.message}`);
    }
  }

  /**
   * Get transaction details
   * @param {string} signature - Transaction signature
   * @returns {Object} Transaction details
   */
  async getTransaction(signature) {
    try {
      const transaction = await this.connection.getParsedTransaction(
        signature,
        'confirmed'
      );
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      
      // Format transaction data
      const result = {
        signature,
        slot: transaction.slot,
        blockTime: transaction.blockTime,
        timestamp: transaction.blockTime ? new Date(transaction.blockTime * 1000).toISOString() : null,
        fee: transaction.meta.fee / LAMPORTS_PER_SOL,
        status: transaction.meta.err ? 'failed' : 'success',
        error: transaction.meta.err,
        instructions: []
      };
      
      // Parse instructions
      if (transaction.transaction.message.instructions) {
        result.instructions = transaction.transaction.message.instructions.map(instruction => {
          const parsed = instruction.parsed;
          
          // Basic instruction info
          const instructionInfo = {
            program: instruction.program,
            programId: instruction.programId.toString()
          };
          
          // If there's parsed data, include it
          if (parsed) {
            instructionInfo.type = parsed.type;
            instructionInfo.info = parsed.info;
          }
          
          return instructionInfo;
        });
      }
      
      return result;
    } catch (error) {
      logger.error('Failed to get transaction details', { signature, error: error.message });
      throw new Error(`Failed to get transaction details: ${error.message}`);
    }
  }

  /**
   * Verify if a transaction was successful
   * @param {string} signature - Transaction signature
   * @returns {boolean} Whether the transaction was successful
   */
  async verifyTransaction(signature) {
    try {
      const status = await this.connection.getSignatureStatus(signature);
      
      if (!status || !status.value) {
        throw new Error('Transaction not found');
      }
      
      return status.value.err === null;
    } catch (error) {
      logger.error('Failed to verify transaction', { signature, error: error.message });
      throw new Error(`Failed to verify transaction: ${error.message}`);
    }
  }

  /**
   * Get recent transactions for an address
   * @param {string} address - Wallet address
   * @param {number} [limit=10] - Maximum number of transactions to return
   * @returns {Array} Array of recent transactions
   */
  async getRecentTransactions(address, limit = 10) {
    try {
      const publicKey = new PublicKey(address);
      const signatures = await this.connection.getSignaturesForAddress(
        publicKey,
        { limit }
      );
      
      if (!signatures || signatures.length === 0) {
        return [];
      }
      
      // Process each signature
      const transactionPromises = signatures.map(async (sig) => {
        try {
          const txInfo = {
            signature: sig.signature,
            slot: sig.slot,
            timestamp: sig.blockTime ? new Date(sig.blockTime * 1000).toISOString() : null,
            status: sig.err ? 'failed' : 'success',
            error: sig.err,
            confirmationStatus: sig.confirmationStatus
          };
          
          return txInfo;
        } catch (error) {
          logger.warn('Failed to process transaction', { 
            signature: sig.signature,
            error: error.message 
          });
          return {
            signature: sig.signature,
            status: 'error',
            error: error.message
          };
        }
      });
      
      return await Promise.all(transactionPromises);
    } catch (error) {
      logger.error('Failed to get recent transactions', { address, error: error.message });
      throw new Error(`Failed to get recent transactions: ${error.message}`);
    }
  }

  /**
   * Estimate transaction fee
   * @param {Object} transaction - Transaction object
   * @returns {number} Estimated fee in SOL
   */
  async estimateTransactionFee(transaction) {
    try {
      if (!transaction.feePayer) {
        throw new Error('Transaction must have a feePayer to estimate fees');
      }
      
      // Get a recent blockhash if not already set
      if (!transaction.recentBlockhash) {
        const { blockhash } = await this.connection.getRecentBlockhash();
        transaction.recentBlockhash = blockhash;
      }
      
      // Get fee calculator
      const fee = await this.connection.getFeeForMessage(transaction.compileMessage());
      
      return fee.value / LAMPORTS_PER_SOL;
    } catch (error) {
      logger.error('Failed to estimate transaction fee', { error: error.message });
      throw new Error(`Failed to estimate transaction fee: ${error.message}`);
    }
  }
}

module.exports = TransactionManager; 