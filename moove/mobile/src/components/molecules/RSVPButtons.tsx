import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from '@/utils/haptics';
import { Text } from '@/components/atoms';
import { colors, spacing, borderRadius, shadows } from '@/constants/theme';
import { RSVPStatus } from '@moove/shared/types';

interface RSVPButtonsProps {
  currentStatus?: RSVPStatus | null;
  onSelect: (status: RSVPStatus) => void;
  disabled?: boolean;
}

const options: { status: RSVPStatus; label: string; icon: string }[] = [
  { status: RSVPStatus.GOING, label: 'Going', icon: '✓' },
  { status: RSVPStatus.INTERESTED, label: 'Interested', icon: '⭐' },
  { status: RSVPStatus.NOT_GOING, label: "Can't Go", icon: '✗' },
];

export function RSVPButtons({ currentStatus, onSelect, disabled = false }: RSVPButtonsProps) {
  const handleSelect = (status: RSVPStatus) => {
    if (!disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onSelect(status);
    }
  };

  return (
    <View style={styles.container}>
      {options.map((option) => {
        const isSelected = currentStatus === option.status;

        return (
          <TouchableOpacity
            key={option.status}
            style={[
              styles.button,
              isSelected ? styles.buttonSelected : undefined,
              option.status === RSVPStatus.GOING && isSelected ? styles.buttonGoing : undefined,
              option.status === RSVPStatus.INTERESTED && isSelected ? styles.buttonInterested : undefined,
              option.status === RSVPStatus.NOT_GOING && isSelected ? styles.buttonNotGoing : undefined,
              disabled ? styles.buttonDisabled : undefined,
            ]}
            onPress={() => handleSelect(option.status)}
            disabled={disabled}
            activeOpacity={0.8}
          >
            <Text
              variant="h3"
              color={isSelected ? colors.white : colors.text.primary}
              style={styles.icon}
            >
              {option.icon}
            </Text>
            <Text
              variant="label"
              color={isSelected ? colors.white : colors.text.primary}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
    ...shadows.subtle,
  },
  buttonSelected: {
    ...shadows.card,
  },
  buttonGoing: {
    backgroundColor: colors.success,
  },
  buttonInterested: {
    backgroundColor: colors.secondary.electricTeal,
  },
  buttonNotGoing: {
    backgroundColor: colors.gray[500],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  icon: {
    marginBottom: spacing.xs,
  },
});
