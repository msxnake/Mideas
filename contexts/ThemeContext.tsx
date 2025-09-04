
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

/** Defines the available theme modes. */
export type ThemeMode = 'light' | 'dark' | 'custom';
/** Defines the keys for the themeable colors. */
export type ColorKeys = 
  | 'bgcolor' 
  | 'panelbg' 
  | 'accent' 
  | 'highlight' 
  | 'textprimary' 
  | 'textsecondary' 
  | 'border'
  | 'danger'
  | 'warning';

/**
 * Represents the structure of the theme configuration object.
 */
export interface ThemeConfig {
  /** The current theme mode. */
  theme: ThemeMode;
  /** A record of custom color values. */
  colors: Record<ColorKeys, string>;
}

/**
 * Defines the shape of the Theme Context.
 */
interface ThemeContextType {
  /** The current theme configuration. */
  config: ThemeConfig;
  /** Function to set the theme mode. */
  setThemeMode: (theme: ThemeMode) => void;
  /** Function to update a specific color in the custom theme. */
  updateCustomColor: (key: ColorKeys, value: string) => void;
  /** Function to reset the theme to its default state. */
  resetToDefault: () => void;
  /** Function to load a theme configuration from an object. */
  loadConfig: (loadedConfig: ThemeConfig) => void;
  /** Function to get the currently effective set of colors based on the theme mode. */
  getEffectiveColors: () => Record<ColorKeys, string>;
}

/**
 * The default colors for the dark theme.
 * @constant
 */
const defaultDarkColors: Record<ColorKeys, string> = {
  bgcolor: '#22272E',
  panelbg: '#2D333B',
  accent: '#58A6FF',
  highlight: '#3FB950',
  textprimary: '#C9D1D9',
  textsecondary: '#8B949E',
  border: '#444C56',
  danger: '#F85149',
  warning: '#F0A832',
};

/**
 * The default colors for the light theme.
 * @constant
 */
const defaultLightColors: Record<ColorKeys, string> = {
  bgcolor: '#F3F4F6', // gray-100
  panelbg: '#FFFFFF', // white
  accent: '#3B82F6', // blue-500
  highlight: '#10B981', // emerald-500
  textprimary: '#1F2937', // gray-800
  textsecondary: '#6B7280', // gray-500
  border: '#D1D5DB', // gray-300
  danger: '#EF4444', // red-500
  warning: '#F59E0B', // amber-500
};

/**
 * The initial theme configuration on first load.
 * @constant
 */
const initialConfig: ThemeConfig = {
  theme: 'dark',
  colors: { ...defaultDarkColors }, // Initially, custom colors match dark theme
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Provides the theme configuration to its children components.
 * It handles loading the theme from localStorage, applying it to the document,
 * and providing functions to update the theme.
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<ThemeConfig>(() => {
    try {
      const savedConfig = localStorage.getItem('themeConfig');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        // Ensure loaded config has all necessary color keys
        const validatedColors = { 
            ...(parsed.theme === 'dark' ? defaultDarkColors : (parsed.theme === 'light' ? defaultLightColors : defaultDarkColors)),
            ...parsed.colors 
        };
        return { ...parsed, colors: validatedColors };
      }
    } catch (error) {
      console.error("Failed to parse themeConfig from localStorage", error);
    }
    return initialConfig;
  });

  useEffect(() => {
    localStorage.setItem('themeConfig', JSON.stringify(config));
  }, [config]);

  const getEffectiveColors = useCallback(() => {
    switch (config.theme) {
      case 'light':
        return defaultLightColors;
      case 'dark':
        return defaultDarkColors;
      case 'custom':
        return config.colors;
      default:
        return defaultDarkColors;
    }
  }, [config.theme, config.colors]);

  useEffect(() => {
    const effectiveColors = getEffectiveColors();
    const root = document.documentElement;
    const body = document.body;

    if (config.theme === 'dark') {
      body.classList.add('dark');
      body.classList.remove('light');
    } else if (config.theme === 'light') {
      body.classList.add('light');
      body.classList.remove('dark');
    } else { // custom
      // For custom, decide if it's more light-like or dark-like based on bgcolor, or default to dark behavior
      // This is a simple heuristic, could be more sophisticated
      const bgColor = (effectiveColors.bgcolor || '').toLowerCase(); // Guard against undefined
      const isDarkCustom = bgColor.startsWith('#') && parseInt(bgColor.substring(1,3), 16) < 128; // Arbitrary check if bg is dark
      if(isDarkCustom) {
        body.classList.add('dark');
        body.classList.remove('light');
      } else {
        body.classList.add('light');
        body.classList.remove('dark');
      }
    }
    
    // Update CSS Variables
    const styleElement = document.getElementById('dynamic-theme-styles');
    if (styleElement) {
        let cssVars = ':root {\n';
        for (const key in effectiveColors) {
            cssVars += `  --msx-${key}: ${effectiveColors[key as ColorKeys]};\n`;
        }
        cssVars += '}';
        styleElement.innerHTML = cssVars;
    }

  }, [config, getEffectiveColors]);

  const setThemeMode = (themeMode: ThemeMode) => {
    setConfig(prev => ({ ...prev, theme: themeMode }));
  };

  const updateCustomColor = (key: ColorKeys, value: string) => {
    setConfig(prev => ({
      theme: 'custom', // Switch to custom theme when a color is updated
      colors: { ...prev.colors, [key]: value },
    }));
  };
  
  const loadConfig = (loadedConfig: ThemeConfig) => {
    // Basic validation
    if (loadedConfig && loadedConfig.theme && loadedConfig.colors && 
        Object.keys(defaultDarkColors).every(key => key in loadedConfig.colors)) {
      setConfig(loadedConfig);
    } else {
      console.error("Invalid theme configuration loaded.", loadedConfig);
      alert("Failed to load theme: Invalid configuration file.");
    }
  };

  const resetToDefault = () => {
    setConfig(initialConfig); // Reset to initial dark theme
  };

  return (
    <ThemeContext.Provider value={{ config, setThemeMode, updateCustomColor, resetToDefault, loadConfig, getEffectiveColors }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * A custom hook to access the theme context.
 * @returns The theme context.
 * @throws An error if used outside of a ThemeProvider.
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
