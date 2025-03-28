# Calctra API Reference

This document provides a comprehensive guide to the Calctra API endpoints, request/response formats, and authentication requirements.

## Base URL

All API endpoints are relative to the base URL:

```
https://api.calctra.io/v1
```

## Authentication

Most API endpoints require authentication. Calctra uses JWT (JSON Web Tokens) for authentication.

### Authentication Header

```
Authorization: Bearer <your_jwt_token>
```

### Obtaining a Token

```
POST /api/auth/login
```

Request:
```json
{
  "email": "user@example.com",
  "password": "your_password"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400,
  "user": {
    "id": "user123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

## API Endpoints

### User Management

#### Register a New User

```
POST /api/auth/register
```

Request:
```json
{
  "email": "user@example.com",
  "password": "your_password",
  "name": "John Doe"
}
```

Response:
```json
{
  "message": "User registered successfully",
  "userId": "user123"
}
```

#### Get Current User Profile

```
GET /api/users/me
```

Response:
```json
{
  "id": "user123",
  "email": "user@example.com",
  "name": "John Doe",
  "walletAddress": "soL1abc...",
  "createdAt": "2023-01-15T08:30:00Z",
  "reputation": 4.8
}
```

#### Update User Profile

```
PUT /api/users/me
```

Request:
```json
{
  "name": "John Smith",
  "walletAddress": "soL1abc..."
}
```

Response:
```json
{
  "message": "Profile updated successfully"
}
```

### Resource Management

#### List Available Resources

```
GET /api/resources
```

Query Parameters:
- `type` (string): Filter by resource type (CPU, GPU, Storage)
- `minCpu` (number): Minimum CPU cores
- `minMemory` (number): Minimum memory in GB
- `minStorage` (number): Minimum storage in GB
- `hasGpu` (boolean): Whether GPU is required
- `maxPrice` (number): Maximum price per hour
- `page` (number): Page number for pagination
- `limit` (number): Number of items per page

Response:
```json
{
  "total": 120,
  "page": 1,
  "limit": 10,
  "resources": [
    {
      "id": "res123",
      "name": "High-Performance Compute Node",
      "description": "32-core server with NVIDIA A100 GPU",
      "owner": "user456",
      "specs": {
        "cpuCores": 32,
        "memoryGb": 128,
        "storageGb": 2048,
        "gpuModel": "NVIDIA A100",
        "gpuMemoryGb": 80
      },
      "pricePerHour": 5.75,
      "availability": {
        "schedule": {
          "days": [1, 2, 3, 4, 5],
          "startHour": 18,
          "endHour": 8
        },
        "timezone": "UTC"
      },
      "reputation": 4.9,
      "active": true
    },
    // More resources...
  ]
}
```

#### Get Resource Details

```
GET /api/resources/{resourceId}
```

Response: Detailed resource object as shown in the list response.

#### Register a New Resource

```
POST /api/resources
```

Request:
```json
{
  "name": "High-Performance Compute Node",
  "description": "32-core server with NVIDIA A100 GPU",
  "specs": {
    "cpuCores": 32,
    "memoryGb": 128,
    "storageGb": 2048,
    "gpuModel": "NVIDIA A100",
    "gpuMemoryGb": 80
  },
  "pricePerHour": 5.75,
  "availability": {
    "schedule": {
      "days": [1, 2, 3, 4, 5],
      "startHour": 18,
      "endHour": 8
    },
    "timezone": "UTC"
  }
}
```

Response:
```json
{
  "message": "Resource registered successfully",
  "resourceId": "res123"
}
```

#### Update Resource

```
PUT /api/resources/{resourceId}
```

Request: Same format as resource registration.

Response:
```json
{
  "message": "Resource updated successfully"
}
```

#### Delete Resource

```
DELETE /api/resources/{resourceId}
```

Response:
```json
{
  "message": "Resource deleted successfully"
}
```

### Job Management

#### List User's Jobs

```
GET /api/jobs
```

Query Parameters:
- `status` (string): Filter by job status (CREATED, MATCHED, ACCEPTED, RUNNING, COMPLETED, FAILED, CANCELLED)
- `page` (number): Page number for pagination
- `limit` (number): Number of items per page

Response:
```json
{
  "total": 45,
  "page": 1,
  "limit": 10,
  "jobs": [
    {
      "id": "job123",
      "name": "Protein Folding Simulation",
      "description": "Analyzing protein structures using molecular dynamics",
      "requirements": {
        "minCpuCores": 16,
        "minMemoryGb": 64,
        "minStorageGb": 500,
        "needsGpu": true,
        "minGpuMemoryGb": 24,
        "estimatedDurationHours": 48
      },
      "budget": 500,
      "status": "RUNNING",
      "progress": 75,
      "createdAt": "2023-02-20T14:15:00Z",
      "startedAt": "2023-02-21T08:30:00Z",
      "estimatedCompletion": "2023-02-23T08:30:00Z",
      "matchedResources": ["res456", "res789"]
    },
    // More jobs...
  ]
}
```

#### Get Job Details

```
GET /api/jobs/{jobId}
```

Response: Detailed job object as shown in the list response, plus additional details such as results when available.

#### Create a New Job

```
POST /api/jobs
```

Request:
```json
{
  "name": "Protein Folding Simulation",
  "description": "Analyzing protein structures using molecular dynamics",
  "type": "custom_code",
  "code": "# Python code for the simulation\nimport numpy as np\n...",
  "datasets": ["data123", "data456"],
  "requirements": {
    "minCpuCores": 16,
    "minMemoryGb": 64,
    "minStorageGb": 500,
    "needsGpu": true,
    "minGpuMemoryGb": 24,
    "estimatedDurationHours": 48
  },
  "budget": 500,
  "deadline": "2023-03-01T00:00:00Z"
}
```

Response:
```json
{
  "message": "Job created successfully",
  "jobId": "job123",
  "estimatedMatching": "2023-02-20T15:00:00Z"
}
```

#### Cancel a Job

```
POST /api/jobs/{jobId}/cancel
```

Response:
```json
{
  "message": "Job cancelled successfully"
}
```

#### Rate a Completed Job

```
POST /api/jobs/{jobId}/rate
```

Request:
```json
{
  "rating": 5,
  "feedback": "Excellent performance, job completed faster than expected"
}
```

Response:
```json
{
  "message": "Job rated successfully"
}
```

### Data Management

#### List User's Datasets

```
GET /api/data
```

Query Parameters:
- `type` (string): Filter by data type
- `page` (number): Page number for pagination
- `limit` (number): Number of items per page

Response:
```json
{
  "total": 28,
  "page": 1,
  "limit": 10,
  "datasets": [
    {
      "id": "data123",
      "name": "Genomic Sequences Dataset",
      "description": "Collection of genomic sequences from human subjects",
      "type": "genomic",
      "size": 25600,
      "format": "FASTA",
      "isEncrypted": true,
      "isPublic": false,
      "createdAt": "2023-01-10T09:45:00Z",
      "accessCount": 17
    },
    // More datasets...
  ]
}
```

#### Get Dataset Details

```
GET /api/data/{datasetId}
```

Response: Detailed dataset object as shown in the list response.

#### Upload a New Dataset

```
POST /api/data
```

Request: Multipart form data with:
- `name` (string): Dataset name
- `description` (string): Dataset description
- `type` (string): Dataset type
- `format` (string): Data format
- `isEncrypted` (boolean): Whether the data is encrypted
- `isPublic` (boolean): Whether the data is public
- `file` (binary): The dataset file

Response:
```json
{
  "message": "Dataset uploaded successfully",
  "datasetId": "data123"
}
```

#### Update Dataset Metadata

```
PUT /api/data/{datasetId}
```

Request:
```json
{
  "name": "Updated Genomic Sequences Dataset",
  "description": "Updated collection of genomic sequences",
  "isPublic": true
}
```

Response:
```json
{
  "message": "Dataset metadata updated successfully"
}
```

#### Delete Dataset

```
DELETE /api/data/{datasetId}
```

Response:
```json
{
  "message": "Dataset deleted successfully"
}
```

### Blockchain Integration

#### Get User Wallet Balance

```
GET /api/tokens/balance
```

Response:
```json
{
  "balance": 2500.75,
  "pendingTransactions": [
    {
      "id": "tx123",
      "type": "ESCROW",
      "amount": 500,
      "status": "PENDING",
      "createdAt": "2023-02-19T16:30:00Z",
      "relatedEntity": {
        "type": "JOB",
        "id": "job123"
      }
    }
  ]
}
```

#### Get Transaction History

```
GET /api/tokens/transactions
```

Query Parameters:
- `type` (string): Filter by transaction type (DEPOSIT, WITHDRAWAL, PAYMENT, REWARD)
- `status` (string): Filter by status (PENDING, COMPLETED, FAILED)
- `page` (number): Page number for pagination
- `limit` (number): Number of items per page

Response:
```json
{
  "total": 67,
  "page": 1,
  "limit": 10,
  "transactions": [
    {
      "id": "tx456",
      "type": "PAYMENT",
      "amount": 350.25,
      "status": "COMPLETED",
      "createdAt": "2023-02-15T10:20:00Z",
      "completedAt": "2023-02-15T10:25:00Z",
      "relatedEntity": {
        "type": "JOB",
        "id": "job789"
      },
      "transactionHash": "5XFh2KGb3eJ..."
    },
    // More transactions...
  ]
}
```

## Error Handling

All API errors return appropriate HTTP status codes and a JSON response with error details:

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested resource could not be found",
    "details": {
      "resourceId": "invalid_id"
    }
  }
}
```

Common error codes:
- `AUTHENTICATION_REQUIRED`: User is not authenticated
- `PERMISSION_DENIED`: User lacks permission for the operation
- `RESOURCE_NOT_FOUND`: Requested resource doesn't exist
- `VALIDATION_ERROR`: Request data failed validation
- `INSUFFICIENT_FUNDS`: Not enough tokens for the operation
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server encountered an unexpected error

## Rate Limiting

API requests are rate-limited to prevent abuse. Rate limit information is included in response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1607458800
```

If you exceed the rate limit, you'll receive a 429 Too Many Requests response.

## Versioning

The API version is included in the URL path. When we make backwards-incompatible changes, we release a new API version. We maintain older versions for a reasonable period to allow migration.

## Webhooks

Calctra provides webhooks for real-time event notifications. To register a webhook endpoint:

```
POST /api/webhooks
```

Request:
```json
{
  "url": "https://your-server.com/webhook",
  "events": ["job.completed", "job.failed", "payment.processed"],
  "secret": "your_webhook_secret"
}
```

Response:
```json
{
  "webhookId": "hook123",
  "message": "Webhook registered successfully"
}
```

Webhook payloads include a signature header (`X-Calctra-Signature`) that you can use to verify the request authenticity. 