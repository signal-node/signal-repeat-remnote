import type { RichTextInterface } from '@remnote/plugin-sdk';

export type RepeatTargetSource = 'selected-text' | 'flashcard-answer' | 'focused-rem';

export type RepeatTarget = {
  content: RichTextInterface;
  source: RepeatTargetSource;
};

export type RepeatSessionState =
  | 'idle'
  | 'preparing'
  | 'running'
  | 'finished'
  | 'cancelled';

export type RepeatPopupContextData = {
  targetRichText: RichTextInterface;
  durationSeconds: number;
  showProgressBar: boolean;
  showCloseHint: boolean;
};

export type RepeatSessionCloseReason = 'completed' | 'cancelled';
