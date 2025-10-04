import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

const METRIC_CONFIG = [
  { key: 'total', label: 'Toplam', color: COLORS.dark, accent: COLORS.gray[200] },
  { key: 'active', label: 'Aktif', color: COLORS.primary, accent: '#E3EDFF' },
  { key: 'overdue', label: 'Süre Doldu', color: COLORS.warning, accent: '#FFF4E5' },
  { key: 'completed', label: 'Tamamlandı', color: COLORS.success, accent: '#E3FCEF' },
];

const StatsOverview = ({ stats }) => {
  return (
    <View style={styles.container}>
      {METRIC_CONFIG.map((metric) => (
        <View
          key={metric.key}
          style={[styles.card, { backgroundColor: metric.accent, borderColor: `${metric.color}33` }]}
        >
          <Text style={[styles.value, { color: metric.color }]}>{stats[metric.key]}</Text>
          <Text style={styles.label}>{metric.label}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  card: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  label: {
    fontSize: 13,
    color: COLORS.gray[600],
    fontWeight: '600',
  },
});

export default StatsOverview;
