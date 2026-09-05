import type { RemNoteAdapter, RepeatCommand } from './remnoteAdapter';
import { startRepeat } from './startRepeat';

export const REPEAT_COMMAND_ID = 'signal-repeat.start';
export const REPEAT_COMMAND_SHORTCUT = 'alt+m';

type RepeatCommandAdapter = Pick<
  RemNoteAdapter,
  | 'getSelectedText'
  | 'getFlashcardAnswer'
  | 'getFocusedRemText'
  | 'getRepeatSettings'
  | 'openRepeatPopup'
  | 'showToast'
>;

export type RepeatCommandController = {
  command: RepeatCommand;
  deactivate: () => void;
};

export function createRepeatCommandController(
  adapter: RepeatCommandAdapter,
): RepeatCommandController {
  let active = true;
  let starting = false;

  const command: RepeatCommand = {
    id: REPEAT_COMMAND_ID,
    name: 'Signal Repeat: Repeat in focus',
    description: 'Repeat the selected text or current learning target in focus.',
    keywords: 'signal repeat focus memorize repetition',
    keyboardShortcut: REPEAT_COMMAND_SHORTCUT,
    action: async () => {
      if (!active || starting) {
        return;
      }

      starting = true;
      try {
        await startRepeat(adapter, undefined, () => active);
      } finally {
        starting = false;
      }
    },
  };

  return {
    command,
    deactivate: () => {
      active = false;
      starting = false;
    },
  };
}
