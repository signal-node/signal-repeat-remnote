import { declareIndexPlugin, type ReactRNPlugin } from '@remnote/plugin-sdk';
import { registerRepeatSettings } from '../services/settingsService';
import '../style.css';
import '../index.css';

async function onActivate(plugin: ReactRNPlugin): Promise<void> {
  await registerRepeatSettings(plugin.settings);
}

async function onDeactivate(_plugin: ReactRNPlugin): Promise<void> {}

declareIndexPlugin(onActivate, onDeactivate);
