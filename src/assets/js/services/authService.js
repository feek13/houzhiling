import { storage } from './storage.js';
import { eventBus, EventNames } from './eventBus.js';

const USERS_KEY = 'users';
const SESSION_KEY = 'session';
const ATTEMPTS_KEY = 'auth_attempts';
const RESETS_KEY = 'password_resets';

const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_ATTEMPTS = 5;

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

const hash = async (input) => {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

const validatePassword = (password) => {
  if (!password || password.length < 8) return false;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  return hasLetter && hasNumber;
};

const recordAttempt = (success) => {
  const attempts = storage.get(ATTEMPTS_KEY, []);
  const now = Date.now();
  const filtered = attempts.filter((item) => now - item.time < RATE_LIMIT_WINDOW);
  if (!success) {
    filtered.push({ time: now });
  }
  storage.set(ATTEMPTS_KEY, filtered);
  if (success) {
    storage.set(ATTEMPTS_KEY, []);
  }
};

const isBlocked = () => {
  const attempts = storage.get(ATTEMPTS_KEY, []);
  const now = Date.now();
  const recent = attempts.filter((item) => now - item.time < RATE_LIMIT_WINDOW);
  storage.set(ATTEMPTS_KEY, recent);
  return recent.length >= MAX_ATTEMPTS;
};

export const authService = {
  async register({ email, password, nickname }) {
    await delay();
    const users = storage.get(USERS_KEY, []);
    if (users.find((u) => u.email === email)) {
      throw new Error('邮箱已存在');
    }
    if (!validatePassword(password)) {
      throw new Error('密码需至少 8 位，且包含字母和数字');
    }
    const passwordHash = await hash(password);
    const profile = {
      id: crypto.randomUUID(),
      email,
      nickname,
      passwordHash,
      createdAt: new Date().toISOString(),
      profile: null,
    };
    users.push(profile);
    storage.set(USERS_KEY, users);
    storage.set(SESSION_KEY, { userId: profile.id });

    // Emit register and login events
    eventBus.emit(EventNames.AUTH_REGISTER, { user: profile });
    eventBus.emit(EventNames.AUTH_LOGIN, { user: profile });

    return profile;
  },

  async login({ email, password }) {
    await delay();
    if (isBlocked()) {
      throw new Error('多次尝试失败，请稍后重试');
    }
    const users = storage.get(USERS_KEY, []);
    const target = users.find((u) => u.email === email);
    if (!target) throw new Error('用户不存在');
    const passwordHash = await hash(password);
    if (target.passwordHash !== passwordHash) {
      recordAttempt(false);
      throw new Error('密码错误');
    }
    storage.set(SESSION_KEY, { userId: target.id });
    recordAttempt(true);

    // Emit login event
    eventBus.emit(EventNames.AUTH_LOGIN, { user: target });

    return target;
  },

  logout() {
    const user = this.currentUser();
    storage.remove(SESSION_KEY);

    // Emit logout event
    if (user) {
      eventBus.emit(EventNames.AUTH_LOGOUT, { user });
    }
  },

  currentUser() {
    const session = storage.get(SESSION_KEY);
    if (!session) return null;
    const users = storage.get(USERS_KEY, []);
    return users.find((u) => u.id === session.userId) || null;
  },

  updateProfile(userId, profileData) {
    const users = storage.get(USERS_KEY, []);
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return null;
    const nextProfile = { ...users[idx].profile, ...profileData };
    users[idx].profile = nextProfile;
    if (!users[idx].metricsHistory) users[idx].metricsHistory = [];
    if (profileData.height && profileData.weight) {
      const entry = {
        date: new Date().toISOString(),
        height: profileData.height,
        weight: profileData.weight,
        bmi: +(profileData.weight / Math.pow(profileData.height / 100, 2)).toFixed(2),
      };
      users[idx].metricsHistory.push(entry);
      users[idx].metricsHistory = users[idx].metricsHistory.slice(-12);
    }
    storage.set(USERS_KEY, users);
    return users[idx];
  },

  updateUserProfile(updates) {
    const currentUser = this.currentUser();
    if (!currentUser) {
      return { success: false, error: '请先登录' };
    }

    const users = storage.get(USERS_KEY, []);
    const idx = users.findIndex((u) => u.id === currentUser.id);
    if (idx === -1) {
      return { success: false, error: '用户不存在' };
    }

    // 更新用户信息（头像、昵称等）
    if (updates.avatar !== undefined) {
      users[idx].avatar = updates.avatar;
    }
    if (updates.nickname !== undefined) {
      users[idx].nickname = updates.nickname;
    }
    if (updates.bio !== undefined) {
      users[idx].bio = updates.bio;
    }

    storage.set(USERS_KEY, users);

    // 更新 session
    storage.set(SESSION_KEY, { userId: users[idx].id });

    return { success: true, user: users[idx] };
  },

  requestPasswordReset(email) {
    const users = storage.get(USERS_KEY, []);
    const target = users.find((u) => u.email === email);
    if (!target) throw new Error('邮箱未注册');
    const resets = storage.get(RESETS_KEY, []);
    resets.push({ id: crypto.randomUUID(), email, createdAt: new Date().toISOString() });
    storage.set(RESETS_KEY, resets);
    return true;
  },

  async changePassword({ email, currentPassword, newPassword }) {
    await delay();
    const users = storage.get(USERS_KEY, []);
    const target = users.find((u) => u.email === email);
    if (!target) throw new Error('用户不存在');

    const currentPasswordHash = await hash(currentPassword);
    if (target.passwordHash !== currentPasswordHash) {
      throw new Error('当前密码错误');
    }

    if (!validatePassword(newPassword)) {
      throw new Error('新密码需至少 8 位，且包含字母和数字');
    }

    const newPasswordHash = await hash(newPassword);
    target.passwordHash = newPasswordHash;
    storage.set(USERS_KEY, users);
    return true;
  },
};
