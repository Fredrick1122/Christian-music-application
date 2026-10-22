export type PlaylistCategory =
  | 'dancing_stars'
  | 'prayer_chants'
  | 'worship'
  | 'praises'
  | 'preaching'
  | 'camp_messages';

export interface LyricLine {
  time: number; // in seconds
  text: string;
  translation?: string;
  section?: 'verse' | 'chorus' | 'bridge' | 'chant' | 'refrain' | 'spontaneous';
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  category: PlaylistCategory;
  duration: number; // in seconds
  audioSrc?: string; // URL, blob URL, or procedural identifier
  isLocal?: boolean;
  isOfflineAvailable?: boolean;
  fileSize?: number; // bytes
  coverArt?: string;
  speaker?: 'Bishop Dag Heward-Mills' | 'Bishop Joshua Heward-Mills' | 'Choir' | 'Dancing Stars Ministry' | 'Prayer Band' | 'Other';
  tags?: string[];
  keyScripture?: string;
  notes?: string;
  lyrics?: LyricLine[];
  audioBlob?: Blob; // stored in IndexedDB for offline play
  proceduralType?: 'praise_dance' | 'prayer_chant' | 'deep_worship' | 'high_praises' | 'sermon_dag' | 'sermon_joshua';
}

export interface PlaylistInfo {
  id: PlaylistCategory;
  name: string;
  subtitle: string;
  iconName: string;
  description: string;
  accentColor: string;
  gradient: string;
}

export type VisualizerMode = 'waves' | 'bars' | 'aura' | 'particles';

export type AppTheme = 'dark_midnight' | 'oled_black' | 'royal_gold' | 'celestial_blue';

export interface EqualizerBands {
  subBass: number; // 60Hz (-12 to +12 dB)
  bass: number;    // 250Hz
  mid: number;     // 1000Hz (vocal presence)
  presence: number;// 4000Hz (clarity)
  treble: number;  // 14000Hz
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  status: 'info' | 'success' | 'warning' | 'security';
}

export interface SecuritySettings {
  isLocked: boolean;
  pinCode: string;
  requirePinOnOpen: boolean;
  encryptionEnabled: boolean;
  biometricSupported: boolean;
  lastBackupDate: string | null;
}
