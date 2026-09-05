import { describe, expect, it, vi } from 'vitest';
import {
  RemNoteAdapterError,
  type RemNoteAdapter,
} from '../src/services/remnoteAdapter';
import {
  resolveRepeatTarget,
  resolveSelectedTextTarget,
  TargetResolutionError,
} from '../src/services/targetResolver';

type TargetAdapter = Pick<
  RemNoteAdapter,
  'getSelectedText' | 'getFlashcardAnswer' | 'getFocusedRemText'
>;

function createTargetAdapter(
  values: {
    selected?: string | null;
    answer?: string | null;
    focused?: string | null;
  } = {},
): TargetAdapter {
  return {
    getSelectedText: vi.fn(async () => values.selected ?? null),
    getFlashcardAnswer: vi.fn(async () => values.answer ?? null),
    getFocusedRemText: vi.fn(async () => values.focused ?? null),
  };
}

describe('resolveRepeatTarget', () => {
  it('uses selected text first and skips later readers', async () => {
    const adapter = createTargetAdapter({
      selected: '  selected  ',
      answer: 'answer',
      focused: 'focused',
    });

    await expect(resolveRepeatTarget(adapter)).resolves.toEqual({
      text: 'selected',
      source: 'selected-text',
    });
    expect(adapter.getFlashcardAnswer).not.toHaveBeenCalled();
    expect(adapter.getFocusedRemText).not.toHaveBeenCalled();
  });

  it('falls back to a revealed flashcard answer', async () => {
    const adapter = createTargetAdapter({ answer: 'answer', focused: 'focused' });

    await expect(resolveRepeatTarget(adapter)).resolves.toEqual({
      text: 'answer',
      source: 'flashcard-answer',
    });
    expect(adapter.getFocusedRemText).not.toHaveBeenCalled();
  });

  it('falls back to focused Rem text', async () => {
    const adapter = createTargetAdapter({ focused: 'focused' });

    await expect(resolveRepeatTarget(adapter)).resolves.toEqual({
      text: 'focused',
      source: 'focused-rem',
    });
  });

  it('treats empty and whitespace-only values as missing', async () => {
    const adapter = createTargetAdapter({
      selected: '   ',
      answer: '',
      focused: '\n\t',
    });

    await expect(resolveRepeatTarget(adapter)).resolves.toBeNull();
  });

  it('distinguishes an API failure without including learning content', async () => {
    const adapter = createTargetAdapter();
    vi.mocked(adapter.getSelectedText).mockRejectedValue(
      new RemNoteAdapterError({
        operation: 'selected-text',
        code: 'api-unavailable',
      }),
    );

    const error = await resolveRepeatTarget(adapter).catch((cause: unknown) => cause);
    expect(error).toBeInstanceOf(TargetResolutionError);
    expect(error).toMatchObject({
      info: { operation: 'selected-text', code: 'api-unavailable' },
    });
    expect(String(error)).not.toContain('private learning content');
    expect(adapter.getFlashcardAnswer).not.toHaveBeenCalled();
  });
});

describe('resolveSelectedTextTarget', () => {
  it('returns only the selected text target', async () => {
    const adapter = createTargetAdapter({ selected: '  selection only  ' });

    await expect(resolveSelectedTextTarget(adapter)).resolves.toEqual({
      text: 'selection only',
      source: 'selected-text',
    });
    expect(adapter.getFlashcardAnswer).not.toHaveBeenCalled();
    expect(adapter.getFocusedRemText).not.toHaveBeenCalled();
  });

  it('does not fall back when the selection disappears', async () => {
    const adapter = createTargetAdapter({ focused: 'focused' });

    await expect(resolveSelectedTextTarget(adapter)).resolves.toBeNull();
    expect(adapter.getFocusedRemText).not.toHaveBeenCalled();
  });
});
