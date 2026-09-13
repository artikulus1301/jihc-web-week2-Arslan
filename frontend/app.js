document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('auth-modal');
  const loginForm = document.getElementById('form-login');
  const registerForm = document.getElementById('form-register');
  const usersTable = document.getElementById('users-tbody');

  function showModal() {
    modal.classList.remove('hidden');
  }

  function hideModal() {
    modal.classList.add('hidden');
  }

  function navigateTo(pageId) {
    document.querySelectorAll('.page-content').forEach(page => page.classList.add('hidden'));
    document.getElementById(`page-${pageId}`).classList.remove('hidden');
    if (pageId === 'users') loadUsers();
  }

  function switchTab(tab) {
    const loginTab = document.getElementById('tab-login-btn');
    const registerTab = document.getElementById('tab-register-btn');
    loginForm.classList.toggle('hidden', tab !== 'login');
    registerForm.classList.toggle('hidden', tab !== 'register');
    loginTab.className = tab === 'login' ? 'flex-1 py-2 font-semibold text-center border-b-2 border-indigo-600 text-indigo-600' : 'flex-1 py-2 font-semibold text-center border-b-2 border-transparent text-slate-400 hover:text-slate-600';
    registerTab.className = tab === 'register' ? 'flex-1 py-2 font-semibold text-center border-b-2 border-indigo-600 text-indigo-600' : 'flex-1 py-2 font-semibold text-center border-b-2 border-transparent text-slate-400 hover:text-slate-600';
  }

  async function sendUserRequest(url, username, password) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
    return result;
  }

  async function loadUsers() {
    usersTable.innerHTML = '<tr><td colspan="2" class="p-4 text-center text-slate-400">Загрузка...</td></tr>';
    try {
      const response = await fetch('/users');
      const users = await response.json();
      usersTable.innerHTML = users.length ? users.map((user, index) => `
        <tr class="hover:bg-slate-50 transition"><td class="p-4 text-slate-400 font-mono text-xs">${index + 1}</td><td class="p-4 font-medium text-slate-800">${escapeHtml(user.username)}</td></tr>
      `).join('') : '<tr><td colspan="2" class="p-4 text-center text-slate-400">Нет зарегистрированных пользователей</td></tr>';
    } catch (error) {
      usersTable.innerHTML = `<tr><td colspan="2" class="p-4 text-center text-red-500">${error.message}</td></tr>`;
    }
  }

  document.querySelectorAll('.nav-btn').forEach(button => button.addEventListener('click', () => navigateTo(button.dataset.page)));
  document.getElementById('open-modal-btn').addEventListener('click', showModal);
  document.getElementById('home-register-btn').addEventListener('click', () => { showModal(); switchTab('register'); });
  document.getElementById('close-modal-btn').addEventListener('click', hideModal);
  modal.addEventListener('click', event => { if (event.target === modal) hideModal(); });
  document.getElementById('tab-login-btn').addEventListener('click', () => switchTab('login'));
  document.getElementById('tab-register-btn').addEventListener('click', () => switchTab('register'));

  registerForm.addEventListener('submit', async event => {
    event.preventDefault();
    try {
      const result = await sendUserRequest('/register', document.getElementById('reg-username').value.trim(), document.getElementById('reg-password').value);
      alert(result.message);
      registerForm.reset();
      hideModal();
      navigateTo('users');
    } catch (error) {
      alert(error.message);
    }
  });

  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    try {
      const result = await sendUserRequest('/login', document.getElementById('login-username').value.trim(), document.getElementById('login-password').value);
      alert(`${result.message}, ${result.user.username}!`);
      loginForm.reset();
      hideModal();
    } catch (error) {
      alert(error.message);
    }
  });

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
});
