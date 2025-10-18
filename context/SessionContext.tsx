
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Shift, Transaction, Attendance, CartItem, Customer, Item, PriceTier, Expense, Settings, DebtPayment, ExpenseCategory } from '../types';
import { useShift } from './ShiftContext';
import { useTransaction } from './TransactionContext';
import { useData } from './DataContext';
import { getData, saveData } from '../services/db';
import { useNotification } from './NotificationContext';
import { useSettings } from './SettingsContext';
import { generateEscPosReceipt } from '../utils/escpos';

interface SessionContextType {
    page: string;
    setPage: (page: string) => void;
    
    activeShift: Shift | null;
    shifts: Shift[];
    handleStartShift: (adminName: string, initialBalance: number) => void;
    handleEndShift: () => void;
    confirmEndShift: () => void;
    cancelEndShift: () => void;
    showEndShiftModal: boolean;
    handleAddExpense: (expense: Omit<Expense, 'id' | 'timestamp'>) => void;

    transactions: Transaction[];
    lastTransaction: Transaction | null;
    receiptRef: React.RefObject<HTMLDivElement>;
    handleUpdateTransactionWrapper: (originalTransaction: Transaction, newCart: CartItem[], newTotal: number, paymentAmount: number, activeShift: Shift | null, shouldPrint: boolean) => void;
    
    items: Item[];
    customers: Customer[];
    
    attendances: Attendance[];
    loadPendingTransaction: (transactionId: string) => void;
    pendingTransaction: Transaction | null;
    clearPendingTransaction: () => void;
    
    settings: Settings;
    banks: import('../types').Bank[];
    expenseCategories: ExpenseCategory[];
    debtPayments: DebtPayment[];
    handlePayDebt: (customerId: string, amount: number, shiftId: string) => void;

    // Cart State & Logic
    cart: CartItem[];
    setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
    discount: number;
    setDiscount: React.Dispatch<React.SetStateAction<number>>;
    otherFees: number;
    setOtherFees: React.Dispatch<React.SetStateAction<number>>;
    selectedCustomerId: string;
    setSelectedCustomerId: React.Dispatch<React.SetStateAction<string>>;
    resetCart: () => void;
    handleTransactionCompleteWrapper: (paymentDetails: any) => void;
    handleHoldTransaction: () => void;
    total: number;
    subtotal: number;
    tax: number;
    
    // Navigate Away Logic
    navigateAwayData: { targetPage: string } | null;
    handleConfirmNavigation: (action: 'hold' | 'discard') => void;
    handleCancelNavigation: () => void;
    
    // Post-Transaction State & Logic
    completedTransaction: Transaction | null;
    handlePrintReceipt: () => void;
    closeSuccessModal: () => void;
    setTransactionToReprint: (transaction: Transaction) => void;
    isReprinting: boolean;
    setIsReprinting: (isReprinting: boolean) => void;

    reportText: string;
    showAttendanceReportPrint: boolean;
    setShowAttendanceReportPrint: (show: boolean) => void;

    // Printer
    isPrinterConnected: boolean;
    connectPrinter: () => void;
    testPrinter: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [page, setPage] = useState('Kasir');
    const [navigateAwayData, setNavigateAwayData] = useState<{ targetPage: string } | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [discount, setDiscount] = useState(0);
    const [otherFees, setOtherFees] = useState(0);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('1');
    const [pendingTransaction, setPendingTransaction] = useState<Transaction | null>(null);
    const [attendances, setAttendances] = useState<Attendance[]>([]);
    const [showEndShiftModal, setShowEndShiftModal] = useState(false);
    const [completedTransaction, setCompletedTransaction] = useState<Transaction | null>(null);
    const [showAttendanceReportPrint, setShowAttendanceReportPrint] = useState(false);
    const [isReprinting, setIsReprinting] = useState(false);
    const originalTitleRef = useRef(document.title);

