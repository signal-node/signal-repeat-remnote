import {
  type AppEvent,
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

const FLASHCARD_ANSWER_REFRESH_EVENTS: readonly AppEvent[] = [
  'queue.load-card',
  'queue.reveal-answer',
  'setting.changed',
];

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

export type FlashcardAnswerContext = {
  remId: string;
  cardId?: string;
  revealed: boolean;
};

export type RemNoteSdkFacade = {
  editor: {
    getSelectedText: () => Promise<
      { richText: RichTextInterface } | undefined
    >;
    getFocusedEditorText: () => Promise<RichTextInterface | undefined>;
  };
  focus: {
    getFocusedRem: () => Promise<AdapterRem | undefined>;
  };
  queue: {
    hasRevealedAnswer: () => Promise<boolean>;
    getCurrentCard: () => Promise<AdapterCard | undefined>;
  };
  card: {
    findOne: (cardId: string) => Promise<AdapterCard | undefined>;
  };
  richText: {
    toString: (richText: RichTextInterface) => Promise<string>;
  };
  app: {
    registerCommand: (command: {
      id: string;
      name: string;
      description?: string;
      keywords?: string;
      keyboardShortcut?: string;
      action: () => void | Promise<void>;
    }) => Promise<void>;
    registerPopupWidget: (
      fileName: string,
      options: {
        dimensions: { height: number; width: number };
      },
    ) => Promise<void>;
    registerSelectedTextWidget: (fileName: string) => Promise<void>;
    registerFlashcardAnswerWidget: (fileName: string) => Promise<void>;
    toast: (message: string) => Promise<void>;
  };
  settings: RepeatSettingsApi;
  events: {
    subscribeFlashcardAnswerChanges: (
      listener: () => void,
    ) => () => void;
  };
  widget: {
    closePopup: (restoreFocus?: boolean) => Promise<void>;
    getPopupContext: () => Promise<{
      contextData: unknown;
    }>;
    getFlashcardAnswerContext: () => Promise<FlashcardAnswerContext>;
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
  keywords?: string;
  keyboardShortcut?: string;
  action: () => void | Promise<void>;
};

export type RemNoteAdapter = {
  getSelectedText: () => Promise<string | null>;
  getFlashcardAnswer: () => Promise<string | null>;
  getFlashcardAnswerByCardId: (cardId: string) => Promise<string | null>;
  getFocusedRemText: () => Promise<string | null>;
  getFlashcardAnswerContext: () => Promise<FlashcardAnswerContext>;
  getPopupContextData: () => Promise<unknown>;
  getRepeatSettings: () => Promise<RepeatSettings>;
  registerRepeatSettings: () => Promise<void>;
  registerRepeatPopup: () => Promise<void>;
  registerSelectedTextMenu: () => Promise<void>;
  registerFlashcardAnswerWidget: () => Promise<void>;
  subscribeFlashcardAnswerChanges: (listener: () => void) => () => void;
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

  // Advanced cloze extraction is outside the MVP. Do not guess which part of
  // the Rem is the currently revealed answer.
  return undefined;
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

    getFlashcardAnswerByCardId: (cardId) =>
      readPlainText(sdk, 'flashcard-answer', async () => {
        const card = await sdk.card.findOne(cardId);
        if (!card) {
          return undefined;
        }

        const rem = await card.getRem();
        return rem ? answerRichText(card.type, rem) : undefined;
      }),

    getFocusedRemText: async () => {
      try {
        const focusedEditorText = await sdk.editor.getFocusedEditorText();
        if (focusedEditorText !== undefined) {
          const plainEditorText = await sdk.richText.toString(focusedEditorText);
          if (plainEditorText.trim()) {
            return plainEditorText;
          }
        }
      } catch {
        // The focused Rem API remains a safe fallback when the editor API is
        // unavailable in the current host or context.
      }

      try {
        const rem = await sdk.focus.getFocusedRem();
        return rem?.text === undefined
          ? null
          : await sdk.richText.toString(rem.text);
      } catch {
        throw new RemNoteAdapterError({
          operation: 'focused-rem',
          code: 'api-unavailable',
        });
      }
    },

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

    getFlashcardAnswerContext: () => sdk.widget.getFlashcardAnswerContext(),

    getRepeatSettings: () => getRepeatSettings(sdk.settings),
    registerRepeatSettings: () => registerRepeatSettings(sdk.settings),
    registerRepeatPopup: () =>
      sdk.app.registerPopupWidget('popup', {
        dimensions: { height: 600, width: 900 },
      }),
    registerSelectedTextMenu: () =>
      sdk.app.registerSelectedTextWidget('selectedText'),
    registerFlashcardAnswerWidget: () =>
      sdk.app.registerFlashcardAnswerWidget('flashcardAnswer'),
    subscribeFlashcardAnswerChanges: (listener) =>
      sdk.events.subscribeFlashcardAnswerChanges(listener),
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
  const flashcardAnswerLocation = 'FlashcardAnswer' as WidgetLocation;

  return createRemNoteAdapterFromSdk({
    editor: {
      getSelectedText: () => plugin.editor.getSelectedText(),
      getFocusedEditorText: () => plugin.editor.getFocusedEditorText(),
    },
    focus: {
      getFocusedRem: () => plugin.focus.getFocusedRem(),
    },
    queue: {
      hasRevealedAnswer: () => plugin.queue.hasRevealedAnswer(),
      getCurrentCard: () => plugin.queue.getCurrentCard(),
    },
    card: {
      findOne: (cardId) => plugin.card.findOne(cardId),
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
      registerFlashcardAnswerWidget: (fileName) =>
        plugin.app.registerWidget(fileName, flashcardAnswerLocation, {
          dimensions: { height: 'auto', width: '100%' },
        }),
      toast: (message) => plugin.app.toast(message),
    },
    settings: plugin.settings,
    events: {
      subscribeFlashcardAnswerChanges: (listener) => {
        for (const eventId of FLASHCARD_ANSWER_REFRESH_EVENTS) {
          plugin.event.addListener(eventId, undefined, listener);
        }

        return () => {
          for (const eventId of FLASHCARD_ANSWER_REFRESH_EVENTS) {
            plugin.event.removeListener(eventId, undefined, listener);
          }
        };
      },
    },
    widget: {
      closePopup: (restoreFocus) => plugin.widget.closePopup(restoreFocus),
      getPopupContext: async () => {
        const context =
          await plugin.widget.getWidgetContext<WidgetLocation.Popup>();
        return { contextData: context.contextData };
      },
      getFlashcardAnswerContext: () =>
        plugin.widget.getWidgetContext<WidgetLocation.FlashcardAnswer>(),
      openPopup: (widgetFileName, contextData, clickOutsideToClose) =>
        plugin.widget.openPopup(
          widgetFileName,
          contextData,
          clickOutsideToClose,
        ),
    },
  });
}
