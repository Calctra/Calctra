# Calctra Deployment Guide

This document provides detailed instructions for deploying the Calctra platform in various environments, from development to production.

## Prerequisites

Before deploying Calctra, ensure you have the following:

- Node.js 16.x or later
- MongoDB 5.0 or later
- Solana CLI tools
- AWS account (for production deployment)
- Docker and Docker Compose (optional, for containerized deployment)

## Environment Setup

### Environment Variables

Create a `.env` file based on the `.env.example` template:

```bash
cp .env.example .env
```

Configure the following essential environment variables:

```
# Server Configuration
PORT=3000
NODE_ENV=production
API_BASE_URL=https://api.calctra.io/v1

# Database Configuration
MONGODB_URI=mongodb://username:password@hostname:port/calctra

# JWT Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=86400

# Solana Blockchain
SOLANA_NETWORK=mainnet-beta
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
WALLET_PRIVATE_KEY=your_wallet_private_key

# Storage Configuration
STORAGE_PROVIDER=aws
AWS_REGION=us-east-1
AWS_S3_BUCKET=calctra-data
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key

# Homomorphic Encryption
ENCRYPTION_KEY=your_encryption_key
```

Adjust these values according to your deployment environment.

## Local Development Deployment

### Backend

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. The API will be available at `http://localhost:3000`.

### Frontend

1. Navigate to the web directory:
   ```bash
   cd web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. The frontend will be available at `http://localhost:3001`.

## Docker Deployment

For containerized deployment, we use Docker Compose to manage the application components.

1. Build and start the containers:
   ```bash
   docker-compose up -d
   ```

2. To stop the containers:
   ```bash
   docker-compose down
   ```

The `docker-compose.yml` file includes the following services:
- API server
- Frontend
- MongoDB
- Redis (for caching)

## Production Deployment

For production, we recommend deploying Calctra on AWS using the following architecture:

### AWS Architecture

- **Frontend**: Amazon S3 + CloudFront
- **Backend API**: Amazon ECS (Fargate) or AWS Lambda + API Gateway
- **Database**: MongoDB Atlas or Amazon DocumentDB
- **Storage**: Amazon S3
- **Caching**: Amazon ElastiCache (Redis)
- **Load Balancing**: Amazon ELB
- **DNS**: Amazon Route 53

### Deployment Steps

#### Frontend Deployment

1. Build the frontend:
   ```bash
   cd web
   npm ci
   npm run build
   ```

2. Deploy to S3:
   ```bash
   aws s3 sync build/ s3://calctra-prod-frontend --delete
   ```

3. Set up CloudFront distribution pointing to the S3 bucket.

4. Configure SSL certificate through AWS Certificate Manager.

#### Backend Deployment

##### Option 1: ECS Deployment

1. Build the Docker image:
   ```bash
   docker build -t calctra-backend .
   ```

2. Tag and push to Amazon ECR:
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
   docker tag calctra-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/calctra-backend:latest
   docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/calctra-backend:latest
   ```

3. Create an ECS task definition and service using the AWS console or CLI.

##### Option 2: Serverless Deployment

1. Configure the `serverless.yml` file.

2. Deploy using the Serverless Framework:
   ```bash
   npm install -g serverless
   serverless deploy --stage production
   ```

#### Database Setup

1. Create a MongoDB Atlas cluster or Amazon DocumentDB instance.

2. Configure VPC peering if needed for secure access.

3. Create the necessary users and set up network access rules.

4. Run the database initialization script:
   ```bash
   npm run db:setup -- --uri mongodb+srv://username:password@cluster.mongodb.net/calctra
   ```

#### Security Configurations

1. Set up AWS WAF to protect against common web exploits.

2. Configure network ACLs and security groups.

3. Implement IAM roles with least privilege access.

4. Set up CloudWatch alarms for monitoring and alerting.

## Continuous Integration/Continuous Deployment (CI/CD)

Calctra uses GitHub Actions for CI/CD. The workflow is defined in `.github/workflows/ci.yml`.

For each push to the main branch:
1. Tests are run
2. Application is built
3. Artifacts are deployed to the production environment

For pushes to the develop branch, deployment is made to the staging environment.

## Monitoring and Logging

### Logging

Calctra uses structured logging with Winston. Logs are sent to:
- Console (development)
- CloudWatch Logs (production)

### Monitoring

We use the following for monitoring:
- AWS CloudWatch for metrics and alarms
- Sentry for error tracking
- Datadog for APM (optional)

Set up the following CloudWatch alarms:
- CPU and memory utilization
- API response time
- Error rate
- Database connections

## Backup and Disaster Recovery

### Database Backups

Configure automated backups for MongoDB Atlas or DocumentDB:
- Daily automated backups with 7-day retention
- Manual backups before major deployments

### Disaster Recovery

1. Create a disaster recovery plan including:
   - RTO (Recovery Time Objective)
   - RPO (Recovery Point Objective)
   - Recovery procedures

2. Regularly test the disaster recovery procedures.

### High Availability

For high availability:
- Use multi-AZ deployment for database
- Configure auto-scaling for ECS services
- Set up CloudFront with multiple origin servers

## Upgrading

When upgrading to a new version:

1. Review the changelog for breaking changes.

2. Test the upgrade in a staging environment.

3. Create a backup before upgrading.

4. Follow the version-specific upgrade instructions in the release notes.

5. Deploy with a blue-green deployment strategy to minimize downtime.

## Troubleshooting

### Common Issues

1. **API Connection Issues**
   - Check network connectivity
   - Verify environment variables
   - Ensure correct endpoint URLs

2. **Database Connection Problems**
   - Verify MongoDB connection string
   - Check network/firewall settings
   - Validate user credentials

3. **Solana Blockchain Integration**
   - Confirm RPC URL is accessible
   - Verify wallet private key
   - Check transaction errors in Solana Explorer

### Support

For deployment support, contact:
- Email: devops@calctra.io
- Discord: #deployment-support channel

## Appendix

### Performance Optimization

1. **Frontend Optimization**
   - Enable gzip compression in CloudFront
   - Configure proper cache headers
   - Implement CDN caching strategy

2. **Backend Optimization**
   - Configure Node.js for production
   - Optimize MongoDB indexes
   - Implement API response caching

### Scaling Considerations

As your Calctra deployment grows:

1. Implement database sharding strategy for MongoDB
2. Set up read replicas for database queries
3. Configure autoscaling for API servers
4. Optimize blockchain interactions to reduce RPC calls 