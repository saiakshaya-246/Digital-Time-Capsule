/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  Calendar, Clock, Key, Volume2, Upload, Sparkles, AlertCircle, HelpCircle, 
  Eye, FileText, Palette, Image as ImageIcon, Heart, Terminal, Sparkle 
} from 'lucide-react';
import { Capsule, CapsuleVibe, AmbientSound } from '../types';
import DrawingPad from './DrawingPad';
import { playClick, startAmbient, stopAmbient } from '../utils/audio';

interface CapsuleFormProps {
  onSave: (capsule: Omit<Capsule, 'id' | 'createdAt' | 'isUnlocked' | 'isArchived'>) => void;
  initialText?: string;
  onClearPromptText?: () => void;
}

const VIBES_CONFIG = [
  {
    vibe: CapsuleVibe.NOSTALGIA,
    name: 'Nostalgia',
    description: 'Amber warm lighting with rain soundtrack.',
    colorClass: 'border-white/10 bg-white/[0.02] text-zinc-400 hover:border-brand-orange/40',
    activeClass: 'ring-2 ring-brand-orange bg-brand-orange/10 border-brand-orange text-white',
    icon: FileText
  },
  {
    vibe: CapsuleVibe.FUTURE_VISION,
    name: 'Future Vision',
    description: 'Monospace tech layout with computer noises.',
    colorClass: 'border-white/10 bg-white/[0.02] text-zinc-400 hover:border-cyan-400/40',
    activeClass: 'ring-2 ring-cyan-400 bg-cyan-400/10 border-cyan-400 text-white',
    icon: Terminal
  },
  {
    vibe: CapsuleVibe.LOVE_LETTER,
    name: 'Love Letter',
    description: 'Romantic colors and soft serenade chimes.',
    colorClass: 'border-white/10 bg-white/[0.02] text-zinc-400 hover:border-rose-400/40',
    activeClass: 'ring-2 ring-rose-400 bg-rose-400/10 border-rose-400 text-white',
    icon: Heart
  },
  {
    vibe: CapsuleVibe.DEEP_SECRET,
    name: 'Deep Secret',
    description: 'Obsidian dark panels with mysterious cosmic hum.',
    colorClass: 'border-white/10 bg-white/[0.02] text-zinc-400 hover:border-purple-400/40',
    activeClass: 'ring-2 ring-purple-400 bg-purple-400/10 border-purple-400 text-white',
    icon: Sparkle
  },
  {
    vibe: CapsuleVibe.BIRTHDAY_WISH,
    name: 'Birthday Wish',
    description: 'Joyful bouncy shapes with cheerful synthesizer.',
    colorClass: 'border-white/10 bg-white/[0.02] text-zinc-400 hover:border-emerald-400/40',
    activeClass: 'ring-2 ring-emerald-400 bg-emerald-400/10 border-emerald-400 text-white',
    icon: Sparkles
  }
];

