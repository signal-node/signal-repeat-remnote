import type {
  FlashcardAnswerContext,
  RemNoteAdapter,
} from './remnoteAdapter';
import type { RepeatTarget } from '../types/repeatSession';
import { prepareRepeatContent } from './repeatContent';

type FlashcardAnswerAdapter = Pick<
  RemNoteAdapter,
  | 'getCurrentFlashcardAnswerForRem'
  | 'getFlashcardAnswerByCardId'
>;

export async function resolveFlashcardAnswerTarget(
  adapter: FlashcardAnswerAdapter,
  context: FlashcardAnswerContext | null,
): Promise<RepeatTarget | null> {
  if (!context?.revealed) {
    return null;
  }

  if (!context.cardId) {
    // Some RemNote hosts omit cardId from this widget context. The public
    // queue API still exposes the exact current Card (including direction),
    // so use it only when its owning Rem matches the widget context. This
    // prevents a queue transition race from resolving a different answer.
    const content = prepareRepeatContent(
      await adapter.getCurrentFlashcardAnswerForRem(context.remId),
    );
    return content ? { content, source: 'flashcard-answer' } : null;
  }

  const content = prepareRepeatContent(
    await adapter.getFlashcardAnswerByCardId(context.cardId, context.remId),
  );
  return content ? { content, source: 'flashcard-answer' } : null;
}
