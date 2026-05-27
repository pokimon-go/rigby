// ============================================
// RIGBY — Posts Logic
// Create, read, delete posts + likes
// ============================================

// ── LOAD FEED ─────────────────────────────
async function loadFeed() {
  const container = document.getElementById('posts-container');
  if (!container) return;

  container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:2rem">Loading...</p>';

  const { data: { session } } = await sb.auth.getSession();
  const userId = session?.user?.id;

  // Fetch posts
  const { data: posts, error } = await sb
    .from('posts')
    .select('id, title, content, created_at, user_id')
    .order('created_at', { ascending: false });

  console.log('Posts:', posts, 'Error:', error);

  if (error || !posts?.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">💬</div>
        <div class="empty-state-text">No posts yet</div>
        <p style="margin-top:0.5rem">Be the first to post something</p>
      </div>`;
    return;
  }

  // Fetch all needed data in parallel
  const userIds = [...new Set(posts.map(p => p.user_id))];
  const postIds = posts.map(p => p.id);

  const [profilesRes, likesRes, commentsRes] = await Promise.all([
    sb.from('profiles').select('id, username').in('id', userIds),
    sb.from('likes').select('post_id, user_id').in('post_id', postIds),
    sb.from('comments').select('post_id').in('post_id', postIds)
  ]);

  const profiles  = profilesRes.data || [];
  const likes     = likesRes.data || [];
  const comments  = commentsRes.data || [];

  container.innerHTML = posts.map(post => {
    const profile     = profiles.find(p => p.id === post.user_id);
    const username    = profile?.username || 'unknown';
    const postLikes   = likes.filter(l => l.post_id === post.id);
    const postComments= comments.filter(c => c.post_id === post.id);
    const liked       = postLikes.some(l => l.user_id === userId);
    const date        = new Date(post.created_at).toLocaleDateString();
    const initial     = username[0].toUpperCase();

    return `
      <div class="post-card" style="margin-bottom:1rem" onclick="window.location='/post?id=${post.id}'">
        <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.75rem">
          <div class="avatar">${initial}</div>
          <div>
            <a href="/profile?id=${post.user_id}" style="font-weight:600;font-size:0.875rem;color:var(--text-primary);text-decoration:none">@${username}</a>
            <div style="font-size:0.75rem;color:var(--text-muted)">${date}</div>
          </div>
        </div>
        <div class="post-card-title">${escapeHtml(post.title)}</div>
        <p style="color:var(--text-secondary);font-size:0.875rem;margin:0.5rem 0 1rem;line-height:1.5">
          ${escapeHtml(post.content).substring(0, 200)}${post.content.length > 200 ? '...' : ''}
        </p>
        <div style="display:flex;gap:1rem;align-items:center" onclick="event.stopPropagation()">
          <button
            class="btn btn-secondary btn-sm"
            onclick="toggleLike('${post.id}', this)"
            style="color:${liked ? 'var(--accent)' : 'var(--text-secondary)'}"
            data-post-id="${post.id}"
            data-liked="${liked}"
          >
            ♥ ${postLikes.length}
          </button>
          <span style="font-size:0.875rem;color:var(--text-muted)">
            💬 ${postComments.length}
          </span>
        </div>
      </div>`;
  }).join('');
}

// ── LIKE / UNLIKE ─────────────────────────
async function toggleLike(postId, btn) {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { window.location.href = '/login'; return; }

  const liked = btn.dataset.liked === 'true';

  if (liked) {
    await sb.from('likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', session.user.id);
  } else {
    await sb.from('likes')
      .insert({ post_id: postId, user_id: session.user.id });
  }

  loadFeed();
}

// ── CREATE POST ───────────────────────────
async function createPost() {
  const title   = document.getElementById('post-title')?.value.trim();
  const content = document.getElementById('post-content')?.value.trim();
  const btn     = document.getElementById('submit-post-btn');
  const alert   = document.getElementById('post-alert');

  if (!title || !content) {
    alert.textContent = 'Please fill in both fields';
    alert.className = 'alert alert-error show';
    return;
  }

  const { data: { session } } = await sb.auth.getSession();
  if (!session) { window.location.href = '/login'; return; }

  btn.disabled = true;
  btn.textContent = 'Posting...';

  const { error } = await sb.from('posts').insert({
    title,
    content,
    user_id: session.user.id
  });

  btn.disabled = false;
  btn.textContent = 'Post';

  if (error) {
    alert.textContent = error.message;
    alert.className = 'alert alert-error show';
    return;
  }

  closeModal();
  loadFeed();
}

// ── MODAL ─────────────────────────────────
function openModal() {
  document.getElementById('post-modal').style.display = 'flex';
  document.getElementById('post-title').focus();
}

function closeModal() {
  document.getElementById('post-modal').style.display = 'none';
  document.getElementById('post-title').value = '';
  document.getElementById('post-content').value = '';
  const alert = document.getElementById('post-alert');
  if (alert) alert.className = 'alert';
}

// ── HELPER ────────────────────────────────
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Load feed on page load
loadFeed();

function filterFeed(query) {
  const cards = document.querySelectorAll('#feed .post-card');
  const q = query.toLowerCase().trim();
  cards.forEach(card => {
    const title = card.querySelector('.post-card-title')?.textContent.toLowerCase() || '';
    const content = card.textContent.toLowerCase() || '';
    card.style.display = (!q || title.includes(q) || content.includes(q)) ? 'block' : 'none';
  });
}
