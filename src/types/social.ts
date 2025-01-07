export type SocialPlatform = 'instagram' | 'twitter' | 'facebook' | 'linkedin';

export interface MediaFile {
  file: File | null;
  preview: string;
  type: 'image' | 'video';
}

export interface SocialPost {
  id: string;
  caption: string;
  scheduledTime: string;
  media: MediaFile[];
  platforms: SocialPlatform[];
  status: 'scheduled' | 'posted' | 'failed';
  location?: string;
  hashtags: string[];
  mentions: string[];
  error?: string;
}

export interface PlatformConfig {
  id: SocialPlatform;
  name: string;
  icon: string;
  isConnected: boolean;
  maxMedia: number;
  supportedMediaTypes: ('image' | 'video')[];
}
