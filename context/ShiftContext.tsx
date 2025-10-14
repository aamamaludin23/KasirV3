
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Shift, Expense, Transaction, DebtPayment } from '../types';
import { saveData, getData } from '../services/db';

interface ShiftContextType {
    activeShift: Shift | null;
    shifts: Shift[];
    handleStartShift: (adminName: string, initialBalance: number, newShiftId?: string) => void;
    handleEndShift: (transactions: Transaction[], debtPayments: DebtPayment[]) => void;
    handleAddExpense: (expense: Omit<Expense, 'id' | 'timestamp'>) => void;
}

export const ShiftContext = createContext<ShiftContextType | undefined>(undefined);

export const ShiftProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [shifts, setShifts] = useState<Shift[]>([]);

    // Derived state: activeShift is always the active shift from the shifts array.
    const activeShift = useMemo(() => shifts.find(s => s.status === 'active') || null, [shifts]);

    useEffect(() => {
        const loadShifts = async () => {
            const allShifts = await getData('shifts');
            setShifts(allShifts);
        };
        loadShifts();
    }, []);

    const handleStartShift = async (adminName: string, initialBalance: number, newShiftId?: string) => {
        const newShift: Shift = {
            id: newShiftId || `shift_${Date.now()}`,
            adminName, initialBalance,
            startTime: new Date(),
            status: 'active',
            expenses: [],
        };
        const newShifts = [...shifts, newShift];
        setShifts(newShifts);
        await saveData('shifts', newShifts);
    };

    const handleEndShift = useCallback((transactions: Transaction[], debtPayments: DebtPayment[]) => {
        if (!activeShift) return;
        
        const shiftTransactions = transactions.filter(t => t.shiftId === activeShift.id);
        const cashFromSales = shiftTransactions.filter(t => t.paymentMethod === 'Tunai').reduce((sum, t) => sum + t.amountPaid - t.change, 0);
        const cashFromDebt = debtPayments.filter(dp => dp.shiftId === activeShift.id).reduce((sum, dp) => sum + dp.amount, 0);
        const totalCashIn = cashFromSales + cashFromDebt;
        
        const totalExpenses = (activeShift.expenses || []).reduce((sum, out) => sum + out.amount, 0);
        const finalBalance = (activeShift.initialBalance || 0) + totalCashIn - totalExpenses;

        const endedShift: Shift = {
            ...activeShift,
            status: 'closed',
            endTime: new Date(),
            cashSales: totalCashIn,
            finalBalance: finalBalance,
        };
        
        const updatedShifts = shifts.map(s => s.id === activeShift.id ? endedShift : s)
        setShifts(updatedShifts);
        saveData('shifts', updatedShifts);
    }, [activeShift, shifts]);
    
    const handleAddExpense = (expense: Omit<Expense, 'id' | 'timestamp'>) => {
        const newExpense: Expense = { ...expense, id: `exp_${Date.now()}`, timestamp: new Date() };

        setShifts(prevShifts => {
            const newShifts = prevShifts.map(s => {
                if (s.status === 'active') {
                    return {
                        ...s,
                        expenses: [...(s.expenses || []), newExpense]
                    };
                }
                return s;
            });
            saveData('shifts', newShifts);
            return newShifts;
        });
    };

    return (
        <ShiftContext.Provider value={{ activeShift, shifts, handleStartShift, handleEndShift, handleAddExpense }}>
            {children}
        </ShiftContext.Provider>
    );
};

export const useShift = () => {
    const context = useContext(ShiftContext);
    if (context === undefined) throw new Error('useShift must be used within a ShiftProvider');
    return context;
};
