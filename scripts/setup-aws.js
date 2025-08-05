#!/usr/bin/env node

/**
 * AWS Infrastructure Setup Script
 * Secure File Sharing System - Phase 1, Milestone 1.1
 * 
 * This script sets up the initial AWS infrastructure including:
 * - IAM roles and policies
 * - S3 bucket with proper configuration
 * - DynamoDB tables
 * - CloudWatch logging
 */

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  projectName: 'secure-multimedia-storage',
  region: 'us-east-1',
  bucketName: 'secure-multimedia-storage-files',
  tables: {
    files: 'secure-multimedia-files',
    users: 'secure-multimedia-users',
    fileHistory: 'secure-multimedia-file-history'
  }
};

class AWSSetup {
  constructor() {
    this.s3 = new AWS.S3({ region: CONFIG.region });
    this.dynamodb = new AWS.DynamoDB({ region: CONFIG.region });
    this.iam = new AWS.IAM({ region: CONFIG.region });
    this.cloudwatch = new AWS.CloudWatchLogs({ region: CONFIG.region });
  }

  async setupInfrastructure() {
    console.log('🚀 Starting AWS Infrastructure Setup...');
    console.log('Project:', CONFIG.projectName);
    console.log('Region:', CONFIG.region);
    console.log('');

    try {
      // Step 1: Create S3 Bucket
      await this.createS3Bucket();
      
      // Step 2: Create DynamoDB Tables
      await this.createDynamoTables();
      
      // Step 3: Create IAM Roles and Policies
      await this.createIAMRoles();
      
      // Step 4: Set up CloudWatch Logging
      await this.setupCloudWatch();
      
      console.log('✅ AWS Infrastructure Setup Complete!');
      this.generateConfigFile();
      
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    }
  }

  async createS3Bucket() {
    console.log('📦 Creating S3 Bucket...');
    
    const bucketParams = {
      Bucket: CONFIG.bucketName,
      CreateBucketConfiguration: {
        LocationConstraint: CONFIG.region === 'us-east-1' ? undefined : CONFIG.region
      }
    };

    try {
      await this.s3.createBucket(bucketParams).promise();
      console.log(`✅ S3 Bucket created: ${CONFIG.bucketName}`);
      
      // Configure bucket settings
      await this.configureS3Bucket();
      
    } catch (error) {
      if (error.code === 'BucketAlreadyExists') {
        console.log(`⚠️  S3 Bucket already exists: ${CONFIG.bucketName}`);
      } else {
        throw error;
      }
    }
  }

  async configureS3Bucket() {
    console.log('🔧 Configuring S3 Bucket settings...');
    
    // Enable versioning
    await this.s3.putBucketVersioning({
      Bucket: CONFIG.bucketName,
      VersioningConfiguration: { Status: 'Enabled' }
    }).promise();
    
    // Enable server-side encryption
    await this.s3.putBucketEncryption({
      Bucket: CONFIG.bucketName,
      ServerSideEncryptionConfiguration: {
        Rules: [{
          ApplyServerSideEncryptionByDefault: {
            SSEAlgorithm: 'AES256'
          }
        }]
      }
    }).promise();
    
    // Set bucket policy for least-privilege access
    const bucketPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'DenyUnencryptedObjectUploads',
          Effect: 'Deny',
          Principal: '*',
          Action: 's3:PutObject',
          Resource: `arn:aws:s3:::${CONFIG.bucketName}/*`,
          Condition: {
            StringNotEquals: {
              's3:x-amz-server-side-encryption': 'AES256'
            }
          }
        }
      ]
    };
    
    await this.s3.putBucketPolicy({
      Bucket: CONFIG.bucketName,
      Policy: JSON.stringify(bucketPolicy)
    }).promise();
    
    console.log('✅ S3 Bucket configured with encryption and versioning');
  }

  async createDynamoTables() {
    console.log('🗄️  Creating DynamoDB Tables...');
    
    const tables = [
      {
        TableName: CONFIG.tables.files,
        KeySchema: [
          { AttributeName: 'file_id', KeyType: 'HASH' },
          { AttributeName: 'user_id', KeyType: 'RANGE' }
        ],
        AttributeDefinitions: [
          { AttributeName: 'file_id', AttributeType: 'S' },
          { AttributeName: 'user_id', AttributeType: 'S' }
        ],
        BillingMode: 'PAY_PER_REQUEST'
      },
      {
        TableName: CONFIG.tables.users,
        KeySchema: [
          { AttributeName: 'user_id', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
          { AttributeName: 'user_id', AttributeType: 'S' }
        ],
        BillingMode: 'PAY_PER_REQUEST'
      },
      {
        TableName: CONFIG.tables.fileHistory,
        KeySchema: [
          { AttributeName: 'file_id', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' }
        ],
        AttributeDefinitions: [
          { AttributeName: 'file_id', AttributeType: 'S' },
          { AttributeName: 'timestamp', AttributeType: 'S' }
        ],
        BillingMode: 'PAY_PER_REQUEST'
      }
    ];
    
    for (const table of tables) {
      try {
        await this.dynamodb.createTable(table).promise();
        console.log(`✅ DynamoDB Table created: ${table.TableName}`);
      } catch (error) {
        if (error.code === 'ResourceInUseException') {
          console.log(`⚠️  DynamoDB Table already exists: ${table.TableName}`);
        } else {
          throw error;
        }
      }
    }
  }

  async createIAMRoles() {
    console.log('🔐 Creating IAM Roles and Policies...');
    
    // Create Lambda execution role
    const lambdaRolePolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { Service: 'lambda.amazonaws.com' },
          Action: 'sts:AssumeRole'
        }
      ]
    };
    
    try {
      const role = await this.iam.createRole({
        RoleName: `${CONFIG.projectName}-lambda-role`,
        AssumeRolePolicyDocument: JSON.stringify(lambdaRolePolicy),
        Description: 'Lambda execution role for secure file sharing system'
      }).promise();
      
      // Attach basic Lambda execution policy
      await this.iam.attachRolePolicy({
        RoleName: `${CONFIG.projectName}-lambda-role`,
        PolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      }).promise();
      
      console.log(`✅ IAM Role created: ${CONFIG.projectName}-lambda-role`);
      
    } catch (error) {
      if (error.code === 'EntityAlreadyExists') {
        console.log(`⚠️  IAM Role already exists: ${CONFIG.projectName}-lambda-role`);
      } else {
        throw error;
      }
    }
  }

  async setupCloudWatch() {
    console.log('📊 Setting up CloudWatch Logging...');
    
    const logGroupName = `/aws/lambda/${CONFIG.projectName}`;
    
    try {
      await this.cloudwatch.createLogGroup({
        logGroupName: logGroupName
      }).promise();
      
      console.log(`✅ CloudWatch Log Group created: ${logGroupName}`);
      
    } catch (error) {
      if (error.code === 'ResourceAlreadyExistsException') {
        console.log(`⚠️  CloudWatch Log Group already exists: ${logGroupName}`);
      } else {
        throw error;
      }
    }
  }

  generateConfigFile() {
    console.log('📝 Generating configuration file...');
    
    const config = {
      aws: {
        region: CONFIG.region,
        bucketName: CONFIG.bucketName,
        tables: CONFIG.tables
      },
      project: {
        name: CONFIG.projectName,
        version: '1.0.0'
      }
    };
    
    const configPath = path.join(__dirname, '..', 'src', 'backend', 'config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    console.log(`✅ Configuration saved to: ${configPath}`);
  }
}

// Run the setup
if (require.main === module) {
  const setup = new AWSSetup();
  setup.setupInfrastructure();
}

module.exports = AWSSetup; 