/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Lock, Unlock, Clock, Key, VolumeX, X, Printer, RefreshCw, Pin, 
  Calendar, Eye, Volume2, Share2, HelpCircle 
} from 'lucide-react';
import { Capsule, CapsuleVibe } from '../types';
import { playClick, playLockedShake, playUnlockSuccess, startAmbient, stopAmbient } from '../utils/audio';

interface CapsuleViewerProps {
  capsule: Capsule;
  onClose: () => void;
  onUnlockedInRealtime: (id: string) => void;
}

export default function CapsuleViewer({ capsule, onClose, onUnlockedInRealtime }: CapsuleViewerProps) {
  const [safeWheelRotation, setSafeWheelRotation] = useState(0);
  const [pinInput, setPinInput] = useState('');
  const [isPinVerified, setIsPinVerified] = useState(!capsule.pin);
  const [shakeSafe, setShakeSafe] = useState(false);
  const [shakePin, setShakePin] = useState(false);
  const [countdownString, setCountdownString] = useState('');
  const [timeStateLocked, setTimeStateLocked] = useState(true);

  // Sound control
  const [isSoundMuted, setIsSoundMuted] = useState(false);

  // Format real-time countdown inside viewer
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const unlockTime = new Date(capsule.unlockAt).getTime();
      const remaining = unlockTime - now;

      if (remaining <= 0) {
        setTimeStateLocked(false);
        // Automatically unlock in parent state when it triggers in viewer real-time!
        if (!capsule.isUnlocked) {
          onUnlockedInRealtime(capsule.id);
        }
      } else {
        setTimeStateLocked(true);
        const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

        setCountdownString(
          `${days > 0 ? `${days} days, ` : ''}${hours}h : ${minutes}m : ${seconds}s`
        );
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [capsule.unlockAt, capsule.id, capsule.isUnlocked, onUnlockedInRealtime]);

  // Start sound loop once PIN is verified and capsule is fully open
  useEffect(() => {
    if (!timeStateLocked && isPinVerified) {
      playUnlockSuccess();
      if (!isSoundMuted && capsule.ambientSound !== 'none') {
        // Stagger sound start slightly for organic feel
        const timer = setTimeout(() => {
          startAmbient(capsule.ambientSound, 0.18);
        }, 1000);
        return () => {
          clearTimeout(timer);
          stopAmbient();
        };
      }
    }
    return () => stopAmbient();
  }, [timeStateLocked, isPinVerified, capsule.ambientSound, isSoundMuted]);

  // Spin the mechanical safe wheel
  const handleSpinSafeWheel = () => {
    playClick(150 + Math.random() * 200, 0.03);
    const delta = 45 + Math.floor(Math.random() * 90);
    setSafeWheelRotation((prev) => prev + delta);

    if (timeStateLocked) {
      // Shaker effect representing locked seals
      playLockedShake();
      setShakeSafe(true);
      setTimeout(() => setShakeSafe(false), 500);
    }
  };

  // Keypad actions
  const handleKeyPress = (num: string) => {
    if (pinInput.length >= 4) return;
    playClick(400 + Number(num) * 50, 0.02);
    setPinInput((prev) => prev + num);
  };

  const handleClearPin = () => {
    playClick(300, 0.05);
    setPinInput('');
  };

  const handleVerifyPin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pinInput === capsule.pin) {
      playUnlockSuccess();
      setIsPinVerified(true);
    } else {
      playLockedShake();
      setShakePin(true);
      setPinInput('');
      setTimeout(() => setShakePin(false), 500);
    }
  };

  const toggleMute = () => {
    playClick(600, 0.015);
    if (isSoundMuted) {
      setIsSoundMuted(false);
      startAmbient(capsule.ambientSound, 0.18);
    } else {
      setIsSoundMuted(true);
      stopAmbient();
    }
  };

  const handlePrint = () => {
    playClick();
    window.print();
  };

  const handleShare = () => {
    playClick(800, 0.03);
    if (navigator.share) {
      navigator.share({
        title: capsule.title,
        text: capsule.message,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`"${capsule.title}"\n${capsule.message}`);
      alert('Memory copied to clipboard! Share it with your friends.');
    }
  };

  // Vibe specific theme configurations (Artistic Dark layouts)
  const getVibeTheme = () => {
    switch (capsule.vibe) {
      case CapsuleVibe.NOSTALGIA:
        return {
          bgClass: 'bg-[#17171C]/98 border-white/10 text-[#E8E8E8] font-serif',
          cardHeaderClass: 'border-white/5 text-white bg-white/[0.02]',
          paperClass: 'bg-white/[0.03] border border-white/5 shadow-inner rounded-xl font-serif p-6 italic leading-loose text-white/90 whitespace-pre-line text-lg relative',
          badgeClass: 'bg-brand-orange/15 text-brand-orange border-brand-orange/30',
          titleFont: 'font-serif tracking-tight text-3xl text-white font-bold italic',
          extraDecorator: (
            <div className="absolute inset-0 pointer-events-none opacity-5 mix-blend-overlay bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:16px_16px]" />
          )
        };
      case CapsuleVibe.FUTURE_VISION:
        return {
          bgClass: 'bg-[#0F0F11]/98 border-cyan-500/30 text-cyan-400 font-mono',
          cardHeaderClass: 'border-cyan-500/20 text-cyan-400 bg-cyan-950/40',
          paperClass: 'bg-black/50 border border-cyan-500/20 shadow-md rounded-xl font-mono p-6 leading-relaxed whitespace-pre-line text-sm relative text-cyan-300',
          badgeClass: 'bg-cyan-950 text-cyan-400 border-cyan-500/20',
          titleFont: 'font-mono uppercase tracking-widest text-2xl text-cyan-400 font-bold',
          extraDecorator: (
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,rgba(18,16,16,0)+50%,rgba(0,0,0,0.25)+50%),linear-gradient(to_right,rgba(255,0,0,0.06)+33%,rgba(0,255,0,0.02)+33%,rgba(0,0,255,0.06)+66%)] [background-size:100%_4px,6px_100%] z-10 opacity-30" />
          )
        };
      case CapsuleVibe.LOVE_LETTER:
        return {
          bgClass: 'bg-[#17171C]/98 border-rose-300/20 text-rose-200 font-serif',
          cardHeaderClass: 'border-rose-950/20 text-rose-300 bg-rose-950/35',
          paperClass: 'bg-rose-500/5 border border-rose-200/10 shadow-inner rounded-xl font-serif p-6 leading-relaxed whitespace-pre-line text-lg relative text-rose-300 italic',
          badgeClass: 'bg-rose-950 text-rose-400 border-rose-900/30',
          titleFont: 'font-serif italic text-3xl text-rose-300 font-bold',
          extraDecorator: (
            <div className="absolute inset-0 pointer-events-none flex justify-center items-center opacity-[0.03] select-none text-[200px]">♥</div>
          )
        };
      case CapsuleVibe.DEEP_SECRET:
        return {
          bgClass: 'bg-zinc-950/98 border-zinc-800 text-zinc-300 font-serif',
          cardHeaderClass: 'border-zinc-800 text-zinc-300 bg-zinc-900/40',
          paperClass: 'bg-zinc-900/30 border border-zinc-800 shadow-lg rounded-xl font-serif p-6 leading-relaxed whitespace-pre-line text-base text-zinc-200 relative',
          badgeClass: 'bg-zinc-900 text-zinc-400 border-zinc-700/30',
          titleFont: 'font-serif uppercase tracking-widest text-2xl text-zinc-100 font-bold',
          extraDecorator: (
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-gradient-to-t from-zinc-950 to-transparent" />
          )
        };
      case CapsuleVibe.BIRTHDAY_WISH:
        return {
          bgClass: 'bg-[#17171C]/98 border-emerald-500/20 text-emerald-300 font-sans',
          cardHeaderClass: 'border-emerald-950/20 text-emerald-400 bg-emerald-950/30',
          paperClass: 'bg-emerald-500/5 border border-emerald-500/10 shadow-sm rounded-xl font-sans p-6 leading-relaxed whitespace-pre-line text-lg text-emerald-300 relative',
          badgeClass: 'bg-emerald-950 text-emerald-400 border-emerald-500/20',
          titleFont: 'font-sans font-black tracking-tight text-3xl text-emerald-300',
          extraDecorator: null
        };
    }
  };

  const theme = getVibeTheme();

  return (
    <div id="capsule-fullscreen-viewer" className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto selection:bg-brand-orange selection:text-white">
      
      {/* CASE 1: CAPSULE STILL SECURED & COUNTING DOWN */}
      {timeStateLocked && (
        <div 
          id="locked-vault-screen"
          className={`w-full max-w-md bg-[#17171C] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden transition-all duration-300 ${
            shakeSafe ? 'animate-shake' : ''
          }`}
          style={{ animationDuration: '0.4s' }}
        >
          {/* Close button */}
          <button 
            id="close-vault-btn"
            onClick={() => { playClick(); onClose(); }}
            className="absolute top-4 right-4 bg-white/5 hover:bg-white/10 border border-white/5 p-2 rounded-full text-zinc-400 hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Locked Icon Badge */}
          <div className="flex flex-col items-center text-center mb-6 mt-2 select-none">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-500 shadow-lg mb-4">
              <Lock className="w-7 h-7 animate-pulse" />
            </div>
            <h3 className="font-serif text-2xl italic text-white tracking-tight leading-snug">{capsule.title}</h3>
            <p className="text-[10px] font-sans font-black uppercase tracking-[0.2em] text-brand-orange mt-2">
              Sealed Temporarily
            </p>
          </div>

          {/* Mechanical Safe Wheel Dial */}
          <div className="flex flex-col items-center gap-2.5 mb-8 select-none">
            <p className="text-[9px] font-sans font-bold uppercase tracking-[0.15em] text-zinc-500">
              Safe lock dialwheel (click to test seal)
            </p>
            <button
              type="button"
              id="spin-vault-dial-btn"
              onClick={handleSpinSafeWheel}
              style={{ transform: `rotate(${safeWheelRotation}deg)` }}
              className="w-40 h-40 rounded-full bg-gradient-to-tr from-zinc-700 via-zinc-800 to-zinc-900 border-[6px] border-zinc-700 shadow-2xl flex items-center justify-center cursor-pointer transition-transform duration-300 relative focus:outline-none"
            >
              <div className="absolute inset-3 rounded-full border-2 border-dashed border-zinc-600/80 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-zinc-800 border border-zinc-700 shadow-inner flex items-center justify-center text-zinc-500 font-mono text-[9px] font-bold uppercase tracking-widest">
                  MEMORIA
                </div>
              </div>
              {/* Dial Notch Indicator */}
              <div className="absolute top-2 w-1.5 h-6 bg-brand-orange rounded-full" />
            </button>
          </div>

          {/* Real-time Locked timer details */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 text-center select-none">
            <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-zinc-400 flex items-center justify-center gap-1.5 mb-1.5">
              <Clock className="w-4 h-4 text-brand-orange" />
              Sealed lock releases in:
            </span>
            <p className="font-mono text-xl font-bold text-brand-orange tracking-wider">
              {countdownString}
            </p>
            <div className="h-px w-8 bg-white/10 mx-auto my-3" />
            <p className="text-xs font-serif italic text-zinc-400 leading-normal">
              A chronological locks system binds this digital capsule. It cannot be accessed until the timer expires.
            </p>
          </div>
        </div>
      )}

      {/* CASE 2: UNLOCKED BUT PIN-PROTECTED */}
      {!timeStateLocked && !isPinVerified && (
        <div 
          id="pin-entry-screen"
          className={`w-full max-w-sm bg-[#17171C] border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden transition-all duration-300 ${
            shakePin ? 'animate-shake' : ''
          }`}
          style={{ animationDuration: '0.4s' }}
        >
          {/* Close button */}
          <button 
            id="close-pin-btn"
            onClick={() => { playClick(); onClose(); }}
            className="absolute top-4 right-4 bg-white/5 hover:bg-white/10 border border-white/5 p-2 rounded-full text-zinc-400 hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col items-center text-center mb-6 select-none">
            <div className="w-12 h-12 rounded-full bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center text-brand-orange shadow-lg mb-3">
              <Key className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-xl italic text-white tracking-tight">Enter Security PIN</h3>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-[240px] mt-1">
              "{capsule.title}" is unlocked, but protected with a private security key.
            </p>
          </div>

          {/* Screen Display Pin Dots */}
          <div className="bg-black/40 border border-white/5 rounded-2xl p-4 mb-6 text-center select-none">
            <div className="flex justify-center gap-3">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full border transition-all ${
                    pinInput.length > idx 
                      ? 'bg-brand-orange border-brand-orange scale-110 shadow-sm shadow-brand-orange' 
                      : 'bg-white/5 border-white/10'
                  }`}
                />
              ))}
            </div>
            {shakePin && (
              <p className="text-[9px] font-sans uppercase font-black tracking-widest text-red-400 mt-2.5">
                Access Denied! Incorrect PIN.
              </p>
            )}
          </div>

          {/* Mechanical Grid Keypad */}
          <div className="grid grid-cols-3 gap-3 mb-4 select-none">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                id={`keypad-${num}`}
                onClick={() => handleKeyPress(num)}
                className="bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/5 py-3.5 rounded-xl font-mono text-lg font-bold text-[#E8E8E8] transition-all cursor-pointer shadow-sm"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              id="keypad-clear"
              onClick={handleClearPin}
              className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 py-3.5 rounded-xl font-sans text-[11px] font-black uppercase tracking-wider text-red-400 transition-all cursor-pointer"
            >
              CLEAR
            </button>
            <button
              type="button"
              id="keypad-0"
              onClick={() => handleKeyPress('0')}
              className="bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/5 py-3.5 rounded-xl font-mono text-lg font-bold text-[#E8E8E8] transition-all cursor-pointer"
            >
              0
            </button>
            <button
              type="button"
              id="keypad-enter"
              onClick={() => handleVerifyPin()}
              disabled={pinInput.length !== 4}
              className="bg-brand-orange hover:bg-brand-orange-hover text-white py-3.5 rounded-xl font-sans text-[11px] font-black uppercase tracking-wider transition-all disabled:opacity-30 disabled:hover:bg-brand-orange cursor-pointer"
            >
              ENTER
            </button>
          </div>
        </div>
      )}

      {/* CASE 3: CAPSULE UNLOCKED & FULLY DISPLAYED */}
      {!timeStateLocked && isPinVerified && (
        <div 
          id="memory-unlocked-canvas"
          className={`w-full max-w-3xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative ${theme.bgClass}`}
        >
          {theme.extraDecorator}

          {/* Card action controls header bar */}
          <div className={`px-6 py-4.5 border-b flex items-center justify-between ${theme.cardHeaderClass}`}>
            <div className="flex items-center gap-2 select-none">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
              <span className="text-[10px] font-sans font-bold uppercase tracking-[0.15em] text-zinc-300">
                Memory Seal Opened Successfully
              </span>
            </div>

            {/* Utility buttons */}
            <div className="flex items-center gap-2 z-10">
              {/* Sound controller */}
              {capsule.ambientSound !== 'none' && (
                <button
                  type="button"
                  id="mute-unlocked-btn"
                  onClick={toggleMute}
                  className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
                  title={isSoundMuted ? 'Play soundscape' : 'Mute soundscape'}
                >
                  {isSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-brand-orange animate-bounce" />}
                </button>
              )}

              <button
                type="button"
                id="print-unlocked-btn"
                onClick={handlePrint}
                className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
                title="Print memory letter"
              >
                <Printer className="w-4 h-4" />
              </button>

              <button
                type="button"
                id="share-unlocked-btn"
                onClick={handleShare}
                className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
                title="Share memory"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <span className="w-px h-5 bg-white/10 mx-1" />

              <button
                type="button"
                id="close-unlocked-btn"
                onClick={() => { playClick(); onClose(); }}
                className="p-2 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500 text-red-200 hover:text-white transition-all cursor-pointer"
                title="Close viewer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-6 md:p-10 max-h-[75vh] overflow-y-auto flex flex-col gap-8">
            
            {/* Memory Header Details */}
            <div className="flex flex-col gap-2 border-b border-white/5 pb-4">
              <span className={`self-start text-[9px] font-sans font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded ${theme.badgeClass}`}>
                {capsule.vibe} vibe
              </span>
              <h2 className={theme.titleFont}>{capsule.title}</h2>
              
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-zinc-400 font-sans mt-1">
                <span className="flex items-center gap-1.5 select-none">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  Sealed on {new Date(capsule.createdAt).toLocaleDateString()} at {new Date(capsule.createdAt).toLocaleTimeString()}
                </span>
                <span className="flex items-center gap-1.5 select-none">
                  <Unlock className="w-3.5 h-3.5 text-brand-orange" />
                  Unsealed on {new Date(capsule.unlockAt).toLocaleDateString()} at {new Date(capsule.unlockAt).toLocaleTimeString()}
                </span>
              </div>
            </div>

            {/* Letter Paper Body */}
            <div className={theme.paperClass}>
              <p className="relative z-10 leading-relaxed font-light">{capsule.message}</p>
            </div>

            {/* Media KeepSake Attachments */}
            {(capsule.drawing || capsule.attachedImage) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-white/5 pt-6">
                
                {/* Sketch kept */}
                {capsule.drawing && (
                  <div className="flex flex-col gap-2.5">
                    <span className="text-[10px] font-sans font-black uppercase tracking-[0.15em] text-zinc-500">
                      Handdrawn Keepsake sketch
                    </span>
                    <div className="bg-black/40 border border-white/10 p-3.5 rounded-2xl shadow-lg aspect-[8/5] flex items-center justify-center overflow-hidden">
                      <img
                        src={capsule.drawing}
                        alt="Handdrawn KeepSake"
                        className="max-h-full max-w-full object-contain rounded"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                )}

                {/* Attached Photo kept */}
                {capsule.attachedImage && (
                  <div className="flex flex-col gap-2.5">
                    <span className="text-[10px] font-sans font-black uppercase tracking-[0.15em] text-zinc-500">
                      Attached Photographic keepsake
                    </span>
                    <div className="bg-black/40 border border-white/10 p-3.5 rounded-2xl shadow-lg aspect-[8/5] flex items-center justify-center overflow-hidden">
                      <img
                        src={capsule.attachedImage}
                        alt="Photographic KeepSake"
                        className="max-h-full max-w-full object-contain rounded animate-fade-in"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footnotes */}
          <div className="px-6 py-4.5 bg-black/40 border-t border-white/5 text-center text-[10px] tracking-wide text-zinc-500 font-serif select-none italic">
            "We preserve the past not to remain static, but to empower our stride into the future."
          </div>
        </div>
      )}
    </div>
  );
}
