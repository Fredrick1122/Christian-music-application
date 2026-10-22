import React, { useState } from 'react';
import { Track } from '../types';
import { Play, Pause, SkipForward, SkipBack, X, Maximize2, Moon, Sparkles, Volume2 } from 'lucide-react';

interface FloatingMusicWidgetProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onOpenPlayer: () => void;
  onOpenSleepTimer: () => void;
  remainingSleepSeconds: number | null;
  lowBatteryMode: boolean;
}

export const FloatingMusicWidget: React.FC<FloatingMusicWidgetProps> = ({
  currentTrack,
  isPlaying,
  onPlayPause,
  onNext,
  onPrev,
  onOpenPlayer,
  onOpenSleepTimer,
  remainingSleepSeconds,
  lowBatteryMode,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  if (!currentTrack || !isVisible) return null;

  return (
    <div
      className={`fixed bottom-24 right-4 z-40 transition-all duration-300 ${
        isMinimized ? 'w-auto' : 'w-72 sm:w-80'
      }`}
    >
      <div className="bg-[#0b0e17]/95 border border-amber-500/30 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl text-white relative overflow-hidden group">
        {/* Subtle accent glow */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/20 rounded-full blur-xl pointer-events-none" />

        {/* Top bar with widget controls */}
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/10">
          <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-amber-400">
            <Sparkles size={11} />
            <span>Kadosh Motion Widget</span>
          </div>

          <div className="flex items-center gap-1">
            {remainingSleepSeconds !== null && (
              <span className="flex items-center gap-1 text-[10px] text-indigo-300 bg-indigo-500/20 px-1.5 py-0.5 rounded">
                <Moon size={9} />
                {Math.ceil(remainingSleepSeconds / 60)}m
              </span>
            )}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 text-white/50 hover:text-white rounded hover:bg-white/10 transition-colors"
              title={isMinimized ? 'Expand Widget' : 'Minimize Widget'}
            >
              <Maximize2 size={12} />
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 text-white/50 hover:text-rose-400 rounded hover:bg-white/10 transition-colors"
              title="Close Widget"
            >
              <X size={12} />
            </button>
          </div>
        </div>

        {/* Widget Content */}
        {!isMinimized ? (
          <div>
            <div className="flex items-center gap-3 mb-2.5">
              <div
                onClick={onOpenPlayer}
                className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-700 flex items-center justify-center shrink-0 cursor-pointer shadow-md overflow-hidden relative"
              >
                <Volume2 size={18} className="text-black" />
                {isPlaying && !lowBatteryMode && (
                  <span className="absolute inset-0 border border-white/60 animate-ping opacity-25 rounded-xl" />
                )}
              </div>

              <div className="overflow-hidden flex-1 cursor-pointer" onClick={onOpenPlayer}>
                <p className="text-xs font-semibold text-white truncate hover:text-amber-400 transition-colors">
                  {currentTrack.title}
                </p>
                <p className="text-[11px] text-white/60 truncate">{currentTrack.artist}</p>
              </div>
            </div>

            {/* Mini soundwave motion visualizer bar */}
            <div className="flex items-end justify-between h-4 gap-1 px-1 mb-3">
              {[...Array(16)].map((_, i) => (
                <div
                  key={i}
                  className="flex-1 bg-amber-400 rounded-full transition-all duration-150"
                  style={{
                    height: isPlaying
                      ? `${Math.max(20, Math.sin(i * 0.8 + Date.now() * 0.005) * 80 + 30)}%`
                      : '20%',
                    opacity: isPlaying ? 0.9 : 0.3,
                  }}
                />
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={onOpenSleepTimer}
                className="p-1.5 text-white/60 hover:text-indigo-300 rounded-lg hover:bg-white/5 transition-colors text-[11px] flex items-center gap-1"
                title="Sleep Timer"
              >
                <Moon size={13} />
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={onPrev}
                  className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  <SkipBack size={15} />
                </button>

                <button
                  onClick={onPlayPause}
                  className="w-8 h-8 rounded-full bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center font-bold shadow-md shadow-amber-500/20 transition-all"
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                </button>

                <button
                  onClick={onNext}
                  className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  <SkipForward size={15} />
                </button>
              </div>

              <button
                onClick={onOpenPlayer}
                className="text-[11px] text-amber-400 hover:underline px-1 py-0.5 font-medium"
              >
                Full View
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={onPlayPause}
              className="w-7 h-7 rounded-full bg-amber-500 text-black flex items-center justify-center text-xs"
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
            </button>
            <p className="text-xs text-white truncate max-w-[140px] font-medium" onClick={onOpenPlayer}>
              {currentTrack.title}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
