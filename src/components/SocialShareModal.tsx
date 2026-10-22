import React, { useState } from 'react';
import { Track } from '../types';
import { Share2, Copy, Check, X, MessageSquare, Send, Globe, Heart } from 'lucide-react';

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
}

export const SocialShareModal: React.FC<SocialShareModalProps> = ({ isOpen, onClose, track }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !track) return null;

  const shareText = `Listening to "${track.title}" by ${track.artist} on Kadosh Motion Christian Music & Messages!\n${track.keyScripture || 'Come before His presence with singing!'}\nListen together: ${window.location.origin}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: track.title,
          text: `Listening to "${track.title}" by ${track.artist} - Kadosh Motion`,
          url: window.location.href,
        });
      } catch {}
    } else {
      handleCopyLink();
    }
  };

  const handleWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
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
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Share2 size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Share Song &amp; Message</h2>
            <p className="text-xs text-white/60">Invite friends to listen, worship, and grow together</p>
          </div>
        </div>

        {/* Share Preview Card */}
        <div className="p-4 bg-gradient-to-br from-amber-500/10 via-purple-500/10 to-blue-500/10 border border-white/15 rounded-2xl mb-5">
          <div className="flex items-center gap-2 text-amber-400 text-[10px] font-bold uppercase tracking-wider mb-2">
            <Heart size={12} fill="currentColor" />
            <span>Kadosh Motion Music</span>
          </div>
          <p className="text-sm font-bold text-white mb-1">{track.title}</p>
          <p className="text-xs text-white/70 mb-2">{track.artist} &bull; {track.category.replace('_', ' ').toUpperCase()}</p>
          {track.keyScripture && (
            <p className="text-[11px] italic text-amber-300/80 bg-black/30 p-2 rounded-lg border border-white/5">
              "{track.keyScripture}"
            </p>
          )}
        </div>

        {/* Social Platforms */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          <button
            onClick={handleWhatsApp}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 transition-all cursor-pointer"
          >
            <MessageSquare size={20} className="mb-1" />
            <span className="text-xs font-semibold">WhatsApp</span>
          </button>

          <button
            onClick={handleTelegram}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/30 text-sky-300 transition-all cursor-pointer"
          >
            <Send size={20} className="mb-1" />
            <span className="text-xs font-semibold">Telegram</span>
          </button>

          <button
            onClick={handleTwitter}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 transition-all cursor-pointer"
          >
            <Globe size={20} className="mb-1" />
            <span className="text-xs font-semibold">X (Twitter)</span>
          </button>
        </div>

        {/* Copy Link input */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-2 mb-4">
          <input
            type="text"
            readOnly
            value={window.location.href}
            className="flex-1 bg-transparent text-xs text-white/80 px-2 outline-none truncate"
          />
          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {/* Native Web Share button */}
        <button
          onClick={handleNativeShare}
          className="w-full py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-xl border border-white/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <Share2 size={15} />
          More Share Options
        </button>
      </div>
    </div>
  );
};
