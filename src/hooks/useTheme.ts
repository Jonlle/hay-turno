import { useEffect } from 'react';
import { getThemeCssVariables } from '../app/theme';

/**
 * Apply barbershop theme CSS variables to the document root.
 * Call this when barbershop data is available.
 */
export function useTheme(themeSettings: unknown) {
  useEffect(() => {
    if (!themeSettings || typeof themeSettings !== 'object') return;

    const cssVars = getThemeCssVariables(themeSettings as Record<string, string>);

    for (const [property, value] of Object.entries(cssVars)) {
      document.documentElement.style.setProperty(property, value);
    }

    return () => {
      for (const property of Object.keys(cssVars)) {
        document.documentElement.style.removeProperty(property);
      }
    };
  }, [themeSettings]);
}
