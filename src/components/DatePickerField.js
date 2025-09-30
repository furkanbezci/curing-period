import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { formatDate } from '../utils/dateUtils';
import { COLORS } from '../constants';

const DatePickerField = ({
  label,
  value,
  onChange,
  minimumDate,
  maximumDate,
  mode = 'date',
  placeholder = 'Tarih seçin',
  confirmText = 'Seç',
  cancelText = 'İptal',
}) => {
  const [open, setOpen] = useState(false);
  const [tempDate, setTempDate] = useState(() => (value ? new Date(value) : new Date()));

  const initialDate = useMemo(() => (value ? new Date(value) : new Date()), [value]);

  useEffect(() => {
    if (!open) {
      setTempDate(initialDate);
    }
  }, [initialDate, open]);

  const handleConfirm = (date) => {
    setOpen(false);
    setTempDate(date);
    if (onChange) {
      onChange(date);
    }
  };

  const handleCancel = () => {
    setOpen(false);
    setTempDate(initialDate);
  };

  const handleAndroidChange = (event, selectedDate) => {
    if (event.type === 'set' && selectedDate) {
      handleConfirm(selectedDate);
    } else {
      handleCancel();
    }
  };

  const handleIOSChange = (_, selectedDate) => {
    if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const displayValue = value ? formatDate(value) : placeholder;
  const displayColor = value ? COLORS.dark : COLORS.gray[500];

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        style={styles.field}
        onPress={() => {
          if (Platform.OS === 'android') {
            const minimum = minimumDate ? new Date(minimumDate) : undefined;
            const maximum = maximumDate ? new Date(maximumDate) : undefined;

            if (mode === 'datetime') {
              DateTimePickerAndroid.open({
                value: initialDate,
                mode: 'date',
                is24Hour: true,
                minimumDate: minimum,
                maximumDate: maximum,
                onChange: (event, selectedDate) => {
                  if (event.type !== 'set' || !selectedDate) {
                    handleCancel();
                    return;
                  }

                  const timeBase = value ? new Date(value) : initialDate;
                  const defaultTime = new Date(selectedDate);
                  defaultTime.setHours(timeBase.getHours());
                  defaultTime.setMinutes(timeBase.getMinutes());

                  DateTimePickerAndroid.open({
                    value: defaultTime,
                    mode: 'time',
                    is24Hour: true,
                    onChange: (timeEvent, selectedTime) => {
                      if (timeEvent.type !== 'set' || !selectedTime) {
                        handleCancel();
                        return;
                      }

                      const finalDate = new Date(selectedDate);
                      finalDate.setHours(selectedTime.getHours());
                      finalDate.setMinutes(selectedTime.getMinutes());
                      finalDate.setSeconds(0);
                      finalDate.setMilliseconds(0);
                      handleConfirm(finalDate);
                    },
                  });
                },
              });
            } else {
              DateTimePickerAndroid.open({
                value: initialDate,
                mode,
                is24Hour: true,
                minimumDate: mode === 'date' ? minimum : undefined,
                maximumDate: mode === 'date' ? maximum : undefined,
                onChange: handleAndroidChange,
              });
            }
          } else {
            setOpen(true);
          }
        }}
        activeOpacity={0.7}
      >
        <Text style={[styles.valueText, { color: displayColor }]}>{displayValue}</Text>
      </TouchableOpacity>

      {open && Platform.OS === 'ios' && (
        <Modal
          transparent
          animationType="slide"
          visible={open}
          onRequestClose={handleCancel}
        >
          <TouchableWithoutFeedback onPress={handleCancel}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.modalSheet}>
                  <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={handleCancel}>
                      <Text style={styles.cancelText}>{cancelText}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleConfirm(tempDate)}>
                      <Text style={styles.confirmText}>{confirmText}</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={tempDate}
                    mode={mode}
                    display="spinner"
                    onChange={handleIOSChange}
                    minimumDate={minimumDate ? new Date(minimumDate) : undefined}
                    maximumDate={maximumDate ? new Date(maximumDate) : undefined}
                    style={styles.iosPicker}
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8,
  },
  field: {
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
  },
  valueText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  modalSheet: {
    backgroundColor: COLORS.white,
    paddingBottom: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  cancelText: {
    fontSize: 16,
    color: COLORS.gray[600],
  },
  confirmText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  iosPicker: {
    backgroundColor: COLORS.white,
  },
});

export default DatePickerField;
