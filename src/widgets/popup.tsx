import {
  renderWidget,
  usePlugin,
  WidgetLocation,
} from '@remnote/plugin-sdk';
import ReactDOM from 'react-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import { RepeatSessionModal } from '../components/RepeatSessionModal';
import { parseRepeatPopupContext } from '../services/repeatPopupContext';
import type {
  RepeatPopupContextData,
  RepeatSessionCloseReason,
} from '../types/repeatSession';
import '../style.css';
import '../index.css';

const PREVIEW_CONTEXT: RepeatPopupContextData = {
  targetText: 'Repeat only what matters.',
  durationSeconds: 10,
  showProgressBar: true,
  showCloseHint: true,
};

const LONG_PREVIEW_TEXT = Array.from(
  { length: 24 },
  (_, index) => `${index + 1}. Repeat only what matters.`,
).join('\n');

function PopupWidget(): JSX.Element | null {
  const plugin = usePlugin();
  const [context, setContext] = useState<RepeatPopupContextData | null>();
  const closingRef = useRef(false);

  const closePopup = useCallback(
    (_reason: RepeatSessionCloseReason) => {
      if (closingRef.current) {
        return;
      }

      closingRef.current = true;
      void plugin.widget.closePopup(true);
    },
    [plugin],
  );

  useEffect(() => {
    let active = true;

    void plugin.widget
      .getWidgetContext<WidgetLocation.Popup>()
      .then((widgetContext) => {
        if (active) {
          setContext(parseRepeatPopupContext(widgetContext.contextData));
        }
      })
      .catch(() => {
        if (active) {
          setContext(null);
        }
      });

    return () => {
      active = false;
    };
  }, [plugin]);

  useEffect(() => {
    if (context === null) {
      closePopup('cancelled');
    }
  }, [closePopup, context]);

  if (context === undefined) {
    return (
      <main
        className="signal-repeat-session signal-repeat-session--loading"
        aria-label="Signal Repeat session"
        aria-busy="true"
      />
    );
  }

  if (context === null) {
    return null;
  }

  return (
    <RepeatSessionModal
      targetText={context.targetText}
      durationMs={context.durationSeconds * 1_000}
      showProgressBar={context.showProgressBar}
      showCloseHint={context.showCloseHint}
      onClose={closePopup}
    />
  );
}

function BrowserPreview(): JSX.Element | null {
  const [open, setOpen] = useState(true);
  const previewMode = new URLSearchParams(window.location.search).get('preview');

  if (!open) {
    return null;
  }

  return (
    <RepeatSessionModal
      targetText={previewMode === 'long' ? LONG_PREVIEW_TEXT : PREVIEW_CONTEXT.targetText}
      durationMs={PREVIEW_CONTEXT.durationSeconds * 1_000}
      showProgressBar={PREVIEW_CONTEXT.showProgressBar}
      showCloseHint={PREVIEW_CONTEXT.showCloseHint}
      onClose={() => setOpen(false)}
    />
  );
}

function renderBrowserPreview(): void {
  ReactDOM.render(
    <BrowserPreview />,
    document.body,
  );
}

const isBrowserPreview = new URLSearchParams(window.location.search).has(
  'preview',
);

if (isBrowserPreview) {
  renderBrowserPreview();
} else {
  renderWidget(PopupWidget);
}
