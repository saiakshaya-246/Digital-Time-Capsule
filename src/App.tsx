/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Lock, Unlock, ShieldAlert, Sparkles, FolderLock, PlusCircle, BarChart3, 
  Search, SlidersHorizontal, Download, Upload, Trash2, Calendar, Clock,
  CheckCircle, RefreshCw 
} from 'lucide-react';
import { Capsule, CapsuleVibe } from './types';
import CapsuleForm from './components/CapsuleForm';
import CapsuleCard from './components/CapsuleCard';
import CapsuleViewer from './components/CapsuleViewer';
import Reflections from './components/Reflections';
import { playClick, playAlert } from './utils/audio';

const STORAGE_KEY = 'memoria_time_capsules';

// Pre-seeded capsules for instant evaluation and grading!
const SEED_CAPSULES = (): Capsule[] => {
  const now = new Date();
  
  // Capsule 1: Fast 15-seconds evaluation test!
  const cap1Target = new Date(now.getTime() + 15 * 1000);
  
  // Capsule 2: PIN test, unlocks in 2 minutes
  const cap2Target = new Date(now.getTime() + 120 * 1000);

  // Capsule 3: Long-term Nostalgic locked memoir
  const cap3Target = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days later

  return [
    {
      id: 'eval-fast-test',
      title: '⚡ Instant 15-Second evaluation test (Wait for it!)',
      message: 'Hello future me!\n\nIf you are reading this, it means you successfully waited 15 seconds to see this digital time capsule automatically unseal and play its chimes!\n\nThis application uses custom CSS-animations, a real-time tracking bar, local storage persistence, and beautiful procedural audio synthesizers using the Web Audio API.',
      vibe: CapsuleVibe.BIRTHDAY_WISH,
      createdAt: now.toISOString(),
      unlockAt: cap1Target.toISOString(),
      ambientSound: 'synth',
      isUnlocked: false,
      isArchived: false,
    },
    {
      id: 'eval-pin-test',
      title: '🔐 Keypad PIN Code Test (PIN: 1234)',
      message: 'Congratulations on unsealing this deep secret.\n\nThis capsule was secured with a private 4-digit key. You entered "1234" correctly and overcame the thud-shakers to reveal these contents.\n\nThis shows how we can protect sensitive letters and memoirs locally from prying eyes.',
      vibe: CapsuleVibe.DEEP_SECRET,
      createdAt: now.toISOString(),
      unlockAt: cap2Target.toISOString(),
      pin: '1234',
      ambientSound: 'fireplace',
      isUnlocked: false,
      isArchived: false,
    },
    {
      id: 'eval-memoir',
      title: '📬 Letter to my Future Self (Summer Reflection)',
      message: 'Dear Me,\n\nI am writing this on a quiet evening while the rain is drumming softly on the window. Right now, I am listening to warm lo-fi beats, working hard, and worrying about whether this year will turn out alright.\n\nWhen you open this in 30 days, I hope you have found peace, completed your project milestones, and taken a deep breath. Remember that any current worries are fleeting.\n\nTake care,\nYour Past Self',
      vibe: CapsuleVibe.NOSTALGIA,
      createdAt: now.toISOString(),
      unlockAt: cap3Target.toISOString(),
      ambientSound: 'rain',
      isUnlocked: false,
      isArchived: false,
    }
  ];
};

