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
      assertFlashcardRemSupported: vi.fn(async () => undefined),
      getFlashcardAnswerByCardId: vi.fn(async () => ['answer']),
    };

    await expect(
      resolveFlashcardAnswerTarget(adapter, {
        remId: 'rem-id',
        cardId: 'card-id',
        revealed: true,
      }),
    ).resolves.toEqual({ content: ['answer'], source: 'flashcard-answer' });
    expect(adapter.getFlashcardAnswerByCardId).toHaveBeenCalledWith('card-id');
    expect(adapter.assertFlashcardRemSupported).not.toHaveBeenCalled();
  });

  it.each([
    { remId: 'rem-id', cardId: 'card-id', revealed: false },
    { remId: 'rem-id', revealed: true },
  ])('does not read a hidden or unidentified card', async (context) => {
    const adapter = {
      assertFlashcardRemSupported: vi.fn(async () => undefined),
      getFlashcardAnswerByCardId: vi.fn(async () => ['answer']),
    };

    await expect(
      resolveFlashcardAnswerTarget(adapter, context),
    ).resolves.toBeNull();
    expect(adapter.getFlashcardAnswerByCardId).not.toHaveBeenCalled();
    if (context.revealed) {
      expect(adapter.assertFlashcardRemSupported).toHaveBeenCalledWith(
        context.remId,
      );
    } else {
      expect(adapter.assertFlashcardRemSupported).not.toHaveBeenCalled();
    }
  });

  it('treats an empty or unsupported answer as no target', async () => {
    const adapter = {
      assertFlashcardRemSupported: vi.fn(async () => undefined),
      getFlashcardAnswerByCardId: vi.fn(async () => ['  ']),
    };

    await expect(
      resolveFlashcardAnswerTarget(adapter, {
        remId: 'rem-id',
        cardId: 'card-id',
        revealed: true,
      }),
    ).resolves.toBeNull();
  });

  it('accepts an audio-only answer as a repeat target', async () => {
    const audio = { i: 'a' as const, url: 'https://example.invalid/audio.mp3' };
    const adapter = {
      assertFlashcardRemSupported: vi.fn(async () => undefined),
      getFlashcardAnswerByCardId: vi.fn(async () => [audio]),
    };

    await expect(
      resolveFlashcardAnswerTarget(adapter, {
        remId: 'rem-id',
        cardId: 'card-id',
        revealed: true,
      }),
    ).resolves.toEqual({ content: [audio], source: 'flashcard-answer' });
  });

  it('rejects a revealed multiline Rem even when the card ID is absent', async () => {
    const unsupported = new Error('unsupported');
    const adapter = {
      assertFlashcardRemSupported: vi.fn(async () => {
        throw unsupported;
      }),
      getFlashcardAnswerByCardId: vi.fn(async () => ['incorrect parent answer']),
    };

    await expect(
      resolveFlashcardAnswerTarget(adapter, {
        remId: 'multiline-rem-id',
        revealed: true,
      }),
    ).rejects.toBe(unsupported);
    expect(adapter.getFlashcardAnswerByCardId).not.toHaveBeenCalled();
  });
});
