

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Item, Transaction, Settings, Customer, Bank, Shift, Satuan, Jenis, Merek, Attendance, DebtPayment, ExpenseCategory } from '../types';

const DB_NAME = 'KasirProDB';
const DB_VERSION = 5; // Incremented version for new expenseCategories store

export interface KasirProDBSchema {
  items: { key: string; value: Item; };
  transactions: { key: string; value: Transaction; };
  settings: { key: string; value: Settings; };
  customers: { key: string; value: Customer; };
  banks: { key: string; value: Bank; };
  shifts: { key: string; value: Shift; };
  satuans: { key: string; value: Satuan; };
  jenises: { key: string; value: Jenis; };
  mereks: { key: string; value: Merek; };
  attendances: { key: string; value: Attendance; };
  debtPayments: { key: string; value: DebtPayment; };
  expenseCategories: { key: string; value: ExpenseCategory; };
}

export const STORES: (keyof KasirProDBSchema)[] = ['items', 'transactions', 'settings', 'customers', 'banks', 'shifts', 'satuans', 'jenises', 'mereks', 'attendances', 'debtPayments', 'expenseCategories'];

let dbPromise: Promise<IDBPDatabase<KasirProDBSchema>> | null = null;

const getDb = () => {
  if (!dbPromise) {
    dbPromise = openDB<KasirProDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        STORES.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            if (storeName === 'settings') {
              db.createObjectStore(storeName);
            } else {
              db.createObjectStore(storeName, { keyPath: 'id' });
            }
          }
        });
      },
    });
  }
  return dbPromise;
};

export const saveData = async <T extends keyof KasirProDBSchema>(storeName: T, data: KasirProDBSchema[T]['value'][]) => {
  const db = await getDb();
  const tx = db.transaction(storeName, 'readwrite');
  await Promise.all([...data.map(item => tx.store.put(item)), tx.done]);
};

export const saveSingleSetting = async (settings: Settings) => {
    const db = await getDb();
    await db.put('settings', settings, 'defaultSettings');
};

export const getSingleSetting = async (): Promise<Settings | undefined> => {
    const db = await getDb();
    return await db.get('settings', 'defaultSettings');
}

export const getData = async <T extends keyof KasirProDBSchema>(storeName: T): Promise<KasirProDBSchema[T]['value'][]> => {
  const db = await getDb();
  return await db.getAll(storeName);
};

export const clearAllData = async () => {
    const db = await getDb();
    const tx = db.transaction(STORES, 'readwrite');
    await Promise.all([...STORES.map(storeName => {
        if (db.objectStoreNames.contains(storeName)) {
            return tx.objectStore(storeName).clear();
        }
    }), tx.done]);
};