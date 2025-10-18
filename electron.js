const { app, BrowserWindow } = require('electron');
const path = require('path');

// Menandai mode pengembangan. Skrip 'dev' akan menyetel variabel ini.
const isDev = process.env.IS_DEV === 'true';

function createWindow() {
  // Membuat jendela browser.
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      // Ini memungkinkan kode di dalam jendela aplikasi Anda (proses renderer)
      // untuk menggunakan API Node.js secara langsung (misalnya, 'require').
      // Ini akan menyederhanakan transisi dari IndexedDB ke SQLite.
      // Catatan: Untuk aplikasi produksi, kita akan mengamankannya lebih lanjut menggunakan preload script.
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Memuat URL aplikasi. Jika dalam mode dev, muat dari server Vite.
  // Jika tidak, muat dari file index.html yang sudah di-build.
  const url = isDev
    ? 'http://localhost:5173' // Sesuaikan port jika berbeda
    : `file://${path.join(__dirname, 'dist/index.html')}`;

  win.loadURL(url);

  // Buka DevTools (alat pengembang Chrome) jika dalam mode pengembangan.
  if (isDev) {
    win.webContents.openDevTools();
  }
}

// Panggil createWindow() saat Electron sudah siap.
app.whenReady().then(createWindow);

// Keluar dari aplikasi ketika semua jendela ditutup (kecuali di macOS).
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // Di macOS, buat kembali jendela jika ikon di-klik dan tidak ada jendela lain yang terbuka.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
