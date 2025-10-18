import React, { createContext, useContext, useState, useEffect } from 'react';
// Impor semua tipe yang diperlukan, termasuk yang baru ditambahkan
import type { Item, Customer, Bank, Satuan, Jenis, Merek, DebtPayment, ExpenseCategory, Sale, SaleItem, SalePayload } from '../types';
import { useNotification } from './NotificationContext';

const ipcRenderer = (window as any).require ? (window as any).require('electron').ipcRenderer : null;

// Peta koleksi ke tabel, sekarang mencakup tabel penjualan
const collectionToTableMap: { [key: string]: string } = {
    'Item': 'items',
    'Pelanggan': 'customers',
    'Satuan': 'satuans',
    'Jenis': 'jenis',
    'Merek': 'mereks',
    'Bank': 'banks',
    'Kategori Biaya': 'expense_categories',
    'Riwayat Utang': 'debt_payments',
    'Penjualan': 'sales',
    'Item Terjual': 'sale_items',
};

interface DataContextType {
    items: Item[];
    customers: Customer[];
    banks: Bank[];
    satuans: Satuan[];
    jenises: Jenis[];
    mereks: Merek[];
    debtPayments: DebtPayment[];
    expenseCategories: ExpenseCategory[];
    sales: Sale[];
    saleItems: SaleItem[];
    // Fungsi-fungsi yang diekspos oleh konteks
    handleMasterDataSave: (collectionName: string, formData: any, id?: string) => void;
    handleMasterDataDelete: (collectionName: string, id: string) => void;
    handleStockIn: (itemId: string, stockInTiers: { name: string; quantity: number }[]) => void;
    handleStockOpname: (itemId: string, opnameTiers: { name: string; newStock: number }[]) => void;
    handlePayDebt: (customerId: string, amount: number, shiftId: string) => void;
    handleSaveSale: (saleData: SalePayload) => Promise<void>; 
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    // State untuk semua data aplikasi
    const [items, setItems] = useState<Item[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [banks, setBanks] = useState<Bank[]>([]);
    const [satuans, setSatuans] = useState<Satuan[]>([]);
    const [jenises, setJenises] = useState<Jenis[]>([]);
    const [mereks, setMereks] = useState<Merek[]>([]);
    const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
    const [debtPayments, setDebtPayments] = useState<DebtPayment[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
    
    const [isLoading, setIsLoading] = useState(true);
    const { showNotification } = useNotification();

    // Peta tabel ke fungsi setter state
    const tableToSetterMap: { [key: string]: React.Dispatch<any> } = {
        items: setItems, customers: setCustomers, satuans: setSatuans, jenis: setJenises, mereks: setMereks, banks: setBanks, expense_categories: setExpenseCategories, debt_payments: setDebtPayments, sales: setSales, sale_items: setSaleItems,
    };

    // Efek untuk memuat semua data saat aplikasi dimulai
    useEffect(() => {
        if (!ipcRenderer) { setIsLoading(false); return; }
        const loadAllData = async () => {
            try {
                const tableNames = Object.values(collectionToTableMap);
                const results = await Promise.all(tableNames.map(name => ipcRenderer.invoke('db-get-all', name)));
                results.forEach((data, i) => tableToSetterMap[tableNames[i]]?.(data || []));
            } catch (error) {
                console.error("Gagal memuat semua data:", error);
                showNotification('Gagal memuat data aplikasi.', 'error');
            } finally {
                setIsLoading(false);
            }
        };
        loadAllData();
    }, [showNotification]);

    // ---- DIKEMBALIKAN: Implementasi fungsi yang hilang ----
    const handleMasterDataSave = async (collectionName: string, formData: any, id?: string) => {
        if (!ipcRenderer) return;
        const tableName = collectionToTableMap[collectionName];
        const setter = tableToSetterMap[tableName];
        if (!tableName || !setter) return;
        try {
            const savedData = await ipcRenderer.invoke('db-save-master-data', { tableName, data: { ...formData, id } });
            setter(prev => prev.some(item => item.id === savedData.id) ? prev.map(item => item.id === savedData.id ? savedData : item) : [...prev, savedData]);
            showNotification(`${collectionName} berhasil disimpan.`);
        } catch (error) {
            console.error(`Gagal menyimpan ${collectionName}:`, error);
            showNotification(`Gagal menyimpan ${collectionName}.`, 'error');
        }
    };
    
    const handleMasterDataDelete = async (collectionName: string, id: string) => {
        if (!ipcRenderer) return;
        const tableName = collectionToTableMap[collectionName];
        const setter = tableToSetterMap[tableName];
        if (!tableName || !setter) return;
        try {
            await ipcRenderer.invoke('db-delete-master-data', { tableName, id });
            setter(prev => prev.filter(item => item.id !== id));
            showNotification(`${collectionName} berhasil dihapus.`);
        } catch (error) {
            console.error(`Gagal menghapus ${collectionName}:`, error);
            showNotification(`Gagal menghapus ${collectionName}.`, 'error');
        }
    };
    
    const updateItemState = (updatedItem: Item) => setItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));

