import React, { useState, useEffect } from 'react';
import { voiceAssistant, VoiceAssistantResult } from '../services/voiceAssistant';
import { Track } from '../types';
import { Mic, MicOff, Volume2, Sparkles, X, Play, Send } from 'lucide-react';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  allTracks: Track[];
  onExecuteResult: (result: VoiceAssistantResult) => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  allTracks,
  onExecuteResult,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [typedInput, setTypedInput] = useState('');
  const [statusMessage, setStatusMessage] = useState('Tap microphone and mention any song or sermon...');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      startListeningFlow();
    } else {
      voiceAssistant.stopListening();
      setIsListening(false);
    }
  }, [isOpen]);

  const startListeningFlow = () => {
    setFeedback(null);
    setTranscript('');
    setIsListening(true);
    setStatusMessage('Listening to you... Speak song name, preacher, or command');

    voiceAssistant.startListening(
      (text) => {
        setTranscript(text);
        setStatusMessage(`Understood: "${text}"`);
      },
      async (result) => {
        setIsListening(false);
        setIsProcessing(true);
        setStatusMessage('Executing command...');
        setFeedback(result.spokenFeedback);

        // Vocal audio confirmation
        await voiceAssistant.speak(result.spokenFeedback);

        setIsProcessing(false);
        onExecuteResult(result);
        setTimeout(() => {
          onClose();
        }, 1200);
      },
      (error) => {
        setIsListening(false);
        setStatusMessage(`Microphone: ${error}. You can also type your command below.`);
      },
      allTracks
    );
  };

  const handleManualSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!typedInput.trim()) return;

    setIsProcessing(true);
    setStatusMessage(`Searching for "${typedInput}"...`);
    const result = await voiceAssistant.processCommand(typedInput, allTracks);

    setFeedback(result.spokenFeedback);
    await voiceAssistant.speak(result.spokenFeedback);

    setIsProcessing(false);
    onExecuteResult(result);
    setTypedInput('');
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const triggerPromptChip = (chipText: string) => {
    setTypedInput(chipText);
    voiceAssistant.processCommand(chipText, allTracks).then(async (result) => {
      setFeedback(result.spokenFeedback);
      await voiceAssistant.speak(result.spokenFeedback);
      onExecuteResult(result);
      setTimeout(() => onClose(), 1200);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-lg flex items-center justify-center p-4">
      <div className="bg-[#101424] border border-amber-500/20 rounded-3xl w-full max-w-lg p-6 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
        {/* Divine glow ambient behind orb */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles size={14} />
          AI Hands-Free Voice Assistant
        </div>
        <h2 className="text-xl font-bold text-white mb-1">Mention Any Song or Message</h2>
        <p className="text-xs text-white/60 mb-6 max-w-sm">
          Say what you want to hear and Kadosh Motion will find and play it automatically.
        </p>

        {/* Glowing Orb / Microphone button */}
        <div className="relative mb-6">
          <button
            onClick={() => {
              if (isListening) {
                voiceAssistant.stopListening();
                setIsListening(false);
              } else {
                startListeningFlow();
              }
            }}
            className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500 relative cursor-pointer ${
              isListening
                ? 'bg-gradient-to-tr from-amber-500 to-rose-500 shadow-[0_0_50px_rgba(245,158,11,0.6)] scale-105'
                : 'bg-white/10 hover:bg-white/15 border border-white/20'
            }`}
          >
            {isListening ? (
              <Mic size={42} className="text-white animate-pulse" />
            ) : (
              <MicOff size={42} className="text-white/60" />
            )}

            {/* Ripple rings when listening */}
            {isListening && (
              <>
                <span className="absolute inset-0 rounded-full border-2 border-amber-400 animate-ping opacity-30" />
                <span className="absolute -inset-3 rounded-full border border-amber-400/50 animate-pulse" />
              </>
            )}
          </button>
        </div>

        {/* Live Status and Feedback */}
        <div className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 mb-4 min-h-[70px] flex flex-col items-center justify-center">
          <p className="text-sm font-medium text-white/90">
            {transcript ? `"${transcript}"` : statusMessage}
          </p>
          {feedback && (
            <div className="flex items-center gap-2 text-xs text-amber-300 font-semibold mt-2 animate-fade-in">
              <Volume2 size={14} />
              <span>{feedback}</span>
            </div>
          )}
        </div>

        {/* Quick Voice Chips */}
        <div className="w-full mb-5">
          <p className="text-[11px] font-medium text-white/40 mb-2 uppercase tracking-wider text-left">
            Try saying:
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              'Play Dancing Stars songs',
              'Play Bishop Dag on Loyalty',
              'Play Prayer Chants',
              'Play Sacred Worship',
              'Bishop Joshua Diligence message',
              'Set sleep timer for 30 min',
            ].map((chip) => (
              <button
                key={chip}
                onClick={() => triggerPromptChip(chip)}
                className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-amber-500/20 text-white/80 hover:text-amber-300 border border-white/10 hover:border-amber-500/30 transition-all text-left flex items-center gap-1.5 cursor-pointer"
              >
                <Play size={10} className="text-amber-400 shrink-0" />
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Fallback text input */}
        <form onSubmit={handleManualSubmit} className="w-full flex items-center gap-2">
          <input
            type="text"
            value={typedInput}
            onChange={(e) => setTypedInput(e.target.value)}
            placeholder="Or type song title or sermon..."
            className="flex-1 bg-white/5 border border-white/10 focus:border-amber-400 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!typedInput.trim() || isProcessing}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs flex items-center gap-1.5 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <Send size={14} />
            Ask AI
          </button>
        </form>
      </div>
    </div>
  );
};
