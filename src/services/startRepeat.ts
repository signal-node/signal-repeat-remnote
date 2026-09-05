import type { RemNoteAdapter } from './remnoteAdapter';
import { resolveRepeatTarget } from './targetResolver';
import type { RepeatTarget } from '../types/repeatSession';

export const TARGET_MISSING_MESSAGE =
  'Signal Repeat: 反復するテキストを選択してください。';
export const START_FAILED_MESSAGE =
  'Signal Repeat: 反復セッションを開始できませんでした。';

export type RepeatTargetResolver = () => Promise<RepeatTarget | null>;
export type StartRepeatResult =
  | 'started'
  | 'target-missing'
  | 'failed'
  | 'cancelled';

type StartRepeatAdapter = Pick<
  RemNoteAdapter,
  | 'getSelectedText'
  | 'getFlashcardAnswer'
  | 'getFocusedRemText'
  | 'getRepeatSettings'
  | 'openRepeatPopup'
  | 'showToast'
>;

export async function startRepeat(
  adapter: StartRepeatAdapter,
  resolveTarget: RepeatTargetResolver = () => resolveRepeatTarget(adapter),
  isActive: () => boolean = () => true,
): Promise<StartRepeatResult> {
  try {
    if (!isActive()) {
      return 'cancelled';
    }

    const target = await resolveTarget();
    if (!isActive()) {
      return 'cancelled';
    }

    if (!target) {
      await adapter.showToast(TARGET_MISSING_MESSAGE);
      return 'target-missing';
    }

    const settings = await adapter.getRepeatSettings();
    if (!isActive()) {
      return 'cancelled';
    }

    await adapter.openRepeatPopup({
      targetText: target.text,
      durationSeconds: settings.duration,
      showProgressBar: settings.showProgressBar,
      showCloseHint: settings.showCloseHint,
    });

    return 'started';
  } catch {
    await adapter.showToast(START_FAILED_MESSAGE).catch(() => undefined);
    return 'failed';
  }
}
