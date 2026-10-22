import { AuditLogEntry, PlaylistCategory, SecuritySettings, Track } from '../types';
import { INITIAL_TRACKS } from '../data/initialCatalog';

const DB_NAME = 'kadosh_motion_db';
const DB_VERSION = 1;
const TRACKS_STORE = 'tracks_metadata';
const AUDIO_BLOBS_STORE = 'audio_blobs';
const AUDIT_STORE = 'audit_logs';

let dbInstance: IDBDatabase | null = null;

async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(TRACKS_STORE)) {
        db.createObjectStore(TRACKS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(AUDIO_BLOBS_STORE)) {
        db.createObjectStore(AUDIO_BLOBS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(AUDIT_STORE)) {
        db.createObjectStore(AUDIT_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };

    request.onerror = () => {
      console.error('IndexedDB open error:', request.error);
      reject(request.error);
    };
  });
}

// Auto-categorize imported file based on name & duration
export function autoCategorizeTrack(filename: string, durationSeconds = 0): {
  category: PlaylistCategory;
  speaker: Track['speaker'];
  cleanedTitle: string;
  artist: string;
} {
  const lower = filename.toLowerCase();
  
  // Clean title from extensions and common prefix patterns
  let cleanedTitle = filename
    .replace(/\.[a-zA-Z0-9]+$/, '')
    .replace(/^[\d\s-_.]+/, '')
    .trim();

  let category: PlaylistCategory = 'worship';
  let speaker: Track['speaker'] = 'Choir';
  let artist = 'Christian Fellowship';

  // Check for Bishop Dag / Bishop Joshua
  const hasDag = lower.includes('dag') || lower.includes('heward-mills') || lower.includes('bishop dag');
  const hasJoshua = lower.includes('joshua') || lower.includes('jhm') || lower.includes('bishop joshua');
  
  // Camp Messages
  if (
    lower.includes('camp') ||
    lower.includes('anagkazo') ||
    lower.includes('machaneh') ||
    lower.includes('iron sharpens') ||
    lower.includes('healing jesus')
  ) {
    category = 'camp_messages';
    speaker = hasJoshua ? 'Bishop Joshua Heward-Mills' : 'Bishop Dag Heward-Mills';
    artist = speaker;
  }
  // Preaching Messages
  else if (
    hasDag ||
    hasJoshua ||
    lower.includes('loyalty') ||
    lower.includes('anointing') ||
    lower.includes('shepherd') ||
    lower.includes('sermon') ||
    lower.includes('preaching') ||
    lower.includes('message') ||
    lower.includes('diligence') ||
    durationSeconds > 600 // More than 10 mins usually sermon
  ) {
    category = 'preaching';
    speaker = hasJoshua ? 'Bishop Joshua Heward-Mills' : (hasDag ? 'Bishop Dag Heward-Mills' : 'Bishop Dag Heward-Mills');
    artist = speaker;
  }
  // Dancing Stars
  else if (
    lower.includes('dancing') ||
    lower.includes('dancing stars') ||
    lower.includes('dance') ||
    lower.includes('choreograph') ||
    lower.includes('beat') ||
    lower.includes('steppers')
  ) {
    category = 'dancing_stars';
    speaker = 'Dancing Stars Ministry';
    artist = 'Dancing Stars Ministry';
  }
  // Prayer & Chants
  else if (
    lower.includes('prayer') ||
    lower.includes('chant') ||
    lower.includes('tongues') ||
    lower.includes('dunamis') ||
    lower.includes('katartismos') ||
    lower.includes('intercession') ||
    lower.includes('warfare') ||
    lower.includes('midnight')
  ) {
    category = 'prayer_chants';
    speaker = 'Prayer Band';
    artist = 'Holy Spirit Prayer Flow';
  }
  // Praises
  else if (
    lower.includes('praise') ||
    lower.includes('celebrat') ||
    lower.includes('joy') ||
    lower.includes('victory') ||
    lower.includes('shout') ||
    lower.includes('rejoice')
  ) {
    category = 'praises';
    speaker = 'Choir';
    artist = 'Gospel Praise Choir';
  }
  // Worship (Default for spiritual music)
  else {
    category = 'worship';
    speaker = 'Choir';
    artist = 'Sacred Altar Worship';
  }

  return { category, speaker, cleanedTitle, artist };
}

