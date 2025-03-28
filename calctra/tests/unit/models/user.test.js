const { expect } = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');
const { User } = require('../../../src/models/user.model');

describe('User Model', () => {
  before(async () => {
    // 连接到测试数据库
    await mongoose.connect(process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/calctra_test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  after(async () => {
    // 断开连接并清理
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // 每个测试前清理用户集合
    await User.deleteMany({});
  });

  describe('Validation', () => {
    it('should validate a complete user model', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        name: 'Test User',
        walletAddress: '0x1234567890abcdef',
        role: 'user',
        bio: 'Test user biography',
        avatar: 'https://example.com/avatar.jpg',
      };

      const user = new User(userData);
      const validationResult = await user.validate();
      
      expect(validationResult).to.be.undefined;
    });

    it('should require username, email, and passwordHash', async () => {
      const userData = {
        name: 'Test User',
        walletAddress: '0x1234567890abcdef',
      };

      const user = new User(userData);
      
      try {
        await user.validate();
        expect.fail('Validation should have failed');
      } catch (error) {
        expect(error.errors.username).to.exist;
        expect(error.errors.email).to.exist;
        expect(error.errors.passwordHash).to.exist;
      }
    });

    it('should validate email format', async () => {
      const userData = {
        username: 'testuser',
        email: 'invalid-email',
        passwordHash: 'hashedpassword123',
      };

      const user = new User(userData);
      
      try {
        await user.validate();
        expect.fail('Validation should have failed');
      } catch (error) {
        expect(error.errors.email).to.exist;
        expect(error.errors.email.message).to.include('valid email');
      }
    });

    it('should ensure username is at least 3 characters', async () => {
      const userData = {
        username: 'ab',
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
      };

      const user = new User(userData);
      
      try {
        await user.validate();
        expect.fail('Validation should have failed');
      } catch (error) {
        expect(error.errors.username).to.exist;
        expect(error.errors.username.message).to.include('at least 3 characters');
      }
    });
  });

  describe('Methods', () => {
    it('should correctly identify admin users', async () => {
      const adminUser = new User({
        username: 'admin',
        email: 'admin@example.com',
        passwordHash: 'hashedpassword123',
        role: 'admin'
      });

      expect(adminUser.isAdmin()).to.be.true;
    });

    it('should correctly identify non-admin users', async () => {
      const regularUser = new User({
        username: 'user',
        email: 'user@example.com',
        passwordHash: 'hashedpassword123',
        role: 'user'
      });

      expect(regularUser.isAdmin()).to.be.false;
    });

    it('should generate auth token', async () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        _id: mongoose.Types.ObjectId('5f7d5b9f0e7b9a0b9c8b4567')
      });

      // Mock JWT signing
      const jwtSignStub = sinon.stub(user, 'generateAuthToken').returns('mock.jwt.token');
      
      const token = user.generateAuthToken();
      
      expect(token).to.equal('mock.jwt.token');
      jwtSignStub.restore();
    });
  });

  describe('Static Methods', () => {
    it('should find user by email', async () => {
      // Create a test user
      const userData = {
        username: 'testuser',
        email: 'find-me@example.com',
        passwordHash: 'hashedpassword123',
      };
      await User.create(userData);

      // Use the static method
      const foundUser = await User.findByEmail('find-me@example.com');
      
      expect(foundUser).to.not.be.null;
      expect(foundUser.email).to.equal('find-me@example.com');
    });

    it('should verify login credentials', async () => {
      // Set up bcrypt mock
      const bcryptMock = {
        compare: sinon.stub().resolves(true)
      };
      
      // Create a user
      const userData = {
        username: 'logintest',
        email: 'login@example.com',
        passwordHash: 'hashedpassword123',
      };
      const user = await User.create(userData);

      // Override the bcrypt dependency
      const originalCompare = User.verifyPassword;
      User.verifyPassword = bcryptMock.compare;

      // Test the login method
      const result = await User.login('login@example.com', 'password123');
      
      expect(result).to.not.be.null;
      expect(result.email).to.equal('login@example.com');
      
      // Restore original method
      User.verifyPassword = originalCompare;
    });
  });

  describe('Hooks', () => {
    it('should set default values for new users', async () => {
      const userData = {
        username: 'defaults',
        email: 'defaults@example.com',
        passwordHash: 'hashedpassword123',
      };

      const user = await User.create(userData);
      
      expect(user.role).to.equal('user'); // Default role
      expect(user.createdAt).to.be.an.instanceOf(Date);
      expect(user.tokenBalance).to.equal(0);
    });
  });
}); 