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
      getCurrentFlashcardAnswerForRem: vi.fn(async () => ['current answer']),
      getFlashcardAnswerByCardId: vi.fn(async () => ['answer']),
    };

    await expect(
      resolveFlashcardAnswerTarget(adapter, {
        remId: 'rem-id',
        cardId: 'card-id',
        revealed: true,
      }),
    ).resolves.toEqual({ content: ['answer'], source: 'flashcard-answer' });
    expect(adapter.getFlashcardAnswerByCardId).toHaveBeenCalledWith(
      'card-id',
      'rem-id',
    );
    expect(adapter.getCurrentFlashcardAnswerForRem).not.toHaveBeenCalled();
  });

  it('does not read a hidden card', async () => {
    const context = {
      remId: 'rem-id',
      cardId: 'card-id',
      revealed: false,
    };
    const adapter = {
      getCurrentFlashcardAnswerForRem: vi.fn(async () => ['current answer']),
      getFlashcardAnswerByCardId: vi.fn(async () => ['answer']),
    };

    await expect(
      resolveFlashcardAnswerTarget(adapter, context),
    ).resolves.toBeNull();
    expect(adapter.getFlashcardAnswerByCardId).not.toHaveBeenCalled();
    expect(adapter.getCurrentFlashcardAnswerForRem).not.toHaveBeenCalled();
  });

  it('treats an empty or unsupported answer as no target', async () => {
    const adapter = {
      getCurrentFlashcardAnswerForRem: vi.fn(async () => ['current answer']),
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
      getCurrentFlashcardAnswerForRem: vi.fn(async () => ['current answer']),
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

  it('uses the matching current queue card when the card ID is absent', async () => {
    const adapter = {
      getCurrentFlashcardAnswerForRem: vi.fn(async () => ['current answer']),
      getFlashcardAnswerByCardId: vi.fn(async () => ['other answer']),
    };

    await expect(
      resolveFlashcardAnswerTarget(adapter, {
        remId: 'current-rem-id',
        revealed: true,
      }),
    ).resolves.toEqual({
      content: ['current answer'],
      source: 'flashcard-answer',
    });
    expect(adapter.getCurrentFlashcardAnswerForRem).toHaveBeenCalledWith(
      'current-rem-id',
    );
    expect(adapter.getFlashcardAnswerByCardId).not.toHaveBeenCalled();
  });

  it('propagates an unsupported current queue card without a card ID', async () => {
    const unsupported = new Error('unsupported');
    const adapter = {
      getCurrentFlashcardAnswerForRem: vi.fn(async () => {
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
