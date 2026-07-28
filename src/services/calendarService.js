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

  static getSchedules(sample) {
    if (Array.isArray(sample?.cureSchedules) && sample.cureSchedules.length > 0) {
      return sample.cureSchedules.filter(
        (schedule) => Number.isFinite(Number(schedule?.cureDays)) && schedule?.dueDate
      );
    }

    if (sample?.dueDate) {
      return [{
        cureDays: sample.cureDays,
        dueDate: sample.dueDate,
      }];
    }

    return [];
  }

  static normalizeEventIds(sampleOrIds) {
    if (Array.isArray(sampleOrIds)) {
      return sampleOrIds.filter(Boolean);
    }

    if (Array.isArray(sampleOrIds?.calendarEventIds) && sampleOrIds.calendarEventIds.length > 0) {
      return sampleOrIds.calendarEventIds.filter(Boolean);
    }

    if (sampleOrIds?.calendarEventId) {
      return [sampleOrIds.calendarEventId];
    }

    return [];
  }

  static buildEventPayload(sample, schedule = null) {
    const resolvedSchedule = schedule ?? this.getSchedules(sample)[0] ?? {
      cureDays: sample.cureDays,
      dueDate: sample.dueDate,
    };
    const dueDate = new Date(resolvedSchedule.dueDate);
    const eventStart = new Date(dueDate);
    eventStart.setHours(0, 0, 0, 0);
    const eventEnd = new Date(eventStart);
    eventEnd.setDate(eventEnd.getDate() + 1);

    if (Platform.OS === 'android') {
      const timezoneOffset = eventStart.getTimezoneOffset();
      // Android treats all-day event times as UTC; normalize so the day stays intact
      eventStart.setMinutes(eventStart.getMinutes() - timezoneOffset);
      eventEnd.setMinutes(eventEnd.getMinutes() - timezoneOffset);
    }
    const alarms = [
      { relativeOffset: -1440 },
      { relativeOffset: 0 },
    ];

    const cureStartLabel = sample.cureDate
      ? new Date(sample.cureDate).toLocaleString('tr-TR')
      : '-';
    const dueLabel = dueDate.toLocaleString('tr-TR');
    const cureDays = resolvedSchedule.cureDays ?? sample.cureDays;
    const scheduleCount = this.getSchedules(sample).length;
    const title = scheduleCount > 1
      ? `${sample.name} - ${cureDays}. gün`
      : `${sample.name} - Kür Takibi`;

    const notes = [
      `Numune: ${sample.name}`,
      `Kür Süresi: ${cureDays} gün`,
      `Döküm: ${cureStartLabel}`,
      `Bitiş: ${dueLabel}`,
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
      title,
      startDate: eventStart,
      endDate: eventEnd,
      allDay: true,
      notes,
      alarms,
      timeZone,
    };
  }

  static async createEvent(sample, schedule = null) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const calendarId = await this.ensureCalendar();
      const eventId = await Calendar.createEventAsync(
        calendarId,
        this.buildEventPayload(sample, schedule)
      );
      return eventId;
    } catch (error) {
      console.error('Takvim etkinliği oluşturulamadı:', error);
      return null;
    }
  }

  static async createEvents(sample) {
    const schedules = this.getSchedules(sample);
    if (schedules.length === 0) {
      return [];
    }

    const eventIds = [];
    for (const schedule of schedules) {
      const eventId = await this.createEvent(sample, schedule);
      if (eventId) {
        eventIds.push(eventId);
      }
    }

    return eventIds;
  }

  static async updateEvent(eventId, sample, schedule = null) {
    if (!eventId) {
      return this.createEvent(sample, schedule);
    }

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      await Calendar.updateEventAsync(eventId, this.buildEventPayload(sample, schedule));
      return eventId;
    } catch (error) {
      console.error('Takvim etkinliği güncellenemedi:', error);
      return null;
    }
  }

  static async syncEvents(sample, existingEventIds = null) {
    const schedules = this.getSchedules(sample);
    const previousIds = this.normalizeEventIds(existingEventIds ?? sample);
    const nextIds = [];

    for (let index = 0; index < schedules.length; index += 1) {
      const schedule = schedules[index];
      const existingId = previousIds[index] ?? null;
      let eventId = null;

      if (existingId) {
        eventId = await this.updateEvent(existingId, sample, schedule);
      }

      if (!eventId) {
        eventId = await this.createEvent(sample, schedule);
      }

      if (eventId) {
        nextIds.push(eventId);
      }
    }

    const leftoverIds = previousIds.slice(schedules.length);
    if (leftoverIds.length > 0) {
      await this.deleteEvents(leftoverIds);
    }

    return nextIds;
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

  static async deleteEvents(eventIds) {
    const ids = this.normalizeEventIds(eventIds);
    if (ids.length === 0) {
      return true;
    }

    const results = await Promise.all(ids.map((eventId) => this.deleteEvent(eventId)));
    return results.every(Boolean);
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

  static async getEventsForDay(sample, excludeEventIds = null) {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      return [];
    }

    const excludeSet = new Set(this.normalizeEventIds(excludeEventIds));
    const target = new Date(sample.dueDate ?? sample);
    const start = new Date(target);
    start.setHours(0, 0, 0, 0);
    const end = new Date(target);
    end.setHours(23, 59, 59, 999);

    const queryStart = new Date(start);
    const queryEnd = new Date(end);
    if (Platform.OS === 'android') {
      queryStart.setDate(queryStart.getDate() - 1);
      queryEnd.setDate(queryEnd.getDate() + 1);
    }

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

      const resolvedCalendars = calendarIds
        .map(id => calendars.find(calendar => calendar.id === id))
        .filter(Boolean);

      const events = await this.fetchEventsForCalendars(resolvedCalendars, queryStart, queryEnd, {
        label: 'getEventsForDay',
        sampleId: sample.id ?? null,
      });
      if (!events?.length) {
        return [];
      }

      const filtered = events.filter(event => {
        if (excludeSet.has(event.id)) {
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

  static async getConflictsForSample(sample, excludeEventIds = null) {
    const schedules = this.getSchedules(sample);
    if (schedules.length === 0) {
      return [];
    }

    const seen = new Set();
    const conflicts = [];

    for (const schedule of schedules) {
      const dayEvents = await this.getEventsForDay(
        { ...sample, dueDate: schedule.dueDate },
        excludeEventIds
      );

      for (const event of dayEvents) {
        if (seen.has(event.id)) {
          continue;
        }
        seen.add(event.id);
        conflicts.push(event);
      }
    }

    return conflicts;
  }

  static async fetchEventsForCalendars(calendars, start, end, context = {}) {
    const { label = 'debug', sampleId = null, maxEventLogs = 5 } = context;
    const header = `[CalendarDebug:${label}]`;
    const aggregated = [];

    for (const calendar of calendars) {
      if (!calendar?.id) {
        continue;
      }

      try {
        const calendarEvents = await Calendar.getEventsAsync([calendar.id], start, end);
        const count = calendarEvents?.length ?? 0;
        const calendarTitle = calendar.title || calendar.id || 'Takvim';
        // console.log(
        //   `${header} ${calendarTitle} (${calendar.id}) → ${count} etkinlik`,
        //   {
        //     rangeStart: start.toISOString(),
        //     rangeEnd: end.toISOString(),
        //     sampleId,
        //   }
        // );

        if (count > 0) {
          (calendarEvents ?? [])
            .slice(0, maxEventLogs)
            .forEach(event => {
              // console.log(`${header}   • ${event.title || '(Başlıksız)'}`, {
              //   eventId: event.id,
              //   startDate: event.startDate,
              //   endDate: event.endDate,
              //   allDay: Boolean(event.allDay),
              // });
            });
          if (count > maxEventLogs) {
            // console.log(`${header}   • … ${count - maxEventLogs} etkinlik daha`);
          }
        }

        aggregated.push(...(calendarEvents ?? []));
      } catch (calendarError) {
        // console.error(`${header} ${calendar?.title || calendar?.id || 'Takvim'} okunamadı`, calendarError);
      }
    }

    console.log(`${header} toplam`, aggregated.length);
    return aggregated;
  }

  static async debugLogEventsForDate(targetDate, label = 'debug') {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('CalendarService#debugLogEventsForDate no permissions');
        return;
      }

      const start = new Date(targetDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(targetDate);
      end.setHours(23, 59, 59, 999);
      if (Platform.OS === 'android') {
        start.setDate(start.getDate() - 1);
        end.setDate(end.getDate() + 1);
      }
      console.log ("33jhjhjhjhjjhjhjhjhjhjhjStart",start,"ss",end)

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      // console.log(`CalendarService#debugLogEventsForDate (${label}) calendars`, calendars.map(calendar => ({
      //   id: calendar.id,
      //   title: calendar.title,
      //   isVisible: calendar.isVisible,
      // })));

      const calendarIds = calendars.map(calendar => calendar.id).filter(Boolean);
      if (!calendarIds.length) {
        // console.log('CalendarService#debugLogEventsForDate no calendar ids');
        return;
      }

      const resolvedCalendars = calendarIds
        .map(id => calendars.find(calendar => calendar.id === id))
        .filter(Boolean);

        console.log("resolvedCalendars--------resolvedCalendars",resolvedCalendars)

      const events = await this.fetchEventsForCalendars(resolvedCalendars, start, end, { label });
      // console.log(`CalendarService#debugLogEventsForDate (${label}) range`, {
      //   start: start.toISOString(),
      //   end: end.toISOString(),
      // });
      console.log(`CalendarService#debugLogEventsForDate (${label}) events`, events);
    } catch (error) {
      console.error('CalendarService#debugLogEventsForDate failed', error);
    }
  }
}
