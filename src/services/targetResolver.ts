import {
  RemNoteAdapterError,
  type RemNoteAdapter,
  type RemNoteAdapterErrorInfo,
} from './remnoteAdapter';
import type { RepeatTarget, RepeatTargetSource } from '../types/repeatSession';

export class TargetResolutionError extends Error {
  readonly info: RemNoteAdapterErrorInfo;

  constructor(info: RemNoteAdapterErrorInfo) {
    super(`Target resolution failed: ${info.operation} API unavailable`);
    this.name = 'TargetResolutionError';
    this.info = info;
  }
}

type TargetReader = {
  source: RepeatTargetSource;
  read: () => Promise<string | null>;
};

export async function resolveRepeatTarget(
  adapter: Pick<
    RemNoteAdapter,
    'getSelectedText' | 'getFlashcardAnswer' | 'getFocusedRemText'
  >,
): Promise<RepeatTarget | null> {
  const readers: TargetReader[] = [
    { source: 'selected-text', read: adapter.getSelectedText },
    { source: 'flashcard-answer', read: adapter.getFlashcardAnswer },
    { source: 'focused-rem', read: adapter.getFocusedRemText },
  ];

  for (const reader of readers) {
    try {
      const text = (await reader.read())?.trim();
      if (text) {
        return { text, source: reader.source };
      }
    } catch (cause) {
      if (cause instanceof RemNoteAdapterError) {
        throw new TargetResolutionError(cause.info);
      }

      throw cause;
    }
  }

  return null;
}
