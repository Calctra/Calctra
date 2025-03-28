const { expect } = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');
const { Resource } = require('../../../src/models/resource.model');
const { User } = require('../../../src/models/user.model');

describe('Resource Model', () => {
  let testUser;

  before(async () => {
    // 连接到测试数据库
    await mongoose.connect(process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/calctra_test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // 创建测试用户
    testUser = await User.create({
      username: 'resourcetester',
      email: 'resource@example.com',
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
    // 每个测试前清理资源集合
    await Resource.deleteMany({});
  });

  describe('Validation', () => {
    it('should validate a complete resource model', async () => {
      const resourceData = {
        name: 'Test Computing Resource',
        description: 'A powerful computing resource for scientific calculations',
        provider: testUser._id,
        type: 'compute',
        specs: {
          cpu: 8,
          memory: 16,
          storage: 1000,
          gpu: 2,
          bandwidth: 1000
        },
        status: 'available',
        price: 10.5,
        location: 'us-east-1',
        tags: ['ML', 'scientific', 'high-performance'],
      };

      const resource = new Resource(resourceData);
      const validationResult = await resource.validate();
      
      expect(validationResult).to.be.undefined;
    });

    it('should require name, provider, type, and price', async () => {
      const resourceData = {
        description: 'An incomplete resource',
        specs: {
          cpu: 4,
          memory: 8
        }
      };

      const resource = new Resource(resourceData);
      
      try {
        await resource.validate();
        expect.fail('Validation should have failed');
      } catch (error) {
        expect(error.errors.name).to.exist;
        expect(error.errors.provider).to.exist;
        expect(error.errors.type).to.exist;
        expect(error.errors.price).to.exist;
      }
    });

    it('should validate that price is positive', async () => {
      const resourceData = {
        name: 'Negative Price Resource',
        description: 'A resource with negative price',
        provider: testUser._id,
        type: 'compute',
        specs: {
          cpu: 4,
          memory: 8
        },
        price: -5
      };

      const resource = new Resource(resourceData);
      
      try {
        await resource.validate();
        expect.fail('Validation should have failed');
      } catch (error) {
        expect(error.errors.price).to.exist;
        expect(error.errors.price.message).to.include('positive');
      }
    });

    it('should validate resource type', async () => {
      const resourceData = {
        name: 'Invalid Type Resource',
        description: 'A resource with invalid type',
        provider: testUser._id,
        type: 'invalid-type',
        specs: {
          cpu: 4,
          memory: 8
        },
        price: 5
      };

      const resource = new Resource(resourceData);
      
      try {
        await resource.validate();
        expect.fail('Validation should have failed');
      } catch (error) {
        expect(error.errors.type).to.exist;
        expect(error.errors.type.message).to.include('Invalid resource type');
      }
    });
  });

  describe('Methods', () => {
    it('should calculate correct utilization', async () => {
      const resource = new Resource({
        name: 'Utilization Test Resource',
        provider: testUser._id,
        type: 'compute',
        price: 10,
        specs: {
          cpu: 16,
          memory: 64,
          storage: 1000,
        },
        usageStats: {
          cpuUtilization: 50,
          memoryUtilization: 70,
          storageUtilization: 30
        }
      });

      // Average of 50%, 70%, and 30%
      expect(resource.getOverallUtilization()).to.equal(50);
    });

    it('should check if resource is available', async () => {
      const availableResource = new Resource({
        name: 'Available Resource',
        provider: testUser._id,
        type: 'compute',
        price: 10,
        status: 'available'
      });

      const unavailableResource = new Resource({
        name: 'Unavailable Resource',
        provider: testUser._id,
        type: 'compute',
        price: 10,
        status: 'maintenance'
      });

      expect(availableResource.isAvailable()).to.be.true;
      expect(unavailableResource.isAvailable()).to.be.false;
    });

    it('should calculate hourly cost based on specs', async () => {
      const resource = new Resource({
        name: 'Cost Calculation Resource',
        provider: testUser._id,
        type: 'compute',
        price: 0.1, // Base price per CPU core
        specs: {
          cpu: 8,
          memory: 32,
          storage: 1000,
          gpu: 1
        }
      });

      // Assuming the pricing algorithm is: 
      // basePricePerCore * cores + memoryFactor + storageFactor + gpuFactor
      const calculatedPrice = resource.calculateHourlyCost();
      
      expect(calculatedPrice).to.be.a('number');
      expect(calculatedPrice).to.be.above(0);
    });
  });

  describe('Static Methods', () => {
    it('should find available resources of specific type', async () => {
      // Create test resources
      await Resource.create([
        {
          name: 'Available Compute',
          provider: testUser._id,
          type: 'compute',
          status: 'available',
          price: 10
        },
        {
          name: 'Unavailable Compute',
          provider: testUser._id,
          type: 'compute',
          status: 'maintenance',
          price: 15
        },
        {
          name: 'Available Storage',
          provider: testUser._id,
          type: 'storage',
          status: 'available',
          price: 5
        }
      ]);

      const availableCompute = await Resource.findAvailableByType('compute');
      
      expect(availableCompute).to.be.an('array');
      expect(availableCompute.length).to.equal(1);
      expect(availableCompute[0].name).to.equal('Available Compute');
    });

    it('should find resources by provider', async () => {
      // Create another user
      const anotherUser = await User.create({
        username: 'anotherprovider',
        email: 'another@example.com',
        passwordHash: 'hashedpassword123',
      });

      // Create test resources for different providers
      await Resource.create([
        {
          name: 'Provider 1 Resource',
          provider: testUser._id,
          type: 'compute',
          status: 'available',
          price: 10
        },
        {
          name: 'Provider 2 Resource',
          provider: anotherUser._id,
          type: 'storage',
          status: 'available',
          price: 5
        }
      ]);

      const provider1Resources = await Resource.findByProvider(testUser._id);
      
      expect(provider1Resources).to.be.an('array');
      expect(provider1Resources.length).to.equal(1);
      expect(provider1Resources[0].name).to.equal('Provider 1 Resource');
    });
  });

  describe('Hooks', () => {
    it('should set default values for new resources', async () => {
      const resourceData = {
        name: 'Default Test Resource',
        provider: testUser._id,
        type: 'compute',
        price: 10
      };

      const resource = await Resource.create(resourceData);
      
      expect(resource.status).to.equal('offline'); // Default status
      expect(resource.createdAt).to.be.an.instanceOf(Date);
      expect(resource.availability).to.be.an('object');
      expect(resource.usageStats).to.be.an('object');
    });

    it('should update lastUpdated timestamp on save', async () => {
      const resource = await Resource.create({
        name: 'Update Timestamp Resource',
        provider: testUser._id,
        type: 'compute',
        price: 10
      });
      
      const originalTimestamp = resource.lastUpdated;
      
      // Wait a moment and then update
      await new Promise(resolve => setTimeout(resolve, 10));
      
      resource.status = 'available';
      await resource.save();
      
      expect(resource.lastUpdated.getTime()).to.be.above(originalTimestamp.getTime());
    });
  });
}); 