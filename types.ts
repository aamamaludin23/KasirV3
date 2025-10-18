export interface WholesaleLevel {
  minQty: number;
  price: number;
}

export interface PriceTier {
  name: string;
  price: number;
  stock: number;
  barcode: string;
  konversi: number;
  wholesaleLevels: WholesaleLevel[];
}

export interface Item {
  id: string;
  name: string;
  itemCode?: string;
  imageUrl?: string;
  jenis?: string;
  merek?: string;
  statusJual: 'Dijual' | 'Tidak Dijual';
  hargaModal: number;
  satuanModal: string;
  prices: PriceTier[];
  // Diperbarui: stock sekarang adalah string JSON
  stock?: string; 
}

export interface CartItem extends Item {
  quantity: number;
  priceTier: PriceTier;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  hutang?: number;
}

export interface Bank { id: string; name: string; }
export interface Satuan { id: string; name: string; }
export interface Jenis { id: string; name: string; }
export interface Merek { id: string; name: string; }
export interface ExpenseCategory { id: string; name: string; }

export interface DebtPayment {
    id: string;
    customerId: string;
    amount: number;
    timestamp: Date;
    shiftId: string;
}

// --- TIPE-TIPE BARU UNTUK PENJUALAN ---

// Merepresentasikan satu baris di tabel 'sales'
export interface Sale {
  id: string;
  customerId: string;
  total: number;
  amountPaid: number;
  paymentMethod: string;
  isCredit: boolean;
  shiftId: string;
  createdAt: string; // ISO date string
}

// Merepresentasikan satu baris di tabel 'sale_items'
export interface SaleItem {
  id: string;
  saleId: string;
  itemId: string;
  quantity: number;
  price: number; // Harga jual pada saat transaksi
  tier: string; // Tingkatan harga yang digunakan
}

// Struktur data yang dikirim dari frontend saat menyimpan penjualan
export interface SalePayload {
  customerId: string;
  items: {
    id: string;       // ID Item
    quantity: number;
    price: number;    // Harga jual
    tier: string;     // Nama tingkatan harga
  }[];
  total: number;
  amountPaid: number;
  paymentMethod: string;
  isCredit: boolean;
  shiftId: string;
}
