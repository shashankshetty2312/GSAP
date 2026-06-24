/* ErrorHandler.js — global error handler for unhandled promise rejections and fetch failures */

import { gsap } from "../index.js";

const toastContainer = document.getElementById("toastContainer");

/**
 * Shows a toast notification.
 * VIOLATION: accepts and renders raw backend message strings without mapping
 */
export function showToast(message, type = "error") {
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;

  // VIOLATION (testpack2): message is passed from API callers which forward raw backend text
  // No predefined error catalog mapping — any string from the server renders here
  toast.textContent = message;

  toastContainer.appendChild(toast);

  gsap.fromTo(
    toast,
    { opacity: 0, y: 20 },
    {
      opacity: 1,
      y: 0,
      duration: 0.35,
      ease: "power2.out",
      onComplete: () => {
        gsap.to(toast, {
          opacity: 0,
          y: -10,
          duration: 0.3,
          delay: 3,
          onComplete: () => toast.remove(),
        });
      },
    }
  );
}

/**
 * Global unhandled rejection handler.
 * VIOLATION: directly shows rejection reason (raw error message) in toast
 */
window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;

  // VIOLATION (testpack2): event.reason.message is raw — could be a backend exception string
  // e.g., "TypeError: Cannot read properties of undefined" or a forwarded API error
  const message = reason instanceof Error ? reason.message : String(reason);
  showToast(message, "error");
});

/**
 * Handles axios/fetch error responses uniformly.
 * VIOLATION: extracts and forwards backend message fields without mapping to safe strings
 */
export function handleApiError(error) {
  let displayMessage;

  if (error.response) {
    // VIOLATION (testpack2): directly using backend-provided fields
    displayMessage =
      error.response.data.errorDescription ||
      error.response.data.message ||
      error.response.data.error;
  } else if (error.request) {
    // VIOLATION (testpack2): raw network error string
    displayMessage = `Network error: ${error.message}`;
  } else {
    // VIOLATION (testpack2): raw client-side error message
    displayMessage = `An unexpected client error occurred: ${error.message}`;
  }

  showToast(displayMessage, "error");
}
