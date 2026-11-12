/**
 * Data & Storage Engine - Laboratory Inventory & Borrowing Management System
 * Supports LocalStorage persistence (survives browser close) + Optional Supabase Cloud Sync
 */

const STORAGE_KEYS = {
  ITEMS: 'lab_inv_items_v1',
  USERS: 'lab_inv_users_v1',
  TRANSACTIONS: 'lab_inv_transactions_v1',
  ACTIVITIES: 'lab_inv_activities_v1',
  SESSION: 'lab_inv_session_v1',
  CLOUD_CONFIG: 'lab_inv_cloud_config_v1'
};

// D. Data Awal Barang (5 Wajib sesuai PDF + 7 Barang Tambahan Lab Komputer)
const INITIAL_ITEMS = [
  {
    id: 'item-1',
    code: 'BR001',
    name: 'Laptop Lenovo',
    category: 'Laptop',
    stock: 5,
    location: 'Rak A-01',
    condition: 'Baik',
    createdAt: '2026-11-01T08:00:00.000Z'
  },
  {
    id: 'item-2',
    code: 'BR002',
    name: 'Mouse Logitech',
    category: 'Periferal',
    stock: 10,
    location: 'Laci B-01',
    condition: 'Baik',
    createdAt: '2026-11-01T08:05:00.000Z'
  },
  {
    id: 'item-3',
    code: 'BR003',
    name: 'Keyboard Mechanical',
    category: 'Periferal',
    stock: 8,
    location: 'Laci B-02',
    condition: 'Baik',
    createdAt: '2026-11-01T08:10:00.000Z'
  },
  {
    id: 'item-4',
    code: 'BR004',
    name: 'Proyektor Epson',
    category: 'Proyektor',
    stock: 3,
    location: 'Lemari C-01',
    condition: 'Baik',
    createdAt: '2026-11-01T08:15:00.000Z'
  },
  {
    id: 'item-5',
    code: 'BR005',
    name: 'Monitor LG',
    category: 'Monitor',
    stock: 6,
    location: 'Rak A-02',
    condition: 'Baik',
    createdAt: '2026-11-01T08:20:00.000Z'
  },
  // Tambahan Barang Laboratorium Komputer
  {
    id: 'item-6',
    code: 'BR006',
    name: 'Router Mikrotik RB951Ui',
    category: 'Perangkat Jaringan',
    stock: 7,
    location: 'Lemari Net-01',
    condition: 'Baik',
    createdAt: '2026-11-02T09:00:00.000Z'
  },
  {
    id: 'item-7',
    code: 'BR007',
    name: 'Switch Cisco Catalyst 24-Port',
    category: 'Perangkat Jaringan',
    stock: 4,
    location: 'Lemari Net-02',
    condition: 'Baik',
    createdAt: '2026-11-02T09:10:00.000Z'
  },
  {
    id: 'item-8',
    code: 'BR008',
    name: 'Crimping Tool & LAN Tester Set',
    category: 'Perangkat Jaringan',
    stock: 12,
    location: 'Kotak Alat D-01',
    condition: 'Baik',
    createdAt: '2026-11-02T09:20:00.000Z'
  },
  {
    id: 'item-9',
    code: 'BR009',
    name: 'Kabel HDMI 5 Meter High Speed',
    category: 'Aksesoris',
    stock: 14,
    location: 'Laci B-05',
    condition: 'Baik',
    createdAt: '2026-11-02T09:30:00.000Z'
  },
  {
    id: 'item-10',
    code: 'BR010',
    name: 'Webcam Logitech C920 Pro HD',
    category: 'Periferal',
    stock: 6,
    location: 'Lemari C-02',
    condition: 'Baik',
    createdAt: '2026-11-02T09:40:00.000Z'
  },
  {
    id: 'item-11',
    code: 'BR011',
    name: 'Laptop ASUS ROG Zephyrus (Lab AI)',
    category: 'Laptop',
    stock: 4,
    location: 'Rak A-03',
    condition: 'Baik',
    createdAt: '2026-11-03T10:00:00.000Z'
  },
  {
    id: 'item-12',
    code: 'BR012',
    name: 'Access Point Ubiquiti UniFi AP',
    category: 'Perangkat Jaringan',
    stock: 5,
    location: 'Lemari Net-03',
    condition: 'Baik',
    createdAt: '2026-11-03T10:15:00.000Z'
  }
];

