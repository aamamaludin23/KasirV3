
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
// Impor tipe yang sudah diperbaiki: Ganti Transaction dengan Sale
import type { Shift, Sale, Attendance, CartItem, Customer, Item, Expense, Settings, DebtPayment, ExpenseCategory, Bank } from '../types';
import { useShift } from './ShiftContext';
import { useTransaction } from './TransactionContext';
import { useData } from './DataContext';
import { saveData } from '../services/db';
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
    handleAddExpense: (expense: Omit<Expense, 'id' | 'timestamp' | 'shiftId'>) => void;

    transactions: Sale[]; // Ganti Transaction dengan Sale
    lastTransaction: Sale | null; // Ganti Transaction dengan Sale
    receiptRef: React.RefObject<HTMLDivElement>;
    handleUpdateTransactionWrapper: (originalTransaction: Sale, newCart: CartItem[], newTotal: number, paymentAmount: number, activeShift: Shift | null, shouldPrint: boolean) => void;
    
    items: Item[];
    customers: Customer[];
    
    attendances: Attendance[];
    loadPendingTransaction: (transactionId: string) => void;
    pendingTransaction: Sale | null; // Ganti Transaction dengan Sale
    clearPendingTransaction: () => void;
    
    settings: Settings;
    banks: Bank[];
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
    completedTransaction: Sale | null; // Ganti Transaction dengan Sale
    handlePrintReceipt: () => void;
    closeSuccessModal: () => void;
    setTransactionToReprint: (transaction: Sale) => void; // Ganti Transaction dengan Sale
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
    const [pendingTransaction, setPendingTransaction] = useState<Sale | null>(null);
    const [showEndShiftModal, setShowEndShiftModal] = useState(false);
    const [completedTransaction, setCompletedTransaction] = useState<Sale | null>(null);
    const [showAttendanceReportPrint, setShowAttendanceReportPrint] = useState(false);
    const [isReprinting, setIsReprinting] = useState(false);
    const originalTitleRef = useRef(document.title);

    // Printer State
    const [printerDevice, setPrinterDevice] = useState<USBDevice | null>(null);
    const [isPrinterConnected, setIsPrinterConnected] = useState(false);

    const { showNotification } = useNotification();
    const { activeShift, shifts, handleAddExpense: handleAddExpenseShift, handleEndShift: handleEndShiftShift, handleStartShift: handleStartShiftShift, attendances, setAttendances } = useShift();
    const { transactions, setTransactions, lastTransaction, receiptRef, handleTransactionComplete, handleUpdateTransaction } = useTransaction();
    const { items, customers, banks, expenseCategories, debtPayments, handlePayDebt } = useData();
    const { settings } = useSettings();

    const closeSuccessModal = useCallback(() => {
        setCompletedTransaction(null);
    }, []);

    // --- PRINTER LOGIC (tetap sama) ---
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
        document.title = ' ';
        const printCount = settings.printCount || 1;
        const handleAfterPrint = () => {
            document.body.classList.remove('printing-receipt');
            window.removeEventListener('afterprint', handleAfterPrint);
            document.title = originalTitleRef.current;
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

    const resetCart = useCallback(() => {
        setCart([]);
        setDiscount(0);
        setOtherFees(0);
        const umumCustomer = customers.find(c => c.name === 'UMUM');
        setSelectedCustomerId(umumCustomer?.id || '1');
    }, [customers]);

    const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.priceTier.price * item.quantity, 0), [cart]);
    const taxRate = (settings?.taxRate || 11) / 100;
    const tax = useMemo(() => (subtotal - discount) * taxRate, [subtotal, discount, taxRate]);
    const total = useMemo(() => subtotal - discount + otherFees + tax, [subtotal, discount, otherFees, tax]);

    const handleTransactionCompleteWrapper = useCallback(async (paymentDetails: any) => {
        if (!activeShift) return;
        const newTransaction = await handleTransactionComplete(cart, { ...paymentDetails, discount, otherFees, total }, activeShift);
        setCompletedTransaction(newTransaction);
        resetCart();
    }, [handleTransactionComplete, cart, discount, otherFees, total, activeShift, resetCart]);
    
    const handleUpdateTransactionWrapper = useCallback(async (originalTransaction: Sale, newCart: CartItem[], newTotal: number, paymentAmount: number, activeShift: Shift | null, shouldPrint: boolean) => {
        const updatedTransaction = await handleUpdateTransaction(originalTransaction, newCart, newTotal, paymentAmount, activeShift);
        if (shouldPrint && updatedTransaction) {
            setCompletedTransaction(updatedTransaction);
        }
    }, [handleUpdateTransaction]);

    const setTransactionToReprint = useCallback((transaction: Sale) => {
        setCompletedTransaction(transaction);
        setIsReprinting(true);
    }, []);

    const handleHoldTransaction = useCallback(async () => {
        if (!activeShift || cart.length === 0) return;
        // Logika menahan transaksi perlu disesuaikan atau dihapus jika tidak lagi relevan
        // Untuk saat ini, fungsi ini dikosongkan untuk menghindari error
        showNotification('Fitur menahan transaksi sedang ditinjau.', 'info');
    }, [activeShift, cart, showNotification]);

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
        // Logika ini mungkin perlu diperbarui berdasarkan struktur data shift yang baru
        return "Laporan sedang dalam pengembangan";
    }, []);

    const handleStartShift = useCallback(async (adminName: string, initialBalance: number) => {
        await handleStartShiftShift(adminName, initialBalance);
    }, [handleStartShiftShift]);
    
    const handleEndShift = useCallback(() => {
        setShowEndShiftModal(true);
    }, []);

    const confirmEndShift = useCallback(async () => {
        await handleEndShiftShift();
        setShowEndShiftModal(false);
    }, [handleEndShiftShift]);

    const cancelEndShift = useCallback(() => {
        setShowEndShiftModal(false);
    }, []);

    const loadPendingTransaction = useCallback((transactionId: string) => {
        const trx = transactions.find(t => t.id === transactionId);
        if (trx) {
            setPendingTransaction(trx);
            const newTransactions = transactions.filter(t => t.id !== transactionId);
            setTransactions(newTransactions);
            // saveData('transactions', newTransactions); // Sebaiknya ditangani di dalam useTransaction
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
