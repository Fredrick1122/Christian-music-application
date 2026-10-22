/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { audioEngine } from './services/audioEngine';
import { storageService } from './services/storageService';
import { VoiceAssistantResult } from './services/voiceAssistant';
import { AppTheme, EqualizerBands, PlaylistCategory, Track } from './types';
import { INITIAL_TRACKS, PLAYLIST_CATEGORIES } from './data/initialCatalog';

// Components
import { Navbar } from './components/Navbar';
import { PlaylistView } from './components/PlaylistView';
import { PlayerBar } from './components/PlayerBar';
import { FloatingMusicWidget } from './components/FloatingMusicWidget';
import { FileImportModal } from './components/FileImportModal';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { SleepTimerModal } from './components/SleepTimerModal';
import { EqualizerModal } from './components/EqualizerModal';
import { SecurityPanel } from './components/SecurityPanel';
import { SocialShareModal } from './components/SocialShareModal';
import { OfflineManagerModal } from './components/OfflineManagerModal';
import { LockScreen } from './components/LockScreen';
import { LyricsModal } from './components/LyricsModal';

export default function App() {
  // Library & Playback State
  const [allTracks, setAllTracks] = useState<Track[]>(INITIAL_TRACKS);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(INITIAL_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(INITIAL_TRACKS[0].duration);
  const [volume, setVolume] = useState<number>(0.85);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [activeCategory, setActiveCategory] = useState<PlaylistCategory | 'all'>('all');

  // Equalizer State
  const [eqBands, setEqBands] = useState<EqualizerBands>({
    subBass: 0,
    bass: 0,
    mid: 0,
    presence: 0,
    treble: 0,
  });

  // Power & Environment Settings
  const [lowBatteryMode, setLowBatteryMode] = useState<boolean>(false);
  const [isAirplaneSimulated, setIsAirplaneSimulated] = useState<boolean>(false);
  const [theme, setTheme] = useState<AppTheme>('dark_midnight');

  // Sleep Timer State
  const [sleepRemainingSeconds, setSleepRemainingSeconds] = useState<number | null>(null);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [sleepTimerFadeOut, setSleepTimerFadeOut] = useState<boolean>(true);
  const sleepTimerIntervalRef = useRef<any>(null);

  // Modals & Panels State
  const [isFileImportOpen, setIsFileImportOpen] = useState(false);
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);
  const [isSleepTimerOpen, setIsSleepTimerOpen] = useState(false);
  const [isEqualizerOpen, setIsEqualizerOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isOfflineManagerOpen, setIsOfflineManagerOpen] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [shareTrack, setShareTrack] = useState<Track | null>(null);

  // Security Lock
  const [isAppLocked, setIsAppLocked] = useState(false);
  const [spiritualDevotional, setSpiritualDevotional] = useState<{ insight: string; scripture: string } | null>(null);

  // Initialize Library from IndexedDB
  useEffect(() => {
    storageService.getAllTracks().then((tracks) => {
      if (tracks && tracks.length > 0) {
        setAllTracks(tracks);
      }
    });

    const sec = storageService.getSecuritySettings();
    if (sec.requirePinOnOpen) {
      setIsAppLocked(true);
    }

    // Check battery level if available in browser
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        if (battery.level < 0.2 && !battery.charging) {
          setLowBatteryMode(true);
        }
      });
    }

    storageService.logAudit('APP_LAUNCH', 'Kadosh Motion Music player initialized', 'info');
  }, []);

  // Audio Engine Observers
  useEffect(() => {
    const unsubTime = audioEngine.onTimeUpdate((time, dur) => {
      setCurrentTime(time);
      if (dur > 0) setDuration(dur);
    });

    const unsubState = audioEngine.onStateChange((playing) => {
      setIsPlaying(playing);
    });

    const unsubEnded = audioEngine.onEnded(() => {
      handleNextTrack();
    });

    return () => {
      unsubTime();
      unsubState();
      unsubEnded();
    };
  }, [allTracks, currentTrack, activeCategory]);

  // Sleep Timer Countdown Loop
  useEffect(() => {
    if (sleepRemainingSeconds === null) {
      if (sleepTimerIntervalRef.current) {
        clearInterval(sleepTimerIntervalRef.current);
        sleepTimerIntervalRef.current = null;
      }
      return;
    }

    if (sleepRemainingSeconds <= 0) {
      // Time is up! Stop audio with fade
      if (sleepTimerFadeOut) {
        audioEngine.fadeOutAndStop(5);
      } else {
        audioEngine.pause();
      }
      setSleepRemainingSeconds(null);
      setSleepTimerMinutes(null);
      storageService.logAudit('SLEEP_TIMER_TRIGGERED', 'Playback stopped by sleep timer', 'info');
      return;
    }

    sleepTimerIntervalRef.current = setInterval(() => {
      setSleepRemainingSeconds((prev) => {
        if (prev === null || prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (sleepTimerIntervalRef.current) {
        clearInterval(sleepTimerIntervalRef.current);
      }
    };
  }, [sleepRemainingSeconds, sleepTimerFadeOut]);

  // Play a track
  const handlePlayTrack = async (track: Track) => {
    setCurrentTrack(track);
    setDuration(track.duration);

    let blob: Blob | null = null;
    if (track.isLocal) {
      blob = await storageService.getAudioBlob(track.id);
    }

    await audioEngine.playTrack(track, blob);
    storageService.logAudit('PLAYBACK_STARTED', `Listening to: ${track.title} [${track.artist}]`, 'info');

    // Fetch inspirational thought
    fetchSpiritualThought(track);
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      audioEngine.pause();
    } else {
      audioEngine.resume();
    }
  };

  const handleSeek = (seconds: number) => {
    audioEngine.seek(seconds);
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    audioEngine.setVolume(vol);
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    audioEngine.setPlaybackRate(rate);
  };

  const handleEqualizerChange = (bands: EqualizerBands) => {
    setEqBands(bands);
    audioEngine.setEqualizer(bands);
  };

  // Skip Next / Prev
  const getQueue = () => {
    if (activeCategory === 'all') return allTracks;
    return allTracks.filter((t) => t.category === activeCategory);
  };

  const handleNextTrack = () => {
    const queue = getQueue();
    if (queue.length === 0) return;
    const currentIdx = queue.findIndex((t) => t.id === currentTrack?.id);
    const nextIdx = (currentIdx + 1) % queue.length;
    handlePlayTrack(queue[nextIdx]);
  };

  const handlePrevTrack = () => {
    const queue = getQueue();
    if (queue.length === 0) return;
    const currentIdx = queue.findIndex((t) => t.id === currentTrack?.id);
    const prevIdx = (currentIdx - 1 + queue.length) % queue.length;
    handlePlayTrack(queue[prevIdx]);
  };

  // Sleep Timer Set/Cancel
  const handleSetSleepTimer = (minutes: number, fadeOut: boolean) => {
    setSleepTimerMinutes(minutes);
    setSleepRemainingSeconds(minutes * 60);
    setSleepTimerFadeOut(fadeOut);
    storageService.logAudit('SLEEP_TIMER_SET', `Timer set for ${minutes} minutes`, 'info');
  };

  const handleCancelSleepTimer = () => {
    setSleepRemainingSeconds(null);
    setSleepTimerMinutes(null);
    if (sleepTimerIntervalRef.current) {
      clearInterval(sleepTimerIntervalRef.current);
      sleepTimerIntervalRef.current = null;
    }
  };

  // AI Voice Assistant Command Handler
  const handleExecuteVoiceResult = (result: VoiceAssistantResult) => {
    if (result.action === 'play' && result.matchedTrack) {
      if (result.matchedCategoryId) {
        setActiveCategory(result.matchedCategoryId as any);
      }
      handlePlayTrack(result.matchedTrack);
    } else if (result.action === 'pause') {
      audioEngine.pause();
    } else if (result.action === 'next') {
      handleNextTrack();
    } else if (result.action === 'prev') {
      handlePrevTrack();
    } else if (result.action === 'timer' && result.timerMinutes) {
      handleSetSleepTimer(result.timerMinutes, true);
    } else if (result.action === 'switch_category' && result.matchedCategoryId) {
      setActiveCategory(result.matchedCategoryId as any);
    } else if (result.action === 'low_battery') {
      setLowBatteryMode((prev) => !prev);
    }
  };

  // Import phone audio complete
  const handleImportComplete = (newTracks: Track[]) => {
    setAllTracks((prev) => [...prev, ...newTracks]);
    if (newTracks.length > 0) {
      handlePlayTrack(newTracks[0]);
    }
  };

  // Delete local track
  const handleDeleteLocalTrack = async (trackId: string) => {
    await storageService.deleteTrack(trackId);
    setAllTracks((prev) => prev.filter((t) => t.id !== trackId));
    if (currentTrack?.id === trackId) {
      const remaining = allTracks.filter((t) => t.id !== trackId);
      if (remaining.length > 0) handlePlayTrack(remaining[0]);
    }
  };

  // Fetch devotional thought
  const fetchSpiritualThought = async (track: Track) => {
    try {
      const res = await fetch('/api/spiritual-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentTrackTitle: track.title,
          artist: track.artist,
          category: track.category,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSpiritualDevotional(data);
        return;
      }
    } catch {}

    setSpiritualDevotional({
      insight: track.notes || 'Let this word and song minister peace and spiritual power to your heart.',
      scripture: track.keyScripture || 'Colossians 3:16 - Singing with grace in your hearts to the Lord.',
    });
  };

  // Open Lyrics View for specific track
  const handleOpenLyrics = (track?: Track) => {
    if (track && track.id !== currentTrack?.id) {
      handlePlayTrack(track);
    }
    setIsLyricsOpen(true);
  };

  // Theme container classes
  const getThemeClass = () => {
    switch (theme) {
      case 'oled_black':
        return 'bg-[#000000] text-white';
      case 'royal_gold':
        return 'bg-[#0f0e1a] text-amber-50';
      case 'celestial_blue':
        return 'bg-[#050b18] text-sky-50';
      default:
        return 'bg-[#080b14] text-white';
    }
  };

  return (
    <div className={`min-h-screen font-sans antialiased selection:bg-amber-500 selection:text-black ${getThemeClass()}`}>
      {/* PIN Security Lock Screen */}
      {isAppLocked && (
        <LockScreen
          expectedPin={storageService.getSecuritySettings().pinCode}
          onUnlock={() => setIsAppLocked(false)}
        />
      )}

      {/* Main App Bar */}
      <Navbar
        theme={theme}
        onChangeTheme={setTheme}
        lowBatteryMode={lowBatteryMode}
        onToggleLowBattery={() => setLowBatteryMode(!lowBatteryMode)}
        isOfflineMode={isAirplaneSimulated}
        onOpenOfflineManager={() => setIsOfflineManagerOpen(true)}
        onOpenVoiceAssistant={() => setIsVoiceAssistantOpen(true)}
        onOpenSleepTimer={() => setIsSleepTimerOpen(true)}
        onOpenFileImport={() => setIsFileImportOpen(true)}
        onOpenEqualizer={() => setIsEqualizerOpen(true)}
        onOpenSecurity={() => setIsSecurityOpen(true)}
        sleepRemainingSeconds={sleepRemainingSeconds}
      />

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
        <PlaylistView
          tracks={allTracks}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          onPlayTrack={handlePlayTrack}
          onOpenLyrics={handleOpenLyrics}
          onOpenShare={(t) => {
            setShareTrack(t);
            setIsShareOpen(true);
          }}
          onOpenFileImport={() => setIsFileImportOpen(true)}
          lowBatteryMode={lowBatteryMode}
          spiritualDevotional={spiritualDevotional}
        />
      </main>

      {/* Home Screen Floating Widget */}
      <FloatingMusicWidget
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onNext={handleNextTrack}
        onPrev={handlePrevTrack}
        onOpenPlayer={() => {
          // PlayerBar handles expansion
        }}
        onOpenSleepTimer={() => setIsSleepTimerOpen(true)}
        remainingSleepSeconds={sleepRemainingSeconds}
        lowBatteryMode={lowBatteryMode}
      />

      {/* Persistent Bottom Player Bar */}
      <PlayerBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        playbackRate={playbackRate}
        lowBatteryMode={lowBatteryMode}
        accentColor={
          PLAYLIST_CATEGORIES.find((c) => c.id === currentTrack?.category)?.accentColor || '#F59E0B'
        }
        onPlayPause={handlePlayPause}
        onSeek={handleSeek}
        onNext={handleNextTrack}
        onPrev={handlePrevTrack}
        onVolumeChange={handleVolumeChange}
        onOpenEqualizer={() => setIsEqualizerOpen(true)}
        onOpenSleepTimer={() => setIsSleepTimerOpen(true)}
        onOpenLyrics={() => setIsLyricsOpen(true)}
        onOpenShare={() => {
          setShareTrack(currentTrack);
          setIsShareOpen(true);
        }}
        remainingSleepSeconds={sleepRemainingSeconds}
      />

      {/* Modals */}
      <LyricsModal
        isOpen={isLyricsOpen}
        onClose={() => setIsLyricsOpen(false)}
        currentTrack={currentTrack}
        currentTime={currentTime}
        duration={duration}
        isPlaying={isPlaying}
        onSeek={handleSeek}
        lowBatteryMode={lowBatteryMode}
        accentColor={
          PLAYLIST_CATEGORIES.find((c) => c.id === currentTrack?.category)?.accentColor || '#F59E0B'
        }
      />

      <FileImportModal
        isOpen={isFileImportOpen}
        onClose={() => setIsFileImportOpen(false)}
        onImportComplete={handleImportComplete}
      />

      <VoiceAssistantModal
        isOpen={isVoiceAssistantOpen}
        onClose={() => setIsVoiceAssistantOpen(false)}
        allTracks={allTracks}
        onExecuteResult={handleExecuteVoiceResult}
      />

      <SleepTimerModal
        isOpen={isSleepTimerOpen}
        onClose={() => setIsSleepTimerOpen(false)}
        activeTimerMinutes={sleepTimerMinutes}
        remainingSeconds={sleepRemainingSeconds}
        onSetTimer={handleSetSleepTimer}
        onCancelTimer={handleCancelSleepTimer}
      />

      <EqualizerModal
        isOpen={isEqualizerOpen}
        onClose={() => setIsEqualizerOpen(false)}
        bands={eqBands}
        onChangeBands={handleEqualizerChange}
        playbackRate={playbackRate}
        onChangePlaybackRate={handlePlaybackRateChange}
      />

      <SecurityPanel
        isOpen={isSecurityOpen}
        onClose={() => setIsSecurityOpen(false)}
        onSecurityChange={() => {
          const sec = storageService.getSecuritySettings();
          if (sec.requirePinOnOpen) setIsAppLocked(true);
        }}
      />

      <SocialShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        track={shareTrack}
      />

      <OfflineManagerModal
        isOpen={isOfflineManagerOpen}
        onClose={() => setIsOfflineManagerOpen(false)}
        allTracks={allTracks}
        isAirplaneSimulated={isAirplaneSimulated}
        onToggleAirplane={() => setIsAirplaneSimulated(!isAirplaneSimulated)}
        onDeleteLocalTrack={handleDeleteLocalTrack}
      />
    </div>
  );
}
