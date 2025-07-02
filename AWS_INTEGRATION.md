# AWS Integration for Scholarship Server

This document describes the AWS integration features added to the scholarship server, including AWS Bedrock, Comprehend, DynamoDB, and Lambda services.

## Overview

The scholarship server now supports multiple AWS services to provide enhanced scholarship search capabilities:

- **AWS Bedrock**: AI-powered scholarship recommendations using Claude models
- **AWS Comprehend**: Natural language processing for text analysis
- **AWS DynamoDB**: NoSQL database for storing and querying scholarship data
- **Enhanced AI Scraping**: Uses existing AI-powered web scraping with improved processing

## Features

### 1. Enhanced AI Search with AWS Bedrock

The server now uses AWS Bedrock (Claude models) instead of OpenAI for AI-powered scholarship recommendations. This provides:

- More accurate and contextual scholarship recommendations
- Better understanding of search criteria
- Structured JSON responses
- Cost-effective AI processing

### 2. Text Analysis with AWS Comprehend

AWS Comprehend is used to analyze scholarship text and extract:

- Named entities (organizations, locations, amounts, dates)
- Key phrases and important terms
- Sentiment analysis
- Demographic information

### 3. Data Storage with AWS DynamoDB

Scholarship data is stored in DynamoDB with:

- Efficient querying using Global Secondary Indexes
- Flexible schema for different scholarship types
- Automatic scaling and high availability
- Fast retrieval for search operations

### 4. Enhanced AI-Powered Web Scraping

The system uses your existing AI-powered web scraping with improvements:

- Collects real-time scholarship data from multiple sources
- Uses AI to intelligently parse HTML content
- Handles rate limiting and error recovery
- Integrates with AWS services for enhanced processing

## Configuration

### Environment Variables

Add the following environment variables to your `.env` file:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key

# AWS Services Configuration
AWS_BEDROCK_MODEL_ID=anthropic.claude-v2
AWS_DYNAMODB_TABLE_NAME=Scholarships

# Fallback Configuration (if AWS is not available)
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-3.5-turbo
```

### AWS Services Setup

#### 1. DynamoDB Table

Create a DynamoDB table with the following structure:

```json
{
  "TableName": "Scholarships",
  "KeySchema": [
    {
      "AttributeName": "id",
      "KeyType": "HASH"
    }
  ],
  "AttributeDefinitions": [
    {
      "AttributeName": "id",
      "AttributeType": "S"
    },
    {
      "AttributeName": "active",
      "AttributeType": "S"
    }
  ],
  "GlobalSecondaryIndexes": [
    {
      "IndexName": "SearchIndex",
      "KeySchema": [
        {
          "AttributeName": "active",
          "KeyType": "HASH"
        }
      ],
      "Projection": {
        "ProjectionType": "ALL"
      }
    }
  ]
}
```

#### 2. Enhanced Scraping

The system uses your existing AI-powered web scraping functionality:

- No additional Lambda setup required
- Leverages existing scholarship website configurations
- Uses AI for intelligent HTML parsing
- Integrates seamlessly with AWS services

#### 3. IAM Permissions

Ensure your AWS credentials have the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "comprehend:DetectEntities",
        "comprehend:DetectKeyPhrases",
        "comprehend:DetectSentiment",
        "dynamodb:Query",
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Scan"
      ],
      "Resource": "*"
    }
  ]
}
```

## API Endpoints

### Enhanced Search Endpoint

**POST** `/api/scholarships/enhanced-search`

Request body:
```json
{
  "criteria": {
    "major": "Computer Science",
    "gpa": 3.5,
    "ethnicity": "Hispanic/Latino",
    "state": "California",
    "gender": "Female",
    "educationLevel": "Undergraduate",
    "academicYear": "College Senior",
    "essayRequired": true,
    "recommendationRequired": false
  },
  "maxResults": 10,
  "useAIScraping": true,
  "useComprehendAnalysis": true,
  "useDynamoDB": true
}
```

Response:
```json
{
  "success": true,
  "data": {
    "scholarships": [...],
    "totalFound": 15,
    "searchTimestamp": "2024-01-15T10:30:00.000Z"
  },
  "metadata": {
    "sourcesUsed": ["dynamodb", "bedrock-ai", "ai-scraping", "comprehend"],
    "aiModel": "AWS Bedrock",
    "processingTime": "1250ms",
    "sources": {
      "dynamodb": 8,
      "ai": 5,
      "scraping": 2
    },
    "analysis": {
      "entities": [...],
      "keyPhrases": [...],
      "sentiment": {...}
    }
  }
}
```

### Legacy Search Endpoint (with AWS Fallback)

**POST** `/api/scholarships/find`

The existing endpoint now automatically uses AWS services if configured, or falls back to OpenAI if AWS is not available.

## Service Architecture

### EnhancedAIService

The main service that orchestrates all AWS services:

```typescript
class EnhancedAIService {
  private bedrockService: AWSBedrockService;
  private comprehendService: AWSComprehendService;
  private dynamoDBService: AWSDynamoDBService;
  private lambdaService: AWSLambdaService;
}
```

### Service Flow

1. **DynamoDB Search**: Query stored scholarships based on criteria
2. **AI Scraping**: Use existing AI-powered web scraping
3. **Bedrock AI**: Generate AI-powered recommendations
4. **Comprehend Analysis**: Analyze and extract insights from results
5. **Result Processing**: Deduplicate, rank, and return final results

## Error Handling

The system includes comprehensive error handling:

- Graceful fallback to OpenAI if AWS services are unavailable
- Individual service error isolation
- Detailed error logging for debugging
- User-friendly error messages

## Performance Considerations

- **Caching**: DynamoDB provides fast query performance
- **Parallel Processing**: Multiple AWS services run concurrently
- **Rate Limiting**: Built-in rate limiting for API calls
- **Scaling**: Automatic scaling with Lambda and DynamoDB

## Monitoring and Logging

- CloudWatch integration for AWS service monitoring
- Structured logging for debugging
- Performance metrics tracking
- Error rate monitoring

## Migration Guide

### From OpenAI to AWS

1. Set up AWS credentials and services
2. Update environment variables
3. Test the enhanced search endpoint
4. Gradually migrate existing functionality

### Data Migration

1. Export existing scholarship data
2. Transform data to DynamoDB format
3. Import data using AWS CLI or SDK
4. Verify data integrity

## Troubleshooting

### Common Issues

1. **AWS Credentials**: Ensure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set
2. **Permissions**: Verify IAM permissions for all AWS services
3. **Region**: Ensure AWS_REGION matches your service locations
4. **Table Names**: Verify DynamoDB table names match configuration

### Debug Mode

Enable debug mode by setting `NODE_ENV=development` to get detailed error messages.

## Future Enhancements

- **SageMaker Integration**: Custom ML models for scholarship matching
- **Elasticsearch**: Advanced search capabilities
- **S3 Integration**: Document storage for scholarship applications
- **SQS/SNS**: Asynchronous processing and notifications
- **CloudFront**: CDN for static scholarship data 