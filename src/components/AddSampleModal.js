import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
} from 'react-native';
import { formatDate, calculateDueDate } from '../utils/dateUtils';
import { COLORS, CURE_PERIODS } from '../constants';
import DatePickerField from './DatePickerField';
import PhotoAttachmentField from './PhotoAttachmentField';

const MODES = {
  create: 'create',
  edit: 'edit',
};

const AddSampleModal = ({
  visible,
  onClose,
  onSave,
  onUpdate,
  mode = MODES.create,
  initialSample = null,
}) => {
  const [sampleName, setSampleName] = useState('');
  const [cureDays, setCureDays] = useState(28);
  const [startDate, setStartDate] = useState(new Date());
  const [photoUri, setPhotoUri] = useState(null);
  const isEdit = mode === MODES.edit;

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (isEdit && initialSample) {
      setSampleName(initialSample.name ?? '');
      setCureDays(initialSample.cureDays ?? 28);
      setStartDate(initialSample.cureDate ? new Date(initialSample.cureDate) : new Date());
      setPhotoUri(initialSample.photoUri ?? null);
    } else {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, isEdit, initialSample]);

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
    const sample = {
      id: initialSample?.id ?? Date.now().toString(),
      name: sampleName.trim(),
      cureDate: selectedStartDate.toISOString(),
      cureDays,
      dueDate: dueDate.toISOString(),
      completed: initialSample?.completed ?? false,
      createdAt: createdAt.toISOString(),
      photoUri: photoUri ?? null,
    };

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
      handleClose();
    } catch (error) {
      console.error('Numune kaydedilemedi:', error);
    }
  };

  const resetForm = () => {
    setSampleName('');
    setCureDays(28);
    setStartDate(new Date());
    setPhotoUri(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

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

          <View style={styles.content}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Numune Adı</Text>
              <TextInput
                style={styles.input}
                value={sampleName}
                onChangeText={setSampleName}
                placeholder="Örn: C30/37 - Şantiye A - Numune 1"
                placeholderTextColor={COLORS.gray[400]}
                autoFocus
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

            <PhotoAttachmentField value={photoUri} onChange={setPhotoUri} />

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
              <Text style={styles.summaryText}>
                <Text style={styles.summaryLabel}>Başlangıç: </Text>
                {formatDate(startDate)}
              </Text>
              <Text style={styles.summaryText}>
                <Text style={styles.summaryLabel}>Bitiş Tarihi: </Text>
                {formatDate(calculateDueDate(startDate, cureDays))}
              </Text>
              <Text style={styles.summaryText}>
                <Text style={styles.summaryLabel}>Fotoğraf: </Text>
                {photoUri ? 'Eklendi' : 'Yok'}
              </Text>
            </View>
          </View>

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
    padding: 20,
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
  summaryLabel: {
    fontWeight: '500',
    color: COLORS.gray[600],
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
