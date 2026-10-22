import React, { useState } from 'react';
import { Moon, Clock, X, Check, VolumeX } from 'lucide-react';

interface SleepTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTimerMinutes: number | null;
  remainingSeconds: number | null;
  onSetTimer: (minutes: number, fadeOut: boolean) => void;
  onCancelTimer: () => void;
}

export const SleepTimerModal: React.FC<SleepTimerModalProps> = ({
  isOpen,
  onClose,
  activeTimerMinutes,
  remainingSeconds,
  onSetTimer,
  onCancelTimer,
}) => {
  const [selectedMinutes, setSelectedMinutes] = useState<number>(30);
  const [customValue, setCustomValue] = useState<string>('');
  const [fadeOut, setFadeOut] = useState<boolean>(true);

  if (!isOpen) return null;

  const presets = [
    { label: '5 Minutes', value: 5 },
    { label: '15 Minutes', value: 15 },
    { label: '30 Minutes', value: 30 },
    { label: '45 Minutes', value: 45 },
    { label: '60 Minutes (1 Hour)', value: 60 },
    { label: '90 Minutes', value: 90 },
  ];

  const handleApply = () => {
    let mins = selectedMinutes;
    if (customValue && parseInt(customValue, 10) > 0) {
      mins = parseInt(customValue, 10);
    }
    onSetTimer(mins, fadeOut);
    onClose();
  };

  const formatRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121624] border border-white/10 rounded-3xl w-full max-w-md p-6 flex flex-col shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Moon size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Sleep Timer</h2>
            <p className="text-xs text-white/60">
              Drift to sleep listening to holy worship or anointed preaching
            </p>
          </div>
        </div>

        {/* Active Timer Status Banner */}
        {activeTimerMinutes !== null && remainingSeconds !== null && (
          <div className="mb-5 p-3.5 bg-indigo-950/60 border border-indigo-500/30 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Clock size={16} className="text-indigo-400 animate-pulse" />
              <div>
                <p className="text-xs font-semibold text-white">Timer Active</p>
                <p className="text-[11px] text-indigo-300">
                  Stops in <span className="font-mono font-bold">{formatRemaining(remainingSeconds)}</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                onCancelTimer();
                onClose();
              }}
              className="text-xs px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg transition-colors"
            >
              Turn Off
            </button>
          </div>
        )}

        {/* Preset selections */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {presets.map((preset) => (
            <button
              key={preset.value}
              onClick={() => {
                setSelectedMinutes(preset.value);
                setCustomValue('');
              }}
              className={`p-3 rounded-xl border text-xs font-medium transition-all text-left flex items-center justify-between cursor-pointer ${
                selectedMinutes === preset.value && !customValue
                  ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
              }`}
            >
              <span>{preset.label}</span>
              {selectedMinutes === preset.value && !customValue && (
                <Check size={14} className="text-indigo-400" />
              )}
            </button>
          ))}
        </div>

        {/* Custom Minutes Input */}
        <div className="mb-4">
          <label className="text-[11px] text-white/60 mb-1.5 block">Or enter custom duration (minutes):</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="600"
              placeholder="e.g. 120"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-indigo-400"
            />
            <span className="text-xs text-white/50">mins</span>
          </div>
        </div>

        {/* Smooth Fade Out Option */}
        <label className="flex items-center gap-2.5 p-3 bg-white/5 rounded-xl border border-white/10 cursor-pointer mb-5">
          <input
            type="checkbox"
            checked={fadeOut}
            onChange={(e) => setFadeOut(e.target.checked)}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer"
          />
          <div className="flex-1">
            <p className="text-xs font-medium text-white flex items-center gap-1.5">
              <VolumeX size={13} className="text-indigo-400" />
              Gentle Audio Fade-Out
            </p>
            <p className="text-[11px] text-white/50">
              Smoothly reduces volume over the final 30 seconds
            </p>
          </div>
        </label>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-white/60 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
          >
            Set Sleep Timer
          </button>
        </div>
      </div>
    </div>
  );
};
