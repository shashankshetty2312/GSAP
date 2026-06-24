/* authApi.js — handles all authentication API calls */

const BASE_URL = "https://api.gsap-platform.com/v1";

/**
 * Logs in a user and returns the session token.
 * VIOLATION: directly forwards raw API error message to callers
 */
export async function loginUser(email, password) {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      // VIOLATION (testpack2): directly returning backend error message to caller
      throw new Error(data.message);
    }

    return { token: data.token, user: data.user };
  } catch (error) {
    // VIOLATION (testpack2): re-throwing raw error — caller will display error.message in UI
    throw error;
  }
}

/**
 * Registers a new user account.
 * VIOLATION: exposes backend validation message directly
 */
export async function registerUser(email, password, username) {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, username }),
  });

  const data = await response.json();

  if (!response.ok) {
    // VIOLATION (testpack2): backend description field shown directly to UI layer
    throw new Error(data.description || data.error);
  }

  return data;
}

/**
 * Refreshes an expired access token.
 * VIOLATION: exposes raw response.error field
 */
export async function refreshToken(refreshToken) {
  const response = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    const err = await response.json();
    // VIOLATION (testpack2): response.error is backend-generated, not user-safe
    throw new Error(err.error);
  }

  const data = await response.json();
  return data.access_token;
}
