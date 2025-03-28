const { expect } = require('chai');
const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const SolanaWallet = require('../../../../src/blockchain/solana/wallet');
const { randomBytes } = require('crypto');
const bs58 = require('bs58');

// Use test network for integration tests
const testnetURL = 'https://api.testnet.solana.com';
const testnetConfig = {
  rpcUrl: testnetURL,
  network: 'testnet'
};

// These tests depend on having a Solana testnet connection
// Some tests may be skipped if proper test accounts are not set up
describe('Solana Wallet Integration Tests', function() {
  this.timeout(30000); // Solana transactions can take time
  
  let solanaWallet;
  let testWallet;
  let testAmount = 0.001; // Small amount of SOL for testing transfers
  
  before(async () => {
    solanaWallet = new SolanaWallet(testnetConfig);
    
    // Create a test wallet for testing operations
    testWallet = solanaWallet.createWallet();
    console.log(`Created test wallet: ${testWallet.publicKey}`);
    
    // Check if the test account already has funds
    const balance = await solanaWallet.getSolBalance(testWallet.publicKey);
    console.log(`Initial balance: ${balance} SOL`);
    
    // Skip funding tests if the account already has funds
    if (balance < testAmount) {
      console.log('Test wallet needs funding. Some tests may be skipped.');
    }
  });
  
  describe('Basic Wallet Operations', () => {
    it('should create a new wallet with valid keys', () => {
      const wallet = solanaWallet.createWallet();
      
      expect(wallet).to.have.property('publicKey');
      expect(wallet).to.have.property('secretKey');
      expect(wallet).to.have.property('keypair');
      
      // Verify the keys are in correct format
      expect(wallet.publicKey).to.be.a('string');
      expect(wallet.secretKey).to.be.a('string');
      expect(wallet.keypair).to.be.an('object');
      
      // Verify public key format (base58, proper length)
      expect(() => new PublicKey(wallet.publicKey)).to.not.throw();
    });
    
    it('should import wallet from private key', () => {
      const originalWallet = solanaWallet.createWallet();
      const importedWallet = solanaWallet.importWalletFromPrivateKey(originalWallet.secretKey);
      
      expect(importedWallet.publicKey).to.equal(originalWallet.publicKey);
    });
    
    it('should correctly sign and verify messages', () => {
      const wallet = solanaWallet.createWallet();
      const message = 'Hello, Calctra!';
      
      const signature = solanaWallet.signMessage(message, wallet.secretKey);
      expect(signature).to.have.property('signature');
      expect(signature).to.have.property('publicKey');
      
      const isVerified = solanaWallet.verifySignature(
        message, 
        signature.signature, 
        wallet.publicKey
      );
      
      expect(isVerified).to.be.true;
      
      // Verify that modified message fails verification
      const isInvalidVerified = solanaWallet.verifySignature(
        message + ' modified', 
        signature.signature, 
        wallet.publicKey
      );
      
      expect(isInvalidVerified).to.be.false;
    });
  });
  
  describe('Balance Operations', () => {
    it('should get wallet SOL balance', async () => {
      const balance = await solanaWallet.getSolBalance(testWallet.publicKey);
      expect(balance).to.be.a('number');
      expect(balance).to.be.gte(0);
    });
    
    it('should get wallet token balance', async () => {
      // This test may fail if CAL_TOKEN_MINT_ADDRESS is not set in env
      if (!process.env.CAL_TOKEN_MINT_ADDRESS) {
        console.log('Skipping token balance test, no mint address configured');
        return;
      }
      
      const balance = await solanaWallet.getTokenBalance(testWallet.publicKey);
      expect(balance).to.be.a('number');
      expect(balance).to.be.gte(0);
    });
  });
  
  describe('Transaction Operations', () => {
    it('should get transaction history', async () => {
      // Don't fail test if there's no history
      try {
        const history = await solanaWallet.getTransactionHistory(testWallet.publicKey);
        expect(history).to.be.an('array');
      } catch (error) {
        // For new wallets, there may not be any transaction history
        expect(error.message).to.include('not found');
      }
    });
    
    it('should send SOL if funds are available', async function() {
      // Check balance before attempting transfer
      const balance = await solanaWallet.getSolBalance(testWallet.publicKey);
      
      if (balance < testAmount) {
        this.skip();
        return;
      }
      
      // Create recipient wallet
      const recipientWallet = solanaWallet.createWallet();
      
      // Send a small amount of SOL
      const signature = await solanaWallet.sendSol({
        fromSecretKey: testWallet.secretKey,
        toPublicKey: recipientWallet.publicKey,
        amount: testAmount / 2 // Send half of the test amount
      });
      
      expect(signature).to.be.a('string');
      
      // Verify the transfer was successful
      const recipientBalance = await solanaWallet.getSolBalance(recipientWallet.publicKey);
      expect(recipientBalance).to.be.gt(0);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle invalid public key errors', async () => {
      try {
        await solanaWallet.getSolBalance('invalid-public-key');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Failed to get SOL balance');
      }
    });
    
    it('should handle invalid private key errors', () => {
      try {
        solanaWallet.importWalletFromPrivateKey('invalid-private-key');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Failed to import wallet');
      }
    });
    
    it('should handle insufficient funds errors', async function() {
      // Create a wallet with no funds
      const emptyWallet = solanaWallet.createWallet();
      
      try {
        await solanaWallet.sendSol({
          fromSecretKey: emptyWallet.secretKey,
          toPublicKey: testWallet.publicKey,
          amount: 1.0 // More SOL than the empty wallet has
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Failed to send SOL');
      }
    });
  });
}); 