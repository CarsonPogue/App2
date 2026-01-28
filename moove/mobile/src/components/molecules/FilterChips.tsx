import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Chip } from '@/components/atoms';
import { spacing } from '@/constants/theme';

interface FilterOption {
  id: string;
  label: string;
}

interface FilterChipsProps {
  options: FilterOption[];
  selected: string[];
  onSelect: (id: string) => void;
  multiSelect?: boolean;
}

export function FilterChips({
  options,
  selected,
  onSelect,
  multiSelect = false,
}: FilterChipsProps) {
  const handleSelect = (id: string) => {
    onSelect(id);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {options.map((option) => (
        <Chip
          key={option.id}
          label={option.label}
          selected={selected.includes(option.id)}
          onPress={() => handleSelect(option.id)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
});
