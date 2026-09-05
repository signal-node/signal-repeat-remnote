import {
  type PluginCardType,
  type RichTextInterface,
  type RNPlugin,
  type WidgetLocation,
} from '@remnote/plugin-sdk';
import {
  getRepeatSettings,
  registerRepeatSettings,
  type RepeatSettings,
  type RepeatSettingsApi,
} from './settingsService';
import type { RepeatPopupContextData } from '../types/repeatSession';

export type RemNoteReadOperation =
  | 'selected-text'
  | 'flashcard-answer'
  | 'focused-rem'
  | 'popup-context';

export type RemNoteAdapterErrorInfo = {
  operation: RemNoteReadOperation;
  code: 'api-unavailable';
};

export class RemNoteAdapterError extends Error {
  readonly info: RemNoteAdapterErrorInfo;

  constructor(info: RemNoteAdapterErrorInfo) {
    super(`RemNote API unavailable: ${info.operation}`);
    this.name = 'RemNoteAdapterError';
    this.info = info;
  }
}

type AdapterRem = {
  text: RichTextInterface | undefined;
  backText?: RichTextInterface;
};

type AdapterCard = {
  type: PluginCardType;
  getRem: () => Promise<AdapterRem | undefined>;
};

export type RemNoteSdkFacade = {
  editor: {
    getSelectedText: () => Promise<
      { richText: RichTextInterface } | undefined
    >;
  };
  focus: {
    getFocusedRem: () => Promise<AdapterRem | undefined>;
  };
  queue: {
    hasRevealedAnswer: () => Promise<boolean>;
    getCurrentCard: () => Promise<AdapterCard | undefined>;
  };
  richText: {
    toString: (richText: RichTextInterface) => Promise<string>;
  };
  app: {
    registerCommand: (command: {
      id: string;
      name: string;
      description?: string;
      action: () => void | Promise<void>;
    }) => Promise<void>;
    registerPopupWidget: (
      fileName: string,
      options: {
        dimensions: { height: number; width: number };
      },
    ) => Promise<void>;
    registerSelectedTextWidget: (fileName: string) => Promise<void>;
    toast: (message: string) => Promise<void>;
  };
  settings: RepeatSettingsApi;
  widget: {
    closePopup: (restoreFocus?: boolean) => Promise<void>;
    getPopupContext: () => Promise<{
      contextData: unknown;
    }>;
    openPopup: (
      widgetFileName: string,
      contextData?: RepeatPopupContextData,
      clickOutsideToClose?: boolean,
    ) => Promise<void>;
  };
};

export type RepeatCommand = {
  id: string;
  name: string;
  description?: string;
  action: () => void | Promise<void>;
};

export type RemNoteAdapter = {
  getSelectedText: () => Promise<string | null>;
  getFlashcardAnswer: () => Promise<string | null>;
  getFocusedRemText: () => Promise<string | null>;
  getPopupContextData: () => Promise<unknown>;
  getRepeatSettings: () => Promise<RepeatSettings>;
  registerRepeatSettings: () => Promise<void>;
  registerRepeatPopup: () => Promise<void>;
  registerSelectedTextMenu: () => Promise<void>;
  registerCommand: (command: RepeatCommand) => Promise<void>;
  openRepeatPopup: (context: RepeatPopupContextData) => Promise<void>;
  closeRepeatPopup: () => Promise<void>;
  showToast: (message: string) => Promise<void>;
};

async function readPlainText(
  sdk: RemNoteSdkFacade,
  operation: RemNoteReadOperation,
  readRichText: () => Promise<RichTextInterface | undefined>,
): Promise<string | null> {
  try {
    const richText = await readRichText();
    return richText === undefined ? null : await sdk.richText.toString(richText);
  } catch {
    throw new RemNoteAdapterError({ operation, code: 'api-unavailable' });
  }
}

