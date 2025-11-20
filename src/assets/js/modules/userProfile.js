import { authService } from '../services/authService.js';
import { storage } from '../services/storage.js';
import { eventBus, EventNames } from '../services/eventBus.js';
import { modal } from './modal.js';
import { createIcon } from '../utils/icons.js';
import { Router } from '../router.js';

const getUserStats = (userId) => {
  // 修复1: 营养记录 - 使用正确的键名 'nutrition' 而不是 'nutritionLogs'
  const nutritionLogs = Array.isArray(storage.get('nutrition', [])) ? storage.get('nutrition', []) : [];

  // 修复2: 签到数据 - 从对象格式读取，而不是数组
  const checkinData = storage.get('checkins', { streak: 0, lastDate: null });
  const currentStreak = typeof checkinData === 'object' && checkinData.streak !== undefined ? checkinData.streak : 0;

  // 修复3: 训练完成记录 - 读取用户的训练完成记录
  const workoutCompletions = Array.isArray(storage.get('workouts', [])) ? storage.get('workouts', []) : [];
  const userCompletions = workoutCompletions.filter((w) => w.userId === userId);

  // 统计训练次数和消耗卡路里
  const totalWorkouts = userCompletions.length;
  const totalCalories = userCompletions.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);

  // 修复4: 徽章系统 - 基于签到连续天数动态计算徽章数量
  const badgeThresholds = [3, 7, 21]; // 对应 "3日火花", "7日连胜", "21日铁粉"
  const totalBadges = badgeThresholds.filter(threshold => currentStreak >= threshold).length;

  // 好友数据保持不变
  const friendships = storage.get('friendships', []);
  const friends = Array.isArray(friendships) ? friendships.filter(
    (f) => f.userId === userId && f.status === 'accepted'
  ) : [];

  return {
    totalWorkouts,
    totalNutritionLogs: nutritionLogs.length,
    currentStreak,
    totalBadges,
    totalFriends: friends.length,
    totalCalories,
  };
};

const createElement = (tag, className, textContent) => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (textContent) el.textContent = textContent;
  return el;
};

const renderPasswordChangeForm = (user) => {
  const form = createElement('form', 'password-change-form');

  const title = createElement('h3', '', '修改密码');
  form.appendChild(title);

  const currentPasswordLabel = createElement('label', '', '当前密码');
  const currentPasswordInput = createElement('input');
  currentPasswordInput.type = 'password';
  currentPasswordInput.name = 'currentPassword';
  currentPasswordInput.placeholder = '当前密码';
  currentPasswordInput.required = true;
  currentPasswordLabel.appendChild(currentPasswordInput);
  form.appendChild(currentPasswordLabel);

  const newPasswordLabel = createElement('label', '', '新密码');
  const newPasswordInput = createElement('input');
  newPasswordInput.type = 'password';
  newPasswordInput.name = 'newPassword';
  newPasswordInput.placeholder = '新密码（至少8位，含字母和数字）';
  newPasswordInput.required = true;
  newPasswordInput.minLength = 8;
  newPasswordLabel.appendChild(newPasswordInput);
  form.appendChild(newPasswordLabel);

  const confirmPasswordLabel = createElement('label', '', '确认新密码');
  const confirmPasswordInput = createElement('input');
  confirmPasswordInput.type = 'password';
  confirmPasswordInput.name = 'confirmPassword';
  confirmPasswordInput.placeholder = '确认新密码';
  confirmPasswordInput.required = true;
  confirmPasswordLabel.appendChild(confirmPasswordInput);
  form.appendChild(confirmPasswordLabel);

  const errorBox = createElement('p', 'error-box');
  form.appendChild(errorBox);

  const submitBtn = createElement('button', 'btn primary', '确认修改');
  submitBtn.type = 'submit';
  form.appendChild(submitBtn);

  form.addEventListener('submit', async (evt) => {
    evt.preventDefault();
    errorBox.textContent = '';
    submitBtn.disabled = true;

    try {
      const currentPassword = currentPasswordInput.value;
      const newPassword = newPasswordInput.value;
      const confirmPassword = confirmPasswordInput.value;

      if (newPassword !== confirmPassword) {
        throw new Error('两次输入的新密码不一致');
      }

      await authService.changePassword({
        email: user.email,
        currentPassword,
        newPassword,
      });

      errorBox.style.color = 'var(--accent)';
      errorBox.textContent = '密码修改成功！';
      setTimeout(() => modal.close(), 1500);
    } catch (err) {
      errorBox.style.color = 'var(--accent-2)';
      errorBox.textContent = err.message || '修改失败';
    } finally {
      submitBtn.disabled = false;
    }
  });

  return form;
};

