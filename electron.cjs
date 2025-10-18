const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { initDb, getDb } = require('./services/database.cjs');

const isDev = process.env.IS_DEV === 'true';

const ALLOWED_TABLES = ['items', 'customers', 'satuans', 'jenis', 'mereks', 'banks', 'expense_categories', 'debt_payments', 'sales', 'sale_items'];

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
    // Perbaikan DEBUGGING: Buka DevTools untuk melihat error di frontend
    win.webContents.openDevTools();
  }
}

function setupIpcHandlers() {
  const db = getDb();

  // --- HANDLER GENERIK ---
  ipcMain.handle('db-get-all', async (event, tableName) => {
    if (!ALLOWED_TABLES.includes(tableName)) throw new Error(`Akses tabel tidak diizinkan: ${tableName}`);
    const stmt = db.prepare(`SELECT * FROM ${tableName} ORDER BY name`);
    return stmt.all();
  });
  ipcMain.handle('db-get-by-id', async (event, { tableName, id }) => {
    if (!ALLOWED_TABLES.includes(tableName)) throw new Error(`Akses tabel tidak diizinkan: ${tableName}`);
    return db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(id);
  });
  ipcMain.handle('db-insert', async (event, { tableName, data }) => {
    if (!ALLOWED_TABLES.includes(tableName)) throw new Error(`Akses tabel tidak diizinkan: ${tableName}`);
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const info = db.prepare(`INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`).run(Object.values(data));
    return db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(info.lastInsertRowid);
  });
  ipcMain.handle('db-update', async (event, { tableName, id, data }) => {
    if (!ALLOWED_TABLES.includes(tableName)) throw new Error(`Akses tabel tidak diizinkan: ${tableName}`);
    const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
    db.prepare(`UPDATE ${tableName} SET ${setClause} WHERE id = ?`).run([...Object.values(data), id]);
    return db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(id);
  });
  ipcMain.handle('db-delete', async (event, { tableName, id }) => {
    if (!ALLOWED_TABLES.includes(tableName)) throw new Error(`Akses tabel tidak diizinkan: ${tableName}`);
    return db.prepare(`DELETE FROM ${tableName} WHERE id = ?`).run(id).changes > 0;
  });

  // --- TRANSAKSI SPESIFIK --- 
  const saveSaleTransaction = db.transaction((saleData) => {
    const { customerId, items: cartItems, total, amountPaid, paymentMethod, isCredit, shiftId } = saleData;
    const saleInfo = db.prepare('INSERT INTO sales (customerId, total, amountPaid, paymentMethod, shiftId, isCredit) VALUES (@customerId, @total, @amountPaid, @paymentMethod, @shiftId, @isCredit)').run({ customerId, total, amountPaid, paymentMethod, shiftId, isCredit: isCredit ? 1 : 0 });
    const saleId = saleInfo.lastInsertRowid;
    const updatedItems = [];
    const updateItemStockStmt = db.prepare('UPDATE items SET stock = ? WHERE id = ?');
    const insertSaleItemStmt = db.prepare('INSERT INTO sale_items (saleId, itemId, quantity, price, tier) VALUES (?, ?, ?, ?, ?)');
    const getItemStmt = db.prepare('SELECT * FROM items WHERE id = ?');
    for (const cartItem of cartItems) {
        const item = getItemStmt.get(cartItem.id);
        if (!item) throw new Error(`Item dengan ID ${cartItem.id} tidak ditemukan.`);
        const stockTiers = JSON.parse(item.stock || '[]');
        const stockTier = stockTiers.find(t => t.name === cartItem.tier);
        if (!stockTier || stockTier.stock < cartItem.quantity) {
            throw new Error(`Stok tidak mencukupi untuk item: ${item.name} (${cartItem.tier}). Sisa: ${stockTier?.stock || 0}`);
        }
        stockTier.stock -= cartItem.quantity;
        updateItemStockStmt.run(JSON.stringify(stockTiers), item.id);
        insertSaleItemStmt.run(saleId, item.id, cartItem.quantity, cartItem.price, cartItem.tier);
        updatedItems.push(getItemStmt.get(item.id));
    }
    let updatedCustomer = null;
    if (isCredit) {
        const debtAmount = total - amountPaid;
        if (debtAmount > 0) {
            db.prepare('UPDATE customers SET hutang = hutang + ? WHERE id = ?').run(debtAmount, customerId);
            updatedCustomer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
        }
    }
    const newSale = db.prepare('SELECT * FROM sales WHERE id = ?').get(saleId);
    return { newSale, updatedItems, updatedCustomer };
  });

  ipcMain.handle('db-save-sale', (event, saleData) => saveSaleTransaction(saleData));
}

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

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    getDb().close();
    app.quit();
  }
});
