import React, { createContext, useContext, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export interface DisplaySettings {
  theme: 'light' | 'dark' | 'custom';
  fontSize: 'small' | 'normal' | 'large';
  uiScale: number;
  timeFormat: '12h' | '24h';
  numberFormat: 'comma' | 'dot';
  chatTimestamps: boolean;
}

const defaultSettings: DisplaySettings = {
  theme: 'dark',
  fontSize: 'normal',
  uiScale: 1,
  timeFormat: '12h',
  numberFormat: 'comma',
  chatTimestamps: true,
};

interface DisplaySettingsContextType {
  settings: DisplaySettings;
  updateSettings: (settings: DisplaySettings) => void;
}

const DisplaySettingsContext = createContext<DisplaySettingsContextType | null>(null);

export function DisplaySettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useLocalStorage<DisplaySettings>('displaySettings', defaultSettings);

  useEffect(() => {
    // Apply theme
    document.documentElement.classList.remove('theme-light', 'theme-dark', 'theme-custom');
    document.documentElement.classList.add(`theme-${settings.theme}`);

    // Apply font size
    document.documentElement.style.fontSize = {
      small: '14px',
      normal: '16px',
      large: '18px'
    }[settings.fontSize];

    // Apply UI scale
    document.documentElement.style.setProperty('--ui-scale', settings.uiScale.toString());

  }, [settings]);

  return (
    <DisplaySettingsContext.Provider value={{ settings, updateSettings: setSettings }}>
      {children}
    </DisplaySettingsContext.Provider>
  );
}

export function useDisplaySettings() {
  const context = useContext(DisplaySettingsContext);
  if (!context) {
    throw new Error('useDisplaySettings must be used within a DisplaySettingsProvider');
  }
  return context;
}