const renderAvatar = (user) => {
  const avatarContainer = createElement('div', 'user-avatar-container');

  if (user.avatar) {
    // 如果有自定义头像，显示图片
    const avatarImg = createElement('img', 'user-avatar-img');
    avatarImg.src = user.avatar;
    avatarImg.alt = user.nickname || user.email;
    avatarContainer.appendChild(avatarImg);
  } else {
    // 否则显示昵称首字母
    const avatar = createElement('div', 'user-avatar');
    const initial = (user.nickname || user.email).charAt(0).toUpperCase();
    avatar.textContent = initial;
    avatarContainer.appendChild(avatar);
  }

  // 添加上传按钮（仅自己的资料页）
  const uploadBtn = createElement('button', 'avatar-upload-btn');
  uploadBtn.textContent = '📷';
  uploadBtn.title = '上传头像';
  uploadBtn.onclick = () => handleAvatarUpload(user);
  avatarContainer.appendChild(uploadBtn);

  return avatarContainer;
};

// 处理头像上传
const handleAvatarUpload = async (user) => {
  // 创建文件输入
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';

  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 验证文件大小（限制 2MB）
    if (file.size > 2 * 1024 * 1024) {
      alert('图片大小不能超过 2MB');
      return;
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    // 读取文件并转为 base64
    const reader = new FileReader();
    reader.onload = async (event) => {
      const avatarData = event.target.result;

      // 更新用户头像
      const result = authService.updateUserProfile({ avatar: avatarData });
      if (result.success) {
        // 刷新页面显示
        location.reload();
      } else {
        alert(result.error || '上传失败，请重试');
      }
    };

    reader.onerror = () => {
      alert('读取文件失败，请重试');
    };

    reader.readAsDataURL(file);
  };

  input.click();
};

const createStatCard = (iconName, value, label) => {
  const card = createElement('div', 'stat-card glass');
  const iconDiv = createElement('div', 'stat-icon');

  // 使用 SVG 图标
  const svgIcon = createIcon(iconName);
  iconDiv.appendChild(svgIcon);

  const content = createElement('div', 'stat-content');
  const valueDiv = createElement('div', 'stat-value', String(value));
  const labelDiv = createElement('div', 'stat-label', label);
  content.appendChild(valueDiv);
  content.appendChild(labelDiv);
  card.appendChild(iconDiv);
  card.appendChild(content);
  return card;
};

