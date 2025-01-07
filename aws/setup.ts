import { 
  S3Client, 
  CreateBucketCommand,
  PutBucketCorsCommand,
} from '@aws-sdk/client-s3';
import { 
  DynamoDBClient,
  CreateTableCommand,
} from '@aws-sdk/client-dynamodb';

const s3Client = new S3Client({ region: 'us-east-1' });
const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });

async function createS3Bucket() {
  const bucketName = 'social-media-scheduler-temp-storage';
  
  try {
    await s3Client.send(new CreateBucketCommand({
      Bucket: bucketName
    }));

    // Set CORS policy
    await s3Client.send(new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['PUT', 'POST', 'DELETE', 'GET'],
            AllowedOrigins: ['*'],
            ExposeHeaders: ['ETag']
          }
        ]
      }
    }));

    console.log('S3 bucket created successfully');
  } catch (error) {
    console.error('Error creating S3 bucket:', error);
  }
}

async function createDynamoDBTables() {
  try {
    // Users table
    await dynamoClient.send(new CreateTableCommand({
      TableName: 'social-media-users',
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'email', AttributeType: 'S' }
      ],
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'email-index',
          KeySchema: [
            { AttributeName: 'email', KeyType: 'HASH' }
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
          }
        }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1
      }
    }));

    // Social accounts table
    await dynamoClient.send(new CreateTableCommand({
      TableName: 'social-media-accounts',
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'userId', AttributeType: 'S' },
        { AttributeName: 'platform', AttributeType: 'S' }
      ],
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'user-platform-index',
          KeySchema: [
            { AttributeName: 'userId', KeyType: 'HASH' },
            { AttributeName: 'platform', KeyType: 'RANGE' }
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
          }
        }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1
      }
    }));

    // Scheduled posts table
    await dynamoClient.send(new CreateTableCommand({
      TableName: 'scheduled-posts',
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'userId', AttributeType: 'S' },
        { AttributeName: 'scheduledTime', AttributeType: 'S' }
      ],
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'user-schedule-index',
          KeySchema: [
            { AttributeName: 'userId', KeyType: 'HASH' },
            { AttributeName: 'scheduledTime', KeyType: 'RANGE' }
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
          }
        }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1
      }
    }));

    console.log('DynamoDB tables created successfully');
  } catch (error) {
    console.error('Error creating DynamoDB tables:', error);
  }
}

// Run setup
(async () => {
  await createS3Bucket();
  await createDynamoDBTables();
})();
