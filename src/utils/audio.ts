/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AmbientSound } from '../types';

let audioCtx: AudioContext | null = null;
let ambientNodes: {
  source?: AudioNode;
  gainNode?: GainNode;
  nodesToStop?: { stop: () => void }[];
} = {};

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Simple click synthesizer
export function playClick(frequency = 800, duration = 0.015) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + duration);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn('Audio click failed', e);
  }
}

// Error/Locked thud-shaker synthesizer
export function playLockedShake() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Play dual low-frequency oscillators for a heavy dull thud
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(90, now);
    osc1.frequency.exponentialRampToValueAtTime(30, now + 0.25);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(80, now);
    osc2.frequency.exponentialRampToValueAtTime(20, now + 0.25);

    // Filter to make it muddy and heavy
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(120, now);

    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.linearRampToValueAtTime(0.01, now + 0.25);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(now + 0.3);
    osc2.stop(now + 0.3);
  } catch (e) {
    console.warn('Audio thud failed', e);
  }
}

// Elegant magical success unlock chime (arpeggio in E Major / F# Major)
export function playUnlockSuccess() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    // Chime notes: E4, G#4, B4, E5, G#5, B5, E6
    const freqs = [329.63, 415.30, 493.88, 659.25, 830.61, 987.77, 1318.51];
    
    freqs.forEach((freq, idx) => {
      const delay = idx * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);
      
      // Add subtle frequency vibrato
      const vibrato = ctx.createOscillator();
      const vibratoGain = ctx.createGain();
      vibrato.frequency.value = 6; // 6Hz
      vibratoGain.gain.value = 4; // microtones
      vibrato.connect(vibratoGain);
      vibratoGain.connect(osc.frequency);
      
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(0.12, now + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.6);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      vibrato.start(now + delay);
      osc.start(now + delay);
      
      vibrato.stop(now + delay + 0.7);
      osc.stop(now + delay + 0.7);
    });
  } catch (e) {
    console.warn('Audio unlock failed', e);
  }
}

// Short pleasant alert notification
export function playAlert() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);
      
      gain.gain.setValueAtTime(0.1, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.2);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.25);
    });
  } catch (e) {
    console.warn('Audio alert failed', e);
  }
}

// Stop any currently playing ambient sound
export function stopAmbient() {
  try {
    if (ambientNodes.nodesToStop) {
      ambientNodes.nodesToStop.forEach((node) => {
        try {
          node.stop();
        } catch (e) {}
      });
    }
    if (ambientNodes.gainNode) {
      try {
        ambientNodes.gainNode.disconnect();
      } catch (e) {}
    }
    ambientNodes = {};
  } catch (e) {
    console.warn('Stop ambient audio failed', e);
  }
}

// Helper to generate a loopable noise buffer
function createNoiseBuffer(ctx: AudioContext, type: 'white' | 'pink' | 'brown' = 'white', duration = 3) {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0; // for pink noise
  let lastOut = 0.0; // for brown noise

  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    if (type === 'white') {
      data[i] = white;
    } else if (type === 'pink') {
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.11; // estimate
      b6 = white * 0.115926;
    } else if (type === 'brown') {
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // estimate
    }
  }
  return buffer;
}

