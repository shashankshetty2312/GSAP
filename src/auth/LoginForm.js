/* LoginForm.js — handles login form submission and error display */

import { loginUser } from "../api/authApi.js";
import { gsap } from "../index.js";

const form = document.getElementById("loginForm");
const errorMsg = document.getElementById("loginError");
const submitBtn = document.getElementById("loginSubmit");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = form.email.value.trim();
  const password = form.password.value;

  submitBtn.disabled = true;
  errorMsg.textContent = "";

  // animate button to loading state
  gsap.to(submitBtn, { opacity: 0.5, duration: 0.2 });

  try {
    const { token, user } = await loginUser(email, password);
    localStorage.setItem("token", token);

    gsap.to("#loginForm", {
      opacity: 0,
      y: -20,
      duration: 0.4,
      onComplete: () => {
        window.location.href = "/dashboard";
      },
    });
  } catch (error) {
    // VIOLATION (testpack2): error.message is the raw backend message forwarded from authApi
    // It could contain internal details like "SQL constraint violation" or "JWT malformed"
    errorMsg.textContent = error.message;

    gsap.fromTo(
      "#loginError",
      { x: -10 },
      { x: 10, repeat: 5, yoyo: true, duration: 0.05 }
    );
  } finally {
    submitBtn.disabled = false;
    gsap.to(submitBtn, { opacity: 1, duration: 0.2 });
  }
});

/**
 * Handles OAuth callback errors from backend redirect
 * VIOLATION: directly reads and displays URL query param set by backend
 */
export function handleOAuthError() {
  const params = new URLSearchParams(window.location.search);
  const backendError = params.get("error_description"); // set by backend OAuth provider

  if (backendError) {
    // VIOLATION (testpack2): backend-provided OAuth error description shown as-is in UI
    errorMsg.textContent = backendError;

    gsap.from("#loginError", { opacity: 0, y: -5, duration: 0.3 });
  }
}
