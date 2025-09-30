import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { formatDate, getStatusInfo } from '../utils/dateUtils';
import { COLORS } from '../constants';

const SampleCard = ({ sample, onToggleComplete, onDelete, onEdit }) => {
  const statusInfo = getStatusInfo(sample.dueDate, sample.completed);
  const accentColor = statusInfo.color;
  const pillColor = `${accentColor}1A`;

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: accentColor,
          backgroundColor: sample.completed ? '#F1FDF5' : COLORS.white,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.sampleName}>{sample.name}</Text>
          <Text style={styles.sampleId}>#{sample.id.slice(-6)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: pillColor }]}> 
          <Text style={[styles.statusText, { color: accentColor }]}>{statusInfo.text}</Text>
        </View>
      </View>

      <View style={styles.timeline}>
        <View style={styles.timelineItem}>
          <Text style={styles.timelineLabel}>Başlangıç</Text>
          <Text style={styles.timelineDate}>{formatDate(sample.cureDate)}</Text>
        </View>
        <View style={styles.timelineDivider} />
        <View style={styles.timelineItem}>
          <Text style={styles.timelineLabel}>Bitiş</Text>
          <Text style={[styles.timelineDate, { color: accentColor }]}>
            {formatDate(sample.dueDate)}
          </Text>
        </View>
      </View>

      {sample.photoUri ? (
        <View style={styles.photoPreview}>
          <Image source={{ uri: sample.photoUri }} style={styles.photoImage} />
          <Text style={styles.photoCaption}>Numune Fotoğrafı</Text>
        </View>
      ) : null}

      <View style={styles.metaRow}>
        <View style={styles.metaChip}>
          <Text style={styles.metaIcon}>🧪</Text>
          <Text style={styles.metaText}>{sample.cureDays} gün kür planı</Text>
        </View>
        <View style={[styles.metaChip, styles.metaChipAccent]}> 
          <Text style={[styles.metaIcon, { color: accentColor }]}>⏱️</Text>
          <Text style={[styles.metaText, { color: accentColor }]}>{statusInfo.text}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryAction, sample.completed && styles.completedAction]}
          onPress={() => onToggleComplete(sample.id)}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.actionButtonText,
              sample.completed && styles.completedActionText,
            ]}
          >
            {sample.completed ? '✓ Tamamlandı' : '✔︎ Kür Takibinde'}
          </Text>
        </TouchableOpacity>

        {onEdit ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.editAction]}
            onPress={() => onEdit(sample)}
            activeOpacity={0.85}
          >
            <Text style={[styles.actionButtonText, styles.editText]}>✏️ Düzenle</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={[styles.actionButton, styles.dangerAction]}
          onPress={() => onDelete(sample.id)}
          activeOpacity={0.85}
        >
          <Text style={[styles.actionButtonText, styles.dangerText]}>🗑️ Sil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleContainer: {
    flex: 1,
  },
  sampleName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 4,
  },
  sampleId: {
    fontSize: 12,
    color: COLORS.gray[500],
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.gray[50],
    borderRadius: 14,
    padding: 14,
  },
  timelineItem: {
    flex: 1,
  },
  timelineDivider: {
    width: 1,
    height: 44,
    backgroundColor: COLORS.gray[200],
    marginHorizontal: 12,
  },
  timelineLabel: {
    fontSize: 13,
    color: COLORS.gray[500],
    fontWeight: '600',
    marginBottom: 6,
  },
  timelineDate: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.dark,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  photoPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.gray[50],
    borderRadius: 14,
    padding: 10,
  },
  photoImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  photoCaption: {
    fontSize: 13,
    color: COLORS.gray[600],
    fontWeight: '500',
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: COLORS.gray[100],
  },
  metaChipAccent: {
    backgroundColor: '#EFF6FF',
  },
  metaIcon: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  metaText: {
    fontSize: 13,
    color: COLORS.gray[700],
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryAction: {
    backgroundColor: '#EEF2FF',
  },
  completedAction: {
    backgroundColor: COLORS.success,
  },
  completedActionText: {
    color: COLORS.white,
  },
  editAction: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  editText: {
    color: COLORS.gray[700],
  },
  dangerAction: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  dangerText: {
    color: COLORS.danger,
  },
});

export default SampleCard;
