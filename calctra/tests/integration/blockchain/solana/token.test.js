const { expect } = require('chai');
const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const SolanaTokenManager = require('../../../../src/blockchain/solana/token');
const SolanaWallet = require('../../../../src/blockchain/solana/wallet');
const { randomBytes } = require('crypto');

// Use test network for integration tests
const testnetURL = 'https://api.testnet.solana.com';
const testnetConfig = {
  rpcUrl: testnetURL,
  network: 'testnet'
};

// Mock token mint address if not available in environment
const TEST_MINT_ADDRESS = process.env.CAL_TEST_TOKEN_MINT_ADDRESS || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC on testnet

// These tests depend on having a Solana testnet connection
// Some tests may be skipped if proper test accounts are not set up
describe('Solana Token Manager Integration Tests', function() {
  this.timeout(30000); // Solana transactions can take time
  
  let tokenManager;
  let solanaWallet;
  let testWallet;
  
  before(async () => {
    tokenManager = new SolanaTokenManager({
      ...testnetConfig,
      mintAddress: TEST_MINT_ADDRESS
    });
    
    solanaWallet = new SolanaWallet(testnetConfig);
    
    // Create a test wallet for testing operations
    testWallet = solanaWallet.createWallet();
    console.log(`Created test wallet: ${testWallet.publicKey}`);
    
    // Check if the test account has SOL
    try {
      const balance = await solanaWallet.getSolBalance(testWallet.publicKey);
      console.log(`Initial SOL balance: ${balance} SOL`);
      
      if (balance <= 0) {
        console.log('Test wallet has no SOL. Token account creation tests will be skipped.');
      }
    } catch (error) {
      console.error('Error checking SOL balance:', error.message);
    }
  });
  
  describe('Token Info Operations', () => {
    it('should get token info for mint address', async () => {
      const tokenInfo = await tokenManager.getTokenInfo(TEST_MINT_ADDRESS);
      
      expect(tokenInfo).to.be.an('object');
      expect(tokenInfo).to.have.property('address', TEST_MINT_ADDRESS);
      expect(tokenInfo).to.have.property('supply');
      expect(tokenInfo).to.have.property('decimals');
      expect(tokenInfo).to.have.property('isInitialized');
      
      console.log('Token Info:', tokenInfo);
    });
    
    it('should handle invalid mint address errors gracefully', async () => {
      try {
        await tokenManager.getTokenInfo('invalid-mint-address');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Failed to get token info');
      }
    });
  });
  
  describe('Token Account Operations', () => {
    it('should return null for non-existent token accounts', async () => {
      // Create a new wallet that definitely won't have token accounts
      const newWallet = solanaWallet.createWallet();
      const mintPublicKey = new PublicKey(TEST_MINT_ADDRESS);
      
      const tokenAccount = await tokenManager.getTokenAccount(
        new PublicKey(newWallet.publicKey), 
        mintPublicKey
      );
      
      expect(tokenAccount).to.be.null;
    });
    
    // This test requires actual SOL in the test wallet
    it('should create associated token account if wallet has SOL', async function() {
      // Check if wallet has SOL first
      const solBalance = await solanaWallet.getSolBalance(testWallet.publicKey);
      
      if (solBalance <= 0.002) {
        this.skip();
        return;
      }
      
      // Create an associated token account
      const tokenAccountAddress = await tokenManager.createAssociatedTokenAccount({
        payer: testWallet.keypair,
        owner: testWallet.publicKey,
        mint: TEST_MINT_ADDRESS
      });
      
      expect(tokenAccountAddress).to.be.a('string');
      
      // Verify the token account exists
      const tokenAccount = await tokenManager.getTokenAccount(
        new PublicKey(testWallet.publicKey),
        new PublicKey(TEST_MINT_ADDRESS)
      );
      
      expect(tokenAccount).to.not.be.null;
    });
  });
  
  describe('Token Accounts Query', () => {
    it('should get all token accounts for an owner', async () => {
      // May return empty array for new wallets
      const tokenAccounts = await tokenManager.getAllTokenAccounts(testWallet.publicKey);
      
      expect(tokenAccounts).to.be.an('array');
      
      // Log accounts if any exist
      if (tokenAccounts.length > 0) {
        console.log(`Found ${tokenAccounts.length} token accounts for test wallet`);
        console.log(tokenAccounts[0]);
      }
    });
    
    it('should handle errors for invalid owner addresses', async () => {
      try {
        await tokenManager.getAllTokenAccounts('invalid-owner-address');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Failed to get all token accounts');
      }
    });
  });
  
  describe('Token Holders Query', () => {
    it('should get token holders for a mint', async () => {
      try {
        const holders = await tokenManager.getTokenHolders(TEST_MINT_ADDRESS, 5);
        
        expect(holders).to.be.an('array');
        
        // For well-known tokens like USDC, there should be holders
        if (holders.length > 0) {
          expect(holders[0]).to.have.property('address');
          expect(holders[0]).to.have.property('owner');
          expect(holders[0]).to.have.property('amount');
          
          console.log(`Found ${holders.length} holders for ${TEST_MINT_ADDRESS}`);
        }
      } catch (error) {
        // Some test networks may not support this operation
        if (error.message.includes('Token not found')) {
          this.skip();
        } else {
          throw error;
        }
      }
    });
    
    it('should get circulation supply for a token', async () => {
      try {
        const supply = await tokenManager.getCirculationSupply(TEST_MINT_ADDRESS);
        
        expect(supply).to.be.a('string');
        expect(parseInt(supply)).to.be.a('number');
        
        console.log(`Token circulation supply: ${supply}`);
      } catch (error) {
        // Skip if token not found on testnet
        if (error.message.includes('Token not found')) {
          this.skip();
        } else {
          throw error;
        }
      }
    });
  });
}); 