    // Printer State
    const [printerDevice, setPrinterDevice] = useState<USBDevice | null>(null);
    const [isPrinterConnected, setIsPrinterConnected] = useState(false);

    const { showNotification } = useNotification();
    const { activeShift, shifts, handleAddExpense: handleAddExpenseShift, handleEndShift: handleEndShiftShift, handleStartShift: handleStartShiftShift } = useShift();
    const { transactions, setTransactions, lastTransaction, receiptRef, handleTransactionComplete, handleUpdateTransaction } = useTransaction();
    const { items, customers, banks, expenseCategories, debtPayments, handlePayDebt } = useData();
    const { settings } = useSettings();

    const closeSuccessModal = useCallback(() => {
        setCompletedTransaction(null);
    }, []);

    // --- PRINTER LOGIC ---
    const connectPrinter = useCallback(async () => {
        if (!navigator.usb) {
            showNotification('WebUSB tidak didukung di browser ini.', 'error');
            return;
        }
        try {
            const device = await navigator.usb.requestDevice({ filters: [] });
            await device.open();
            if (device.configuration === null) await device.selectConfiguration(1);
            await device.claimInterface(0);
            setPrinterDevice(device);
            setIsPrinterConnected(true);
            showNotification('Printer thermal terhubung!');
        } catch (error) {
            console.error('Gagal terhubung ke printer:', error);
            showNotification(`Gagal terhubung: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        }
    }, [showNotification]);

    const sendDataToPrinter = useCallback(async (data: Uint8Array) => {
        if (!printerDevice || !isPrinterConnected) {
            throw new Error('Printer tidak terhubung.');
        }
        const endpoint = printerDevice.configuration?.interfaces[0]?.alternate.endpoints.find(e => e.direction === 'out');
        if (!endpoint) {
            throw new Error('Endpoint printer tidak ditemukan.');
        }
        await printerDevice.transferOut(endpoint.endpointNumber, data);
    }, [printerDevice, isPrinterConnected]);

    const testPrinter = useCallback(async () => {
        if (!isPrinterConnected) {
            showNotification('Printer tidak terhubung.', 'error');
            return;
        }
        try {
            const encoder = new TextEncoder();
            const initCmd = new Uint8Array([0x1B, 0x40]);
            const testText = encoder.encode('Test Cetak Berhasil!\n\n');
            const cutCmd = new Uint8Array([0x1D, 0x56, 0x42, 0x00]);

            await sendDataToPrinter(initCmd);
            await sendDataToPrinter(testText);
            await sendDataToPrinter(cutCmd);
            showNotification('Tes cetak dikirim ke printer.');
        } catch (error) {
            console.error('Gagal mengirim tes cetak:', error);
            showNotification(`Gagal tes cetak: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
            setIsPrinterConnected(false);
            setPrinterDevice(null);
        }
    }, [isPrinterConnected, sendDataToPrinter, showNotification]);

    const printViaBrowser = useCallback(() => {
        document.title = ' '; // Sembunyikan judul saat mencetak
        
        const printCount = settings.printCount || 1;
        
        const handleAfterPrint = () => {
            document.body.classList.remove('printing-receipt');
            window.removeEventListener('afterprint', handleAfterPrint);
            document.title = originalTitleRef.current; // Kembalikan judul asli
            if (completedTransaction) {
                 closeSuccessModal();
            }
        };
        window.addEventListener('afterprint', handleAfterPrint);
        document.body.classList.add('printing-receipt');

        for (let i = 0; i < printCount; i++) {
            setTimeout(() => window.print(), i * 300);
        }
    }, [settings.printCount, completedTransaction, closeSuccessModal]);

    const handlePrintReceipt = useCallback(async () => {
        const audio = document.getElementById('cash-drawer-sound') as HTMLAudioElement;
        if(settings.cashdrawer === 'Aktif' && audio) {
            audio.play().catch(e => console.error("Error playing sound:", e));
        }

        const transactionToPrint = completedTransaction || lastTransaction;
        if (!transactionToPrint) return;

        if (isPrinterConnected) {
            try {
                const printCount = settings.printCount || 1;
                for (let i = 0; i < printCount; i++) {
                    const receiptData = generateEscPosReceipt(transactionToPrint, settings);
                    await sendDataToPrinter(receiptData);
                }
                showNotification(`Struk dikirim ke printer ${printCount}x`);
                closeSuccessModal();
            } catch (error) {
                 console.error('Gagal mencetak langsung:', error);
                 showNotification('Gagal cetak via USB, mencoba via browser.', 'error');
                 setIsPrinterConnected(false);
                 setPrinterDevice(null);
                 printViaBrowser();
            }
        } else {
            printViaBrowser();
        }
    }, [settings, isPrinterConnected, completedTransaction, lastTransaction, sendDataToPrinter, showNotification, printViaBrowser, closeSuccessModal]);
    // --- END OF PRINTER LOGIC ---

    useEffect(() => {
        const umumCustomer = customers.find(c => c.name === 'UMUM');
        if (umumCustomer) setSelectedCustomerId(umumCustomer.id);
    }, [customers]);

    useEffect(() => {
        getData('attendances').then(setAttendances);
    }, []);

    const resetCart = useCallback(() => {
        setCart([]);
        setDiscount(0);
        setOtherFees(0);
        const umumCustomer = customers.find(c => c.name === 'UMUM');
        setSelectedCustomerId(umumCustomer?.id || '1');
    }, [customers]);

    const subtotal = useMemo(() => {
        return cart.reduce((sum, cartItem) => {
            const { priceTier, quantity } = cartItem;
            const sortedLevels = [...(priceTier.wholesaleLevels || [])].sort((a, b) => b.minQty - a.minQty);
            let price = priceTier.price;
            for (const level of sortedLevels) {
                if (quantity >= level.minQty) {
                    price = level.price;
                    break;
                }
            }
            return sum + price * quantity;
        }, 0);
    }, [cart]);
    
    const taxRate = (settings?.taxRate || 11) / 100;
    const tax = useMemo(() => (subtotal - discount) * taxRate, [subtotal, discount, taxRate]);
    const total = useMemo(() => subtotal - discount + otherFees + tax, [subtotal, discount, otherFees, tax]);

    const handleTransactionCompleteWrapper = useCallback(async (paymentDetails: any) => {
        if (!activeShift) return;
        const newTransaction = await handleTransactionComplete(cart, { ...paymentDetails, discount, otherFees, total }, activeShift);
        setCompletedTransaction(newTransaction);
        resetCart();
    }, [handleTransactionComplete, cart, discount, otherFees, total, activeShift, resetCart]);
    
    const handleUpdateTransactionWrapper = useCallback(async (originalTransaction: Transaction, newCart: CartItem[], newTotal: number, paymentAmount: number, activeShift: Shift | null, shouldPrint: boolean) => {
        const updatedTransaction = await handleUpdateTransaction(originalTransaction, newCart, newTotal, paymentAmount, activeShift);
        if (shouldPrint && updatedTransaction) {
            setCompletedTransaction(updatedTransaction);
        }
    }, [handleUpdateTransaction]);

    const setTransactionToReprint = useCallback((transaction: Transaction) => {
        setCompletedTransaction(transaction);
        setIsReprinting(true);
    }, []);

    const handleHoldTransaction = useCallback(() => {
        if (!activeShift || cart.length === 0) return;
        const transactionToHold: Transaction = {
            id: `trans_${Date.now()}`,
            items: cart.map(item => ({ id: item.id, name: item.name, quantity: item.quantity, priceTier: item.priceTier })),
            total, discount, otherFees,
            paymentMethod: 'Pending', amountPaid: 0, change: 0,
            customerId: selectedCustomerId,
            timestamp: new Date(),
            shiftId: activeShift.id,
            cashierName: activeShift.adminName,
            status: 'pending'
        };
        const newTransactions = [...transactions, transactionToHold];
        setTransactions(newTransactions);
        saveData('transactions', newTransactions);
        showNotification('Transaksi berhasil ditahan.');
        resetCart();
    }, [cart, total, discount, otherFees, selectedCustomerId, activeShift, transactions, setTransactions, showNotification, resetCart]);

    const customSetPage = useCallback((targetPage: string) => {
        if (page === 'Kasir' && cart.length > 0 && targetPage !== 'Kasir') {
            setNavigateAwayData({ targetPage });
        } else {
            setPage(targetPage);
        }
    }, [page, cart.length]);
    
    const handleConfirmNavigation = useCallback((action: 'hold' | 'discard') => {
        if (!navigateAwayData) return;
        const { targetPage } = navigateAwayData;
        
        if (action === 'hold') {
            handleHoldTransaction();
        } else {
            resetCart();
        }
        setPage(targetPage);
        setNavigateAwayData(null);
    }, [navigateAwayData, handleHoldTransaction, resetCart]);

    const handleCancelNavigation = useCallback(() => setNavigateAwayData(null), []);

    const reportText = useMemo(() => {
        if (!activeShift?.startTime) return 'Tidak ada sesi aktif.';
        
        const shiftTransactions = transactions.filter(t => t.shiftId === activeShift.id);
        const expenses = activeShift?.expenses || [];
        
        const cashFromSales = shiftTransactions.filter(t => t.paymentMethod === 'Tunai').reduce((sum, t) => sum + t.amountPaid - t.change, 0);
        const cashFromDebt = debtPayments.filter(dp => dp.shiftId === activeShift.id).reduce((sum, dp) => sum + dp.amount, 0);
        const totalCashIn = cashFromSales + cashFromDebt;
        
        const totalExpenses = expenses.reduce((sum, out) => sum + out.amount, 0);
        const finalBalance = (activeShift?.initialBalance || 0) + totalCashIn - totalExpenses;

        const expensesList = expenses.length > 0
            ? expenses.map(ex => {
                const catName = expenseCategories.find(c => c.id === ex.categoryId)?.name || 'Lainnya';
                const takenBy = ex.takenBy || 'N/A';
                const description = ex.description;
                const amountStr = `Rp ${ex.amount.toLocaleString('id-ID')}`;

                const fullString = `:${takenBy}-${catName}-${description}-${amountStr}`;
                const maxWidth = 42; 

                let finalString = fullString;
                if (fullString.length > maxWidth) {
                    finalString = fullString.substring(0, maxWidth - 3) + '...';
                }
                
                return `  ${finalString}`;
            }).join('\n')
            : '  (Tidak ada)';
        
        const expenseSection = `BIAYA/KAS KELUAR:
${expensesList}
TOTAL      : Rp ${totalExpenses.toLocaleString('id-ID')}`;

        return `LAPORAN KASIR
----------------------------
KASIR      : ${activeShift.adminName}
WAKTU MULAI: ${new Date(activeShift.startTime).toLocaleString('id-ID')}
WAKTU AKHIR: ${new Date().toLocaleString('id-ID')}
----------------------------
KAS AWAL   : Rp ${(activeShift.initialBalance || 0).toLocaleString('id-ID')}
KAS MASUK  : Rp ${totalCashIn.toLocaleString('id-ID')}
----------------------------
${expenseSection}
----------------------------
KAS AKHIR  : Rp ${finalBalance.toLocaleString('id-ID')}
----------------------------`;
    }, [activeShift, transactions, expenseCategories, debtPayments]);

    const handleStartShift = useCallback(async (adminName: string, initialBalance: number) => {
        const newShiftId = `shift_${Date.now()}`;
        const newAttendance: Attendance = { id: `att_${Date.now()}`, employeeName: adminName, clockInTime: new Date(), shiftId: newShiftId };
        const newAttendances = [...attendances, newAttendance];
        setAttendances(newAttendances);
        await saveData('attendances', newAttendances);
        handleStartShiftShift(adminName, initialBalance, newShiftId);
    }, [attendances, handleStartShiftShift]);
    
    const handleEndShift = useCallback(() => {
        setShowEndShiftModal(true);
    }, []);

    const confirmEndShift = useCallback(() => {
        if (!activeShift) return;
        const userAttendance = attendances.find(a => a.shiftId === activeShift?.id && a.employeeName === activeShift?.adminName && !a.clockOutTime);
        if (userAttendance) {
            const updatedAttendance = { ...userAttendance, clockOutTime: new Date() };
            const newAttendances = attendances.map(a => a.id === userAttendance.id ? updatedAttendance : a);
            setAttendances(newAttendances);
            saveData('attendances', newAttendances);
        }
        handleEndShiftShift(transactions, debtPayments);
        setShowEndShiftModal(false);
    }, [activeShift, handleEndShiftShift, transactions, attendances, debtPayments]);

    const cancelEndShift = useCallback(() => {
        setShowEndShiftModal(false);
    }, []);

    const loadPendingTransaction = useCallback((transactionId: string) => {
        const trx = transactions.find(t => t.id === transactionId);
        if (trx) {
            setPendingTransaction(trx);
            const newTransactions = transactions.filter(t => t.id !== transactionId);
            setTransactions(newTransactions);
            saveData('transactions', newTransactions);
        }
    }, [transactions, setTransactions]);
    
    const clearPendingTransaction = useCallback(() => setPendingTransaction(null), []);
    
    const value = useMemo(() => ({
        page, setPage: customSetPage,
        activeShift, shifts, handleStartShift, handleEndShift, confirmEndShift, cancelEndShift, showEndShiftModal, handleAddExpense: handleAddExpenseShift,
        transactions, lastTransaction, receiptRef, handleUpdateTransactionWrapper,
        items, customers,
        attendances, loadPendingTransaction, pendingTransaction, clearPendingTransaction,
        settings, banks, expenseCategories, debtPayments, handlePayDebt,
        cart, setCart, discount, setDiscount, otherFees, setOtherFees,
        selectedCustomerId, setSelectedCustomerId,
        resetCart, handleTransactionCompleteWrapper, handleHoldTransaction,
        total, subtotal, tax,
        navigateAwayData, handleConfirmNavigation, handleCancelNavigation,
        completedTransaction, handlePrintReceipt, closeSuccessModal, setTransactionToReprint, isReprinting, setIsReprinting,
        reportText,
        showAttendanceReportPrint, setShowAttendanceReportPrint,
        isPrinterConnected, connectPrinter, testPrinter
    }), [
        page, customSetPage,
        activeShift, shifts, handleStartShift, handleEndShift, confirmEndShift, cancelEndShift, showEndShiftModal, handleAddExpenseShift,
        transactions, lastTransaction, receiptRef, handleUpdateTransactionWrapper,
        items, customers,
        attendances, loadPendingTransaction, pendingTransaction, clearPendingTransaction,
        settings, banks, expenseCategories, debtPayments, handlePayDebt,
        cart, setCart, discount, setDiscount, otherFees, setOtherFees,
        selectedCustomerId, setSelectedCustomerId,
        resetCart, handleTransactionCompleteWrapper, handleHoldTransaction,
        total, subtotal, tax,
        navigateAwayData, handleConfirmNavigation, handleCancelNavigation,
        completedTransaction, handlePrintReceipt, closeSuccessModal, setTransactionToReprint, isReprinting, setIsReprinting,
        reportText,
        showAttendanceReportPrint, setShowAttendanceReportPrint,
        isPrinterConnected, connectPrinter, testPrinter
    ]);

    return (
        <SessionContext.Provider value={value}>
            {children}
        </SessionContext.Provider>
    );
};

export const useSession = () => {
    const context = useContext(SessionContext);
    if (context === undefined) throw new Error('useSession must be used within a SessionProvider');
    return context;
};
