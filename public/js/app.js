(function () {
  const { apiRequest, getToken, setToken } = window.api;

  let currentUser = null;

  const flash = document.getElementById('flashMessage');
  function showFlash(message, type) {
    flash.textContent = message;
    flash.className = `flash ${type}`;
    flash.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function clearFlash() {
    flash.classList.add('hidden');
  }

  function showView(name) {
    document.querySelectorAll('.view').forEach((el) => el.classList.add('hidden'));
    const el = document.getElementById(`view-${name}`);
    if (el) el.classList.remove('hidden');
    if (name === 'dashboard') loadMyPermits();
    if (name === 'admin') loadAdminData();
  }

  function updateNavForAuthState() {
    const loggedIn = Boolean(currentUser);
    document.querySelectorAll('.hidden-when-out').forEach((el) => {
      el.style.display = loggedIn ? '' : 'none';
    });
    document.querySelectorAll('.admin-only').forEach((el) => {
      el.style.display = loggedIn && currentUser.isAdmin ? '' : 'none';
    });
    document.querySelectorAll('[data-view="login"], [data-view="register"]').forEach((el) => {
      el.style.display = loggedIn ? 'none' : '';
    });
  }

  async function refreshCurrentUser() {
    if (!getToken()) {
      currentUser = null;
      updateNavForAuthState();
      return;
    }
    try {
      const { user } = await apiRequest('/auth/me', { auth: true });
      currentUser = user;
    } catch (err) {
      currentUser = null;
      setToken(null);
    }
    updateNavForAuthState();
  }

  document.getElementById('nav').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-view]');
    if (!btn) return;
    clearFlash();
    showView(btn.dataset.view);
  });

  document.getElementById('logoutBtn').addEventListener('click', () => {
    setToken(null);
    currentUser = null;
    updateNavForAuthState();
    showView('login');
    showFlash('Logged out.', 'success');
  });

  // --- Login ---
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFlash();
    const form = new FormData(e.target);
    try {
      const { token, user } = await apiRequest('/auth/login', {
        method: 'POST',
        body: { email: form.get('email'), password: form.get('password') },
      });
      setToken(token);
      currentUser = user;
      updateNavForAuthState();
      e.target.reset();
      showFlash(`Welcome, ${user.email} (${user.role}).`, 'success');
      showView('apply');
    } catch (err) {
      showFlash(err.message, 'error');
    }
  });

  // --- Register ---
  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFlash();
    const form = new FormData(e.target);
    try {
      const { token, user } = await apiRequest('/auth/register', {
        method: 'POST',
        body: { email: form.get('email'), password: form.get('password') },
      });
      setToken(token);
      currentUser = user;
      updateNavForAuthState();
      e.target.reset();
      showFlash(`Account created for ${user.email} (${user.role}).`, 'success');
      showView('apply');
    } catch (err) {
      // Client-side messaging only — the real decision (is this email
      // authorized?) was made by the server.
      showFlash(err.message, 'error');
    }
  });

  // --- Apply for permit ---
  document.getElementById('applyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFlash();
    const form = new FormData(e.target);
    const payload = {
      collegeStatus: form.get('collegeStatus'),
      vehicle: {
        plateNumber: form.get('plateNumber'),
        make: form.get('make'),
        model: form.get('model'),
        color: form.get('color'),
        year: Number(form.get('year')),
      },
    };

    const resultEl = document.getElementById('applyResult');
    resultEl.textContent = '';

    try {
      const { permit } = await apiRequest('/permits', { method: 'POST', body: payload, auth: true });
      if (permit.status === 'approved') {
        showFlash(`Permit approved! Permit number: ${permit.permitNumber}`, 'success');
      } else {
        showFlash(`Application rejected: ${permit.rejectionReason}`, 'error');
      }
      e.target.reset();
    } catch (err) {
      const details = (err.details || []).map((d) => `${d.field}: ${d.message}`).join(' | ');
      showFlash(details ? `${err.message} (${details})` : err.message, 'error');
    }
  });

  // --- Dashboard ---
  async function loadMyPermits() {
    const el = document.getElementById('permitsList');
    el.textContent = 'Loading…';
    try {
      const { permits } = await apiRequest('/permits/me', { auth: true });
      if (permits.length === 0) {
        el.textContent = 'No permit applications yet.';
        return;
      }
      el.innerHTML = permits.map(renderPermitCard).join('');
    } catch (err) {
      el.textContent = err.message;
    }
  }

  function renderPermitCard(permit) {
    const statusClass = permit.status === 'approved' ? 'status-approved' : 'status-rejected';
    const vehicle = permit.Vehicle || {};
    return `
      <div class="permit-card">
        <p><span class="${statusClass}">${permit.status.toUpperCase()}</span>
           ${permit.permitNumber ? ` &mdash; ${permit.permitNumber}` : ''}</p>
        <p>Vehicle: ${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''} (${vehicle.color || ''}), plate ${vehicle.plateNumber || ''}</p>
        ${permit.rejectionReason ? `<p>Reason: ${permit.rejectionReason}</p>` : ''}
        ${permit.expiresAt ? `<p>Expires: ${new Date(permit.expiresAt).toLocaleDateString()}</p>` : ''}
      </div>`;
  }

  // --- Admin ---
  async function loadAdminData() {
    const permitsEl = document.getElementById('adminPermitsList');
    const authEl = document.getElementById('adminAuthorizedList');
    permitsEl.textContent = 'Loading…';
    authEl.textContent = 'Loading…';
    try {
      const { permits } = await apiRequest('/admin/permits', { auth: true });
      permitsEl.innerHTML = permits.length
        ? permits.map(renderPermitCard).join('')
        : 'No permit requests yet.';
    } catch (err) {
      permitsEl.textContent = err.message;
    }
    try {
      const { authorizedUsers } = await apiRequest('/admin/authorized-users', { auth: true });
      authEl.innerHTML = authorizedUsers
        .map(
          (u) =>
            `<div class="permit-card">${u.email} &mdash; ${u.role} &mdash; ${u.isActive ? 'active' : 'inactive'}</div>`
        )
        .join('');
    } catch (err) {
      authEl.textContent = err.message;
    }
  }

  // Init
  refreshCurrentUser().then(() => showView(getToken() ? 'apply' : 'login'));
})();
