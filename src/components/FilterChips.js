import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { COLORS } from '../constants';

/**
 * Yatay kaydırılabilir tek seçimli filtre çipleri (Material tarzı).
 *
 * @param {{ value: string, label: string }[]} options
 * @param {string} value Seçili `options[].value`
 * @param {(nextValue: string) => void} onValueChange
 */
function FilterChips({
  options,
  value,
  onValueChange,
  style,
  contentContainerStyle,
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.scroll, style]}
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <TouchableOpacity
            key={String(opt.value)}
            activeOpacity={0.85}
            onPress={() => onValueChange(opt.value)}
            style={[
              styles.chip,
              selected ? styles.chipSelected : styles.chipUnselected,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={opt.label}
          >
            <Text
              style={[
                styles.chipLabel,
                selected ? styles.chipLabelSelected : styles.chipLabelUnselected,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipSelected: {
    backgroundColor: '#E3EDFF',
    borderWidth: 0,
  },
  chipUnselected: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  chipLabelSelected: {
    color: COLORS.primary,
  },
  chipLabelUnselected: {
    color: COLORS.gray[600],
  },
});

export default FilterChips;
