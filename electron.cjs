const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { db, initDb } = require('./services/database.cjs');

const isDev = process.env.IS_DEV === 'true';

// Menambahkan sales dan sale_items ke daftar putih
const ALLOWED_TABLES = ['items', 'customers', 'satuans', 'jenis', 'mereks', 'banks', 'expense_categories', 'debt_payments', 'sales', 'sale_items'];

function createWindow() { /* ... (tidak berubah) ... */ }

function setupIpcHandlers() {
  // --- HANDLER GENERIK (tidak berubah) ---
  ipcMain.handle('db-get-all', async (event, tableName) => {
    if (!ALLOWED_TABLES.includes(tableName)) throw new Error(`Akses tabel tidak diizinkan: ${tableName}`);
    const stmt = db.prepare(`SELECT * FROM ${tableName} ORDER BY name`);
    return stmt.all();
  });

  // ... (handler generik lainnya tidak berubah) ...

  // --- TRANSAKSI SPESIFIK ---

  // ... (handler stok dan pembayaran utang tidak berubah) ...

  // --- TRANSAKSI PENJUALAN --- 
  const saveSaleTransaction = db.transaction((saleData) => {
    const { customerId, items: cartItems, total, amountPaid, paymentMethod, isCredit, shiftId } = saleData;

    // 1. Buat catatan penjualan utama
    const saleInfo = db.prepare(
        'INSERT INTO sales (customerId, total, amountPaid, paymentMethod, shiftId, isCredit) VALUES (@customerId, @total, @amountPaid, @paymentMethod, @shiftId, @isCredit)'
    ).run({ customerId, total, amountPaid, paymentMethod, shiftId, isCredit: isCredit ? 1 : 0 });
    
    const saleId = saleInfo.lastInsertRowid;

    const updatedItems = [];

    // Siapkan pernyataan di luar loop
    const updateItemStockStmt = db.prepare('UPDATE items SET stock = ? WHERE id = ?');
    const insertSaleItemStmt = db.prepare('INSERT INTO sale_items (saleId, itemId, quantity, price, tier) VALUES (?, ?, ?, ?, ?)');
    const getItemStmt = db.prepare('SELECT * FROM items WHERE id = ?');

    // 2. Proses setiap item di keranjang
    for (const cartItem of cartItems) {
        // Ambil item terbaru dari DB untuk validasi stok
        const item = getItemStmt.get(cartItem.id);
        if (!item) throw new Error(`Item dengan ID ${cartItem.id} tidak ditemukan.`);

        const stockTiers = JSON.parse(item.stock || '[]');
        const stockTier = stockTiers.find(t => t.name === cartItem.tier);

        if (!stockTier || stockTier.stock < cartItem.quantity) {
            throw new Error(`Stok tidak mencukupi untuk item: ${item.name} (${cartItem.tier}). Sisa: ${stockTier?.stock || 0}`);
        }

        // Kurangi stok
        stockTier.stock -= cartItem.quantity;
        updateItemStockStmt.run(JSON.stringify(stockTiers), item.id);

        // Catat ke sale_items
        insertSaleItemStmt.run(saleId, item.id, cartItem.quantity, cartItem.price, cartItem.tier);
        
        // Tambahkan item yang diperbarui ke array untuk dikembalikan
        updatedItems.push(getItemStmt.get(item.id));
    }

    let updatedCustomer = null;
    // 3. Perbarui utang pelanggan jika perlu
    if (isCredit) {
        const debtAmount = total - amountPaid;
        if (debtAmount > 0) {
            db.prepare('UPDATE customers SET hutang = hutang + ? WHERE id = ?').run(debtAmount, customerId);
            updatedCustomer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
        }
    }
    
    const newSale = db.prepare('SELECT * FROM sales WHERE id = ?').get(saleId);

    // 4. Kembalikan semua data yang diperbarui
    return { newSale, updatedItems, updatedCustomer };
  });

  ipcMain.handle('db-save-sale', (event, saleData) => saveSaleTransaction(saleData));
}

// ... (sisa file tidak berubah) ...
app.whenReady().then(() => {
  try {
    initDb();
  } catch (e) {
    console.error("Gagal menginisialisasi database", e);
    app.quit();
    return;
  }

  setupIpcHandlers();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    db.close();
    app.quit();
  }
});
