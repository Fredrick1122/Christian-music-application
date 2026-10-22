import React from 'react';
import { Track } from '../types';
import { Wifi, WifiOff, HardDrive, CheckCircle2, Plane, Trash2, X, RefreshCw } from 'lucide-react';

interface OfflineManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  allTracks: Track[];
  isAirplaneSimulated: boolean;
  onToggleAirplane: () => void;
  onDeleteLocalTrack: (trackId: string) => void;
}

export const OfflineManagerModal: React.FC<OfflineManagerModalProps> = ({
  isOpen,
  onClose,
  allTracks,
  isAirplaneSimulated,
  onToggleAirplane,
  onDeleteLocalTrack,
}) => {
  if (!isOpen) return null;

  const offlineTracks = allTracks.filter((t) => t.isOfflineAvailable || t.isLocal);
  const localImported = allTracks.filter((t) => t.isLocal);

  const totalBytes = localImported.reduce((acc, t) => acc + (t.fileSize || 0), 0);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121624] border border-white/10 rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Plane size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Offline Travel &amp; Storage Manager</h2>
            <p className="text-xs text-white/60">
              Seamless playback during flights, road trips, and remote missions
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Airplane Mode / Offline Mode toggle */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isAirplaneSimulated ? (
                <WifiOff size={22} className="text-amber-400" />
              ) : (
                <Wifi size={22} className="text-emerald-400" />
              )}
              <div>
                <p className="text-xs font-semibold text-white">
                  {isAirplaneSimulated ? 'Airplane / Offline Mode (Active)' : 'Online Streaming Mode'}
                </p>
                <p className="text-[11px] text-white/60">
                  {isAirplaneSimulated
                    ? 'All requests routed 100% to local phone storage & offline synthesizer'
                    : 'Network enabled with local storage fallback'}
                </p>
              </div>
            </div>

            <button
              onClick={onToggleAirplane}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                isAirplaneSimulated
                  ? 'bg-amber-500 text-black font-bold'
                  : 'bg-white/10 text-white hover:bg-white/15'
              }`}
            >
              {isAirplaneSimulated ? 'Disable Flight Mode' : 'Simulate Offline'}
            </button>
          </div>

          {/* Storage Meter */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-white/80 font-medium">
                <HardDrive size={15} className="text-emerald-400" />
                Phone Offline Database Storage
              </span>
              <span className="text-emerald-300 font-mono font-bold">{totalMB} MB</span>
            </div>
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(10, localImported.length * 15))}%` }}
              />
            </div>
            <p className="text-[11px] text-white/50">
              {offlineTracks.length} tracks available offline (including {localImported.length} imported from your phone files)
            </p>
          </div>

          {/* Offline Tracks List */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider">
              Offline-Ready Tracks &amp; Sermons ({offlineTracks.length})
            </h4>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {offlineTracks.map((track) => (
                <div
                  key={track.id}
                  className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 flex items-center justify-between text-xs transition-colors"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                    <div className="truncate">
                      <p className="text-white font-medium truncate">{track.title}</p>
                      <p className="text-[10px] text-white/50">
                        {track.artist} &bull; {track.category.replace('_', ' ').toUpperCase()}
                      </p>
                    </div>
                  </div>

                  {track.isLocal && (
                    <button
                      onClick={() => onDeleteLocalTrack(track.id)}
                      className="p-1.5 text-white/40 hover:text-rose-400 rounded transition-colors"
                      title="Delete from phone database"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-end bg-black/30">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
