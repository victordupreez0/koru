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

// POST /api/User/login – sign an existing user into the platform
// The expectedRole is checked client-side against the backend response
// to ensure users log in via the correct portal (student/teacher/admin)
export async function loginUser({ email, password, expectedRole }) {
  const res = await fetch(`${API_BASE}/User/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await handleResponse(res);

  // Role guard – the backend returns the user's actual role; reject
  // if it doesn't match the portal they used to sign in
  if (expectedRole && data.role?.toLowerCase() !== expectedRole.toLowerCase()) {
    throw new Error(
      `This account is registered as a ${data.role}. Please use the correct login portal.`
    );
  }

  return data;
}

// PUT /api/User/profile/:id – update the user's profile information from settings
export async function updateUserProfile(id, payload) {
  const res = await fetch(`${API_BASE}/User/profile/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return handleResponse(res);
}

// POST /api/User/change-password/:id – change the user's password after verifying the current one
export async function changeUserPassword(id, payload) {
  const res = await fetch(`${API_BASE}/User/change-password/${encodeURIComponent(id)}`, {
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

