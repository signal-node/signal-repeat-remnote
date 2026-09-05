import { describe, expect, it } from 'vitest';
import {
  DEFAULT_REPEAT_SETTINGS,
  getRepeatSettings,
  registerRepeatSettings,
  REPEAT_SETTING_IDS,
  type RepeatSettingsApi,
  validateBooleanSetting,
  validateRepeatDuration,
} from '../src/services/settingsService';

type DropdownSetting = Parameters<
  RepeatSettingsApi['registerDropdownSetting']
>[0];
type BooleanSetting = Parameters<
  RepeatSettingsApi['registerBooleanSetting']
>[0];

function createSettingsApi(values: Record<string, unknown> = {}) {
  const dropdownSettings: DropdownSetting[] = [];
  const booleanSettings: BooleanSetting[] = [];

  const api: RepeatSettingsApi = {
    registerDropdownSetting: async (setting) => {
      dropdownSettings.push(setting);
    },
    registerBooleanSetting: async (setting) => {
      booleanSettings.push(setting);
    },
    getSetting: async <T>(settingId: string): Promise<T> => {
      const value = values[settingId];

      if (value instanceof Error) {
        throw value;
      }

      return value as T;
    },
  };

  return { api, booleanSettings, dropdownSettings };
}

describe('registerRepeatSettings', () => {
  it('registers the duration and two display settings', async () => {
    const { api, booleanSettings, dropdownSettings } = createSettingsApi();

    await registerRepeatSettings(api);

    expect(dropdownSettings).toHaveLength(1);
    expect(dropdownSettings[0]).toMatchObject({
      id: REPEAT_SETTING_IDS.duration,
      title: 'Repeat duration',
      defaultValue: '15',
      options: [
        { key: '10', label: '10 seconds', value: '10' },
        { key: '15', label: '15 seconds', value: '15' },
        { key: '20', label: '20 seconds', value: '20' },
        { key: '30', label: '30 seconds', value: '30' },
      ],
    });
    expect(booleanSettings).toEqual([
      expect.objectContaining({
        id: REPEAT_SETTING_IDS.showProgressBar,
        title: 'Show progress bar',
        defaultValue: true,
      }),
      expect.objectContaining({
        id: REPEAT_SETTING_IDS.showCloseHint,
        title: 'Show close hint',
        defaultValue: true,
      }),
    ]);
  });
});

describe('setting validation', () => {
  it.each([10, 15, 20, 30, '10', '15', '20', '30'])(
    'accepts supported duration %s',
    (duration) => {
      expect(validateRepeatDuration(duration)).toBe(Number(duration));
    },
  );

  it.each([
    undefined,
    null,
    0,
    12,
    60,
    '12',
    '015',
    '15.0',
    'invalid',
    true,
  ])(
    'falls back for unsupported duration %s',
    (duration) => {
      expect(validateRepeatDuration(duration)).toBe(
        DEFAULT_REPEAT_SETTINGS.duration,
      );
    },
  );

  it('accepts only boolean display settings', () => {
    expect(validateBooleanSetting(false, true)).toBe(false);
    expect(validateBooleanSetting(true, false)).toBe(true);
    expect(validateBooleanSetting('false', true)).toBe(true);
    expect(validateBooleanSetting(undefined, false)).toBe(false);
  });
});

describe('getRepeatSettings', () => {
  it('returns validated SDK settings', async () => {
    const { api } = createSettingsApi({
      [REPEAT_SETTING_IDS.duration]: '30',
      [REPEAT_SETTING_IDS.showProgressBar]: false,
      [REPEAT_SETTING_IDS.showCloseHint]: true,
    });

    await expect(getRepeatSettings(api)).resolves.toEqual({
      duration: 30,
      showProgressBar: false,
      showCloseHint: true,
    });
  });

  it('uses defaults for missing, invalid, or unreadable settings', async () => {
    const { api } = createSettingsApi({
      [REPEAT_SETTING_IDS.duration]: '60',
      [REPEAT_SETTING_IDS.showProgressBar]: 'false',
      [REPEAT_SETTING_IDS.showCloseHint]: new Error('unavailable'),
    });

    await expect(getRepeatSettings(api)).resolves.toEqual(
      DEFAULT_REPEAT_SETTINGS,
    );
  });
});
