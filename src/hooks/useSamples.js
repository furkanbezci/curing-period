import { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { NotificationService } from '../services/notificationService';
import { Alert } from 'react-native';

export const useSamples = () => {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const addSample = async (sample) => {
    try {
      const notificationId = await NotificationService.scheduleCureNotification(
        sample.id,
        sample.name,
        sample.dueDate
      );

      const sampleWithNotification = {
        ...sample,
        notificationId,
      };

      const updatedSamples = [sampleWithNotification, ...samples];
      setSamples(updatedSamples);
      await StorageService.saveSamples(updatedSamples);

      Alert.alert('Başarılı', 'Numune başarıyla eklendi ve bildirim planlandı.');
      return true;
    } catch (error) {
      console.error('Numune ekleme hatası:', error);
      Alert.alert('Hata', 'Numune eklenirken bir hata oluştu.');
      return false;
    }
  };

  const toggleComplete = async (sampleId) => {
    try {
      const updatedSamples = samples.map(sample =>
        sample.id === sampleId
          ? { ...sample, completed: !sample.completed }
          : sample
      );

      setSamples(updatedSamples);
      await StorageService.saveSamples(updatedSamples);
    } catch (error) {
      console.error('Durum güncelleme hatası:', error);
    }
  };

  const deleteSample = async (sampleId) => {
    try {
      const sample = samples.find(s => s.id === sampleId);
      if (sample?.notificationId) {
        await NotificationService.cancelNotification(sample.notificationId);
      }

      const updatedSamples = samples.filter(s => s.id !== sampleId);
      setSamples(updatedSamples);
      await StorageService.saveSamples(updatedSamples);
    } catch (error) {
      console.error('Numune silme hatası:', error);
      Alert.alert('Hata', 'Numune silinirken bir hata oluştu.');
    }
  };

  const getStats = () => {
    const total = samples.length;
    const completed = samples.filter(s => s.completed).length;
    const active = total - completed;
    const overdue = samples.filter(s => {
      const now = new Date();
      const due = new Date(s.dueDate);
      return !s.completed && due < now;
    }).length;

    return { total, completed, active, overdue };
  };

  return {
    samples,
    loading,
    addSample,
    toggleComplete,
    deleteSample,
    getStats,
  };
};