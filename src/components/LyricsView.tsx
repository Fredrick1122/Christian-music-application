import React, { useEffect, useRef, useState } from 'react';
import { LyricLine, Track } from '../types';
import {
  Mic,
  Music2,
  Sparkles,
  Type,
  ChevronDown,
  Copy,
  Check,
  RotateCcw,
  Volume2,
  Flame,
  HeartHandshake,
} from 'lucide-react';

interface LyricsViewProps {
  currentTrack: Track | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek: (seconds: number) => void;
  accentColor?: string;
  lowBatteryMode?: boolean;
}

export const LyricsView: React.FC<LyricsViewProps> = ({
  currentTrack,
  currentTime,
  duration,
  isPlaying,
  onSeek,
  accentColor = '#F59E0B',
  lowBatteryMode = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [userScrolled, setUserScrolled] = useState(false);
  const [copied, setCopied] = useState(false);
  const scrollTimeoutRef = useRef<any>(null);

  const lyrics: LyricLine[] = currentTrack?.lyrics || [];

  // Determine current active lyric index
  let activeIndex = -1;
  for (let i = 0; i < lyrics.length; i++) {
    if (currentTime >= lyrics[i].time) {
      if (i === lyrics.length - 1 || currentTime < lyrics[i + 1].time) {
        activeIndex = i;
        break;
      }
    }
  }

  // Auto-scroll to active lyric if not paused by manual user scroll
  useEffect(() => {
    if (!userScrolled && activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex, userScrolled]);

  // Handle manual scroll detection
  const handleScroll = () => {
    setUserScrolled(true);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    // After 6 seconds of inactivity, resume auto-scroll
    scrollTimeoutRef.current = setTimeout(() => {
      setUserScrolled(false);
    }, 6000);
  };

  const handleCopyLyrics = async () => {
    if (!lyrics.length) return;
    const fullText = lyrics.map((l) => l.text).join('\n');
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const formatLyricTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const getSectionBadgeClass = (section?: LyricLine['section']) => {
    switch (section) {
      case 'chorus':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'bridge':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'chant':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'spontaneous':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'refrain':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default:
        return 'bg-white/10 text-white/70 border-white/20';
    }
  };

  // Font size styling
  const getLineFontSize = (isActive: boolean) => {
    if (fontSize === 'lg') {
      return isActive
        ? 'text-2xl sm:text-3xl font-extrabold leading-snug'
        : 'text-xl sm:text-2xl font-medium leading-relaxed';
    }
    if (fontSize === 'sm') {
      return isActive
        ? 'text-base sm:text-lg font-extrabold leading-normal'
        : 'text-sm sm:text-base font-normal leading-normal';
    }
    // Default md
    return isActive
      ? 'text-xl sm:text-2xl font-black leading-snug'
      : 'text-base sm:text-lg font-medium leading-relaxed';
  };

  if (!currentTrack) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-white/50">
        <Music2 size={36} className="mb-2 opacity-40" />
        <p className="text-sm font-medium">Select a worship or praise song to view real-time synchronized lyrics</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col bg-[#080b16]/70 rounded-3xl border border-white/10 backdrop-blur-xl overflow-hidden shadow-2xl">
      {/* Top Controls Toolbar */}
      <div className="p-4 border-b border-white/10 bg-black/40 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
            <Mic size={16} />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              Synchronized Worship Lyrics
              {isPlaying && (
                <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  Live Sync
                </span>
              )}
            </h3>
            <p className="text-[11px] text-white/50 truncate max-w-xs sm:max-w-md">
              {currentTrack.title} &bull; {currentTrack.artist}
            </p>
          </div>
        </div>

        {/* Toolbar buttons: Font Size, Resume Auto-scroll, Copy */}
        <div className="flex items-center gap-1.5">
          {userScrolled && (
            <button
              onClick={() => setUserScrolled(false)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold border border-amber-500/40 transition-all cursor-pointer animate-fade-in"
              title="Return to currently playing line"
            >
              <RotateCcw size={12} />
              <span className="hidden sm:inline">Sync View</span>
            </button>
          )}

          {/* Font Size Toggle */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setFontSize('sm')}
              className={`px-2 py-1 rounded font-bold transition-colors ${
                fontSize === 'sm' ? 'bg-amber-500 text-black' : 'text-white/60 hover:text-white'
              }`}
              title="Small font"
            >
              A
            </button>
            <button
              onClick={() => setFontSize('md')}
              className={`px-2 py-1 rounded font-bold transition-colors ${
                fontSize === 'md' ? 'bg-amber-500 text-black' : 'text-white/60 hover:text-white'
              }`}
              title="Medium font"
            >
              A+
            </button>
            <button
              onClick={() => setFontSize('lg')}
              className={`px-2 py-1 rounded font-bold transition-colors ${
                fontSize === 'lg' ? 'bg-amber-500 text-black' : 'text-white/60 hover:text-white'
              }`}
              title="Large font"
            >
              A++
            </button>
          </div>

          {/* Copy Lyrics */}
          <button
            onClick={handleCopyLyrics}
            className="p-1.5 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors cursor-pointer"
            title="Copy all lyrics"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* Main Synchronized Lyrics Scroll Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 sm:px-12 py-16 space-y-7 scroll-smooth relative"
      >
        {lyrics.length > 0 ? (
          lyrics.map((line, idx) => {
            const isActive = idx === activeIndex;
            const isPast = idx < activeIndex;
            const isNext = idx === activeIndex + 1;

            return (
              <div
                key={idx}
                ref={isActive ? activeLineRef : null}
                onClick={() => {
                  onSeek(line.time);
                  setUserScrolled(false);
                }}
                className={`group transition-all duration-300 rounded-2xl p-3 sm:p-4 cursor-pointer select-none relative ${
                  isActive
                    ? 'bg-amber-500/15 border border-amber-500/40 shadow-xl shadow-amber-500/10 scale-[1.02]'
                    : isPast
                    ? 'opacity-40 hover:opacity-80 hover:bg-white/5'
                    : 'opacity-65 hover:opacity-100 hover:bg-white/5'
                }`}
              >
                {/* Section Tag if start of a new section */}
                {line.section && (idx === 0 || lyrics[idx - 1].section !== line.section) && (
                  <div className="mb-2">
                    <span
                      className={`inline-block text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full border ${getSectionBadgeClass(
                        line.section
                      )}`}
                    >
                      {line.section}
                    </span>
                  </div>
                )}

                <div className="flex items-baseline justify-between gap-4">
                  <p
                    className={`transition-all duration-300 ${getLineFontSize(isActive)} ${
                      isActive
                        ? 'text-amber-300 drop-shadow-[0_0_16px_rgba(245,158,11,0.5)]'
                        : isPast
                        ? 'text-white/60'
                        : 'text-white/90'
                    }`}
                  >
                    {line.text}
                  </p>

                  {/* Timestamp seek hint */}
                  <span
                    className={`text-[11px] font-mono shrink-0 transition-opacity ${
                      isActive
                        ? 'text-amber-400 font-bold opacity-100'
                        : 'text-white/30 opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {formatLyricTime(line.time)}
                  </span>
                </div>

                {/* Optional translation or spiritual note */}
                {line.translation && (
                  <p className="text-xs text-white/50 italic mt-1 font-sans">
                    {line.translation}
                  </p>
                )}

                {/* Sing-along active line accent bar */}
                {isActive && isPlaying && !lowBatteryMode && (
                  <div className="mt-2.5 h-1 w-full bg-black/40 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 animate-pulse rounded-full"
                      style={{
                        width: '100%',
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })
        ) : (
          /* Empty / Sermon state */
          <div className="flex flex-col items-center justify-center h-full text-center py-16 space-y-4 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Sparkles size={28} />
            </div>

            <div>
              <h4 className="text-lg font-bold text-white mb-1">
                {currentTrack.category === 'preaching' || currentTrack.category === 'camp_messages'
                  ? 'Sermon Teaching Transcript & Scripture'
                  : 'Spiritual Song Devotional'}
              </h4>
              <p className="text-xs text-white/60 leading-relaxed">
                {currentTrack.notes ||
                  'Listen intently to the spoken word and the ministering of the Holy Spirit.'}
              </p>
            </div>

            {currentTrack.keyScripture && (
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-xs text-amber-300 italic w-full">
                "{currentTrack.keyScripture}"
              </div>
            )}

            <p className="text-[11px] text-white/40">
              Tip: You can import custom worship songs with lyrics from your phone storage anytime.
            </p>
          </div>
        )}
      </div>

      {/* Bottom status bar */}
      <div className="px-6 py-2.5 bg-black/50 border-t border-white/10 flex items-center justify-between text-[11px] text-white/50">
        <span className="flex items-center gap-1.5">
          <Volume2 size={13} className="text-amber-400" />
          Tap any lyric line to jump playback directly to that verse
        </span>
        <span className="font-mono text-white/70">
          Line {activeIndex >= 0 ? activeIndex + 1 : 0} of {lyrics.length}
        </span>
      </div>
    </div>
  );
};
