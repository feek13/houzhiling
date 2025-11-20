/**
 * 训练日历模块
 * 功能：显示训练日历、本周训练安排、导出到日历应用
 */

import { storage } from '../services/storage.js';
import { authService } from '../services/authService.js';
import { calendarService } from '../services/calendarService.js';
import { eventBus, EventNames } from '../services/eventBus.js';
import { notificationService } from '../services/notificationService.js';

export const calendarModule = (() => {
  const calendarView = document.getElementById('calendar-view');
  const weekWorkouts = document.getElementById('week-workouts');
  let currentDate = new Date();
  let editModal = null;

  // 获取本地日期字符串（YYYY-MM-DD格式），避免时区问题
  const getLocalDateStr = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getWorkouts = () => {
    const user = authService.currentUser();
    if (!user) return [];
    return storage.get('workouts', []).filter(w => w.userId === user.id);
  };

  // 获取训练计划
  const getTrainingPlans = () => {
    const user = authService.currentUser();
    if (!user) return [];
    return storage.get('trainingPlans', []).filter(p => p.userId === user.id);
  };

  // 获取指定日期的训练计划
  const getTrainingPlanForDate = (date) => {
    const plans = getTrainingPlans();
    const dateStr = getLocalDateStr(date);
    return plans.find(p => p.date === dateStr);
  };

  // 保存训练计划
  const saveTrainingPlan = (date, planText) => {
    const user = authService.currentUser();
    if (!user) return;

    const plans = storage.get('trainingPlans', []);
    const dateStr = getLocalDateStr(date);

    // 查找是否已存在该日期的计划
    const existingIndex = plans.findIndex(p => p.date === dateStr && p.userId === user.id);

    if (planText.trim() === '') {
      // 如果计划为空，删除该计划
      if (existingIndex !== -1) {
        plans.splice(existingIndex, 1);
      }
    } else {
      // 保存或更新计划
      const plan = {
        id: existingIndex !== -1 ? plans[existingIndex].id : Date.now(),
        userId: user.id,
        date: dateStr,
        plan: planText,
        createdAt: existingIndex !== -1 ? plans[existingIndex].createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (existingIndex !== -1) {
        plans[existingIndex] = plan;
      } else {
        plans.push(plan);
      }
    }

    storage.set('trainingPlans', plans);
    eventBus.emit(EventNames.TRAINING_PLAN_UPDATED, { date: dateStr });
  };

  const getMonthData = (year, month) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    return { firstDay, lastDay, daysInMonth, startDayOfWeek };
  };

  const getWorkoutsForDate = (date) => {
    const workouts = getWorkouts();
    const dateStr = getLocalDateStr(date);
    return workouts.filter(w => w.date && w.date.startsWith(dateStr));
  };

  const renderCalendar = () => {
    if (!calendarView) return;
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const { daysInMonth, startDayOfWeek } = getMonthData(year, month);
    const monthNames = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];
    
    let html = `<div class="calendar-header"><button class="calendar-nav-btn" id="prev-month">&lt;</button><h3>${year}年 ${monthNames[month]}</h3><button class="calendar-nav-btn" id="next-month">&gt;</button></div><div class="calendar-grid"><div class="calendar-day-header">日</div><div class="calendar-day-header">一</div><div class="calendar-day-header">二</div><div class="calendar-day-header">三</div><div class="calendar-day-header">四</div><div class="calendar-day-header">五</div><div class="calendar-day-header">六</div>`;
    
    for (let i = 0; i < startDayOfWeek; i++) {
      html += '<div class="calendar-day empty"></div>';
    }
    
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayWorkouts = getWorkoutsForDate(date);
      const trainingPlan = getTrainingPlanForDate(date);
      const isToday = date.toDateString() === today.toDateString();
      const hasWorkout = dayWorkouts.length > 0;
      const hasPlan = trainingPlan !== undefined;

      let indicators = '';
      if (hasWorkout) {
        indicators += `<span class="workout-dot" title="已完成 ${dayWorkouts.length} 次训练">${dayWorkouts.length}</span>`;
      }
      if (hasPlan) {
        indicators += `<span class="plan-indicator" title="${escapeHtml(trainingPlan.plan)}">📝</span>`;
      }

      html += `<div class="calendar-day ${isToday?'today':''} ${hasWorkout?'has-workout':''} ${hasPlan?'has-plan':''}" data-date="${date.toISOString()}"><span class="day-number">${day}</span>${indicators}</div>`;
    }
    
    html += '</div><div class="calendar-actions"><button class="btn ghost" id="export-calendar-btn">导出日历</button></div>';
    calendarView.innerHTML = html;
    
    document.getElementById('prev-month')?.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth()-1); renderCalendar(); });
    document.getElementById('next-month')?.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth()+1); renderCalendar(); });
    document.getElementById('export-calendar-btn')?.addEventListener('click', handleExportCalendar);
    document.querySelectorAll('.calendar-day[data-date]').forEach(day => { day.addEventListener('click', (e) => { const date = new Date(e.currentTarget.dataset.date); showWorkoutsForDate(date); }); });
  };

  const renderWeekWorkouts = () => {
    if (!weekWorkouts) return;
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDays.push(date);
    }

    const dayNames = ['周日','周一','周二','周三','周四','周五','周六'];
    const dayEmojis = ['☀️', '💼', '💼', '💼', '💼', '💼', '🎉'];

    const html = weekDays.map((date, i) => {
      const dayWorkouts = getWorkoutsForDate(date);
      const trainingPlan = getTrainingPlanForDate(date);
      const isToday = date.toDateString() === today.toDateString();
      const hasContent = dayWorkouts.length > 0 || trainingPlan;

      let workoutContent = '';
      if (dayWorkouts.length > 0) {
        workoutContent = `
          <div class="week-section completed-section">
            <div class="section-title">
              <span class="section-icon">✅</span>
              <span class="section-label">已完成</span>
            </div>
            ${dayWorkouts.map(w => `
              <div class="workout-detail">
                <span class="workout-type">${escapeHtml(w.type || '训练')}</span>
                <span class="workout-duration">${w.duration || 0}分钟</span>
                ${w.calories ? `<span class="workout-calories">${w.calories}卡</span>` : ''}
              </div>
            `).join('')}
          </div>
        `;
      }

      let planContent = '';
      if (trainingPlan) {
        const planLines = trainingPlan.plan.split('\n').filter(line => line.trim());
        planContent = `
          <div class="week-section plan-section">
            <div class="section-title">
              <span class="section-icon">📝</span>
              <span class="section-label">训练计划</span>
            </div>
            <div class="plan-content">
              ${planLines.map(line => `<div class="plan-line">${escapeHtml(line)}</div>`).join('')}
            </div>
          </div>
        `;
      }

      let restContent = '';
      if (!hasContent) {
        restContent = `
          <div class="rest-day">
            <span class="rest-icon">😴</span>
            <span class="rest-text">休息日</span>
          </div>
        `;
      }

      return `
        <div class="week-day-card ${isToday ? 'today' : ''} ${hasContent ? 'has-content' : ''}" data-date="${date.toISOString()}">
          <div class="week-card-header">
            <div class="day-info">
              <span class="day-emoji">${dayEmojis[i]}</span>
              <div class="day-text">
                <div class="day-name">${dayNames[i]}</div>
                <div class="day-date">${date.getMonth() + 1}月${date.getDate()}日</div>
              </div>
            </div>
            ${isToday ? '<span class="today-badge">今天</span>' : ''}
          </div>
          <div class="week-card-body">
            ${workoutContent}
            ${planContent}
            ${restContent}
          </div>
        </div>
      `;
    }).join('');

    weekWorkouts.innerHTML = `<div class="week-grid">${html}</div>`;
  };

  // 转义HTML特殊字符以防止XSS
  const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  // 显示训练计划编辑模态框
  const showEditPlanModal = (date) => {
    const dateStr = date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    const trainingPlan = getTrainingPlanForDate(date);
    const dayWorkouts = getWorkoutsForDate(date);

    // 创建模态框
    if (editModal) {
      editModal.remove();
    }

    editModal = document.createElement('div');
    editModal.className = 'modal-overlay';
    editModal.innerHTML = `
      <div class="modal-content training-plan-modal">
        <div class="modal-header">
          <h3>📅 ${escapeHtml(dateStr)}</h3>
          <button class="modal-close" id="close-plan-modal">&times;</button>
        </div>
        <div class="modal-body">
          ${dayWorkouts.length > 0 ? `
            <div class="completed-workouts">
              <h4>✅ 已完成的训练</h4>
              <ul>
                ${dayWorkouts.map(w => `<li>${escapeHtml(w.type || '训练')} - ${w.duration || 0}分钟 - ${w.calories || 0}卡路里</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          <div class="plan-editor">
            <h4>📝 训练计划</h4>
            <textarea
              id="plan-textarea"
              class="plan-textarea"
              placeholder="输入今天的训练计划，例如：&#10;- 胸部训练 3组x12次&#10;- 卧推 4组x10次&#10;- 飞鸟 3组x15次"
              rows="8"
            >${trainingPlan ? escapeHtml(trainingPlan.plan) : ''}</textarea>
            <div class="plan-tips">
              💡 提示：你可以在这里记录计划的训练内容，作为训练提醒
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn ghost" id="delete-plan-btn">删除计划</button>
          <button class="btn primary" id="save-plan-btn">保存计划</button>
        </div>
      </div>
    `;

    document.body.appendChild(editModal);

    // 绑定事件
    const closeModal = () => {
      editModal.classList.remove('show');
      setTimeout(() => {
        editModal.remove();
        editModal = null;
      }, 300);
    };

    document.getElementById('close-plan-modal').addEventListener('click', closeModal);
    editModal.addEventListener('click', (e) => {
      if (e.target === editModal) closeModal();
    });

    document.getElementById('save-plan-btn').addEventListener('click', () => {
      const planText = document.getElementById('plan-textarea').value;
      saveTrainingPlan(date, planText);
      closeModal();
      renderCalendar();
      renderWeekWorkouts();
    });

    document.getElementById('delete-plan-btn').addEventListener('click', async () => {
      const confirmed = await notificationService.confirm({
        title: '确认删除',
        message: '确定要删除这个训练计划吗？',
        confirmText: '确定',
        cancelText: '取消'
      });

      if (confirmed) {
        saveTrainingPlan(date, '');
        closeModal();
        renderCalendar();
        renderWeekWorkouts();
        notificationService.success('训练计划已删除');
      }
    });

    // 显示动画
    setTimeout(() => editModal.classList.add('show'), 10);
  };

  const showWorkoutsForDate = (date) => {
    showEditPlanModal(date);
  };

  const handleExportCalendar = () => {
    const user = authService.currentUser();
    if (!user) { notificationService.warning('请先登录'); return; }
    try {
      calendarService.exportWorkoutCalendar({ filename: 'my-workouts.ics' });
      notificationService.success('日历已导出成功！');
    } catch (error) {
      console.error('导出日历失败:', error);
      notificationService.error('导出日历失败，请稍后再试');
    }
  };

  const initEventListeners = () => {
    eventBus.on(EventNames.WORKOUT_COMPLETED, () => { renderCalendar(); renderWeekWorkouts(); });
  };

  const render = () => { renderCalendar(); renderWeekWorkouts(); };
  const init = () => { render(); initEventListeners(); };

  return { init, render };
})();