// Data Awal Pengguna (Admin & Staff)
const INITIAL_USERS = [
  {
    id: 'usr-admin-1',
    name: 'Administrator Lab',
    username: 'admin',
    password: 'password123',
    role: 'ADMIN',
    email: 'admin@labkomputer.ac.id',
    phone: '0812-3456-7890',
    active: true,
    createdAt: '2026-10-01T08:00:00.000Z'
  },
  {
    id: 'usr-staff-1',
    name: 'Andi Pratama (Staff Lab)',
    username: 'staff',
    password: 'password123',
    role: 'STAFF',
    email: 'andi.staff@labkomputer.ac.id',
    phone: '0813-9876-5432',
    active: true,
    createdAt: '2026-10-05T09:00:00.000Z'
  },
  {
    id: 'usr-staff-2',
    name: 'Siti Rahmawati',
    username: 'siti',
    password: 'password123',
    role: 'STAFF',
    email: 'siti.staff@labkomputer.ac.id',
    phone: '0857-1122-3344',
    active: true,
    createdAt: '2026-10-12T10:00:00.000Z'
  },
  {
    id: 'usr-staff-3',
    name: 'Budi Santoso (Cuti)',
    username: 'budi',
    password: 'password123',
    role: 'STAFF',
    email: 'budi.staff@labkomputer.ac.id',
    phone: '0821-5566-7788',
    active: false,
    createdAt: '2026-10-15T11:00:00.000Z'
  }
];

// Data Awal Transaksi Peminjaman & Pengembalian
const INITIAL_TRANSACTIONS = [
  {
    id: 'TRX-20261108-001',
    borrowerName: 'Dimas Anggara (NIM: 230101045)',
    borrowerContact: '0812-8899-0011',
    purpose: 'Praktikum Jaringan Komputer Lanjut',
    itemId: 'item-6',
    itemCode: 'BR006',
    itemName: 'Router Mikrotik RB951Ui',
    itemCategory: 'Perangkat Jaringan',
    quantity: 2,
    borrowDate: '2026-11-11',
    returnDate: null,
    status: 'Dipinjam',
    handledBy: 'Andi Pratama (Staff Lab)',
    returnedTo: null,
    returnNote: '',
    createdAt: '2026-11-11T09:15:00.000Z'
  },
  {
    id: 'TRX-20261110-002',
    borrowerName: 'Nadia Putri (NIM: 230101088)',
    borrowerContact: '0856-3344-5566',
    purpose: 'Presentasi Seminar Proposal',
    itemId: 'item-9',
    itemCode: 'BR009',
    itemName: 'Kabel HDMI 5 Meter High Speed',
    itemCategory: 'Aksesoris',
    quantity: 1,
    borrowDate: '2026-11-12',
    returnDate: null,
    status: 'Dipinjam',
    handledBy: 'Administrator Lab',
    returnedTo: null,
    returnNote: '',
    createdAt: '2026-11-12T07:45:00.000Z'
  },
  {
    id: 'TRX-20261105-003',
    borrowerName: 'Rizky Ramadhan (NIM: 220101012)',
    borrowerContact: '0813-4455-6677',
    purpose: 'Ujian Praktikum Pemrograman Web',
    itemId: 'item-1',
    itemCode: 'BR001',
    itemName: 'Laptop Lenovo',
    itemCategory: 'Laptop',
    quantity: 2,
    borrowDate: '2026-11-09',
    returnDate: '2026-11-10',
    status: 'Selesai',
    handledBy: 'Andi Pratama (Staff Lab)',
    returnedTo: 'Andi Pratama (Staff Lab)',
    returnNote: 'Dikembalikan lengkap beserta charger dalam kondisi baik',
    createdAt: '2026-11-09T08:30:00.000Z'
  },
  {
    id: 'TRX-20261106-004',
    borrowerName: 'Kelompok Studi Linux',
    borrowerContact: '0878-9900-1122',
    purpose: 'Workshop Open Source',
    itemId: 'item-4',
    itemCode: 'BR004',
    itemName: 'Proyektor Epson',
    itemCategory: 'Proyektor',
    quantity: 1,
    borrowDate: '2026-11-10',
    returnDate: '2026-11-10',
    status: 'Selesai',
    handledBy: 'Siti Rahmawati',
    returnedTo: 'Administrator Lab',
    returnNote: 'Normal dan lengkap',
    createdAt: '2026-11-10T13:00:00.000Z'
  }
];

