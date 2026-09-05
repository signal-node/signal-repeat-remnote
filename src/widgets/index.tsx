import {
  declareIndexPlugin,
  type ReactRNPlugin,
} from '@remnote/plugin-sdk';
import { createRemNoteAdapter } from '../services/remnoteAdapter';
import {
  createRepeatCommandController,
  type RepeatCommandController,
} from '../services/repeatCommand';
import '../style.css';
import '../index.css';

let repeatCommandController: RepeatCommandController | undefined;

async function onActivate(plugin: ReactRNPlugin): Promise<void> {
  if (repeatCommandController) {
    return;
  }

  const adapter = createRemNoteAdapter(plugin);
  const controller = createRepeatCommandController(adapter);
  repeatCommandController = controller;

  try {
    await adapter.registerRepeatSettings();
    await adapter.registerRepeatPopup();
    await adapter.registerSelectedTextMenu();
    await adapter.registerCommand(controller.command);
  } catch (cause) {
    controller.deactivate();
    repeatCommandController = undefined;
    throw cause;
  }
}

async function onDeactivate(_plugin: ReactRNPlugin): Promise<void> {
  repeatCommandController?.deactivate();
  repeatCommandController = undefined;
}

declareIndexPlugin(onActivate, onDeactivate);
