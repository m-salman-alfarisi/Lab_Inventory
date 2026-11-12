/**
 * Main Application Logic - Laboratory Inventory & Borrowing Management System
 * Role-based Access Control: ADMIN & STAFF
 */

const App = {
  currentUser: null,
  currentView: 'dashboard',
  returnModalTrxId: null,
  deleteItemModalId: null,

  init() {
    this.initTheme();
    DB.init();

    // Check existing session (persists after browser close)
    const savedSession = DB.getSession();
    if (savedSession) {
      const users = DB.getUsers();
      const freshUser = users.find(u => u.id === savedSession.id || u.username === savedSession.username);
      if (freshUser && freshUser.active) {
        this.currentUser = freshUser;
        DB.setSession(freshUser);
      } else {
        DB.setSession(null);
      }
    }

    // Pull latest from Supabase if configured
    DB.pullFromCloud().then(pulled => {
      if (pulled && this.currentUser) {
        this.renderAll();
      }
    });

    // Check URL parameter for 1-click demo login from Landing Page (?demo=ADMIN or ?demo=STAFF)
    const urlParams = new URLSearchParams(window.location.search);
    const demoRole = urlParams.get('demo');
    if (demoRole === 'ADMIN' || demoRole === 'STAFF') {
      const targetUsername = demoRole === 'ADMIN' ? 'admin' : 'staff';
      const demoUser = DB.getUsers().find(u => u.username === targetUsername && u.active);
      if (demoUser) {
        this.currentUser = demoUser;
        DB.setSession(demoUser);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    this.bindEvents();
    this.updateAuthUI();
  },

  initTheme() {
    const savedTheme = localStorage.getItem('simlab_theme');
    // Default to light mode unless explicitly set to 'dark'
    const isDark = savedTheme === 'dark';
    this.applyTheme(isDark);
  },

  toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    this.applyTheme(!isDark);
    localStorage.setItem('simlab_theme', !isDark ? 'dark' : 'light');
  },

  applyTheme(isDark) {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const iconClass = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    ['theme-toggle-icon-login', 'theme-toggle-icon-header', 'theme-toggle-icon-sidebar', 'theme-toggle-icon-landing'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.className = iconClass;
    });

    const statusText = document.getElementById('theme-status-text');
    if (statusText) statusText.textContent = isDark ? 'Dark' : 'Light';
  },

  isAdmin() {
    return this.currentUser && this.currentUser.role === 'ADMIN';
  },

  bindEvents() {
    // Login Form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }

    // Search & Filters - Inventory
    ['inv-search', 'inv-filter-category', 'inv-filter-status'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', () => this.renderInventoryTable());
    });

    // Borrowing Form
    const borrowForm = document.getElementById('borrow-form');
    if (borrowForm) {
      borrowForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleCreateBorrow();
      });
    }

    const borrowItemSelect = document.getElementById('borrow-item-id');
    if (borrowItemSelect) {
      borrowItemSelect.addEventListener('change', () => this.updateBorrowMaxStock());
    }

    // Search & Filters - Borrowing List
    ['borrow-search', 'borrow-filter-status'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', () => this.renderBorrowTable());
    });

    // Search - Return List
    const returnSearch = document.getElementById('return-search');
    if (returnSearch) {
      returnSearch.addEventListener('input', () => this.renderReturnTable());
    }

    // Search & Filters - History List
    ['history-search', 'history-filter-status'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', () => this.renderHistoryTable());
    });

    // Search - Users
    const userSearch = document.getElementById('user-search');
    if (userSearch) {
      userSearch.addEventListener('input', () => this.renderUsersTable());
    }

    // Item Modal Form
    const itemForm = document.getElementById('item-modal-form');
    if (itemForm) {
      itemForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveItem();
      });
    }

    // Return Confirmation Modal Form
    const returnModalForm = document.getElementById('return-modal-form');
    if (returnModalForm) {
      returnModalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleConfirmReturn();
      });
    }

    // User Modal Form
    const userModalForm = document.getElementById('user-modal-form');
    if (userModalForm) {
      userModalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveUser();
      });
    }

    // Cloud Sync Form
    const cloudForm = document.getElementById('cloud-modal-form');
    if (cloudForm) {
      cloudForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveCloudConfig();
      });
    }
  },

  // ==================== AUTHENTICATION ====================
  handleLogin() {
    const usernameInput = document.getElementById('login-username').value.trim();
    const passwordInput = document.getElementById('login-password').value;
    const errorBox = document.getElementById('login-error');
    const errorText = document.getElementById('login-error-text');

    const users = DB.getUsers();
    const user = users.find(
      u => (u.username.toLowerCase() === usernameInput.toLowerCase() || (u.email && u.email.toLowerCase() === usernameInput.toLowerCase())) && u.password === passwordInput
    );

    if (!user) {
      errorText.textContent = 'Username atau password tidak valid. Silakan periksa kembali.';
      errorBox.classList.remove('hidden');
      return;
    }

    if (!user.active) {
      errorText.textContent = 'Akun Staff ini sedang dinonaktifkan oleh Admin. Hubungi Administrator Lab.';
      errorBox.classList.remove('hidden');
      return;
    }

    errorBox.classList.add('hidden');
    this.currentUser = user;
    DB.setSession(user);
    DB.addActivity('AUTH', 'Login Pengguna', `${user.name} (${user.role}) berhasil login ke sistem`, user);

    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';

    this.currentView = 'dashboard';
    this.updateAuthUI();
    this.showToast(`Selamat datang, ${user.name}!`, 'success');
  },

  quickDemoLogin(roleType) {
    const usernameEl = document.getElementById('login-username');
    const passwordEl = document.getElementById('login-password');
    if (roleType === 'ADMIN') {
      usernameEl.value = 'admin';
      passwordEl.value = 'password123';
    } else {
      usernameEl.value = 'staff';
      passwordEl.value = 'password123';
    }
    this.handleLogin();
  },

  handleLogout() {
    if (this.currentUser) {
      DB.addActivity('AUTH', 'Logout Pengguna', `${this.currentUser.name} keluar dari sistem`, this.currentUser);
    }
    this.currentUser = null;
    DB.setSession(null);
    this.updateAuthUI();
    this.showToast('Anda telah berhasil logout.', 'info');
  },

  updateAuthUI() {
    const loginScreen = document.getElementById('login-screen');
    const appShell = document.getElementById('app-shell');

    if (!this.currentUser) {
      loginScreen.classList.remove('hidden');
      appShell.classList.add('hidden');
      return;
    }

    loginScreen.classList.add('hidden');
    appShell.classList.remove('hidden');

    // Set user profile info in sidebar & header
    const isAdm = this.isAdmin();
    document.getElementById('user-display-name').textContent = this.currentUser.name;
    document.getElementById('user-display-username').textContent = '@' + this.currentUser.username;

    const roleBadge = document.getElementById('user-role-badge');
    if (isAdm) {
      roleBadge.textContent = 'ADMIN';
      roleBadge.className = 'px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200';
    } else {
      roleBadge.textContent = 'STAFF LAB';
      roleBadge.className = 'px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200';
    }

    // Role-based UI visibility (.admin-only elements)
    document.querySelectorAll('.admin-only').forEach(el => {
      if (isAdm) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    });

    document.querySelectorAll('.staff-only-badge').forEach(el => {
      if (!isAdm) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    });

    // Default borrow date to today
    const todayStr = new Date().toISOString().split('T')[0];
    const borrowDateEl = document.getElementById('borrow-date');
    if (borrowDateEl && !borrowDateEl.value) {
      borrowDateEl.value = todayStr;
    }

    // If current view is users and user is not admin, redirect to dashboard
    if (this.currentView === 'users' && !isAdm) {
      this.currentView = 'dashboard';
    }

    this.navigate(this.currentView);
  },

  // ==================== NAVIGATION ====================
  navigate(viewName) {
    if (viewName === 'users' && !this.isAdmin()) {
      this.showToast('Akses ditolak: Halaman Manajemen Pengguna hanya untuk Admin.', 'error');
      return;
    }

    this.currentView = viewName;

    // Update nav buttons
    document.querySelectorAll('.nav-item').forEach(btn => {
      if (btn.dataset.view === viewName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Toggle sections
    document.querySelectorAll('.view-section').forEach(sec => {
      if (sec.id === `view-${viewName}`) {
        sec.classList.remove('hidden');
      } else {
        sec.classList.add('hidden');
      }
    });

    // Update page title & subtitle
    const titles = {
      dashboard: {
        title: this.isAdmin() ? 'Dashboard Administrator' : 'Dashboard Operasional Staff',
        subtitle: this.isAdmin()
          ? 'Ringkasan seluruh inventaris laboratorium, peminjaman aktif, dan aktivitas petugas'
          : 'Pantau ketersediaan alat laboratorium serta kelola transaksi peminjaman & pengembalian'
      },
      inventory: {
        title: this.isAdmin() ? 'Manajemen Inventaris Barang' : 'Daftar & Ketersediaan Barang Lab',
        subtitle: this.isAdmin()
          ? 'Kelola data peralatan laboratorium (Tambah, Ubah, Hapus, dan Pantau Stok)'
          : 'Lihat daftar peralatan laboratorium dan status ketersediaan stok saat ini (Mode Baca Staff)'
      },
      borrowing: {
        title: 'Manajemen Peminjaman Barang',
        subtitle: 'Catat transaksi peminjaman peralatan laboratorium dan pantau status peminjaman'
      },
      returning: {
        title: 'Pengembalian Barang Laboratorium',
        subtitle: 'Daftar barang yang sedang dipinjam dan pemrosesan pengembalian stok'
      },
      history: {
        title: 'Riwayat Peminjaman & Pengembalian',
        subtitle: 'Arsip lengkap seluruh transaksi peminjaman dan pengembalian peralatan laboratorium'
      },
      users: {
        title: 'Manajemen Akun Pengguna (Staff & Admin)',
        subtitle: 'Tambah akun Staff baru, ubah data pengguna, serta aktifkan atau nonaktifkan akses Staff'
      }
    };

    const meta = titles[viewName] || titles.dashboard;
    document.getElementById('page-title').textContent = meta.title;
    document.getElementById('page-subtitle').textContent = meta.subtitle;

    // Close mobile sidebar if open
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (sidebar && !sidebar.classList.contains('-translate-x-full')) {
      sidebar.classList.add('-translate-x-full');
      if (backdrop) backdrop.classList.add('hidden');
    }

    this.renderAll();
  },

  toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    sidebar.classList.toggle('-translate-x-full');
    backdrop.classList.toggle('hidden');
  },

  // ==================== RENDER ALL VIEWS ====================
  renderAll() {
    if (!this.currentUser) return;
    this.renderDashboard();
    this.renderInventoryTable();
    this.populateBorrowItemsDropdown();
    this.renderBorrowTable();
    this.renderReturnTable();
    this.renderHistoryTable();
    if (this.isAdmin()) {
      this.renderUsersTable();
    }
    this.updateSidebarBadges();
  },

  updateSidebarBadges() {
    const transactions = DB.getTransactions();
    const activeBorrows = transactions.filter(t => t.status === 'Dipinjam').length;
    const badgeEl = document.getElementById('nav-return-badge');
    if (badgeEl) {
      badgeEl.textContent = activeBorrows;
      if (activeBorrows > 0) {
        badgeEl.classList.remove('hidden');
      } else {
        badgeEl.classList.add('hidden');
      }
    }
  },

  // ==================== 1. DASHBOARD ====================
  renderDashboard() {
    const items = DB.getItems();
    const transactions = DB.getTransactions();
    const activities = DB.getActivities();
    const users = DB.getUsers();

    // Calculate metrics
    const totalTypes = items.length;
    const availableUnits = items.reduce((sum, item) => sum + Number(item.stock || 0), 0);
    const activeTransactions = transactions.filter(t => t.status === 'Dipinjam');
    const borrowedUnits = activeTransactions.reduce((sum, t) => sum + Number(t.quantity || 0), 0);
    const totalPhysicalUnits = availableUnits + borrowedUnits;
    const totalTransactionsCount = transactions.length;
    const completedTransactionsCount = transactions.filter(t => t.status === 'Selesai').length;

    // Update Stat Cards
    document.getElementById('stat-total-items').textContent = totalTypes;
    document.getElementById('stat-total-units-sub').textContent = `${totalPhysicalUnits} total unit fisik (${totalTypes} jenis barang)`;

    document.getElementById('stat-available-items').textContent = availableUnits;
    const outOfStockCount = items.filter(i => Number(i.stock) === 0).length;
    document.getElementById('stat-available-sub').textContent =
      outOfStockCount > 0 ? `${outOfStockCount} jenis barang habis` : 'Semua jenis barang tersedia';

    document.getElementById('stat-borrowed-items').textContent = borrowedUnits;
    document.getElementById('stat-borrowed-sub').textContent = `${activeTransactions.length} transaksi sedang berjalan`;

    document.getElementById('stat-total-trx').textContent = totalTransactionsCount;
    document.getElementById('stat-total-trx-sub').textContent = `${completedTransactionsCount} selesai • ${activeTransactions.length} aktif`;

    // Role Banner on Dashboard
    const roleBanner = document.getElementById('dashboard-role-info');
    if (roleBanner) {
      if (this.isAdmin()) {
        const staffCount = users.filter(u => u.role === 'STAFF').length;
        const activeStaffCount = users.filter(u => u.role === 'STAFF' && u.active).length;
        roleBanner.innerHTML = `
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-sm">
            <div class="flex items-start sm:items-center gap-4">
              <div class="w-11 h-11 rounded-lg bg-slate-800 border border-slate-700 text-blue-400 flex items-center justify-center shrink-0">
                <i class="fa-solid fa-shield-halved text-lg"></i>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-[10px] uppercase font-mono font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">Administrator</span>
                  <span class="text-xs text-slate-400">• Akses Master Data</span>
                </div>
                <h3 class="text-base font-bold mt-1 text-white">Selamat bertugas, ${this.escapeHtml(this.currentUser.name)}</h3>
                <p class="text-xs text-slate-400">Akses penuh ke manajemen inventaris barang, transaksi peminjaman, dan ${staffCount} akun staff (${activeStaffCount} aktif).</p>
              </div>
            </div>
            <div class="flex flex-wrap gap-2 shrink-0">
              <button onclick="App.navigate('inventory'); App.openItemModal();" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition flex items-center gap-1.5">
                <i class="fa-solid fa-plus text-xs"></i> Tambah Barang
              </button>
              <button onclick="App.navigate('users'); App.openUserModal();" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-lg transition flex items-center gap-1.5">
                <i class="fa-solid fa-user-plus text-xs"></i> Kelola Staff
              </button>
            </div>
          </div>
        `;
      } else {
        roleBanner.innerHTML = `
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-sm">
            <div class="flex items-start sm:items-center gap-4">
              <div class="w-11 h-11 rounded-lg bg-slate-800 border border-slate-700 text-emerald-400 flex items-center justify-center shrink-0">
                <i class="fa-solid fa-user-check text-lg"></i>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-[10px] uppercase font-mono font-bold bg-slate-800 text-emerald-400 px-2 py-0.5 rounded border border-slate-700">Staff Petugas</span>
                  <span class="text-xs text-slate-400">• Operasional Laboratorium</span>
                </div>
                <h3 class="text-base font-bold mt-1 text-white">Selamat bertugas, ${this.escapeHtml(this.currentUser.name)}</h3>
                <p class="text-xs text-slate-400">Pencatatan peminjaman, pengembalian barang, dan monitoring ketersediaan peralatan.</p>
              </div>
            </div>
            <div class="flex flex-wrap gap-2 shrink-0">
              <button onclick="App.navigate('borrowing')" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition flex items-center gap-1.5">
                <i class="fa-solid fa-hand-holding-hand text-xs"></i> Catat Peminjaman
              </button>
              <button onclick="App.navigate('returning')" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-lg transition flex items-center gap-1.5">
                <i class="fa-solid fa-rotate-left text-xs"></i> Pengembalian
              </button>
            </div>
          </div>
        `;
      }
    }

    // Quick Stock Status Table on Dashboard
    const stockSummaryBody = document.getElementById('dashboard-stock-tbody');
    if (stockSummaryBody) {
      stockSummaryBody.innerHTML = items.slice(0, 7).map(item => {
        const borrowedQty = activeTransactions
          .filter(t => t.itemId === item.id || t.itemCode === item.code)
          .reduce((s, t) => s + Number(t.quantity), 0);
        const badge = this.getStockStatusBadge(item.stock);
        return `
          <tr class="hover:bg-slate-50/80 transition">
            <td class="px-4 py-3 font-mono text-xs font-semibold text-blue-600">${this.escapeHtml(item.code)}</td>
            <td class="px-4 py-3">
              <div class="font-medium text-slate-800 text-sm">${this.escapeHtml(item.name)}</div>
              <div class="text-xs text-slate-400">${this.escapeHtml(item.category)}</div>
            </td>
            <td class="px-4 py-3 text-center font-bold text-slate-800">${item.stock}</td>
            <td class="px-4 py-3 text-center text-amber-600 font-semibold">${borrowedQty}</td>
            <td class="px-4 py-3 text-right">${badge}</td>
          </tr>
        `;
      }).join('');
    }

    // Recent Activities Feed on Dashboard
    const activityListEl = document.getElementById('dashboard-activity-list');
    if (activityListEl) {
      if (activities.length === 0) {
        activityListEl.innerHTML = `<p class="text-sm text-slate-400 text-center py-6">Belum ada aktivitas tercatat.</p>`;
      } else {
        activityListEl.innerHTML = activities.slice(0, 7).map(act => {
          let icon = 'fa-circle-info text-blue-500 bg-blue-50';
          if (act.type === 'BORROW') icon = 'fa-arrow-up-from-bracket text-amber-600 bg-amber-50';
          if (act.type === 'RETURN') icon = 'fa-circle-check text-emerald-600 bg-emerald-50';
          if (act.type === 'ITEM') icon = 'fa-boxes-stacked text-indigo-600 bg-indigo-50';
          if (act.type === 'USER') icon = 'fa-user-shield text-purple-600 bg-purple-50';
          if (act.type === 'AUTH') icon = 'fa-key text-slate-600 bg-slate-100';

          return `
            <div class="flex items-start gap-3.5 py-3 border-b border-slate-100 last:border-0">
              <div class="w-9 h-9 rounded-xl ${icon} flex items-center justify-center shrink-0 mt-0.5">
                <i class="fa-solid ${icon.split(' ')[0]} text-sm"></i>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2">
                  <p class="text-sm font-semibold text-slate-800 truncate">${this.escapeHtml(act.title)}</p>
                  <span class="text-[11px] text-slate-400 shrink-0">${this.formatRelativeTime(act.timestamp)}</span>
                </div>
                <p class="text-xs text-slate-600 mt-0.5 leading-relaxed">${this.escapeHtml(act.description)}</p>
                <div class="flex items-center gap-1.5 mt-1">
                  <span class="text-[11px] font-medium text-slate-400">Oleh: <strong class="text-slate-600">${this.escapeHtml(act.actor)}</strong></span>
                  <span class="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-semibold">${this.escapeHtml(act.role || '')}</span>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Recent Transactions Table on Dashboard
    const recentTrxBody = document.getElementById('dashboard-recent-trx-tbody');
    if (recentTrxBody) {
      const sortedTrx = [...transactions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
      if (sortedTrx.length === 0) {
        recentTrxBody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-slate-400 text-sm">Belum ada transaksi peminjaman.</td></tr>`;
      } else {
        recentTrxBody.innerHTML = sortedTrx.map(trx => `
          <tr class="hover:bg-slate-50/80 transition">
            <td class="px-4 py-3 font-mono text-xs font-semibold text-slate-600">${this.escapeHtml(trx.id)}</td>
            <td class="px-4 py-3">
              <div class="text-sm font-medium text-slate-800">${this.escapeHtml(trx.borrowerName)}</div>
              <div class="text-xs text-slate-400">${this.escapeHtml(trx.purpose || '-')}</div>
            </td>
            <td class="px-4 py-3">
              <span class="font-mono text-xs text-blue-600 font-semibold">[${this.escapeHtml(trx.itemCode)}]</span>
              <span class="text-sm text-slate-700 font-medium">${this.escapeHtml(trx.itemName)}</span>
            </td>
            <td class="px-4 py-3 text-center font-bold text-slate-800">${trx.quantity} unit</td>
            <td class="px-4 py-3 text-xs text-slate-600">${this.formatDate(trx.borrowDate)}</td>
            <td class="px-4 py-3 text-right">${this.getTransactionStatusBadge(trx.status)}</td>
          </tr>
        `).join('');
      }
    }
  },

  // ==================== 2. MANAJEMEN BARANG (INVENTORY) ====================
  renderInventoryTable() {
    const items = DB.getItems();
    const transactions = DB.getTransactions();
    const activeTrx = transactions.filter(t => t.status === 'Dipinjam');

    const searchQuery = (document.getElementById('inv-search')?.value || '').trim().toLowerCase();
    const categoryFilter = document.getElementById('inv-filter-category')?.value || 'ALL';
    const statusFilter = document.getElementById('inv-filter-status')?.value || 'ALL';

    // Populate Category Filter dynamically if needed
    const catSelect = document.getElementById('inv-filter-category');
    if (catSelect && catSelect.options.length <= 1) {
      const categories = [...new Set(items.map(i => i.category))].sort();
      categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        catSelect.appendChild(opt);
      });
    }

    const filtered = items.filter(item => {
      const matchesSearch =
        item.code.toLowerCase().includes(searchQuery) ||
        item.name.toLowerCase().includes(searchQuery) ||
        item.category.toLowerCase().includes(searchQuery) ||
        (item.location || '').toLowerCase().includes(searchQuery);

      const matchesCat = categoryFilter === 'ALL' || item.category === categoryFilter;

      let matchesStatus = true;
      const stockNum = Number(item.stock);
      if (statusFilter === 'AVAILABLE') matchesStatus = stockNum > 0;
      else if (statusFilter === 'LOW') matchesStatus = stockNum > 0 && stockNum <= 3;
      else if (statusFilter === 'EMPTY') matchesStatus = stockNum === 0;

      return matchesSearch && matchesCat && matchesStatus;
    });

    const countEl = document.getElementById('inv-count-label');
    if (countEl) {
      countEl.textContent = `Menampilkan ${filtered.length} dari ${items.length} jenis peralatan laboratorium`;
    }

    const tbody = document.getElementById('inventory-tbody');
    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="px-6 py-12 text-center">
            <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <i class="fa-solid fa-box-open text-xl"></i>
            </div>
            <p class="text-slate-600 font-medium">Tidak ada data barang yang cocok dengan pencarian</p>
            <p class="text-xs text-slate-400 mt-1">Coba kata kunci atau filter kategori lain.</p>
          </td>
        </tr>
      `;
      return;
    }

    const isAdm = this.isAdmin();

    tbody.innerHTML = filtered.map(item => {
      const borrowedQty = activeTrx
        .filter(t => t.itemId === item.id || t.itemCode === item.code)
        .reduce((s, t) => s + Number(t.quantity), 0);

      const statusBadge = this.getStockStatusBadge(item.stock);

      const actionButtons = isAdm
        ? `
          <div class="flex items-center justify-end gap-1.5">
            <button onclick="App.openItemModal('${item.id}')" title="Edit Barang" class="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-semibold transition flex items-center gap-1">
              <i class="fa-solid fa-pen-to-square"></i> Edit
            </button>
            <button onclick="App.confirmDeleteItem('${item.id}')" title="Hapus Barang" class="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-semibold transition flex items-center gap-1">
              <i class="fa-solid fa-trash-can"></i> Hapus
            </button>
          </div>
        `
        : `
          <div class="flex items-center justify-end">
            ${Number(item.stock) > 0
              ? `<button onclick="App.quickBorrowItem('${item.id}')" class="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold transition flex items-center gap-1">
                  <i class="fa-solid fa-hand-holding-hand"></i> Pinjamkan
                 </button>`
              : `<span class="text-xs text-slate-400 italic">Stok Kosong</span>`
            }
          </div>
        `;

      return `
        <tr class="hover:bg-slate-50/90 transition border-b border-slate-100 last:border-0">
          <td class="px-4 py-3.5 font-mono text-xs font-bold text-blue-600">${this.escapeHtml(item.code)}</td>
          <td class="px-4 py-3.5">
            <div class="font-semibold text-slate-800 text-sm">${this.escapeHtml(item.name)}</div>
            <div class="text-xs text-slate-400 md:hidden">${this.escapeHtml(item.category)}</div>
          </td>
          <td class="px-4 py-3.5 hidden md:table-cell">
            <span class="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">${this.escapeHtml(item.category)}</span>
          </td>
          <td class="px-4 py-3.5 hidden lg:table-cell text-xs text-slate-600">
            <div><i class="fa-solid fa-location-dot text-slate-400 mr-1"></i> ${this.escapeHtml(item.location || 'Lab Utama')}</div>
            <div class="text-[11px] text-slate-400 mt-0.5">Kondisi: ${this.escapeHtml(item.condition || 'Baik')}</div>
          </td>
          <td class="px-4 py-3.5 text-center">
            <span class="text-base font-extrabold ${Number(item.stock) === 0 ? 'text-rose-600' : 'text-slate-800'}">${item.stock}</span>
            <span class="text-xs text-slate-400 block">unit</span>
          </td>
          <td class="px-4 py-3.5 text-center hidden sm:table-cell">
            <span class="text-sm font-bold ${borrowedQty > 0 ? 'text-amber-600' : 'text-slate-400'}">${borrowedQty}</span>
            <span class="text-xs text-slate-400 block">unit</span>
          </td>
          <td class="px-4 py-3.5 text-center">${statusBadge}</td>
          <td class="px-4 py-3.5 text-right">${actionButtons}</td>
        </tr>
      `;
    }).join('');
  },

  openItemModal(itemId = null) {
    if (!this.isAdmin()) {
      this.showToast('Akses ditolak: Hanya Admin yang dapat menambah atau mengubah data barang!', 'error');
      return;
    }

    const modal = document.getElementById('item-modal');
    const title = document.getElementById('item-modal-title');
    const idInput = document.getElementById('item-modal-id');
    const codeInput = document.getElementById('item-modal-code');
    const nameInput = document.getElementById('item-modal-name');
    const catInput = document.getElementById('item-modal-category');
    const stockInput = document.getElementById('item-modal-stock');
    const locInput = document.getElementById('item-modal-location');
    const condInput = document.getElementById('item-modal-condition');

    const items = DB.getItems();

    if (itemId) {
      const existing = items.find(i => i.id === itemId);
      if (!existing) return;
      title.textContent = 'Edit Data Barang Inventaris';
      idInput.value = existing.id;
      codeInput.value = existing.code;
      nameInput.value = existing.name;
      catInput.value = existing.category;
      stockInput.value = existing.stock;
      locInput.value = existing.location || 'Rak Lab';
      condInput.value = existing.condition || 'Baik';
    } else {
      title.textContent = 'Tambah Barang Inventaris Baru';
      idInput.value = '';
      // Generate next BR code automatically
      const maxNum = items.reduce((max, item) => {
        const match = item.code.match(/^BR(\d+)$/i);
        return match ? Math.max(max, parseInt(match[1], 10)) : max;
      }, 0);
      codeInput.value = 'BR' + String(maxNum + 1).padStart(3, '0');
      nameInput.value = '';
      catInput.value = 'Laptop';
      stockInput.value = 5;
      locInput.value = 'Rak A-01';
      condInput.value = 'Baik';
    }

    modal.classList.remove('hidden');
  },

  closeItemModal() {
    document.getElementById('item-modal').classList.add('hidden');
  },

  handleSaveItem() {
    if (!this.isAdmin()) {
      this.showToast('Akses ditolak: Staff tidak diizinkan mengubah data barang.', 'error');
      return;
    }

    const id = document.getElementById('item-modal-id').value;
    const code = document.getElementById('item-modal-code').value.trim().toUpperCase();
    const name = document.getElementById('item-modal-name').value.trim();
    const category = document.getElementById('item-modal-category').value.trim();
    const stock = parseInt(document.getElementById('item-modal-stock').value, 10);
    const location = document.getElementById('item-modal-location').value.trim();
    const condition = document.getElementById('item-modal-condition').value;

    if (!code || !name || isNaN(stock) || stock < 0) {
      this.showToast('Mohon lengkapi kode, nama barang, dan jumlah stok yang valid (>= 0).', 'error');
      return;
    }

    const items = DB.getItems();
    const duplicateCode = items.find(i => i.code.toUpperCase() === code && i.id !== id);
    if (duplicateCode) {
      this.showToast(`Kode barang "${code}" sudah digunakan oleh ${duplicateCode.name}!`, 'error');
      return;
    }

    if (id) {
      const idx = items.findIndex(i => i.id === id);
      if (idx === -1) return;
      items[idx] = {
        ...items[idx],
        code,
        name,
        category,
        stock,
        location,
        condition
      };
      DB.saveItems(items);
      DB.addActivity('ITEM', 'Perubahan Data Barang', `Data barang [${code}] ${name} diperbarui (Stok: ${stock})`, this.currentUser);
      this.showToast(`Barang [${code}] ${name} berhasil diperbarui!`, 'success');
    } else {
      const newItem = {
        id: 'item-' + Date.now(),
        code,
        name,
        category,
        stock,
        location: location || 'Rak Lab',
        condition: condition || 'Baik',
        createdAt: new Date().toISOString()
      };
      items.push(newItem);
      DB.saveItems(items);
      DB.addActivity('ITEM', 'Penambahan Barang Baru', `Menambahkan barang baru [${code}] ${name} dengan stok awal ${stock} unit`, this.currentUser);
      this.showToast(`Barang baru [${code}] ${name} berhasil ditambahkan!`, 'success');
    }

    // Refresh category dropdown options
    const catSelect = document.getElementById('inv-filter-category');
    if (catSelect) {
      catSelect.innerHTML = '<option value="ALL">Semua Kategori</option>';
    }

    this.closeItemModal();
    this.renderAll();
  },

  confirmDeleteItem(itemId) {
    if (!this.isAdmin()) {
      this.showToast('Akses ditolak: Staff tidak diperbolehkan menghapus data barang!', 'error');
      return;
    }

    const items = DB.getItems();
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const activeBorrows = DB.getTransactions().filter(
      t => (t.itemId === item.id || t.itemCode === item.code) && t.status === 'Dipinjam'
    );

    if (activeBorrows.length > 0) {
      this.showToast(`Barang [${item.code}] ${item.name} sedang dipinjam (${activeBorrows.length} transaksi aktif). Selesaikan pengembalian terlebih dahulu!`, 'error');
      return;
    }

    this.deleteItemModalId = itemId;
    document.getElementById('delete-item-name').textContent = `[${item.code}] ${item.name}`;
    document.getElementById('delete-item-modal').classList.remove('hidden');
  },

  closeDeleteItemModal() {
    this.deleteItemModalId = null;
    document.getElementById('delete-item-modal').classList.add('hidden');
  },

  executeDeleteItem() {
    if (!this.isAdmin() || !this.deleteItemModalId) return;
    const items = DB.getItems();
    const target = items.find(i => i.id === this.deleteItemModalId);
    if (!target) return;

    const updated = items.filter(i => i.id !== this.deleteItemModalId);
    DB.saveItems(updated);
    DB.addActivity('ITEM', 'Penghapusan Data Barang', `Menghapus barang [${target.code}] ${target.name} dari inventaris`, this.currentUser);

    this.closeDeleteItemModal();
    this.renderAll();
    this.showToast(`Barang [${target.code}] ${target.name} telah dihapus.`, 'info');
  },

  quickBorrowItem(itemId) {
    this.navigate('borrowing');
    const select = document.getElementById('borrow-item-id');
    if (select) {
      select.value = itemId;
      this.updateBorrowMaxStock();
      document.getElementById('borrower-name')?.focus();
    }
  },

  // ==================== 3. MANAJEMEN PEMINJAMAN ====================
  populateBorrowItemsDropdown() {
    const select = document.getElementById('borrow-item-id');
    if (!select) return;

    const currentVal = select.value;
    const items = DB.getItems();

    select.innerHTML = '<option value="">-- Pilih Peralatan Laboratorium --</option>';
    items.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.id;
      const stockNum = Number(item.stock);
      if (stockNum <= 0) {
        opt.disabled = true;
        opt.textContent = `[${item.code}] ${item.name} — (STOK HABIS)`;
      } else {
        opt.textContent = `[${item.code}] ${item.name} — Tersedia: ${stockNum} unit`;
      }
      select.appendChild(opt);
    });

    if (currentVal && items.some(i => i.id === currentVal && Number(i.stock) > 0)) {
      select.value = currentVal;
    }
    this.updateBorrowMaxStock();
  },

  updateBorrowMaxStock() {
    const select = document.getElementById('borrow-item-id');
    const qtyInput = document.getElementById('borrow-quantity');
    const helper = document.getElementById('borrow-stock-helper');
    if (!select || !qtyInput || !helper) return;

    const selectedId = select.value;
    if (!selectedId) {
      qtyInput.max = '';
      helper.textContent = 'Pilih barang terlebih dahulu untuk melihat batas stok.';
      helper.className = 'text-xs text-slate-400 mt-1';
      return;
    }

    const item = DB.getItems().find(i => i.id === selectedId);
    if (!item) return;

    qtyInput.max = item.stock;
    if (parseInt(qtyInput.value, 10) > item.stock) {
      qtyInput.value = item.stock;
    }
    helper.textContent = `Stok tersedia saat ini: ${item.stock} unit (${item.location || 'Lab'})`;
    helper.className = 'text-xs text-emerald-600 font-medium mt-1';
  },

  handleCreateBorrow() {
    const borrowerName = document.getElementById('borrower-name').value.trim();
    const borrowerContact = document.getElementById('borrower-contact').value.trim();
    const purpose = document.getElementById('borrow-purpose').value.trim();
    const itemId = document.getElementById('borrow-item-id').value;
    const quantity = parseInt(document.getElementById('borrow-quantity').value, 10);
    const borrowDate = document.getElementById('borrow-date').value;

    if (!borrowerName || !itemId || isNaN(quantity) || quantity <= 0 || !borrowDate) {
      this.showToast('Mohon lengkapi nama peminjam, barang, jumlah unit, dan tanggal peminjaman.', 'error');
      return;
    }

    const items = DB.getItems();
    const itemIdx = items.findIndex(i => i.id === itemId);
    if (itemIdx === -1) {
      this.showToast('Barang tidak ditemukan di inventaris.', 'error');
      return;
    }

    const item = items[itemIdx];
    if (quantity > Number(item.stock)) {
      this.showToast(`Stok tidak mencukupi! Stok ${item.name} hanya tersisa ${item.stock} unit.`, 'error');
      return;
    }

    // Kurangi stok barang
    items[itemIdx].stock = Number(item.stock) - quantity;
    DB.saveItems(items);

    // Buat ID Transaksi unik
    const dateCompact = borrowDate.replace(/-/g, '');
    const transactions = DB.getTransactions();
    const seq = String(transactions.length + 1).padStart(3, '0');
    const trxId = `TRX-${dateCompact}-${seq}`;

    const newTrx = {
      id: trxId,
      borrowerName,
      borrowerContact: borrowerContact || '-',
      purpose: purpose || 'Kegiatan Praktikum / Lab',
      itemId: item.id,
      itemCode: item.code,
      itemName: item.name,
      itemCategory: item.category,
      quantity,
      borrowDate,
      returnDate: null,
      status: 'Dipinjam',
      handledBy: this.currentUser.name,
      returnedTo: null,
      returnNote: '',
      createdAt: new Date().toISOString()
    };

    transactions.unshift(newTrx);
    DB.saveTransactions(transactions);

    DB.addActivity(
      'BORROW',
      'Peminjaman Barang Baru',
      `${borrowerName} meminjam ${quantity} unit ${item.name} (${item.code})`,
      this.currentUser
    );

    // Reset form
    document.getElementById('borrower-name').value = '';
    document.getElementById('borrower-contact').value = '';
    document.getElementById('borrow-purpose').value = '';
    document.getElementById('borrow-item-id').value = '';
    document.getElementById('borrow-quantity').value = 1;

    this.renderAll();
    this.showToast(`Transaksi ${trxId} berhasil disimpan! Stok ${item.name} berkurang ${quantity} unit.`, 'success');
  },

  renderBorrowTable() {
    const tbody = document.getElementById('borrow-tbody');
    if (!tbody) return;

    const search = (document.getElementById('borrow-search')?.value || '').trim().toLowerCase();
    const statusFilter = document.getElementById('borrow-filter-status')?.value || 'ALL';

    const transactions = DB.getTransactions();
    const filtered = transactions.filter(t => {
      const matchText =
        t.id.toLowerCase().includes(search) ||
        t.borrowerName.toLowerCase().includes(search) ||
        t.itemCode.toLowerCase().includes(search) ||
        t.itemName.toLowerCase().includes(search) ||
        (t.purpose || '').toLowerCase().includes(search);
      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      return matchText && matchStatus;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="px-6 py-10 text-center text-slate-400 text-sm">
            Tidak ada data transaksi peminjaman yang sesuai filter.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(trx => `
      <tr class="hover:bg-slate-50/90 transition border-b border-slate-100 last:border-0">
        <td class="px-4 py-3.5">
          <div class="font-mono text-xs font-bold text-slate-700">${this.escapeHtml(trx.id)}</div>
          <div class="text-[11px] text-slate-400 mt-0.5">Petugas: ${this.escapeHtml(trx.handledBy)}</div>
        </td>
        <td class="px-4 py-3.5">
          <div class="font-semibold text-slate-800 text-sm">${this.escapeHtml(trx.borrowerName)}</div>
          <div class="text-xs text-slate-500">${this.escapeHtml(trx.purpose || '-')} ${trx.borrowerContact && trx.borrowerContact !== '-' ? '• ' + this.escapeHtml(trx.borrowerContact) : ''}</div>
        </td>
        <td class="px-4 py-3.5">
          <span class="font-mono text-xs font-bold text-blue-600">[${this.escapeHtml(trx.itemCode)}]</span>
          <span class="text-sm font-medium text-slate-800 ml-1">${this.escapeHtml(trx.itemName)}</span>
        </td>
        <td class="px-4 py-3.5 text-center font-bold text-slate-800">${trx.quantity} unit</td>
        <td class="px-4 py-3.5 text-xs text-slate-600">
          <div>Pinjam: <strong>${this.formatDate(trx.borrowDate)}</strong></div>
          ${trx.returnDate ? `<div class="text-emerald-600 mt-0.5">Kembali: <strong>${this.formatDate(trx.returnDate)}</strong></div>` : ''}
        </td>
        <td class="px-4 py-3.5 text-center">${this.getTransactionStatusBadge(trx.status)}</td>
        <td class="px-4 py-3.5 text-right">
          ${trx.status === 'Dipinjam'
            ? `<button onclick="App.openReturnModal('${trx.id}')" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition inline-flex items-center gap-1.5">
                <i class="fa-solid fa-rotate-left"></i> Kembalikan
               </button>`
            : `<span class="text-xs text-slate-400"><i class="fa-solid fa-check-double text-emerald-500 mr-1"></i>Selesai</span>`
          }
        </td>
      </tr>
    `).join('');
  },

  // ==================== 4. PENGEMBALIAN BARANG ====================
  renderReturnTable() {
    const tbody = document.getElementById('return-tbody');
    if (!tbody) return;

    const search = (document.getElementById('return-search')?.value || '').trim().toLowerCase();
    const activeTrx = DB.getTransactions().filter(t => t.status === 'Dipinjam');

    const totalActiveUnits = activeTrx.reduce((sum, t) => sum + Number(t.quantity), 0);
    const activeCountBanner = document.getElementById('return-active-summary');
    if (activeCountBanner) {
      activeCountBanner.textContent = `${activeTrx.length} Transaksi Aktif (${totalActiveUnits} Unit Sedang Dipinjam)`;
    }

    const filtered = activeTrx.filter(t =>
      t.id.toLowerCase().includes(search) ||
      t.borrowerName.toLowerCase().includes(search) ||
      t.itemCode.toLowerCase().includes(search) ||
      t.itemName.toLowerCase().includes(search)
    );

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="px-6 py-12 text-center">
            <div class="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <i class="fa-solid fa-circle-check text-2xl"></i>
            </div>
            <p class="text-slate-700 font-semibold">Tidak ada tanggungan peminjaman aktif yang ditemukan</p>
            <p class="text-xs text-slate-400 mt-1">Seluruh barang yang dipinjam telah dikembalikan atau belum ada peminjaman baru.</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(trx => `
      <tr class="hover:bg-slate-50/90 transition border-b border-slate-100 last:border-0">
        <td class="px-4 py-4 font-mono text-xs font-bold text-slate-700">${this.escapeHtml(trx.id)}</td>
        <td class="px-4 py-4">
          <div class="font-semibold text-slate-800 text-sm">${this.escapeHtml(trx.borrowerName)}</div>
          <div class="text-xs text-slate-500">${this.escapeHtml(trx.borrowerContact || '-')} • ${this.escapeHtml(trx.purpose || '')}</div>
        </td>
        <td class="px-4 py-4">
          <div class="font-medium text-slate-800 text-sm">
            <span class="font-mono text-xs font-bold text-blue-600">[${this.escapeHtml(trx.itemCode)}]</span>
            ${this.escapeHtml(trx.itemName)}
          </div>
          <div class="text-xs text-slate-400">${this.escapeHtml(trx.itemCategory || '')}</div>
        </td>
        <td class="px-4 py-4 text-center">
          <span class="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-bold text-sm border border-amber-200">${trx.quantity} unit</span>
        </td>
        <td class="px-4 py-4 text-xs text-slate-600">
          <div class="font-medium text-slate-700">${this.formatDate(trx.borrowDate)}</div>
          <div class="text-[11px] text-slate-400">Oleh: ${this.escapeHtml(trx.handledBy)}</div>
        </td>
        <td class="px-4 py-4 text-center">${this.getTransactionStatusBadge(trx.status)}</td>
        <td class="px-4 py-4 text-right">
          <button onclick="App.openReturnModal('${trx.id}')" class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition inline-flex items-center gap-1.5">
            <i class="fa-solid fa-box-archive"></i> Proses Pengembalian
          </button>
        </td>
      </tr>
    `).join('');
  },

  openReturnModal(trxId) {
    const trx = DB.getTransactions().find(t => t.id === trxId);
    if (!trx || trx.status !== 'Dipinjam') return;

    this.returnModalTrxId = trxId;
    document.getElementById('return-modal-trx-id').textContent = trx.id;
    document.getElementById('return-modal-borrower').textContent = trx.borrowerName;
    document.getElementById('return-modal-item').textContent = `[${trx.itemCode}] ${trx.itemName}`;
    document.getElementById('return-modal-qty').textContent = `${trx.quantity} unit`;
    document.getElementById('return-modal-borrow-date').textContent = this.formatDate(trx.borrowDate);
    document.getElementById('return-modal-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('return-modal-note').value = 'Dikembalikan lengkap dan berfungsi baik';

    document.getElementById('return-modal').classList.remove('hidden');
  },

  closeReturnModal() {
    this.returnModalTrxId = null;
    document.getElementById('return-modal').classList.add('hidden');
  },

  handleConfirmReturn() {
    if (!this.returnModalTrxId) return;

    const returnDate = document.getElementById('return-modal-date').value;
    const returnNote = document.getElementById('return-modal-note').value.trim();

    const transactions = DB.getTransactions();
    const trxIdx = transactions.findIndex(t => t.id === this.returnModalTrxId);
    if (trxIdx === -1) return;

    const trx = transactions[trxIdx];
    if (trx.status === 'Selesai') {
      this.closeReturnModal();
      return;
    }

    // 1. Update status transaksi menjadi Selesai
    transactions[trxIdx] = {
      ...trx,
      status: 'Selesai',
      returnDate: returnDate || new Date().toISOString().split('T')[0],
      returnedTo: this.currentUser.name,
      returnNote: returnNote || 'Dikembalikan dalam kondisi baik'
    };
    DB.saveTransactions(transactions);

    // 2. Perbarui (tambahkan kembali) jumlah stok barang
    const items = DB.getItems();
    const itemIdx = items.findIndex(i => i.id === trx.itemId || i.code === trx.itemCode);
    if (itemIdx !== -1) {
      items[itemIdx].stock = Number(items[itemIdx].stock) + Number(trx.quantity);
      DB.saveItems(items);
    }

    // 3. Catat log aktivitas
    DB.addActivity(
      'RETURN',
      'Pengembalian Barang Selesai',
      `${trx.borrowerName} mengembalikan ${trx.quantity} unit ${trx.itemName} (${trx.itemCode}). Stok bertambah kembali.`,
      this.currentUser
    );

    this.closeReturnModal();
    this.renderAll();
    this.showToast(`Pengembalian ${trx.id} selesai! Stok [${trx.itemCode}] ${trx.itemName} bertambah +${trx.quantity} unit.`, 'success');
  },

  // ==================== 5. RIWAYAT TRANSAKSI ====================
  renderHistoryTable() {
    const tbody = document.getElementById('history-tbody');
    if (!tbody) return;

    const search = (document.getElementById('history-search')?.value || '').trim().toLowerCase();
    const statusFilter = document.getElementById('history-filter-status')?.value || 'ALL';

    const transactions = DB.getTransactions();
    const filtered = transactions.filter(t => {
      const matchSearch =
        t.id.toLowerCase().includes(search) ||
        t.borrowerName.toLowerCase().includes(search) ||
        t.itemCode.toLowerCase().includes(search) ||
        t.itemName.toLowerCase().includes(search) ||
        (t.handledBy || '').toLowerCase().includes(search) ||
        (t.returnedTo || '').toLowerCase().includes(search);
      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      return matchSearch && matchStatus;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="px-6 py-10 text-center text-slate-400 text-sm">Tidak ada riwayat transaksi yang ditemukan.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(trx => `
      <tr class="hover:bg-slate-50/90 transition border-b border-slate-100 last:border-0">
        <td class="px-4 py-3.5 font-mono text-xs font-bold text-slate-700">${this.escapeHtml(trx.id)}</td>
        <td class="px-4 py-3.5">
          <div class="font-semibold text-slate-800 text-sm">${this.escapeHtml(trx.borrowerName)}</div>
          <div class="text-xs text-slate-400">${this.escapeHtml(trx.purpose || '-')}</div>
        </td>
        <td class="px-4 py-3.5">
          <span class="font-mono text-xs font-bold text-blue-600">[${this.escapeHtml(trx.itemCode)}]</span>
          <span class="text-sm font-medium text-slate-800 ml-1">${this.escapeHtml(trx.itemName)}</span>
        </td>
        <td class="px-4 py-3.5 text-center font-bold text-slate-800">${trx.quantity}</td>
        <td class="px-4 py-3.5 text-xs text-slate-600">${this.formatDate(trx.borrowDate)}</td>
        <td class="px-4 py-3.5 text-xs text-slate-600">${trx.returnDate ? this.formatDate(trx.returnDate) : '<span class="text-amber-600 italic">Belum kembali</span>'}</td>
        <td class="px-4 py-3.5 text-xs text-slate-600">
          <div>Pinjam: ${this.escapeHtml(trx.handledBy || '-')}</div>
          ${trx.returnedTo ? `<div class="text-emerald-600">Terima: ${this.escapeHtml(trx.returnedTo)}</div>` : ''}
          ${trx.returnNote ? `<div class="text-[11px] text-slate-400 italic mt-0.5">"${this.escapeHtml(trx.returnNote)}"</div>` : ''}
        </td>
        <td class="px-4 py-3.5 text-center">${this.getTransactionStatusBadge(trx.status)}</td>
      </tr>
    `).join('');
  },

  exportTransactionsCSV() {
    const transactions = DB.getTransactions();
    const headers = ['ID Transaksi', 'Nama Peminjam', 'Kontak', 'Keperluan', 'Kode Barang', 'Nama Barang', 'Jumlah', 'Tanggal Pinjam', 'Tanggal Kembali', 'Status', 'Petugas Pinjam', 'Petugas Kembali', 'Catatan'];
    const rows = transactions.map(t => [
      t.id,
      `"${(t.borrowerName || '').replace(/"/g, '""')}"`,
      `"${(t.borrowerContact || '').replace(/"/g, '""')}"`,
      `"${(t.purpose || '').replace(/"/g, '""')}"`,
      t.itemCode,
      `"${(t.itemName || '').replace(/"/g, '""')}"`,
      t.quantity,
      t.borrowDate,
      t.returnDate || '-',
      t.status,
      `"${(t.handledBy || '').replace(/"/g, '""')}"`,
      `"${(t.returnedTo || '-').replace(/"/g, '""')}"`,
      `"${(t.returnNote || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `riwayat-peminjaman-lab-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('Laporan CSV berhasil diunduh!', 'success');
  },

  // ==================== 6. MANAJEMEN PENGGUNA (ADMIN ONLY) ====================
  renderUsersTable() {
    if (!this.isAdmin()) return;

    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;

    const search = (document.getElementById('user-search')?.value || '').trim().toLowerCase();
    const users = DB.getUsers();

    const filtered = users.filter(u =>
      u.name.toLowerCase().includes(search) ||
      u.username.toLowerCase().includes(search) ||
      u.role.toLowerCase().includes(search) ||
      (u.email || '').toLowerCase().includes(search)
    );

    tbody.innerHTML = filtered.map(u => {
      const isSelf = this.currentUser && this.currentUser.id === u.id;
      const roleBadge = u.role === 'ADMIN'
        ? `<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">ADMIN</span>`
        : `<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">STAFF</span>`;

      const statusBadge = u.active
        ? `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Aktif</span>`
        : `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200"><span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>Nonaktif</span>`;

      return `
        <tr class="hover:bg-slate-50/90 transition border-b border-slate-100 last:border-0">
          <td class="px-4 py-3.5">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full ${u.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'} flex items-center justify-center font-bold text-sm shrink-0">
                ${this.escapeHtml(u.name.charAt(0).toUpperCase())}
              </div>
              <div>
                <div class="font-semibold text-slate-800 text-sm">
                  ${this.escapeHtml(u.name)}
                  ${isSelf ? '<span class="ml-1.5 text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-bold">Anda</span>' : ''}
                </div>
                <div class="text-xs text-slate-400">${this.escapeHtml(u.email || '-')} • ${this.escapeHtml(u.phone || '-')}</div>
              </div>
            </div>
          </td>
          <td class="px-4 py-3.5 font-mono text-xs font-bold text-slate-700">@${this.escapeHtml(u.username)}</td>
          <td class="px-4 py-3.5 font-mono text-xs text-slate-500">${this.escapeHtml(u.password)}</td>
          <td class="px-4 py-3.5 text-center">${roleBadge}</td>
          <td class="px-4 py-3.5 text-center">${statusBadge}</td>
          <td class="px-4 py-3.5 text-right">
            <div class="flex items-center justify-end gap-1.5">
              <button onclick="App.openUserModal('${u.id}')" class="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-semibold transition flex items-center gap-1">
                <i class="fa-solid fa-user-pen"></i> Edit
              </button>
              ${!isSelf
                ? `<button onclick="App.toggleUserActive('${u.id}')" class="px-2.5 py-1.5 rounded-lg ${u.active ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'} text-xs font-semibold transition flex items-center gap-1">
                    <i class="fa-solid ${u.active ? 'fa-user-slash' : 'fa-user-check'}"></i>
                    ${u.active ? 'Nonaktifkan' : 'Aktifkan'}
                   </button>`
                : ''
              }
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  openUserModal(userId = null) {
    if (!this.isAdmin()) {
      this.showToast('Akses ditolak: Hanya Admin yang dapat mengelola akun pengguna.', 'error');
      return;
    }

    const modal = document.getElementById('user-modal');
    const title = document.getElementById('user-modal-title');
    const idInput = document.getElementById('user-modal-id');
    const nameInput = document.getElementById('user-modal-name');
    const usernameInput = document.getElementById('user-modal-username');
    const passwordInput = document.getElementById('user-modal-password');
    const emailInput = document.getElementById('user-modal-email');
    const phoneInput = document.getElementById('user-modal-phone');
    const roleInput = document.getElementById('user-modal-role');
    const activeInput = document.getElementById('user-modal-active');

    if (userId) {
      const u = DB.getUsers().find(x => x.id === userId);
      if (!u) return;
      title.textContent = 'Ubah Data Akun Pengguna';
      idInput.value = u.id;
      nameInput.value = u.name;
      usernameInput.value = u.username;
      passwordInput.value = u.password;
      emailInput.value = u.email || '';
      phoneInput.value = u.phone || '';
      roleInput.value = u.role;
      activeInput.value = u.active ? 'true' : 'false';
    } else {
      title.textContent = 'Tambah Akun Staff Baru';
      idInput.value = '';
      nameInput.value = '';
      usernameInput.value = '';
      passwordInput.value = 'password123';
      emailInput.value = '';
      phoneInput.value = '';
      roleInput.value = 'STAFF';
      activeInput.value = 'true';
    }

    modal.classList.remove('hidden');
  },

  closeUserModal() {
    document.getElementById('user-modal').classList.add('hidden');
  },

  handleSaveUser() {
    if (!this.isAdmin()) return;

    const id = document.getElementById('user-modal-id').value;
    const name = document.getElementById('user-modal-name').value.trim();
    const username = document.getElementById('user-modal-username').value.trim().toLowerCase();
    const password = document.getElementById('user-modal-password').value;
    const email = document.getElementById('user-modal-email').value.trim();
    const phone = document.getElementById('user-modal-phone').value.trim();
    const role = document.getElementById('user-modal-role').value;
    const active = document.getElementById('user-modal-active').value === 'true';

    if (!name || !username || !password) {
      this.showToast('Nama lengkap, username, dan password wajib diisi.', 'error');
      return;
    }

    const users = DB.getUsers();
    const duplicate = users.find(u => u.username.toLowerCase() === username && u.id !== id);
    if (duplicate) {
      this.showToast(`Username "@${username}" sudah digunakan oleh akun lain!`, 'error');
      return;
    }

    if (id) {
      const idx = users.findIndex(u => u.id === id);
      if (idx === -1) return;
      users[idx] = {
        ...users[idx],
        name,
        username,
        password,
        email: email || '-',
        phone: phone || '-',
        role,
        active
      };
      DB.saveUsers(users);
      if (this.currentUser && this.currentUser.id === id) {
        this.currentUser = users[idx];
        DB.setSession(this.currentUser);
      }
      DB.addActivity('USER', 'Perubahan Data Pengguna', `Memperbarui data akun ${name} (@${username})`, this.currentUser);
      this.showToast(`Data akun ${name} berhasil diperbarui!`, 'success');
    } else {
      const newUser = {
        id: 'usr-' + Date.now(),
        name,
        username,
        password,
        email: email || `${username}@labkomputer.ac.id`,
        phone: phone || '-',
        role,
        active,
        createdAt: new Date().toISOString()
      };
      users.push(newUser);
      DB.saveUsers(users);
      DB.addActivity('USER', 'Penambahan Akun Staff', `Menambahkan akun ${role} baru: ${name} (@${username})`, this.currentUser);
      this.showToast(`Akun ${name} (@${username}) berhasil ditambahkan!`, 'success');
    }

    this.closeUserModal();
    this.updateAuthUI();
    this.renderAll();
  },

  toggleUserActive(userId) {
    if (!this.isAdmin()) return;

    const users = DB.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return;

    if (this.currentUser && users[idx].id === this.currentUser.id) {
      this.showToast('Anda tidak dapat menonaktifkan akun Anda sendiri yang sedang aktif.', 'error');
      return;
    }

    users[idx].active = !users[idx].active;
    DB.saveUsers(users);

    const statusLabel = users[idx].active ? 'diaktifkan' : 'dinonaktifkan';
    DB.addActivity(
      'USER',
      `Status Akun Staff ${users[idx].active ? 'Diaktifkan' : 'Dinonaktifkan'}`,
      `Akun ${users[idx].name} (@${users[idx].username}) telah ${statusLabel}`,
      this.currentUser
    );

    this.renderAll();
    this.showToast(`Akun ${users[idx].name} berhasil ${statusLabel}.`, 'info');
  },

  // ==================== CLOUD SYNC & RESET DATA ====================
  openCloudModal() {
    const cfg = DB.getCloudConfig();
    document.getElementById('cloud-url').value = cfg.url || '';
    document.getElementById('cloud-key').value = cfg.key || '';
    document.getElementById('cloud-enabled').checked = !!cfg.enabled;
    document.getElementById('cloud-modal').classList.remove('hidden');
  },

  closeCloudModal() {
    document.getElementById('cloud-modal').classList.add('hidden');
  },

  async handleSaveCloudConfig() {
    const url = document.getElementById('cloud-url').value.trim();
    const key = document.getElementById('cloud-key').value.trim();
    const enabled = document.getElementById('cloud-enabled').checked;

    DB.saveCloudConfig({ url, key, enabled });
    if (enabled && url && key) {
      const ok = await DB.syncToCloud();
      if (ok) {
        this.showToast('Konfigurasi Supabase Cloud tersimpan dan data berhasil disinkronkan!', 'success');
      } else {
        this.showToast('Konfigurasi disimpan, namun sinkronisasi ke tabel lab_state belum merespons. Pastikan tabel sudah dibuat.', 'info');
      }
    } else {
      this.showToast('Pengaturan penyimpanan berhasil diperbarui.', 'info');
    }
    this.closeCloudModal();
  },

  handleResetSeedData() {
    if (!confirm('Kembalikan seluruh data (Barang BR001-BR012, Akun Demo, dan Transaksi) ke kondisi awal default?')) {
      return;
    }
    DB.resetToDefault();
    this.renderAll();
    this.showToast('Data berhasil di-reset ke kondisi awal sesuai spesifikasi!', 'success');
  },

  // ==================== HELPERS & UI UTILITIES ====================
  getStockStatusBadge(stock) {
    const num = Number(stock);
    if (num <= 0) {
      return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200"><span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>Habis</span>`;
    }
    if (num <= 3) {
      return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200"><span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Stok Menipis</span>`;
    }
    return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Tersedia</span>`;
  },

  getTransactionStatusBadge(status) {
    if (status === 'Dipinjam') {
      return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200"><i class="fa-solid fa-clock text-[10px]"></i>Dipinjam</span>`;
    }
    return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200"><i class="fa-solid fa-circle-check text-[10px]"></i>Selesai</span>`;
  },

  formatDate(dateStr) {
    if (!dateStr) return '-';
    try {
      const [y, m, d] = dateStr.split('-');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      if (y && m && d) {
        return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  },

  formatRelativeTime(isoStr) {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  },

  escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const colors = {
      success: 'bg-emerald-600 text-white border-emerald-700',
      error: 'bg-rose-600 text-white border-rose-700',
      info: 'bg-slate-800 text-white border-slate-900'
    };
    const icons = {
      success: 'fa-circle-check',
      error: 'fa-triangle-exclamation',
      info: 'fa-circle-info'
    };

    const toast = document.createElement('div');
    toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border ${colors[type] || colors.info} text-sm font-medium transform transition-all duration-300 translate-y-2 opacity-0 max-w-md`;
    toast.innerHTML = `
      <i class="fa-solid ${icons[type] || icons.info} text-base shrink-0"></i>
      <span class="flex-1 leading-snug">${this.escapeHtml(message)}</span>
    `;

    container.appendChild(toast);
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    });

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
