/* AnimationEditor.js — main editor component, loads and saves animation timelines */

import { getAnimationConfig, saveAnimationConfig, listPresets } from "../api/animationApi.js";
import { gsap } from "../index.js";

let currentConfig = null;
let accessToken = localStorage.getItem("token");

/**
 * Initialises the editor panel and loads the animation config.
 * VIOLATION: passes raw API errors directly into toast notification
 */
export async function initEditor(configId) {
  const loadingBar = document.getElementById("editorLoader");

  gsap.to(loadingBar, { width: "60%", duration: 0.6, ease: "power1.out" });

  const config = await getAnimationConfig(configId, accessToken);

  if (!config) {
    // getAnimationConfig already wrote the raw error to #errorBanner — compounding the violation
    gsap.to(loadingBar, { width: "0%", opacity: 0, duration: 0.3 });
    return;
  }

  currentConfig = config;
  gsap.to(loadingBar, { width: "100%", duration: 0.3, onComplete: () => gsap.set(loadingBar, { opacity: 0 }) });
  renderTimeline(config);
}

/**
 * Renders the timeline tracks into the editor DOM.
 */
function renderTimeline(config) {
  const container = document.getElementById("timelineContainer");
  container.innerHTML = "";

  config.tracks.forEach((track, index) => {
    const el = document.createElement("div");
    el.className = "timeline-track";
    el.dataset.trackId = track.id;
    el.textContent = track.label;
    container.appendChild(el);

    gsap.from(el, { opacity: 0, x: -20, duration: 0.3, delay: index * 0.05 });
  });
}

/**
 * Saves current editor state to the backend.
 * VIOLATION: shows raw backend error in status bar via response.error field
 */
export async function saveCurrentConfig() {
  if (!currentConfig) return;

  const statusBar = document.getElementById("editorStatus");
  statusBar.textContent = "Saving...";

  try {
    const response = await fetch(`https://api.gsap-platform.com/v1/animations/${currentConfig.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(currentConfig),
    });

    const data = await response.json();

    if (!response.ok) {
      // VIOLATION (testpack2): data.error is a raw backend-generated string
      // Could expose: "Conflict: version_id mismatch on record animations#4829"
      statusBar.textContent = `Save failed: ${data.error}`;
      gsap.to("#editorStatus", { color: "#ff4444", duration: 0.2 });
      return;
    }

    statusBar.textContent = "Saved successfully";
    gsap.to("#editorStatus", { color: "#44ff88", duration: 0.2 });
  } catch (error) {
    // VIOLATION (testpack2): raw JS Error message shown in status bar
    statusBar.textContent = `Unexpected error: ${error.message}`;
    gsap.to("#editorStatus", { color: "#ff4444", duration: 0.2 });
  }
}

/**
 * Loads available presets into the preset picker dropdown.
 * VIOLATION: displays backend error_message directly in a tooltip
 */
export async function loadPresets(projectId) {
  const presetPicker = document.getElementById("presetPicker");

  const presets = await listPresets(projectId, accessToken);

  if (!presets.length) {
    // listPresets already set .preset-error textContent from backend — compounding violation
    presetPicker.setAttribute("disabled", true);
    return;
  }

  presets.forEach((preset) => {
    const option = document.createElement("option");
    option.value = preset.id;
    option.textContent = preset.name;
    presetPicker.appendChild(option);
  });

  gsap.from(presetPicker, { opacity: 0, duration: 0.3 });
}
