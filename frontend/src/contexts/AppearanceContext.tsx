import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type Language = 'fr' | 'en';

interface AppearanceSettings {
  theme: Theme;
  language: Language;
}

interface AppearanceContextType {
  settings: AppearanceSettings;
  updateTheme: (theme: Theme) => void;
  updateLanguage: (language: Language) => void;
  updateSettings: (settings: Partial<AppearanceSettings>) => void;
  isDarkMode: boolean;
}

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

const STORAGE_KEY = 'sakom-appearance-settings';

const DEFAULT_SETTINGS: AppearanceSettings = {
  theme: 'light',
  language: 'fr'
};

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppearanceSettings>(() => {
    // Charger les paramètres depuis le localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres d\'apparence:', error);
    }
    return DEFAULT_SETTINGS;
  });

  const [isDarkMode, setIsDarkMode] = useState(false);

  // Fonction pour détecter le thème système
  const getSystemTheme = (): 'light' | 'dark' => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // Fonction pour appliquer le thème
  const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    let actualTheme: 'light' | 'dark';

    if (theme === 'system') {
      actualTheme = getSystemTheme();
    } else {
      actualTheme = theme;
    }

    if (actualTheme === 'dark') {
      root.classList.add('dark');
      setIsDarkMode(true);
    } else {
      root.classList.remove('dark');
      setIsDarkMode(false);
    }
  };

  // Écouter les changements de thème système
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = () => {
      if (settings.theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [settings.theme]);

  // Appliquer le thème au chargement et aux changements
  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  // Sauvegarder les paramètres dans le localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres d\'apparence:', error);
    }
  }, [settings]);

  const updateTheme = (theme: Theme) => {
    setSettings(prev => ({ ...prev, theme }));
  };

  const updateLanguage = (language: Language) => {
    setSettings(prev => ({ ...prev, language }));
    // TODO: Implémenter le changement de langue dans l'application
    console.log('Changement de langue vers:', language);
  };

  const updateSettings = (newSettings: Partial<AppearanceSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const value: AppearanceContextType = {
    settings,
    updateTheme,
    updateLanguage,
    updateSettings,
    isDarkMode
  };

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (context === undefined) {
    throw new Error('useAppearance must be used within an AppearanceProvider');
  }
  return context;
}

// Hook pour obtenir le label d'une langue
export function getLanguageLabel(language: Language): string {
  const labels: Record<Language, string> = {
    fr: 'Français',
    en: 'English',
  };
  return labels[language];
}

// Hook pour obtenir le label d'un thème
export function getThemeLabel(theme: Theme): string {
  const labels: Record<Theme, string> = {
    light: 'Clair',
    dark: 'Sombre',
    system: 'Système'
  };
  return labels[theme];
}
