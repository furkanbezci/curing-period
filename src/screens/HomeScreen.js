import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import SampleCard from '../components/SampleCard';
import AddSampleModal from '../components/AddSampleModal';
import SampleListHeader from '../components/SampleListHeader';
import SampleEmptyState from '../components/SampleEmptyState';
import { StorageService } from '../services/storageService';
import { NotificationService } from '../services/notificationService';
import { MediaService } from '../services/mediaService';
import { CalendarService } from '../services/calendarService';
import { COLORS } from '../constants';
import { getRemainingTime } from '../utils/dateUtils';

const HomeScreen = () => {
  const [samples, setSamples] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingSample, setEditingSample] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calendarPermissionGranted, setCalendarPermissionGranted] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await NotificationService.initialize();
      const hasPermission = await NotificationService.requestPermissions();
      
      if (!hasPermission) {
        Alert.alert(
          'Bildirim İzni',
          'Bildirimler için izin verilmedi. Uygulama tam işlevsel olmayabilir.'
        );
      }

      await loadSamples();

      const calendarGranted = await CalendarService.requestPermissions();
      setCalendarPermissionGranted(calendarGranted);
      if (!calendarGranted) {
        console.warn('Takvim izni verilmedi.');
      }
    } catch (error) {
      console.error('Uygulama başlatma hatası:', error);
      Alert.alert('Hata', 'Uygulama başlatılamadı.');
    } finally {
      setLoading(false);
    }
  };

  const loadSamples = async () => {
    try {
      const loadedSamples = await StorageService.loadSamples();
      setSamples(loadedSamples);
    } catch (error) {
      console.error('Numuneler yüklenemedi:', error);
    }
  };

  const handleAddSample = useCallback(async (sample) => {
    try {
      const notificationIds = await NotificationService.scheduleCureNotification(
        sample.id,
        sample.name,
        sample.dueDate
      );

      await NotificationService.scheduleTestHourReminder(
        sample.id,
        sample.name,
        sample.dueDate
      );

      let calendarEventId = sample.calendarEventId ?? null;
      let calendarSyncEnabled = Boolean(sample.calendarSyncEnabled);

      if (calendarSyncEnabled) {
        calendarEventId = await CalendarService.createEvent(sample);
        if (!calendarEventId) {
          calendarSyncEnabled = false;
          Alert.alert(
            'Takvim Uyarısı',
            'Takvim etkinliği oluşturulamadı. İsterseniz daha sonra tekrar deneyebilirsiniz.'
          );
        }
      }

      const sampleWithNotification = {
        ...sample,
        notificationIds,
        calendarEventId,
        calendarSyncEnabled,
      };

      let updatedSamples = [];
      setSamples((prev) => {
        updatedSamples = [sampleWithNotification, ...prev];
        return updatedSamples;
      });
      await StorageService.saveSamples(updatedSamples);

      Alert.alert('Başarılı', 'Numune başarıyla eklendi ve bildirim planlandı.');
      return true;
    } catch (error) {
      console.error('Numune ekleme hatası:', error);
      Alert.alert('Hata', 'Numune eklenirken bir hata oluştu.');
      return false;
    }
  }, []);

  const handleToggleComplete = useCallback(async (sampleId) => {
    try {
      let updatedSamples = [];
      setSamples((prev) => {
        updatedSamples = prev.map(sample =>
          sample.id === sampleId
          ? { ...sample, completed: !sample.completed }
          : sample
        );
        return updatedSamples;
      });
      await StorageService.saveSamples(updatedSamples);
    } catch (error) {
      console.error('Durum güncelleme hatası:', error);
    }
  }, []);

  const handleDeleteSample = useCallback((sampleId) => {
    Alert.alert(
      'Numune Sil',
      'Bu numuneyi silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const sample = samples.find(s => s.id === sampleId);
              if (sample?.notificationIds || sample?.notificationId) {
                await NotificationService.cancelNotification(sample.notificationIds ?? sample.notificationId);
              }

              if (sample?.calendarEventId) {
                await CalendarService.deleteEvent(sample.calendarEventId);
              }

              if (sample?.photoUri) {
                await MediaService.deletePhoto(sample.photoUri);
              }

              let updatedSamples = [];
              setSamples((prev) => {
                updatedSamples = prev.filter(s => s.id !== sampleId);
                return updatedSamples;
              });
              await StorageService.saveSamples(updatedSamples);
            } catch (error) {
              console.error('Numune silme hatası:', error);
              Alert.alert('Hata', 'Numune silinirken bir hata oluştu.');
            }
          },
        },
      ]
    );
  }, [samples]);

  const handleUpdateSample = useCallback(async (updatedSample) => {
    try {
      const existing = samples.find(s => s.id === updatedSample.id);
      if (!existing) {
        return false;
      }

      if (existing.notificationIds || existing.notificationId) {
        await NotificationService.cancelNotification(existing.notificationIds ?? existing.notificationId);
      }

      const notificationIds = await NotificationService.scheduleCureNotification(
        updatedSample.id,
        updatedSample.name,
        updatedSample.dueDate
      );

      let calendarEventId = existing.calendarEventId ?? null;
      let calendarSyncEnabled = Boolean(updatedSample.calendarSyncEnabled);

      if (calendarSyncEnabled) {
        const updatedId = await CalendarService.updateEvent(calendarEventId, updatedSample);
        if (updatedId) {
          calendarEventId = updatedId;
        } else {
          calendarEventId = await CalendarService.createEvent(updatedSample);
        }

        if (!calendarEventId) {
          calendarSyncEnabled = false;
          Alert.alert(
            'Takvim Uyarısı',
            'Takvim güncellenemedi. Etkinlik bağlantısı kapatıldı.'
          );
        }
      } else if (calendarEventId) {
        await CalendarService.deleteEvent(calendarEventId);
        calendarEventId = null;
      }

      let nextSamples = [];
      setSamples((prev) => {
        nextSamples = prev.map(sample => {
          if (sample.id !== updatedSample.id) {
            return sample;
          }

          const { notificationId: _legacyId, notificationIds: _legacyIds, ...rest } = sample;
          return {
            ...rest,
            ...updatedSample,
            notificationIds,
            calendarEventId,
            calendarSyncEnabled,
          };
        });
        return nextSamples;
      });

      await StorageService.saveSamples(nextSamples);
      Alert.alert('Güncellendi', 'Numune bilgileri güncellendi.');
      return true;
    } catch (error) {
      console.error('Numune güncelleme hatası:', error);
      Alert.alert('Hata', 'Numune güncellenirken bir hata oluştu.');
      return false;
    }
  }, [samples]);

  const handleCapturePhoto = useCallback(async (targetSample) => {
    try {
      const result = await MediaService.capturePhoto();

      if (result.cancelled) {
        if (result.reason === 'permission_denied') {
          Alert.alert('Kamera İzni', 'Kamera erişimi olmadan fotoğraf ekleyemezsiniz.');
        } else if (result.reason === 'camera_unavailable') {
          Alert.alert('Kamera Kullanılamıyor', 'Bu cihazda kamera bulunmuyor veya şu anda erişilemiyor.');
        }
        return;
      }

      const currentSample = samples.find(s => s.id === targetSample.id);
      if (!currentSample) {
        return;
      }

      const updatedSample = { ...currentSample, photoUri: result.uri };

      let nextSamples = [];
      setSamples(prev => {
        nextSamples = prev.map(sample => (sample.id === updatedSample.id ? updatedSample : sample));
        return nextSamples;
      });

      await StorageService.saveSamples(nextSamples);

      if (currentSample.photoUri && currentSample.photoUri !== result.uri) {
        await MediaService.deletePhoto(currentSample.photoUri);
      }

      Alert.alert('Fotoğraf', 'Fotoğraf eklendi.');
    } catch (error) {
      console.error('Fotoğraf yakalama hatası:', error);
      Alert.alert('Fotoğraf', 'Fotoğraf eklenemedi. Lütfen tekrar deneyin.');
    }
  }, [samples]);

  const openCreateModal = useCallback(() => {
    setModalMode('create');
    setEditingSample(null);
    setModalVisible(true);
  }, []);

  const openEditModal = useCallback((sample) => {
    setModalMode('edit');
    setEditingSample(sample);
    setModalVisible(true);
  }, []);

  const stats = useMemo(() => {
    const total = samples.length;
    const completed = samples.filter(s => s.completed).length;
    const active = total - completed;
    const overdue = samples.filter(s => {
      const now = new Date();
      const due = new Date(s.dueDate);
      return !s.completed && due < now;
    }).length;

    return { total, completed, active, overdue };
  }, [samples]);

  const upcomingSample = useMemo(() => {
    const openSamples = samples
      .filter(sample => !sample.completed)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    return openSamples[0] ?? null;
  }, [samples]);

  const upcomingStatus = useMemo(() => {
    if (!upcomingSample) {
      return null;
    }
    return getRemainingTime(upcomingSample.dueDate);
  }, [upcomingSample]);

  const renderSample = useCallback(({ item }) => (
    <SampleCard
      sample={item}
      onToggleComplete={handleToggleComplete}
      onDelete={handleDeleteSample}
      onEdit={openEditModal}
      onCapturePhoto={handleCapturePhoto}
    />
  ), [handleCapturePhoto, handleDeleteSample, handleToggleComplete, openEditModal]);

  const keyExtractor = useCallback((item) => item.id, []);

  const renderHeader = useMemo(
    () => () => (
      <SampleListHeader
        stats={stats}
        upcomingSample={upcomingSample}
        upcomingStatus={upcomingStatus}
      />
    ),
    [stats, upcomingSample, upcomingStatus]
  );

  const renderEmptyState = useCallback(() => <SampleEmptyState />, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.gray[50]} />

      <FlatList
        data={samples}
        keyExtractor={keyExtractor}
        renderItem={renderSample}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={openCreateModal}
        activeOpacity={0.85}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>

      {modalVisible && (
        <AddSampleModal
          visible={modalVisible}
          onClose={() => {
            setModalVisible(false);
            setModalMode('create');
            setEditingSample(null);
          }}
          onSave={handleAddSample}
          onUpdate={handleUpdateSample}
          mode={modalMode}
          initialSample={editingSample}
          calendarPermissionsGranted={calendarPermissionGranted}
          onCalendarPermissionChange={setCalendarPermissionGranted}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.gray[600],
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonText: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export default HomeScreen;
