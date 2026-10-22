import { Track } from '../types';

export interface VoiceAssistantResult {
  action: 'play' | 'pause' | 'next' | 'prev' | 'timer' | 'switch_category' | 'low_battery' | 'unknown';
  matchedTrack?: Track;
  matchedCategoryId?: string;
  timerMinutes?: number;
  spokenFeedback: string;
  transcript: string;
}

export class VoiceAssistant {
  private recognition: any = null;
  public isListening = false;
  public isSupported = false;

  constructor() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.isSupported = true;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
    }
  }

  // Speak response back to user
  public speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        resolve();
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  }

  // Start listening for speech
  public startListening(
    onTranscript: (transcript: string) => void,
    onResult: (result: VoiceAssistantResult) => void,
    onError: (err: string) => void,
    allTracks: Track[]
  ): void {
    if (!this.recognition) {
      onError('Speech recognition is not supported in this browser. You can type commands below.');
      return;
    }

    this.recognition.onstart = () => {
      this.isListening = true;
    };

    this.recognition.onresult = async (event: any) => {
      this.isListening = false;
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);

      // Process intent via backend or offline fallback
      const result = await this.processCommand(transcript, allTracks);
      onResult(result);
    };

    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      onError(event.error || 'Voice input error');
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    try {
      this.recognition.start();
    } catch (e: any) {
      onError(e.message || 'Could not start microphone');
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  // Process text or voice input
  public async processCommand(query: string, allTracks: Track[]): Promise<VoiceAssistantResult> {
    const trimmed = query.trim();

    // 1. Try server-side Gemini AI
    try {
      const resp = await fetch('/api/voice-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed, availableTracks: allTracks }),
      });

      if (resp.ok) {
        const data = await resp.json();
        if (!data.fallback && data.action) {
          let matchedTrack: Track | undefined;
          if (data.matchedTrackId) {
            matchedTrack = allTracks.find((t) => t.id === data.matchedTrackId);
          } else if (data.matchedCategory) {
            matchedTrack = allTracks.find((t) => t.category === data.matchedCategory);
          }

          return {
            action: data.action,
            matchedTrack,
            matchedCategoryId: data.matchedCategory,
            timerMinutes: data.timerMinutes,
            spokenFeedback: data.spokenFeedback || `Playing ${matchedTrack?.title || 'selection'}`,
            transcript: trimmed,
          };
        }
      }
    } catch {
      // Offline fallback
    }

    // 2. High-precision offline rule-based matcher
    return this.processOffline(trimmed, allTracks);
  }

  private processOffline(query: string, allTracks: Track[]): VoiceAssistantResult {
    const q = query.toLowerCase();

    // Basic playback controls
    if (q.includes('stop') || q.includes('pause')) {
      return {
        action: 'pause',
        spokenFeedback: 'Playback paused.',
        transcript: query,
      };
    }

    if (q.includes('next') || q.includes('skip')) {
      return {
        action: 'next',
        spokenFeedback: 'Skipping to next track.',
        transcript: query,
      };
    }

    if (q.includes('previous') || q.includes('back')) {
      return {
        action: 'prev',
        spokenFeedback: 'Returning to previous track.',
        transcript: query,
      };
    }

    if (q.includes('battery saver') || q.includes('low battery')) {
      return {
        action: 'low_battery',
        spokenFeedback: 'Low battery consumption mode toggled.',
        transcript: query,
      };
    }

    // Timer detection (e.g. "set timer to 20 minutes")
    const timerMatch = q.match(/(\d+)\s*(min|minute)/);
    if (timerMatch || q.includes('sleep timer')) {
      const mins = timerMatch ? parseInt(timerMatch[1], 10) : 30;
      return {
        action: 'timer',
        timerMinutes: mins,
        spokenFeedback: `Sleep timer set for ${mins} minutes.`,
        transcript: query,
      };
    }

    // Category matches
    if (q.includes('dancing') || q.includes('stars')) {
      const match = allTracks.find((t) => t.category === 'dancing_stars');
      return {
        action: 'play',
        matchedTrack: match,
        matchedCategoryId: 'dancing_stars',
        spokenFeedback: `Playing Dancing Stars Songs: ${match?.title}`,
        transcript: query,
      };
    }

    if (q.includes('prayer') || q.includes('chant') || q.includes('tongue')) {
      const match = allTracks.find((t) => t.category === 'prayer_chants');
      return {
        action: 'play',
        matchedTrack: match,
        matchedCategoryId: 'prayer_chants',
        spokenFeedback: `Playing Prayer Chants: ${match?.title}`,
        transcript: query,
      };
    }

    if (q.includes('worship')) {
      const match = allTracks.find((t) => t.category === 'worship');
      return {
        action: 'play',
        matchedTrack: match,
        matchedCategoryId: 'worship',
        spokenFeedback: `Playing Worship: ${match?.title}`,
        transcript: query,
      };
    }

    if (q.includes('praise')) {
      const match = allTracks.find((t) => t.category === 'praises');
      return {
        action: 'play',
        matchedTrack: match,
        matchedCategoryId: 'praises',
        spokenFeedback: `Playing Praises: ${match?.title}`,
        transcript: query,
      };
    }

    if (q.includes('camp') || q.includes('anagkazo') || q.includes('machaneh')) {
      const match = allTracks.find((t) => t.category === 'camp_messages');
      return {
        action: 'play',
        matchedTrack: match,
        matchedCategoryId: 'camp_messages',
        spokenFeedback: `Playing Camp Message: ${match?.title}`,
        transcript: query,
      };
    }

    if (q.includes('dag') || q.includes('loyalty') || q.includes('anointing') || q.includes('joshua') || q.includes('preach')) {
      const match = allTracks.find((t) => {
        if (q.includes('joshua')) return t.artist.toLowerCase().includes('joshua') || t.title.toLowerCase().includes('joshua');
        if (q.includes('loyalty')) return t.title.toLowerCase().includes('loyalty');
        if (q.includes('anointing')) return t.title.toLowerCase().includes('anointing');
        return t.category === 'preaching';
      });
      return {
        action: 'play',
        matchedTrack: match,
        matchedCategoryId: 'preaching',
        spokenFeedback: `Playing Message: ${match?.title}`,
        transcript: query,
      };
    }

    // Direct track title fuzzy match
    let bestMatch: Track | undefined;
    let highestScore = 0;

    for (const track of allTracks) {
      const trackWords = track.title.toLowerCase().split(/\s+/);
      let matchCount = 0;
      for (const w of trackWords) {
        if (w.length > 2 && q.includes(w)) {
          matchCount++;
        }
      }
      if (matchCount > highestScore) {
        highestScore = matchCount;
        bestMatch = track;
      }
    }

    if (bestMatch && highestScore > 0) {
      return {
        action: 'play',
        matchedTrack: bestMatch,
        spokenFeedback: `Playing ${bestMatch.title}`,
        transcript: query,
      };
    }

    // Default first track
    const fallback = allTracks[0];
    return {
      action: 'play',
      matchedTrack: fallback,
      spokenFeedback: `Playing ${fallback?.title || 'Christian worship'}`,
      transcript: query,
    };
  }
}

export const voiceAssistant = new VoiceAssistant();
