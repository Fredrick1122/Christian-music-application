import { EqualizerBands, Track } from '../types';

export class AudioEngine {
  private static instance: AudioEngine;
  private audioCtx: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private audioSourceNode: MediaElementAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private masterGainNode: GainNode | null = null;

  // Equalizer nodes
  private subBassFilter: BiquadFilterNode | null = null;
  private bassFilter: BiquadFilterNode | null = null;
  private midFilter: BiquadFilterNode | null = null;
  private presenceFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;

  // Procedural audio generation state
  private proceduralInterval: any = null;
  private isProceduralPlaying = false;
  private proceduralNodes: AudioNode[] = [];

  // Playback state
  public isPlaying = false;
  public currentTrack: Track | null = null;
  public currentTime = 0;
  public duration = 0;
  public volume = 0.85;
  public playbackRate = 1.0;

  // Listeners
  private onTimeUpdateCallbacks: Set<(time: number, duration: number) => void> = new Set();
  private onStateChangeCallbacks: Set<(isPlaying: boolean) => void> = new Set();
  private onEndedCallbacks: Set<() => void> = new Set();

  private constructor() {
    // Lazy initialized on user gesture
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public initContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();

      // Master Gain
      this.masterGainNode = this.audioCtx.createGain();
      this.masterGainNode.gain.value = this.volume;

      // Analyser Node for Real-time Visualizer
      this.analyserNode = this.audioCtx.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.analyserNode.smoothingTimeConstant = 0.82;

      // 5-Band Hi-Fi Equalizer
      this.subBassFilter = this.audioCtx.createBiquadFilter();
      this.subBassFilter.type = 'lowshelf';
      this.subBassFilter.frequency.value = 60;

      this.bassFilter = this.audioCtx.createBiquadFilter();
      this.bassFilter.type = 'peaking';
      this.bassFilter.frequency.value = 250;
      this.bassFilter.Q.value = 1.0;

      this.midFilter = this.audioCtx.createBiquadFilter();
      this.midFilter.type = 'peaking';
      this.midFilter.frequency.value = 1000;
      this.midFilter.Q.value = 1.0;

      this.presenceFilter = this.audioCtx.createBiquadFilter();
      this.presenceFilter.type = 'peaking';
      this.presenceFilter.frequency.value = 4000;
      this.presenceFilter.Q.value = 1.0;

      this.trebleFilter = this.audioCtx.createBiquadFilter();
      this.trebleFilter.type = 'highshelf';
      this.trebleFilter.frequency.value = 14000;

      // Chain: EQ filters -> Master Gain -> Analyser -> Destination
      this.subBassFilter
        .connect(this.bassFilter)
        .connect(this.midFilter)
        .connect(this.presenceFilter)
        .connect(this.trebleFilter)
        .connect(this.masterGainNode)
        .connect(this.analyserNode)
        .connect(this.audioCtx.destination);

      // Create native audio element
      this.audioElement = new Audio();
      this.audioElement.crossOrigin = 'anonymous';
      this.audioElement.playbackRate = this.playbackRate;

      this.audioSourceNode = this.audioCtx.createMediaElementSource(this.audioElement);
      this.audioSourceNode.connect(this.subBassFilter);

      // Audio element listeners
      this.audioElement.addEventListener('timeupdate', () => {
        if (!this.isProceduralPlaying && this.audioElement) {
          this.currentTime = this.audioElement.currentTime;
          this.duration = this.audioElement.duration || this.currentTrack?.duration || 0;
          this.notifyTimeUpdate();
        }
      });

      this.audioElement.addEventListener('ended', () => {
        this.isPlaying = false;
        this.notifyStateChange();
        this.notifyEnded();
      });

      this.audioElement.addEventListener('play', () => {
        this.isPlaying = true;
        this.notifyStateChange();
      });

      this.audioElement.addEventListener('pause', () => {
        if (!this.isProceduralPlaying) {
          this.isPlaying = false;
          this.notifyStateChange();
        }
      });
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    return this.audioCtx;
  }

  // Load and play a track (handles local blob, audio URL, or procedural gospel synthesis)
  public async playTrack(track: Track, audioBlob?: Blob | null): Promise<void> {
    this.initContext();
    this.currentTrack = track;
    this.stopProcedural();

    // Setup lock screen & MediaSession
    this.setupMediaSession(track);

    if (audioBlob) {
      // Play loaded local audio file
      const url = URL.createObjectURL(audioBlob);
      if (this.audioElement) {
        this.audioElement.src = url;
        this.audioElement.playbackRate = this.playbackRate;
        try {
          await this.audioElement.play();
          this.isPlaying = true;
          this.isProceduralPlaying = false;
          this.notifyStateChange();
          return;
        } catch (e) {
          console.error('Playback error with blob:', e);
        }
      }
    } else if (track.audioSrc && track.audioSrc.startsWith('http')) {
      if (this.audioElement) {
        this.audioElement.src = track.audioSrc;
        this.audioElement.playbackRate = this.playbackRate;
        try {
          await this.audioElement.play();
          this.isPlaying = true;
          this.isProceduralPlaying = false;
          this.notifyStateChange();
          return;
        } catch (e) {
          console.warn('Network audio failed, falling back to procedural engine:', e);
        }
      }
    }

    // Procedural Gospel / Message Sound Engine (Web Audio synthesized prayer & choir flow)
    this.startProceduralGospelAudio(track);
  }

