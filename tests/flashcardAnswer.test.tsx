import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { RepeatButton } from '../src/components/RepeatButton';
import { resolveFlashcardAnswerTarget } from '../src/services/flashcardAnswer';

describe('flashcard answer integration', () => {
  it('renders the current duration in an accessible action', () => {
    const markup = renderToStaticMarkup(
      <RepeatButton durationSeconds={30} onClick={vi.fn()} />,
    );

    expect(markup).toContain('Repeat · 30s');
    expect(markup).toContain(
      'aria-label="Repeat flashcard answer for 30 seconds"',
    );
  });

  it('resolves a revealed card by its exact card ID', async () => {
    const adapter = {
      getFlashcardAnswerByCardId: vi.fn(async () => '  answer  '),
    };

    await expect(
      resolveFlashcardAnswerTarget(adapter, {
        remId: 'rem-id',
        cardId: 'card-id',
        revealed: true,
      }),
    ).resolves.toEqual({ text: 'answer', source: 'flashcard-answer' });
    expect(adapter.getFlashcardAnswerByCardId).toHaveBeenCalledWith('card-id');
  });

  it.each([
    { remId: 'rem-id', cardId: 'card-id', revealed: false },
    { remId: 'rem-id', revealed: true },
  ])('does not read a hidden or unidentified card', async (context) => {
    const adapter = {
      getFlashcardAnswerByCardId: vi.fn(async () => 'answer'),
    };

    await expect(
      resolveFlashcardAnswerTarget(adapter, context),
    ).resolves.toBeNull();
    expect(adapter.getFlashcardAnswerByCardId).not.toHaveBeenCalled();
  });

  it('treats an empty or unsupported answer as no target', async () => {
    const adapter = {
      getFlashcardAnswerByCardId: vi.fn(async () => '  '),
    };

    await expect(
      resolveFlashcardAnswerTarget(adapter, {
        remId: 'rem-id',
        cardId: 'card-id',
        revealed: true,
      }),
    ).resolves.toBeNull();
  });
});
