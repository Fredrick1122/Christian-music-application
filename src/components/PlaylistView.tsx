import React, { useState } from 'react';
import { PlaylistCategory, PlaylistInfo, Track } from '../types';
import { PLAYLIST_CATEGORIES } from '../data/initialCatalog';
import { MotionVisualizer } from './MotionVisualizer';
import {
  Play,
  Pause,
  Clock,
  Sparkles,
  Flame,
  HeartHandshake,
  PartyPopper,
  BookOpen,
  Tent,
  Search,
  CheckCircle2,
  Share2,
  FolderPlus,
  Volume2,
  HardDrive,
  Mic,
} from 'lucide-react';

interface PlaylistViewProps {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  activeCategory: PlaylistCategory | 'all';
  onSelectCategory: (cat: PlaylistCategory | 'all') => void;
  onPlayTrack: (track: Track) => void;
  onOpenShare: (track: Track) => void;
  onOpenFileImport: () => void;
  onOpenLyrics?: (track: Track) => void;
  lowBatteryMode: boolean;
  spiritualDevotional?: { insight: string; scripture: string } | null;
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({
  tracks,
  currentTrack,
  isPlaying,
  activeCategory,
  onSelectCategory,
  onPlayTrack,
  onOpenShare,
  onOpenFileImport,
  onOpenLyrics,
  lowBatteryMode,
  spiritualDevotional,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOfflineOnly, setFilterOfflineOnly] = useState(false);

  // Icon mapping
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles size={16} />;
      case 'Flame':
        return <Flame size={16} />;
      case 'HeartHandshake':
        return <HeartHandshake size={16} />;
      case 'PartyPopper':
        return <PartyPopper size={16} />;
      case 'BookOpen':
        return <BookOpen size={16} />;
      case 'Tent':
        return <Tent size={16} />;
      default:
        return <Sparkles size={16} />;
    }
  };

  const currentCategoryInfo = PLAYLIST_CATEGORIES.find((c) => c.id === activeCategory);

  // Filter tracks
  const filteredTracks = tracks.filter((track) => {
    if (activeCategory !== 'all' && track.category !== activeCategory) {
      return false;
    }
    if (filterOfflineOnly && !track.isOfflineAvailable && !track.isLocal) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = track.title.toLowerCase().includes(q);
      const matchArtist = track.artist.toLowerCase().includes(q);
      const matchSpeaker = track.speaker?.toLowerCase().includes(q);
      const matchTags = track.tags?.some((t) => t.toLowerCase().includes(q));
      return matchTitle || matchArtist || matchSpeaker || matchTags;
    }
    return true;
  });

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const rem = mins % 60;
      return `${hrs}h ${rem}m`;
    }
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Category Pills Navigation */}
      <div className="overflow-x-auto pb-2 scrollbar-none">
        <div className="flex items-center gap-2 min-w-max">
          <button
            onClick={() => onSelectCategory('all')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
              activeCategory === 'all'
                ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/20'
                : 'bg-white/5 text-white/70 hover:text-white border-white/10 hover:bg-white/10'
            }`}
          >
            <span>All Library</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/30 text-white">
              {tracks.length}
            </span>
          </button>

          {PLAYLIST_CATEGORIES.map((cat) => {
            const count = tracks.filter((t) => t.category === cat.id).length;
            const isSelected = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/20'
                    : 'bg-white/5 text-white/70 hover:text-white border-white/10 hover:bg-white/10'
                }`}
              >
                <span className={isSelected ? 'text-black' : 'text-amber-400'}>
                  {getCategoryIcon(cat.iconName)}
                </span>
                <span>{cat.name}</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/20 text-white/80">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Playlist Hero Banner with Real-time Soundwave Visualizer */}
      <div className="relative rounded-3xl overflow-hidden border border-white/15 bg-gradient-to-br from-[#13192f] via-[#0d1222] to-[#080b16] p-6 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Sparkles size={12} />
              <span>
                {currentCategoryInfo ? currentCategoryInfo.subtitle : 'Complete Christian Spiritual Archive'}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {currentCategoryInfo ? currentCategoryInfo.name : 'All Christian Songs & Messages'}
            </h2>

            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
              {currentCategoryInfo
                ? currentCategoryInfo.description
                : 'Stream high-fidelity Dancing Stars praise beats, midnight prayer chants, sacred worship, and Bishop Dag Heward-Mills & Bishop Joshua Heward-Mills preaching messages with real-time motion sound waves.'}
            </p>

            {/* Quick Actions */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              {filteredTracks.length > 0 && (
                <button
                  onClick={() => onPlayTrack(filteredTracks[0])}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <Play size={15} fill="currentColor" />
                  Play Category ({filteredTracks.length} Tracks)
                </button>
              )}

              <button
                onClick={onOpenFileImport}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl text-xs flex items-center gap-2 border border-white/10 transition-colors cursor-pointer"
              >
                <FolderPlus size={15} className="text-amber-400" />
                Add Phone Audio
              </button>
            </div>
          </div>

          {/* Integrated Motion Soundwave Display */}
          <div className="w-full md:w-80 h-32 rounded-2xl bg-black/40 border border-white/10 overflow-hidden relative shadow-inner">
            <MotionVisualizer
              isPlaying={isPlaying}
              lowBatteryMode={lowBatteryMode}
              accentColor={currentCategoryInfo ? currentCategoryInfo.accentColor : '#F59E0B'}
              height={128}
              mode="waves"
            />
            <div className="absolute bottom-2 left-3 text-[10px] text-white/60 font-mono flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-amber-400 animate-pulse' : 'bg-white/40'}`} />
              {isPlaying ? 'Real-time Soundwave' : 'Waveform Standby'}
            </div>
          </div>
        </div>

        {/* AI Spiritual Reflection / Devotional card */}
        {spiritualDevotional && (
          <div className="mt-4 pt-4 border-t border-white/10 flex items-start gap-3 text-xs bg-amber-500/5 -mx-6 -mb-6 p-4">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 shrink-0">
              <BookOpen size={16} />
            </div>
            <div>
              <p className="font-semibold text-amber-200">{spiritualDevotional.insight}</p>
              <p className="text-[11px] text-white/60 italic mt-0.5">{spiritualDevotional.scripture}</p>
            </div>
          </div>
        )}
      </div>

      {/* Search Bar & Offline Filter Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title, preacher, chant, or lyrics..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer bg-white/5 px-3 py-2 rounded-xl border border-white/10 hover:bg-white/10">
            <input
              type="checkbox"
              checked={filterOfflineOnly}
              onChange={(e) => setFilterOfflineOnly(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-amber-500 focus:ring-0"
            />
            <HardDrive size={13} className="text-emerald-400" />
            <span>Offline Ready Only</span>
          </label>
        </div>
      </div>

      {/* Track List */}
      <div className="space-y-2">
        {filteredTracks.length > 0 ? (
          filteredTracks.map((track, idx) => {
            const isThisTrackPlaying = currentTrack?.id === track.id && isPlaying;
            const isThisTrackSelected = currentTrack?.id === track.id;

            return (
              <div
                key={track.id}
                onClick={() => onPlayTrack(track)}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 group cursor-pointer ${
                  isThisTrackSelected
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/5'
                    : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/5 hover:border-white/15'
                }`}
              >
                {/* Left: Index / Play Icon */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayTrack(track);
                    }}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform cursor-pointer ${
                      isThisTrackPlaying
                        ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                        : 'bg-white/10 text-white group-hover:bg-amber-500 group-hover:text-black'
                    }`}
                  >
                    {isThisTrackPlaying ? (
                      <Pause size={16} />
                    ) : (
                      <Play size={16} className="ml-0.5" />
                    )}
                  </button>

                  {/* Title & Metadata */}
                  <div className="truncate flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-xs sm:text-sm font-semibold truncate ${
                          isThisTrackSelected ? 'text-amber-400' : 'text-white'
                        }`}
                      >
                        {track.title}
                      </p>
                      {track.isLocal && (
                        <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-medium border border-emerald-500/30 shrink-0">
                          Phone File
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-white/50 truncate mt-0.5">
                      {track.artist}
                      {track.speaker && ` &bull; ${track.speaker}`}
                    </p>
                  </div>
                </div>

                {/* Right: Badges & Duration & Share */}
                <div className="flex items-center gap-3 shrink-0">
                  {/* Synchronized Lyrics indicator button */}
                  {track.lyrics && track.lyrics.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenLyrics) onOpenLyrics(track);
                        else onPlayTrack(track);
                      }}
                      className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-all cursor-pointer"
                      title="View Real-time Synchronized Lyrics"
                    >
                      <Mic size={10} className="text-amber-400" />
                      <span>Lyrics</span>
                    </button>
                  )}

                  {/* Category tag */}
                  <span className="hidden md:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-white/60 border border-white/10">
                    {track.category.replace('_', ' ')}
                  </span>

                  {/* Offline Badge */}
                  <div
                    className="flex items-center text-emerald-400 text-xs"
                    title="Available offline without internet"
                  >
                    <CheckCircle2 size={14} />
                  </div>

                  {/* Duration */}
                  <span className="text-xs font-mono text-white/50 w-12 text-right">
                    {formatDuration(track.duration)}
                  </span>

                  {/* Share button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenShare(track);
                    }}
                    className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                    title="Share song with friends"
                  >
                    <Share2 size={15} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center border border-dashed border-white/15 rounded-3xl bg-white/[0.02]">
            <p className="text-sm font-medium text-white">No tracks match your query</p>
            <p className="text-xs text-white/50 mt-1">Try another search term or import phone files</p>
          </div>
        )}
      </div>
    </div>
  );
};
