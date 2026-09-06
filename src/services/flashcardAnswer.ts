import type {
  FlashcardAnswerContext,
  RemNoteAdapter,
} from './remnoteAdapter';
import type { RepeatTarget } from '../types/repeatSession';
import { prepareRepeatContent } from './repeatContent';

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

  const content = prepareRepeatContent(
    await adapter.getFlashcardAnswerByCardId(context.cardId),
  );
  return content ? { content, source: 'flashcard-answer' } : null;
}
