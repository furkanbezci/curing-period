import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants';
import { MediaService } from '../services/mediaService';

const PhotoAttachmentField = ({ value, onChange }) => {
  const [loading, setLoading] = useState(false);

  const handleResult = async (action) => {
    setLoading(true);
    try {
      const result = await action();
      if (!result.cancelled && result.uri) {
        onChange(result.uri);
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

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Numune Fotoğrafı (Opsiyonel)</Text>

      <View style={styles.previewRow}>
        <View style={styles.previewContainer}>
          {loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : value ? (
            <Image source={{ uri: value }} style={styles.previewImage} />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>Fotoğraf eklenmedi</Text>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionButton, styles.primaryButton]} onPress={handleTakePhoto} disabled={loading}>
            <Text style={styles.primaryButtonText}>Kamera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={handlePickPhoto} disabled={loading}>
            <Text style={styles.secondaryButtonText}>Galeri</Text>
          </TouchableOpacity>
          {value ? (
            <TouchableOpacity style={[styles.actionButton, styles.removeButton]} onPress={handleRemovePhoto} disabled={loading}>
              <Text style={styles.removeButtonText}>Kaldır</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
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
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 12,
    color: COLORS.gray[500],
    textAlign: 'center',
  },
  actions: {
    flex: 1,
    gap: 8,
  },
  actionButton: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: COLORS.gray[100],
  },
  secondaryButtonText: {
    color: COLORS.dark,
    fontWeight: '600',
  },
  removeButton: {
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    backgroundColor: COLORS.white,
  },
  removeButtonText: {
    color: COLORS.danger,
    fontWeight: '600',
  },
});

export default PhotoAttachmentField;