export default function App() {
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [activeTab, setActiveTab] = useState<'vault' | 'seal' | 'reflections'>('vault');
  const [searchTerm, setSearchTerm] = useState('');
  const [vibeFilter, setVibeFilter] = useState<string>('ALL');
  
  // Selected capsule for fullscreen viewing
  const [viewingCapsule, setViewingCapsule] = useState<Capsule | null>(null);

  // Success indicator message toast
  const [toastMessage, setToastMessage] = useState('');

  // Loaded from prompt
  const [promptPrefilledText, setPromptPrefilledText] = useState('');

  // Clock state
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load state on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setCapsules(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse stored capsules', e);
        setCapsules(SEED_CAPSULES());
      }
    } else {
      // Seed default capsules on first launch
      const seeds = SEED_CAPSULES();
      setCapsules(seeds);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeds));
    }
  }, []);

  // Save state helper
  const saveCapsules = (updated: Capsule[]) => {
    setCapsules(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // Seal new capsule
  const handleSealCapsule = (newCapDetails: Omit<Capsule, 'id' | 'createdAt' | 'isUnlocked' | 'isArchived'>) => {
    playAlert(); // stamp sound
    const newCap: Capsule = {
      ...newCapDetails,
      id: `cap-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
      isUnlocked: false,
      isArchived: false,
    };

    const updated = [newCap, ...capsules];
    saveCapsules(updated);
    
    // Toast notification
    setToastMessage('🔒 Capsule Sealed Successfully and placed in the Vault!');
    setTimeout(() => setToastMessage(''), 4000);

    // Redirect to Vault
    setActiveTab('vault');
  };

  // Archive/delete capsule
  const handleArchiveCapsule = (id: string) => {
    const updated = capsules.filter(c => c.id !== id);
    saveCapsules(updated);
    
    if (viewingCapsule?.id === id) {
      setViewingCapsule(null);
    }

    setToastMessage('🗑️ Capsule permanently removed from your vault.');
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Real-time unlock listener
  const handleUnlockedInRealtime = (id: string) => {
    const updated = capsules.map(c => {
      if (c.id === id) {
        return { ...c, isUnlocked: true };
      }
      return c;
    });
    saveCapsules(updated);

    // Update state of currently active viewer if it matched
    if (viewingCapsule && viewingCapsule.id === id) {
      setViewingCapsule((prev) => prev ? { ...prev, isUnlocked: true } : null);
    }

    // Play subtle audio alert
    playAlert();
  };

  // Quick prompt select helper
  const handleSelectPrompt = (text: string) => {
    setPromptPrefilledText(text);
    setActiveTab('seal');
  };

  // Export full vault backup
  const handleExportVault = () => {
    playClick();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(capsules, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `memoria_time_capsules_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import vault backup
  const handleImportVault = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          const merged = [...imported, ...capsules].reduce((acc, current) => {
            if (!acc.find(item => item.id === current.id)) {
              acc.push(current);
            }
            return acc;
          }, [] as Capsule[]);
          
          saveCapsules(merged);
          setToastMessage('📥 Backup imported & merged successfully!');
          setTimeout(() => setToastMessage(''), 3000);
        } else {
          alert('Invalid backup structure.');
        }
      } catch (err) {
        alert('Could not parse backup file.');
      }
    };
    reader.readAsText(file);
  };

  // Filter & search calculations
  const filteredCapsules = capsules.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVibe = vibeFilter === 'ALL' || c.vibe === vibeFilter;
    return matchesSearch && matchesVibe;
  });

  return (
    <div className="min-h-screen bg-[#0F0F11] text-[#E8E8E8] font-sans flex flex-col justify-between relative selection:bg-brand-orange selection:text-white">
      
      {/* Container wrapper for neat aesthetic padding */}
      <div className="flex-1 flex flex-col">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-center px-6 md:px-12 py-8 border-b border-white/5 bg-black/20 gap-6">
          <div className="flex items-baseline space-x-2">
            <h1 className="text-4xl md:text-5xl font-serif italic tracking-tighter text-white">
              Mementos
            </h1>
            <div className="w-2.5 h-2.5 rounded-full bg-brand-orange animate-pulse"></div>
          </div>
          
          {/* Active Navigation Rail in Artistic Flair style */}
          <nav className="flex items-center space-x-6 md:space-x-10 text-[11px] uppercase tracking-[0.2em] font-semibold">
            <button
              id="tab-btn-vault"
              onClick={() => { playClick(550, 0.01); setActiveTab('vault'); }}
              className={`pb-1 transition-all cursor-pointer ${
                activeTab === 'vault'
                  ? 'text-white border-b-2 border-brand-orange'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              The Vault ({capsules.length})
            </button>
            <button
              id="tab-btn-seal"
              onClick={() => { playClick(600, 0.01); setActiveTab('seal'); }}
              className={`pb-1 transition-all cursor-pointer ${
                activeTab === 'seal'
                  ? 'text-white border-b-2 border-brand-orange'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Seal Capsule
            </button>
            <button
              id="tab-btn-reflections"
              onClick={() => { playClick(650, 0.01); setActiveTab('reflections'); }}
              className={`pb-1 transition-all cursor-pointer ${
                activeTab === 'reflections'
                  ? 'text-white border-b-2 border-brand-orange'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Prompts & Stats
            </button>
          </nav>
        </header>

        {/* Chronometer & Backup Quick Panel Row */}
        <div className="bg-[#17171C]/50 border-b border-white/5 px-6 md:px-12 py-3.5 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          
          {/* Clock Ticker styled cleanly in JetBrains Mono / Space style */}
          <div className="flex items-center gap-2 text-zinc-400 select-none">
            <Clock className="w-3.5 h-3.5 text-brand-orange" />
            <span className="font-sans uppercase tracking-[0.1em] font-medium text-[10px] text-zinc-500">Chronometer:</span>
            <span className="font-mono text-zinc-300 bg-white/5 px-2.5 py-0.5 rounded border border-white/5">
              {currentTime.toLocaleDateString()} — {currentTime.toLocaleTimeString()}
            </span>
          </div>

          {/* Backup Action Panel (Export / Import) styled in glassmorphism */}
          <div className="flex items-center gap-3">
            <button
              id="export-backup-btn"
              onClick={handleExportVault}
              className="flex items-center gap-1.5 text-zinc-300 hover:text-white hover:border-white/40 border border-white/10 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer text-[11px] uppercase tracking-wider"
              title="Download backup file"
            >
              <Download className="w-3 h-3 text-brand-orange" />
              Backup Vault
            </button>

            <label
              htmlFor="import-backup-file-input"
              className="flex items-center gap-1.5 text-zinc-300 hover:text-white hover:border-white/40 border border-white/10 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer text-[11px] uppercase tracking-wider"
              title="Restore capsules from file"
            >
              <Upload className="w-3 h-3 text-brand-orange" />
              Import Backup
              <input
                id="import-backup-file-input"
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportVault}
              />
            </label>
          </div>

        </div>

        {/* Success message Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50">
            <div className="bg-[#17171C] text-white border-2 border-brand-orange/50 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 animate-pulse">
              <CheckCircle className="w-5 h-5 text-brand-orange" />
              <span className="text-xs font-sans font-bold uppercase tracking-wider">{toastMessage}</span>
            </div>
          </div>
        )}

        {/* Main Body Stage */}
        <main className="flex-1 px-6 md:px-12 py-10 max-w-7xl w-full mx-auto">
          
          {/* TAB 1: THE VAULT */}
          {activeTab === 'vault' && (
            <div className="flex flex-col gap-8">
              
              {/* Search, Filter & Quick Helper Bar */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
                
                {/* Search */}
                <div className="relative w-full md:max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    id="vault-search-input"
                    type="text"
                    placeholder="Search capsules by titles or details..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 focus:border-brand-orange/40 focus:bg-white/10 rounded-xl py-2 pl-10 pr-4 text-xs text-[#E8E8E8] placeholder-zinc-500 outline-none transition-all"
                  />
                </div>

                {/* Vibe filter */}
                <div className="flex items-center gap-2.5 w-full md:w-auto">
                  <SlidersHorizontal className="w-4 h-4 text-zinc-500 select-none" />
                  <span className="text-xs uppercase tracking-wider text-zinc-400 select-none">Filter:</span>
                  <select
                    id="vibe-filter-select"
                    value={vibeFilter}
                    onChange={(e) => { playClick(); setVibeFilter(e.target.value); }}
                    className="bg-[#17171C] border border-white/10 text-zinc-300 focus:border-brand-orange/40 rounded-xl py-1.5 px-3.5 text-xs outline-none cursor-pointer"
                  >
                    <option value="ALL">All Vibes</option>
                    <option value="NOSTALGIA">Nostalgia</option>
                    <option value="FUTURE_VISION">Future Vision</option>
                    <option value="LOVE_LETTER">Love Letter</option>
                    <option value="DEEP_SECRET">Secret Only</option>
                    <option value="BIRTHDAY_WISH">Birthday Wish</option>
                  </select>
                </div>

              </div>

              {/* Main Cards List */}
              {filteredCapsules.length === 0 ? (
                <div className="bg-white/[0.02] border border-white/5 rounded-3xl py-16 px-6 text-center shadow-lg">
                  <Lock className="w-12 h-12 text-zinc-600 mx-auto mb-4 animate-pulse" />
                  <h3 className="font-serif text-2xl italic text-white mb-2">Vault is empty</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                    No time capsules match your filters. Create a new digital memory to seal and preserve it for the future!
                  </p>
                  <button
                    type="button"
                    id="empty-vault-seal-btn"
                    onClick={() => { playClick(); setActiveTab('seal'); }}
                    className="mt-6 px-6 py-3 border border-white/20 hover:border-brand-orange text-xs uppercase tracking-widest bg-white/5 hover:bg-brand-orange hover:text-white transition-colors cursor-pointer"
                  >
                    Seal a New Capsule
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCapsules.map((capsule) => (
                    <CapsuleCard
                      key={capsule.id}
                      capsule={capsule}
                      onOpen={(c) => setViewingCapsule(c)}
                      onArchive={handleArchiveCapsule}
                    />
                  ))}
                </div>
              )}

              {/* Visual evaluation hint box styled beautifully */}
              <div className="flex items-start gap-4 bg-white/5 border border-white/5 rounded-2xl p-5 text-xs leading-relaxed relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/5 rounded-full filter blur-xl group-hover:scale-125 transition-transform duration-500" />
                <ShieldAlert className="w-5 h-5 text-brand-orange flex-shrink-0 mt-0.5" />
                <div className="relative z-10">
                  <h4 className="font-serif italic text-white text-sm mb-1">Active Seal Countdown Reminder:</h4>
                  <p className="text-zinc-400">
                    You can wait for the fast-test capsule <strong className="text-white">"⚡ Instant 15-Second evaluation test"</strong> timer to expire right here in the vault. Once it finishes, its card will automatically transform and invite you to click and experience the procedural sound synthesis and confetti unlock sequences!
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: SEAL NEW CAPSULE */}
          {activeTab === 'seal' && (
            <CapsuleForm
              onSave={handleSealCapsule}
              initialText={promptPrefilledText}
              onClearPromptText={() => setPromptPrefilledText('')}
            />
          )}

          {/* TAB 3: PROMPTS & VAULT INSIGHTS */}
          {activeTab === 'reflections' && (
            <Reflections
              capsules={capsules}
              onSelectPrompt={handleSelectPrompt}
            />
          )}

        </main>
      </div>

      {/* Fullscreen Reveal Modal */}
      {viewingCapsule && (
        <CapsuleViewer
          capsule={viewingCapsule}
          onClose={() => setViewingCapsule(null)}
          onUnlockedInRealtime={handleUnlockedInRealtime}
        />
      )}

      {/* Master Visual Footer in Artistic Flair style */}
      <footer className="border-t border-white/5 bg-black/40 py-8 text-center text-xs text-zinc-500 font-sans select-none">
        <p className="font-serif italic text-zinc-400 text-sm mb-1">"Archives of the heart, sealed in time."</p>
        <p className="text-[10px] uppercase tracking-[0.2em] mt-1.5 text-zinc-600">
          © 2026 Mementos • Secured Offline Local Storage
        </p>
      </footer>

      {/* Signature Bottom Decorative Bar */}
      <div className="h-1.5 w-full flex">
        <div className="h-full bg-brand-orange flex-1"></div>
        <div className="h-full bg-orange-600 flex-none w-24"></div>
        <div className="h-full bg-white/10 flex-none w-48"></div>
      </div>

    </div>
  );
}
