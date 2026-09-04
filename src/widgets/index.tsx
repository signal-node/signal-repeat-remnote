import { declareIndexPlugin, type ReactRNPlugin } from '@remnote/plugin-sdk';
import '../style.css';
import '../index.css';

async function onActivate(_plugin: ReactRNPlugin): Promise<void> {
  // Plugin registration is added incrementally from the product specification.
}

async function onDeactivate(_plugin: ReactRNPlugin): Promise<void> {}

declareIndexPlugin(onActivate, onDeactivate);
