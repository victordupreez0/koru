// Base URL for the authentication endpoints exposed by the ASP.NET backend
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5299/api";

// Shared response handler – unwraps JSON and surfaces backend error messages
async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
}

// POST /api/User/register – create a standard email/password account
export async function registerUser(payload) {
  const res = await fetch(`${API_BASE}/User/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return handleResponse(res);
}

// POST /api/User/login – sign an existing user into the platform
export async function loginUser(payload) {
  const res = await fetch(`${API_BASE}/User/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return handleResponse(res);
}

// POST /api/User/google – exchange a Google credential for an app session
export async function loginWithGoogle(credential, role = "student") {
  const res = await fetch(`${API_BASE}/User/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential, role }),
  });

  return handleResponse(res);
}

// Persist the authenticated user locally so the app can reuse the session later
export function saveAuthSession(data) {
  localStorage.setItem("learnonline.auth", JSON.stringify(data));
}
