// MOOVE Design System - Natural & Warm
// Earthy elegance meets modern simplicity

export const colors = {
  // Primary
  primary: {
    sage: '#88A084',
    darkSage: '#6B8067',
    lightSage: '#A5B8A1',
  },

  // Secondary
  secondary: {
    cream: '#F5F2E9',
    warmCream: '#EFEADD',
    lightCream: '#FAF8F3',
  },

  // Accent
  accent: {
    coral: '#E07A5F',
    darkCoral: '#C96A51',
    lightCoral: '#E89981',
  },

  // Functional
  success: '#88A084',
  warning: '#E0A35F',
  error: '#E07A5F',

  // Neutrals
  white: '#FFFFFF',
  black: '#1A1A1A',
  gray: {
    50: '#FAF8F3',
    100: '#F5F2E9',
    200: '#E8E4D8',
    300: '#D4CFC0',
    400: '#AFA99A',
    500: '#837D6F',
    600: '#6B6659',
    700: '#4F4B40',
    800: '#353229',
    900: '#1F1D18',
  },

  // Text
  text: {
    primary: '#1A1A1A',
    secondary: '#4F4B40',
    muted: '#837D6F',
    inverse: '#F5F2E9',
  },

  // Backgrounds
  background: {
    primary: '#F5F2E9',
    secondary: '#FAF8F3',
    dark: '#1F1D18',
    card: '#FFFFFF',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const borderRadius = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  full: 9999,
} as const;

export const shadows = {
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 32,
    elevation: 8,
  },
} as const;

export const typography = {
  // Display fonts (for headers)
  display: {
    h1: {
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 40,
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: 24,
      fontWeight: '700' as const,
      lineHeight: 32,
      letterSpacing: -0.3,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
      letterSpacing: -0.2,
    },
  },

  // Body fonts
  body: {
    large: {
      fontSize: 18,
      fontWeight: '400' as const,
      lineHeight: 28,
    },
    regular: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    small: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
  },

  // Labels and captions
  label: {
    large: {
      fontSize: 14,
      fontWeight: '500' as const,
      lineHeight: 20,
      letterSpacing: 0.1,
    },
    regular: {
      fontSize: 12,
      fontWeight: '500' as const,
      lineHeight: 16,
      letterSpacing: 0.1,
    },
    small: {
      fontSize: 10,
      fontWeight: '500' as const,
      lineHeight: 14,
      letterSpacing: 0.2,
    },
  },

  // Mono font (for timestamps, distances) - using system sans-serif
  mono: {
    regular: {
      fontSize: 12,
      fontWeight: '500' as const,
      lineHeight: 16,
      fontFamily: 'System',
    },
  },
} as const;

export const animation = {
  timing: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  spring: {
    default: {
      damping: 15,
      stiffness: 150,
    },
    bouncy: {
      damping: 10,
      stiffness: 200,
    },
    smooth: {
      damping: 20,
      stiffness: 100,
    },
  },
} as const;

export const layout = {
  screenPadding: 16,
  cardPadding: 16,
  contentMaxWidth: 600,
  tabBarHeight: 80,
  headerHeight: 56,
  buttonHeight: {
    small: 36,
    medium: 44,
    large: 56,
  },
  touchTarget: 44,
} as const;

// Category-specific colors
export const categoryColors = {
  concert: '#E07A5F',
  sports: '#88A084',
  restaurant: '#D4A574',
  bar: '#B88B7F',
  theater: '#E07A5F',
  festival: '#88A084',
  comedy: '#E89981',
  arts: '#A5B8A1',
  nightlife: '#B88B7F',
  other: '#AFA99A',
} as const;

export type CategoryColor = keyof typeof categoryColors;

export const theme = {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
  animation,
  layout,
  categoryColors,
} as const;

export type Theme = typeof theme;
