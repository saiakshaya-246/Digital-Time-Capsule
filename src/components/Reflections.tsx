/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, Calendar, Lock, Unlock, HelpCircle, FileText, Share2, Archive } from 'lucide-react';
import { Capsule, CapsuleVibe, ReflectionPrompt } from '../types';
import { playClick } from '../utils/audio';

interface ReflectionsProps {
  capsules: Capsule[];
  onSelectPrompt: (text: string) => void;
}

const REFLECTION_PROMPTS: ReflectionPrompt[] = [
  {
    id: 'future-self',
    category: 'Future Self',
    text: 'To my future self: Where do you see yourself exactly 1 year from now? What are you working towards, and what is your current daily routine?',
    placeholder: 'Write a heartfelt letter to the person you are becoming...',
  },
  {
    id: 'worry',
    category: 'Vulnerability',
    text: 'What is your biggest current worry or anxiety right now? Write it down completely, and look back later to see how you overcame it.',
    placeholder: 'Acknowledge your fears, knowing they are temporary...',
  },
  {
    id: 'favorite-memory',
    category: 'Gratitude',
    text: 'Describe your favorite memory from this past week in rich, visceral detail. Who was there? What did it smell, look, and sound like?',
    placeholder: 'Capture a fleeting moment of pure happiness...',
  },
  {
    id: 'soundtrack',
    category: 'Culture',
    text: 'What song is currently on repeat in your headphones? What movie or book is inspiring you right now? List your current favorite things.',
    placeholder: 'Freeze-frame your current tastes and favorite sounds...',
  },
  {
    id: 'three-questions',
    category: 'Curiosity',
    text: 'If you could ask your future self three critical questions, what would they be? Ask them here and find out if you got the answers.',
    placeholder: '1. Are you still...? 2. Did you ever...? 3. ...',
  },
  {
    id: 'secret-goal',
    category: 'Ambition',
    text: 'Write down a secret aspiration or goal that you have not shared with a single soul. Seal it until it has already blossomed.',
    placeholder: 'Whisper your biggest, quietest dreams to the future...',
  },
];

