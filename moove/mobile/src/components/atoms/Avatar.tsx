import React from 'react';
import { View, Text, StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '@/constants/theme';

type AvatarSize = 'small' | 'medium' | 'large' | 'xlarge';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: AvatarSize;
  style?: ViewStyle;
}

const sizeMap = {
  small: 32,
  medium: 40,
  large: 56,
  xlarge: 80,
};

const fontSizeMap = {
  small: 12,
  medium: 14,
  large: 20,
  xlarge: 28,
};

export function Avatar({ uri, name, size = 'medium', style }: AvatarProps) {
  const dimension = sizeMap[size];
  const fontSize = fontSizeMap[size];

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  const baseStyle = {
    width: dimension,
    height: dimension,
    borderRadius: dimension / 2,
    overflow: 'hidden' as const,
  };

  if (uri) {
    const imageStyle: ImageStyle = {
      ...baseStyle,
      ...(style as ImageStyle),
    };
    return (
      <Image
        source={{ uri }}
        style={imageStyle}
        contentFit="cover"
        transition={200}
      />
    );
  }

  return (
    <View style={[styles.container, baseStyle, styles.fallback, style]}>
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  fallback: {
    backgroundColor: colors.secondary.electricTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.white,
    fontWeight: '600',
  },
});
