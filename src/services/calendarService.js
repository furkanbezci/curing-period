import * as Calendar from 'expo-calendar';
import { Platform, Linking } from 'react-native';

const CALENDAR_NAME = 'Beton Kür Takip';
const CALENDAR_COLOR = '#2563EB';

export class CalendarService {
  static calendarId = null;

  static async requestPermissions() {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      return false;
    }

    if (Platform.OS === 'ios') {
      const { status: remindersStatus } = await Calendar.requestRemindersPermissionsAsync();
      if (remindersStatus !== 'granted') {
        console.warn('Takvim hatırlatma izni verilmedi, alarm eklenemeyebilir.');
      }
    }

    return true;
  }

  static async ensureCalendar() {
    if (this.calendarId) {
      return this.calendarId;
    }

    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const existing = calendars.find(calendar => calendar.title === CALENDAR_NAME);
    if (existing) {
      this.calendarId = existing.id;
      return existing.id;
    }

    const defaultSource = await this.getDefaultSource();
    const calendarConfig = {
      title: CALENDAR_NAME,
      color: CALENDAR_COLOR,
      entityType: Calendar.EntityTypes.EVENT,
      name: CALENDAR_NAME,
      ownerAccount: 'personal',
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
    };

    if (Platform.OS === 'ios' && defaultSource?.id) {
      calendarConfig.sourceId = defaultSource.id;
    }

    if (defaultSource) {
      calendarConfig.source = defaultSource;
    }

    const id = await Calendar.createCalendarAsync(calendarConfig);
    this.calendarId = id;
    return id;
  }

  static async getDefaultSource() {
    if (Platform.OS === 'ios') {
      const defaultCalendar = await Calendar.getDefaultCalendarAsync();
      return defaultCalendar?.source ?? null;
    }

    return { isLocalAccount: true, name: CALENDAR_NAME };
  }

  static buildEventPayload(sample) {
    const dueDate = new Date(sample.dueDate);
    const startDate = new Date(dueDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    if (Platform.OS === 'android') {
      const timezoneOffset = startDate.getTimezoneOffset();
      // Android treats all-day event times as UTC; normalize so the day stays intact
      startDate.setMinutes(startDate.getMinutes() - timezoneOffset);
      endDate.setMinutes(endDate.getMinutes() - timezoneOffset);
    }
    const alarms = [
      { relativeOffset: -1440 },
      { relativeOffset: 0 },
    ];

    const notes = [
      `Numune: ${sample.name}`,
      `Kür Süresi: ${sample.cureDays} gün`,
      `Başlangıç: ${startDate.toLocaleString('tr-TR')}`,
      `Bitiş: ${endDate.toLocaleString('tr-TR')}`,
    ].join('\n');

    let timeZone;
    if (typeof Intl !== 'undefined' && typeof Intl.DateTimeFormat === 'function') {
      try {
        timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      } catch (error) {
        timeZone = undefined;
      }
    }

    return {
      title: `${sample.name} - Kür Takibi`,
      startDate,
      endDate,
      allDay: true,
      notes,
      alarms,
      timeZone,
    };
  }

  static async createEvent(sample) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const calendarId = await this.ensureCalendar();
      const eventId = await Calendar.createEventAsync(calendarId, this.buildEventPayload(sample));
      return eventId;
    } catch (error) {
      console.error('Takvim etkinliği oluşturulamadı:', error);
      return null;
    }
  }

  static async updateEvent(eventId, sample) {
    if (!eventId) {
      return this.createEvent(sample);
    }

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      await Calendar.updateEventAsync(eventId, this.buildEventPayload(sample));
      return eventId;
    } catch (error) {
      console.error('Takvim etkinliği güncellenemedi:', error);
      return null;
    }
  }

  static async deleteEvent(eventId) {
    if (!eventId) {
      return true;
    }

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return false;
      }

      await Calendar.deleteEventAsync(eventId);
      return true;
    } catch (error) {
      console.error('Takvim etkinliği silinemedi:', error);
      return false;
    }
  }

  static async openSettings() {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
        return true;
      }

      if (Platform.OS === 'android') {
        await Linking.openSettings();
        return true;
      }
    } catch (error) {
      console.error('Takvim ayarları açılamadı:', error);
    }

    return false;
  }

  static async ensurePermissionOrOpenSettings() {
    const granted = await this.requestPermissions();
    if (granted) {
      return true;
    }

    await this.openSettings();
    return false;
  }

  static async getEventsForDay(sample, excludeEventId = null) {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      return [];
    }

    const target = new Date(sample.dueDate ?? sample);
    const start = new Date(target);
    start.setHours(0, 0, 0, 0);
    const end = new Date(target);
    end.setHours(23, 59, 59, 999);

    try {
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const calendarIds = Array.from(
        new Set(
          calendars
            .map(calendar => calendar.id)
            .filter(Boolean)
        )
      );

      if (!calendarIds.length) {
        return [];
      }

      const events = await Calendar.getEventsAsync(calendarIds, start, end);
      if (!events?.length) {
        return [];
      }

      const filtered = events.filter(event => {
        if (excludeEventId && event.id === excludeEventId) {
          return false;
        }

        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate ?? event.startDate);
        const isAllDay = Boolean(event.allDay);

        if (isAllDay) {
          eventStart.setHours(0, 0, 0, 0);
          eventEnd.setHours(23, 59, 59, 999);
        }

        const overlaps = eventStart <= end && eventEnd >= start;
        if (!overlaps) {
          return false;
        }

        if (!sample.cureDate) {
          return true;
        }

        const sampleStart = new Date(sample.cureDate);
        sampleStart.setHours(0, 0, 0, 0);

        return eventStart >= sampleStart;
      });

      return filtered;
    } catch (error) {
      console.error('Takvim etkinlikleri alınamadı:', error);
      return [];
    }
  }
}
