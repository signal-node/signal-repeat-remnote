import {
  DEFAULT_REPEAT_SETTINGS,
  validateBooleanSetting,
  validateRepeatDuration,
} from './settingsService';
import type { RepeatPopupContextData } from '../types/repeatSession';

export function parseRepeatPopupContext(
  contextData: unknown,
): RepeatPopupContextData | null {
  if (typeof contextData !== 'object' || contextData === null) {
    return null;
  }

  const candidate = contextData as Record<string, unknown>;
  if (
    typeof candidate.targetText !== 'string' ||
    candidate.targetText.trim().length === 0
  ) {
    return null;
  }

  return {
    targetText: candidate.targetText,
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
