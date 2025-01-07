export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface SocialAccount {
  id: string;
  userId: string;
  platform: 'instagram' | 'facebook';
  accountId: string;
  username: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  isDefault: boolean;
  profilePicture?: string;
}

export interface Session {
  user: User;
  expires: Date;
}
