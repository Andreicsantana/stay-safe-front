export const storage = {
  get: (key) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage quota or private mode
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // storage unavailable
    }
  },
};
