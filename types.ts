

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
}

export interface CartItem extends Item {
  quantity: number;
  priceTier: PriceTier;
}

export interface TransactionItem {
  id: string;
  name: string;
  quantity: number;
  priceTier: PriceTier;
}

export interface Transaction {
  id: string;
  items: TransactionItem[];
  total: number;
  paymentMethod: string;
  amountPaid: number;
  change: number;
  discount: number;
  otherFees: number;
  bank?: string;
  customerId?: string;
  timestamp: Date;
  shiftId: string;
  cashierName: string;
  status?: 'completed' | 'pending';
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  hutang?: number;
}

export interface Bank {
  id: string;
  name: string;
}

export interface Settings {
  storeName?: string;
  address?: string;
  phone?: string;
  taxRate?: number;
  lowStockThreshold?: number;
  printerMode?: 'Thermal' | 'Dot Matrix';
  cashdrawer?: 'Aktif' | 'Tidak Aktif';
  paperSize?: '58mm' | '80mm';
  detailLines?: '1 Baris' | '2 Baris';
  printCount?: number;
  receiptNotes?: string;
  theme?: 'light' | 'dark' | 'blue';
}

export interface Shift {
  id: string;
  adminName: string;
  initialBalance: number;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'closed';
  cashSales?: number;
  expenses?: Expense[];
  finalBalance?: number;
}

export interface Expense {
    id: string;
    amount: number;
    description: string;
    categoryId: string;
    timestamp: Date;
    takenBy?: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
}

export interface Satuan {
  id: string;
  name: string;
}

export interface Jenis {
  id: string;
  name: string;
}

export interface Merek {
  id: string;
  name: string;
}

export interface Attendance {
  id: string;
  employeeName: string;
  clockInTime: Date;
  clockOutTime?: Date;
  shiftId: string;
}

export interface DebtPayment {
    id: string;
    customerId: string;
    amount: number;
    timestamp: Date;
    shiftId: string;
}