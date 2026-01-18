import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants';
import { formatDate } from '../utils/dateUtils';

const UpcomingSampleCard = ({ sample, status }) => {
  if (!sample) {
    return null;
  }

  const statusColor = status?.color ?? COLORS.primary;
  const statusText = status?.text ?? 'Takipte';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label}>Sıradaki Numune</Text>
        <View style={[styles.statusChip, { backgroundColor: `${statusColor}20` }]}> 
          <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
        </View>
      </View>

      <Text style={styles.name}>{sample.name}</Text>

      <View style={styles.dateRow}>
        <View style={styles.dateColumn}>
          <Text style={styles.dateLabel}>Başlangıç</Text>
          <Text style={styles.dateValue}>{formatDate(sample.cureDate)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.dateColumn}>
          <Text style={styles.dateLabel}>Bitiş</Text>
          <Text style={[styles.dateValue, { color: statusColor }]}>
            {formatDate(sample.dueDate)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: COLORS.gray[600],
    fontWeight: '600',
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  name: {
    fontSize: 18,
    color: COLORS.dark,
    fontWeight: '700',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateColumn: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 13,
    color: COLORS.gray[500],
    marginBottom: 4,
    fontWeight: '600',
  },
  dateValue: {
    fontSize: 15,
    color: COLORS.dark,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: COLORS.gray[200],
    marginHorizontal: 16,
  },
});

export default UpcomingSampleCard;
