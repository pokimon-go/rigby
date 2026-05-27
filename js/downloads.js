async function initDownloads() {
  checkSession();
  loadDownloads();
}

async function loadDownloads() {
  const list = document.getElementById('downloads-list');

  const { data: { session } } = await sb.auth.getSession();
  const userId = session?.user?.id;

  let isAdmin = false;
  if (userId) {
    const { data: profile } = await sb.from('profiles').select('role').eq('id', userId).single();
    isAdmin = profile?.role === 'admin';
  }

  if (isAdmin) document.getElementById('upload-btn').style.display = 'block';

  try {
    const { data: files, error } = await sb
      .from('downloads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) { list.innerHTML = '<p style="color:red">DB Error: ' + error.message + '</p>'; return; }

    if (!files?.length) {
      list.innerHTML = '<div class="empty-state"><p>No files available yet.</p></div>';
      return;
    }

    const userIds = [...new Set(files.map(f => f.uploaded_by).filter(Boolean))];
    const { data: profiles } = await sb.from('profiles').select('id, username').in('id', userIds);
    const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p.username]));

    list.innerHTML = files.map(f => {
      const username = profileMap[f.uploaded_by] || 'admin';
      const date = new Date(f.created_at).toLocaleDateString();
      const size = formatFileSize(f.file_size);
      return '<div class="card" style="margin-bottom:1rem;display:flex;align-items:center;gap:1rem">' +
        '<div style="font-size:2rem">📄</div>' +
        '<div style="flex:1;min-width:0">' +
          '<div style="font-weight:600;margin-bottom:0.25rem">' + escapeHtml(f.filename) + '</div>' +
          (f.description ? '<div style="font-size:0.875rem;color:var(--text-secondary)">' + escapeHtml(f.description) + '</div>' : '') +
          '<div style="font-size:0.75rem;color:var(--text-muted)">@' + username + ' · ' + date + ' · ' + size + '</div>' +
        '</div>' +
        '<div style="display:flex;gap:0.5rem;flex-shrink:0">' +
          (userId
            ? '<button class="btn btn-primary btn-sm" onclick="downloadFile(\'' + f.file_path + '\',\'' + escapeHtml(f.filename) + '\')">Download</button>'
            : '<a href="/login" class="btn btn-secondary btn-sm">Login to download</a>') +
          (isAdmin ? '<button class="btn btn-danger btn-sm" onclick="deleteFile(\'' + f.id + '\',\'' + f.file_path + '\')">Delete</button>' : '') +
        '</div>' +
      '</div>';
    }).join('');

  } catch(e) {
    list.innerHTML = '<p style="color:red">JS Error: ' + e.message + '</p>';
  }
}

async function downloadFile(filePath, filename) {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { window.location.href = '/login'; return; }
  const { data, error } = await sb.storage.from('downloads').createSignedUrl(filePath, 60);
  if (error || !data?.signedUrl) { alert('Failed to generate download link.'); return; }
  const a = document.createElement('a');
  a.href = data.signedUrl;
  a.download = filename;
  a.click();
}

function toggleUploadForm() {
  const form = document.getElementById('upload-form');
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

async function uploadFile() {
  const fileInput = document.getElementById('file-input');
  const description = document.getElementById('file-description').value.trim();
  const progressDiv = document.getElementById('upload-progress');
  const progressBar = document.getElementById('progress-bar');
  document.getElementById('upload-error').style.display = 'none';
  if (!fileInput.files[0]) { showUploadError('Please select a file.'); return; }
  const file = fileInput.files[0];
  if (file.size > 50 * 1024 * 1024) { showUploadError('File exceeds 50MB limit.'); return; }
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { window.location.href = '/login'; return; }
  const filePath = Date.now() + '_' + file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  progressDiv.style.display = 'block';
  progressBar.style.width = '30%';
  const { error: uploadError } = await sb.storage.from('downloads').upload(filePath, file);
  if (uploadError) { progressDiv.style.display = 'none'; showUploadError('Upload failed: ' + uploadError.message); return; }
  progressBar.style.width = '70%';
  const { error: dbError } = await sb.from('downloads').insert({
    filename: file.name, description: description || null,
    file_path: filePath, file_size: file.size, uploaded_by: session.user.id
  });
  if (dbError) { progressDiv.style.display = 'none'; showUploadError('Failed to save record: ' + dbError.message); return; }
  progressBar.style.width = '100%';
  setTimeout(() => {
    progressDiv.style.display = 'none'; progressBar.style.width = '0%';
    fileInput.value = ''; document.getElementById('file-description').value = '';
    document.getElementById('upload-form').style.display = 'none';
    loadDownloads();
  }, 500);
}

async function deleteFile(id, filePath) {
  if (!confirm('Delete this file?')) return;
  await sb.storage.from('downloads').remove([filePath]);
  await sb.from('downloads').delete().eq('id', id);
  loadDownloads();
}

function formatFileSize(bytes) {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function showUploadError(msg) {
  const el = document.getElementById('upload-error');
  el.textContent = msg; el.style.display = 'block';
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

initDownloads();


