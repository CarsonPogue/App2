import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

const variantColors = {
  default: {
    background: colors.gray[200],
    text: colors.gray[700],
  },
  success: {
    background: `${colors.success}20`,
    text: colors.success,
  },
  warning: {
    background: `${colors.warning}20`,
    text: colors.warning,
  },
  error: {
    background: `${colors.error}20`,
    text: colors.error,
  },
  info: {
    background: `${colors.primary.sage}20`,
    text: colors.primary.sage,
  },
};

export function Badge({ label, variant = 'default', style }: BadgeProps) {
  const variantStyle = variantColors[variant];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: variantStyle.background },
        style,
      ]}
    >
      <Text style={[styles.text, { color: variantStyle.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  text: {
    ...typography.label.small,
    fontWeight: '600',
  },
});
