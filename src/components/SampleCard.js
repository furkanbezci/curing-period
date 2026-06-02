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
  Share,
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
  const [showAllSchedules, setShowAllSchedules] = useState(false);
  const cureSchedules = Array.isArray(sample.cureSchedules) && sample.cureSchedules.length > 0
    ? sample.cureSchedules
        .map((item) => ({
          cureDays: Number(item.cureDays),
          dueDate: item.dueDate,
        }))
        .filter((item) => Number.isFinite(item.cureDays) && item.cureDays > 0 && item.dueDate)
        .sort((a, b) => a.cureDays - b.cureDays)
    : [{ cureDays: sample.cureDays, dueDate: sample.dueDate }];
  const visibleSchedules = showAllSchedules ? cureSchedules : cureSchedules.slice(0, 3);
  const hiddenScheduleCount = Math.max(0, cureSchedules.length - visibleSchedules.length);
  const isMultiSample = cureSchedules.length > 1;

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

  const handleShareImage = async () => {
    if (!sample.photoUri) {
      return;
    }

    try {
      await Share.share({
        url: sample.photoUri,
        message: `${sample.name} fotoğrafı`,
      });
    } catch (error) {
      console.error('Fotoğraf paylaşılamadı:', error);
      Alert.alert('Paylaşım', 'Fotoğraf paylaşılamadı.');
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
        { borderColor: `${accentColor}55`, backgroundColor: sample.completed ? COLORS.surfaceSuccess : COLORS.white },
      ]}
      onPress={onEdit ? () => onEdit(sample) : undefined}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.sampleName} numberOfLines={2}>
            {sample.name}
          </Text>
          <Text style={styles.subLabel}>
            {cureSchedules.length > 1 ? (
              <>
                <Text style={styles.subLabelStrong}>{cureSchedules.length}</Text>
                <Text style={styles.subLabelSuffix}> farklı kür planı</Text>
              </>
            ) : (
              <>
                <Text style={styles.subLabelStrong}>{sample.cureDays}</Text>
                <Text style={styles.subLabelSuffix}> günlük kür</Text>
              </>
            )}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: pillColor }]}> 
          <Text style={[styles.statusText, { color: accentColor }]}>{statusInfo.text}</Text>
        </View>
      </View>

      <View style={[styles.detailCard, !isMultiSample && styles.detailCardSingle]}>
        <View style={styles.detailInfo}>
          <Text style={styles.infoLabel}>Başlangıç</Text>
          <Text style={styles.infoValue}>{formatDate(sample.cureDate)}</Text>
          <View style={styles.infoDividerHorizontal} />
          {isMultiSample ? (
            <View style={styles.scheduleSection}>
              <Text style={styles.infoLabel}>Kür Planları</Text>
              {visibleSchedules.map((schedule) => {
                const rowStatus = getStatusInfo(schedule.dueDate, sample.completed);
                const statusColor = rowStatus.status === 'urgent' ? COLORS.gray[700] : rowStatus.color;
                return (
                  <Text key={`${sample.id}-${schedule.cureDays}`} style={styles.scheduleLine}>
                    <Text style={styles.scheduleLineStrong}>{schedule.cureDays} gün</Text>
                    <Text style={styles.scheduleLineText}> - {formatDate(schedule.dueDate)} - </Text>
                    <Text style={[styles.scheduleLineStrong, { color: statusColor }]}>{rowStatus.text}</Text>
                  </Text>
                );
              })}
              {cureSchedules.length > 3 ? (
                <TouchableOpacity
                  style={styles.morePlansButton}
                  onPress={(event) => {
                    event.stopPropagation?.();
                    setShowAllSchedules((prev) => !prev);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={styles.morePlansButtonText}>
                    {showAllSchedules ? 'Daha az göster' : `+${hiddenScheduleCount} plan daha`}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : (
            <>
              <Text style={styles.infoLabel}>Bitiş</Text>
              <Text style={[styles.infoValue, { color: accentColor }]}>{formatDate(sample.dueDate)}</Text>
            </>
          )}
        </View>

        {!isMultiSample ? (
          sample.photoUri ? (
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
          )
        ) : null}
      </View>

      {isMultiSample && showAllSchedules ? (
        <View style={styles.multiPhotoSection}>
          {sample.photoUri ? (
            <TouchableOpacity
              onPress={(event) => {
                event.stopPropagation?.();
                setImageVisible(true);
              }}
              activeOpacity={0.85}
            >
              <Image source={{ uri: sample.photoUri }} style={styles.multiDetailPhoto} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.multiDetailPhotoPlaceholder}
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
      ) : null}

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
                <View style={styles.imageModalActions}>
                  <TouchableOpacity
                    style={styles.roundButton}
                    onPress={handleShareImage}
                    activeOpacity={0.85}
                  >
                    <Feather name="share-2" size={18} color={COLORS.dark} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.roundButton, styles.roundButtonSecondary]}
                    onPress={handleSaveImage}
                    disabled={saving}
                    activeOpacity={0.85}
                  >
                    <Feather name="download" size={18} color={COLORS.dark} />
                  </TouchableOpacity>
                </View>
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
    gap: 12,
  },
  detailCardSingle: {
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
  multiPhotoSection: {
    position: 'relative',
    width: '100%',
    alignItems: 'stretch',
  },
  multiDetailPhoto: {
    width: '100%',
    maxWidth: 260,
    aspectRatio: 16 / 9,
    backgroundColor: COLORS.gray[100],
    borderRadius: 18,
  },
  multiDetailPhotoPlaceholder: {
    width: '100%',
    maxWidth: 260,
    aspectRatio: 2.3,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    borderRadius: 14,
  },
  retakeButton: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.overlayDark65,
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
  scheduleSection: {
    gap: 4,
  },
  scheduleLine: {
    fontSize: 13,
    color: COLORS.gray[700],
  },
  scheduleLineText: {
    color: COLORS.gray[700],
  },
  scheduleLineStrong: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.dark,
  },
  morePlansButton: {
    marginTop: 2,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: COLORS.gray[100],
  },
  morePlansButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray[700],
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
    backgroundColor: COLORS.infoSoft,
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
    backgroundColor: COLORS.primarySoft,
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
    backgroundColor: COLORS.overlayDark70,
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
  imageModalActions: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 10,
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  roundButtonSecondary: {
    backgroundColor: COLORS.gray[100],
  },
});

export default SampleCard;
