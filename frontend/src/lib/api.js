import { API_BASE_URL } from "./env";
import { clearAuth, getAuth } from "./auth";

async function safeFetch(url, options) {
  try {
    return await fetch(url, options);
  } catch {
    throw new Error("Cannot reach backend API. Start it on http://localhost:8000");
  }
}

async function parseJson(res) {
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    if (res.status === 401) {
      clearAuth();
    }
    const message = data?.detail || data?.message || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function apiGet(path) {
  const auth = getAuth();
  const res = await safeFetch(`${API_BASE_URL}${path}`, {
    headers: auth?.token ? { Authorization: `Bearer ${auth.token}` } : undefined
  });
  return parseJson(res);
}

export async function apiPost(path, body) {
  const auth = getAuth();
  const res = await safeFetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {})
    },
    body: JSON.stringify(body ?? {})
  });
  return parseJson(res);
}

