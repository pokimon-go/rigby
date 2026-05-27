// ============================================
// RIGBY — Comments Logic
// ============================================

const postId = new URLSearchParams(window.location.search).get('id');

async function loadPost() {
  if (!postId) { window.location.href = '/'; return; }

  const { data: post } = await sb
    .from('posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (!post) { window.location.href = '/'; return; }

  const [profileRes, likesRes] = await Promise.all([
    sb.from('profiles').select('id, username').eq('id', post.user_id).single(),
    sb.from('likes').select('id, user_id').eq('post_id', postId)
  ]);

  const username = profileRes.data?.username || 'unknown';
  const likes = likesRes.data || [];

  const { data: { session } } = await sb.auth.getSession();
  const userId = session?.user?.id;
  const liked = likes.some(l => l.user_id === userId);
  const date = new Date(post.created_at).toLocaleDateString();

  document.title = `${post.title} — Rigby`;

  document.getElementById('post-content').innerHTML = `
    <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem">
      <div class="avatar">${username[0].toUpperCase()}</div>
      <div>
        <div style="font-weight:600;font-size:0.875rem">@${username}</div>
        <div style="font-size:0.75rem;color:var(--text-muted)">${date}</div>
      </div>
    </div>
    <h1 style="font-size:1.5rem;font-weight:700;margin-bottom:1rem">${escapeHtml(post.title)}</h1>
    <p style="color:var(--text-secondary);line-height:1.7;white-space:pre-wrap">${escapeHtml(post.content)}</p>
    <hr class="divider">
    <div style="display:flex;gap:1rem;align-items:center">
      <button
        class="btn btn-secondary btn-sm"
        onclick="togglePostLike()"
        id="like-btn"
        style="color:${liked ? 'var(--accent)' : 'var(--text-secondary)'}"
      >
        ❤ ${likes.length || 0}
      </button>
      ${userId === post.user_id ? `
        <button class="btn btn-danger btn-sm" onclick="deletePost('${post.id}')">Delete post</button>
      ` : ''}
    </div>
  `;

  if (userId) {
    document.getElementById('comment-form').style.display = 'block';
  } else {
    document.getElementById('login-to-comment').style.display = 'block';
  }

  loadComments();
}

async function loadComments() {
  const { data: comments } = await sb
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  const { data: { session } } = await sb.auth.getSession();
  const userId = session?.user?.id;

  document.getElementById('comment-count').textContent =
    `Comments (${comments?.length || 0})`;

  const list = document.getElementById('comments-list');

  if (!comments?.length) {
    list.innerHTML = `<p style="color:var(--text-muted);font-size:0.875rem">No comments yet. Be the first!</p>`;
    return;
  }

  const userIds = [...new Set(comments.map(c => c.user_id))];
  const { data: profiles } = await sb.from('profiles').select('id, username').in('id', userIds);
  const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p.username]));

  list.innerHTML = comments.map(c => {
    const username = profileMap[c.user_id] || 'unknown';
    const date = new Date(c.created_at).toLocaleDateString();
    return `
      <div style="display:flex;gap:0.75rem;margin-bottom:1rem">
        <div class="avatar" style="width:32px;height:32px;font-size:0.75rem;flex-shrink:0">
          ${username[0].toUpperCase()}
        </div>
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.25rem">
            <span style="font-weight:600;font-size:0.875rem">@${username}</span>
            <span style="font-size:0.75rem;color:var(--text-muted)">${date}</span>
            ${userId === c.user_id ? `
              <button onclick="deleteComment('${c.id}')"
                style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:0.75rem;margin-left:auto">
                Delete
              </button>` : ''}
          </div>
          <p style="font-size:0.875rem;color:var(--text-secondary);line-height:1.5">
            ${escapeHtml(c.content)}
          </p>
        </div>
      </div>
    `;
  }).join('');
}

async function submitComment() {
  const input = document.getElementById('comment-input');
  const content = input.value.trim();
  if (!content) { showToast('Please write a comment first', 'error'); return; }

  const { data: { session } } = await sb.auth.getSession();
  if (!session) { window.location.href = '/login'; return; }

  const { error } = await sb.from('comments').insert({
    post_id: postId,
    user_id: session.user.id,
    content
  });

  if (!error) {
    input.value = '';
    loadComments();
  }
}

async function deleteComment(commentId) {
  if (!confirm('Delete this comment?')) return;
  await sb.from('comments').delete().eq('id', commentId);
  loadComments();
}

async function deletePost(id) {
  if (!confirm('Delete this post? This cannot be undone.')) return;
  await sb.from('posts').delete().eq('id', id);
  window.location.href = '/';
}

async function togglePostLike() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { window.location.href = '/login'; return; }

  const { data: existing } = await sb.from('likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', session.user.id)
    .single();

  if (existing) {
    await sb.from('likes').delete().eq('id', existing.id);
  } else {
    await sb.from('likes').insert({ post_id: postId, user_id: session.user.id });
  }

  loadPost();
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

loadPost();