export default function Reflections({ capsules, onSelectPrompt }: ReflectionsProps) {
  // Compute Stats
  const totalSealed = capsules.length;
  const totalLocked = capsules.filter(c => !c.isUnlocked && new Date(c.unlockAt) > new Date()).length;
  const totalUnlocked = totalSealed - totalLocked;

  const vibeDistribution = capsules.reduce((acc, c) => {
    acc[c.vibe] = (acc[c.vibe] || 0) + 1;
    return acc;
  }, {} as Record<CapsuleVibe, number>);

  const getVibeColor = (vibe: CapsuleVibe) => {
    switch (vibe) {
      case CapsuleVibe.NOSTALGIA: return 'bg-brand-orange';
      case CapsuleVibe.FUTURE_VISION: return 'bg-cyan-400';
      case CapsuleVibe.LOVE_LETTER: return 'bg-rose-400';
      case CapsuleVibe.DEEP_SECRET: return 'bg-purple-400';
      case CapsuleVibe.BIRTHDAY_WISH: return 'bg-emerald-400';
    }
  };

  const getVibeLabel = (vibe: CapsuleVibe) => {
    switch (vibe) {
      case CapsuleVibe.NOSTALGIA: return 'Nostalgia';
      case CapsuleVibe.FUTURE_VISION: return 'Future Vision';
      case CapsuleVibe.LOVE_LETTER: return 'Love Letter';
      case CapsuleVibe.DEEP_SECRET: return 'Secret';
      case CapsuleVibe.BIRTHDAY_WISH: return 'Birthday Wish';
    }
  };

  return (
    <div id="reflections-dashboard" className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto">
      
      {/* Prompts Section (Left 7 cols) */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        <div className="border-b border-white/5 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-brand-orange animate-pulse" />
            <h2 className="font-serif text-2xl font-bold text-white italic tracking-tight">Reflection Prompts</h2>
          </div>
          <p className="text-xs font-sans text-zinc-400 leading-relaxed">
            Stuck on what to write to the future? Click any prompt below to automatically pre-fill its text into a new capsule letter.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {REFLECTION_PROMPTS.map((prompt) => (
            <button
              key={prompt.id}
              id={`prompt-btn-${prompt.id}`}
              onClick={() => {
                playClick(550, 0.03);
                onSelectPrompt(prompt.text);
              }}
              className="text-left bg-white/[0.02] border border-white/5 hover:border-brand-orange/40 hover:bg-white/[0.04] hover:-translate-y-0.5 rounded-xl p-4 transition-all duration-300 group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[8px] font-sans font-black uppercase tracking-[0.15em] text-brand-orange bg-brand-orange/10 px-2.5 py-0.5 rounded border border-brand-orange/20">
                  {prompt.category}
                </span>
                <span className="text-[9px] font-serif italic text-zinc-500 group-hover:text-brand-orange transition-colors">
                  Click to pre-fill letter →
                </span>
              </div>
              <p className="font-serif text-sm text-zinc-300 group-hover:text-white transition-colors leading-relaxed italic">
                "{prompt.text}"
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Section (Right 5 cols) */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        <div className="border-b border-white/5 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-5 h-5 text-brand-orange" />
            <h2 className="font-serif text-2xl font-bold text-white italic tracking-tight">Vault Insights</h2>
          </div>
          <p className="text-xs font-sans text-zinc-400">
            A comprehensive look at your sealed history and memory distribution.
          </p>
        </div>

        {/* Big numbers */}
        <div className="bg-[#17171C] border border-white/10 rounded-2xl p-6 grid grid-cols-3 gap-4 text-center">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-zinc-300 mb-2.5">
              <FileText className="w-4 h-4 text-brand-orange" />
            </div>
            <span className="text-2xl font-serif font-black text-white">{totalSealed}</span>
            <span className="text-[9px] font-sans uppercase tracking-[0.15em] text-zinc-500 font-bold mt-1">Total</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-zinc-300 mb-2.5">
              <Lock className="w-4 h-4 text-red-400" />
            </div>
            <span className="text-2xl font-serif font-black text-white">{totalLocked}</span>
            <span className="text-[9px] font-sans uppercase tracking-[0.15em] text-zinc-500 font-bold mt-1">Locked</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-zinc-300 mb-2.5">
              <Unlock className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-2xl font-serif font-black text-white">{totalUnlocked}</span>
            <span className="text-[9px] font-sans uppercase tracking-[0.15em] text-zinc-500 font-bold mt-1">Unlocked</span>
          </div>
        </div>

        {/* Distribution track chart */}
        <div className="bg-[#17171C] border border-white/10 rounded-2xl p-6 shadow-xl">
          <h3 className="font-serif italic text-base text-white mb-4">Vibe Distributions</h3>
          {totalSealed === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center select-none">
              <HelpCircle className="w-8 h-8 text-zinc-700 mb-2.5 animate-bounce" />
              <p className="text-xs font-serif italic text-zinc-500">No capsules sealed yet. Create one to visualize!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {Object.values(CapsuleVibe).map((vibe) => {
                const count = vibeDistribution[vibe] || 0;
                const percentage = totalSealed > 0 ? (count / totalSealed) * 100 : 0;
                return (
                  <div key={vibe} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-serif text-zinc-300 italic">{getVibeLabel(vibe)}</span>
                      <span className="font-mono text-zinc-500 text-[11px]">{count} ({Math.round(percentage)}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/5">
                      <div
                        className={`h-full ${getVibeColor(vibe)} transition-all duration-1000`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Nostalgia Quote Card */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 text-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-orange/5 rounded-full -mr-8 -mt-8 pointer-events-none group-hover:scale-125 transition-transform duration-500" />
          <p className="font-serif text-sm italic text-zinc-300 leading-relaxed relative z-10">
            "Time is a flat circle, but memories are the landmarks we paint upon it. To write a letter to the future is an act of pure, courageous hope."
          </p>
          <div className="h-px w-8 bg-white/10 mx-auto my-3.5" />
          <p className="text-[9px] font-sans uppercase tracking-[0.2em] text-zinc-500 font-bold relative z-10">
            Chronicles of Memoria
          </p>
        </div>

      </div>
    </div>
  );
}
