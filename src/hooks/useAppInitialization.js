import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { runAppInitialization } from '../initialization/runAppInitialization';

export function useAppInitialization() {
  const [loading, setLoading] = useState(true);
  const [samples, setSamples] = useState([]);
  const [saveToGalleryEnabled, setSaveToGalleryEnabled] = useState(true);
  const [calendarPermissionGranted, setCalendarPermissionGranted] =
    useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const result = await runAppInitialization();
        if (cancelled) return;
        setSamples(result.samples);
        setSaveToGalleryEnabled(result.saveToGalleryEnabled);
        setCalendarPermissionGranted(result.calendarPermissionGranted);
      } catch (error) {
        if (cancelled) return;
        console.error('Uygulama başlatma hatası:', error);
        Alert.alert('Hata', 'Uygulama başlatılamadı.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    loading,
    samples,
    setSamples,
    saveToGalleryEnabled,
    setSaveToGalleryEnabled,
    calendarPermissionGranted,
    setCalendarPermissionGranted,
  };
}
