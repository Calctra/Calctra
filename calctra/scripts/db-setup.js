#!/usr/bin/env node

/**
 * Database setup script for Calctra
 * 
 * This script initializes the MongoDB database with necessary collections,
 * indexes, and initial data for the Calctra platform.
 * 
 * Usage:
 *   node scripts/db-setup.js [--uri mongodb://username:password@hostname:port/calctra]
 */

const { MongoClient } = require('mongodb');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('uri', {
    type: 'string',
    description: 'MongoDB connection URI',
    default: process.env.MONGODB_URI || 'mongodb://localhost:27017/calctra'
  })
  .help()
  .argv;

// MongoDB collections
const COLLECTIONS = {
  USERS: 'users',
  RESOURCES: 'resources',
  JOBS: 'jobs',
  DATASETS: 'datasets',
  TRANSACTIONS: 'transactions',
  SETTINGS: 'settings'
};

// Main function
async function setup() {
  console.log('Initializing Calctra database...');
  console.log(`Using MongoDB URI: ${maskUri(argv.uri)}`);
  
  let client;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(argv.uri);
    await client.connect();
    console.log('Connected to MongoDB successfully');
    
    const db = client.db();
    
    // Create collections
    await createCollections(db);
    
    // Create indexes
    await createIndexes(db);
    
    // Insert initial data
    await insertInitialData(db);
    
    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('Database connection closed');
    }
  }
}

// Create required collections
async function createCollections(db) {
  console.log('Creating collections...');
  
  for (const collectionName of Object.values(COLLECTIONS)) {
    try {
      const collections = await db.listCollections({ name: collectionName }).toArray();
      
      if (collections.length === 0) {
        await db.createCollection(collectionName);
        console.log(`  Created collection: ${collectionName}`);
      } else {
        console.log(`  Collection already exists: ${collectionName}`);
      }
    } catch (error) {
      console.error(`  Error creating collection ${collectionName}:`, error);
      throw error;
    }
  }
}

// Create database indexes
async function createIndexes(db) {
  console.log('Creating indexes...');
  
  try {
    // Users collection indexes
    await db.collection(COLLECTIONS.USERS).createIndexes([
      { key: { email: 1 }, unique: true, name: 'email_unique' },
      { key: { walletAddress: 1 }, sparse: true, name: 'wallet_address' },
      { key: { createdAt: 1 }, name: 'created_at' }
    ]);
    console.log('  Created indexes for users collection');
    
    // Resources collection indexes
    await db.collection(COLLECTIONS.RESOURCES).createIndexes([
      { key: { owner: 1 }, name: 'owner' },
      { key: { 'specs.cpuCores': 1, 'specs.memoryGb': 1, 'specs.storageGb': 1 }, name: 'specs' },
      { key: { active: 1 }, name: 'active' },
      { key: { pricePerUnit: 1 }, name: 'price' },
      { key: { location: '2dsphere' }, sparse: true, name: 'location' }
    ]);
    console.log('  Created indexes for resources collection');
    
    // Jobs collection indexes
    await db.collection(COLLECTIONS.JOBS).createIndexes([
      { key: { owner: 1 }, name: 'owner' },
      { key: { status: 1 }, name: 'status' },
      { key: { createdAt: 1 }, name: 'created_at' },
      { key: { matchedResources: 1 }, sparse: true, name: 'matched_resources' }
    ]);
    console.log('  Created indexes for jobs collection');
    
    // Datasets collection indexes
    await db.collection(COLLECTIONS.DATASETS).createIndexes([
      { key: { owner: 1 }, name: 'owner' },
      { key: { isPublic: 1 }, name: 'public' },
      { key: { type: 1 }, name: 'type' },
      { key: { createdAt: 1 }, name: 'created_at' }
    ]);
    console.log('  Created indexes for datasets collection');
    
    // Transactions collection indexes
    await db.collection(COLLECTIONS.TRANSACTIONS).createIndexes([
      { key: { user: 1 }, name: 'user' },
      { key: { type: 1 }, name: 'type' },
      { key: { status: 1 }, name: 'status' },
      { key: { createdAt: 1 }, name: 'created_at' },
      { key: { 'relatedEntity.type': 1, 'relatedEntity.id': 1 }, name: 'related_entity' }
    ]);
    console.log('  Created indexes for transactions collection');
    
  } catch (error) {
    console.error('  Error creating indexes:', error);
    throw error;
  }
}

// Insert initial data
async function insertInitialData(db) {
  console.log('Inserting initial data...');
  
  try {
    // Insert platform settings
    const settingsCount = await db.collection(COLLECTIONS.SETTINGS).countDocuments();
    
    if (settingsCount === 0) {
      await db.collection(COLLECTIONS.SETTINGS).insertOne({
        _id: 'platform',
        fees: {
          jobCreationFee: 1.0, // 1% fee for job creation
          resourceProvisionFee: 2.0, // 2% fee for resource providers
          datasetUsageFee: 1.5 // 1.5% fee for dataset usage
        },
        limits: {
          maxJobSize: 1024 * 1024 * 1024 * 10, // 10GB
          maxDatasetSize: 1024 * 1024 * 1024 * 50, // 50GB
          maxResourcesPerJob: 10
        },
        version: '1.0.0',
        updatedAt: new Date()
      });
      
      console.log('  Inserted platform settings');
    } else {
      console.log('  Platform settings already exist');
    }
    
    // Insert admin user if no users exist
    const userCount = await db.collection(COLLECTIONS.USERS).countDocuments();
    
    if (userCount === 0) {
      const adminPassword = generateSecurePassword();
      
      await db.collection(COLLECTIONS.USERS).insertOne({
        name: 'Admin User',
        email: 'admin@calctra.io',
        password: hashPassword(adminPassword), // In a real app, use bcrypt
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('  Created admin user:');
      console.log('    - Email: admin@calctra.io');
      console.log(`    - Password: ${adminPassword}`);
      console.log('    ⚠️  IMPORTANT: Please change this password immediately after first login!');
    } else {
      console.log('  Users already exist, skipping admin user creation');
    }
    
  } catch (error) {
    console.error('  Error inserting initial data:', error);
    throw error;
  }
}

// Utility: Mask MongoDB URI for logging
function maskUri(uri) {
  try {
    const url = new URL(uri);
    if (url.password) {
      url.password = '******';
    }
    return url.toString();
  } catch (e) {
    // If URI parsing fails, return a sanitized version
    return uri.replace(/:[^/:]+@/, ':******@');
  }
}

// Utility: Generate secure random password
function generateSecurePassword(length = 12) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  
  return password;
}

// Utility: Simple password hashing (placeholder)
function hashPassword(password) {
  // NOTE: This is just a placeholder. In a real application, use bcrypt or Argon2
  return `hashed_${password}_for_demo_only`;
}

// Run the setup
setup(); 