    const handleStockIn = async (itemId: string, stockInTiers: { name: string; quantity: number }[]) => {
        if (!ipcRenderer) return;
        try {
            const updatedItem = await ipcRenderer.invoke('db-stock-in', { itemId, stockInTiers });
            updateItemState(updatedItem);
            showNotification('Stok berhasil ditambahkan.');
        } catch (error) {
            console.error('Gagal memproses stok masuk:', error); showNotification('Gagal menambahkan stok.', 'error');
        }
    };

    const handleStockOpname = async (itemId: string, opnameTiers: { name: string; newStock: number }[]) => {
        if (!ipcRenderer) return;
        try {
            const updatedItem = await ipcRenderer.invoke('db-stock-opname', { itemId, opnameTiers });
            updateItemState(updatedItem);
            showNotification('Stok opname berhasil.');
        } catch (error) {
            console.error('Gagal memproses stok opname:', error); showNotification('Gagal melakukan stok opname.', 'error');
        }
    };

    const handlePayDebt = async (customerId: string, amount: number, shiftId: string) => {
        if (!ipcRenderer) return;
        try {
            const { updatedCustomer, newPayment } = await ipcRenderer.invoke('db-pay-debt', { customerId, amount, shiftId });
            setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
            setDebtPayments(prev => [...prev, newPayment]);
            showNotification('Pembayaran utang berhasil dicatat.');
        } catch (error) {
            console.error('Gagal memproses pembayaran utang:', error);
            showNotification('Gagal mencatat pembayaran utang.', 'error');
        }
    };
    // ---- AKHIR DARI KODE YANG DIKEMBALIKAN ----

    const handleSaveSale = async (saleData: SalePayload) => {
        if (!ipcRenderer) throw new Error("IPC Renderer tidak tersedia.");
        try {
            const { newSale, updatedItems, updatedCustomer } = await ipcRenderer.invoke('db-save-sale', saleData);
            setSales(prev => [...prev, newSale]);
            setItems(prevItems => {
                const newItems = [...prevItems];
                updatedItems.forEach(updatedItem => {
                    const index = newItems.findIndex(item => item.id === updatedItem.id);
                    if (index !== -1) newItems[index] = updatedItem;
                });
                return newItems;
            });
            if (updatedCustomer) {
                setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
            }
            showNotification('Transaksi berhasil disimpan.', 'success');
        } catch (error: any) {
            console.error('Gagal menyimpan transaksi:', error);
            showNotification(error.message || 'Gagal menyimpan transaksi.', 'error');
            throw error;
        }
    };
    
    if (isLoading) return <div className="flex justify-center items-center h-screen">Memuat data dari database...</div>;

    return (
        <DataContext.Provider value={{
            items, customers, banks, satuans, jenises, mereks, debtPayments, expenseCategories, sales, saleItems,
            // Memastikan semua fungsi disediakan dalam value prop
            handleMasterDataSave, 
            handleMasterDataDelete, 
            handleStockIn, 
            handleStockOpname, 
            handlePayDebt, 
            handleSaveSale
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) throw new Error('useData must be used within a DataProvider');
    return context;
};
