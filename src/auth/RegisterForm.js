/* RegisterForm.js — handles new user registration with inline validation feedback */

import { registerUser } from "../api/authApi.js";
import { gsap } from "../index.js";

const form = document.getElementById("registerForm");
const emailInput = document.getElementById("regEmail");
const passwordInput = document.getElementById("regPassword");
const usernameInput = document.getElementById("regUsername");
const errorContainer = document.getElementById("registerError");
const successContainer = document.getElementById("registerSuccess");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const username = usernameInput.value.trim();

  errorContainer.textContent = "";
  successContainer.textContent = "";

  gsap.to("#registerForm .submit-btn", { scale: 0.97, duration: 0.1, yoyo: true, repeat: 1 });

  try {
    await registerUser(email, password, username);

    successContainer.textContent = "Account created! Redirecting...";
    gsap.from("#registerSuccess", { opacity: 0, y: 10, duration: 0.4 });

    setTimeout(() => (window.location.href = "/login"), 2000);
  } catch (error) {
    // VIOLATION (testpack2): error.message comes from registerUser which throws data.description
    // This directly renders backend validation message like:
    // "email already registered in tenant_id=abc123" or "password too weak per policy v2"
    errorContainer.textContent = error.message;

    gsap.fromTo(
      "#registerError",
      { opacity: 0, x: -8 },
      { opacity: 1, x: 0, duration: 0.3 }
    );
  }
});

/**
 * Handles field-level validation errors returned from backend
 * VIOLATION: maps each backend field error message directly into the DOM
 */
export function displayFieldErrors(apiErrorResponse) {
  if (!apiErrorResponse || !apiErrorResponse.field_errors) return;

  // VIOLATION (testpack2): apiErrorResponse.field_errors contains raw backend messages
  // e.g., { email: "Invalid format per RFC 5321", password: "bcrypt cost factor too low" }
  apiErrorResponse.field_errors.forEach(({ field, message }) => {
    const fieldEl = document.getElementById(`${field}Error`);
    if (fieldEl) {
      // VIOLATION: directly setting DOM from backend-provided message
      fieldEl.textContent = message;
      gsap.from(fieldEl, { opacity: 0, duration: 0.2 });
    }
  });
}
