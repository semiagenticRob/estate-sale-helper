/**
 * Estate Helper — "Gentle Authority" Design System
 *
 * Centralized design tokens. Import from here instead of
 * hard-coding hex values or magic numbers in components.
 */

// ─── Colors ────────────────────────────────────────────────────────
export const colors = {
  backgroundPrimary: '#F7F4F0',
  backgroundSecondary: '#EDE8E1',
  textPrimary: '#2E2B28',
  textSecondary: '#7A756F',
  accentPrimary: '#B8896A',
  accentSecondary: '#8A9B8E',
  destructive: '#A63D2F',

  // Semantic aliases
  cardBackground: '#EDE8E1',
  inputBackground: '#EDE8E1',
  inputBorder: '#EDE8E1',
  inputBorderFocused: '#B8896A',
  separator: '#EDE8E1',
  placeholder: '#7A756F',
  white: '#F7F4F0',

  // Status
  statusActive: '#5A8A60',
  statusUpcoming: '#5070A0',
  statusEnding: '#8B5E30',
  statusEnded: '#9E9890',

  statusActiveBg: '#E6EDE7',
  statusUpcomingBg: '#E3E8F0',
  statusEndingBg: '#F0E8DC',
  statusEndedBg: '#ECEAE7',

  statusActiveText: '#3D6B42',
  statusUpcomingText: '#394E6E',
  statusEndingText: '#8B5E30',
  statusEndedText: '#857E78',
} as const;

// ─── Typography ────────────────────────────────────────────────────
// Custom fonts require expo-font loading; fall back to system font.
export const fonts = {
  display: 'CormorantGaramond_500Medium',
  bodySerif: 'Lora_400Regular',
  uiSans: 'DMSans_400Regular',
  uiSansMedium: 'DMSans_500Medium',

  // System fallbacks (used before fonts load)
  displayFallback: 'System',
  bodySerifFallback: 'System',
  uiSansFallback: 'System',
} as const;

export const fontSize = {
  displayLarge: 34,
  displayMedium: 28,
  displaySmall: 22,
  body: 16,
  bodySmall: 15,
  uiBody: 15,
  uiButton: 14,
  uiLabel: 12,
  uiCaption: 13,
  uiMicro: 11,
  tabLabel: 10,
} as const;

// ─── Spacing (8pt grid) ───────────────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  huge: 64,
  screenHorizontal: 20,
  cardPadding: 20,
  listItemVertical: 14,
} as const;

// ─── Shape ─────────────────────────────────────────────────────────
export const radii = {
  button: 10,
  card: 14,
  chip: 20,
  input: 10,
  modal: 20,
  small: 8,
} as const;

export const shadows = {
  card: {
    shadowColor: '#2E2B28',
    shadowOffset: { width: 0, height: 1 } as const,
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 1,
  },
  modal: {
    shadowColor: '#2E2B28',
    shadowOffset: { width: 0, height: 8 } as const,
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

// ─── Component presets ─────────────────────────────────────────────
export const components = {
  buttonPrimary: {
    backgroundColor: colors.accentPrimary,
    height: 52,
    borderRadius: radii.button,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.accentSecondary,
    height: 52,
    borderRadius: radii.button,
  },
  inputField: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    height: 56,
    borderRadius: radii.input,
  },
  navBar: {
    backgroundColor: colors.backgroundPrimary,
    borderTopWidth: 1,
    borderTopColor: colors.backgroundSecondary,
    activeColor: colors.accentPrimary,
    inactiveColor: colors.textSecondary,
  },
} as const;
