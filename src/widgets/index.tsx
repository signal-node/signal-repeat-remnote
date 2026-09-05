import {
  declareIndexPlugin,
  type ReactRNPlugin,
  WidgetLocation,
} from '@remnote/plugin-sdk';
import {
  getRepeatSettings,
  registerRepeatSettings,
} from '../services/settingsService';
import type { RepeatPopupContextData } from '../types/repeatSession';
import '../style.css';
import '../index.css';

async function onActivate(plugin: ReactRNPlugin): Promise<void> {
  await registerRepeatSettings(plugin.settings);
  await plugin.app.registerWidget('popup', WidgetLocation.Popup, {
    dimensions: { height: 600, width: 900 },
  });
  await plugin.app.registerCommand({
    id: 'signal-repeat.open-preview-session',
    name: 'Signal Repeat: Open preview session',
    description: 'Open a repeat session with fixed placeholder text.',
    action: async () => {
      const settings = await getRepeatSettings(plugin.settings);
      const context: RepeatPopupContextData = {
        targetText: 'Repeat only what matters.',
        durationSeconds: settings.duration,
        showProgressBar: settings.showProgressBar,
        showCloseHint: settings.showCloseHint,
      };

      await plugin.widget.openPopup('popup', context, false);
    },
  });
}

async function onDeactivate(_plugin: ReactRNPlugin): Promise<void> {}

declareIndexPlugin(onActivate, onDeactivate);