  public pause(): void {
    if (this.audioElement && !this.isProceduralPlaying) {
      this.audioElement.pause();
    }
    if (this.isProceduralPlaying) {
      this.stopProcedural();
    }
    this.isPlaying = false;
    this.notifyStateChange();
  }

  public resume(): void {
    this.initContext();
    if (this.audioElement && this.audioElement.src && !this.isProceduralPlaying) {
      this.audioElement.play().catch(console.error);
      this.isPlaying = true;
      this.notifyStateChange();
    } else if (this.currentTrack) {
      this.startProceduralGospelAudio(this.currentTrack);
    }
  }

  public seek(seconds: number): void {
    if (this.audioElement && !this.isProceduralPlaying) {
      this.audioElement.currentTime = seconds;
      this.currentTime = seconds;
      this.notifyTimeUpdate();
    } else if (this.isProceduralPlaying) {
      this.currentTime = Math.max(0, Math.min(seconds, this.duration));
      this.notifyTimeUpdate();
    }
  }

  public setVolume(val: number): void {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGainNode && this.audioCtx) {
      this.masterGainNode.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
    }
    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }
  }

  public setPlaybackRate(rate: number): void {
    this.playbackRate = rate;
    if (this.audioElement) {
      this.audioElement.playbackRate = rate;
    }
  }

  public setEqualizer(bands: EqualizerBands): void {
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    if (this.subBassFilter) this.subBassFilter.gain.setValueAtTime(bands.subBass, now);
    if (this.bassFilter) this.bassFilter.gain.setValueAtTime(bands.bass, now);
    if (this.midFilter) this.midFilter.gain.setValueAtTime(bands.mid, now);
    if (this.presenceFilter) this.presenceFilter.gain.setValueAtTime(bands.presence, now);
    if (this.trebleFilter) this.trebleFilter.gain.setValueAtTime(bands.treble, now);
  }

  public getVisualizerData(): { frequencyData: Uint8Array; waveData: Uint8Array } {
    if (!this.analyserNode) {
      return {
        frequencyData: new Uint8Array(64),
        waveData: new Uint8Array(64),
      };
    }
    const freq = new Uint8Array(this.analyserNode.frequencyBinCount);
    const wave = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(freq);
    this.analyserNode.getByteTimeDomainData(wave);
    return { frequencyData: freq, waveData: wave };
  }

  // Smooth fade-out for Sleep Timer
  public fadeOutAndStop(durationSeconds = 15): Promise<void> {
    return new Promise((resolve) => {
      if (!this.audioCtx || !this.masterGainNode) {
        this.pause();
        resolve();
        return;
      }
      const now = this.audioCtx.currentTime;
      this.masterGainNode.gain.cancelScheduledValues(now);
      this.masterGainNode.gain.setValueAtTime(this.volume, now);
      this.masterGainNode.gain.linearRampToValueAtTime(0.001, now + durationSeconds);

      setTimeout(() => {
        this.pause();
        if (this.masterGainNode && this.audioCtx) {
          this.masterGainNode.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
        }
        resolve();
      }, durationSeconds * 1000);
    });
  }

  // Procedural Gospel Sound Engine using Web Audio API
  private startProceduralGospelAudio(track: Track): void {
    const ctx = this.initContext();
    this.stopProcedural();
    this.isProceduralPlaying = true;
    this.isPlaying = true;
    this.duration = track.duration || 300;
    this.notifyStateChange();

    // Progression chords in C major / F major for peaceful Christian music
    const chordProgressions: Record<string, number[][]> = {
      praise_dance: [
        [261.63, 329.63, 392.0, 523.25], // C
        [349.23, 440.0, 523.25, 698.46], // F
        [392.0, 493.88, 587.33, 783.99], // G
        [220.0, 261.63, 329.63, 440.0],  // Am
      ],
      prayer_chant: [
        [174.61, 220.0, 261.63, 349.23], // Fmaj7
        [146.83, 174.61, 220.0, 261.63], // Dm7
        [164.81, 196.0, 246.94, 329.63], // Em7
        [220.0, 261.63, 329.63, 440.0],  // Am
      ],
      deep_worship: [
        [261.63, 329.63, 392.0, 493.88], // Cmaj7
        [349.23, 440.0, 523.25, 659.25], // Fmaj7
        [220.0, 261.63, 329.63, 392.0],  // Am7
        [196.0, 246.94, 293.66, 392.0],  // G
      ],
      high_praises: [
        [261.63, 329.63, 392.0, 523.25],
        [349.23, 440.0, 523.25, 698.46],
        [392.0, 493.88, 587.33, 783.99],
        [349.23, 440.0, 523.25, 698.46],
      ],
      sermon_dag: [
        [130.81, 196.0, 261.63, 329.63], // Deep warm organ
        [174.61, 220.0, 261.63, 349.23],
        [146.83, 196.0, 220.0, 293.66],
        [130.81, 196.0, 261.63, 329.63],
      ],
      sermon_joshua: [
        [164.81, 220.0, 261.63, 329.63],
        [174.61, 220.0, 261.63, 349.23],
        [196.0, 246.94, 293.66, 392.0],
        [130.81, 196.0, 261.63, 329.63],
      ],
    };

    const type = track.proceduralType || 'deep_worship';
    const chords = chordProgressions[type] || chordProgressions.deep_worship;
    let chordIndex = 0;

    const playChordStep = () => {
      if (!this.isProceduralPlaying || !this.audioCtx || !this.subBassFilter) return;

      const currentChord = chords[chordIndex % chords.length];
      chordIndex++;

      // Create warm choir/pad synth voices
      currentChord.forEach((freq, idx) => {
        if (!this.audioCtx || !this.subBassFilter) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        // Waveform styling
        if (type === 'praise_dance' || type === 'high_praises') {
          osc.type = idx === 0 ? 'triangle' : 'sawtooth';
        } else if (type === 'prayer_chant') {
          osc.type = 'sine';
        } else {
          osc.type = 'triangle';
        }

        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

        const now = this.audioCtx.currentTime;
        const stepDuration = type === 'praise_dance' ? 1.8 : 3.8;

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.06 / (idx + 1), now + 0.6);
        gain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration);

        osc.connect(gain);
        gain.connect(this.subBassFilter);

        osc.start(now);
        osc.stop(now + stepDuration);
      });

      // Rhythmic kick / percussion for Dancing Stars & Praises
      if (type === 'praise_dance' || type === 'high_praises') {
        const kickOsc = this.audioCtx.createOscillator();
        const kickGain = this.audioCtx.createGain();
        const now = this.audioCtx.currentTime;

        kickOsc.frequency.setValueAtTime(140, now);
        kickOsc.frequency.exponentialRampToValueAtTime(35, now + 0.28);
        kickGain.gain.setValueAtTime(0.25, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        kickOsc.connect(kickGain);
        kickGain.connect(this.subBassFilter);

        kickOsc.start(now);
        kickOsc.stop(now + 0.35);
      }
    };

    // Play immediately and repeat on cadence
    playChordStep();
    const intervalTime = (type === 'praise_dance' ? 1800 : 3800);
    this.proceduralInterval = setInterval(() => {
      playChordStep();
      this.currentTime += intervalTime / 1000;
      if (this.currentTime >= this.duration) {
        this.currentTime = 0;
        this.notifyEnded();
      }
      this.notifyTimeUpdate();
    }, intervalTime);
  }

  private stopProcedural(): void {
    this.isProceduralPlaying = false;
    if (this.proceduralInterval) {
      clearInterval(this.proceduralInterval);
      this.proceduralInterval = null;
    }
  }

  private setupMediaSession(track: Track): void {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: `Kadosh Motion - ${track.category.replace('_', ' ').toUpperCase()}`,
        artwork: [
          {
            src: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=512&auto=format&fit=crop&q=80',
            sizes: '512x512',
            type: 'image/jpeg',
          },
        ],
      });

      navigator.mediaSession.setActionHandler('play', () => this.resume());
      navigator.mediaSession.setActionHandler('pause', () => this.pause());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) {
          this.seek(details.seekTime);
        }
      });
    }
  }

  // Observers
  public onTimeUpdate(cb: (time: number, duration: number) => void): () => void {
    this.onTimeUpdateCallbacks.add(cb);
    return () => this.onTimeUpdateCallbacks.delete(cb);
  }

  public onStateChange(cb: (isPlaying: boolean) => void): () => void {
    this.onStateChangeCallbacks.add(cb);
    return () => this.onStateChangeCallbacks.delete(cb);
  }

  public onEnded(cb: () => void): () => void {
    this.onEndedCallbacks.add(cb);
    return () => this.onEndedCallbacks.delete(cb);
  }

  private notifyTimeUpdate(): void {
    this.onTimeUpdateCallbacks.forEach((cb) => cb(this.currentTime, this.duration));
  }

  private notifyStateChange(): void {
    this.onStateChangeCallbacks.forEach((cb) => cb(this.isPlaying));
  }

  private notifyEnded(): void {
    this.onEndedCallbacks.forEach((cb) => cb());
  }
}

export const audioEngine = AudioEngine.getInstance();
