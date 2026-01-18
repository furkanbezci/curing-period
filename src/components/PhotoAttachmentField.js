import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
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

const PhotoAttachmentField = ({
  value,
  onChange,
  saveToGalleryEnabled = true,
  onSaveToGalleryEnabledChange,
}) => {
  const [loading, setLoading] = useState(false);

  const handleResult = async (action) => {
    setLoading(true);
    try {
      const result = await action();
      if (result?.reason === 'permission_denied') {
        Alert.alert('İzin Gerekli', 'Fotoğraf eklemek için gerekli izinleri vermelisiniz.');
        return;
      }

      if (result?.reason === 'camera_unavailable') {
        Alert.alert('Kamera Kullanılamıyor', 'Bu cihazda kamera bulunmuyor veya şu anda erişilemiyor.');
        return;
      }

      if (!result.cancelled && result.uri) {
        onChange({ uri: result.uri, size: result.size ?? null, isNew: true });
      }
    } catch (error) {
      console.error('Fotoğraf işlemi başarısız:', error);
      Alert.alert('Fotoğraf', 'Fotoğraf eklenemedi. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleTakePhoto = () => {
    if (loading) {
      return;
    }

    handleResult(() => MediaService.capturePhoto({ saveToGallery: saveToGalleryEnabled }));
  };

  const handlePickPhoto = () => {
    if (loading) {
      return;
    }

    handleResult(() => MediaService.pickImage());
  };

  const handleRemovePhoto = () => {
    onChange(null);
  };

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
              <TouchableOpacity
                style={styles.previewImageWrapper}
                onPress={handleTakePhoto}
                activeOpacity={0.8}
                disabled={loading}
              >
                <Image source={{ uri: value.uri }} style={styles.previewImage} />
              </TouchableOpacity>
              {value.size ? (
                <Text style={styles.sizeText}>{formatBytes(value.size)}</Text>
              ) : null}
            </>
          ) : (
            <TouchableOpacity
              style={styles.placeholder}
              onPress={handleTakePhoto}
              activeOpacity={0.75}
              disabled={loading}
            >
              <Feather name="camera" size={32} color={COLORS.gray[400]} />
              <Text style={styles.placeholderText}>Fotoğraf eklenmedi</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={handlePickPhoto}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Feather name="image" size={22} color={COLORS.gray[500]} />
        </TouchableOpacity>
      </View>

      {value?.uri ? (
        <TouchableOpacity style={styles.removeBadge} onPress={handleRemovePhoto} disabled={loading}>
          <Text style={styles.removeBadgeText}>Fotoğrafı kaldır</Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.preferenceRow}>
        <View style={styles.preferenceTextBlock}>
          <Text style={styles.preferenceLabel}>Galeride sakla</Text>
          <Text style={styles.preferenceHint}>Fotoğrafı cihaz galerisine kaydet</Text>
        </View>
        <Switch
          value={saveToGalleryEnabled}
          onValueChange={onSaveToGalleryEnabledChange}
          trackColor={{ false: COLORS.gray[300], true: COLORS.primary }}
          thumbColor={COLORS.white}
          disabled={loading}
        />
      </View>

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
  placeholderText: {
    fontSize: 12,
    color: COLORS.gray[500],
    textAlign: 'center',
  },
  sizeText: {
    fontSize: 10,
    color: COLORS.gray[500],
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
    backgroundColor: COLORS.gray[200],
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
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  preferenceTextBlock: {
    flex: 1,
    gap: 2,
    paddingRight: 12,
  },
  preferenceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
  preferenceHint: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
});

export default PhotoAttachmentField;
