// ============================================
// RIGBY — Authentication Logic
// Handles register, login, logout, sessions
// ============================================

// Show an alert message on the page
function showAlert(message, type = 'error') {
  const alert = document.getElementById('alert');
  if (!alert) return;
  alert.textContent = message;
  alert.className = `alert alert-${type} show`;
}

// Disable/enable a button (prevents double-clicking)
function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = loading ? 'Please wait...' : btn.dataset.label;
}

// ── REGISTER ──────────────────────────────
async function handleRegister() {
  const username = document.getElementById('username')?.value.trim();
  const email    = document.getElementById('email')?.value.trim();
  const password = document.getElementById('password')?.value;
  const btn      = document.getElementById('register-btn');

  // Validation
  if (!username || !email || !password) {
    showAlert('Please fill in all fields'); return;
  }
  if (username.length < 3) {
    showAlert('Username must be at least 3 characters'); return;
  }
  if (password.length < 6) {
    showAlert('Password must be at least 6 characters'); return;
  }

  btn.disabled = true;
  btn.textContent = 'Creating account...';

  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: { username }   // stored in raw_user_meta_data
    }
  });

  btn.disabled = false;
  btn.textContent = 'Create account';

  if (error) {
    showAlert(error.message); return;
  }

  // Success — tell user to check email
  showAlert(
    'Account created! Check your email to verify your account, then sign in.',
    'success'
  );
}

// ── LOGIN ──────────────────────────────────
async function handleLogin() {
  const email    = document.getElementById('email')?.value.trim();
  const password = document.getElementById('password')?.value;
  const btn      = document.getElementById('login-btn');

  if (!email || !password) {
    showAlert('Please enter your email and password'); return;
  }

  btn.disabled = true;
  btn.textContent = 'Signing in...';

  const { data, error } = await sb.auth.signInWithPassword({
    email,
    password
  });

  btn.disabled = false;
  btn.textContent = 'Sign in';

  if (error) {
    showAlert(error.message); return;
  }

  // Redirect to homepage on success
  window.location.href = '/';
}

// ── LOGOUT ────────────────────────────────
async function handleLogout() {
  await sb.auth.signOut();
  window.location.href = '/';
}

// ── SESSION CHECK ─────────────────────────
// Runs on every page — updates the nav based on login state
async function checkSession() {
  const { data: { session } } = await sb.auth.getSession();
  const navAuth = document.getElementById('nav-auth');
  if (!navAuth) return;

  if (session) {
    // User is logged in — show username + logout
    const { data: profile } = await sb
      .from('profiles')
      .select('username')
      .eq('id', session.user.id)
      .single();

    const username = profile?.username || session.user.email;

    navAuth.innerHTML = `
      <a href="/profile" class="btn btn-secondary btn-sm">@${username}</a>
      <button class="btn btn-secondary btn-sm" onclick="handleLogout()">Logout</button>
    `;

    // Show "New Post" button on homepage
    const newPostBtn = document.getElementById('new-post-btn');
    if (newPostBtn) newPostBtn.style.display = 'inline-flex';

    // Hide hero section (user is already a member)
    const hero = document.getElementById('hero');
    if (hero) hero.style.display = 'none';

  } else {
    // User is logged out — show login/signup buttons
    navAuth.innerHTML = `
      <a href="/login" class="btn btn-secondary btn-sm">Login</a>
      <a href="/register" class="btn btn-primary btn-sm">Sign Up</a>
    `;
  }
}

// Run session check on every page load
checkSession();
