/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum CapsuleVibe {
  NOSTALGIA = 'NOSTALGIA',
  FUTURE_VISION = 'FUTURE_VISION',
  LOVE_LETTER = 'LOVE_LETTER',
  DEEP_SECRET = 'DEEP_SECRET',
  BIRTHDAY_WISH = 'BIRTHDAY_WISH',
}

export type AmbientSound = 'rain' | 'fireplace' | 'cafe' | 'synth' | 'none';

export interface Capsule {
  id: string;
  title: string;
  message: string;
  vibe: CapsuleVibe;
  createdAt: string; // ISO string
  unlockAt: string; // ISO string
  pin?: string; // Optional 4-digit PIN
  drawing?: string; // Optional Base64 data URI of user's doodle
  attachedImage?: string; // Optional Base64 data URI of a compressed uploaded photo
  ambientSound: AmbientSound;
  isUnlocked: boolean;
  isArchived: boolean;
}

export interface ReflectionPrompt {
  id: string;
  category: string;
  text: string;
  placeholder: string;
}

export interface CapsuleStats {
  totalSealed: number;
  totalLocked: number;
  totalUnlocked: number;
  vibeDistribution: Record<CapsuleVibe, number>;
}
