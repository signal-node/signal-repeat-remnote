import { renderWidget, usePlugin } from '@remnote/plugin-sdk';
import ReactDOM from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RepeatButton } from '../components/RepeatButton';
import { resolveFlashcardAnswerTarget } from '../services/flashcardAnswer';
import {
  createRemNoteAdapter,
  type FlashcardAnswerContext,
} from '../services/remnoteAdapter';
import { DEFAULT_REPEAT_SETTINGS, type RepeatSettings } from '../services/settingsService';
import { startRepeat } from '../services/startRepeat';
import '../style.css';
import '../index.css';

type FlashcardAnswerView = {
  context: FlashcardAnswerContext;
  settings: RepeatSettings;
};

function FlashcardAnswerWidget(): JSX.Element | null {
  const plugin = usePlugin();
  const adapter = useMemo(() => createRemNoteAdapter(plugin), [plugin]);
  const [view, setView] = useState<FlashcardAnswerView>();
  const [starting, setStarting] = useState(false);
  const startingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => () => {
    mountedRef.current = false;
  }, []);

  useEffect(() => {
    let active = true;

    const refresh = () => {
      void Promise.all([
        adapter.getFlashcardAnswerContext(),
        adapter.getRepeatSettings(),
      ])
        .then(([context, settings]) => {
          if (active) {
            setView({ context, settings });
          }
        })
        .catch(() => {
          if (active) {
            setView(undefined);
          }
        });
    };

    const unsubscribe = adapter.subscribeFlashcardAnswerChanges(refresh);
    refresh();

    return () => {
      active = false;
      unsubscribe();
    };
  }, [adapter]);

  const handleStart = useCallback(async () => {
    if (startingRef.current) {
      return;
    }

    startingRef.current = true;
    setStarting(true);
    try {
      await startRepeat(adapter, async () => {
        const context = await adapter.getFlashcardAnswerContext();
        return resolveFlashcardAnswerTarget(adapter, context);
      });
    } finally {
      startingRef.current = false;
      if (mountedRef.current) {
        setStarting(false);
      }
    }
  }, [adapter]);

  if (!view?.context.revealed) {
    return null;
  }

  return (
    <RepeatButton
      durationSeconds={view.settings.duration}
      disabled={starting}
      onClick={() => void handleStart()}
    />
  );
}

function BrowserPreview(): JSX.Element {
  return (
    <main className="signal-repeat-flashcard-preview">
      <RepeatButton
        durationSeconds={DEFAULT_REPEAT_SETTINGS.duration}
        onClick={() => undefined}
      />
    </main>
  );
}

if (new URLSearchParams(window.location.search).has('preview')) {
  ReactDOM.render(<BrowserPreview />, document.body);
} else {
  renderWidget(FlashcardAnswerWidget);
}
