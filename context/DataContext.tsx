import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Item, Customer, Bank, Satuan, Jenis, Merek, PriceTier, DebtPayment, ExpenseCategory } from '../types';
import { saveData, getData } from '../services/db';
import { useNotification } from './NotificationContext';

// --- Initial Simulation Data ---
const initialSatuans: Satuan[] = [ { id: '1', name: 'Botol' }, { id: '2', name: 'Paket' }, { id: '3', name: 'Bungkus' }, { id: '4', name: 'Butir' }, { id: '5', name: 'Kg' }, { id: '6', name: 'Pcs' }];
const initialJenis: Jenis[] = [{ id: '1', name: 'Minuman' }, { id: '2', name: 'Makanan' }, { id: '3', name: 'Sembako' }];
const initialMerek: Merek[] = [{ id: '1', name: 'KasirPro' }, { id: '2', name: 'Lokal Jaya' }, { id: '3', name: 'Indofood' }];
const initialBanks: Bank[] = [{ id: '1', name: 'BCA' }, { id: '2', name: 'Mandiri' }, { id: '3', name: 'BNI' }, { id: '4', name: 'BRI' }];
const initialCustomers: Customer[] = [{ id: '1', name: 'UMUM', hutang: 0 }];
const initialExpenseCategories: ExpenseCategory[] = [ { id: '1', name: 'Sewa Ruko' }, { id: '2', name: 'Biaya Air' }, { id: '3', name: 'Biaya Listrik' }, { id: '4', name: 'Gaji Karyawan' }, { id: '5', name: 'Lain-lain' } ];
const initialItems: Item[] = [
    { id: '1', name: 'Kopi Susu Gula Aren', itemCode: 'KSGA-01', jenis: 'Minuman', merek: 'KasirPro', statusJual: 'Dijual', hargaModal: 15000, satuanModal: 'Botol', prices: [ { name: 'Botol', price: 22000, stock: 50, barcode: '8991234567890', konversi: 1, wholesaleLevels: [] }, { name: 'Paket', price: 80000, stock: 10, barcode: '8991234567891', konversi: 4, wholesaleLevels: [] } ] },
    { id: '2', name: 'Roti Tawar Gandum', itemCode: 'RTG-01', jenis: 'Makanan', merek: 'Lokal Jaya', statusJual: 'Dijual', hargaModal: 12500, satuanModal: 'Bungkus', prices: [{ name: 'Bungkus', price: 18000, stock: 30, barcode: '8992345678901', konversi: 1, wholesaleLevels: [] }] },
    { id: '3', name: 'Telur Ayam Kampung', itemCode: 'TAK-01', jenis: 'Sembako', merek: 'Lokal Jaya', statusJual: 'Dijual', hargaModal: 32000, satuanModal: 'Kg', prices: [ { name: 'Butir', price: 3000, stock: 100, barcode: '8993456789013', konversi: 16, wholesaleLevels: [] }, { name: 'Kg', price: 40000, stock: 6, barcode: '8993456789012', konversi: 1, wholesaleLevels: [] } ] },
];

