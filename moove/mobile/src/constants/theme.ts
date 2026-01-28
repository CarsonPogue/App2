// MOOVE Design System - "Fluid Motion"
// Dynamic energy meets refined simplicity

export const colors = {
  // Primary
  primary: {
    kineticOrange: '#FF7A3D',
    deepMidnight: '#0D0D1A',
  },

  // Secondary
  secondary: {
    warmSand: '#F7F3ED',
    electricTeal: '#00D4AA',
  },

  // Accent
  accent: {
    pulsePurple: '#8B5CF6',
    softBlush: '#FFB8B8',
  },

  // Functional
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',

  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Text
  text: {
    primary: '#0D0D1A',
    secondary: '#4B5563',
    muted: '#71717A',
    inverse: '#FFFFFF',
  },

  // Backgrounds
  background: {
    primary: '#FFFFFF',
    secondary: '#F7F3ED',
    dark: '#0D0D1A',
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
  concert: '#FF7A3D',
  sports: '#10B981',
  restaurant: '#F59E0B',
  bar: '#8B5CF6',
  theater: '#EF4444',
  festival: '#00D4AA',
  comedy: '#FFB8B8',
  arts: '#06B6D4',
  nightlife: '#8B5CF6',
  other: '#6B7280',
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
