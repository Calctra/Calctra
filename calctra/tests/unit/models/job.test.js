const { expect } = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');
const { Job } = require('../../../src/models/job.model');
const { User } = require('../../../src/models/user.model');
const { Resource } = require('../../../src/models/resource.model');

describe('Job Model', () => {
  let testUser, testResource;

  before(async () => {
    // 连接到测试数据库
    await mongoose.connect(process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/calctra_test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // 创建测试用户和资源
    testUser = await User.create({
      username: 'jobtester',
      email: 'job@example.com',
      passwordHash: 'hashedpassword123',
    });

    testResource = await Resource.create({
      name: 'Test Resource for Jobs',
      provider: testUser._id,
      type: 'compute',
      price: 10,
      specs: {
        cpu: 8,
        memory: 32,
        storage: 1000
      }
    });
  });

  after(async () => {
    // 断开连接并清理
    await User.deleteMany({});
    await Resource.deleteMany({});
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // 每个测试前清理作业集合
    await Job.deleteMany({});
  });

  describe('Validation', () => {
    it('should validate a complete job model', async () => {
      const jobData = {
        name: 'Test Scientific Calculation',
        description: 'A complex fluid dynamics simulation',
        owner: testUser._id,
        resource: testResource._id,
        type: 'scientific',
        status: 'pending',
        requirements: {
          cpu: 4,
          memory: 16,
          storage: 100,
          duration: 3600
        },
        input: {
          dataUrl: 'https://example.com/input-data',
          parameters: {
            resolution: 'high',
            iterations: 1000
          }
        },
        output: {},
        priority: 'normal'
      };

      const job = new Job(jobData);
      const validationResult = await job.validate();
      
      expect(validationResult).to.be.undefined;
    });

    it('should require name, owner, and resource', async () => {
      const jobData = {
        description: 'An incomplete job',
        type: 'scientific',
        status: 'pending'
      };

      const job = new Job(jobData);
      
      try {
        await job.validate();
        expect.fail('Validation should have failed');
      } catch (error) {
        expect(error.errors.name).to.exist;
        expect(error.errors.owner).to.exist;
        expect(error.errors.resource).to.exist;
      }
    });

    it('should validate job priority', async () => {
      const jobData = {
        name: 'Priority Test Job',
        owner: testUser._id,
        resource: testResource._id,
        type: 'scientific',
        priority: 'ultra' // Invalid priority
      };

      const job = new Job(jobData);
      
      try {
        await job.validate();
        expect.fail('Validation should have failed');
      } catch (error) {
        expect(error.errors.priority).to.exist;
        expect(error.errors.priority.message).to.include('Invalid job priority');
      }
    });

    it('should validate job status', async () => {
      const jobData = {
        name: 'Status Test Job',
        owner: testUser._id,
        resource: testResource._id,
        type: 'scientific',
        status: 'invalid-status' // Invalid status
      };

      const job = new Job(jobData);
      
      try {
        await job.validate();
        expect.fail('Validation should have failed');
      } catch (error) {
        expect(error.errors.status).to.exist;
        expect(error.errors.status.message).to.include('Invalid job status');
      }
    });
  });

  describe('Methods', () => {
    it('should calculate estimated completion time', async () => {
      const now = new Date();
      const job = new Job({
        name: 'Completion Time Test',
        owner: testUser._id,
        resource: testResource._id,
        type: 'scientific',
        status: 'processing',
        startTime: now,
        requirements: {
          duration: 3600 // 1 hour in seconds
        },
        progress: 50 // 50% complete
      });

      const estimatedCompletion = job.getEstimatedCompletionTime();
      
      // Should be approximately startTime + (total duration - elapsed time)
      const expectedCompletion = new Date(now.getTime() + (3600 * 1000 * 0.5));
      
      // Allow for slight timing differences
      expect(Math.abs(estimatedCompletion.getTime() - expectedCompletion.getTime())).to.be.lessThan(1000);
    });

    it('should calculate cost based on resource price and duration', async () => {
      const job = new Job({
        name: 'Cost Calculation Test',
        owner: testUser._id,
        resource: testResource._id,
        type: 'scientific',
        requirements: {
          duration: 7200, // 2 hours in seconds
          cpu: 4, // Half of the resource's CPU
          memory: 16 // Half of the resource's memory
        }
      });

      // Mock the resource price
      job.getResourcePrice = () => 10; // $10 per hour
      
      const cost = job.calculateCost();
      
      // Expected: hourly rate * duration in hours * resource utilization
      // $10 * 2 hours * 0.5 (50% of resources) = $10
      expect(cost).to.equal(10);
    });

    it('should check if job is cancellable', async () => {
      const pendingJob = new Job({
        name: 'Pending Job',
        owner: testUser._id,
        resource: testResource._id,
        status: 'pending'
      });

      const processingJob = new Job({
        name: 'Processing Job',
        owner: testUser._id,
        resource: testResource._id,
        status: 'processing'
      });

      const completedJob = new Job({
        name: 'Completed Job',
        owner: testUser._id,
        resource: testResource._id,
        status: 'completed'
      });
      
      expect(pendingJob.isCancellable()).to.be.true;
      expect(processingJob.isCancellable()).to.be.true;
      expect(completedJob.isCancellable()).to.be.false;
    });
  });

  describe('Static Methods', () => {
    it('should find jobs by owner', async () => {
      // Create another user
      const anotherUser = await User.create({
        username: 'anotherjobuser',
        email: 'anotherjob@example.com',
        passwordHash: 'hashedpassword123',
      });

      // Create test jobs for different users
      await Job.create([
        {
          name: 'User 1 Job',
          owner: testUser._id,
          resource: testResource._id,
          type: 'scientific',
          status: 'pending'
        },
        {
          name: 'User 2 Job',
          owner: anotherUser._id,
          resource: testResource._id,
          type: 'data-processing',
          status: 'pending'
        }
      ]);

      const user1Jobs = await Job.findByOwner(testUser._id);
      
      expect(user1Jobs).to.be.an('array');
      expect(user1Jobs.length).to.equal(1);
      expect(user1Jobs[0].name).to.equal('User 1 Job');
    });

    it('should find jobs by status', async () => {
      // Create test jobs with different statuses
      await Job.create([
        {
          name: 'Pending Job',
          owner: testUser._id,
          resource: testResource._id,
          status: 'pending'
        },
        {
          name: 'Processing Job',
          owner: testUser._id,
          resource: testResource._id,
          status: 'processing'
        },
        {
          name: 'Completed Job',
          owner: testUser._id,
          resource: testResource._id,
          status: 'completed'
        }
      ]);

      const pendingJobs = await Job.findByStatus('pending');
      
      expect(pendingJobs).to.be.an('array');
      expect(pendingJobs.length).to.equal(1);
      expect(pendingJobs[0].name).to.equal('Pending Job');
    });

    it('should find jobs by resource', async () => {
      // Create another resource
      const anotherResource = await Resource.create({
        name: 'Another Test Resource',
        provider: testUser._id,
        type: 'storage',
        price: 5
      });

      // Create test jobs for different resources
      await Job.create([
        {
          name: 'Compute Resource Job',
          owner: testUser._id,
          resource: testResource._id,
          type: 'scientific',
          status: 'pending'
        },
        {
          name: 'Storage Resource Job',
          owner: testUser._id,
          resource: anotherResource._id,
          type: 'data-processing',
          status: 'pending'
        }
      ]);

      const computeJobs = await Job.findByResource(testResource._id);
      
      expect(computeJobs).to.be.an('array');
      expect(computeJobs.length).to.equal(1);
      expect(computeJobs[0].name).to.equal('Compute Resource Job');
    });
  });

  describe('Hooks', () => {
    it('should set default values for new jobs', async () => {
      const jobData = {
        name: 'Default Test Job',
        owner: testUser._id,
        resource: testResource._id,
        type: 'scientific'
      };

      const job = await Job.create(jobData);
      
      expect(job.status).to.equal('pending'); // Default status
      expect(job.createdAt).to.be.an.instanceOf(Date);
      expect(job.priority).to.equal('normal'); // Default priority
      expect(job.progress).to.equal(0); // Default progress
    });

    it('should update lastUpdated timestamp on save', async () => {
      const job = await Job.create({
        name: 'Update Timestamp Job',
        owner: testUser._id,
        resource: testResource._id,
        type: 'scientific'
      });
      
      const originalTimestamp = job.lastUpdated;
      
      // Wait a moment and then update
      await new Promise(resolve => setTimeout(resolve, 10));
      
      job.status = 'processing';
      await job.save();
      
      expect(job.lastUpdated.getTime()).to.be.above(originalTimestamp.getTime());
    });

    it('should set startTime when job status changes to processing', async () => {
      const job = await Job.create({
        name: 'Start Time Test Job',
        owner: testUser._id,
        resource: testResource._id,
        type: 'scientific',
        status: 'pending'
      });
      
      expect(job.startTime).to.be.undefined;
      
      job.status = 'processing';
      await job.save();
      
      expect(job.startTime).to.be.an.instanceOf(Date);
    });

    it('should set endTime when job status changes to completed or failed', async () => {
      const job = await Job.create({
        name: 'End Time Test Job',
        owner: testUser._id,
        resource: testResource._id,
        type: 'scientific',
        status: 'processing',
        startTime: new Date()
      });
      
      expect(job.endTime).to.be.undefined;
      
      job.status = 'completed';
      await job.save();
      
      expect(job.endTime).to.be.an.instanceOf(Date);
    });
  });
}); 