const { expect } = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');
const { Data } = require('../../../src/models/data.model');
const { User } = require('../../../src/models/user.model');

describe('Data Model', () => {
  let testUser, testCollaborator;

  before(async () => {
    // 连接到测试数据库
    await mongoose.connect(process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/calctra_test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // 创建测试用户
    testUser = await User.create({
      username: 'datatester',
      email: 'data@example.com',
      passwordHash: 'hashedpassword123',
    });

    testCollaborator = await User.create({
      username: 'collaborator',
      email: 'collaborator@example.com',
      passwordHash: 'hashedpassword123',
    });
  });

  after(async () => {
    // 断开连接并清理
    await User.deleteMany({});
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // 每个测试前清理数据集合
    await Data.deleteMany({});
  });

  describe('Validation', () => {
    it('should validate a complete data model', async () => {
      const dataModel = {
        name: 'Test Dataset',
        description: 'A comprehensive dataset for testing',
        owner: testUser._id,
        type: 'dataset',
        format: 'csv',
        size: 1024 * 1024 * 10, // 10MB
        location: {
          type: 'url',
          value: 'https://example.com/datasets/test.csv'
        },
        metadata: {
          columns: ['id', 'name', 'value'],
          rows: 1000,
          created: new Date(),
          source: 'Generated for tests'
        },
        privacy: 'private',
        collaborators: [testCollaborator._id],
        tags: ['test', 'data', 'analysis'],
        encryptionKey: 'encrypted-key-hash'
      };

      const data = new Data(dataModel);
      const validationResult = await data.validate();
      
      expect(validationResult).to.be.undefined;
    });

    it('should require name, owner, and type', async () => {
      const dataModel = {
        description: 'An incomplete dataset',
        format: 'json',
        size: 1024 * 1024
      };

      const data = new Data(dataModel);
      
      try {
        await data.validate();
        expect.fail('Validation should have failed');
      } catch (error) {
        expect(error.errors.name).to.exist;
        expect(error.errors.owner).to.exist;
        expect(error.errors.type).to.exist;
      }
    });

    it('should validate data type', async () => {
      const dataModel = {
        name: 'Invalid Type Data',
        owner: testUser._id,
        type: 'invalid-type', // Invalid type
        format: 'json',
        size: 1024 * 1024
      };

      const data = new Data(dataModel);
      
      try {
        await data.validate();
        expect.fail('Validation should have failed');
      } catch (error) {
        expect(error.errors.type).to.exist;
        expect(error.errors.type.message).to.include('Invalid data type');
      }
    });

    it('should validate data privacy setting', async () => {
      const dataModel = {
        name: 'Invalid Privacy Data',
        owner: testUser._id,
        type: 'dataset',
        format: 'json',
        size: 1024 * 1024,
        privacy: 'semi-private' // Invalid privacy setting
      };

      const data = new Data(dataModel);
      
      try {
        await data.validate();
        expect.fail('Validation should have failed');
      } catch (error) {
        expect(error.errors.privacy).to.exist;
        expect(error.errors.privacy.message).to.include('Invalid privacy setting');
      }
    });
  });

  describe('Methods', () => {
    it('should check if user has access to data', async () => {
      const publicData = new Data({
        name: 'Public Dataset',
        owner: testUser._id,
        type: 'dataset',
        privacy: 'public'
      });

      const privateData = new Data({
        name: 'Private Dataset',
        owner: testUser._id,
        type: 'dataset',
        privacy: 'private'
      });

      const collaborativeData = new Data({
        name: 'Collaborative Dataset',
        owner: testUser._id,
        type: 'dataset',
        privacy: 'private',
        collaborators: [testCollaborator._id]
      });

      // Public data should be accessible to everyone
      expect(publicData.hasAccess(testUser._id)).to.be.true;
      expect(publicData.hasAccess(testCollaborator._id)).to.be.true;
      expect(publicData.hasAccess(mongoose.Types.ObjectId())).to.be.true;

      // Private data should be accessible only to owner
      expect(privateData.hasAccess(testUser._id)).to.be.true;
      expect(privateData.hasAccess(testCollaborator._id)).to.be.false;
      expect(privateData.hasAccess(mongoose.Types.ObjectId())).to.be.false;

      // Collaborative data should be accessible to owner and collaborators
      expect(collaborativeData.hasAccess(testUser._id)).to.be.true;
      expect(collaborativeData.hasAccess(testCollaborator._id)).to.be.true;
      expect(collaborativeData.hasAccess(mongoose.Types.ObjectId())).to.be.false;
    });

    it('should get friendly size string', async () => {
      const tinyData = new Data({
        name: 'Tiny Dataset',
        owner: testUser._id,
        type: 'dataset',
        size: 512
      });

      const smallData = new Data({
        name: 'Small Dataset',
        owner: testUser._id,
        type: 'dataset',
        size: 1024 * 2
      });

      const mediumData = new Data({
        name: 'Medium Dataset',
        owner: testUser._id,
        type: 'dataset',
        size: 1024 * 1024 * 3
      });

      const largeData = new Data({
        name: 'Large Dataset',
        owner: testUser._id,
        type: 'dataset',
        size: 1024 * 1024 * 1024 * 5
      });

      expect(tinyData.getSizeString()).to.equal('512 B');
      expect(smallData.getSizeString()).to.equal('2 KB');
      expect(mediumData.getSizeString()).to.equal('3 MB');
      expect(largeData.getSizeString()).to.equal('5 GB');
    });

    it('should add and remove collaborators', async () => {
      const data = new Data({
        name: 'Collaboration Test Dataset',
        owner: testUser._id,
        type: 'dataset',
        privacy: 'private',
        collaborators: []
      });

      const newCollaborator = mongoose.Types.ObjectId();
      
      data.addCollaborator(newCollaborator);
      expect(data.collaborators).to.include.deep.members([newCollaborator]);
      
      data.removeCollaborator(newCollaborator);
      expect(data.collaborators).to.not.include.deep.members([newCollaborator]);
    });
  });

  describe('Static Methods', () => {
    it('should find data by owner', async () => {
      // Create another user
      const anotherUser = await User.create({
        username: 'anotherdatauser',
        email: 'anotherdata@example.com',
        passwordHash: 'hashedpassword123',
      });

      // Create test datasets for different users
      await Data.create([
        {
          name: 'User 1 Dataset',
          owner: testUser._id,
          type: 'dataset',
          format: 'csv',
          privacy: 'private'
        },
        {
          name: 'User 2 Dataset',
          owner: anotherUser._id,
          type: 'dataset',
          format: 'json',
          privacy: 'private'
        }
      ]);

      const user1Data = await Data.findByOwner(testUser._id);
      
      expect(user1Data).to.be.an('array');
      expect(user1Data.length).to.equal(1);
      expect(user1Data[0].name).to.equal('User 1 Dataset');
    });

    it('should find public data', async () => {
      // Create datasets with different privacy settings
      await Data.create([
        {
          name: 'Private Dataset',
          owner: testUser._id,
          type: 'dataset',
          format: 'csv',
          privacy: 'private'
        },
        {
          name: 'Public Dataset 1',
          owner: testUser._id,
          type: 'dataset',
          format: 'json',
          privacy: 'public'
        },
        {
          name: 'Public Dataset 2',
          owner: testCollaborator._id,
          type: 'model',
          format: 'h5',
          privacy: 'public'
        }
      ]);

      const publicData = await Data.findPublic();
      
      expect(publicData).to.be.an('array');
      expect(publicData.length).to.equal(2);
      expect(publicData.map(d => d.name)).to.have.members(['Public Dataset 1', 'Public Dataset 2']);
    });

    it('should find accessible data for a user', async () => {
      // Create another user
      const randomUser = await User.create({
        username: 'randomuser',
        email: 'random@example.com',
        passwordHash: 'hashedpassword123',
      });

      // Create test datasets with different accessibility
      await Data.create([
        {
          name: 'Owner Private Dataset',
          owner: testUser._id,
          type: 'dataset',
          privacy: 'private'
        },
        {
          name: 'Collaborative Dataset',
          owner: testCollaborator._id,
          type: 'dataset',
          privacy: 'private',
          collaborators: [testUser._id]
        },
        {
          name: 'Public Dataset',
          owner: randomUser._id,
          type: 'dataset',
          privacy: 'public'
        },
        {
          name: 'Inaccessible Dataset',
          owner: testCollaborator._id,
          type: 'dataset',
          privacy: 'private'
        }
      ]);

      const accessibleData = await Data.findAccessible(testUser._id);
      
      expect(accessibleData).to.be.an('array');
      expect(accessibleData.length).to.equal(3);
      
      const dataNames = accessibleData.map(d => d.name);
      expect(dataNames).to.include.members([
        'Owner Private Dataset', 
        'Collaborative Dataset',
        'Public Dataset'
      ]);
      expect(dataNames).to.not.include('Inaccessible Dataset');
    });
  });

  describe('Hooks', () => {
    it('should set default values for new data', async () => {
      const dataModel = {
        name: 'Default Test Dataset',
        owner: testUser._id,
        type: 'dataset',
        format: 'csv'
      };

      const data = await Data.create(dataModel);
      
      expect(data.privacy).to.equal('private'); // Default privacy
      expect(data.createdAt).to.be.an.instanceOf(Date);
      expect(data.collaborators).to.be.an('array').that.is.empty;
      expect(data.tags).to.be.an('array').that.is.empty;
    });

    it('should update lastUpdated timestamp on save', async () => {
      const data = await Data.create({
        name: 'Update Timestamp Dataset',
        owner: testUser._id,
        type: 'dataset',
        format: 'csv'
      });
      
      const originalTimestamp = data.lastUpdated;
      
      // Wait a moment and then update
      await new Promise(resolve => setTimeout(resolve, 10));
      
      data.description = 'Updated description';
      await data.save();
      
      expect(data.lastUpdated.getTime()).to.be.above(originalTimestamp.getTime());
    });
  });
}); 