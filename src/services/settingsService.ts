import type { SettingsNamespace } from '@remnote/plugin-sdk';

export const REPEAT_DURATION_OPTIONS = [10, 15, 20, 30] as const;

export type RepeatDurationSeconds = (typeof REPEAT_DURATION_OPTIONS)[number];

export type RepeatSettings = {
  duration: RepeatDurationSeconds;
  showProgressBar: boolean;
  showCloseHint: boolean;
};

export type RepeatSettingsApi = Pick<
  SettingsNamespace,
  'getSetting' | 'registerBooleanSetting' | 'registerDropdownSetting'
>;

export const REPEAT_SETTING_IDS = {
  duration: 'duration',
  showProgressBar: 'showProgressBar',
  showCloseHint: 'showCloseHint',
} as const;

export const DEFAULT_REPEAT_SETTINGS: Readonly<RepeatSettings> = {
  duration: 15,
  showProgressBar: true,
  showCloseHint: true,
};

export async function registerRepeatSettings(
  settings: RepeatSettingsApi,
): Promise<void> {
  await settings.registerDropdownSetting({
    id: REPEAT_SETTING_IDS.duration,
    title: 'Repeat duration',
    description: 'How long each focused repetition session runs.',
    defaultValue: String(DEFAULT_REPEAT_SETTINGS.duration),
    options: REPEAT_DURATION_OPTIONS.map((duration) => ({
      key: String(duration),
      label: `${duration} seconds`,
      value: String(duration),
    })),
  });

  await settings.registerBooleanSetting({
    id: REPEAT_SETTING_IDS.showProgressBar,
    title: 'Show progress bar',
    description: 'Show elapsed progress during a repetition session.',
    defaultValue: DEFAULT_REPEAT_SETTINGS.showProgressBar,
  });

  await settings.registerBooleanSetting({
    id: REPEAT_SETTING_IDS.showCloseHint,
    title: 'Show close hint',
    description: 'Show the Esc key hint during a repetition session.',
    defaultValue: DEFAULT_REPEAT_SETTINGS.showCloseHint,
  });
}

export function validateRepeatDuration(value: unknown): RepeatDurationSeconds {
  const duration =
    typeof value === 'string'
      ? REPEAT_DURATION_OPTIONS.find((option) => String(option) === value)
      : value;

  if (
    typeof duration === 'number' &&
    REPEAT_DURATION_OPTIONS.some((option) => option === duration)
  ) {
    return duration as RepeatDurationSeconds;
  }

  return DEFAULT_REPEAT_SETTINGS.duration;
}

export function validateBooleanSetting(
  value: unknown,
  defaultValue: boolean,
): boolean {
  return typeof value === 'boolean' ? value : defaultValue;
}

async function readSetting(
  settings: RepeatSettingsApi,
  settingId: string,
): Promise<unknown> {
  try {
    return await settings.getSetting<unknown>(settingId);
  } catch {
    return undefined;
  }
}

export async function getRepeatSettings(
  settings: RepeatSettingsApi,
): Promise<RepeatSettings> {
  const [duration, showProgressBar, showCloseHint] = await Promise.all([
    readSetting(settings, REPEAT_SETTING_IDS.duration),
    readSetting(settings, REPEAT_SETTING_IDS.showProgressBar),
    readSetting(settings, REPEAT_SETTING_IDS.showCloseHint),
  ]);

  return {
    duration: validateRepeatDuration(duration),
    showProgressBar: validateBooleanSetting(
      showProgressBar,
      DEFAULT_REPEAT_SETTINGS.showProgressBar,
    ),
    showCloseHint: validateBooleanSetting(
      showCloseHint,
      DEFAULT_REPEAT_SETTINGS.showCloseHint,
    ),
  };
}
