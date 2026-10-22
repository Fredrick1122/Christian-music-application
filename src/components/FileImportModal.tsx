import React, { useState, useRef } from 'react';
import { autoCategorizeTrack, storageService } from '../services/storageService';
import { PlaylistCategory, Track } from '../types';
import { PLAYLIST_CATEGORIES } from '../data/initialCatalog';
import { Upload, FolderOpen, CheckCircle, Music, X, Sparkles, AlertCircle } from 'lucide-react';

interface FileImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (importedTracks: Track[]) => void;
}

interface PendingImport {
  id: string;
  file: File;
  title: string;
  artist: string;
  speaker: Track['speaker'];
  category: PlaylistCategory;
  duration: number;
}

export const FileImportModal: React.FC<FileImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [pendingList, setPendingList] = useState<PendingImport[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setImportStatus('Analyzing phone audio files & organizing into playlists...');

    const newPending: PendingImport[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Only accept audio files
      if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|m4a|wav|aac|ogg|flac|opus)$/i)) {
        continue;
      }

      // Try to determine duration using Audio element
      let duration = 180;
      try {
        const objectUrl = URL.createObjectURL(file);
        const tempAudio = new Audio(objectUrl);
        duration = await new Promise<number>((resolve) => {
          tempAudio.onloadedmetadata = () => {
            resolve(Math.round(tempAudio.duration) || 180);
            URL.revokeObjectURL(objectUrl);
          };
          tempAudio.onerror = () => {
            resolve(180);
            URL.revokeObjectURL(objectUrl);
          };
          setTimeout(() => resolve(180), 800);
        });
      } catch {
        duration = 180;
      }

      // Auto-categorize based on title and filename
      const categorized = autoCategorizeTrack(file.name, duration);

      newPending.push({
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        file,
        title: categorized.cleanedTitle,
        artist: categorized.artist,
        speaker: categorized.speaker,
        category: categorized.category,
        duration,
      });
    }

    setPendingList((prev) => [...prev, ...newPending]);
    setIsProcessing(false);
    setImportStatus(null);
  };

  const handleCategoryChange = (index: number, newCategory: PlaylistCategory) => {
    setPendingList((prev) => {
      const updated = [...prev];
      updated[index].category = newCategory;
      return updated;
    });
  };

  const removeItem = (index: number) => {
    setPendingList((prev) => prev.filter((_, i) => i !== index));
  };

  const saveAllToIndexedDB = async () => {
    if (pendingList.length === 0) return;

    setIsProcessing(true);
    setImportStatus('Saving audio to device offline storage (IndexedDB)...');

    const importedTracks: Track[] = [];

    for (const item of pendingList) {
      const track: Track = {
        id: item.id,
        title: item.title,
        artist: item.artist,
        category: item.category,
        duration: item.duration,
        isLocal: true,
        isOfflineAvailable: true,
        fileSize: item.file.size,
        speaker: item.speaker,
        tags: ['phone file', 'offline ready', item.category.replace('_', ' ')],
        audioBlob: item.file,
      };

      await storageService.saveImportedTrack(track, item.file);
      importedTracks.push(track);
    }

    setIsProcessing(false);
    setPendingList([]);
    onImportComplete(importedTracks);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121624] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <FolderOpen size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Phone Audio Scanner &amp; Auto-Arranger
              </h2>
              <p className="text-xs text-white/60">
                Picks up songs from your device and organizes them into Christian playlists automatically
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* Action buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2.5 px-4 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold rounded-xl shadow-lg shadow-amber-500/10 transition-all cursor-pointer"
            >
              <Upload size={18} />
              Select Audio Files (Phone)
            </button>

            <button
              onClick={() => folderInputRef.current?.click()}
              className="flex items-center justify-center gap-2.5 px-4 py-3.5 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl border border-white/15 transition-all cursor-pointer"
            >
              <FolderOpen size={18} className="text-amber-400" />
              Scan Entire Music Folder
            </button>
          </div>

          {/* Hidden inputs */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/*,.mp3,.m4a,.wav,.aac,.ogg,.flac"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <input
            ref={folderInputRef}
            type="file"
            multiple
            // @ts-ignore
            webkitdirectory="true"
            directory="true"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          {/* Status info */}
          {importStatus && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2.5 text-xs text-amber-300">
              <Sparkles size={16} className="animate-spin text-amber-400" />
              <span>{importStatus}</span>
            </div>
          )}

          {/* Pending items list */}
          {pendingList.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-white/70">
                <span className="font-semibold text-white">
                  Detected {pendingList.length} Tracks (Auto-Categorized):
                </span>
                <span className="text-amber-400">Review &amp; reassign playlist if needed</span>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {pendingList.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                      <Music size={16} className="text-amber-400 shrink-0" />
                      <div className="truncate">
                        <p className="font-medium text-white truncate">{item.title}</p>
                        <p className="text-[11px] text-white/50 truncate">
                          {item.artist} &bull; {(item.file.size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      </div>
                    </div>

                    {/* Playlist Category selector */}
                    <select
                      value={item.category}
                      onChange={(e) => handleCategoryChange(idx, e.target.value as PlaylistCategory)}
                      className="bg-[#1f2538] text-amber-300 border border-white/20 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 shrink-0"
                    >
                      {PLAYLIST_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => removeItem(idx)}
                      className="text-white/40 hover:text-rose-400 p-1"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-white/15 rounded-2xl p-8 text-center space-y-3 bg-white/[0.02]">
              <div className="w-12 h-12 mx-auto rounded-full bg-white/5 flex items-center justify-center text-white/40">
                <Music size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-white">No files imported yet</p>
                <p className="text-xs text-white/50 mt-1 max-w-sm mx-auto">
                  Select MP3s or sermons from your phone. Our smart algorithm identifies Bishop Dag &amp; Joshua Heward-Mills preaching, Dancing Stars, Prayer Chants, and Worship automatically!
                </p>
              </div>
            </div>
          )}

          {/* Offline reminder */}
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-2.5 text-xs text-emerald-300">
            <CheckCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-emerald-200">100% Offline Storage</p>
              <p className="text-emerald-300/80 text-[11px] mt-0.5">
                All imported tracks are securely saved to your phone's browser database (IndexedDB). No internet or mobile data required while traveling.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between bg-black/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-white/70 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={saveAllToIndexedDB}
            disabled={pendingList.length === 0 || isProcessing}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-black text-xs font-bold rounded-xl shadow-lg transition-all"
          >
            <CheckCircle size={15} />
            {isProcessing ? 'Saving to Offline Storage...' : `Add ${pendingList.length} Tracks to Library`}
          </button>
        </div>
      </div>
    </div>
  );
};
