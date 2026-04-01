import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

const THEME_KEY = 'appTheme';

const themePalettes = {
  light: {
    mode: 'light',
    colors: {
      screen: '#F7F1E8',
      screenMuted: '#F6F1E8',
      card: '#FFFFFF',
      cardAlt: '#F8FBFD',
      cardSoft: '#FFFDF9',
      hero: '#173457',
      heroText: '#FFFFFF',
      heroMuted: '#D4DDEC',
      heroEyebrow: '#C8D7EC',
      text: '#1D2D45',
      textMuted: '#66707C',
      textSoft: '#55636A',
      inputText: '#1A1A1A',
      border: '#D9E0EA',
      borderSoft: '#D8DEE7',
      primary: '#264E86',
      primaryText: '#FFFFFF',
      secondary: '#0F6E56',
      secondaryText: '#FFFFFF',
      successSoft: '#EEF6F2',
      successBorder: '#CFE2DA',
      successText: '#426456',
      danger: '#C84A3C',
      tabBackground: '#FFFFFF',
      tabActive: '#0F6E56',
      tabInactive: '#7C8B86',
      tabActiveBackground: '#E1F5EE',
      shadow: '#0F6E56',
      placeholder: '#999999',
    },
  },
  dark: {
    mode: 'dark',
    colors: {
      screen: '#0F1722',
      screenMuted: '#121C28',
      card: '#182432',
      cardAlt: '#1C2A3A',
      cardSoft: '#223244',
      hero: '#0B1220',
      heroText: '#F4F7FB',
      heroMuted: '#9FB0C7',
      heroEyebrow: '#7E94AF',
      text: '#E8EEF6',
      textMuted: '#A7B4C4',
      textSoft: '#C1CAD6',
      inputText: '#F4F7FB',
      border: '#2A3B50',
      borderSoft: '#31465D',
      primary: '#4D86D9',
      primaryText: '#FFFFFF',
      secondary: '#16956E',
      secondaryText: '#FFFFFF',
      successSoft: '#173227',
      successBorder: '#24513E',
      successText: '#A9D7C2',
      danger: '#E17362',
      tabBackground: '#16212D',
      tabActive: '#3FD0A3',
      tabInactive: '#8B9AAE',
      tabActiveBackground: '#1D3A30',
      shadow: '#000000',
      placeholder: '#8190A5',
    },
  },
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themePreference, setThemePreference] = useState('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await SecureStore.getItemAsync(THEME_KEY);
        if (savedTheme === 'light' || savedTheme === 'dark') {
          setThemePreference(savedTheme);
        }
      } finally {
        setReady(true);
      }
    };

    void loadTheme();
  }, []);

  const setTheme = async (nextTheme) => {
    if (nextTheme !== 'light' && nextTheme !== 'dark') {
      return;
    }

    setThemePreference(nextTheme);
    await SecureStore.setItemAsync(THEME_KEY, nextTheme);
  };

  const toggleTheme = async () => {
    const nextTheme = themePreference === 'dark' ? 'light' : 'dark';
    await setTheme(nextTheme);
  };

  const value = useMemo(
    () => ({
      themePreference,
      theme: themePalettes[themePreference],
      isDarkMode: themePreference === 'dark',
      ready,
      setTheme,
      toggleTheme,
    }),
    [ready, themePreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
}
