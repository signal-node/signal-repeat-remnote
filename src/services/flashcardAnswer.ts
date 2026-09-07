import type {
  FlashcardAnswerContext,
  RemNoteAdapter,
} from './remnoteAdapter';
import type { RepeatTarget } from '../types/repeatSession';
import { prepareRepeatContent } from './repeatContent';

type FlashcardAnswerAdapter = Pick<
  RemNoteAdapter,
  'assertFlashcardRemSupported' | 'getFlashcardAnswerByCardId'
>;

export async function resolveFlashcardAnswerTarget(
  adapter: FlashcardAnswerAdapter,
  context: FlashcardAnswerContext | null,
): Promise<RepeatTarget | null> {
  if (!context?.revealed) {
    return null;
  }

  // remId is safe for shape detection, but never for guessing answer direction.
  await adapter.assertFlashcardRemSupported(context.remId);

  if (!context.cardId) {
    return null;
  }

  const content = prepareRepeatContent(
    await adapter.getFlashcardAnswerByCardId(context.cardId),
  );
  return content ? { content, source: 'flashcard-answer' } : null;
}
