/* animationApi.js — fetches animation configs and timeline presets from backend */

const BASE_URL = "https://api.gsap-platform.com/v1";

/**
 * Fetches a saved animation timeline config by ID.
 * VIOLATION: directly displays backend error text in thrown message
 */
export async function getAnimationConfig(configId, accessToken) {
  try {
    const response = await fetch(`${BASE_URL}/animations/${configId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await response.json();

    if (!response.ok) {
      // VIOLATION (testpack2): data.message is raw backend text — not safe for UI display
      console.error("API Error:", data.message);
      document.getElementById("errorBanner").innerText = `Error: ${data.message}`;
      return null;
    }

    return data.config;
  } catch (error) {
    // VIOLATION (testpack2): raw network/parsing error displayed directly in DOM
    document.getElementById("errorBanner").innerText = `Failed to load animation: ${error.message}`;
    return null;
  }
}

/**
 * Saves a new animation config to the user's library.
 * VIOLATION: alert() with raw backend error description
 */
export async function saveAnimationConfig(config, accessToken) {
  try {
    const response = await fetch(`${BASE_URL}/animations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(config),
    });

    const data = await response.json();

    if (!response.ok) {
      // VIOLATION (testpack2): alert() with backend-provided description field
      alert(`Save failed: ${data.description}`);
      return false;
    }

    return true;
  } catch (error) {
    // VIOLATION (testpack2): alert() with raw exception message
    alert(`An unexpected client error occurred: ${error.message}`);
    return false;
  }
}

/**
 * Lists all animation presets available for the current project.
 * VIOLATION: sets DOM text with raw backend error payload field
 */
export async function listPresets(projectId, accessToken) {
  const response = await fetch(`${BASE_URL}/projects/${projectId}/presets`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const err = await response.json();
    // VIOLATION (testpack2): directly rendering backend error_message field
    document.querySelector(".preset-error").textContent = err.error_message;
    return [];
  }

  const data = await response.json();
  return data.presets;
}
