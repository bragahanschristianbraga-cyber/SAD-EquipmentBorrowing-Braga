// ============================================================
// auth.js — Login, Logout, Session Management (BR-11)
// ============================================================

// Guard: redirect to login.html if there is no active session.
// Call this at the top of any protected page (index.html).
async function requireAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = "login.html";
    return null;
  }
  return session;
}

// If already logged in and on login.html, skip straight to dashboard.
async function redirectIfLoggedIn() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    window.location.href = "index.html";
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const errorBox = document.getElementById("login-error");
  errorBox.textContent = "";

  if (!email || !password) {
    errorBox.textContent = "Email and password are required.";
    return;
  }

  const submitBtn = document.getElementById("login-btn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Signing in...";

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

  submitBtn.disabled = false;
  submitBtn.textContent = "Login";

  if (error) {
    errorBox.textContent = error.message;
    return;
  }

  window.location.href = "index.html";
}

async function handleLogout() {
  await supabaseClient.auth.signOut();
  window.location.href = "login.html";
}

// Keep the UI in sync if the session expires or changes in another tab.
supabaseClient.auth.onAuthStateChange((_event, session) => {
  const onLoginPage = window.location.pathname.endsWith("login.html");
  if (!session && !onLoginPage) {
    window.location.href = "login.html";
  }
});