function answerRichText(
  cardType: PluginCardType,
  rem: AdapterRem,
): RichTextInterface | undefined {
  if (cardType === 'backward') {
    return rem.text;
  }

  if (cardType === 'forward') {
    return rem.backText;
  }

  // Advanced cloze extraction is outside the MVP. The revealed Rem text is the
  // safest public-SDK fallback for a cloze card.
  return rem.text;
}

export function createRemNoteAdapterFromSdk(
  sdk: RemNoteSdkFacade,
): RemNoteAdapter {
  return {
    getSelectedText: () =>
      readPlainText(sdk, 'selected-text', async () => {
        const selection = await sdk.editor.getSelectedText();
        return selection?.richText;
      }),

    getFlashcardAnswer: () =>
      readPlainText(sdk, 'flashcard-answer', async () => {
        if (!(await sdk.queue.hasRevealedAnswer())) {
          return undefined;
        }

        const card = await sdk.queue.getCurrentCard();
        if (!card) {
          return undefined;
        }

        const rem = await card.getRem();
        return rem ? answerRichText(card.type, rem) : undefined;
      }),

    getFocusedRemText: () =>
      readPlainText(sdk, 'focused-rem', async () => {
        const rem = await sdk.focus.getFocusedRem();
        return rem?.text;
      }),

    getPopupContextData: async () => {
      try {
        const context = await sdk.widget.getPopupContext();
        return context.contextData;
      } catch {
        throw new RemNoteAdapterError({
          operation: 'popup-context',
          code: 'api-unavailable',
        });
      }
    },

    getRepeatSettings: () => getRepeatSettings(sdk.settings),
    registerRepeatSettings: () => registerRepeatSettings(sdk.settings),
    registerRepeatPopup: () =>
      sdk.app.registerPopupWidget('popup', {
        dimensions: { height: 600, width: 900 },
      }),
    registerSelectedTextMenu: () =>
      sdk.app.registerSelectedTextWidget('selectedText'),
    registerCommand: (command) => sdk.app.registerCommand(command),
    openRepeatPopup: (context) =>
      sdk.widget.openPopup('popup', context, false),
    closeRepeatPopup: () => sdk.widget.closePopup(true),
    showToast: (message) => sdk.app.toast(message),
  };
}

export function createRemNoteAdapter(plugin: RNPlugin): RemNoteAdapter {
  const popupLocation = 'Popup' as WidgetLocation;
  const selectedTextMenuLocation = 'SelectedTextMenu' as WidgetLocation;

  return createRemNoteAdapterFromSdk({
    editor: {
      getSelectedText: () => plugin.editor.getSelectedText(),
    },
    focus: {
      getFocusedRem: () => plugin.focus.getFocusedRem(),
    },
    queue: {
      hasRevealedAnswer: () => plugin.queue.hasRevealedAnswer(),
      getCurrentCard: () => plugin.queue.getCurrentCard(),
    },
    richText: {
      toString: (richText) => plugin.richText.toString(richText),
    },
    app: {
      registerCommand: (command) => plugin.app.registerCommand(command),
      registerPopupWidget: (fileName, options) =>
        plugin.app.registerWidget(fileName, popupLocation, options),
      registerSelectedTextWidget: (fileName) =>
        plugin.app.registerWidget(fileName, selectedTextMenuLocation, {
          dimensions: { height: 'auto', width: '100%' },
          widgetTabTitle: 'Signal Repeat',
        }),
      toast: (message) => plugin.app.toast(message),
    },
    settings: plugin.settings,
    widget: {
      closePopup: (restoreFocus) => plugin.widget.closePopup(restoreFocus),
      getPopupContext: async () => {
        const context =
          await plugin.widget.getWidgetContext<WidgetLocation.Popup>();
        return { contextData: context.contextData };
      },
      openPopup: (widgetFileName, contextData, clickOutsideToClose) =>
        plugin.widget.openPopup(
          widgetFileName,
          contextData,
          clickOutsideToClose,
        ),
    },
  });
}
