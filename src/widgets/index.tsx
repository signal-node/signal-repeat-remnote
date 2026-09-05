import {
  declareIndexPlugin,
  type ReactRNPlugin,
} from '@remnote/plugin-sdk';
import { createRemNoteAdapter } from '../services/remnoteAdapter';
import type { RepeatPopupContextData } from '../types/repeatSession';
import '../style.css';
import '../index.css';

async function onActivate(plugin: ReactRNPlugin): Promise<void> {
  const adapter = createRemNoteAdapter(plugin);
  await adapter.registerRepeatSettings();
  await adapter.registerRepeatPopup();
  await adapter.registerCommand({
    id: 'signal-repeat.open-preview-session',
    name: 'Signal Repeat: Open preview session',
    description: 'Open a repeat session with fixed placeholder text.',
    action: async () => {
      const settings = await adapter.getRepeatSettings();
      const context: RepeatPopupContextData = {
        targetText: 'Repeat only what matters.',
        durationSeconds: settings.duration,
        showProgressBar: settings.showProgressBar,
        showCloseHint: settings.showCloseHint,
      };

      await adapter.openRepeatPopup(context);
    },
  });
}

async function onDeactivate(_plugin: ReactRNPlugin): Promise<void> {}

declareIndexPlugin(onActivate, onDeactivate);
