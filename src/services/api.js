export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001/api";
export const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:3001/ws";

async function request(method, path, body, token) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const err = new Error(data?.error || `Erro na requisição (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  post: (path, body, token) => request("POST", path, body, token),
  get: (path, token) => request("GET", path, undefined, token),
  patch: (path, body, token) => request("PATCH", path, body, token),
  delete: (path, body, token) => request("DELETE", path, body, token),
};
