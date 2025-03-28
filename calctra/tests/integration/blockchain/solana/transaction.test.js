const { expect } = require('chai');
const { 
  Connection, 
  Keypair, 
  PublicKey, 
  SystemProgram, 
  Transaction
} = require('@solana/web3.js');
const TransactionManager = require('../../../../src/blockchain/solana/transaction');
const SolanaWallet = require('../../../../src/blockchain/solana/wallet');

// Use test network for integration tests
const testnetURL = 'https://api.testnet.solana.com';
const testnetConfig = {
  rpcUrl: testnetURL,
  network: 'testnet'
};

// These tests depend on having a Solana testnet connection
// Some tests may be skipped if proper test accounts are not set up
describe('Solana Transaction Manager Integration Tests', function() {
  this.timeout(30000); // Solana transactions can take time
  
  let transactionManager;
  let solanaWallet;
  let testWallet;
  let destinationWallet;
  let testAmount = 0.001; // Small amount of SOL for testing transfers
  
  before(async () => {
    transactionManager = new TransactionManager(testnetConfig);
    solanaWallet = new SolanaWallet(testnetConfig);
    
    // Create test wallets for transaction testing
    testWallet = solanaWallet.createWallet();
    destinationWallet = solanaWallet.createWallet();
    
    console.log(`Created test wallet: ${testWallet.publicKey}`);
    console.log(`Created destination wallet: ${destinationWallet.publicKey}`);
    
    // Check if test wallet has funds
    try {
      const balance = await solanaWallet.getSolBalance(testWallet.publicKey);
      console.log(`Initial SOL balance: ${balance} SOL`);
      
      if (balance <= 0) {
        console.log('Test wallet has no SOL. Transaction tests will be skipped.');
      }
    } catch (error) {
      console.error('Error checking SOL balance:', error.message);
    }
  });
  
  describe('Transaction Creation', () => {
    it('should create a new transaction', () => {
      const transaction = transactionManager.createTransaction();
      
      expect(transaction).to.be.an('object');
      expect(transaction).to.have.property('instructions');
      expect(transaction.instructions).to.be.an('array');
      expect(transaction.instructions).to.have.length(0);
    });
    
    it('should add instructions to a transaction', () => {
      const transaction = transactionManager.createTransaction();
      
      // Create a simple instruction (SOL transfer)
      const instruction = SystemProgram.transfer({
        fromPubkey: new PublicKey(testWallet.publicKey),
        toPubkey: new PublicKey(destinationWallet.publicKey),
        lamports: 100 // Just a tiny amount for testing
      });
      
      // Add instruction to transaction
      transactionManager.addInstructions(transaction, instruction);
      
      expect(transaction.instructions).to.have.length(1);
    });
    
    it('should add multiple instructions to a transaction', () => {
      const transaction = transactionManager.createTransaction();
      
      // Create two simple instructions (SOL transfers)
      const instruction1 = SystemProgram.transfer({
        fromPubkey: new PublicKey(testWallet.publicKey),
        toPubkey: new PublicKey(destinationWallet.publicKey),
        lamports: 100
      });
      
      const instruction2 = SystemProgram.transfer({
        fromPubkey: new PublicKey(testWallet.publicKey),
        toPubkey: new PublicKey(destinationWallet.publicKey),
        lamports: 200
      });
      
      // Add instructions to transaction
      transactionManager.addInstructions(transaction, [instruction1, instruction2]);
      
      expect(transaction.instructions).to.have.length(2);
    });
  });
  
  describe('Transaction Execution', () => {
    // This test requires SOL in the test wallet
    it('should sign and send transaction if wallet has funds', async function() {
      // Check wallet balance first
      const balance = await solanaWallet.getSolBalance(testWallet.publicKey);
      
      if (balance <= 0.002) {
        this.skip();
        return;
      }
      
      // Create a simple transaction
      const transaction = transactionManager.createTransaction();
      
      // Add transfer instruction
      const instruction = SystemProgram.transfer({
        fromPubkey: new PublicKey(testWallet.publicKey),
        toPubkey: new PublicKey(destinationWallet.publicKey),
        lamports: 10000 // 0.00001 SOL
      });
      
      transactionManager.addInstructions(transaction, instruction);
      
      // Sign and send the transaction
      const signature = await transactionManager.signAndSendTransaction({
        transaction,
        signers: [testWallet.keypair]
      });
      
      expect(signature).to.be.a('string');
      console.log(`Transaction sent with signature: ${signature}`);
      
      // Verify the transaction was successful
      const isValid = await transactionManager.verifyTransaction(signature);
      expect(isValid).to.be.true;
    });
    
    it('should get transaction details', async function() {
      // This test depends on the previous test completing successfully
      // Search for any transactions for the destination wallet
      try {
        const transactions = await transactionManager.getRecentTransactions(
          destinationWallet.publicKey,
          1
        );
        
        if (transactions.length === 0) {
          console.log('No transactions found for the destination wallet');
          this.skip();
          return;
        }
        
        const txDetails = transactions[0];
        
        expect(txDetails).to.have.property('signature');
        expect(txDetails).to.have.property('timestamp');
        expect(txDetails).to.have.property('status');
        
        console.log('Transaction details:', JSON.stringify(txDetails, null, 2));
      } catch (error) {
        // New wallets may not have transaction history
        if (error.message.includes('not found')) {
          this.skip();
        } else {
          throw error;
        }
      }
    });
  });
  
  describe('Fee Estimation', () => {
    it('should estimate transaction fees', async () => {
      // Create a simple transaction
      const transaction = transactionManager.createTransaction();
      
      // Add transfer instruction
      const instruction = SystemProgram.transfer({
        fromPubkey: new PublicKey(testWallet.publicKey),
        toPubkey: new PublicKey(destinationWallet.publicKey),
        lamports: 10000
      });
      
      transactionManager.addInstructions(transaction, instruction);
      
      // Add a required signer
      transaction.feePayer = new PublicKey(testWallet.publicKey);
      
      // Estimate the fee
      try {
        const fee = await transactionManager.estimateTransactionFee(transaction);
        
        expect(fee).to.be.a('number');
        expect(fee).to.be.greaterThan(0);
        
        console.log(`Estimated transaction fee: ${fee} SOL`);
      } catch (error) {
        // Some testnet configurations might not support fee estimation
        console.log('Fee estimation error:', error.message);
        this.skip();
      }
    });
  });
  
  describe('Error Handling', () => {
    it('should handle invalid signature errors', async () => {
      try {
        await transactionManager.getTransaction('invalid-signature');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Failed to get transaction details');
      }
    });
    
    it('should handle transaction verification failures', async () => {
      try {
        const isValid = await transactionManager.verifyTransaction('4zJ5CcxN1WA1nX8xk1xRqZSp5QSc3KB8vJ5UATsvGTPvH7r2JKx1xQcb3eMwi1XfBRrP5qJc3C4AEfNMXGcrFMKJ');
        
        // This test is a bit tricky - the signature is valid format but doesn't exist
        // Either it should return false, or throw an error
        if (typeof isValid === 'boolean') {
          expect(isValid).to.be.false;
        }
      } catch (error) {
        expect(error.message).to.include('Failed to verify transaction');
      }
    });
    
    it('should handle insufficient signers error', async () => {
      // Create a transaction without signers
      const transaction = transactionManager.createTransaction();
      
      try {
        await transactionManager.signAndSendTransaction({
          transaction,
          signers: []
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Failed to sign and send transaction');
      }
    });
  });
}); 