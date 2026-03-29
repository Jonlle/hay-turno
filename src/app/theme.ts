import { z } from 'zod';

export const themeSettingsSchema = z.object({
  primary: z.string().trim().min(1).optional(),
  accent: z.string().trim().min(1).optional(),
  surface: z.string().trim().min(1).optional(),
  logoUrl: z.union([z.string().trim().url(), z.literal('')]).optional(),
});

export type ThemeSettings = z.infer<typeof themeSettingsSchema>;
export type ThemeCssVariables = Record<`--${string}`, string>;

export const DEFAULT_THEME_SETTINGS: Required<ThemeSettings> = {
  primary: 'hsl(222 47% 11%)',
  accent: 'hsl(210 40% 96%)',
  surface: 'hsl(0 0% 100%)',
  logoUrl: '',
};

export function resolveThemeSettings(themeSettings: unknown): Required<ThemeSettings> {
  const parsedThemeSettings = themeSettingsSchema.safeParse(themeSettings);

  if (!parsedThemeSettings.success) {
    if (import.meta.env.DEV) {
      console.warn('Invalid Barbershop theme settings received. Falling back to defaults.', {
        issues: parsedThemeSettings.error.flatten(),
      });
    }

    return DEFAULT_THEME_SETTINGS;
  }

  return {
    primary: parsedThemeSettings.data.primary ?? DEFAULT_THEME_SETTINGS.primary,
    accent: parsedThemeSettings.data.accent ?? DEFAULT_THEME_SETTINGS.accent,
    surface: parsedThemeSettings.data.surface ?? DEFAULT_THEME_SETTINGS.surface,
    logoUrl: parsedThemeSettings.data.logoUrl ?? DEFAULT_THEME_SETTINGS.logoUrl,
  };
}

export function getThemeCssVariables(themeSettings: unknown): ThemeCssVariables {
  const resolvedThemeSettings = resolveThemeSettings(themeSettings);

  return {
    '--ht-primary': resolvedThemeSettings.primary,
    '--ht-accent': resolvedThemeSettings.accent,
    '--ht-surface': resolvedThemeSettings.surface,
    '--ht-logo-url': resolvedThemeSettings.logoUrl,
  };
}
