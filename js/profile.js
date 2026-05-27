async function loadProfile() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { window.location.href = '/login'; return; }

  const urlId = new URLSearchParams(window.location.search).get('id');
  const profileId = urlId || session.user.id;
  const isOwn = profileId === session.user.id;

  const el = document.getElementById('profile-content');

  const { data: profile } = await sb.from('profiles')
    .select('*').eq('id', profileId).single();

  if (!profile) { el.innerHTML = '<p>User not found.</p>'; return; }

  const { count: postCount } = await sb.from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', profileId);

  const joined = new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

  document.title = '@' + profile.username + ' — Rigby';

  el.innerHTML =
    '<div class="card" style="text-align:center;padding:2rem;margin-bottom:1.5rem">' +
      '<div class="avatar" style="width:72px;height:72px;font-size:2rem;margin:0 auto 1rem">' +
        profile.username[0].toUpperCase() +
      '</div>' +
      '<h1 style="font-size:1.5rem;font-weight:700;margin-bottom:0.5rem">@' + escapeHtml(profile.username) + '</h1>' +
      '<span style="background:var(--accent);color:white;padding:0.2rem 0.6rem;border-radius:999px;font-size:0.75rem">' +
        profile.role +
      '</span>' +
      (profile.banned ? '<span style="background:#ef4444;color:white;padding:0.2rem 0.6rem;border-radius:999px;font-size:0.75rem;margin-left:0.5rem">banned</span>' : '') +
      '<div style="display:flex;justify-content:center;gap:2rem;margin-top:1.5rem">' +
        '<div><div style="font-size:1.5rem;font-weight:700">' + (postCount || 0) + '</div>' +
        '<div style="font-size:0.75rem;color:var(--text-muted)">Posts</div></div>' +
      '</div>' +
      '<div style="font-size:0.75rem;color:var(--text-muted);margin-top:1rem">Joined ' + joined + '</div>' +
    '</div>' +
    '<div class="card">' +
      '<h2 style="font-size:1rem;font-weight:600;margin-bottom:1rem">Bio</h2>' +
      (isOwn
        ? '<textarea id="bio-input" class="form-input" rows="4" placeholder="Write something about yourself...">' +
            escapeHtml(profile.bio || '') +
          '</textarea>' +
          '<button class="btn btn-primary btn-sm" style="margin-top:0.75rem" onclick="saveBio()">Save bio</button>' +
          '<div id="bio-msg" style="font-size:0.875rem;margin-top:0.5rem"></div>'
        : '<p style="color:var(--text-secondary)">' + escapeHtml(profile.bio || 'No bio yet.') + '</p>'
      ) +
    '</div>';
}

async function saveBio() {
  const bio = document.getElementById('bio-input').value.trim();
  const msg = document.getElementById('bio-msg');
  const { data: { session } } = await sb.auth.getSession();
  const { error } = await sb.from('profiles').update({ bio }).eq('id', session.user.id);
  if (error) {
    msg.style.color = 'red';
    msg.textContent = 'Failed to save.';
  } else {
    msg.style.color = 'green';
    msg.textContent = 'Bio saved!';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

checkSession();
loadProfile();
