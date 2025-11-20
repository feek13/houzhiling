/**
 * workouts.js - 训练课程模块（安全版本：使用DOM API避免XSS）
 * 注意：所有用户输入已在workoutService层通过sanitizeHTML清理
 */

import { workoutService } from '../services/workoutService.js';
import { authService } from '../services/authService.js';
import { eventBus, EventNames } from '../services/eventBus.js';
import { modal } from './modal.js';
import { storage } from '../services/storage.js';
import { notificationService } from '../services/notificationService.js';

export const workoutModule = (() => {
  // DOM元素引用
  let elements = {};
  const PLAN_KEY = 'training_plan';

  /**
   * 初始化DOM元素引用
   */
  const initElements = () => {
    elements = {
      grid: document.getElementById('workout-grid'),
      muscleFilter: document.getElementById('filter-muscle'),
      levelFilter: document.getElementById('filter-level'),
      equipmentFilter: document.getElementById('filter-equipment'),
      durationFilter: document.getElementById('filter-duration'),
      searchInput: document.getElementById('filter-search'),
      sourceFilter: document.getElementById('filter-source'),
      sortSelect: document.getElementById('sort-select'),
      createBtn: document.getElementById('create-workout-btn'),
      planForm: document.getElementById('plan-form'),
      planResult: document.getElementById('plan-result')
    };
  };

  /**
   * 创建课程卡片（使用DOM API）
   */
  const createWorkoutCard = (workout) => {
    const card = document.createElement('article');
    card.className = 'workout-card';
    card.dataset.id = workout.id;

    // 创建头部
    const header = document.createElement('header');
    header.className = 'workout-card-header';

    const levelBadge = document.createElement('span');
    levelBadge.className = `badge ${workout.levelKey}`;
    levelBadge.textContent = workout.level;
    header.appendChild(levelBadge);

    if (workout.isOfficial) {
      const officialBadge = document.createElement('span');
      officialBadge.className = 'badge official';
      officialBadge.textContent = '官方';
      header.appendChild(officialBadge);
    }

    card.appendChild(header);

    // 创建主体
    const body = document.createElement('div');
    body.className = 'workout-card-body';

    const title = document.createElement('h3');
    title.textContent = workout.title;
    body.appendChild(title);

    const desc = document.createElement('p');
    desc.className = 'muted';
    desc.textContent = workout.description;
    body.appendChild(desc);

    // 元数据
    const meta = document.createElement('div');
    meta.className = 'workout-meta';

    const metaItems = [
      `🎯 ${workout.muscle}`,
      `⚙️ ${workout.equipment}`,
      `⏱️ ${workout.duration}`
    ];

    metaItems.forEach(text => {
      const span = document.createElement('span');
      span.textContent = text;
      meta.appendChild(span);
    });

    body.appendChild(meta);

    // 作者信息
    const author = document.createElement('div');
    author.className = 'workout-author';
    const authorSpan = document.createElement('span');
    authorSpan.className = 'author-name';
    authorSpan.textContent = `👤 ${workout.authorName}`;
    author.appendChild(authorSpan);
    body.appendChild(author);

    // 统计数据
    const stats = document.createElement('div');
    stats.className = 'workout-stats';

    const statsData = [
      { icon: '👁️', value: workout.views || 0, title: '浏览量' },
      { icon: '❤️', value: workout.likes || 0, title: '点赞数' },
      { icon: '⭐', value: workout.favorites || 0, title: '收藏数' },
      { icon: '✅', value: workout.completions || 0, title: '完成次数' }
    ];

    if (workout.comments && workout.comments.length > 0) {
      statsData.push({ icon: '💬', value: workout.comments.length, title: '评论数' });
    }

    statsData.forEach(stat => {
      const span = document.createElement('span');
      span.title = stat.title;
      span.textContent = `${stat.icon} ${stat.value}`;
      stats.appendChild(span);
    });

    body.appendChild(stats);
    card.appendChild(body);

    // 创建底部按钮
    const footer = document.createElement('footer');
    footer.className = 'workout-card-footer';

    const currentUser = authService.currentUser();
    const isAuthor = currentUser && workout.userId === currentUser.id;

    const viewBtn = document.createElement('button');
    viewBtn.className = 'btn small';
    viewBtn.textContent = '查看详情';
    viewBtn.dataset.action = 'view';
    footer.appendChild(viewBtn);

    if (isAuthor) {
      const editBtn = document.createElement('button');
      editBtn.className = 'btn small secondary';
      editBtn.textContent = '编辑';
      editBtn.dataset.action = 'edit';
      footer.appendChild(editBtn);

      const delBtn = document.createElement('button');
      delBtn.className = 'btn small danger';
      delBtn.textContent = '删除';
      delBtn.dataset.action = 'delete';
      footer.appendChild(delBtn);
    }

    card.appendChild(footer);
    return card;
  };

  /**
   * 渲染课程列表
   */
  const render = () => {
    if (!elements.grid) return;

    // 清空网格
    while (elements.grid.firstChild) {
      elements.grid.removeChild(elements.grid.firstChild);
    }

    // 获取筛选条件
    const filters = {
      source: elements.sourceFilter?.value || 'all'
    };

    let workouts = workoutService.getAllWorkouts(filters);

    // 应用其他筛选
    const muscle = elements.muscleFilter?.value ?? 'all';
    const level = elements.levelFilter?.value ?? 'all';
    const equipment = elements.equipmentFilter?.value ?? 'all';
    const duration = elements.durationFilter?.value ?? 'all';
    const keyword = (elements.searchInput?.value || '').trim().toLowerCase();

    workouts = workouts.filter((item) => {
      const muscleMatch = muscle === 'all' || item.muscleKey === muscle;
      const levelMatch = level === 'all' || item.levelKey === level;
      const equipmentMatch = equipment === 'all' || item.equipmentKey === equipment;
      const durationMatch = duration === 'all' || item.durationKey === duration;
      const keywordMatch =
        !keyword ||
        item.title.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword);
      return muscleMatch && levelMatch && equipmentMatch && durationMatch && keywordMatch;
    });

    // 应用排序
    const sortType = elements.sortSelect?.value || 'latest';
    workouts = sortWorkouts(workouts, sortType);

    // 渲染
    if (workouts.length === 0) {
      const emptyMsg = document.createElement('p');
      emptyMsg.className = 'muted';
      emptyMsg.style.cssText = 'grid-column: 1/-1; text-align: center; padding: 40px;';
      emptyMsg.textContent = '没有找到符合条件的课程';
      elements.grid.appendChild(emptyMsg);
      return;
    }

    workouts.forEach((workout) => {
      const card = createWorkoutCard(workout);
      elements.grid.appendChild(card);
    });
  };

  /**
   * 排序课程
   */
  const sortWorkouts = (workouts, sortType) => {
    const sorted = [...workouts];

    switch (sortType) {
      case 'latest':
        sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'popular':
        sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case 'mostLiked':
        sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
      case 'mostFavorited':
        sorted.sort((a, b) => (b.favorites || 0) - (a.favorites || 0));
        break;
    }

    return sorted;
  };

  /**
   * 显示课程详情（简化版）
   */
  /**
   * 显示课程详情（优化版）
   */
  const showDetail = (workout) => {
    workoutService.incrementViews(workout.id);

    const container = document.createElement('div');
    container.className = 'workout-detail-container';

    // 1. 头部区域
    const header = document.createElement('div');
    header.className = 'workout-detail-header';

    const title = document.createElement('h2');
    title.className = 'workout-detail-title';
    title.textContent = workout.title;
    header.appendChild(title);

    const badges = document.createElement('div');
    badges.className = 'workout-detail-badges';

    // 难度徽章
    const levelBadge = document.createElement('span');
    levelBadge.className = `badge ${workout.levelKey}`;
    levelBadge.textContent = workout.level;
    badges.appendChild(levelBadge);

    // 官方徽章
    if (workout.isOfficial) {
      const officialBadge = document.createElement('span');
      officialBadge.className = 'badge official';
      officialBadge.textContent = '官方认证';
      badges.appendChild(officialBadge);
    }

    header.appendChild(badges);

    const desc = document.createElement('p');
    desc.className = 'workout-detail-desc';
    desc.textContent = workout.description;
    header.appendChild(desc);

    container.appendChild(header);

    // 2. 信息网格
    const grid = document.createElement('div');
    grid.className = 'workout-detail-grid';

    const icons = {
      muscle: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19.5 12c0-1.1-.9-2-2-2H16v-2c0-2.76-2.24-5-5-5S6 5.24 6 8v2H4.5c-1.1 0-2 .9-2 2s.9 2 2 2h.5c.6 0 1.14.27 1.5.7l1.1 1.36c.35.43.28 1.06-.15 1.41-.43.35-1.06.28-1.41-.15l-1.1-1.36C4.27 17.16 3.5 16.5 3.5 15.5c0-.83.67-1.5 1.5-1.5h.5V8c0-3.03 2.47-5.5 5.5-5.5S16.5 4.97 16.5 8v6h.5c.83 0 1.5.67 1.5 1.5 0 1-.77 1.66-1.44 2.46l-1.1 1.36c-.35.43-.28 1.06.15 1.41.43.35 1.06.28 1.41-.15l1.1-1.36c.36-.43.9-1.1 1.38-1.72zM11 8c0-.55.45-1 1-1s1 .45 1 1-.45 1-1 1-1-.45-1-1z"/></svg>`,
      equipment: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20.5 11H19V8c0-1.1-.9-2-2-2h-1.5V5c0-1.1-.9-2-2-2h-3c-1.1 0-2 .9-2 2v1H7c-1.1 0-2 .9-2 2v3H3.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5H5v3c0 1.1.9 2 2 2h1.5v1c0 1.1.9 2 2 2h3c1.1 0 2-.9 2-2v-1H17c1.1 0 2-.9 2-2v-3h1.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5zM7 17v-6h10v6H7z"/></svg>`,
      duration: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>`,
      calories: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/></svg>`
    };

    const stats = [
      { icon: icons.muscle, label: '训练部位', value: workout.muscle },
      { icon: icons.equipment, label: '所需器械', value: workout.equipment },
      { icon: icons.duration, label: '预计时长', value: workout.duration },
      { icon: icons.calories, label: '消耗热量', value: `${workout.calories || '---'} 千卡` }
    ];

    stats.forEach(stat => {
      const box = document.createElement('div');
      box.className = 'workout-stat-box';

      const icon = document.createElement('div');
      icon.className = 'workout-stat-icon';
      icon.innerHTML = stat.icon; // 使用 innerHTML 渲染 SVG

      const label = document.createElement('div');
      label.className = 'workout-stat-label';
      label.textContent = stat.label;

      const value = document.createElement('div');
      value.className = 'workout-stat-value';
      value.textContent = stat.value;

      box.appendChild(icon);
      box.appendChild(label);
      box.appendChild(value);
      grid.appendChild(box);
    });

    container.appendChild(grid);

    // 3. 训练步骤
    const stepsSection = document.createElement('div');
    stepsSection.className = 'workout-steps-section';

    const stepsTitle = document.createElement('h3');
    stepsTitle.className = 'workout-steps-title';
    stepsTitle.innerHTML = '<i class="fas fa-list-ol"></i> 训练步骤';
    stepsSection.appendChild(stepsTitle);

    const timeline = document.createElement('div');
    timeline.className = 'workout-steps-timeline';

    workout.steps.forEach((step, index) => {
      const item = document.createElement('div');
      item.className = 'workout-step-item';

      const marker = document.createElement('div');
      marker.className = 'workout-step-marker';
      item.appendChild(marker);

      const content = document.createElement('div');
      content.className = 'workout-step-content';

      const number = document.createElement('span');
      number.className = 'workout-step-number';
      number.textContent = `STEP ${index + 1}`;
      content.appendChild(number);

      const text = document.createElement('div');
      text.className = 'workout-step-text';
      text.textContent = step;
      content.appendChild(text);

      item.appendChild(content);
      timeline.appendChild(item);
    });

    stepsSection.appendChild(timeline);
    container.appendChild(stepsSection);

    // 4. 底部按钮
    const footer = document.createElement('div');
    footer.className = 'workout-detail-footer';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn ghost';
    cancelBtn.textContent = '关闭';
    cancelBtn.onclick = () => modal.close();

    const startBtn = document.createElement('button');
    startBtn.className = 'btn primary';
    const playIcon = document.createElement('i');
    playIcon.className = 'fas fa-play';
    startBtn.appendChild(playIcon);
    startBtn.appendChild(document.createTextNode(' 开始训练'));
    startBtn.onclick = () => {
      const currentUser = authService.currentUser();
      if (!currentUser) {
        notificationService.warning('请先登录后再开始训练');
        modal.close();
        return;
      }

      // 增加课程完成次数统计
      workoutService.incrementCompletions(workout.id);

      // 保存用户训练完成记录
      const completions = storage.get('workouts', []);
      const completionRecord = {
        id: crypto.randomUUID(),
        userId: currentUser.id,
        workoutId: workout.id,
        workoutTitle: workout.title,
        caloriesBurned: workout.calories || 0,
        duration: workout.duration || '',
        completedAt: new Date().toISOString()
      };
      completions.push(completionRecord);
      storage.set('workouts', completions);

      // 触发训练完成事件
      eventBus.emit(EventNames.WORKOUT_COMPLETED, completionRecord);

      modal.close();
      notificationService.success(`开始训练：${workout.title}`);
    };

    footer.appendChild(cancelBtn);
    footer.appendChild(startBtn);
    container.appendChild(footer);

    modal.open(() => container);
  };

  /**
   * 处理创建课程
   */
  const showCreateForm = async () => {
    const currentUser = authService.currentUser();
    if (!currentUser) {
      notificationService.warning('请先登录后再发布课程');
      return;
    }

    // 动态导入课程创建模块
    const { courseCreator } = await import('./courseCreator.js');
    courseCreator.open();
  };

  /**
   * 处理编辑课程
   */
  const showEditForm = async (workout) => {
    // 动态导入课程编辑模块
    const { courseEditor } = await import('./courseEditor.js');
    courseEditor.open(workout);
  };

  /**
   * 生成训练计划
   */
  const generatePlan = (formData) => {
    const days = Number(formData.planDays);
    const goal = formData.planGoal;
    const intensity = formData.planIntensity; // 获取用户选择的强度偏好

    const workouts = workoutService.getAllWorkouts();

    // 优先筛选:同时匹配目标和难度
    let pool = workouts.filter(
      (item) => item.goalFocus === goal && item.levelKey === intensity && item.status === 'published'
    );

    // 如果没有完全匹配的课程,放宽条件只匹配难度
    if (pool.length < days) {
      pool = workouts.filter(
        (item) => item.levelKey === intensity && item.status === 'published'
      );
    }

    // 如果还是不够,只匹配目标
    if (pool.length < days) {
      pool = workouts.filter(
        (item) => item.goalFocus === goal && item.status === 'published'
      );
    }

    // 最后的兜底:使用所有已发布课程
    if (pool.length === 0) {
      pool = workouts.filter((item) => item.status === 'published');
    }

    const chosen = [];
    for (let i = 0; i < days; i++) {
      const pick = pool[i % pool.length] || workouts[i % workouts.length];
      if (pick) chosen.push(pick);
    }

    storage.set(PLAN_KEY, { chosen, goal, intensity, generatedAt: new Date().toISOString() });
    renderPlan(chosen);
  };

  /**
   * 渲染训练计划
   */
  const renderPlan = (list) => {
    if (!elements.planResult) return;

    // 清空
    while (elements.planResult.firstChild) {
      elements.planResult.removeChild(elements.planResult.firstChild);
    }

    if (!list || !list.length) {
      const emptyMsg = document.createElement('p');
      emptyMsg.className = 'muted';
      emptyMsg.textContent = '尚未生成计划。';
      elements.planResult.appendChild(emptyMsg);
      return;
    }

    list.forEach((item, index) => {
      const article = document.createElement('article');
      article.className = 'plan-day';

      const header = document.createElement('header');
      const daySpan = document.createElement('span');
      daySpan.textContent = `Day ${index + 1}`;
      const titleStrong = document.createElement('strong');
      titleStrong.textContent = item.title;
      header.appendChild(daySpan);
      header.appendChild(titleStrong);
      article.appendChild(header);

      const descP = document.createElement('p');
      descP.textContent = item.description;
      article.appendChild(descP);

      const metaP = document.createElement('p');
      metaP.className = 'muted';
      metaP.textContent = `${item.duration} · ${item.level}`;
      article.appendChild(metaP);

      elements.planResult.appendChild(article);
    });
  };

  /**
   * 绑定事件监听器
   */
  const bindEvents = () => {
    // 筛选器
    elements.muscleFilter?.addEventListener('change', render);
    elements.levelFilter?.addEventListener('change', render);
    elements.equipmentFilter?.addEventListener('change', render);
    elements.durationFilter?.addEventListener('change', render);
    elements.sourceFilter?.addEventListener('change', render);
    elements.sortSelect?.addEventListener('change', render);

    // 搜索（防抖）
    if (elements.searchInput) {
      elements.searchInput.addEventListener('input', () => {
        clearTimeout(elements.searchInput._timer);
        elements.searchInput._timer = setTimeout(render, 200);
      });
    }

    // 创建按钮
    elements.createBtn?.addEventListener('click', showCreateForm);

    // 卡片点击（事件委托）
    elements.grid?.addEventListener('click', (evt) => {
      const card = evt.target.closest('.workout-card');
      if (!card) return;

      const id = card.dataset.id;
      const workout = workoutService.getWorkoutById(id);
      if (!workout) return;

      const action = evt.target.dataset.action;

      if (action === 'view') {
        showDetail(workout);
      } else if (action === 'edit') {
        showEditForm(workout);
      } else if (action === 'delete') {
        notificationService.confirm({
          title: '确认删除',
          message: '确定要删除此课程吗？',
          confirmText: '确定',
          cancelText: '取消',
          onConfirm: () => {
            try {
              workoutService.deleteWorkout(id);
              render();
              notificationService.success('课程已删除');
            } catch (error) {
              notificationService.error(error.message);
            }
          }
        });
      }
    });

    // 计划表单
    elements.planForm?.addEventListener('submit', (evt) => {
      evt.preventDefault();
      const data = Object.fromEntries(new FormData(elements.planForm));
      generatePlan(data);
    });

    // 监听事件总线
    eventBus.on(EventNames.COURSE_CREATED, render);
    eventBus.on(EventNames.COURSE_UPDATED, render);
    eventBus.on(EventNames.COURSE_DELETED, render);
  };

  /**
   * 初始化模块
   */
  const init = () => {
    initElements();
    bindEvents();

    // 加载保存的计划
    const saved = storage.get(PLAN_KEY);
    if (saved?.chosen) {
      renderPlan(saved.chosen);
    }

    // 初始渲染
    render();
  };

  return { init };
})();
