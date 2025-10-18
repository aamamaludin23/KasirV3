const { app } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');

let db;

// Fungsi ini sekarang akan melakukan SEMUANYA, tapi hanya jika dipanggil.
function initDb() {
  // Mencegah inisialisasi ganda
  if (db) {
    return;
  }

  // Pindahkan semua logika yang bergantung pada 'app' ke sini
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'kasirpro.db');
  console.log('Database will be stored at:', dbPath);

  db = new Database(dbPath, { verbose: console.log });

  console.log('Mempersiapkan database...');

  const createTables = `
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      price REAL NOT NULL,
      stock TEXT
    );
    CREATE TABLE IF NOT EXISTS customers ( id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT, address TEXT, hutang REAL NOT NULL DEFAULT 0 );
    CREATE TABLE IF NOT EXISTS debt_payments ( id INTEGER PRIMARY KEY AUTOINCREMENT, customerId INTEGER NOT NULL, amount REAL NOT NULL, shiftId TEXT, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (customerId) REFERENCES customers (id) );
    CREATE TABLE IF NOT EXISTS satuans ( id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE );
    CREATE TABLE IF NOT EXISTS jenis ( id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE );
    CREATE TABLE IF NOT EXISTS mereks ( id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE );
    CREATE TABLE IF NOT EXISTS banks ( id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE );
    CREATE TABLE IF NOT EXISTS expense_categories ( id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE );
    CREATE TABLE IF NOT EXISTS sales ( id INTEGER PRIMARY KEY AUTOINCREMENT, customerId INTEGER NOT NULL, total REAL NOT NULL, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (customerId) REFERENCES customers (id) );
    CREATE TABLE IF NOT EXISTS sale_items ( id INTEGER PRIMARY KEY AUTOINCREMENT, saleId INTEGER NOT NULL, itemId INTEGER NOT NULL, quantity INTEGER NOT NULL, price REAL NOT NULL, FOREIGN KEY (saleId) REFERENCES sales (id), FOREIGN KEY (itemId) REFERENCES items (id) );
  `;

  db.exec(createTables);

  try {
    db.exec("ALTER TABLE customers ADD COLUMN hutang REAL NOT NULL DEFAULT 0");
    console.log("Kolom 'hutang' berhasil ditambahkan ke tabel 'customers'.");
  } catch (e) {
    if (!e.message.includes('duplicate column name')) console.error("Gagal mengubah tabel customers:", e);
  }

  seedInitialData();
  console.log('Database siap.');
}

function seedInitialData() {
  const seedTx = db.transaction(() => {
    const customerStmt = db.prepare("SELECT id FROM customers WHERE name = ?");
    if (!customerStmt.get('UMUM')) {
      db.prepare("INSERT INTO customers (name, hutang) VALUES (?, ?)").run('UMUM', 0);
    }
    const seedMaster = (tableName, data) => {
        const count = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get().count;
        if (count === 0) {
            console.log(`Melakukan seeding untuk tabel: ${tableName}...`);
            const insertStmt = db.prepare(`INSERT INTO ${tableName} (name) VALUES (?)`);
            data.forEach(name => insertStmt.run(name));
        }
    };
    seedMaster('satuans', ['Botol', 'Paket', 'Bungkus', 'Butir', 'Kg', 'Pcs']);
    seedMaster('jenis', ['Minuman', 'Makanan', 'Sembako', 'Pembersih', 'Obat']);
    seedMaster('mereks', ['Lokal', 'Indofood', 'Unilever', 'Wings']);
    seedMaster('banks', ['Tunai', 'BCA', 'Mandiri', 'BNI', 'BRI']);
    seedMaster('expense_categories', ['Sewa Ruko', 'Gaji Karyawan', 'Belanja Stok', 'Listrik & Air', 'Lain-lain']);
  });
  seedTx();
}

// Ganti cara ekspor. Kita tidak bisa mengekspor 'db' secara langsung karena ia null saat awal.
// Kita akan ekspor fungsi untuk mendapatkannya.
function getDb() {
    if (!db) {
        throw new Error('Database belum diinisialisasi! Panggil initDb terlebih dahulu.');
    }
    return db;
}

module.exports = { initDb, getDb };
