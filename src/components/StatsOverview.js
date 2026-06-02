import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { COLORS } from '../constants';

const METRIC_CONFIG = [
  { key: 'total', label: 'Toplam', color: COLORS.dark, accent: COLORS.gray[200] },
  { key: 'active', label: 'Aktif', color: COLORS.primary, accent: '#E3EDFF' },
  { key: 'overdue', label: 'Süre Doldu', color: COLORS.warning, accent: '#FFF4E5' },
  { key: 'completed', label: 'Tamamlandı', color: COLORS.success, accent: '#E3FCEF' },
];

const StatsOverview = ({ stats, selectedKey = 'total', onSelectFilter }) => {
  return (
    <View style={styles.container}>
      {METRIC_CONFIG.map((metric) => {
        const isSelected = metric.key === selectedKey;

        return (
          <Pressable
            key={metric.key}
            onPress={() => onSelectFilter?.(metric.key)}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: metric.accent, borderColor: `${metric.color}33` },
              isSelected && styles.cardSelectedShadow,
              pressed && styles.cardPressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${metric.label}, ${stats[metric.key]}`}
            android_ripple={{ color: `${metric.color}22`, borderless: false }}
          >
            <Text style={[styles.value, { color: metric.color }]}>{stats[metric.key]}</Text>
            <Text style={styles.label}>{metric.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  card: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  cardSelectedShadow: {
    ...Platform.select({
      ios: {
        shadowColor: COLORS.gray[900],
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
  },
  cardPressed: {
    opacity: 0.95,
  },
  value: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  label: {
    fontSize: 12,
    color: COLORS.gray[600],
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 15,
  },
});

export default StatsOverview;
