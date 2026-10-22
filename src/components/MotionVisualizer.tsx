import React, { useEffect, useRef, useState } from 'react';
import { audioEngine } from '../services/audioEngine';
import { VisualizerMode } from '../types';
import { Sparkles, Activity, Disc, Zap, BatteryLow } from 'lucide-react';

interface MotionVisualizerProps {
  isPlaying: boolean;
  lowBatteryMode: boolean;
  accentColor?: string;
  category?: string;
  height?: number;
  mode?: VisualizerMode;
  onModeChange?: (mode: VisualizerMode) => void;
  immersive?: boolean;
}

export const MotionVisualizer: React.FC<MotionVisualizerProps> = ({
  isPlaying,
  lowBatteryMode,
  accentColor = '#F59E0B',
  height = 140,
  mode = 'waves',
  onModeChange,
  immersive = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const [internalMode, setInternalMode] = useState<VisualizerMode>(mode);
  const currentMode = onModeChange ? mode : internalMode;

  const setMode = (newMode: VisualizerMode) => {
    if (onModeChange) onModeChange(newMode);
    else setInternalMode(newMode);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameCount = 0;

    const render = () => {
      frameCount++;

      // In low battery mode, throttle rendering to every 3rd frame (20fps) to save battery
      if (lowBatteryMode && frameCount % 3 !== 0) {
        animationFrameId.current = requestAnimationFrame(render);
        return;
      }

      // Handle retina displays
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const width = rect.width;
      const h = rect.height;

      // Clear with soft decay or transparent
      ctx.clearRect(0, 0, width, h);

      const { frequencyData, waveData } = audioEngine.getVisualizerData();

      // Determine activity level
      let sum = 0;
      for (let i = 0; i < frequencyData.length; i++) {
        sum += frequencyData[i];
      }
      const avg = sum / (frequencyData.length || 1);
      const intensity = isPlaying ? Math.max(0.15, avg / 128) : 0.05;

      // Draw according to mode
      if (currentMode === 'waves') {
        drawCelestialWaves(ctx, width, h, waveData, intensity, accentColor, frameCount, lowBatteryMode);
      } else if (currentMode === 'bars') {
        drawSymmetricBars(ctx, width, h, frequencyData, intensity, accentColor, lowBatteryMode);
      } else if (currentMode === 'aura') {
        drawAuraRings(ctx, width, h, frequencyData, intensity, accentColor, frameCount);
      } else if (currentMode === 'particles') {
        drawParticles(ctx, width, h, frequencyData, intensity, accentColor, frameCount);
      }

      ctx.restore();

      animationFrameId.current = requestAnimationFrame(render);
    };

    animationFrameId.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isPlaying, lowBatteryMode, accentColor, currentMode]);

  // Visualizer 1: Celestial Liquid Waves
  const drawCelestialWaves = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    waveData: Uint8Array,
    intensity: number,
    color: string,
    frame: number,
    isLowBattery: boolean
  ) => {
    const centerY = h / 2;
    const layers = isLowBattery ? 1 : 3;

    for (let l = 0; l < layers; l++) {
      ctx.beginPath();
      const alpha = 0.8 - l * 0.25;
      ctx.strokeStyle = color;
      ctx.lineWidth = isLowBattery ? 2 : 2.5 - l * 0.5;

      if (!isLowBattery) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 12 - l * 3;
      } else {
        ctx.shadowBlur = 0;
      }

      const step = Math.ceil(waveData.length / 48);
      const sliceWidth = w / (waveData.length / step);

      let x = 0;
      for (let i = 0; i < waveData.length; i += step) {
        const v = (waveData[i] - 128) / 128;
        const phase = frame * 0.02 + l * 1.5;
        const waveOffset = Math.sin(x * 0.02 + phase) * 12 * intensity;
        const y = centerY + v * (h * 0.42 * intensity) + waveOffset;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.stroke();

      // Fill lower gradient on primary wave
      if (l === 0 && !isLowBattery) {
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, centerY, 0, h);
        grad.addColorStop(0, `${color}33`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fill();
      }
    }
  };

  // Visualizer 2: Symmetric Frequency Bars
  const drawSymmetricBars = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    freqData: Uint8Array,
    intensity: number,
    color: string,
    isLowBattery: boolean
  ) => {
    const barCount = isLowBattery ? 24 : 40;
    const barWidth = (w / barCount) * 0.65;
    const gap = (w / barCount) * 0.35;
    const centerY = h / 2;

    for (let i = 0; i < barCount; i++) {
      const idx = Math.floor((i / barCount) * (freqData.length * 0.6));
      const val = freqData[idx] || 0;
      const barHeight = Math.max(4, (val / 255) * (h * 0.85) * intensity);

      const x = i * (barWidth + gap) + gap / 2;
      const y = centerY - barHeight / 2;

      const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
      grad.addColorStop(0, color);
      grad.addColorStop(0.5, '#FFFFFF');
      grad.addColorStop(1, color);

      ctx.fillStyle = grad;
      if (!isLowBattery) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
      } else {
        ctx.shadowBlur = 0;
      }

      // Draw rounded bar
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 3);
      ctx.fill();
    }
  };

  // Visualizer 3: Aura Rings
  const drawAuraRings = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    freqData: Uint8Array,
    intensity: number,
    color: string,
    frame: number
  ) => {
    const cx = w / 2;
    const cy = h / 2;
    const maxRadius = Math.min(w, h) * 0.45;

    for (let r = 0; r < 4; r++) {
      const baseRadius = (maxRadius / 4) * (r + 1);
      const pulse = Math.sin(frame * 0.05 + r) * 8 * intensity;
      const radius = Math.max(10, baseRadius + pulse + (freqData[r * 10] / 255) * 20);

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.stroke();
    }
  };

  // Visualizer 4: Constellation Particles
  const drawParticles = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    freqData: Uint8Array,
    intensity: number,
    color: string,
    frame: number
  ) => {
    const count = 32;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + frame * 0.01;
      const dist = (w * 0.25) + Math.sin(frame * 0.03 + i) * 30 + (freqData[i % freqData.length] / 255) * 40 * intensity;
      const px = w / 2 + Math.cos(angle) * dist;
      const py = h / 2 + Math.sin(angle) * (dist * 0.5);

      ctx.beginPath();
      ctx.arc(px, py, 3 + (freqData[i] / 255) * 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.fill();
    }
  };

  return (
    <div
      className={`relative w-full overflow-hidden transition-all duration-300 ${
        immersive ? 'h-full flex items-center justify-center' : ''
      }`}
      style={{ height: immersive ? '100%' : `${height}px` }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ opacity: lowBatteryMode ? 0.7 : 1 }}
      />

      {/* Mode Selector and Battery status tags */}
      <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full text-xs text-white/80 border border-white/10 z-10">
        {lowBatteryMode && (
          <span className="flex items-center gap-1 text-emerald-400 font-medium mr-1.5">
            <BatteryLow size={13} />
            Eco Saver
          </span>
        )}
        <button
          onClick={() => setMode('waves')}
          className={`p-1 rounded transition-colors ${currentMode === 'waves' ? 'text-amber-400 bg-white/10' : 'hover:text-white'}`}
          title="Celestial Waves"
        >
          <Activity size={13} />
        </button>
        <button
          onClick={() => setMode('bars')}
          className={`p-1 rounded transition-colors ${currentMode === 'bars' ? 'text-amber-400 bg-white/10' : 'hover:text-white'}`}
          title="Sacred Equalizer Bars"
        >
          <Sparkles size={13} />
        </button>
        <button
          onClick={() => setMode('aura')}
          className={`p-1 rounded transition-colors ${currentMode === 'aura' ? 'text-amber-400 bg-white/10' : 'hover:text-white'}`}
          title="Aura Rings"
        >
          <Disc size={13} />
        </button>
        <button
          onClick={() => setMode('particles')}
          className={`p-1 rounded transition-colors ${currentMode === 'particles' ? 'text-amber-400 bg-white/10' : 'hover:text-white'}`}
          title="Constellation Motion"
        >
          <Zap size={13} />
        </button>
      </div>
    </div>
  );
};
