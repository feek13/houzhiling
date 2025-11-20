const STORAGE_PREFIX = 'fitspark:';

export const storage = {
  get(key, fallback = null) {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw);
    } catch (err) {
      console.error('Failed to parse storage value', err);
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
  },
  remove(key) {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  },
};
