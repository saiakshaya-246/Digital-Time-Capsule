/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Calendar, Clock, Archive, Sparkles, Pin } from 'lucide-react';
import { Capsule, CapsuleVibe } from '../types';
import { playClick } from '../utils/audio';

interface CapsuleCardProps {
  key?: React.Key;
  capsule: Capsule;
  onOpen: (capsule: Capsule) => void;
  onArchive?: (id: string) => void;
}

export default function CapsuleCard({ capsule, onOpen, onArchive }: CapsuleCardProps) {
  const [timeRemaining, setTimeRemaining] = useState('');
  const [percentageElapsed, setPercentageElapsed] = useState(0);
  const [isLocked, setIsLocked] = useState(true);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const createTime = new Date(capsule.createdAt).getTime();
      const unlockTime = new Date(capsule.unlockAt).getTime();

      const totalDuration = unlockTime - createTime;
      const elapsed = now - createTime;
      const remaining = unlockTime - now;

      // Handle lock state
      if (remaining <= 0) {
        setIsLocked(false);
        setTimeRemaining('Ready to Unlock');
        setPercentageElapsed(100);
      } else {
        setIsLocked(true);
        setPercentageElapsed(
          Math.min(100, Math.max(0, (elapsed / totalDuration) * 100))
        );

        // Format countdown string
        const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

        const parts: string[] = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0 || days > 0) parts.push(`${hours}h`);
        if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}m`);
        parts.push(`${seconds}s`);

        setTimeRemaining(parts.join(' '));
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [capsule.unlockAt, capsule.createdAt]);

  const getVibeCardConfig = () => {
    switch (capsule.vibe) {
      case CapsuleVibe.NOSTALGIA:
        return {
          wrapperClass: 'border-l-brand-orange bg-white/[0.03] hover:bg-white/[0.07] border-y-white/5 border-r-white/5',
          badgeClass: 'text-brand-orange bg-brand-orange/10 border-brand-orange/20',
          progressBarClass: 'bg-brand-orange',
          label: 'Nostalgia',
          textAccent: 'text-brand-orange',
        };
      case CapsuleVibe.FUTURE_VISION:
        return {
          wrapperClass: 'border-l-cyan-400 bg-white/[0.03] hover:bg-white/[0.07] border-y-white/5 border-r-white/5',
          badgeClass: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
          progressBarClass: 'bg-cyan-400',
          label: 'Future Vision',
          textAccent: 'text-cyan-400',
        };
      case CapsuleVibe.LOVE_LETTER:
        return {
          wrapperClass: 'border-l-rose-400 bg-white/[0.03] hover:bg-white/[0.07] border-y-white/5 border-r-white/5',
          badgeClass: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
          progressBarClass: 'bg-rose-400',
          label: 'Love Letter',
          textAccent: 'text-rose-400',
        };
      case CapsuleVibe.DEEP_SECRET:
        return {
          wrapperClass: 'border-l-purple-400 bg-white/[0.03] hover:bg-white/[0.07] border-y-white/5 border-r-white/5',
          badgeClass: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
          progressBarClass: 'bg-purple-400',
          label: 'Deep Secret',
          textAccent: 'text-purple-400',
        };
      case CapsuleVibe.BIRTHDAY_WISH:
        return {
          wrapperClass: 'border-l-emerald-400 bg-white/[0.03] hover:bg-white/[0.07] border-y-white/5 border-r-white/5',
          badgeClass: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
          progressBarClass: 'bg-emerald-400',
          label: 'Birthday Wish',
          textAccent: 'text-emerald-400',
        };
    }
  };

  const cfg = getVibeCardConfig();

  return (
    <div
      id={`capsule-card-${capsule.id}`}
      className={`group relative p-6 border-l-2 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl flex flex-col justify-between ${
        cfg.wrapperClass
      } ${!isLocked ? 'ring-1 ring-white/10' : ''}`}
      onClick={() => {
        playClick(620, 0.015);
        onOpen(capsule);
      }}
    >
      {/* Unlocked background glows */}
      {!isLocked && (
        <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] to-transparent pointer-events-none" />
      )}

      <div>
        {/* Header Tags */}
        <div className="flex items-center justify-between mb-4 select-none">
          <span className={`text-[9px] font-sans font-bold uppercase tracking-widest px-2.5 py-1 rounded border ${cfg.badgeClass}`}>
            {cfg.label}
          </span>

          <div className="flex items-center gap-2">
            {capsule.pin && (
              <span className="text-zinc-500 hover:text-white transition-colors" title="PIN Protected">
                <Pin className="w-3.5 h-3.5 fill-current" />
              </span>
            )}
            
            {!isLocked ? (
              <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded">
                <Unlock className="w-2.5 h-2.5" />
                Unsealed
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-zinc-500 bg-zinc-800/40 border border-white/5 px-2 py-0.5 rounded">
                <Lock className="w-2.5 h-2.5" />
                Sealed
              </span>
            )}
          </div>
        </div>

        {/* Title styled in Elegant Playfair display serif */}
        <h4 className="font-serif text-xl italic text-white group-hover:text-brand-orange transition-colors duration-200 line-clamp-2 mb-2 leading-snug">
          {capsule.title}
        </h4>

        {/* Creation Date description */}
        <p className="text-xs text-zinc-400 flex items-center gap-1.5 mb-5 select-none">
          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
          <span>Sealed {new Date(capsule.createdAt).toLocaleDateString()}</span>
        </p>
      </div>

      {/* Progress Track and Info */}
      <div className="mt-auto">
        {isLocked ? (
          <div className="flex flex-col gap-2">
            {/* Countdown line */}
            <div className="flex justify-between items-baseline text-[10px] font-sans uppercase tracking-wider font-semibold text-zinc-400 group-hover:text-zinc-200 transition-colors">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-zinc-500" />
                Unlocks in:
              </span>
              <span className="font-mono text-xs font-bold text-white bg-white/5 px-1.5 py-0.5 rounded">
                {timeRemaining}
              </span>
            </div>

            {/* Flat progress bar */}
            <div className="h-1 w-full bg-white/10 overflow-hidden rounded-full">
              <div
                className={`h-full ${cfg.progressBarClass} transition-all duration-1000`}
                style={{ width: `${percentageElapsed}%` }}
              />
            </div>

            {/* Percentage indicator */}
            <div className="flex justify-between text-[9px] font-mono tracking-wider text-zinc-500">
              <span>{Math.round(percentageElapsed)}% Completed</span>
              <span>Locked Tight</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-emerald-400 mt-2 border-t border-white/5 pt-3">
            <span className="font-serif italic text-xs">Ready to be unsealed!</span>
            <span className="text-[9px] font-sans font-black uppercase tracking-widest bg-emerald-500 text-black px-2.5 py-1 rounded shadow-md group-hover:scale-105 transition-all">
              REVEAL MEMORY
            </span>
          </div>
        )}
      </div>

      {/* Permanently Archive Action overlay */}
      {onArchive && (
        <button
          type="button"
          id={`archive-btn-${capsule.id}`}
          onClick={(e) => {
            e.stopPropagation();
            playClick(400, 0.05);
            onArchive(capsule.id);
          }}
          className="absolute -top-1.5 -right-1.5 bg-zinc-900 border border-white/10 p-1.5 rounded-full shadow-lg text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-10 hover:scale-110"
          title="Delete Capsule"
        >
          <Archive className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
