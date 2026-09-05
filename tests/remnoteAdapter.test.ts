import { describe, expect, it, vi } from 'vitest';
import type { RichTextInterface } from '@remnote/plugin-sdk';
import {
  createRemNoteAdapterFromSdk,
  RemNoteAdapterError,
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
    richText: {
      toString: vi.fn(async (richText: RichTextInterface) =>
        richText.filter((value): value is string => typeof value === 'string').join(''),
      ),
    },
    app: {
      registerCommand: vi.fn(async () => undefined),
      registerPopupWidget: vi.fn(async () => undefined),
      registerSelectedTextWidget: vi.fn(async () => undefined),
      toast: vi.fn(async () => undefined),
    },
    settings: {
      getSetting: async <T>() => undefined as unknown as T,
      registerBooleanSetting: vi.fn(async () => undefined),
      registerDropdownSetting: vi.fn(async () => undefined),
    },
    widget: {
      closePopup: vi.fn(async () => undefined),
      getPopupContext: vi.fn(async () => ({ contextData: undefined })),
      openPopup: vi.fn(async () => undefined),
    },
  };
}

describe('RemNote adapter reads', () => {
  it('converts selected RichText to plain text', async () => {
    const sdk = createSdk();
    vi.mocked(sdk.editor.getSelectedText).mockResolvedValue({
      richText: text('selected'),
    });

    await expect(createRemNoteAdapterFromSdk(sdk).getSelectedText()).resolves.toBe(
      'selected',
    );
  });

  it('reads only a revealed forward-card answer', async () => {
    const sdk = createSdk();
    vi.mocked(sdk.queue.hasRevealedAnswer).mockResolvedValue(true);
    vi.mocked(sdk.queue.getCurrentCard).mockResolvedValue({
      type: 'forward',
      getRem: async () => ({ text: text('question'), backText: text('answer') }),
    });

    await expect(createRemNoteAdapterFromSdk(sdk).getFlashcardAnswer()).resolves.toBe(
      'answer',
    );
  });

  it('returns null without reading a hidden card', async () => {
    const sdk = createSdk();

    await expect(createRemNoteAdapterFromSdk(sdk).getFlashcardAnswer()).resolves.toBeNull();
    expect(sdk.queue.getCurrentCard).not.toHaveBeenCalled();
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

  it('prefers focused editor text over the focused Rem', async () => {
    const sdk = createSdk();
    vi.mocked(sdk.editor.getFocusedEditorText).mockResolvedValue(
      text('focused editor'),
    );
    vi.mocked(sdk.focus.getFocusedRem).mockResolvedValue({
      text: text('focused Rem'),
    });

    await expect(
      createRemNoteAdapterFromSdk(sdk).getFocusedRemText(),
    ).resolves.toBe('focused editor');
    expect(sdk.focus.getFocusedRem).not.toHaveBeenCalled();
  });

  it('falls back to the focused Rem when editor text is unavailable', async () => {
    const sdk = createSdk();
    vi.mocked(sdk.focus.getFocusedRem).mockResolvedValue({
      text: text('focused Rem'),
    });

    await expect(
      createRemNoteAdapterFromSdk(sdk).getFocusedRemText(),
    ).resolves.toBe('focused Rem');
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
    ).resolves.toBe('focused Rem');
  });

  it('falls back to the focused Rem when editor text is empty', async () => {
    const sdk = createSdk();
    vi.mocked(sdk.editor.getFocusedEditorText).mockResolvedValue(text('  '));
    vi.mocked(sdk.focus.getFocusedRem).mockResolvedValue({
      text: text('focused Rem'),
    });

    await expect(
      createRemNoteAdapterFromSdk(sdk).getFocusedRemText(),
    ).resolves.toBe('focused Rem');
  });

  it('returns empty plain text for a non-text focused Rem', async () => {
    const sdk = createSdk();
    vi.mocked(sdk.focus.getFocusedRem).mockResolvedValue({
      text: [{ i: 'i', url: 'https://example.invalid/image.png' }],
    });

    await expect(
      createRemNoteAdapterFromSdk(sdk).getFocusedRemText(),
    ).resolves.toBe('');
  });
});

describe('RemNote adapter registration', () => {
  it('registers the selected-text widget through the SDK boundary', async () => {
    const sdk = createSdk();

    await createRemNoteAdapterFromSdk(sdk).registerSelectedTextMenu();

    expect(sdk.app.registerSelectedTextWidget).toHaveBeenCalledWith(
      'selectedText',
    );
  });
});
