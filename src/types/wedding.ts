export interface TimelineEvent {
  id: string;
  title: string;
  time: string; // e.g. "16:00"
  description: string;
  icon: 'church' | 'glass' | 'music' | 'cake' | 'heart' | 'sparkles' | 'utensils' | 'camera' | 'clock';
  isHighlight?: boolean;
}

export interface GoogleSyncConfig {
  isConnected: boolean;
  userEmail?: string;
  albumName: string;
  albumId?: string;
  autoSync: boolean;
  lastSyncTime?: string;
  syncedCount: number;
}

export interface WeddingSettings {
  coupleNames: string;
  weddingDate: string; // e.g. "2026-06-20T16:00:00"
  weddingLocation: string;
  welcomeTitle: string;
  welcomeMessage: string;
  customNotice: string;
  googleSync: GoogleSyncConfig;
  adminPin: string;
  allowGuestComments: boolean;
  allowLikes: boolean;
  timeline: TimelineEvent[];
}

export interface PhotoItem {
  id: string;
  url: string;
  authorName: string;
  deviceId: string;
  caption: string;
  createdAt: string;
  likes: number;
  reactions: {
    heart: number;
    tear: number; // 🥹 wzruszenie
    fire: number; // 🔥 ogień parkietu
    laugh: number; // 😂 wesołość
  };
  userReactions?: Record<string, 'heart' | 'tear' | 'fire' | 'laugh'>; // deviceId -> reaction
  likedByDevices: string[];
  googleSynced?: boolean;
}

export interface WeddingStats {
  totalPhotos: number;
  uniqueContributors: number;
  contributorsList: string[];
  syncedToGoogleCount: number;
}

export interface GuestProfile {
  name: string;
  deviceId: string;
  isRegistered: boolean;
}
