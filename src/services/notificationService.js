import * as Notifications from 'expo-notifications';
import { NOTIFICATION_CHANNELS } from '../constants';

export class NotificationService {
  static async initialize() {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    await this.createNotificationChannels();
  }

  static async createNotificationChannels() {
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.CURE_REMINDER, {
      name: 'Kür Hatırlatıcı',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    });

    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.CURE_COMPLETED, {
      name: 'Kür Tamamlandı',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 500, 250, 500],
    });
  }

  static async requestPermissions() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  }

  static async scheduleCureNotification(sampleId, sampleName, dueDate) {
    try {
      const dueDateObj = new Date(dueDate);
      const now = new Date();

      const scheduledIds = [];

      if (dueDateObj > now) {
        const completionId = await Notifications.scheduleNotificationAsync({
          content: {
            title: '🔔 Beton Kür Süresi Doldu',
            body: `${sampleName} numunesinin ${this.formatDueDate(dueDate)} tarihinde kür süresi tamamlandı.`,
            sound: true,
            data: { sampleId, type: 'cure_completed' },
          },
          trigger: dueDateObj,
        });
        if (completionId) {
          scheduledIds.push(completionId);
        }

        const oneDayBefore = new Date(dueDateObj.getTime() - 24 * 60 * 60 * 1000);
        if (oneDayBefore > now) {
          const dayId = await Notifications.scheduleNotificationAsync({
            content: {
              title: '⏰ Kür Süresi Yarın Doluyor',
              body: `${sampleName} numunesinin kür süresi yarın tamamlanacak. Hazırlık yapmayı unutmayın.`,
              sound: true,
              data: { sampleId, type: 'cure_reminder_day' },
            },
            trigger: oneDayBefore,
          });
          if (dayId) {
            scheduledIds.push(dayId);
          }
        }

        const sevenDaysBefore = new Date(dueDateObj.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (sevenDaysBefore > now) {
          const weekId = await Notifications.scheduleNotificationAsync({
            content: {
              title: '⏰ Kür Süresi 1 Hafta Kaldı',
              body: `${sampleName} numunesinin kür süresi bir hafta içinde tamamlanacak.`,
              sound: true,
              data: { sampleId, type: 'cure_reminder_week' },
            },
            trigger: sevenDaysBefore,
          });
          if (weekId) {
            scheduledIds.push(weekId);
          }
        }
      }

      return scheduledIds;
    } catch (error) {
      console.error('Bildirim planlanamadı:', error);
      return [];
    }
  }

  static async scheduleTestHourReminder(sampleId, sampleName, dueDate) {
    try {
      const dueDateObj = new Date(dueDate);
      const now = new Date();
      const oneHourBefore = new Date(dueDateObj.getTime() - 60 * 60 * 1000);

      if (oneHourBefore <= now) {
        console.warn('Test bildirim planlanamadı: süre geçti');
        return null;
      }

      return await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 Test: Kür Süresi 1 Saat Kaladı',
          body: `${sampleName} numunesi için test bildirimi.`,
          sound: true,
          data: { sampleId, type: 'cure_reminder_hour_test' },
        },
        trigger: oneHourBefore,
      });
    } catch (error) {
      console.error('Test bildirim planlanamadı:', error);
      return null;
    }
  }

  static async cancelNotification(notificationIds) {
    if (!notificationIds) {
      return true;
    }

    const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];

    try {
      await Promise.all(
        ids
          .filter(Boolean)
          .map(id => Notifications.cancelScheduledNotificationAsync(id))
      );
      return true;
    } catch (error) {
      console.error('Bildirim iptal edilemedi:', error);
      return false;
    }
  }

  static formatDueDate(date) {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