// Start loopable procedural ambient sound synthesis!
export function startAmbient(type: AmbientSound, volume = 0.25) {
  stopAmbient();
  if (type === 'none') return;

  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(volume, now + 1.5); // Smooth fade-in!

    masterGain.connect(ctx.destination);
    
    const nodesToStop: { stop: () => void }[] = [];

    if (type === 'rain') {
      // Steady rain synthesized using filtered Pink Noise + high pass crackles
      const rainBuffer = createNoiseBuffer(ctx, 'pink', 4);
      const rainSource = ctx.createBufferSource();
      rainSource.buffer = rainBuffer;
      rainSource.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, now);

      rainSource.connect(filter);
      filter.connect(masterGain);
      rainSource.start();
      nodesToStop.push(rainSource);

    } else if (type === 'fireplace') {
      // Low rumble brown noise + custom cracker pulses for popping embers
      const crackleBuffer = createNoiseBuffer(ctx, 'brown', 3);
      const crackleSource = ctx.createBufferSource();
      crackleSource.buffer = crackleBuffer;
      crackleSource.loop = true;

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(250, now);

      crackleSource.connect(lowpass);
      lowpass.connect(masterGain);
      crackleSource.start();
      nodesToStop.push(crackleSource);

      // Programmatic crackling pops
      const crackleInterval = setInterval(() => {
        if (Math.random() > 0.4) {
          try {
            const osc = ctx.createOscillator();
            const popGain = ctx.createGain();
            const bandpass = ctx.createBiquadFilter();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(80 + Math.random() * 300, ctx.currentTime);
            
            bandpass.type = 'bandpass';
            bandpass.frequency.setValueAtTime(1200 + Math.random() * 800, ctx.currentTime);
            bandpass.Q.value = 3;

            popGain.gain.setValueAtTime(0.01 + Math.random() * 0.03, ctx.currentTime);
            popGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02 + Math.random() * 0.04);

            osc.connect(bandpass);
            bandpass.connect(popGain);
            popGain.connect(masterGain);
            
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
          } catch (err) {}
        }
      }, 180);

      nodesToStop.push({
        stop: () => clearInterval(crackleInterval)
      });

    } else if (type === 'cafe') {
      // Gentle murmur (filtered pink noise) + occasional bell or cup clinks
      const cafeBuffer = createNoiseBuffer(ctx, 'pink', 5);
      const cafeSource = ctx.createBufferSource();
      cafeSource.buffer = cafeBuffer;
      cafeSource.loop = true;

      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(400, now);
      bp.Q.value = 0.5;

      cafeSource.connect(bp);
      bp.connect(masterGain);
      cafeSource.start();
      nodesToStop.push(cafeSource);

      // Random cup sound synthesis
      const cupInterval = setInterval(() => {
        if (Math.random() > 0.6) {
          try {
            const bell = ctx.createOscillator();
            const bellGain = ctx.createGain();
            bell.type = 'sine';
            bell.frequency.setValueAtTime(2000 + Math.random() * 1500, ctx.currentTime);
            
            bellGain.gain.setValueAtTime(0.002 + Math.random() * 0.005, ctx.currentTime);
            bellGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
            
            bell.connect(bellGain);
            bellGain.connect(masterGain);
            bell.start();
            bell.stop(ctx.currentTime + 0.4);
          } catch (err) {}
        }
      }, 1200);

      nodesToStop.push({
        stop: () => clearInterval(cupInterval)
      });

    } else if (type === 'synth') {
      // Cozy, retro futuristic warm synthesizer pad! Slow major 7th chord arpeggio drone.
      const scale = [196.00, 246.94, 293.66, 329.63, 392.00]; // G3, B3, D4, E4, G4 (Warm Gmaj7/Em9)
      const oscillators: OscillatorNode[] = [];

      scale.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        
        // Very slow pitch LFO for organic detuning
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 0.2 + index * 0.05; // Different speeds
        lfoGain.gain.value = 1.5; // Vibrato depth
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        
        // Lowpass filter with slow sweeping modulation
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300 + index * 50, now);

        // Sweeping filter interval
        const filterSweep = setInterval(() => {
          try {
            const time = ctx.currentTime;
            filter.frequency.linearRampToValueAtTime(350 + Math.sin(time * 0.5 + index) * 120, time + 2);
          } catch (e) {}
        }, 2000);
        
        oscGain.gain.setValueAtTime(0.04, now);
        
        osc.connect(filter);
        filter.connect(oscGain);
        oscGain.connect(masterGain);
        
        lfo.start();
        osc.start();
        oscillators.push(osc);

        nodesToStop.push({
          stop: () => {
            clearInterval(filterSweep);
            lfo.stop();
            osc.stop();
          }
        });
      });
    }

    ambientNodes = {
      gainNode: masterGain,
      nodesToStop
    };
  } catch (e) {
    console.warn('Ambient synthesis failed to start', e);
  }
}
