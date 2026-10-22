import React from 'react';
import { Track } from '../types';
import { LyricsView } from './LyricsView';
import { X, Mic } from 'lucide-react';

interface LyricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek: (seconds: number) => void;
  lowBatteryMode: boolean;
  accentColor?: string;
}

export const LyricsModal: React.FC<LyricsModalProps> = ({
  isOpen,
  onClose,
  currentTrack,
  currentTime,
  duration,
  isPlaying,
  onSeek,
  lowBatteryMode,
  accentColor = '#F59E0B',
}) => {
  if (!isOpen || !currentTrack) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6">
      <div className="bg-[#0b0e1a] border border-white/15 rounded-3xl w-full max-w-3xl h-[85vh] flex flex-col shadow-2xl relative overflow-hidden">
        {/* Modal close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-white/50 hover:text-white rounded-full bg-black/40 hover:bg-black/60 border border-white/10 transition-colors"
          title="Close Lyrics View"
        >
          <X size={18} />
        </button>

        <div className="flex-1 overflow-hidden p-2">
          <LyricsView
            currentTrack={currentTrack}
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            onSeek={onSeek}
            accentColor={accentColor}
            lowBatteryMode={lowBatteryMode}
          />
        </div>
      </div>
    </div>
  );
};