const renderProfile = (container, user) => {
  container.innerHTML = '';

  if (!user) {
    const emptyDiv = createElement('div', 'profile-empty');
    const message = createElement('p', '', '请先登录查看个人资料');
    const loginBtn = createElement('button', 'btn primary', '立即登录');
    loginBtn.id = 'login-from-profile';
    loginBtn.addEventListener('click', () => {
      Router.push('/auth');
    });
    emptyDiv.appendChild(message);
    emptyDiv.appendChild(loginBtn);
    container.appendChild(emptyDiv);
    return;
  }

  const stats = getUserStats(user.id);
  const joinDate = new Date(user.createdAt).toLocaleDateString('zh-CN');

  // Profile Header
  const header = createElement('div', 'profile-header');

  const headerLeft = createElement('div', 'profile-header-left');
  const avatarContainer = createElement('div');
  avatarContainer.id = 'avatar-container';
  avatarContainer.appendChild(renderAvatar(user));

  const basicInfo = createElement('div', 'profile-basic-info');
  const nameH2 = createElement('h2', '', user.nickname || '未设置昵称');
  const emailP = createElement('p', 'muted', user.email);
  const joinDateP = createElement('p', 'muted', `加入于 ${joinDate}`);
  basicInfo.appendChild(nameH2);
  basicInfo.appendChild(emailP);
  basicInfo.appendChild(joinDateP);

  headerLeft.appendChild(avatarContainer);
  headerLeft.appendChild(basicInfo);

  const headerActions = createElement('div', 'profile-header-actions');
  const changePasswordBtn = createElement('button', 'btn ghost', '修改密码');
  changePasswordBtn.id = 'change-password-btn';
  const logoutBtn = createElement('button', 'btn ghost', '退出登录');
  logoutBtn.id = 'logout-btn';
  headerActions.appendChild(changePasswordBtn);
  headerActions.appendChild(logoutBtn);

  header.appendChild(headerLeft);
  header.appendChild(headerActions);
  container.appendChild(header);

  // Stats Grid
  const statsGrid = createElement('div', 'profile-stats-grid');
  statsGrid.appendChild(createStatCard('dumbbell', stats.totalWorkouts, '完成训练'));
  statsGrid.appendChild(createStatCard('flame', stats.currentStreak, '连续签到'));
  statsGrid.appendChild(createStatCard('apple', stats.totalNutritionLogs, '营养记录'));
  statsGrid.appendChild(createStatCard('bolt', Math.round(stats.totalCalories), '消耗卡路里'));
  statsGrid.appendChild(createStatCard('medal', stats.totalBadges, '获得徽章'));
  statsGrid.appendChild(createStatCard('users', stats.totalFriends, '健身好友'));
  container.appendChild(statsGrid);

  // Achievements Section
  const achievementsDiv = createElement('div', 'profile-achievements');
  const achievementsTitle = createElement('h3', '', '我的成就');
  const badgesContainer = createElement('div', 'badges-grid');
  badgesContainer.id = 'badges-container';
  achievementsDiv.appendChild(achievementsTitle);
  achievementsDiv.appendChild(badgesContainer);
  container.appendChild(achievementsDiv);

  // Settings Section
  const settingsDiv = createElement('div', 'profile-settings');
  const settingsTitle = createElement('h3', '', '账户设置');
  const settingsList = createElement('div', 'settings-list');

  // Setting Item 1
  const settingItem1 = createElement('div', 'setting-item');
  const settingInfo1 = createElement('div');
  const settingTitle1 = createElement('h4', '', '个人信息');
  const settingDesc1 = createElement('p', 'muted', '在"身体数据"页面更新你的训练偏好和目标');
  settingInfo1.appendChild(settingTitle1);
  settingInfo1.appendChild(settingDesc1);
  const goToProfileBtn = createElement('button', 'btn ghost', '前往编辑');
  goToProfileBtn.id = 'go-to-profile-page';
  settingItem1.appendChild(settingInfo1);
  settingItem1.appendChild(goToProfileBtn);

  // Setting Item 2
  const settingItem2 = createElement('div', 'setting-item');
  const settingInfo2 = createElement('div');
  const settingTitle2 = createElement('h4', '', '隐私设置');
  const settingDesc2 = createElement('p', 'muted', '控制你的训练数据对好友的可见性');
  settingInfo2.appendChild(settingTitle2);
  settingInfo2.appendChild(settingDesc2);

  const toggleLabel = createElement('label', 'toggle-switch');
  const toggleInput = createElement('input');
  toggleInput.type = 'checkbox';
  toggleInput.id = 'privacy-toggle';
  toggleInput.checked = storage.get('privacySettings', {}).showWorkouts !== false;
  const toggleSlider = createElement('span', 'toggle-slider');
  toggleLabel.appendChild(toggleInput);
  toggleLabel.appendChild(toggleSlider);

  settingItem2.appendChild(settingInfo2);
  settingItem2.appendChild(toggleLabel);

  settingsList.appendChild(settingItem1);
  settingsList.appendChild(settingItem2);
  settingsDiv.appendChild(settingsTitle);
  settingsDiv.appendChild(settingsList);
  container.appendChild(settingsDiv);

  // Event Listeners
  changePasswordBtn.addEventListener('click', () => {
    modal.open(() => renderPasswordChangeForm(user));
  });

  logoutBtn.addEventListener('click', () => {
    authService.logout();
    eventBus.emit(EventNames.AUTH_LOGOUT);
    Router.push('/auth');
  });

  goToProfileBtn.addEventListener('click', () => {
    Router.push('/personal/health');
  });

  toggleInput.addEventListener('change', (e) => {
    const settings = storage.get('privacySettings', {});
    settings.showWorkouts = e.target.checked;
    storage.set('privacySettings', settings);
  });

  // Render Badges
  const badgesList = storage.get('badges', []);
  const badges = Array.isArray(badgesList) ? badgesList.filter((b) => b.userId === user.id) : [];

  if (badges.length === 0) {
    const emptyMessage = createElement('p', 'muted', '还没有获得徽章，完成更多训练来解锁吧！');
    badgesContainer.appendChild(emptyMessage);
  } else {
    badges.forEach((badge) => {
      const badgeCard = createElement('div', 'badge-card');
      const badgeIcon = createElement('div', 'badge-icon', badge.icon || '🏆');
      const badgeName = createElement('div', 'badge-name', badge.name);
      const badgeDesc = createElement('div', 'badge-description muted', badge.description || '');
      badgeCard.appendChild(badgeIcon);
      badgeCard.appendChild(badgeName);
      badgeCard.appendChild(badgeDesc);
      badgesContainer.appendChild(badgeCard);
    });
  }
};

export const userProfileModule = (() => {
  let container;

  const init = () => {
    container = document.getElementById('user-profile-container');
    if (!container) return;

    const user = authService.currentUser();
    renderProfile(container, user);

    // 监听登录/登出事件
    eventBus.on(EventNames.AUTH_LOGIN, () => {
      const user = authService.currentUser();
      renderProfile(container, user);
    });

    eventBus.on(EventNames.AUTH_LOGOUT, () => {
      renderProfile(container, null);
    });

    // 监听训练完成、签到等事件，更新统计
    eventBus.on(EventNames.WORKOUT_COMPLETED, () => {
      const user = authService.currentUser();
      if (user && container) {
        renderProfile(container, user);
      }
    });

    eventBus.on(EventNames.CHECKIN_SUCCESS, () => {
      const user = authService.currentUser();
      if (user && container) {
        renderProfile(container, user);
      }
    });
  };

  return { init };
})();
