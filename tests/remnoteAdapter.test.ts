import { describe, expect, it, vi } from 'vitest';
import type { RichTextInterface } from '@remnote/plugin-sdk';
import {
  createRemNoteAdapterFromSdk,
  RemNoteAdapterError,
  UnsupportedFlashcardError,
  type RemNoteSdkFacade,
} from '../src/services/remnoteAdapter';

const text = (value: string): RichTextInterface => [value];

function createSdk(): RemNoteSdkFacade {
  return {
    editor: {
      getSelectedText: vi.fn(async () => undefined),
      getFocusedEditorText: vi.fn(async () => undefined),
    },
    focus: { getFocusedRem: vi.fn(async () => undefined) },
    queue: {
      hasRevealedAnswer: vi.fn(async () => false),
      getCurrentCard: vi.fn(async () => undefined),
    },
    card: {
      findOne: vi.fn(async () => undefined),
    },
    rem: {
      findOne: vi.fn(async () => undefined),
    },
    app: {
      registerCommand: vi.fn(async () => undefined),
      registerPopupWidget: vi.fn(async () => undefined),
      registerSelectedTextWidget: vi.fn(async () => undefined),
      registerFlashcardAnswerWidget: vi.fn(async () => undefined),
      toast: vi.fn(async () => undefined),
    },
    settings: {
      getSetting: async <T>() => undefined as unknown as T,
      registerBooleanSetting: vi.fn(async () => undefined),
      registerDropdownSetting: vi.fn(async () => undefined),
    },
    events: {
      subscribeFlashcardAnswerChanges: vi.fn(() => vi.fn()),
    },
    widget: {
      closePopup: vi.fn(async () => undefined),
      getPopupContext: vi.fn(async () => ({ contextData: undefined })),
      getFlashcardAnswerContext: vi.fn(async () => ({
        remId: 'rem-id',
        cardId: 'card-id',
        revealed: true,
      })),
      openPopup: vi.fn(async () => undefined),
    },
  };
}

