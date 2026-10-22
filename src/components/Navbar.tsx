import React from 'react';
import { AppTheme } from '../types';
import {
  Mic,
  Moon,
  BatteryLow,
  BatteryCharging,
  Sliders,
  ShieldCheck,
  FolderPlus,
  Plane,
  Wifi,
  WifiOff,
  Palette,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  theme: AppTheme;
  onChangeTheme: (theme: AppTheme) => void;
  lowBatteryMode: boolean;
  onToggleLowBattery: () => void;
  isOfflineMode: boolean;
  onOpenOfflineManager: () => void;
  onOpenVoiceAssistant: () => void;
  onOpenSleepTimer: () => void;
  onOpenFileImport: () => void;
  onOpenEqualizer: () => void;
  onOpenSecurity: () => void;
  sleepRemainingSeconds: number | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  theme,
  onChangeTheme,
  lowBatteryMode,
  onToggleLowBattery,
  isOfflineMode,
  onOpenOfflineManager,
  onOpenVoiceAssistant,
  onOpenSleepTimer,
  onOpenFileImport,
  onOpenEqualizer,
  onOpenSecurity,
  sleepRemainingSeconds,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-[#0a0d18]/90 backdrop-blur-xl border-b border-white/10 px-4 lg:px-8 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            <Sparkles size={22} className="text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                KADOSH <span className="text-amber-400 font-extrabold">MOTION</span>
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                Christian Audio
              </span>
            </div>
            <p className="text-[11px] text-white/50 hidden md:block">
              Dancing Stars &bull; Prayer Chants &bull; Worship &bull; Praises &bull; Bishop Dag &amp; Joshua Heward-Mills
            </p>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* AI Mention Song / Voice Assistant Button */}
          <button
            onClick={onOpenVoiceAssistant}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold transition-all shadow-sm cursor-pointer"
            title="Mention a song to play automatically"
          >
            <Mic size={15} className="animate-pulse text-amber-400" />
            <span className="hidden sm:inline">Mention Song (AI)</span>
          </button>

          {/* Import phone files */}
          <button
            onClick={onOpenFileImport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 text-xs font-medium transition-colors cursor-pointer"
            title="Pick phone audio files"
          >
            <FolderPlus size={15} className="text-amber-400" />
            <span className="hidden md:inline">Import Phone Files</span>
          </button>

          {/* Low Battery Consumption Mode Toggle */}
          <button
            onClick={onToggleLowBattery}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              lowBatteryMode
                ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white/70'
            }`}
            title={lowBatteryMode ? 'Low battery mode active (saving power)' : 'Enable low battery mode'}
          >
            {lowBatteryMode ? <BatteryLow size={15} className="text-emerald-400" /> : <BatteryCharging size={15} />}
            <span className="hidden lg:inline">{lowBatteryMode ? 'Battery Saver ON' : 'Battery Saver'}</span>
          </button>

          {/* Offline travel status */}
          <button
            onClick={onOpenOfflineManager}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              isOfflineMode
                ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white/70'
            }`}
            title="Offline listening status & phone storage"
          >
            {isOfflineMode ? <WifiOff size={14} className="text-amber-400" /> : <Wifi size={14} />}
            <span className="hidden lg:inline">{isOfflineMode ? 'Offline Mode' : 'Online'}</span>
          </button>

          {/* Sleep Timer */}
          <button
            onClick={onOpenSleepTimer}
            className={`p-2 rounded-xl text-xs font-medium transition-all relative cursor-pointer ${
              sleepRemainingSeconds !== null
                ? 'bg-indigo-600/30 border border-indigo-500 text-indigo-300'
                : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white/70'
            }`}
            title="Sleep timer"
          >
            <Moon size={15} />
            {sleepRemainingSeconds !== null && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-500 rounded-full animate-ping" />
            )}
          </button>

          {/* Hi-Fi Equalizer */}
          <button
            onClick={onOpenEqualizer}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            title="Hi-Fi Equalizer & Preaching Clarity"
          >
            <Sliders size={15} />
          </button>

          {/* Theme Selector */}
          <div className="relative group">
            <button
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
              title="Theme settings"
            >
              <Palette size={15} />
            </button>
            <div className="absolute right-0 top-full mt-1.5 w-44 bg-[#121624] border border-white/15 rounded-xl p-1.5 shadow-xl hidden group-hover:block z-40">
              <button
                onClick={() => onChangeTheme('dark_midnight')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  theme === 'dark_midnight' ? 'bg-amber-500/20 text-amber-300' : 'text-white/80 hover:bg-white/5'
                }`}
              >
                Dark Midnight
              </button>
              <button
                onClick={() => onChangeTheme('oled_black')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  theme === 'oled_black' ? 'bg-amber-500/20 text-amber-300' : 'text-white/80 hover:bg-white/5'
                }`}
              >
                OLED Pure Black (Battery)
              </button>
              <button
                onClick={() => onChangeTheme('royal_gold')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  theme === 'royal_gold' ? 'bg-amber-500/20 text-amber-300' : 'text-white/80 hover:bg-white/5'
                }`}
              >
                Divine Royal Gold
              </button>
              <button
                onClick={() => onChangeTheme('celestial_blue')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  theme === 'celestial_blue' ? 'bg-amber-500/20 text-amber-300' : 'text-white/80 hover:bg-white/5'
                }`}
              >
                Celestial Deep Blue
              </button>
            </div>
          </div>

          {/* Security Protocols Panel */}
          <button
            onClick={onOpenSecurity}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-emerald-400 transition-colors cursor-pointer"
            title="Security Protocols, Encryption & Audit Trail"
          >
            <ShieldCheck size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};
