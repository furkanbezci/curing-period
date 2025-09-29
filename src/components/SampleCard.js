import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { formatDate, getStatusInfo } from '../utils/dateUtils';
import { COLORS } from '../constants';

const SampleCard = ({ sample, onToggleComplete, onDelete }) => {
  const statusInfo = getStatusInfo(sample.dueDate, sample.completed);

  return (
    <View style={[styles.card, { borderLeftColor: statusInfo.color }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.sampleName}>{sample.name}</Text>
          <Text style={styles.sampleId}>#{sample.id.slice(-6)}</Text>
        </View>
        
        <View style={styles.statusBadge}>
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.text}
          </Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Kür Başlangıcı:</Text>
          <Text style={styles.detailValue}>{formatDate(sample.cureDate)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Kür Süresi:</Text>
          <Text style={styles.detailValue}>{sample.cureDays} gün</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Bitiş Tarihi:</Text>
          <Text style={styles.detailValue}>{formatDate(sample.dueDate)}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.completeButton,
            sample.completed && styles.completedButton
          ]}
          onPress={() => onToggleComplete(sample.id)}
        >
          <Text style={[
            styles.actionButtonText,
            sample.completed && styles.completedButtonText
          ]}>
            {sample.completed ? '✓ Tamamlandı' : '○ Devam Ediyor'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => onDelete(sample.id)}
        >
          <Text style={styles.actionButtonText}>🗑️ Sil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  sampleName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 2,
  },
  sampleId: {
    fontSize: 12,
    color: COLORS.gray[500],
    fontFamily: 'monospace',
  },
  statusBadge: {
    backgroundColor: COLORS.gray[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  details: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.gray[600],
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.dark,
    fontWeight: '400',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButton: {
    backgroundColor: COLORS.gray[200],
  },
  completedButton: {
    backgroundColor: COLORS.success,
  },
  completedButtonText: {
    color: COLORS.white,
  },
  deleteButton: {
    backgroundColor: COLORS.danger,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.dark,
  },
});

export default SampleCard;