describe('RemNote adapter reads', () => {
  it('preserves selected RichText for the official viewer', async () => {
    const sdk = createSdk();
    vi.mocked(sdk.editor.getSelectedText).mockResolvedValue({
      richText: text('selected'),
    });

    await expect(createRemNoteAdapterFromSdk(sdk).getSelectedText()).resolves.toEqual(
      text('selected'),
    );
  });

  it('reads only a revealed forward-card answer', async () => {
    const sdk = createSdk();
    vi.mocked(sdk.queue.hasRevealedAnswer).mockResolvedValue(true);
    vi.mocked(sdk.queue.getCurrentCard).mockResolvedValue({
      type: 'forward',
      getRem: async () => ({ text: text('question'), backText: text('answer') }),
    });

    await expect(createRemNoteAdapterFromSdk(sdk).getFlashcardAnswer()).resolves.toEqual(
      text('answer'),
    );
  });

  it('returns null for a hidden normal card after checking its shape', async () => {
    const sdk = createSdk();
    vi.mocked(sdk.queue.getCurrentCard).mockResolvedValue({
      type: 'forward',
      getRem: async () => ({ text: text('question'), backText: text('answer') }),
    });

    await expect(createRemNoteAdapterFromSdk(sdk).getFlashcardAnswer()).resolves.toBeNull();
    expect(sdk.queue.getCurrentCard).toHaveBeenCalledOnce();
  });

  it('rejects a hidden or item-level multiline card from the keyboard path', async () => {
    const sdk = createSdk();
    vi.mocked(sdk.queue.getCurrentCard).mockResolvedValue({
      type: 'forward',
      getRem: async () => ({
        text: text('question'),
        hasPowerup: vi.fn(async () => true),
      }),
    });

    await expect(
      createRemNoteAdapterFromSdk(sdk).getFlashcardAnswer(),
    ).rejects.toBeInstanceOf(UnsupportedFlashcardError);
  });

  it.each([
    ['forward', text('answer')] as const,
    ['backward', text('question')] as const,
  ])('resolves a %s card answer by card ID', async (type, expected) => {
    const sdk = createSdk();
    vi.mocked(sdk.card.findOne).mockResolvedValue({
      type,
      getRem: async () => ({ text: text('question'), backText: text('answer') }),
    });

    await expect(
      createRemNoteAdapterFromSdk(sdk).getFlashcardAnswerByCardId('card-id'),
    ).resolves.toEqual(expected);
    expect(sdk.card.findOne).toHaveBeenCalledWith('card-id');
  });

  it('does not guess the answer for a Cloze card', async () => {
    const sdk = createSdk();
    vi.mocked(sdk.card.findOne).mockResolvedValue({
      type: { clozeId: 'cloze-id' },
      getRem: async () => ({ text: text('whole Rem') }),
    });

    await expect(
      createRemNoteAdapterFromSdk(sdk).getFlashcardAnswerByCardId('card-id'),
    ).resolves.toBeNull();
  });

  it('rejects a card marked with the multiline powerup', async () => {
    const sdk = createSdk();
    vi.mocked(sdk.card.findOne).mockResolvedValue({
      type: 'forward',
      getRem: async () => ({
        text: text('question'),
        backText: text('incorrect parent answer'),
        hasPowerup: vi.fn(async () => true),
      }),
    });

    await expect(
      createRemNoteAdapterFromSdk(sdk).getFlashcardAnswerByCardId('card-id'),
    ).rejects.toBeInstanceOf(UnsupportedFlashcardError);
  });

  it('rejects a card with multiline child items', async () => {
    const sdk = createSdk();
    vi.mocked(sdk.card.findOne).mockResolvedValue({
      type: 'forward',
      getRem: async () => ({
        text: text('question'),
        backText: text('incorrect parent answer'),
        hasPowerup: vi.fn(async () => false),
        getChildrenRem: vi.fn(async () => [
          {
            text: text('child'),
            isCardItem: vi.fn(async () => true),
          },
        ]),
      }),
    });

    await expect(
      createRemNoteAdapterFromSdk(sdk).getFlashcardAnswerByCardId('card-id'),
    ).rejects.toBeInstanceOf(UnsupportedFlashcardError);
  });

  it('rejects a multiline answer Rem before a card ID is required', async () => {
    const sdk = createSdk();
    vi.mocked(sdk.rem.findOne).mockResolvedValue({
      text: text('question'),
      hasPowerup: vi.fn(async () => true),
    });

    await expect(
      createRemNoteAdapterFromSdk(sdk).assertFlashcardRemSupported('rem-id'),
    ).rejects.toBeInstanceOf(UnsupportedFlashcardError);
    expect(sdk.rem.findOne).toHaveBeenCalledWith('rem-id');
    expect(sdk.card.findOne).not.toHaveBeenCalled();
  });

  it('returns typed, content-free API errors', async () => {
    const sdk = createSdk();
    vi.mocked(sdk.focus.getFocusedRem).mockRejectedValue(
      new Error('private learning content'),
    );

    const error = await createRemNoteAdapterFromSdk(sdk)
      .getFocusedRemText()
      .catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(RemNoteAdapterError);
    expect(error).toMatchObject({
      info: { operation: 'focused-rem', code: 'api-unavailable' },
    });
    expect(String(error)).not.toContain('private learning content');
  });

  it('prefers focused editor text after verifying the focused Rem is safe', async () => {
    const sdk = createSdk();
    vi.mocked(sdk.editor.getFocusedEditorText).mockResolvedValue(
      text('focused editor'),
    );
    vi.mocked(sdk.focus.getFocusedRem).mockResolvedValue({
      text: text('focused Rem'),
    });

    await expect(
      createRemNoteAdapterFromSdk(sdk).getFocusedRemText(),
    ).resolves.toEqual(text('focused editor'));
    expect(sdk.focus.getFocusedRem).toHaveBeenCalledOnce();
  });

  it('rejects focused editor text when the focused Rem is multiline', async () => {
    const sdk = createSdk();
    vi.mocked(sdk.editor.getFocusedEditorText).mockResolvedValue(
      text('incorrect parent text'),
    );
    vi.mocked(sdk.focus.getFocusedRem).mockResolvedValue({
      text: text('question'),
      hasPowerup: vi.fn(async () => true),
    });

    await expect(
      createRemNoteAdapterFromSdk(sdk).getFocusedRemText(),
    ).rejects.toBeInstanceOf(UnsupportedFlashcardError);
    expect(sdk.editor.getFocusedEditorText).not.toHaveBeenCalled();
  });

  it('rejects focused multiline card items', async () => {
    const sdk = createSdk();
    vi.mocked(sdk.focus.getFocusedRem).mockResolvedValue({
      text: text('child answer'),
      isCardItem: vi.fn(async () => true),
    });

    await expect(
      createRemNoteAdapterFromSdk(sdk).getFocusedRemText(),
    ).rejects.toBeInstanceOf(UnsupportedFlashcardError);
    expect(sdk.editor.getFocusedEditorText).not.toHaveBeenCalled();
  });

  it('fails closed when the focused Rem card shape cannot be checked', async () => {
    const sdk = createSdk();
    vi.mocked(sdk.editor.getFocusedEditorText).mockResolvedValue(
      text('possibly incomplete editor text'),
    );
    vi.mocked(sdk.focus.getFocusedRem).mockResolvedValue({
      text: text('focused Rem'),
      hasPowerup: vi.fn(async () => {
        throw new Error('shape API unavailable');
      }),
    });

    await expect(
      createRemNoteAdapterFromSdk(sdk).getFocusedRemText(),
    ).rejects.toMatchObject({
      info: { operation: 'focused-rem', code: 'api-unavailable' },
    });
    expect(sdk.editor.getFocusedEditorText).not.toHaveBeenCalled();
  });

  it('falls back to the focused Rem when editor text is unavailable', async () => {
    const sdk = createSdk();
    vi.mocked(sdk.focus.getFocusedRem).mockResolvedValue({
      text: text('focused Rem'),
    });

    await expect(
      createRemNoteAdapterFromSdk(sdk).getFocusedRemText(),
    ).resolves.toEqual(text('focused Rem'));
  });

  it('falls back to the focused Rem when the editor API is unavailable', async () => {
    const sdk = createSdk();
    vi.mocked(sdk.editor.getFocusedEditorText).mockRejectedValue(
      new Error('editor API unavailable'),
    );
    vi.mocked(sdk.focus.getFocusedRem).mockResolvedValue({
      text: text('focused Rem'),
    });

    await expect(
      createRemNoteAdapterFromSdk(sdk).getFocusedRemText(),
    ).resolves.toEqual(text('focused Rem'));
  });

  it('uses focused editor text when the focused Rem API is unavailable', async () => {
    const sdk = createSdk();
    vi.mocked(sdk.focus.getFocusedRem).mockRejectedValue(
      new Error('focused Rem API unavailable'),
    );
    vi.mocked(sdk.editor.getFocusedEditorText).mockResolvedValue(
      text('focused editor'),
    );

    await expect(
      createRemNoteAdapterFromSdk(sdk).getFocusedRemText(),
    ).resolves.toEqual(text('focused editor'));
  });

  it('falls back to the focused Rem when editor text is empty', async () => {
    const sdk = createSdk();
    vi.mocked(sdk.editor.getFocusedEditorText).mockResolvedValue(text('  '));
    vi.mocked(sdk.focus.getFocusedRem).mockResolvedValue({
      text: text('focused Rem'),
    });

    await expect(
      createRemNoteAdapterFromSdk(sdk).getFocusedRemText(),
    ).resolves.toEqual(text('focused Rem'));
  });

  it('keeps image-only RichText as a repeat target', async () => {
    const sdk = createSdk();
    vi.mocked(sdk.focus.getFocusedRem).mockResolvedValue({
      text: [{ i: 'i', url: 'https://example.invalid/image.png' }],
    });

    await expect(
      createRemNoteAdapterFromSdk(sdk).getFocusedRemText(),
    ).resolves.toEqual([
      { i: 'i', url: 'https://example.invalid/image.png' },
    ]);
  });
});

