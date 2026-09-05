import { describe, expect, it, vi } from 'vitest';
import type { RemNoteAdapter } from '../src/services/remnoteAdapter';
import {
  START_FAILED_MESSAGE,
  startRepeat,
  TARGET_MISSING_MESSAGE,
} from '../src/services/startRepeat';
import { resolveSelectedTextTarget } from '../src/services/targetResolver';

type StartAdapter = Pick<
  RemNoteAdapter,
  | 'getSelectedText'
  | 'getFlashcardAnswer'
  | 'getFocusedRemText'
  | 'getRepeatSettings'
  | 'openRepeatPopup'
  | 'showToast'
>;

function createAdapter(): StartAdapter {
  return {
    getSelectedText: vi.fn(async () => 'selected text'),
    getFlashcardAnswer: vi.fn(async () => null),
    getFocusedRemText: vi.fn(async () => null),
    getRepeatSettings: vi.fn(async () => ({
      duration: 15 as const,
      showProgressBar: true,
      showCloseHint: false,
    })),
    openRepeatPopup: vi.fn(async () => undefined),
    showToast: vi.fn(async () => undefined),
  };
}

describe('startRepeat', () => {
  it('opens the popup with the exact selected text and current settings', async () => {
    const adapter = createAdapter();

    await expect(
      startRepeat(adapter, () => resolveSelectedTextTarget(adapter)),
    ).resolves.toBe('started');
    expect(adapter.openRepeatPopup).toHaveBeenCalledWith({
      targetText: 'selected text',
      durationSeconds: 15,
      showProgressBar: true,
      showCloseHint: false,
    });
    expect(adapter.showToast).not.toHaveBeenCalled();
  });

  it('shows a fixed notification and does not open an empty popup', async () => {
    const adapter = createAdapter();

    await expect(startRepeat(adapter, async () => null)).resolves.toBe(
      'target-missing',
    );
    expect(adapter.showToast).toHaveBeenCalledWith(TARGET_MISSING_MESSAGE);
    expect(adapter.getRepeatSettings).not.toHaveBeenCalled();
    expect(adapter.openRepeatPopup).not.toHaveBeenCalled();
  });

  it('shows a content-free notification when startup fails', async () => {
    const adapter = createAdapter();
    vi.mocked(adapter.getSelectedText).mockRejectedValue(
      new Error('private learning content'),
    );

    await expect(
      startRepeat(adapter, () => resolveSelectedTextTarget(adapter)),
    ).resolves.toBe('failed');
    expect(adapter.showToast).toHaveBeenCalledWith(START_FAILED_MESSAGE);
    expect(String(vi.mocked(adapter.showToast).mock.calls)).not.toContain(
      'private learning content',
    );
    expect(adapter.openRepeatPopup).not.toHaveBeenCalled();
  });

  it('prevents a rejected toast from escaping the failure boundary', async () => {
    const adapter = createAdapter();
    vi.mocked(adapter.showToast).mockRejectedValue(new Error('toast failed'));

    await expect(startRepeat(adapter, async () => {
      throw new Error('read failed');
    })).resolves.toBe('failed');
  });
});