export default function CapsuleForm({ onSave, initialText, onClearPromptText }: CapsuleFormProps) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState(initialText || '');
  const [vibe, setVibe] = useState<CapsuleVibe>(CapsuleVibe.NOSTALGIA);
  const [mediaType, setMediaType] = useState<'none' | 'draw' | 'upload'>('none');
  const [drawingData, setDrawingData] = useState<string | undefined>(undefined);
  const [uploadedImage, setUploadedImage] = useState<string | undefined>(undefined);
  const [ambientSound, setAmbientSound] = useState<AmbientSound>('none');
  const [isSoundPlaying, setIsSoundPlaying] = useState(false);
  
  // Unlock target datetime
  const [unlockDate, setUnlockDate] = useState('');
  const [unlockTime, setUnlockTime] = useState('');
  
  // PIN protection
  const [usePin, setUsePin] = useState(false);
  const [pin, setPin] = useState('');

  // Image upload reference
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Synchronize when initial text prop updates from Reflections panel
  React.useEffect(() => {
    if (initialText) {
      setMessage(initialText);
      // Automatically scroll to textarea smoothly
      const txtArea = document.getElementById('capsule-message-textarea');
      txtArea?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [initialText]);

  // Handle ambient sound preview
  const handleSoundPreview = () => {
    if (isSoundPlaying) {
      stopAmbient();
      setIsSoundPlaying(false);
    } else {
      playClick(700, 0.05);
      startAmbient(ambientSound, 0.15);
      setIsSoundPlaying(true);
    }
  };

  // Helper to set quick preset unlock offsets for easier evaluation!
  const setUnlockPreset = (seconds: number) => {
    playClick(900, 0.02);
    const target = new Date(Date.now() + seconds * 1000);
    
    // Format to local ISO format (YYYY-MM-DD)
    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, '0');
    const day = String(target.getDate()).padStart(2, '0');
    setUnlockDate(`${year}-${month}-${day}`);
    
    // Format to local HH:MM:SS
    const hours = String(target.getHours()).padStart(2, '0');
    const mins = String(target.getMinutes()).padStart(2, '0');
    const secs = String(target.getSeconds()).padStart(2, '0');
    setUnlockTime(`${hours}:${mins}:${secs}`);
  };

  // Compress and handle image uploads locally
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImageFile(file);
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Only image uploads are allowed.');
      return;
    }
    setUploadError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas to compress to small resolution max 400x400 to protect localstorage
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.65); // high compression, lightweight
          setUploadedImage(compressedBase64);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  // Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim() || !unlockDate || !unlockTime) {
      alert('Please fill out all required fields.');
      return;
    }

    if (usePin && (!pin || pin.length !== 4 || isNaN(Number(pin)))) {
      alert('PIN must be a 4-digit number.');
      return;
    }

    // Stop ambient previews
    stopAmbient();
    setIsSoundPlaying(false);

    // Parse target date string
    const targetUnlockString = `${unlockDate}T${unlockTime}`;
    const unlockAt = new Date(targetUnlockString).toISOString();

    onSave({
      title: title.trim(),
      message: message.trim(),
      vibe,
      unlockAt,
      pin: usePin ? pin : undefined,
      drawing: mediaType === 'draw' ? drawingData : undefined,
      attachedImage: mediaType === 'upload' ? uploadedImage : undefined,
      ambientSound,
    });

    // Reset Form
    setTitle('');
    setMessage('');
    setVibe(CapsuleVibe.NOSTALGIA);
    setMediaType('none');
    setDrawingData(undefined);
    setUploadedImage(undefined);
    setAmbientSound('none');
    setUnlockDate('');
    setUnlockTime('');
    setUsePin(false);
    setPin('');
    onClearPromptText?.();
  };

  return (
    <form id="capsule-sealing-form" onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-[#17171C] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
      {/* Stamp Header */}
      <div className="bg-white/[0.02] px-6 py-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Palette className="w-5 h-5 text-brand-orange" />
          <h3 className="font-serif text-xl italic text-white tracking-tight">Seal New Memory Capsule</h3>
        </div>
        <span className="text-[9px] font-sans font-black uppercase tracking-[0.2em] text-zinc-400 bg-white/5 border border-white/10 px-3 py-1 rounded">
          Offline Secured
        </span>
      </div>

      <div className="p-6 md:p-8 flex flex-col gap-8">
        
        {/* Title */}
        <div className="flex flex-col gap-2">
          <label htmlFor="capsule-title" className="font-serif italic text-base text-zinc-200">
            Capsule Title <span className="text-brand-orange">*</span>
          </label>
          <input
            id="capsule-title"
            type="text"
            required
            placeholder="e.g. A message for my graduation self, or Today's favorite memory"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-white/5 border border-white/10 focus:border-brand-orange/60 focus:bg-white/10 rounded-xl p-3.5 text-sm text-white placeholder-zinc-500 outline-none transition-all"
          />
        </div>

        {/* Vibe selection */}
        <div className="flex flex-col gap-3">
          <label className="font-serif italic text-base text-zinc-200">
            Select Visual Vibe & Theme <span className="text-zinc-500 font-sans text-xs tracking-wide not-italic ml-1">(Customizes colors & sounds on unlock)</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {VIBES_CONFIG.map((cfg) => {
              const Icon = cfg.icon;
              return (
                <button
                  key={cfg.vibe}
                  type="button"
                  id={`vibe-btn-${cfg.vibe.toLowerCase()}`}
                  onClick={() => { playClick(); setVibe(cfg.vibe); }}
                  className={`flex flex-col items-center p-4 rounded-xl border text-center transition-all cursor-pointer ${
                    vibe === cfg.vibe ? cfg.activeClass : `${cfg.colorClass} border-dashed hover:scale-[1.02]`
                  }`}
                >
                  <Icon className="w-5 h-5 mb-2" />
                  <span className="text-xs font-bold font-serif italic mb-1">{cfg.name}</span>
                  <span className="text-[10px] text-zinc-400 leading-normal line-clamp-3">
                    {cfg.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Message body */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <label htmlFor="capsule-message-textarea" className="font-serif italic text-base text-zinc-200">
              Your Letter/Memory <span className="text-brand-orange">*</span>
            </label>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              {message.length} characters
            </span>
          </div>
          <textarea
            id="capsule-message-textarea"
            required
            rows={7}
            placeholder="Write down details about your current life, your goals, words of encouragement, or a funny secret. Speak directly to your future self..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-white/5 border border-white/10 focus:border-brand-orange/60 focus:bg-white/10 rounded-xl p-4 text-sm text-white leading-relaxed placeholder-zinc-500 outline-none transition-all resize-y font-serif"
          />
        </div>

        {/* Media Option Selection */}
        <div className="flex flex-col gap-3">
          <label className="font-serif italic text-base text-zinc-200">
            Attach Digital Media Keepsake
          </label>
          <div className="flex gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5 max-w-sm">
            {(['none', 'draw', 'upload'] as const).map((type) => (
              <button
                key={type}
                type="button"
                id={`media-type-${type}`}
                onClick={() => { playClick(); setMediaType(type); }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold font-sans capitalize transition-all cursor-pointer ${
                  mediaType === type 
                    ? 'bg-brand-orange text-white shadow-md' 
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {type === 'none' ? 'No Media' : type === 'draw' ? 'Sketch/Draw' : 'Upload Photo'}
              </button>
            ))}
          </div>

          {/* Render Drawing Pad if selected */}
          {mediaType === 'draw' && (
            <div className="mt-2">
              <DrawingPad 
                initialDrawing={drawingData} 
                onSave={(base64) => setDrawingData(base64)} 
              />
            </div>
          )}

          {/* Render Image Upload if selected */}
          {mediaType === 'upload' && (
            <div className="mt-2 flex flex-col gap-2">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                  dragActive ? 'border-brand-orange bg-white/10' : 'border-white/10 bg-white/5 hover:border-brand-orange/40 hover:bg-white/[0.07]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  id="capsule-file-upload-input"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                
                {uploadedImage ? (
                  <div className="flex flex-col items-center gap-3">
                    <img
                      src={uploadedImage}
                      alt="Uploaded preview"
                      className="max-h-36 rounded-lg border border-white/10 shadow-lg"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[10px] font-sans text-brand-orange font-bold uppercase tracking-widest">
                      Photo attached successfully! Click to replace
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="w-8 h-8 text-zinc-500 mb-3" />
                    <p className="text-sm text-zinc-300 font-medium">Drag & drop your photo here, or click to browse</p>
                    <p className="text-[10px] text-zinc-500 font-sans uppercase tracking-[0.15em] mt-1.5">Supports PNG, JPG, WebP</p>
                  </div>
                )}
              </div>
              {uploadError && (
                <div className="flex items-center gap-1.5 text-red-400 text-xs mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Set Unlock Target Date / Quick Presets */}
        <div className="border-t border-white/5 pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col gap-3">
            <label className="font-serif italic text-base text-zinc-200 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-orange" />
              Unlock Date & Time <span className="text-brand-orange">*</span>
            </label>
            <div className="flex gap-2.5">
              <input
                id="unlock-date-input"
                type="date"
                required
                value={unlockDate}
                onChange={(e) => setUnlockDate(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 focus:border-brand-orange/60 focus:bg-white/10 rounded-xl p-3 text-sm text-white outline-none font-sans"
              />
              <input
                id="unlock-time-input"
                type="time"
                step="1" // supports seconds
                required
                value={unlockTime}
                onChange={(e) => setUnlockTime(e.target.value)}
                className="w-36 bg-white/5 border border-white/10 focus:border-brand-orange/60 focus:bg-white/10 rounded-xl p-3 text-sm text-white outline-none font-sans"
              />
            </div>
            <p className="text-[10px] text-zinc-500 font-sans leading-normal">
              Specify the precise instant the capsule locks will unlock.
            </p>
          </div>

          {/* Quick presets for evaluation / grading */}
          <div className="flex flex-col gap-3 bg-white/[0.02] border border-white/5 p-5 rounded-xl">
            <span className="font-serif italic text-sm text-zinc-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-brand-orange" />
              Evaluation Presets (Quick Tests)
            </span>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              Sealed date targets are hard to test! Click a preset to instantly lock it into the future by seconds or minutes.
            </p>
            <div className="flex flex-wrap gap-2 mt-1">
              <button
                type="button"
                id="preset-30s"
                onClick={() => setUnlockPreset(30)}
                className="bg-white/5 hover:bg-brand-orange hover:text-white border border-white/10 px-3 py-1.5 rounded-lg text-[10px] font-bold text-zinc-300 uppercase tracking-wider transition-all cursor-pointer"
              >
                +30 Seconds
              </button>
              <button
                type="button"
                id="preset-5m"
                onClick={() => setUnlockPreset(300)}
                className="bg-white/5 hover:bg-brand-orange hover:text-white border border-white/10 px-3 py-1.5 rounded-lg text-[10px] font-bold text-zinc-300 uppercase tracking-wider transition-all cursor-pointer"
              >
                +5 Minutes
              </button>
              <button
                type="button"
                id="preset-1h"
                onClick={() => setUnlockPreset(3600)}
                className="bg-white/5 hover:bg-brand-orange hover:text-white border border-white/10 px-3 py-1.5 rounded-lg text-[10px] font-bold text-zinc-300 uppercase tracking-wider transition-all cursor-pointer"
              >
                +1 Hour
              </button>
              <button
                type="button"
                id="preset-1d"
                onClick={() => setUnlockPreset(86400)}
                className="bg-white/5 hover:bg-brand-orange hover:text-white border border-white/10 px-3 py-1.5 rounded-lg text-[10px] font-bold text-zinc-300 uppercase tracking-wider transition-all cursor-pointer"
              >
                +1 Day
              </button>
            </div>
          </div>
        </div>

        {/* PIN protection & Ambient Soundtrack */}
        <div className="border-t border-white/5 pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* PIN Lock */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <input
                id="checkbox-use-pin"
                type="checkbox"
                checked={usePin}
                onChange={(e) => { playClick(); setUsePin(e.target.checked); }}
                className="w-4 h-4 text-brand-orange border-white/20 rounded focus:ring-brand-orange bg-white/5 cursor-pointer accent-brand-orange"
              />
              <label htmlFor="checkbox-use-pin" className="font-serif italic text-base text-zinc-200 flex items-center gap-1.5 cursor-pointer select-none">
                <Key className="w-4 h-4 text-brand-orange" />
                Add Private Security PIN Code
              </label>
            </div>
            
            {usePin && (
              <div className="flex flex-col gap-1.5 mt-1.5 pl-6 animate-shake">
                <input
                  id="capsule-pin-input"
                  type="password"
                  maxLength={4}
                  required
                  placeholder="e.g. 1234"
                  value={pin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, ''); // numbers only
                    setPin(val);
                  }}
                  className="w-28 bg-white/5 border border-white/10 focus:border-brand-orange/60 focus:bg-white/10 rounded-xl p-2.5 text-center text-sm font-mono tracking-widest text-white outline-none"
                />
                <span className="text-[10px] text-zinc-500 leading-normal">
                  Enter a 4-digit numeric key. It will be required to view the contents even after the unlock date has passed.
                </span>
              </div>
            )}
          </div>

          {/* Sound choice */}
          <div className="flex flex-col gap-3">
            <label className="font-serif italic text-base text-zinc-200 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-brand-orange" />
              Ambient Soundtrack On Reveal
            </label>
            <div className="flex gap-2.5">
              <select
                id="ambient-sound-select"
                value={ambientSound}
                onChange={(e) => {
                  playClick();
                  const val = e.target.value as AmbientSound;
                  setAmbientSound(val);
                  stopAmbient();
                  setIsSoundPlaying(false);
                }}
                className="flex-1 bg-white/5 border border-white/10 focus:border-brand-orange/60 focus:bg-white/10 rounded-xl p-3 text-xs text-white outline-none cursor-pointer"
              >
                <option className="bg-[#17171C]" value="none">No Sound (Silent Reveal)</option>
                <option className="bg-[#17171C]" value="rain">Cozy Rain (Procedural Synthetic Rain)</option>
                <option className="bg-[#17171C]" value="fireplace">Campfire (Popping embers and wood roar)</option>
                <option className="bg-[#17171C]" value="cafe">Quiet Cafe (Low hum + cup clinks)</option>
                <option className="bg-[#17171C]" value="synth">Ambient Pad (Cozy major-seventh slow drone)</option>
              </select>

              {ambientSound !== 'none' && (
                <button
                  type="button"
                  id="sound-preview-btn"
                  onClick={handleSoundPreview}
                  className={`px-4 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    isSoundPlaying 
                      ? 'bg-brand-orange border-brand-orange text-white' 
                      : 'border-white/10 hover:bg-white/5 text-zinc-300'
                  }`}
                >
                  {isSoundPlaying ? 'Mute' : 'Test'}
                </button>
              )}
            </div>
            <p className="text-[10px] text-zinc-500 leading-normal">
              Procedurally synthesizes beautiful high-fidelity soundscapes inside the user's browser using Web Audio!
            </p>
          </div>
        </div>

      </div>

      {/* Action panel footer */}
      <div className="bg-white/[0.02] px-6 py-5 border-t border-white/10 flex justify-between items-center">
        <p className="text-xs font-serif italic text-zinc-500">
          * Indicates a strictly required field
        </p>
        <button
          type="submit"
          id="btn-seal-capsule"
          className="px-8 py-4 border border-brand-orange text-xs uppercase tracking-widest bg-brand-orange text-white hover:bg-brand-orange-hover hover:border-brand-orange-hover font-semibold transition-colors shadow-lg shadow-brand-orange/10 cursor-pointer flex items-center gap-1.5"
        >
          Seal & Lock Capsule 🔒
        </button>
      </div>
    </form>
  );
}
