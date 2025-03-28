const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.test' });

// Global MongoDB In-Memory Server Instance
let mongoServer;

// Setup before all tests
beforeAll(async () => {
  // Create an in-memory MongoDB server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect to the in-memory database
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  
  console.log('Connected to in-memory MongoDB server:', mongoUri);
});

// Cleanup after all tests
afterAll(async () => {
  // Disconnect from MongoDB and stop the server
  await mongoose.disconnect();
  await mongoServer.stop();
  
  console.log('Disconnected from in-memory MongoDB server');
});

// Reset the database before each test
beforeEach(async () => {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
  
  console.log('Cleared all collections');
});

// Global test settings
jest.setTimeout(30000); // Increase timeout to 30 seconds

// Global mocks
jest.mock('../calctra/src/utils/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  stream: { write: jest.fn() }
}));

// Custom test utilities
global.testUtils = {
  createTestUser: async (userData = {}) => {
    const User = require('../calctra/src/models/user.model');
    
    const defaultUser = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
      role: 'user'
    };
    
    const user = new User({
      ...defaultUser,
      ...userData
    });
    
    await user.save();
    return user;
  },
  
  generateAuthToken: (user) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );
  }
}; 