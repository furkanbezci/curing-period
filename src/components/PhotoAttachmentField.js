import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { COLORS } from '../constants';
import { MediaService } from '../services/mediaService';

const formatBytes = (bytes) => {
  if (!bytes || bytes <= 0) return null;
  const units = ['B', 'KB', 'MB', 'GB'];
  let index = 0;
  let value = bytes;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(value > 10 ? 0 : 1)} ${units[index]}`;
};

const PhotoAttachmentField = ({ value, onChange }) => {
  const [loading, setLoading] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);

  const handleResult = async (action) => {
    setLoading(true);
    try {
      const result = await action();
      if (!result.cancelled && result.uri) {
        onChange({ uri: result.uri, size: result.size ?? null, isNew: true });
      }
    } catch (error) {
      console.error('Fotoğraf işlemi başarısız:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTakePhoto = () => handleResult(() => MediaService.capturePhoto());
  const handlePickPhoto = () => handleResult(() => MediaService.pickImage());

  const handleRemovePhoto = () => {
    onChange(null);
  };

  const openSheet = () => setSheetVisible(true);
  const closeSheet = () => setSheetVisible(false);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Numune Fotoğrafı</Text>
        <Text style={styles.optionalText}>(Opsiyonel)</Text>
      </View>

      <View style={styles.previewRow}>
        <View style={styles.previewContainer}>
          {loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : value?.uri ? (
            <>
              <View style={styles.previewImageWrapper}>
                <Image source={{ uri: value.uri }} style={styles.previewImage} />
              </View>
              {value.size ? (
                <Text style={styles.sizeText}>{formatBytes(value.size)}</Text>
              ) : null}
            </>
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderIcon}>📷</Text>
              <Text style={styles.placeholderText}>Fotoğraf eklenmedi</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.actionFab}
          onPress={openSheet}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.actionFabIcon}>{value?.uri ? '✏️' : '➕'}</Text>
        </TouchableOpacity>
      </View>

      {value?.uri ? (
        <TouchableOpacity style={styles.removeBadge} onPress={handleRemovePhoto} disabled={loading}>
          <Text style={styles.removeBadgeText}>Fotoğrafı kaldır</Text>
        </TouchableOpacity>
      ) : null}

      <Modal
        visible={sheetVisible}
        transparent
        animationType="fade"
        onRequestClose={closeSheet}
      >
        <TouchableWithoutFeedback onPress={closeSheet}>
          <View style={styles.sheetOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.sheetContainer}>
                <Text style={styles.sheetTitle}>Fotoğraf Ekle</Text>
                <Text style={styles.sheetSubtitle}>Yeni çekebilir ya da galeriden seçebilirsin</Text>

                <View style={styles.sheetActions}>
                  <TouchableOpacity
                    style={[styles.sheetButton, styles.sheetButtonPrimary]}
                    onPress={() => {
                      closeSheet();
                      handleTakePhoto();
                    }}
                    disabled={loading}
                  >
                    <Text style={styles.sheetButtonIcon}>📸</Text>
                    <Text style={styles.sheetButtonText}>Kamera</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.sheetButton, styles.sheetButtonSecondary]}
                    onPress={() => {
                      closeSheet();
                      handlePickPhoto();
                    }}
                    disabled={loading}
                  >
                    <Text style={styles.sheetButtonIcon}>🖼️</Text>
                    <Text style={styles.sheetButtonText}>Galeri</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.sheetCancel} onPress={closeSheet}>
                  <Text style={styles.sheetCancelText}>İptal</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
  },
  optionalText: {
    fontSize: 13,
    color: COLORS.gray[500],
  },
  previewRow: {
    flexDirection: 'row',
    gap: 16,
  },
  previewContainer: {
    width: 96,
    height: 96,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray[50],
    paddingVertical: 6,
    paddingHorizontal: 4,
    gap: 6,
  },
  previewImageWrapper: {
    width: '100%',
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholder: {
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  placeholderIcon: {
    fontSize: 28,
    color: COLORS.gray[400],
  },
  placeholderText: {
    fontSize: 12,
    color: COLORS.gray[500],
    textAlign: 'center',
  },
  sizeText: {
    fontSize: 10,
    color: COLORS.gray[500],
  },
  actionFab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  actionFabIcon: {
    fontSize: 22,
    color: COLORS.white,
  },
  removeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.gray[100],
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  removeBadgeText: {
    fontSize: 13,
    color: COLORS.danger,
    fontWeight: '600',
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
  },
  sheetSubtitle: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  sheetActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  sheetButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 6,
  },
  sheetButtonPrimary: {
    backgroundColor: '#EEF2FF',
  },
  sheetButtonSecondary: {
    backgroundColor: COLORS.gray[100],
  },
  sheetButtonIcon: {
    fontSize: 24,
  },
  sheetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
  sheetCancel: {
    marginTop: 4,
    alignSelf: 'center',
  },
  sheetCancelText: {
    fontSize: 16,
    color: COLORS.gray[600],
    fontWeight: '600',
  },
});

export default PhotoAttachmentField;
