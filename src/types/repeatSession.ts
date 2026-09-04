export type RepeatTargetSource = 'selected-text' | 'flashcard-answer' | 'focused-rem';

export type RepeatTarget = {
  text: string;
  source: RepeatTargetSource;
};

export type RepeatSessionState =
  | 'idle'
  | 'preparing'
  | 'running'
  | 'finished'
  | 'cancelled';
