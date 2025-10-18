import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { Transaction, CartItem, TransactionItem, Shift, DebtPayment } from '../types';
import { saveData, getData } from '../services/db';
import { useData } from './DataContext';
import { useNotification } from './NotificationContext';

interface TransactionContextType {
    transactions: Transaction[];
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
    lastTransaction: Transaction | null;
    receiptRef: React.RefObject<HTMLDivElement>;
    handleTransactionComplete: (cart: CartItem[], paymentDetails: any, activeShift: Shift | null) => Transaction;
    handleUpdateTransaction: (originalTransaction: Transaction, newCart: CartItem[], newTotal: number, paymentAmount: number, activeShift: Shift | null) => Promise<Transaction | null>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
    const receiptRef = useRef<HTMLDivElement>(null);

    const { items, setItems, customers, setCustomers, debtPayments, setDebtPayments } = useData();
    const { showNotification } = useNotification();

    useEffect(() => {
        const loadTransactions = async () => setTransactions(await getData('transactions'));
        loadTransactions();
    }, []);

    const handleTransactionComplete = async (cart: CartItem[], paymentDetails: any, activeShift: Shift | null) => {
        if (!activeShift) throw new Error("No active shift found for transaction completion.");

        const newTransaction: Transaction = {
            id: `trans_${Date.now()}`,
            items: cart.map(item => ({ id: item.id, name: item.name, quantity: item.quantity, priceTier: item.priceTier })),
            total: paymentDetails.total, paymentMethod: paymentDetails.method, amountPaid: paymentDetails.amountPaid, change: paymentDetails.change, discount: paymentDetails.discount, otherFees: paymentDetails.otherFees,
            bank: paymentDetails.bank, customerId: paymentDetails.customerId, timestamp: new Date(), shiftId: activeShift.id, cashierName: activeShift.adminName
        };

        const lowStockItems: string[] = [];
        const newItems = items.map(item => {
            const newPrices = item.prices.map(priceTier => {
                const cartPriceTier = cart.find(ci => ci.id === item.id && ci.priceTier.name === priceTier.name);
                if (cartPriceTier) {
                    const newStock = priceTier.stock - cartPriceTier.quantity;
                    if (newStock <= 0) lowStockItems.push(`${item.name} (${priceTier.name})`);
                    return { ...priceTier, stock: newStock };
                }
                return priceTier;
            });
            return { ...item, prices: newPrices };
        });
        setItems(newItems);
        await saveData('items', newItems);
        
        if (paymentDetails.method === 'Kredit' && paymentDetails.customerId) {
            const newCustomers = customers.map(c => c.id === paymentDetails.customerId ? { ...c, hutang: (c.hutang || 0) + paymentDetails.total } : c);
            setCustomers(newCustomers);
            await saveData('customers', newCustomers);
        }

        const newTransactions = [...transactions, newTransaction];
        setTransactions(newTransactions);
        await saveData('transactions', newTransactions);
        setLastTransaction(newTransaction);

        if (lowStockItems.length > 0) {
            setTimeout(() => showNotification(`Stok habis untuk ${lowStockItems.join(', ')}.`, 'warning'), 500);
        }
        
        return newTransaction;
    };
    
    const handleUpdateTransaction = async (
        originalTransaction: Transaction, 
        newCart: CartItem[], 
        newTotal: number, 
        paymentAmount: number, 
        activeShift: Shift | null, 
    ): Promise<Transaction | null> => {
        // 1. Stock Adjustment
        const stockAdjustments = new Map<string, number>();
        const originalItemsMap = new Map(originalTransaction.items.map(item => [`${item.id}-${item.priceTier.name}`, item.quantity]));
        const newItemsMap = new Map(newCart.map(item => [`${item.id}-${item.priceTier.name}`, item.quantity]));
    
        newItemsMap.forEach((newQty, key) => {
            const oldQty = originalItemsMap.get(key) || 0;
            const diff = newQty - oldQty;
            if (diff !== 0) stockAdjustments.set(key, (stockAdjustments.get(key) || 0) - diff);
        });
        originalItemsMap.forEach((oldQty, key) => {
            if (!newItemsMap.has(key)) stockAdjustments.set(key, (stockAdjustments.get(key) || 0) + oldQty);
        });
        
        const updatedItems = items.map(item => {
            const newPrices = item.prices.map(priceTier => {
                const key = `${item.id}-${priceTier.name}`;
                if (stockAdjustments.has(key)) return { ...priceTier, stock: priceTier.stock + stockAdjustments.get(key)! };
                return priceTier;
            });
            return { ...item, prices: newPrices };
        });
        setItems(updatedItems);
        await saveData('items', updatedItems);

        // 2. Customer Debt & Payment Record Adjustment
        if (originalTransaction.customerId && (paymentAmount > 0 || newTotal !== originalTransaction.total)) {
            const totalDifference = newTotal - originalTransaction.total;
            const debtChangeFromTotal = originalTransaction.paymentMethod === 'Kredit' ? totalDifference : 0;
            const overallDebtChange = debtChangeFromTotal - paymentAmount;

            if (overallDebtChange !== 0) {
                const newCustomers = customers.map(c => {
                    if (c.id === originalTransaction.customerId) {
                        return { ...c, hutang: Math.max(0, (c.hutang || 0) + overallDebtChange) };
                    }
                    return c;
                });
                setCustomers(newCustomers);
                await saveData('customers', newCustomers);
            }

            if (paymentAmount > 0 && activeShift) {
                const newPayment: DebtPayment = {
                    id: `debtpay_${Date.now()}`,
                    customerId: originalTransaction.customerId,
                    amount: paymentAmount,
                    timestamp: new Date(),
                    shiftId: activeShift.id
                };
                const newDebtPayments = [...debtPayments, newPayment];
                setDebtPayments(newDebtPayments);
                await saveData('debtPayments', newDebtPayments);
            }
        }

        // 3. Update Transaction
        const updatedTransactionItems: TransactionItem[] = newCart.map(item => ({ id: item.id, name: item.name, quantity: item.quantity, priceTier: item.priceTier }));
        const updatedTransaction: Transaction = { ...originalTransaction, items: updatedTransactionItems, total: newTotal };

        if (paymentAmount > 0) {
            const newAmountPaid = (originalTransaction.amountPaid || 0) + paymentAmount;
            updatedTransaction.amountPaid = newAmountPaid;
            if (newAmountPaid >= newTotal) {
                updatedTransaction.paymentMethod = 'Tunai';
            }
        }
        
        const newTransactions = transactions.map(t => t.id === updatedTransaction.id ? updatedTransaction : t);
        setTransactions(newTransactions);
        await saveData('transactions', newTransactions);
        setLastTransaction(updatedTransaction);
        
        // 4. Print & Notify
        showNotification("Transaksi berhasil diperbarui.");
        return updatedTransaction;
    };

    return (
        <TransactionContext.Provider value={{ transactions, setTransactions, lastTransaction, receiptRef, handleTransactionComplete, handleUpdateTransaction }}>
            {children}
        </TransactionContext.Provider>
    );
};

export const useTransaction = () => {
    const context = useContext(TransactionContext);
    if (context === undefined) throw new Error('useTransaction must be used within a TransactionProvider');
    return context;
};
