import { 
  S3Client, 
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand 
} from '@aws-sdk/client-s3';
import { 
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  QueryCommand,
  DeleteItemCommand
} from '@aws-sdk/client-dynamodb';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

const s3Client = new S3Client({ region: 'us-east-1' });
const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const BUCKET_NAME = 'social-media-scheduler-temp-storage';

export async function uploadMedia(file: File, userId: string): Promise<string> {
  const key = `${userId}/${Date.now()}-${file.name}`;
  
  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: Buffer.from(await file.arrayBuffer()),
    ContentType: file.type,
  }));

  return key;
}

export async function deleteMedia(key: string): Promise<void> {
  await s3Client.send(new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  }));
}

export async function getMediaUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  
  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

export async function saveUser(user: any): Promise<void> {
  await dynamoClient.send(new PutItemCommand({
    TableName: 'social-media-users',
    Item: marshall(user),
  }));
}

export async function getUser(id: string): Promise<any> {
  const response = await dynamoClient.send(new GetItemCommand({
    TableName: 'social-media-users',
    Key: marshall({ id }),
  }));
  
  return response.Item ? unmarshall(response.Item) : null;
}

export async function saveSocialAccount(account: any): Promise<void> {
  await dynamoClient.send(new PutItemCommand({
    TableName: 'social-media-accounts',
    Item: marshall(account),
  }));
}

export async function getUserSocialAccounts(userId: string, platform?: string): Promise<any[]> {
  const params: any = {
    TableName: 'social-media-accounts',
    IndexName: 'user-platform-index',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: marshall({
      ':userId': userId,
    }),
  };

  if (platform) {
    params.KeyConditionExpression += ' AND platform = :platform';
    params.ExpressionAttributeValues = marshall({
      ':userId': userId,
      ':platform': platform,
    });
  }

  const response = await dynamoClient.send(new QueryCommand(params));
  return response.Items ? response.Items.map(item => unmarshall(item)) : [];
}

export async function saveScheduledPost(post: any): Promise<void> {
  await dynamoClient.send(new PutItemCommand({
    TableName: 'scheduled-posts',
    Item: marshall(post),
  }));
}

export async function deleteScheduledPost(id: string): Promise<void> {
  await dynamoClient.send(new DeleteItemCommand({
    TableName: 'scheduled-posts',
    Key: marshall({ id }),
  }));
}

export async function getScheduledPosts(userId: string): Promise<any[]> {
  const response = await dynamoClient.send(new QueryCommand({
    TableName: 'scheduled-posts',
    IndexName: 'user-schedule-index',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: marshall({
      ':userId': userId,
    }),
  }));

  return response.Items ? response.Items.map(item => unmarshall(item)) : [];
}

export async function getPendingPosts(): Promise<any[]> {
  const now = new Date().toISOString();
  
  const response = await dynamoClient.send(new QueryCommand({
    TableName: 'scheduled-posts',
    IndexName: 'user-schedule-index',
    KeyConditionExpression: 'scheduledTime <= :now',
    ExpressionAttributeValues: marshall({
      ':now': now,
    }),
  }));

  return response.Items ? response.Items.map(item => unmarshall(item)) : [];
}
