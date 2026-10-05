import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppPreferences {
  hasCompletedOnboarding: boolean;
  defaultFabric: 'aida' | 'evenweave' | 'linen' | 'plastic';
  defaultCount: number;
  defaultThreadBrand: 'DMC' | 'Anchor' | 'Ariadna' | 'Madeira' | 'CXC' | 'Dimensions';
  soundFeedback: boolean;
  hapticFeedback: boolean;
  autoSaveProgress: boolean;
  highContrastGrid: boolean;
  rulerVisible: boolean;
  keepScreenAwake: boolean;
  twoFingerGesturesOnly: boolean;
  defaultFitMode: 'contain' | 'cover' | 'natural';
}

export const DEFAULT_PREFERENCES: AppPreferences = {
  hasCompletedOnboarding: false,
  defaultFabric: 'aida',
  defaultCount: 14,
  defaultThreadBrand: 'DMC',
  soundFeedback: true,
  hapticFeedback: true,
  autoSaveProgress: true,
  highContrastGrid: false,
  rulerVisible: true,
  keepScreenAwake: true,
  twoFingerGesturesOnly: true,
  defaultFitMode: 'natural',
};

const PREFS_STORAGE_KEY = '@mualina_app_preferences';

export async function getAppPreferences(): Promise<AppPreferences> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch (e) {
    console.warn('Failed to load preferences:', e);
    return DEFAULT_PREFERENCES;
  }
}

export async function saveAppPreferences(prefs: Partial<AppPreferences>): Promise<AppPreferences> {
  try {
    const current = await getAppPreferences();
    const updated = { ...current, ...prefs };
    await AsyncStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('Failed to save preferences:', e);
    return DEFAULT_PREFERENCES;
  }
}

export async function resetAppPreferences(): Promise<AppPreferences> {
  try {
    await AsyncStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(DEFAULT_PREFERENCES));
    return DEFAULT_PREFERENCES;
  } catch (e) {
    return DEFAULT_PREFERENCES;
  }
}
