import React, { useState } from 'react';
import { Track, VisualizerMode } from '../types';
import { MotionVisualizer } from './MotionVisualizer';
import { LyricsView } from './LyricsView';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Share2,
  Sliders,
  Moon,
  Heart,
  Repeat,
  Shuffle,
  BookOpen,
  Sparkles,
  Mic,
  Music2,
  Columns,
} from 'lucide-react';

interface PlayerBarProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  lowBatteryMode: boolean;
  accentColor?: string;
  onPlayPause: () => void;
  onSeek: (seconds: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onVolumeChange: (vol: number) => void;
  onOpenEqualizer: () => void;
  onOpenSleepTimer: () => void;
  onOpenShare: () => void;
  onOpenLyrics?: () => void;
  remainingSleepSeconds: number | null;
}

export const PlayerBar: React.FC<PlayerBarProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  playbackRate,
  lowBatteryMode,
  accentColor = '#F59E0B',
  onPlayPause,
  onSeek,
  onNext,
  onPrev,
  onVolumeChange,
  onOpenEqualizer,
  onOpenSleepTimer,
  onOpenShare,
  onOpenLyrics,
  remainingSleepSeconds,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedMode, setExpandedMode] = useState<'visualizer' | 'lyrics' | 'split'>('lyrics');
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('waves');

  if (!currentTrack) return null;

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hrs}:${remMins < 10 ? '0' : ''}${remMins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleMuteToggle = () => {
    if (isMuted) {
      setIsMuted(false);
      onVolumeChange(prevVolume || 0.8);
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
      onVolumeChange(0);
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Expanded Immersive Full-Screen Player View */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-[#070913] text-white flex flex-col justify-between overflow-hidden">
          {/* Top Bar with Mode Switcher */}
          <div className="p-4 sm:p-5 flex items-center justify-between border-b border-white/10 z-10 bg-black/40 backdrop-blur-md">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
                <button
                  onClick={() => setExpandedMode('lyrics')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    expandedMode === 'lyrics'
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <Mic size={13} />
                  <span>Live Lyrics</span>
                </button>

                <button
                  onClick={() => setExpandedMode('visualizer')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    expandedMode === 'visualizer'
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <Sparkles size={13} />
                  <span>Motion Visualizer</span>
                </button>

                <button
                  onClick={() => setExpandedMode('split')}
                  className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    expandedMode === 'split'
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <Columns size={13} />
                  <span>Dual Sanctuary</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={onOpenShare}
                className="p-2 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
                title="Share track"
              >
                <Share2 size={18} />
              </button>
              <button
                onClick={onOpenEqualizer}
                className="p-2 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
                title="Equalizer"
              >
                <Sliders size={18} />
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 text-white/70 hover:text-white rounded-xl hover:bg-white/10 cursor-pointer"
                title="Minimize player"
              >
                <Minimize2 size={20} />
              </button>
            </div>
          </div>

          {/* Immersive Center Area */}
          <div className="flex-1 overflow-hidden p-4 sm:p-6 max-w-6xl mx-auto w-full flex flex-col justify-center">
            {/* 1. Synced Lyrics Mode */}
            {expandedMode === 'lyrics' && (
              <div className="w-full h-full max-h-[62vh] flex flex-col">
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
            )}

            {/* 2. Visualizer Mode */}
            {expandedMode === 'visualizer' && (
              <div className="flex flex-col items-center justify-center max-w-4xl mx-auto w-full">
                <div className="w-full h-64 md:h-80 relative rounded-3xl overflow-hidden bg-black/40 border border-white/10 shadow-2xl mb-6">
                  <MotionVisualizer
                    isPlaying={isPlaying}
                    lowBatteryMode={lowBatteryMode}
                    accentColor={accentColor}
                    category={currentTrack.category}
                    mode={visualizerMode}
                    onModeChange={setVisualizerMode}
                    immersive={true}
                  />
                </div>

                <div className="text-center space-y-2 mb-6">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {currentTrack.category.replace('_', ' ')}
                  </span>
                  <h2 className="text-2xl md:text-3xl font-black text-white">{currentTrack.title}</h2>
                  <p className="text-sm md:text-base text-white/70 font-medium">
                    {currentTrack.artist} {currentTrack.speaker && `&bull; ${currentTrack.speaker}`}
                  </p>
                </div>

                {(currentTrack.keyScripture || currentTrack.notes) && (
                  <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-center max-w-2xl backdrop-blur-md">
                    {currentTrack.keyScripture && (
                      <p className="text-xs md:text-sm italic text-amber-300 mb-1">
                        "{currentTrack.keyScripture}"
                      </p>
                    )}
                    {currentTrack.notes && (
                      <p className="text-[11px] text-white/50">{currentTrack.notes}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 3. Dual Split Mode (Side by side on larger viewports) */}
            {expandedMode === 'split' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full max-h-[62vh] items-stretch">
                <div className="flex flex-col justify-between bg-black/40 border border-white/10 rounded-3xl p-5 overflow-hidden">
                  <div className="w-full h-48 rounded-2xl overflow-hidden bg-black/50 border border-white/5 mb-4">
                    <MotionVisualizer
                      isPlaying={isPlaying}
                      lowBatteryMode={lowBatteryMode}
                      accentColor={accentColor}
                      category={currentTrack.category}
                      mode={visualizerMode}
                      onModeChange={setVisualizerMode}
                      immersive={true}
                    />
                  </div>

                  <div className="space-y-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {currentTrack.category.replace('_', ' ')}
                    </span>
                    <h3 className="text-lg font-bold text-white truncate">{currentTrack.title}</h3>
                    <p className="text-xs text-white/70">{currentTrack.artist}</p>
                    {currentTrack.keyScripture && (
                      <p className="text-xs italic text-amber-300/80 bg-white/5 p-2.5 rounded-xl border border-white/5 line-clamp-3">
                        "{currentTrack.keyScripture}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="h-full overflow-hidden flex flex-col">
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
            )}
          </div>

          {/* Expanded Bottom Controls */}
          <div className="p-6 border-t border-white/10 bg-black/50 backdrop-blur-xl">
            <div className="max-w-3xl mx-auto space-y-4">
              {/* Progress Slider */}
              <div className="space-y-1">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={(e) => onSeek(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <div className="flex justify-between text-xs font-mono text-white/50">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Large Buttons */}
              <div className="flex items-center justify-center gap-6">
                <button
                  onClick={onPrev}
                  className="p-3 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <SkipBack size={26} />
                </button>
                <button
                  onClick={onPlayPause}
                  className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black flex items-center justify-center shadow-lg shadow-amber-500/30 transition-transform active:scale-95 cursor-pointer"
                >
                  {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
                </button>
                <button
                  onClick={onNext}
                  className="p-3 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <SkipForward size={26} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Player Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#090c16]/95 backdrop-blur-2xl border-t border-white/10 shadow-2xl">
        {/* Top edge progress bar */}
        <div
          className="h-1 bg-white/10 w-full cursor-pointer relative group"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const pct = clickX / rect.width;
            onSeek(pct * duration);
          }}
        >
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-150"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Left: Track Information */}
          <div className="flex items-center gap-3 overflow-hidden min-w-0 max-w-xs sm:max-w-sm">
            <div
              onClick={() => setIsExpanded(true)}
              className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-600 to-amber-700 flex items-center justify-center text-black font-black text-xs shrink-0 cursor-pointer shadow-md overflow-hidden relative group"
            >
              <Sparkles size={20} className="text-black group-hover:scale-110 transition-transform" />
              {isPlaying && !lowBatteryMode && (
                <div className="absolute inset-0 border border-white/40 animate-ping opacity-25 rounded-xl" />
              )}
            </div>

            <div className="overflow-hidden min-w-0 cursor-pointer" onClick={() => setIsExpanded(true)}>
              <p className="text-xs sm:text-sm font-bold text-white truncate hover:text-amber-400 transition-colors">
                {currentTrack.title}
              </p>
              <p className="text-[11px] text-white/60 truncate">
                {currentTrack.artist} &bull; <span className="text-amber-400/90 font-medium">{currentTrack.category.replace('_', ' ')}</span>
              </p>
            </div>
          </div>

          {/* Center: Playback Controls & Wave preview */}
          <div className="flex flex-col items-center gap-1.5 flex-1 max-w-md">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={onPrev}
                className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title="Previous track"
              >
                <SkipBack size={18} />
              </button>

              <button
                onClick={onPlayPause}
                className="w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
              </button>

              <button
                onClick={onNext}
                className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title="Next track"
              >
                <SkipForward size={18} />
              </button>

              {playbackRate !== 1.0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                  {playbackRate}x
                </span>
              )}
            </div>

            {/* Time progress indicators */}
            <div className="hidden sm:flex items-center gap-2 w-full text-[11px] text-white/50 font-mono">
              <span className="w-10 text-right">{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(e) => onSeek(parseFloat(e.target.value))}
                className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <span className="w-10">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right: Tools & Utilities */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {remainingSleepSeconds !== null && (
              <button
                onClick={onOpenSleepTimer}
                className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-2 py-1 rounded-lg"
              >
                <Moon size={11} />
                {Math.ceil(remainingSleepSeconds / 60)}m
              </button>
            )}

            {/* Synchronized Lyrics button */}
            <button
              onClick={() => {
                setExpandedMode('lyrics');
                setIsExpanded(true);
                if (onOpenLyrics) onOpenLyrics();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                currentTrack.lyrics && currentTrack.lyrics.length > 0
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-300 shadow-sm'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70'
              }`}
              title="Open Real-time Synchronized Lyrics"
            >
              <Mic size={14} className={currentTrack.lyrics?.length ? 'animate-pulse text-amber-400' : ''} />
              <span className="hidden sm:inline text-xs font-semibold">Lyrics</span>
              {currentTrack.lyrics && currentTrack.lyrics.length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              )}
            </button>

            <button
              onClick={onOpenEqualizer}
              className="p-2 text-white/70 hover:text-white rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
              title="Equalizer & Clarity"
            >
              <Sliders size={16} />
            </button>

            <button
              onClick={onOpenShare}
              className="p-2 text-white/70 hover:text-white rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
              title="Share with friends"
            >
              <Share2 size={16} />
            </button>

            {/* Volume slider */}
            <div className="hidden md:flex items-center gap-1.5">
              <button
                onClick={handleMuteToggle}
                className="p-2 text-white/70 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
              >
                {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={isMuted ? 0 : volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="w-18 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>

            <button
              onClick={() => setIsExpanded(true)}
              className="p-2 text-amber-400 hover:text-amber-300 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
              title="Expand Full Motion Sanctuary"
            >
              <Maximize2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
