const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'kasirpro.db'); // Nama file diperbaiki
const db = new Database(dbPath, { verbose: console.log });

function initDb() {
  console.log('Mempersiapkan database...');

  // DDL Komprehensif untuk semua tabel
  const createTables = `
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      price REAL NOT NULL, -- Harga Eceran Default
      stock TEXT -- Diperbaiki: Menyimpan struktur stok sebagai JSON
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      hutang REAL NOT NULL DEFAULT 0 -- Ditambahkan: Kolom untuk melacak utang
    );

    CREATE TABLE IF NOT EXISTS debt_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customerId INTEGER NOT NULL,
      amount REAL NOT NULL,
      shiftId TEXT, -- Bisa null
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customerId) REFERENCES customers (id)
    );

    -- Tabel Master Data (sebelumnya terlewat)
    CREATE TABLE IF NOT EXISTS satuans ( id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE );
    CREATE TABLE IF NOT EXISTS jenis ( id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE );
    CREATE TABLE IF NOT EXISTS mereks ( id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE );
    CREATE TABLE IF NOT EXISTS banks ( id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE );
    CREATE TABLE IF NOT EXISTS expense_categories ( id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE );
    
    -- Tabel Penjualan (opsional, untuk masa depan)
    CREATE TABLE IF NOT EXISTS sales ( id INTEGER PRIMARY KEY AUTOINCREMENT, customerId INTEGER NOT NULL, total REAL NOT NULL, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (customerId) REFERENCES customers (id) );
    CREATE TABLE IF NOT EXISTS sale_items ( id INTEGER PRIMARY KEY AUTOINCREMENT, saleId INTEGER NOT NULL, itemId INTEGER NOT NULL, quantity INTEGER NOT NULL, price REAL NOT NULL, FOREIGN KEY (saleId) REFERENCES sales (id), FOREIGN KEY (itemId) REFERENCES items (id) );
  `;

  db.exec(createTables);

  // Coba tambahkan kolom hutang jika belum ada (untuk transisi yang mulus)
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
    // Pelanggan UMUM
    const customerStmt = db.prepare("SELECT id FROM customers WHERE name = ?");
    if (!customerStmt.get('UMUM')) {
      db.prepare("INSERT INTO customers (name, hutang) VALUES (?, ?)").run('UMUM', 0);
    }

    // Seeding untuk tabel master jika kosong
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

module.exports = { db, initDb };
