import { renderWidget, usePlugin } from '@remnote/plugin-sdk';
import ReactDOM from 'react-dom';
import { useCallback, useMemo, useState } from 'react';
import { createRemNoteAdapter } from '../services/remnoteAdapter';
import { startRepeat } from '../services/startRepeat';
import { resolveSelectedTextTarget } from '../services/targetResolver';
import '../style.css';
import '../index.css';

function RepeatSelectedTextButton(): JSX.Element {
  const plugin = usePlugin();
  const adapter = useMemo(() => createRemNoteAdapter(plugin), [plugin]);
  const [starting, setStarting] = useState(false);

  const handleStart = useCallback(async () => {
    if (starting) {
      return;
    }

    setStarting(true);
    await startRepeat(adapter, () => resolveSelectedTextTarget(adapter));
    setStarting(false);
  }, [adapter, starting]);

  return (
    <button
      className="signal-repeat-selected-action"
      type="button"
      disabled={starting}
      aria-label="Repeat selected text in focus"
      onClick={() => void handleStart()}
    >
      <span aria-hidden="true">↻</span>
      <span>{starting ? 'Starting…' : 'Repeat in focus'}</span>
    </button>
  );
}

function BrowserPreview(): JSX.Element {
  return (
    <main className="signal-repeat-selected-preview">
      <div className="signal-repeat-selected-menu" role="menu">
        <button className="signal-repeat-selected-action" type="button">
          <span aria-hidden="true">↻</span>
          <span>Repeat in focus</span>
        </button>
      </div>
    </main>
  );
}

if (new URLSearchParams(window.location.search).has('preview')) {
  ReactDOM.render(<BrowserPreview />, document.body);
} else {
  renderWidget(RepeatSelectedTextButton);
}
