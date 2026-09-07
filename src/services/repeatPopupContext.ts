import {
  DEFAULT_REPEAT_SETTINGS,
  validateBooleanSetting,
  validateRepeatDuration,
} from './settingsService';
import { prepareRepeatContent } from './repeatContent';
import type { RepeatPopupContextData } from '../types/repeatSession';

export function parseRepeatPopupContext(
  contextData: unknown,
): RepeatPopupContextData | null {
  if (typeof contextData !== 'object' || contextData === null) {
    return null;
  }

  const candidate = contextData as Record<string, unknown>;
  const targetRichText = prepareRepeatContent(candidate.targetRichText);
  if (!targetRichText) {
    return null;
  }

  return {
    targetRichText,
    durationSeconds: validateRepeatDuration(candidate.durationSeconds),
    showProgressBar: validateBooleanSetting(
      candidate.showProgressBar,
      DEFAULT_REPEAT_SETTINGS.showProgressBar,
    ),
    showCloseHint: validateBooleanSetting(
      candidate.showCloseHint,
      DEFAULT_REPEAT_SETTINGS.showCloseHint,
    ),
  };
}
