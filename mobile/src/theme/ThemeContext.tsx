import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors as baseColors, shadows as baseShadows } from './colors';

export type ThemeMode = 'cozy' | 'oled' | 'redlight';

export interface ThemePalette {
  primary: string;
  primaryHover: string;
  primaryDark: string;
  primaryLight: string;
  primaryMuted: string;
  primaryBorder: string;

  sage: string;
  sageDark: string;
  sageLight: string;
  sageMuted: string;
  sageBorder: string;

  caramel: string;
  caramelDark: string;
  caramelLight: string;
  caramelBorder: string;

  lavender: string;
  lavenderLight: string;
  lavenderBorder: string;

  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceHover: string;
  surfaceBorder: string;

  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverted: string;

  canvasBg: string;
  gridBorder: string;
  majorBorder: string;

  success: string;
  warning: string;
  danger: string;
  info: string;
}

export const cozyPalette: ThemePalette = {
  ...baseColors,
  canvasBg: '#EFE8DE',
  gridBorder: '#D1C7BD',
  majorBorder: '#3D3734',
};

export const oledPalette: ThemePalette = {
  primary: '#FF8A95',
  primaryHover: '#FF7380',
  primaryDark: '#D9777F',
  primaryLight: '#2A181A',
  primaryMuted: '#4A282C',
  primaryBorder: '#602E34',

  sage: '#63E6BE',
  sageDark: '#38D9A9',
  sageLight: '#12261E',
  sageMuted: '#1E3D30',
  sageBorder: '#2B5744',

  caramel: '#F59F00',
  caramelDark: '#D97706',
  caramelLight: '#261C08',
  caramelBorder: '#4D360E',

  lavender: '#B197FC',
  lavenderLight: '#231D38',
  lavenderBorder: '#433866',

  background: '#000000',
  backgroundAlt: '#121212',
  surface: '#18181A',
  surfaceHover: '#222225',
  surfaceBorder: '#2C2C2E',

  textPrimary: '#F5F5F7',
  textSecondary: '#A1A1A6',
  textMuted: '#636366',
  textInverted: '#000000',

  canvasBg: '#080808',
  gridBorder: '#282828',
  majorBorder: '#6E6E73',

  success: '#63E6BE',
  warning: '#F59F00',
  danger: '#FF6B6B',
  info: '#4DABF7',
};

export const redlightPalette: ThemePalette = {
  primary: '#FF4D4D',
  primaryHover: '#E63939',
  primaryDark: '#B32424',
  primaryLight: '#330808',
  primaryMuted: '#590E0E',
  primaryBorder: '#801414',

  sage: '#FF8080',
  sageDark: '#CC4C4C',
  sageLight: '#260606',
  sageMuted: '#4D0C0C',
  sageBorder: '#731313',

  caramel: '#FF6B4A',
  caramelDark: '#CC4B2E',
  caramelLight: '#290D05',
  caramelBorder: '#5C1D0B',

  lavender: '#FF6680',
  lavenderLight: '#290A10',
  lavenderBorder: '#5C1724',

  background: '#0D0000',
  backgroundAlt: '#170202',
  surface: '#240505',
  surfaceHover: '#330808',
  surfaceBorder: '#470D0D',

  textPrimary: '#FFA8A8',
  textSecondary: '#CC7070',
  textMuted: '#804040',
  textInverted: '#1A0000',

  canvasBg: '#120000',
  gridBorder: '#470808',
  majorBorder: '#991B1B',

  success: '#FF8080',
  warning: '#FF8C42',
  danger: '#FF3333',
  info: '#FF7373',
};

const THEME_STORAGE_KEY = '@mualina_theme_mode';

interface ThemeContextType {
  themeMode: ThemeMode;
  theme: ThemePalette;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'cozy',
  theme: cozyPalette,
  setThemeMode: () => {},
  toggleTheme: () => {},
  cycleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('cozy');

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved && (saved === 'cozy' || saved === 'oled' || saved === 'redlight')) {
          setThemeModeState(saved as ThemeMode);
        }
      } catch (e) {
        console.warn('Failed to load theme preference', e);
      }
    })();
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (e) {
      console.warn('Failed to save theme preference', e);
    }
  };

  const toggleTheme = () => {
    if (themeMode === 'cozy') setThemeMode('oled');
    else if (themeMode === 'oled') setThemeMode('redlight');
    else setThemeMode('cozy');
  };

  const theme = themeMode === 'oled' ? oledPalette : themeMode === 'redlight' ? redlightPalette : cozyPalette;

  return (
    <ThemeContext.Provider value={{ themeMode, theme, setThemeMode, toggleTheme, cycleTheme: toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
