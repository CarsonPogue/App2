import React from 'react';
import { Text as RNText, TextStyle, StyleSheet } from 'react-native';
import { colors, typography } from '@/constants/theme';

type TextVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'bodyLarge'
  | 'body'
  | 'bodySmall'
  | 'labelLarge'
  | 'label'
  | 'labelSmall'
  | 'mono';

interface TextProps {
  children: React.ReactNode;
  variant?: TextVariant;
  color?: string;
  center?: boolean;
  style?: TextStyle;
  numberOfLines?: number;
}

export function Text({
  children,
  variant = 'body',
  color,
  center,
  style,
  numberOfLines,
}: TextProps) {
  const textStyle = [
    styles.base,
    styles[variant],
    color ? { color } : undefined,
    center ? styles.center : undefined,
    style,
  ];

  return (
    <RNText style={textStyle} numberOfLines={numberOfLines}>
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  base: {
    color: colors.text.primary,
  },
  center: {
    textAlign: 'center',
  },

  // Headers
  h1: {
    ...typography.display.h1,
  },
  h2: {
    ...typography.display.h2,
  },
  h3: {
    ...typography.display.h3,
  },

  // Body
  bodyLarge: {
    ...typography.body.large,
  },
  body: {
    ...typography.body.regular,
  },
  bodySmall: {
    ...typography.body.small,
  },

  // Labels
  labelLarge: {
    ...typography.label.large,
  },
  label: {
    ...typography.label.regular,
  },
  labelSmall: {
    ...typography.label.small,
  },

  // Mono
  mono: {
    ...typography.mono.regular,
  },
});
