import React from 'react';
import { TouchableOpacity, StyleSheet, View, useWindowDimensions, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '@/components/atoms';
import { colors, spacing, borderRadius } from '@/constants/theme';

interface Artist {
  id: string;
  name: string;
  imageUrl: string | null;
  genres: string[];
  upcomingEvents: number;
}

interface ArtistCardProps {
  artist: Artist;
  selected?: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export function ArtistCard({ artist, selected = false, onPress, disabled = false }: ArtistCardProps) {
  const { width } = useWindowDimensions();

  // Calculate card size based on screen width
  // Mobile: 4-5 cards per row, Web: scales based on width
  const gap = 8;
  const padding = 32; // Screen padding
  const availableWidth = width - padding;

  let cardsPerRow: number;
  if (Platform.OS === 'web') {
    // Web: more cards on larger screens
    if (width > 1200) cardsPerRow = 12;
    else if (width > 900) cardsPerRow = 10;
    else if (width > 600) cardsPerRow = 7;
    else cardsPerRow = 5;
  } else {
    // Mobile: 4-5 cards
    cardsPerRow = width > 400 ? 5 : 4;
  }

  const cardWidth = Math.floor((availableWidth - (gap * (cardsPerRow - 1))) / cardsPerRow);
  const imageSize = Math.floor(cardWidth * 0.7);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { width: cardWidth },
        selected && styles.selected,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {artist.imageUrl ? (
        <Image
          source={{ uri: artist.imageUrl }}
          style={[styles.image, { width: imageSize, height: imageSize, borderRadius: imageSize / 2 }]}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={[styles.image, styles.placeholderImage, { width: imageSize, height: imageSize, borderRadius: imageSize / 2 }]}>
          <Text style={styles.placeholderEmoji}>🎵</Text>
        </View>
      )}
      {selected && (
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      )}
      <Text
        variant="label"
        style={styles.name}
        numberOfLines={2}
        color={selected ? colors.primary.sage : colors.text.primary}
      >
        {artist.name}
      </Text>
      {artist.genres.length > 0 && (
        <Text variant="labelSmall" color={colors.text.muted} numberOfLines={1} style={styles.genre}>
          {artist.genres[0]}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 80,
    alignItems: 'center',
    padding: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
  },
  selected: {
    backgroundColor: colors.primary.sage + '20',
    borderWidth: 2,
    borderColor: colors.primary.sage,
  },
  disabled: {
    opacity: 0.6,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.gray[200],
  },
  placeholderImage: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[300],
  },
  placeholderEmoji: {
    fontSize: 20,
  },
  checkmark: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  name: {
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 10,
  },
  genre: {
    textAlign: 'center',
    marginTop: 1,
    fontSize: 9,
  },
});
