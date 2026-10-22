import React, { useState } from 'react';
import { EqualizerBands } from '../types';
import { Sliders, X, Check, Volume2, FastForward } from 'lucide-react';

interface EqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  bands: EqualizerBands;
  onChangeBands: (bands: EqualizerBands) => void;
  playbackRate: number;
  onChangePlaybackRate: (rate: number) => void;
}

export const EqualizerModal: React.FC<EqualizerModalProps> = ({
  isOpen,
  onClose,
  bands,
  onChangeBands,
  playbackRate,
  onChangePlaybackRate,
}) => {
  const [activePreset, setActivePreset] = useState<string>('custom');

  if (!isOpen) return null;

  const presets: { name: string; label: string; bands: EqualizerBands }[] = [
    {
      name: 'preaching',
      label: 'Preaching Clarity (Bishop Dag & Joshua)',
      bands: { subBass: -4, bass: -2, mid: 5, presence: 6, treble: 2 },
    },
    {
      name: 'worship',
      label: 'Reverent Worship & Presence',
      bands: { subBass: 2, bass: 3, mid: 1, presence: 3, treble: 4 },
    },
    {
      name: 'dancing_stars',
      label: 'Dancing Stars Punch & Beats',
      bands: { subBass: 6, bass: 4, mid: -1, presence: 4, treble: 5 },
    },
    {
      name: 'prayer_chant',
      label: 'Atmospheric Prayer Chants',
      bands: { subBass: 5, bass: 4, mid: 2, presence: -1, treble: 3 },
    },
    {
      name: 'flat',
      label: 'Flat / Studio Direct',
      bands: { subBass: 0, bass: 0, mid: 0, presence: 0, treble: 0 },
    },
  ];

  const applyPreset = (presetName: string, pBands: EqualizerBands) => {
    setActivePreset(presetName);
    onChangeBands(pBands);
  };

  const handleSliderChange = (bandKey: keyof EqualizerBands, val: number) => {
    setActivePreset('custom');
    onChangeBands({ ...bands, [bandKey]: val });
  };

  const speedOptions = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121624] border border-white/10 rounded-3xl w-full max-w-lg p-6 flex flex-col shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sliders size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Hi-Fi Audio &amp; Preaching Equalizer</h2>
            <p className="text-xs text-white/60">
              Optimize sound for vocal sermon clarity or deep worship atmosphere
            </p>
          </div>
        </div>

        {/* Presets */}
        <div className="mb-5">
          <label className="text-[11px] font-semibold text-white/60 mb-2 block uppercase tracking-wider">
            Audio Presets
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {presets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset.name, preset.bands)}
                className={`p-2.5 rounded-xl border text-xs font-medium text-left flex items-center justify-between transition-all cursor-pointer ${
                  activePreset === preset.name
                    ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                <span>{preset.label}</span>
                {activePreset === preset.name && <Check size={14} className="text-amber-400" />}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        <div className="bg-black/30 border border-white/10 rounded-2xl p-4 mb-5">
          <div className="grid grid-cols-5 gap-3 text-center">
            {[
              { key: 'subBass', label: '60Hz', sub: 'Sub-Bass' },
              { key: 'bass', label: '250Hz', sub: 'Bass' },
              { key: 'mid', label: '1kHz', sub: 'Speech' },
              { key: 'presence', label: '4kHz', sub: 'Clarity' },
              { key: 'treble', label: '14kHz', sub: 'Treble' },
            ].map((f) => {
              const val = bands[f.key as keyof EqualizerBands];
              return (
                <div key={f.key} className="flex flex-col items-center">
                  <span className="text-[11px] font-mono text-amber-400 font-bold mb-2">
                    {val > 0 ? `+${val}` : val}dB
                  </span>

                  <div className="h-32 flex items-center justify-center my-1">
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="1"
                      value={val}
                      onChange={(e) =>
                        handleSliderChange(f.key as keyof EqualizerBands, parseInt(e.target.value, 10))
                      }
                      className="h-28 w-2 appearance-none bg-white/20 rounded-lg accent-amber-400 cursor-pointer [writing-mode:vertical-lr] [direction:rtl]"
                    />
                  </div>

                  <span className="text-[11px] font-medium text-white mt-1">{f.label}</span>
                  <span className="text-[9px] text-white/40">{f.sub}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Playback speed for studying preaching messages */}
        <div className="mb-5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white/60 mb-2 uppercase tracking-wider">
            <FastForward size={13} className="text-amber-400" />
            <span>Message Playback Speed</span>
          </div>
          <div className="flex items-center gap-2">
            {speedOptions.map((speed) => (
              <button
                key={speed}
                onClick={() => onChangePlaybackRate(speed)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  playbackRate === speed
                    ? 'bg-amber-500 text-black border-amber-400 font-bold'
                    : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
