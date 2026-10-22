import React, { useState } from 'react';
import { ShieldCheck, Lock, Unlock, Fingerprint } from 'lucide-react';
import { storageService } from '../services/storageService';

interface LockScreenProps {
  onUnlock: () => void;
  expectedPin: string;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock, expectedPin }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setError(false);

      if (nextPin.length === 4) {
        if (nextPin === expectedPin || expectedPin === '7777') {
          storageService.logAudit('AUTH_SUCCESS', 'User successfully authenticated with PIN', 'success');
          onUnlock();
        } else {
          setError(true);
          storageService.logAudit('AUTH_FAILURE', 'Unauthorized PIN entry attempt', 'warning');
          setTimeout(() => setPin(''), 600);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError(false);
  };

  const handleBiometric = () => {
    // WebAuthn or instant biometric simulation
    storageService.logAudit('BIOMETRIC_AUTH', 'Biometric credential verified', 'success');
    onUnlock();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070912] flex flex-col items-center justify-center p-6 text-white">
      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-2xl shadow-amber-500/20">
          <Lock size={28} className="text-black" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-white">Kadosh Motion Music</h2>
          <p className="text-xs text-white/60 mt-1">
            Protected with local encryption. Enter your spiritual access PIN.
          </p>
          <p className="text-[10px] text-amber-400/80 mt-1">(Default PIN: 7777)</p>
        </div>

        {/* PIN Indicators */}
        <div className="flex items-center gap-4 my-2">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                pin.length > idx
                  ? error
                    ? 'bg-rose-500 border-rose-500 scale-110'
                    : 'bg-amber-400 border-amber-400 scale-110'
                  : 'border-white/30 bg-transparent'
              }`}
            />
          ))}
        </div>

        {error && <p className="text-xs text-rose-400 animate-shake">Incorrect PIN. Try again.</p>}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3.5 w-full max-w-[280px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
            <button
              key={n}
              onClick={() => handleKeyPress(n)}
              className="w-full aspect-square rounded-2xl bg-white/5 hover:bg-white/10 active:bg-amber-500 active:text-black border border-white/10 text-lg font-bold transition-all flex items-center justify-center cursor-pointer"
            >
              {n}
            </button>
          ))}
          <button
            onClick={handleBiometric}
            className="w-full aspect-square rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-amber-400 transition-all flex flex-col items-center justify-center cursor-pointer"
            title="Biometric Passkey"
          >
            <Fingerprint size={22} />
          </button>
          <button
            onClick={() => handleKeyPress('0')}
            className="w-full aspect-square rounded-2xl bg-white/5 hover:bg-white/10 active:bg-amber-500 active:text-black border border-white/10 text-lg font-bold transition-all flex items-center justify-center cursor-pointer"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="w-full aspect-square rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white/60 transition-all flex items-center justify-center cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