// Data Awal Log Aktivitas Terbaru
const INITIAL_ACTIVITIES = [
  {
    id: 'act-1',
    type: 'BORROW',
    title: 'Peminjaman Barang Baru',
    description: 'Nadia Putri meminjam 1 unit Kabel HDMI 5 Meter High Speed (BR009)',
    actor: 'Administrator Lab',
    role: 'ADMIN',
    timestamp: '2026-11-12T07:45:00.000Z'
  },
  {
    id: 'act-2',
    type: 'BORROW',
    title: 'Peminjaman Barang Baru',
    description: 'Dimas Anggara meminjam 2 unit Router Mikrotik RB951Ui (BR006)',
    actor: 'Andi Pratama (Staff Lab)',
    role: 'STAFF',
    timestamp: '2026-11-11T09:15:00.000Z'
  },
  {
    id: 'act-3',
    type: 'RETURN',
    title: 'Pengembalian Barang Selesai',
    description: 'Kelompok Studi Linux mengembalikan 1 unit Proyektor Epson (BR004)',
    actor: 'Administrator Lab',
    role: 'ADMIN',
    timestamp: '2026-11-10T16:30:00.000Z'
  },
  {
    id: 'act-4',
    type: 'RETURN',
    title: 'Pengembalian Barang Selesai',
    description: 'Rizky Ramadhan mengembalikan 2 unit Laptop Lenovo (BR001)',
    actor: 'Andi Pratama (Staff Lab)',
    role: 'STAFF',
    timestamp: '2026-11-10T14:20:00.000Z'
  }
];

const DB = {
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.ITEMS)) {
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(INITIAL_ITEMS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) {
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(INITIAL_ACTIVITIES));
    }
  },

  resetToDefault() {
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(INITIAL_ITEMS));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(INITIAL_ACTIVITIES));
    this.syncToCloud();
  },

  getItems() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.ITEMS)) || [];
    } catch {
      return [...INITIAL_ITEMS];
    }
  },

  saveItems(items) {
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
    this.syncToCloud();
  },

  getUsers() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
    } catch {
      return [...INITIAL_USERS];
    }
  },

  saveUsers(users) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.syncToCloud();
  },

  getTransactions() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) || [];
    } catch {
      return [...INITIAL_TRANSACTIONS];
    }
  },

  saveTransactions(transactions) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    this.syncToCloud();
  },

  getActivities() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) || [];
    } catch {
      return [...INITIAL_ACTIVITIES];
    }
  },

  addActivity(type, title, description, user) {
    const activities = this.getActivities();
    activities.unshift({
      id: 'act-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      type,
      title,
      description,
      actor: user ? user.name : 'Sistem',
      role: user ? user.role : 'SYSTEM',
      timestamp: new Date().toISOString()
    });
    // Simpan maksimal 50 aktivitas terbaru
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities.slice(0, 50)));
  },

  getSession() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSION));
    } catch {
      return null;
    }
  },

  setSession(user) {
    if (!user) {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    } else {
      const safeUser = {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        email: user.email,
        loginAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(safeUser));
    }
  },

  // Cloud Sync (Supabase REST API integration)
  getCloudConfig() {
    const defaultCfg = {
      url: 'https://bhzqzlimhvcsyxlcsmpv.supabase.co',
      key: 'sb_publishable_-sc3t-Al08VyzADk1ndCyg_fHNllOXZ',
      enabled: true
    };
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLOUD_CONFIG));
      if (saved && typeof saved === 'object' && saved.url) {
        return saved;
      }
      return defaultCfg;
    } catch {
      return defaultCfg;
    }
  },

  saveCloudConfig(config) {
    localStorage.setItem(STORAGE_KEYS.CLOUD_CONFIG, JSON.stringify(config));
  },

  async syncToCloud() {
    const cfg = this.getCloudConfig();
    if (!cfg.enabled || !cfg.url || !cfg.key) return false;
    try {
      const payload = {
        id: 'main_state',
        items: this.getItems(),
        users: this.getUsers(),
        transactions: this.getTransactions(),
        activities: this.getActivities(),
        updated_at: new Date().toISOString()
      };
      const res = await fetch(`${cfg.url.replace(/\/$/, '')}/rest/v1/lab_state?id=eq.main_state`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': cfg.key,
          'Authorization': `Bearer ${cfg.key}`,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(payload)
      });
      return res.ok;
    } catch (err) {
      console.warn('Cloud sync warning:', err);
      return false;
    }
  },

  async pullFromCloud() {
    const cfg = this.getCloudConfig();
    if (!cfg.enabled || !cfg.url || !cfg.key) return false;
    try {
      const res = await fetch(`${cfg.url.replace(/\/$/, '')}/rest/v1/lab_state?id=eq.main_state&select=*`, {
        headers: {
          'apikey': cfg.key,
          'Authorization': `Bearer ${cfg.key}`
        }
      });
      if (!res.ok) return false;
      const rows = await res.json();
      if (rows && rows.length > 0) {
        const remote = rows[0];
        if (remote.items) localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(remote.items));
        if (remote.users) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(remote.users));
        if (remote.transactions) localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(remote.transactions));
        if (remote.activities) localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(remote.activities));
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Cloud pull warning:', err);
      return false;
    }
  }
};
