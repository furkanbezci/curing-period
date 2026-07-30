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
const MAX_MULTI_CURE_INPUTS = 5;

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
  const [multiDateEnabled, setMultiDateEnabled] = useState(false);
  const [multiCureDays, setMultiCureDays] = useState(['28']);
  const originalPhotoUriRef = useRef(null);
  const isEdit = mode === MODES.edit;

  console.log("🗓️🗓️ calendarPermissionsGranted",calendarPermissionsGranted)
  useEffect(() => {
    if (!visible) {
      return;
    }

    if (isEdit && initialSample) {
      const existingSchedules = Array.isArray(initialSample.cureSchedules) && initialSample.cureSchedules.length > 0
        ? initialSample.cureSchedules
        : [{ cureDays: initialSample.cureDays, dueDate: initialSample.dueDate }];
      const parsedCureDays = existingSchedules
        .map((schedule) => Number(schedule.cureDays))
        .filter((value) => Number.isFinite(value) && value > 0)
        .sort((a, b) => a - b);
      const baseCureDay = parsedCureDays[0] ?? initialSample.cureDays ?? 28;
      const isMultiSample = parsedCureDays.length > 1;

      setSampleName(initialSample.name ?? '');
      setCureDays(baseCureDay);
      setStartDate(initialSample.cureDate ? new Date(initialSample.cureDate) : new Date());
      setPhoto(initialSample.photoUri ? { uri: initialSample.photoUri, size: null, isNew: false } : null);
      setCalendarSyncEnabled(Boolean(
        initialSample.calendarSyncEnabled
        ?? initialSample.calendarEventIds?.length
        ?? initialSample.calendarEventId
      ));
      setMultiCureDays((isMultiSample ? parsedCureDays : [baseCureDay]).map((value) => String(value)));
      setMultiDateEnabled(isMultiSample);
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

    if (!multiDateEnabled && cureDays <= 0) {
      Alert.alert('Hata', 'Kür süresi 0\'dan büyük olmalıdır.');
      return;
    }

    const selectedStartDate = startDate instanceof Date ? startDate : new Date(startDate);
    const selectedCureDays = (multiDateEnabled ? multiCureDays : [cureDays])
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value > 0)
      .filter((value, index, arr) => arr.indexOf(value) === index)
      .sort((a, b) => a - b);

    if (selectedCureDays.length === 0) {
      Alert.alert('Hata', 'En az bir geçerli kür süresi seçin.');
      return;
    }

    const cureSchedules = selectedCureDays.map((days) => ({
      cureDays: days,
      dueDate: calculateDueDate(selectedStartDate, days).toISOString(),
    }));
    const primarySchedule = cureSchedules[0];
    const createdAt = isEdit && initialSample?.createdAt
      ? new Date(initialSample.createdAt)
      : new Date();
    const finalPhotoUri = photo?.uri ?? null;

    const draftSample = {
      id: initialSample?.id ?? Date.now().toString(),
      name: sampleName.trim(),
      cureDate: selectedStartDate.toISOString(),
      cureDays: primarySchedule.cureDays,
      dueDate: primarySchedule.dueDate,
      cureSchedules,
      completed: initialSample?.completed ?? false,
      createdAt: createdAt.toISOString(),
      photoUri: finalPhotoUri,
      calendarSyncEnabled,
      calendarEventIds: calendarSyncEnabled
        ? CalendarService.normalizeEventIds(initialSample)
        : [],
      calendarEventId: calendarSyncEnabled
        ? CalendarService.normalizeEventIds(initialSample)[0] ?? null
        : null,
      testReminderId: initialSample?.testReminderId ?? null,
    };

    if (calendarSyncEnabled) {
      const dayEvents = await CalendarService.getConflictsForSample(
        draftSample,
        draftSample.calendarEventIds
      );

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

        const conflictDaysLabel = draftSample.cureSchedules?.length > 1
          ? 'Kür bitiş günlerinde'
          : 'Kür bitiş günü';

        const proceed = await new Promise(resolve => {
          Alert.alert(
            'Takvim Uyarısı',
            `${conflictDaysLabel} takvimde başka etkinlik(ler) var:\n\n${preview}\n\nYine de devam etmek ister misiniz?`,
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
    setMultiDateEnabled(false);
    setMultiCureDays(['28']);
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

  const selectedCureScheduleDays = (multiDateEnabled ? multiCureDays : [cureDays])
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0)
    .filter((value, index, arr) => arr.indexOf(value) === index)
    .sort((a, b) => a - b);
  const dueDate = calculateDueDate(startDate, selectedCureScheduleDays[0] ?? cureDays);
  const isLockedMultiSample = isEdit
    && Array.isArray(initialSample?.cureSchedules)
    && initialSample.cureSchedules.length > 1;

  const todayParts = getDateSummaryParts(new Date());
  const startDateParts = getDateSummaryParts(startDate);
  const dueDateParts = getDateSummaryParts(dueDate);

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
              <View style={styles.multiDateToggleRow}>
                <View style={styles.multiDateInfo}>
                  <Text style={styles.summaryLabel}>Çoklu Döküm</Text>
                  <Text style={styles.calendarHelpText}>
                    Aynı numuneye ait farklı kür süreleri.
                  </Text>
                </View>
                <Switch
                  value={multiDateEnabled}
                  onValueChange={(nextValue) => {
                    if (isLockedMultiSample && !nextValue) {
                      return;
                    }
                    setMultiDateEnabled(nextValue);
                    if (nextValue) {
                      setMultiCureDays((prev) => {
                        if (prev.length > 0) {
                          return prev;
                        }
                        return [String(cureDays || 28)];
                      });
                    }
                  }}
                  disabled={isLockedMultiSample}
                  trackColor={{ false: COLORS.gray[300], true: COLORS.primary }}
                  thumbColor={COLORS.white}
                />
              </View>

              {multiDateEnabled ? (
                <View style={styles.additionalPeriodsContainer}>
                  <Text style={styles.labelSmall}>Kür Günleri</Text>
                  <Text style={styles.multiInputLimitText}>
                    En fazla {MAX_MULTI_CURE_INPUTS} tarih girebilirsiniz.
                  </Text>
                  <View style={styles.multiInputsContainer}>
                    {multiCureDays.map((value, index) => (
                      <View key={`multi-day-${index}`} style={styles.multiInputRow}>
                        <TextInput
                          style={[styles.input, styles.multiInput]}
                          value={value}
                          onChangeText={(text) => {
                            const sanitized = text.replace(/[^0-9]/g, '');
                            setMultiCureDays((prev) => prev.map((item, i) => (i === index ? sanitized : item)));
                          }}
                          keyboardType="numeric"
                          placeholder="Gün"
                          placeholderTextColor={COLORS.gray[400]}
                        />
                        <Text style={styles.multiInputSuffix}>gün</Text>
                        <TouchableOpacity
                          style={styles.multiInputAction}
                          onPress={() => {
                            setMultiCureDays((prev) => {
                              if (prev.length <= 1) {
                                return prev;
                              }
                              return prev.filter((_, i) => i !== index);
                            });
                          }}
                        >
                          <Text style={styles.multiInputActionText}>Sil</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.addMultiInputButton,
                      multiCureDays.length >= MAX_MULTI_CURE_INPUTS && styles.addMultiInputButtonDisabled,
                    ]}
                    onPress={() => {
                      if (multiCureDays.length >= MAX_MULTI_CURE_INPUTS) {
                        return;
                      }
                      setMultiCureDays((prev) => [...prev, '']);
                    }}
                    disabled={multiCureDays.length >= MAX_MULTI_CURE_INPUTS}
                  >
                    <Text style={styles.addMultiInputButtonText}>+ Kür günü ekle</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
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
                    onChangeText={(text) => setCureDays(parseInt(text, 10) || 0)}
                    keyboardType="numeric"
                    placeholder="Özel süre girin"
                    placeholderTextColor={COLORS.gray[400]}
                  />
                </>
              )}
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
              {selectedCureScheduleDays.length > 1 ? (
                <View style={styles.multiSummaryContainer}>
                  <Text style={styles.summaryLabel}>Kür Planları</Text>
                  {selectedCureScheduleDays.map((days) => {
                    const scheduleDueDate = getDateSummaryParts(calculateDueDate(startDate, days));
                    return (
                      <Text key={`summary-${days}`} style={styles.multiSummaryItem}>
                        {days} gün - {scheduleDueDate.day}.{scheduleDueDate.month}.{scheduleDueDate.year} {scheduleDueDate.time}
                      </Text>
                    );
                  })}
                </View>
              ) : null}
              <View style={styles.calendarRow}>
                <View style={styles.calendarInfo}>
                  <Text style={styles.summaryLabel}>Takvime ekle</Text>
                  <Text style={styles.calendarHelpText}>
                    Her kür bitiş gününü takvime ekler.
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
    height: 40,
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
  multiDateToggleRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  multiDateInfo: {
    flex: 1,
    marginBottom: 13,
  },
  additionalPeriodsContainer: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: COLORS.gray[50],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  labelSmall: {
    fontSize: 13,
    color: COLORS.gray[700],
    fontWeight: '600',
    marginBottom: 8,
  },
  multiInputLimitText: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginBottom: 8,
  },
  multiInputsContainer: {
    gap: 8,
  },
  multiInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  multiInput: {
    flex: 1,
  },
  multiInputSuffix: {
    fontSize: 14,
    color: COLORS.gray[600],
    fontWeight: '600',
    minWidth: 30,
  },
  multiInputAction: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.gray[100],
    borderWidth: 1,
    borderColor: COLORS.gray[300],
  },
  multiInputActionText: {
    fontSize: 12,
    color: COLORS.danger,
    fontWeight: '600',
  },
  addMultiInputButton: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
  },
  addMultiInputButtonDisabled: {
    opacity: 0.5,
  },
  addMultiInputButtonText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '700',
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
  multiSummaryContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    gap: 4,
  },
  multiSummaryItem: {
    fontSize: 13,
    color: COLORS.gray[700],
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
