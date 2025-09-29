import React, { useState, useEffect } from 'react';
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
import { StorageService } from '../services/storageService';
import { NotificationService } from '../services/notificationService';
import { COLORS } from '../constants';

const HomeScreen = () => {
  const [samples, setSamples] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
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

  const handleAddSample = async (sample) => {
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
    } catch (error) {
      console.error('Numune ekleme hatası:', error);
      Alert.alert('Hata', 'Numune eklenirken bir hata oluştu.');
    }
  };

  const handleToggleComplete = async (sampleId) => {
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

  const handleDeleteSample = async (sampleId) => {
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
          },
        },
      ]
    );
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

  const stats = getStats();

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
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>🏗️ Beton Kür Takip</Text>
          <Text style={styles.subtitle}>İnşaat Mühendisliği Kür Takip Sistemi</Text>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Toplam</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: COLORS.success }]}>{stats.active}</Text>
            <Text style={styles.statLabel}>Aktif</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: COLORS.warning }]}>{stats.overdue}</Text>
            <Text style={styles.statLabel}>Süre Doldu</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: COLORS.primary }]}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Tamamlandı</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {samples.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📋</Text>
            <Text style={styles.emptyStateTitle}>Henüz numune yok</Text>
            <Text style={styles.emptyStateText}>
              Sağ alttaki + butonuna basarak{'\n'}ilk numunenizi ekleyin
            </Text>
          </View>
        ) : (
          <FlatList
            data={samples}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <SampleCard
                sample={item}
                onToggleComplete={handleToggleComplete}
                onDelete={handleDeleteSample}
              />
            )}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>

      <AddSampleModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleAddSample}
      />
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
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  headerContent: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.dark,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray[600],
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.gray[600],
    textAlign: 'center',
    lineHeight: 24,
  },
  listContainer: {
    paddingTop: 16,
    paddingBottom: 100,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
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
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export default HomeScreen;
