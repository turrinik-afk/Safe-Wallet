export interface Coordinates {
  lat: number;
  lng: number;
}

export interface WalletStatus {
  isConnected: boolean;
  batteryLevel: number;
  isLost: boolean;
  lastSeen: Date;
  location: Coordinates;
  distance: number; // in meters (simulated)
  temperature: string; // "Hot", "Warm", "Cold" based on distance
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isAudio?: boolean;
  timestamp: Date;
  groundingMetadata?: any;
}

export type WalletItemType = 'credit' | 'id' | 'loyalty' | 'other';

export interface WalletItem {
  id: string;
  type: WalletItemType;
  name: string; // e.g., "Visa Gold"
  issuer?: string; // e.g., "UBS"
  color: string; // CSS class for gradient
  
  // New detailed fields
  number?: string;
  issueDate?: string;
  expiryDate?: string;
  supportPhone?: string; // Number to call if lost
  contactPhone?: string; // General contact
}

export interface AppState {
  view: 'dashboard' | 'map' | 'assistant' | 'settings' | 'contents';
  walletStatus: WalletStatus;
  userLocation: Coordinates | null;
  walletItems: WalletItem[];
}

export enum SoundType {
  BEEP = 'beep',
  VOICE = 'voice'
}