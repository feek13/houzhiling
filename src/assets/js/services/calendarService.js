/**
 * 日历同步服务
 * 功能：将训练计划同步到日历，支持导出 ICS 格式
 */

import { storage } from './storage.js';
import { authService } from './authService.js';
import { eventBus, EventNames } from './eventBus.js';

export const calendarService = (() => {
  /**
   * 生成 ICS 格式日历文件
   * @param {Array} events - 事件列表
   * @returns {string} ICS 文件内容
   */
  const generateICS = (events) => {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    let ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//FitSpark//Workout Calendar//CN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:FitSpark 训练计划',
      'X-WR-TIMEZONE:Asia/Shanghai',
      'X-WR-CALDESC:FitSpark 健身平台的训练计划日历'
    ];

    events.forEach(event => {
      const uid = `${event.id}@fitspark.com`;
      const dtstart = formatICSDate(event.start);
      const dtend = formatICSDate(event.end);
      const created = formatICSDate(event.created || now);
      const modified = formatICSDate(event.modified || now);

      ics.push('BEGIN:VEVENT');
      ics.push(`UID:${uid}`);
      ics.push(`DTSTAMP:${timestamp}`);
      ics.push(`DTSTART:${dtstart}`);
      ics.push(`DTEND:${dtend}`);
      ics.push(`CREATED:${created}`);
      ics.push(`LAST-MODIFIED:${modified}`);
      ics.push(`SUMMARY:${escapeICS(event.title)}`);
      ics.push(`DESCRIPTION:${escapeICS(event.description || '')}`);
      ics.push(`LOCATION:${escapeICS(event.location || '')}`);
      ics.push(`STATUS:${event.status || 'CONFIRMED'}`);
      ics.push(`SEQUENCE:0`);

      // 添加提醒（训练前30分钟）
      if (event.alarm !== false) {
        ics.push('BEGIN:VALARM');
        ics.push('TRIGGER:-PT30M');
        ics.push('ACTION:DISPLAY');
        ics.push(`DESCRIPTION:${escapeICS(event.title)} 即将开始`);
        ics.push('END:VALARM');
      }

      ics.push('END:VEVENT');
    });

    ics.push('END:VCALENDAR');

    return ics.join('\r\n');
  };

  /**
   * 格式化日期为 ICS 格式
   * @param {Date|string} date - 日期对象或字符串
   * @returns {string} ICS 日期格式 (YYYYMMDDTHHMMSSZ)
   */
  const formatICSDate = (date) => {
    const d = new Date(date);
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  /**
   * 转义 ICS 特殊字符
   * @param {string} text - 文本内容
   * @returns {string} 转义后的文本
   */
  const escapeICS = (text) => {
    return String(text)
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  };

  /**
   * 从训练数据生成日历事件
   * @param {Array} workouts - 训练列表
   * @returns {Array} 日历事件列表
   */
  const workoutsToEvents = (workouts) => {
    return workouts.map(workout => {
      const start = new Date(workout.scheduledAt || workout.createdAt);
      const duration = workout.duration || 60; // 默认60分钟
      const end = new Date(start.getTime() + duration * 60000);

      return {
        id: workout.id || `workout_${Date.now()}`,
        title: `💪 ${workout.muscle || '训练'} - ${workout.name || '健身'}`,
        description: [
          `训练类型: ${workout.muscle || '综合训练'}`,
          `目标: ${workout.goal || '增肌/减脂'}`,
          `难度: ${workout.difficulty || '中等'}`,
          workout.calories ? `预计消耗: ${workout.calories} 卡路里` : '',
          workout.notes ? `备注: ${workout.notes}` : ''
        ].filter(Boolean).join('\n'),
        location: workout.location || '健身房',
        start,
        end,
        created: new Date(workout.createdAt),
        modified: new Date(workout.updatedAt || workout.createdAt),
        status: workout.completed ? 'COMPLETED' : 'CONFIRMED',
        alarm: true
      };
    });
  };

  /**
   * 导出训练计划到 ICS 文件
   * @param {Object} options - 导出选项
   */
  const exportWorkoutCalendar = (options = {}) => {
    const user = authService.currentUser();
    if (!user) {
      console.error('[Calendar] 用户未登录');
      return;
    }

    const workouts = storage.get('workouts', []);

    // 过滤选项
    let filteredWorkouts = workouts;

    if (options.dateRange) {
      const { start, end } = options.dateRange;
      filteredWorkouts = workouts.filter(w => {
        const date = new Date(w.scheduledAt || w.createdAt);
        return date >= start && date <= end;
      });
    }

    if (options.muscleGroups && options.muscleGroups.length > 0) {
      filteredWorkouts = filteredWorkouts.filter(w =>
        options.muscleGroups.includes(w.muscle)
      );
    }

    if (options.onlyScheduled) {
      filteredWorkouts = filteredWorkouts.filter(w => w.scheduledAt);
    }

    // 生成日历事件
    const events = workoutsToEvents(filteredWorkouts);

    if (events.length === 0) {
      console.warn('[Calendar] 没有训练数据可导出');
      eventBus.emit(EventNames.NOTIFICATION_SHOW, {
        type: 'warning',
        message: '没有可导出的训练计划'
      });
      return;
    }

    // 生成 ICS 文件
    const icsContent = generateICS(events);

    // 下载文件
    downloadICS(icsContent, options.filename || 'fitspark-workouts.ics');

    console.log(`[Calendar] 成功导出 ${events.length} 个训练计划`);

    eventBus.emit(EventNames.NOTIFICATION_SHOW, {
      type: 'success',
      message: `成功导出 ${events.length} 个训练计划到日历`
    });

    return {
      eventsCount: events.length,
      filename: options.filename || 'fitspark-workouts.ics'
    };
  };

  /**
   * 下载 ICS 文件
   * @param {string} content - ICS 文件内容
   * @param {string} filename - 文件名
   */
  const downloadICS = (content, filename) => {
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  /**
   * 获取日历视图数据
   * @param {number} year - 年份
   * @param {number} month - 月份 (1-12)
   * @returns {Object} 日历数据
   */
  const getCalendarView = (year, month) => {
    const workouts = storage.get('workouts', []);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    // 过滤当月训练
    const monthWorkouts = workouts.filter(w => {
      const date = new Date(w.scheduledAt || w.createdAt);
      return date >= firstDay && date <= lastDay;
    });

    // 按日期分组
    const workoutsByDate = {};
    monthWorkouts.forEach(workout => {
      const date = new Date(workout.scheduledAt || workout.createdAt);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

      if (!workoutsByDate[dateKey]) {
        workoutsByDate[dateKey] = [];
      }

      workoutsByDate[dateKey].push({
        id: workout.id,
        muscle: workout.muscle,
        name: workout.name,
        duration: workout.duration,
        completed: workout.completed,
        calories: workout.calories,
        time: date.toTimeString().slice(0, 5) // HH:MM
      });
    });

    // 计算日历布局
    const firstDayOfWeek = firstDay.getDay(); // 0-6 (周日-周六)
    const daysInMonth = lastDay.getDate();

    return {
      year,
      month,
      firstDayOfWeek,
      daysInMonth,
      workoutsByDate,
      totalWorkouts: monthWorkouts.length,
      completedWorkouts: monthWorkouts.filter(w => w.completed).length
    };
  };

  /**
   * 生成训练计划日程
   * @param {Object} plan - 训练计划
   * @returns {Array} 日程事件
   */
  const generateWorkoutSchedule = (plan) => {
    const events = [];
    const startDate = new Date(plan.startDate || Date.now());

    plan.workouts.forEach((workout, index) => {
      const workoutDate = new Date(startDate);
      workoutDate.setDate(workoutDate.getDate() + index * (plan.frequency || 1));

      // 设置训练时间（默认下午6点）
      workoutDate.setHours(plan.preferredTime?.hour || 18);
      workoutDate.setMinutes(plan.preferredTime?.minute || 0);
      workoutDate.setSeconds(0);

      const duration = workout.duration || 60;
      const endDate = new Date(workoutDate.getTime() + duration * 60000);

      events.push({
        id: `plan_${plan.id}_${index}`,
        title: `💪 ${workout.muscle} - ${workout.name}`,
        description: [
          `训练计划: ${plan.name}`,
          `目标: ${plan.goal}`,
          `组数: ${workout.sets || 3}`,
          `次数: ${workout.reps || 12}`,
          workout.notes || ''
        ].filter(Boolean).join('\n'),
        location: plan.location || '健身房',
        start: workoutDate,
        end: endDate,
        created: new Date(),
        status: 'TENTATIVE',
        alarm: true
      });
    });

    return events;
  };

  /**
   * 添加单个训练到日历
   * @param {Object} workout - 训练数据
   * @returns {string} ICS 文件内容
   */
  const addWorkoutToCalendar = (workout) => {
    const events = workoutsToEvents([workout]);
    return generateICS(events);
  };

  /**
   * 获取本周训练安排
   * @returns {Array} 本周训练列表
   */
  const getWeekWorkouts = () => {
    const workouts = storage.get('workouts', []);
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // 周日
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    return workouts.filter(w => {
      const date = new Date(w.scheduledAt || w.createdAt);
      return date >= startOfWeek && date < endOfWeek;
    }).sort((a, b) => {
      const dateA = new Date(a.scheduledAt || a.createdAt);
      const dateB = new Date(b.scheduledAt || b.createdAt);
      return dateA - dateB;
    });
  };

  /**
   * 获取今日训练
   * @returns {Array} 今日训练列表
   */
  const getTodayWorkouts = () => {
    const workouts = storage.get('workouts', []);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    return workouts.filter(w => {
      const date = new Date(w.scheduledAt || w.createdAt);
      return date >= today && date < tomorrow;
    }).sort((a, b) => {
      const dateA = new Date(a.scheduledAt || a.createdAt);
      const dateB = new Date(b.scheduledAt || b.createdAt);
      return dateA - dateB;
    });
  };

  /**
   * 生成 Google Calendar URL
   * @param {Object} event - 事件数据
   * @returns {string} Google Calendar 链接
   */
  const generateGoogleCalendarUrl = (event) => {
    const baseUrl = 'https://calendar.google.com/calendar/render';
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      details: event.description || '',
      location: event.location || '',
      dates: `${formatICSDate(event.start)}/${formatICSDate(event.end)}`
    });

    return `${baseUrl}?${params.toString()}`;
  };

  return {
    generateICS,
    exportWorkoutCalendar,
    getCalendarView,
    generateWorkoutSchedule,
    addWorkoutToCalendar,
    getWeekWorkouts,
    getTodayWorkouts,
    generateGoogleCalendarUrl,
    workoutsToEvents
  };
})();
