import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import { calculateDueDate } from '../utils/dateUtils';
import { COLORS, CURE_PERIODS } from '../constants';
import DatePickerField from './DatePickerField';
import PhotoAttachmentField from './PhotoAttachmentField';
import { MediaService } from '../services/mediaService';
import { CalendarService } from '../services/calendarService';

const MODES = {
  create: 'create',
  edit: 'edit',
};

const getDateSummaryParts = (date) => {
  const parsedDate = new Date(date);

  return {
    day: parsedDate.toLocaleDateString('tr-TR', { day: '2-digit' }),
    month: parsedDate.toLocaleDateString('tr-TR', { month: '2-digit' }),
    monthName: parsedDate.toLocaleDateString('tr-TR', { month: 'short' }).replace('.', ''),
    year: parsedDate.toLocaleDateString('tr-TR', {
      year: 'numeric',
    }),
    time: parsedDate.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
};

const AddSampleModal = ({
  visible,
  onClose,
  onSave,
  onUpdate,
  mode = MODES.create,
  initialSample = null,
  calendarPermissionsGranted = false,
  onCalendarPermissionChange,
  saveToGalleryEnabled = true,
  onSaveToGalleryChange,
}) => {
  const [sampleName, setSampleName] = useState('');
  const [cureDays, setCureDays] = useState(28);
  const [startDate, setStartDate] = useState(new Date());
  const [photo, setPhoto] = useState(null);
  const [calendarSyncEnabled, setCalendarSyncEnabled] = useState(calendarPermissionsGranted);
  const originalPhotoUriRef = useRef(null);
  const isEdit = mode === MODES.edit;

  console.log("🗓️🗓️ calendarPermissionsGranted",calendarPermissionsGranted)
  useEffect(() => {
    if (!visible) {
      return;
    }

    if (isEdit && initialSample) {
      setSampleName(initialSample.name ?? '');
      setCureDays(initialSample.cureDays ?? 28);
      setStartDate(initialSample.cureDate ? new Date(initialSample.cureDate) : new Date());
      setPhoto(initialSample.photoUri ? { uri: initialSample.photoUri, size: null, isNew: false } : null);
      setCalendarSyncEnabled(Boolean(initialSample.calendarSyncEnabled ?? initialSample.calendarEventId));
      originalPhotoUriRef.current = initialSample.photoUri ?? null;
    } else {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, isEdit, initialSample]);

  useEffect(() => {
    if (!isEdit && visible) {
      setCalendarSyncEnabled(calendarPermissionsGranted);
    }
  }, [calendarPermissionsGranted, isEdit, visible]);

  const handleSave = async () => {
    if (!sampleName.trim()) {
      Alert.alert('Hata', 'Numune adı giriniz.');
      return;
    }

    if (cureDays <= 0) {
      Alert.alert('Hata', 'Kür süresi 0\'dan büyük olmalıdır.');
      return;
    }

    const selectedStartDate = startDate instanceof Date ? startDate : new Date(startDate);
    const dueDate = calculateDueDate(selectedStartDate, cureDays);
    const createdAt = isEdit && initialSample?.createdAt
      ? new Date(initialSample.createdAt)
      : new Date();
    const finalPhotoUri = photo?.uri ?? null;

    const draftSample = {
      id: initialSample?.id ?? Date.now().toString(),
      name: sampleName.trim(),
      cureDate: selectedStartDate.toISOString(),
      cureDays,
      dueDate: dueDate.toISOString(),
      completed: initialSample?.completed ?? false,
      createdAt: createdAt.toISOString(),
      photoUri: finalPhotoUri,
      calendarSyncEnabled,
      calendarEventId: calendarSyncEnabled ? initialSample?.calendarEventId ?? null : null,
      testReminderId: initialSample?.testReminderId ?? null,
    };

    if (calendarSyncEnabled) {
      const dayEvents = await CalendarService.getEventsForDay(
        draftSample,
        draftSample.calendarEventId
      );
      console.log("draftSample",draftSample)
      console.log("dayEvents",dayEvents)

      if (dayEvents.length > 0) {
        const previewItems = dayEvents
          .slice(0, 3)
          .map(event => {
            const title = event.title || 'Etkinlik';
            const timeLabel = event.allDay
              ? 'Tüm gün'
              : (() => {
                  const startTime = new Date(event.startDate);
                  const endTime = new Date(event.endDate);
                  const startText = startTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                  const endText = endTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                  return `${startText} - ${endText}`;
                })();
            return `• ${title} (${timeLabel})`;
          })
          .join('\n');

        const extraCount = Math.max(0, dayEvents.length - 3);
        const preview = extraCount > 0
          ? `${previewItems}\n• +${extraCount} etkinlik daha`
          : previewItems;

        const proceed = await new Promise(resolve => {
          Alert.alert(
            'Takvim Uyarısı',
            `Kür bitiş günü takvimde başka etkinlik(ler) var:\n\n${preview}\n\nYine de devam etmek ister misiniz?`,
            [
              {
                text: 'İptal',
                style: 'cancel',
                onPress: () => resolve(false),
              },
              {
                text: 'Devam',
                onPress: () => resolve(true),
              },
            ],
            { cancelable: false }
          );
        });

        if (!proceed) {
          return;
        }
      }
    }

    const sample = draftSample;

    try {
      let result = true;
      if (isEdit && onUpdate) {
        result = await onUpdate(sample);
      } else {
        result = await onSave(sample);
      }
      if (result === false) {
        return;
      }

      if (originalPhotoUriRef.current && originalPhotoUriRef.current !== finalPhotoUri) {
        await MediaService.deletePhoto(originalPhotoUriRef.current);
      }

      originalPhotoUriRef.current = finalPhotoUri;
      handleClose();
    } catch (error) {
      console.error('Numune kaydedilemedi:', error);
    }
  };

  const resetForm = () => {
    setSampleName('');
    setCureDays(28);
    setStartDate(new Date());
    setPhoto(null);
    setCalendarSyncEnabled(calendarPermissionsGranted);
    originalPhotoUriRef.current = null;
  };

  const handleClose = useCallback(() => {
    if (photo?.isNew && photo?.uri && photo?.uri !== originalPhotoUriRef.current) {
      MediaService.deletePhoto(photo.uri).catch(() => {});
    }

    resetForm();
    onClose();
  }, [onClose, photo]);

  const handlePhotoChange = useCallback((nextPhoto) => {
    if (nextPhoto) {
      if (photo?.isNew && photo.uri && photo.uri !== nextPhoto.uri) {
        MediaService.deletePhoto(photo.uri).catch(() => {});
      }
      setPhoto({ ...nextPhoto, isNew: true });
      return;
    }

    if (photo?.isNew && photo.uri) {
      MediaService.deletePhoto(photo.uri).catch(() => {});
    }

    setPhoto(null);
  }, [photo]);

  const handleCalendarToggle = useCallback(async (nextValue) => {
    if (nextValue) {
      const granted = await CalendarService.ensurePermissionOrOpenSettings();
      if (!granted) {
        setCalendarSyncEnabled(false);
        onCalendarPermissionChange?.(false);
        return;
      }

      onCalendarPermissionChange?.(true);
    }

    setCalendarSyncEnabled(nextValue);
  }, [onCalendarPermissionChange]);

  const todayParts = getDateSummaryParts(new Date());
  const startDateParts = getDateSummaryParts(startDate);
  const dueDateParts = getDateSummaryParts(calculateDueDate(startDate, cureDays));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>{isEdit ? 'Numuneyi Düzenle' : 'Yeni Numune Ekle'}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Numune Adı</Text>
              <TextInput
                style={styles.input}
                value={sampleName}
                onChangeText={setSampleName}
                placeholder="Örn: C30/37 - Şantiye A - Numune 1"
                placeholderTextColor={COLORS.gray[400]}
                autoFocus={!isEdit}
              />
            </View>

            <View style={styles.inputGroup}>
              <DatePickerField
                label="Kür Başlangıç Tarihi"
                value={startDate}
                onChange={setStartDate}
                mode="datetime"
                placeholder="Başlangıç tarihi seçin"
              />
              <Text style={styles.dateInfoSubtext}>
                Seçtiğiniz tarih numunenin kür başlangıcı olarak kaydedilecek
              </Text>
            </View>

            <PhotoAttachmentField
              value={photo}
              onChange={handlePhotoChange}
              saveToGalleryEnabled={saveToGalleryEnabled}
              onSaveToGalleryEnabledChange={onSaveToGalleryChange}
            />

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Kür Süresi</Text>
              <View style={styles.periodButtons}>
                {CURE_PERIODS.map((period) => (
                  <TouchableOpacity
                    key={period.value}
                    style={[
                      styles.periodButton,
                      cureDays === period.value && styles.periodButtonActive,
                    ]}
                    onPress={() => setCureDays(period.value)}
                  >
                    <Text
                      style={[
                        styles.periodButtonText,
                        cureDays === period.value && styles.periodButtonTextActive,
                      ]}
                    >
                      {period.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <TextInput
                style={styles.input}
                value={cureDays.toString()}
                onChangeText={(text) => setCureDays(parseInt(text) || 0)}
                keyboardType="numeric"
                placeholder="Özel süre girin"
                placeholderTextColor={COLORS.gray[400]}
              />
            </View>

            <View style={styles.summary}>
              <Text style={styles.summaryTitle}>📋 Özet</Text>
              <Text style={styles.summaryTodayText}>
                Bugün: {todayParts.day}.{todayParts.month}.{todayParts.year}
              </Text>
              <View style={styles.summaryTextRow}>
                <Text style={styles.summaryText}>
                  <Text style={styles.summaryLabel}>Başlangıç: </Text>
                  <Text style={styles.summaryDateEmphasis}>{startDateParts.day}.{startDateParts.month}</Text>
                  <Text>.{startDateParts.year} {startDateParts.time}</Text>
                </Text>
                <View style={styles.monthChip}>
                  <Text style={styles.monthChipText}>{startDateParts.monthName}</Text>
                </View>
              </View>
              <View style={styles.summaryTextRow}>
                <Text style={styles.summaryText}>
                  <Text style={styles.summaryLabel}>Bitiş Tarihi: </Text>
                  <Text style={styles.summaryDateEmphasis}>{dueDateParts.day}.{dueDateParts.month}</Text>
                  <Text>.{dueDateParts.year} {dueDateParts.time}</Text>
                </Text>
                <View style={[styles.monthChip, styles.monthChipDue]}>
                  <Text style={styles.monthChipText}>{dueDateParts.monthName}</Text>
                </View>
              </View>
              <Text style={styles.summaryText}>
                <Text style={styles.summaryLabel}>Fotoğraf: </Text>
                {photo?.uri ? 'Eklendi' : 'Yok'}
              </Text>
              <View style={styles.calendarRow}>
                <View style={styles.calendarInfo}>
                  <Text style={styles.summaryLabel}>Takvime ekle</Text>
                  <Text style={styles.calendarHelpText}>
                    Takvime hatırlatıcı ekle.
                  </Text>
                </View>
                <Switch
                  value={calendarSyncEnabled}
                  onValueChange={handleCalendarToggle}
                  trackColor={{ false: COLORS.gray[300], true: COLORS.primary }}
                  thumbColor={calendarSyncEnabled ? COLORS.white : COLORS.white}
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
            >
              <Text style={styles.cancelButtonText}>İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>{isEdit ? 'Güncelle' : 'Kaydet'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.dark,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: COLORS.gray[600],
    fontWeight: '600',
  },
  content: {
    maxHeight: '75%',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.dark,
    backgroundColor: COLORS.white,
  },
  dateInfoSubtext: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginTop: 4,
  },
  periodButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.gray[100],
    borderWidth: 1,
    borderColor: COLORS.gray[300],
  },
  periodButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  periodButtonText: {
    fontSize: 14,
    color: COLORS.gray[700],
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: COLORS.white,
  },
  summary: {
    backgroundColor: COLORS.light,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 14,
    color: COLORS.dark,
  },
  summaryTodayText: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginBottom: 8,
    fontWeight: '500',
  },
  summaryTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 6,
    gap: 6,
  },
  summaryLabel: {
    fontWeight: '500',
    color: COLORS.gray[600],
  },
  summaryDateEmphasis: {
    fontWeight: '700',
    color: COLORS.dark,
  },
  monthChip: {
    marginLeft: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  monthChipDue: {
    backgroundColor: COLORS.success,
  },
  monthChipText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  calendarRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarInfo: {
    flex: 1,
    marginRight: 12,
  },
  calendarHelpText: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.gray[100],
    borderWidth: 1,
    borderColor: COLORS.gray[300],
  },
  cancelButtonText: {
    fontSize: 16,
    color: COLORS.gray[700],
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  saveButtonText: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '600',
  },
});

export default AddSampleModal;
