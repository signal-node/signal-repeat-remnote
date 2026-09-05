import type {
  FlashcardAnswerContext,
  RemNoteAdapter,
} from './remnoteAdapter';
import type { RepeatTarget } from '../types/repeatSession';

type FlashcardAnswerAdapter = Pick<
  RemNoteAdapter,
  'getFlashcardAnswerByCardId'
>;

export async function resolveFlashcardAnswerTarget(
  adapter: FlashcardAnswerAdapter,
  context: FlashcardAnswerContext | null,
): Promise<RepeatTarget | null> {
  if (!context?.revealed || !context.cardId) {
    return null;
  }

  const text = (await adapter.getFlashcardAnswerByCardId(context.cardId))?.trim();
  return text ? { text, source: 'flashcard-answer' } : null;
}
