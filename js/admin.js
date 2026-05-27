async function initAdmin() {
  checkSession();

  const { data: { session } } = await sb.auth.getSession();
  if (!session) { window.location.href = '/login'; return; }

  const { data: profile } = await sb.from('profiles')
    .select('role').eq('id', session.user.id).single();

  if (!profile || profile.role !== 'admin') {
    window.location.href = '/';
    return;
  }

  loadStats();
  loadUsers();
}

async function loadStats() {
  const [users, posts, comments, files] = await Promise.all([
    sb.from('profiles').select('id', { count: 'exact', head: true }),
    sb.from('posts').select('id', { count: 'exact', head: true }),
    sb.from('comments').select('id', { count: 'exact', head: true }),
    sb.from('downloads').select('id', { count: 'exact', head: true })
  ]);
  document.getElementById('stat-users').textContent = users.count ?? '—';
  document.getElementById('stat-posts').textContent = posts.count ?? '—';
  document.getElementById('stat-comments').textContent = comments.count ?? '—';
  document.getElementById('stat-files').textContent = files.count ?? '—';
}

function showTab(tab) {
  document.getElementById('tab-users').style.display = tab === 'users' ? 'block' : 'none';
  document.getElementById('tab-posts').style.display = tab === 'posts' ? 'block' : 'none';
  document.getElementById('tab-comments').style.display = tab === 'comments' ? 'block' : 'none';
  if (tab === 'users') loadUsers();
  if (tab === 'posts') loadPosts();
  if (tab === 'comments') loadComments();
}

async function loadUsers() {
  const el = document.getElementById('tab-users');
  const { data: users } = await sb.from('profiles')
    .select('*').order('created_at', { ascending: false });

  const { data: { session } } = await sb.auth.getSession();

  if (!users?.length) { el.innerHTML = '<p>No users.</p>'; return; }

  el.innerHTML = users.map(u => {
    const isSelf = u.id === session.user.id;
    return '<div class="card" style="margin-bottom:0.75rem;display:flex;align-items:center;gap:1rem">' +
      '<div class="avatar">' + u.username[0].toUpperCase() + '</div>' +
      '<div style="flex:1">' +
        '<div style="font-weight:600">@' + escapeHtml(u.username) + '</div>' +
        '<div style="font-size:0.75rem;color:var(--text-muted)">' +
          u.role + (u.banned ? ' · 🚫 banned' : '') +
        '</div>' +
      '</div>' +
      (!isSelf ? '<div style="display:flex;gap:0.5rem">' +
        '<button class="btn btn-secondary btn-sm" onclick="toggleAdmin(\'' + u.id + '\',\'' + u.role + '\')">' +
          (u.role === 'admin' ? 'Remove admin' : 'Make admin') +
        '</button>' +
        '<button class="btn btn-' + (u.banned ? 'primary' : 'danger') + ' btn-sm" onclick="toggleBan(\'' + u.id + '\',' + u.banned + ')">' +
          (u.banned ? 'Unban' : 'Ban') +
        '</button>' +
      '</div>' : '<span style="font-size:0.75rem;color:var(--text-muted)">(you)</span>') +
    '</div>';
  }).join('');
}

async function loadPosts() {
  const el = document.getElementById('tab-posts');
  const { data: posts } = await sb.from('posts')
    .select('*').order('created_at', { ascending: false });

  if (!posts?.length) { el.innerHTML = '<p>No posts.</p>'; return; }

  const userIds = [...new Set(posts.map(p => p.user_id))];
  const { data: profiles } = await sb.from('profiles').select('id, username').in('id', userIds);
  const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p.username]));

  el.innerHTML = posts.map(p => {
    const username = profileMap[p.user_id] || 'unknown';
    const date = new Date(p.created_at).toLocaleDateString();
    return '<div class="card" style="margin-bottom:0.75rem;display:flex;align-items:center;gap:1rem">' +
      '<div style="flex:1;min-width:0">' +
        '<div style="font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escapeHtml(p.title) + '</div>' +
        '<div style="font-size:0.75rem;color:var(--text-muted)">@' + username + ' · ' + date + '</div>' +
      '</div>' +
      '<button class="btn btn-danger btn-sm" onclick="deletePost(\'' + p.id + '\')">Delete</button>' +
    '</div>';
  }).join('');
}

async function loadComments() {
  const el = document.getElementById('tab-comments');
  const { data: comments } = await sb.from('comments')
    .select('*').order('created_at', { ascending: false });

  if (!comments?.length) { el.innerHTML = '<p>No comments.</p>'; return; }

  const userIds = [...new Set(comments.map(c => c.user_id))];
  const { data: profiles } = await sb.from('profiles').select('id, username').in('id', userIds);
  const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p.username]));

  el.innerHTML = comments.map(c => {
    const username = profileMap[c.user_id] || 'unknown';
    const date = new Date(c.created_at).toLocaleDateString();
    return '<div class="card" style="margin-bottom:0.75rem;display:flex;align-items:center;gap:1rem">' +
      '<div style="flex:1;min-width:0">' +
        '<div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escapeHtml(c.content) + '</div>' +
        '<div style="font-size:0.75rem;color:var(--text-muted)">@' + username + ' · ' + date + '</div>' +
      '</div>' +
      '<button class="btn btn-danger btn-sm" onclick="deleteComment(\'' + c.id + '\')">Delete</button>' +
    '</div>';
  }).join('');
}

async function toggleAdmin(userId, currentRole) {
  const newRole = currentRole === 'admin' ? 'member' : 'admin';
  await sb.from('profiles').update({ role: newRole }).eq('id', userId);
  loadUsers();
}

async function toggleBan(userId, currentBanned) {
  await sb.from('profiles').update({ banned: !currentBanned }).eq('id', userId);
  loadUsers();
}

async function deletePost(id) {
  if (!confirm('Delete this post?')) return;
  await sb.from('posts').delete().eq('id', id);
  loadPosts();
  loadStats();
}

async function deleteComment(id) {
  if (!confirm('Delete this comment?')) return;
  await sb.from('comments').delete().eq('id', id);
  loadComments();
  loadStats();
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

initAdmin();

