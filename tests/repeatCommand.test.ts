import { describe, expect, it, vi } from 'vitest';
import type { RemNoteAdapter } from '../src/services/remnoteAdapter';
import {
  createRepeatCommandController,
  REPEAT_COMMAND_ID,
  REPEAT_COMMAND_SHORTCUT,
} from '../src/services/repeatCommand';
import { TARGET_MISSING_MESSAGE } from '../src/services/startRepeat';

type CommandAdapter = Pick<
  RemNoteAdapter,
  | 'getSelectedText'
  | 'getFlashcardAnswer'
  | 'getFocusedRemText'
  | 'getRepeatSettings'
  | 'openRepeatPopup'
  | 'showToast'
>;

function createAdapter(): CommandAdapter {
  return {
    getSelectedText: vi.fn(async () => 'selected text'),
    getFlashcardAnswer: vi.fn(async () => 'answer'),
    getFocusedRemText: vi.fn(async () => 'focused text'),
    getRepeatSettings: vi.fn(async () => ({
      duration: 15 as const,
      showProgressBar: true,
      showCloseHint: true,
    })),
    openRepeatPopup: vi.fn(async () => undefined),
    showToast: vi.fn(async () => undefined),
  };
}

describe('repeat command', () => {
  it('exposes user-facing metadata and the default shortcut', () => {
    const { command } = createRepeatCommandController(createAdapter());

    expect(command).toMatchObject({
      id: REPEAT_COMMAND_ID,
      name: 'Signal Repeat: Repeat in focus',
      description: expect.any(String),
      keywords: expect.stringContaining('repeat'),
      keyboardShortcut: REPEAT_COMMAND_SHORTCUT,
    });
    expect(command.description).not.toHaveLength(0);
  });

  it('uses the common start flow and prioritizes selected text', async () => {
    const adapter = createAdapter();
    const { command } = createRepeatCommandController(adapter);

    await command.action();

    expect(adapter.openRepeatPopup).toHaveBeenCalledWith({
      targetText: 'selected text',
      durationSeconds: 15,
      showProgressBar: true,
      showCloseHint: true,
    });
    expect(adapter.getFlashcardAnswer).not.toHaveBeenCalled();
    expect(adapter.getFocusedRemText).not.toHaveBeenCalled();
  });

  it('shows a fixed toast instead of opening an empty popup', async () => {
    const adapter = createAdapter();
    vi.mocked(adapter.getSelectedText).mockResolvedValue(null);
    vi.mocked(adapter.getFlashcardAnswer).mockResolvedValue(null);
    vi.mocked(adapter.getFocusedRemText).mockResolvedValue(null);
    const { command } = createRepeatCommandController(adapter);

    await command.action();

    expect(adapter.showToast).toHaveBeenCalledWith(TARGET_MISSING_MESSAGE);
    expect(adapter.openRepeatPopup).not.toHaveBeenCalled();
  });

  it('ignores a concurrent invocation while target resolution is in progress', async () => {
    const adapter = createAdapter();
    let resolveSelection: ((text: string) => void) | undefined;
    vi.mocked(adapter.getSelectedText).mockImplementation(
      () => new Promise((resolve) => {
        resolveSelection = resolve;
      }),
    );
    const { command } = createRepeatCommandController(adapter);

    const firstRun = command.action();
    const secondRun = command.action();
    expect(adapter.getSelectedText).toHaveBeenCalledTimes(1);

    resolveSelection?.('selected text');
    await Promise.all([firstRun, secondRun]);
    expect(adapter.openRepeatPopup).toHaveBeenCalledTimes(1);
  });

  it('cancels an in-flight invocation during deactivation', async () => {
    const adapter = createAdapter();
    let resolveSelection: ((text: string) => void) | undefined;
    vi.mocked(adapter.getSelectedText).mockImplementation(
      () => new Promise((resolve) => {
        resolveSelection = resolve;
      }),
    );
    const controller = createRepeatCommandController(adapter);

    const run = controller.command.action();
    controller.deactivate();
    resolveSelection?.('selected text');
    await run;

    expect(adapter.openRepeatPopup).not.toHaveBeenCalled();
    expect(adapter.showToast).not.toHaveBeenCalled();
  });

  it('ignores new invocations after deactivation', async () => {
    const adapter = createAdapter();
    const controller = createRepeatCommandController(adapter);

    controller.deactivate();
    await controller.command.action();

    expect(adapter.getSelectedText).not.toHaveBeenCalled();
    expect(adapter.openRepeatPopup).not.toHaveBeenCalled();
  });
});