interface DataContextType {
    items: Item[];
    customers: Customer[];
    banks: Bank[];
    satuans: Satuan[];
    jenises: Jenis[];
    mereks: Merek[];
    debtPayments: DebtPayment[];
    expenseCategories: ExpenseCategory[];
    setDebtPayments: React.Dispatch<React.SetStateAction<DebtPayment[]>>;
    setItems: React.Dispatch<React.SetStateAction<Item[]>>;
    setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
    handleMasterDataSave: (collectionName: string, formData: any, id?: string) => void;
    handleMasterDataDelete: (collectionName: string, id: string) => void;
    handleStockIn: (itemId: string, stockInTiers: { name: string; quantity: number }[]) => void;
    handleStockOpname: (itemId: string, opnameTiers: { name: string; newStock: number }[]) => void;
    handlePayDebt: (customerId: string, amount: number, shiftId: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [items, setItems] = useState<Item[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [banks, setBanks] = useState<Bank[]>([]);
    const [satuans, setSatuans] = useState<Satuan[]>([]);
    const [jenises, setJenises] = useState<Jenis[]>([]);
    const [mereks, setMereks] = useState<Merek[]>([]);
    const [debtPayments, setDebtPayments] = useState<DebtPayment[]>([]);
    const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showNotification } = useNotification();

    useEffect(() => {
        const loadData = async () => {
            const dbItems = await getData('items');
            if (dbItems.length > 0) {
                setItems(dbItems);
                setCustomers(await getData('customers'));
                setBanks(await getData('banks'));
                setSatuans(await getData('satuans'));
                setJenises(await getData('jenises'));
                setMereks(await getData('mereks'));
                setDebtPayments(await getData('debtPayments'));
                setExpenseCategories(await getData('expenseCategories'));
            } else {
                // First time load, populate with initial data
                await saveData('items', initialItems); setItems(initialItems);
                await saveData('customers', initialCustomers); setCustomers(initialCustomers);
                await saveData('banks', initialBanks); setBanks(initialBanks);
                await saveData('satuans', initialSatuans); setSatuans(initialSatuans);
                await saveData('jenises', initialJenis); setJenises(initialJenis);
                await saveData('mereks', initialMerek); setMereks(initialMerek);
                await saveData('debtPayments', []); setDebtPayments([]);
                await saveData('expenseCategories', initialExpenseCategories); setExpenseCategories(initialExpenseCategories);
            }
            setIsLoading(false);
        };
        loadData();
    }, []);

    const handleMasterDataSave = async (collectionName: string, formData: any, id?: string) => {
        const collectionMap = { Item: [items, setItems], Satuan: [satuans, setSatuans], Pelanggan: [customers, setCustomers], Jenis: [jenises, setJenises], Merek: [mereks, setMereks], Bank: [banks, setBanks], 'Kategori Biaya': [expenseCategories, setExpenseCategories] };
        const dbNameMap = { Item: 'items', Satuan: 'satuans', Pelanggan: 'customers', Jenis: 'jenises', Merek: 'mereks', Bank: 'banks', 'Kategori Biaya': 'expenseCategories' } as const;
        
        const key = collectionName as keyof typeof collectionMap;
        const [_, setter] = collectionMap[key] as [any[], React.Dispatch<any>];
        const dbName = dbNameMap[key];

        setter((prev: any[]) => {
            let updatedData;
            if (id) {
                updatedData = prev.map(item => item.id === id ? { ...item, ...formData } : item);
            } else {
                const newItem = { ...formData, id: `${collectionName.toLowerCase().replace(' ', '_')}_${Date.now()}` };
                if (collectionName === 'Pelanggan') newItem.hutang = 0;
                updatedData = [...prev, newItem];
            }
            saveData(dbName, updatedData);
            return updatedData;
        });
        showNotification(`${collectionName} berhasil disimpan.`);
    };
    
    const handleMasterDataDelete = async (collectionName: string, id: string) => {
        const collectionMap = { Item: [items, setItems], Satuan: [satuans, setSatuans], Pelanggan: [customers, setCustomers], Jenis: [jenises, setJenises], Merek: [mereks, setMereks], Bank: [banks, setBanks], 'Kategori Biaya': [expenseCategories, setExpenseCategories] };
        const dbNameMap = { Item: 'items', Satuan: 'satuans', Pelanggan: 'customers', Jenis: 'jenises', Merek: 'mereks', Bank: 'banks', 'Kategori Biaya': 'expenseCategories' } as const;

        const key = collectionName as keyof typeof collectionMap;
        const [_, setter] = collectionMap[key] as [any[], React.Dispatch<any>];
        const dbName = dbNameMap[key];
        
        setter((prev: any[]) => {
            const updatedData = prev.filter(item => item.id !== id);
            saveData(dbName, updatedData);
            return updatedData;
        });
        showNotification(`${collectionName} berhasil dihapus.`);
    };
    
    const handleStockIn = (itemId: string, stockInTiers: { name: string; quantity: number }[]) => {
        setItems(prevItems => {
            const newItems = prevItems.map(item => {
                if (item.id === itemId) {
                    const newPrices = item.prices.map(priceTier => {
                        const stockIn = stockInTiers.find(s => s.name === priceTier.name);
                        return stockIn ? { ...priceTier, stock: priceTier.stock + stockIn.quantity } : priceTier;
                    });
                    return { ...item, prices: newPrices };
                }
                return item;
            });
            saveData('items', newItems);
            return newItems;
        });
        showNotification('Stok berhasil ditambahkan!');
    };

    const handleStockOpname = (itemId: string, opnameTiers: { name: string; newStock: number }[]) => {
        setItems(prevItems => {
            const newItems = prevItems.map(item => {
                if (item.id === itemId) {
                    const newPrices = item.prices.map(priceTier => {
                        const opname = opnameTiers.find(s => s.name === priceTier.name);
                        return opname ? { ...priceTier, stock: opname.newStock } : priceTier;
                    });
                    return { ...item, prices: newPrices };
                }
                return item;
            });
            saveData('items', newItems);
            return newItems;
        });
        showNotification('Stok opname berhasil disimpan!');
    };

    const handlePayDebt = (customerId: string, amount: number, shiftId: string) => {
        const newPayment: DebtPayment = {
            id: `debtpay_${Date.now()}`,
            customerId,
            amount,
            timestamp: new Date(),
            shiftId
        };

        const newDebtPayments = [...debtPayments, newPayment];
        setDebtPayments(newDebtPayments);
        saveData('debtPayments', newDebtPayments);

        const newCustomers = customers.map(c => 
            c.id === customerId 
                ? { ...c, hutang: Math.max(0, (c.hutang || 0) - amount) } 
                : c
        );
        setCustomers(newCustomers);
        saveData('customers', newCustomers);
        showNotification(`Pembayaran hutang sebesar Rp ${amount.toLocaleString('id-ID')} berhasil.`);
    };
    
    if (isLoading) return <div className="flex justify-center items-center h-screen">Memuat data...</div>;

    return (
        <DataContext.Provider value={{ items, customers, banks, satuans, jenises, mereks, debtPayments, expenseCategories, setDebtPayments, setItems, setCustomers, handleMasterDataSave, handleMasterDataDelete, handleStockIn, handleStockOpname, handlePayDebt }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) throw new Error('useData must be used within a DataProvider');
    return context;
};