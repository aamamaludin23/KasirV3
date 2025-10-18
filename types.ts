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

export interface Sale {
  id: string;
  customerId: string;
  total: number;
  amountPaid: number;
  paymentMethod: string;
  isCredit: boolean;
  shiftId: string;
  createdAt: string; 
  items: SaleItem[];
  cashierName?: string;
  discount: number;
  otherFees: number;
  cashReceived?: number;
  timestamp: number;
}

export interface SaleItem {
  id: string;
  saleId: string;
  itemId: string;
  quantity: number;
  price: number; 
  tier: string; 
  name: string;
  priceTier: { name: string; price: number; };
}

export interface SalePayload {
  customerId: string;
  items: { id: string; quantity: number; price: number; tier: string; }[];
  total: number;
  amountPaid: number;
  paymentMethod: string;
  isCredit: boolean;
  shiftId: string;
}

export interface Settings {
  paperSize: '58mm' | '80mm';
  detailLines: '1 Baris' | '2 Baris';
  taxRate: number;
  storeName: string;
  address: string;
  phone: string;
  receiptNotes: string;
}

// --- TIPE YANG HILANG DITAMBAHKAN KEMBALI ---

export interface Shift {
  id: string;
  userId: string;
  startTime: number;
  endTime?: number;
  initialBalance: number;
  finalBalance?: number;
  notes?: string;
}

export interface Attendance {
  id: string;
  userId: string;
  checkIn: number;
  checkOut?: number;
}

export interface Expense {
  id: string;
  categoryId: string;
  amount: number;
  description: string;
  timestamp: number;
  shiftId: string;
}