describe('RemNote adapter registration', () => {
  it('closes the popup and requests focus restoration', async () => {
    const sdk = createSdk();

    await createRemNoteAdapterFromSdk(sdk).closeRepeatPopup();

    expect(sdk.widget.closePopup).toHaveBeenCalledWith(true);
  });

  it('registers the selected-text widget through the SDK boundary', async () => {
    const sdk = createSdk();

    await createRemNoteAdapterFromSdk(sdk).registerSelectedTextMenu();

    expect(sdk.app.registerSelectedTextWidget).toHaveBeenCalledWith(
      'selectedText',
    );
  });

  it('registers the flashcard-answer widget through the SDK boundary', async () => {
    const sdk = createSdk();

    await createRemNoteAdapterFromSdk(sdk).registerFlashcardAnswerWidget();

    expect(sdk.app.registerFlashcardAnswerWidget).toHaveBeenCalledWith(
      'flashcardAnswer',
    );
  });

  it('subscribes and cleans up flashcard refresh events through the SDK boundary', () => {
    const sdk = createSdk();
    const cleanup = vi.fn();
    vi.mocked(sdk.events.subscribeFlashcardAnswerChanges).mockReturnValue(
      cleanup,
    );
    const listener = vi.fn();

    const unsubscribe =
      createRemNoteAdapterFromSdk(sdk).subscribeFlashcardAnswerChanges(listener);

    expect(sdk.events.subscribeFlashcardAnswerChanges).toHaveBeenCalledWith(
      listener,
    );
    unsubscribe();
    expect(cleanup).toHaveBeenCalledOnce();
  });

});
