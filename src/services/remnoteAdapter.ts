import {
  type AppEvent,
  type BuiltInPowerupCodes,
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
import { prepareRepeatContent } from './repeatContent';
import type { RepeatPopupContextData } from '../types/repeatSession';

const FLASHCARD_ANSWER_REFRESH_EVENTS: readonly AppEvent[] = [
  'queue.load-card',
  'queue.reveal-answer',
  'setting.changed',
];

// BuiltInPowerupCodes.MultiLineCard in the pinned public SDK. Keep this local
// constant so service tests do not load the browser-only SDK runtime.
const MULTI_LINE_CARD_POWERUP_CODE = 'w';

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

export class UnsupportedFlashcardError extends Error {
  readonly code = 'unsupported-card' as const;

  constructor() {
    super('The revealed flashcard answer cannot be resolved safely.');
    this.name = 'UnsupportedFlashcardError';
  }
}

type AdapterRem = {
  text: RichTextInterface | undefined;
  backText?: RichTextInterface;
  getChildrenRem?: () => Promise<AdapterRem[]>;
  hasPowerup?: (powerupCode: BuiltInPowerupCodes | string) => Promise<boolean>;
  isCardItem?: () => Promise<boolean>;
  isListItem?: () => Promise<boolean>;
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
  rem: {
    findOne: (remId: string) => Promise<AdapterRem | undefined>;
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
  getSelectedText: () => Promise<RichTextInterface | null>;
  getFlashcardAnswer: () => Promise<RichTextInterface | null>;
  getFlashcardAnswerByCardId: (
    cardId: string,
  ) => Promise<RichTextInterface | null>;
  assertFlashcardRemSupported: (remId: string) => Promise<void>;
  getFocusedRemText: () => Promise<RichTextInterface | null>;
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

async function readRepeatContent(
  operation: RemNoteReadOperation,
  readRichText: () => Promise<RichTextInterface | undefined>,
): Promise<RichTextInterface | null> {
  try {
    return prepareRepeatContent(await readRichText());
  } catch (cause) {
    if (cause instanceof UnsupportedFlashcardError) {
      throw cause;
    }

    throw new RemNoteAdapterError({ operation, code: 'api-unavailable' });
  }
}

async function isMultiLineCard(rem: AdapterRem): Promise<boolean> {
  if (rem.isCardItem && (await rem.isCardItem())) {
    return true;
  }

  if (
    rem.hasPowerup &&
    (await rem.hasPowerup(MULTI_LINE_CARD_POWERUP_CODE))
  ) {
    return true;
  }

  if (!rem.getChildrenRem) {
    return false;
  }

  const children = await rem.getChildrenRem();
  const cardItemFlags = await Promise.all(
    children.map((child) => child.isCardItem?.() ?? Promise.resolve(false)),
  );
  return cardItemFlags.some(Boolean);
}

async function answerRichText(
  cardType: PluginCardType,
  rem: AdapterRem,
): Promise<RichTextInterface | undefined> {
  if (!(await isMultiLineCard(rem))) {
    return answerRichTextForDirection(cardType, rem);
  }

  if (rem.isCardItem && (await rem.isCardItem())) {
    throw new UnsupportedFlashcardError();
  }

  if (cardType === 'backward') {
    return rem.text;
  }

  if (cardType !== 'forward') {
    throw new UnsupportedFlashcardError();
  }

  return resolveForwardMultiLineSetAnswer(rem);
}

async function resolveForwardMultiLineSetAnswer(
  rem: AdapterRem,
): Promise<RichTextInterface> {
  if (!rem.getChildrenRem) {
    throw new UnsupportedFlashcardError();
  }

  const children = await rem.getChildrenRem();
  const cardItems: AdapterRem[] = [];

  for (const child of children) {
    if (child.isCardItem && (await child.isCardItem())) {
      cardItems.push(child);
    }
  }

  if (cardItems.length === 0) {
    throw new UnsupportedFlashcardError();
  }

  const answer: RichTextInterface = [];

  for (const [index, item] of cardItems.entries()) {
    // Numbered card items are revealed one at a time. The public SDK does not
    // expose which List item is currently rendered, so they remain disabled.
    if (!item.isListItem || (await item.isListItem())) {
      throw new UnsupportedFlashcardError();
    }

    // A nested multi-line item may be expanded in the queue. That expansion
    // state is not public, so direct-child reconstruction would be incomplete.
    if (await isMultiLineCardParent(item)) {
      throw new UnsupportedFlashcardError();
    }

    const content = prepareRepeatContent(item.text);
    if (!content) {
      throw new UnsupportedFlashcardError();
    }

    if (index > 0) {
      answer.push('\n');
    }
    answer.push(...content);
  }

  return answer;
}

async function isMultiLineCardParent(rem: AdapterRem): Promise<boolean> {
  if (
    rem.hasPowerup &&
    (await rem.hasPowerup(MULTI_LINE_CARD_POWERUP_CODE))
  ) {
    return true;
  }

  if (!rem.getChildrenRem) {
    return false;
  }

  const children = await rem.getChildrenRem();
  for (const child of children) {
    if (child.isCardItem && (await child.isCardItem())) {
      return true;
    }
  }

  return false;
}

function answerRichTextForDirection(
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
      readRepeatContent('selected-text', async () => {
        const selection = await sdk.editor.getSelectedText();
        return selection?.richText;
      }),

    getFlashcardAnswer: () =>
      readRepeatContent('flashcard-answer', async () => {
        const revealed = await sdk.queue.hasRevealedAnswer();
        const card = await sdk.queue.getCurrentCard();
        if (!card) {
          return undefined;
        }

        const rem = await card.getRem();
        if (!rem) {
          return undefined;
        }

        // RemNote can report hasRevealedAnswer() as false between item-level
        // steps of a multi-line card. Shape inspection is content-free and
        // must happen first so the keyboard path still fails closed.
        if (!revealed) {
          if (await isMultiLineCard(rem)) {
            throw new UnsupportedFlashcardError();
          }
          return undefined;
        }

        return answerRichText(card.type, rem);
      }),

    getFlashcardAnswerByCardId: (cardId) =>
      readRepeatContent('flashcard-answer', async () => {
        const card = await sdk.card.findOne(cardId);
        if (!card) {
          return undefined;
        }

        const rem = await card.getRem();
        return rem ? await answerRichText(card.type, rem) : undefined;
      }),

    assertFlashcardRemSupported: async (remId) => {
      try {
        const rem = await sdk.rem.findOne(remId);
        if (rem && (await isMultiLineCard(rem))) {
          throw new UnsupportedFlashcardError();
        }
      } catch (cause) {
        if (cause instanceof UnsupportedFlashcardError) {
          throw cause;
        }

        throw new RemNoteAdapterError({
          operation: 'flashcard-answer',
          code: 'api-unavailable',
        });
      }
    },

    getFocusedRemText: async () => {
      let focusedRem: AdapterRem | undefined;

      try {
        focusedRem = await sdk.focus.getFocusedRem();
      } catch {
        // The focused editor API can still provide a valid target when the
        // focused Rem API is unavailable in the current host or context.
      }

      if (focusedRem) {
        try {
          if (await isMultiLineCard(focusedRem)) {
            throw new UnsupportedFlashcardError();
          }
        } catch (cause) {
          if (cause instanceof UnsupportedFlashcardError) {
            throw cause;
          }

          // If the focused Rem was found but its card shape cannot be checked,
          // do not expose editor text that may be an incomplete multi-line
          // answer.
          throw new RemNoteAdapterError({
            operation: 'focused-rem',
            code: 'api-unavailable',
          });
        }
      }

      try {
        const focusedEditorText = await sdk.editor.getFocusedEditorText();
        const editorContent = prepareRepeatContent(focusedEditorText);
        if (editorContent) {
          return editorContent;
        }
      } catch {
        // The focused Rem API remains a safe fallback when the editor API is
        // unavailable in the current host or context.
      }

      try {
        if (!focusedRem) {
          focusedRem = await sdk.focus.getFocusedRem();
          if (focusedRem && (await isMultiLineCard(focusedRem))) {
            throw new UnsupportedFlashcardError();
          }
        }

        return prepareRepeatContent(focusedRem?.text);
      } catch (cause) {
        if (cause instanceof UnsupportedFlashcardError) {
          throw cause;
        }

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
    rem: {
      findOne: (remId) => plugin.rem.findOne(remId),
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
