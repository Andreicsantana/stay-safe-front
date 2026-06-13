export const storage = {
  get: (k) => {
    try {
      const v = sessionStorage.getItem(k);
      return v ? JSON.parse(v) : null;
    } catch {
      return null;
    }
  },
  set: (k, v) => {
    try {
      sessionStorage.setItem(k, JSON.stringify(v));
    } catch (e) {
      console.error("Erro ao salvar no sessionStorage:", e);
    }
  },
  remove: (k) => {
    try {
      sessionStorage.removeItem(k);
    } catch (e) {
      console.error("Erro ao remover do sessionStorage:", e);
    }
  },
};
