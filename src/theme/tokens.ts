export const colors = {
  bg: '#f4f1ea',
  cardBg: '#fffdf7',
  border: '#e2ddd2',
  borderDash: '#c7c1b3',

  dark: '#16181d',
  darkSecondary: '#2a2c32',

  blue: '#1a3a8f',
  blueDark: '#14306f',
  blueLight: '#eef1f8',
  blueBorder: '#d5ddf0',
  blueMuted: '#aebbe0',
  blueLabel: '#7d8bb5',

  gold: '#f0a500',
  goldDark: '#c98a00',
  goldLight: '#fdf2d6',
  goldText: '#5a4a14',

  red: '#c5482f',
  redDark: '#9a3622',
  redLight: '#fdece7',

  green: '#2f7a4f',
  greenLight: '#e7f0ea',

  textPrimary: '#16181d',
  textSecondary: '#6b6862',
  textTertiary: '#8a857a',
  textMuted: '#b7b3a9',
  textDisabled: '#b0aaa0',
  textInverse: '#fff',
  textInverseMuted: '#cfcabf',
  textInverseSecondary: '#b7b3a9',
} as const;

export const fonts = {
  heading: 'Archivo_700Bold',
  headingBlack: 'Archivo_900Black',
  headingHeavy: 'Archivo_800ExtraBold',
  body: 'Archivo_500Medium',
  bodySemiBold: 'Archivo_600SemiBold',
  mono: 'JetBrainsMono_500Medium',
  monoSemiBold: 'JetBrainsMono_600SemiBold',
  monoBold: 'JetBrainsMono_700Bold',
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 16,
  xxl: 18,
  full: 999,
} as const;

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 0,
    elevation: 1,
  },
  buttonBlue: {
    shadowColor: '#14306f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  buttonGold: {
    shadowColor: '#c98a00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  buttonDark: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  buttonRed: {
    shadowColor: '#9a3622',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
} as const;