export const storageService = {
  // Load all tracks (cached starters + user imported)
  async getAllTracks(): Promise<Track[]> {
    try {
      const db = await getDB();
      const tx = db.transaction(TRACKS_STORE, 'readonly');
      const store = tx.objectStore(TRACKS_STORE);

      const userTracks: Track[] = await new Promise((resolve) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });

      // Merge initial catalog with user stored tracks
      const map = new Map<string, Track>();
      for (const track of INITIAL_TRACKS) {
        map.set(track.id, track);
      }
      for (const track of userTracks) {
        map.set(track.id, track);
      }

      return Array.from(map.values());
    } catch (e) {
      console.warn('Falling back to memory catalog:', e);
      return INITIAL_TRACKS;
    }
  },

  // Save imported track + audio blob into IndexedDB
  async saveImportedTrack(track: Track, blob?: Blob): Promise<void> {
    const db = await getDB();
    const tx = db.transaction([TRACKS_STORE, AUDIO_BLOBS_STORE], 'readwrite');
    const tracksStore = tx.objectStore(TRACKS_STORE);
    const blobsStore = tx.objectStore(AUDIO_BLOBS_STORE);

    // Don't store the large blob in metadata store
    const metaToSave = { ...track, audioBlob: undefined };
    tracksStore.put(metaToSave);

    if (blob) {
      blobsStore.put({ id: track.id, blob });
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        this.logAudit('TRACK_IMPORTED', `Saved track: ${track.title} [${track.category}]`, 'success');
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  },

  // Retrieve audio blob for an offline track
  async getAudioBlob(trackId: string): Promise<Blob | null> {
    try {
      const db = await getDB();
      const tx = db.transaction(AUDIO_BLOBS_STORE, 'readonly');
      const store = tx.objectStore(AUDIO_BLOBS_STORE);
      return new Promise((resolve) => {
        const req = store.get(trackId);
        req.onsuccess = () => resolve(req.result?.blob || null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  },

  // Delete track from local storage
  async deleteTrack(trackId: string): Promise<void> {
    const db = await getDB();
    const tx = db.transaction([TRACKS_STORE, AUDIO_BLOBS_STORE], 'readwrite');
    tx.objectStore(TRACKS_STORE).delete(trackId);
    tx.objectStore(AUDIO_BLOBS_STORE).delete(trackId);

    return new Promise((resolve) => {
      tx.oncomplete = () => {
        this.logAudit('TRACK_DELETED', `Deleted track ID: ${trackId}`, 'warning');
        resolve();
      };
    });
  },

  // Log an audit trail item for security & data accountability
  async logAudit(action: string, details: string, status: AuditLogEntry['status'] = 'info'): Promise<void> {
    try {
      const entry: AuditLogEntry = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        timestamp: new Date().toISOString(),
        action,
        details,
        status,
      };

      const db = await getDB();
      const tx = db.transaction(AUDIT_STORE, 'readwrite');
      tx.objectStore(AUDIT_STORE).put(entry);
    } catch (e) {
      console.warn('Could not persist audit log:', e);
    }
  },

  // Get audit logs
  async getAuditLogs(): Promise<AuditLogEntry[]> {
    try {
      const db = await getDB();
      const tx = db.transaction(AUDIT_STORE, 'readonly');
      const store = tx.objectStore(AUDIT_STORE);
      return new Promise((resolve) => {
        const req = store.getAll();
        req.onsuccess = () => {
          const logs: AuditLogEntry[] = req.result || [];
          logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          resolve(logs.slice(0, 50));
        };
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  },

  // Security preferences
  getSecuritySettings(): SecuritySettings {
    const raw = localStorage.getItem('kadosh_security_settings');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }
    return {
      isLocked: false,
      pinCode: '7777', // Default spiritual seed pin
      requirePinOnOpen: false,
      encryptionEnabled: true,
      biometricSupported: typeof window !== 'undefined' && 'PublicKeyCredential' in window,
      lastBackupDate: new Date().toLocaleDateString(),
    };
  },

  saveSecuritySettings(settings: SecuritySettings): void {
    localStorage.setItem('kadosh_security_settings', JSON.stringify(settings));
    this.logAudit('SECURITY_UPDATED', 'Updated PIN / Biometric security configurations', 'security');
  },

  // Export full library backup (JSON)
  async exportBackupJSON(): Promise<string> {
    const tracks = await this.getAllTracks();
    const settings = this.getSecuritySettings();
    const payload = {
      appName: 'Kadosh Motion Music',
      exportDate: new Date().toISOString(),
      trackCount: tracks.length,
      tracks: tracks.map((t) => ({ ...t, audioBlob: undefined })),
      security: {
        requirePinOnOpen: settings.requirePinOnOpen,
        encryptionEnabled: settings.encryptionEnabled,
      },
    };
    this.logAudit('BACKUP_EXPORTED', `Exported library snapshot with ${tracks.length} tracks`, 'success');
    return JSON.stringify(payload, null, 2);
  },
};
