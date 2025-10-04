import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  TouchableWithoutFeedback,
  Alert,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { formatDate, getStatusInfo } from '../utils/dateUtils';
import { COLORS } from '../constants';
import { MediaService } from '../services/mediaService';
import { Feather } from '@expo/vector-icons';

const SampleCard = ({ sample, onToggleComplete, onDelete, onEdit, onCapturePhoto }) => {
  const statusInfo = getStatusInfo(sample.dueDate, sample.completed);
  const accentColor = statusInfo.color;
  const pillColor = `${accentColor}20`;
  const [imageVisible, setImageVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const handleToggle = () => onToggleComplete(sample.id);
  const handleDelete = () => {
    onDelete(sample.id);
  };

  const handleSaveImage = async () => {
    if (!sample.photoUri) {
      return;
    }

    try {
      setSaving(true);
      await MediaService.saveToDeviceLibrary(sample.photoUri);
      Alert.alert('Galeri', 'Fotoğraf galeriye kaydedildi.');
    } catch (error) {
      console.error('Fotoğraf galeriye kaydedilemedi:', error);
      Alert.alert('Galeri', 'Fotoğraf kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const handleCapturePress = async () => {
    if (!onCapturePhoto || capturing) {
      return;
    }

    try {
      setCapturing(true);
      await onCapturePhoto(sample);
    } catch (error) {
      console.error('Fotoğraf eklenemedi:', error);
      Alert.alert('Fotoğraf', 'Fotoğraf eklenemedi. Lütfen tekrar deneyin.');
    } finally {
      setCapturing(false);
    }
  };
  const Container = onEdit ? Pressable : View;

  return (
    <Container
      style={[
        styles.card,
        { borderColor: `${accentColor}55`, backgroundColor: sample.completed ? '#F5FFF8' : COLORS.white },
      ]}
      onPress={onEdit ? () => onEdit(sample) : undefined}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.sampleName} numberOfLines={2}>
            {sample.name}
          </Text>
          <Text style={styles.subLabel}>
            <Text style={styles.subLabelStrong}>{sample.cureDays}</Text>
            <Text style={styles.subLabelSuffix}> günlük kür</Text>
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: pillColor }]}> 
          <Text style={[styles.statusText, { color: accentColor }]}>{statusInfo.text}</Text>
        </View>
      </View>

      <View style={styles.detailCard}>
        <View style={styles.detailInfo}>
          <Text style={styles.infoLabel}>Başlangıç</Text>
          <Text style={styles.infoValue}>{formatDate(sample.cureDate)}</Text>
          <View style={styles.infoDividerHorizontal} />
          <Text style={styles.infoLabel}>Bitiş</Text>
          <Text style={[styles.infoValue, { color: accentColor }]}>{formatDate(sample.dueDate)}</Text>
        </View>

        {sample.photoUri ? (
          <View style={styles.photoWrapper}>
            <TouchableOpacity
              onPress={(event) => {
                event.stopPropagation?.();
                setImageVisible(true);
              }}
              activeOpacity={0.85}
            >
              <Image source={{ uri: sample.photoUri }} style={styles.detailPhoto} />
            </TouchableOpacity>

            {onCapturePhoto ? (
              <TouchableOpacity
                style={styles.retakeButton}
                onPress={(event) => {
                  event.stopPropagation?.();
                  handleCapturePress();
                }}
                disabled={capturing}
                activeOpacity={0.75}
              >
                <Feather name="camera" size={16} color={COLORS.white} />
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <TouchableOpacity
            style={styles.detailPhotoPlaceholder}
            onPress={(event) => {
              event.stopPropagation?.();
              handleCapturePress();
            }}
            activeOpacity={0.75}
            disabled={capturing}
          >
            {capturing ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <>
                <Feather name="camera" size={28} color={COLORS.gray[400]} />
                <Text style={styles.photoPlaceholderText}>Fotoğraf eklenmedi</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, sample.completed ? styles.completedAction : styles.primaryAction]}
          onPress={(event) => {
            event.stopPropagation?.();
            handleToggle();
          }}
          activeOpacity={0.85}
        >
          {sample.completed ? (
            <Text style={[styles.actionButtonText, styles.completedActionText]}>✓ Tamamlandı</Text>
          ) : (
            <Text style={styles.actionButtonText}>✔︎ Takipte</Text>
          )}
        </TouchableOpacity>

        {onDelete ? (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={(event) => {
              event.stopPropagation?.();
              handleDelete();
            }}
            activeOpacity={0.75}
          >
            <Feather name="trash-2" size={18} color={COLORS.danger} />
          </TouchableOpacity>
        ) : null}
      </View>

      <Modal
        transparent
        visible={imageVisible && !!sample.photoUri}
        animationType="fade"
        onRequestClose={() => setImageVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setImageVisible(false)}>
          <View style={styles.imageOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.imageModalContainer}>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveImage}
                  disabled={saving}
                  activeOpacity={0.8}
                >
                  <Text style={styles.saveButtonIcon}>💾</Text>
                  <Text style={styles.saveButtonText}>{saving ? 'Kaydediliyor...' : 'Galeriye Kaydet'}</Text>
                </TouchableOpacity>
                <Image source={{ uri: sample.photoUri }} style={styles.imageModalPhoto} />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </Container>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    padding: 18,
    gap: 16,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleBlock: {
    flex: 1,
    gap: 6,
  },
  sampleName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
  },
  subLabel: {
    fontSize: 13,
    color: COLORS.gray[500],
    fontWeight: '500',
  },
  subLabelStrong: {
    fontWeight: '700',
    color: COLORS.dark,
    marginRight: 4,
  },
  subLabelSuffix: {
    color: COLORS.gray[500],
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  detailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
  },
  detailInfo: {
    flex: 1,
    gap: 10,
    paddingRight: 8,
  },
  infoDividerHorizontal: {
    height: 1,
    backgroundColor: COLORS.gray[200],
  },
  detailPhoto: {
    width: 128,
    height: 128,
    backgroundColor: COLORS.gray[100],
    borderRadius: 18,
  },
  photoWrapper: {
    position: 'relative',
  },
  retakeButton: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailPhotoPlaceholder: {
    width: 128,
    height: 128,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    borderRadius: 18,
  },
  photoPlaceholderIcon: {
    fontSize: 28,
    color: COLORS.gray[400],
  },
  photoPlaceholderText: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
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
    gap: 12,
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
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  completedActionText: {
    color: COLORS.white,
  },
  imageOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  imageModalContainer: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.dark,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageModalPhoto: {
    width: '100%',
    backgroundColor: COLORS.dark,
    aspectRatio: 1,
    resizeMode: 'contain',
  },
  saveButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 999,
  },
  saveButtonIcon: {
    fontSize: 16,
    color: COLORS.white,
  },
  saveButtonText: {
    fontSize: 13,
    color: COLORS.white,
    fontWeight: '600',
  },
});

export default SampleCard;
