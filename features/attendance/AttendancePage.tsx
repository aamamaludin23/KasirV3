
import React, { useState, useMemo } from 'react';
import type { Expense, Attendance, Shift, ExpenseCategory, Transaction } from '../../types';
import { useSession } from '../../context/SessionContext';
import { Modal } from '../../components/Modal';
import { EmptyState } from '../../components/EmptyState';

const AttendancePage: React.FC = () => {
    const { shifts, handleEndShift, handleAddExpense, transactions, attendances, reportText, expenseCategories, debtPayments, setShowAttendanceReportPrint } = useSession();
    
    // By deriving activeShift here from the master `shifts` array, we ensure this component
    // always has the latest data, bypassing any potential memoization issues in the contexts.
    const activeShift = useMemo(() => shifts.find(s => s.status === 'active') || null, [shifts]);

    const [activeTab, setActiveTab] = useState('Sesi Saat Ini');
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [expenseAmount, setExpenseAmount] = useState('');
    const [expenseCategoryId, setExpenseCategoryId] = useState('');
    const [expenseDescription, setExpenseDescription] = useState('');
    const [expenseTakenBy, setExpenseTakenBy] = useState('');

    const handleConfirmAddExpense = () => {
        const amount = Number(expenseAmount);
        if (amount > 0 && expenseCategoryId && expenseDescription.trim() && expenseTakenBy.trim()) {
            handleAddExpense({
                amount,
                categoryId: expenseCategoryId,
                description: expenseDescription,
                takenBy: expenseTakenBy,
            });
            setShowExpenseModal(false);
            setExpenseAmount('');
            setExpenseCategoryId('');
            setExpenseDescription('');
            setExpenseTakenBy('');
        } else {
            alert('Harap isi semua kolom dengan benar.');
        }
    };
    
    const shiftAttendances = useMemo(() => {
        if (!activeShift) return [];
        return attendances
            .filter(a => a.shiftId === activeShift.id)
            .sort((a,b) => new Date(b.clockInTime).getTime() - new Date(a.clockInTime).getTime());
    }, [attendances, activeShift]);
    
    const closedShifts = useMemo(() => {
        return shifts
            .filter(s => s.status === 'closed')
            .sort((a, b) => new Date(b.endTime!).getTime() - new Date(a.startTime).getTime());
    }, [shifts]);

    const handlePrintReport = () => {
        setShowAttendanceReportPrint(true);
    };

    const calculateDuration = (startTime: Date, endTime?: Date) => {
        if (!endTime) return '-';
        const diff = new Date(endTime).getTime() - new Date(startTime).getTime();
        if (diff < 0) return '-';
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        return `${hours}j ${minutes}m`;
    };

    const renderShiftDetails = (shift: Shift, categories: ExpenseCategory[]) => {
        const totalExpenseAmount = (shift.expenses || []).reduce((sum, ex) => sum + ex.amount, 0);

        const shiftTransactions = transactions.filter(t => t.shiftId === shift.id);
        const cashFromSales = shiftTransactions.filter(t => t.paymentMethod === 'Tunai').reduce((sum, t) => sum + t.amountPaid - t.change, 0);
        const cashFromDebt = debtPayments.filter(dp => dp.shiftId === shift.id).reduce((sum, dp) => sum + dp.amount, 0);
        const totalCashIn = cashFromSales + cashFromDebt;

        const currentBalance = (shift.initialBalance || 0) + totalCashIn - totalExpenseAmount;
        
        const balanceToShow = shift.status === 'active' ? currentBalance : shift.finalBalance;
        const cashInToShow = shift.status === 'active' ? totalCashIn : (shift.cashSales || 0);


        return (
            <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Saldo Awal:</span> <span>Rp {(shift.initialBalance || 0).toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between"><span>Kas Masuk:</span> <span>Rp {cashInToShow.toLocaleString('id-ID')}</span></div>
                <div>
                    <div className="flex justify-between items-center">
                        <span>Biaya/Kas Keluar:</span> 
                        <span className="font-semibold">Rp {totalExpenseAmount.toLocaleString('id-ID')}</span>
                    </div>
                    {(shift.expenses || []).length > 0 && (
                        <div className="pl-4 mt-1 text-xs text-secondary border-l-2 border-default ml-2 space-y-1 py-1">
                            {(shift.expenses || []).map(ex => {
                                const categoryName = categories.find(c => c.id === ex.categoryId)?.name || 'Lainnya';
                                const takenByText = ex.takenBy ? ` (${ex.takenBy})` : '';
                                return (
                                <div key={ex.id} className="flex justify-between">
                                    <span className="truncate pr-2">- {categoryName}: {ex.description}{takenByText}</span>
                                    <span>Rp {ex.amount.toLocaleString('id-ID')}</span>
                                </div>
                            )})}
                        </div>
                    )}
                </div>
                <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t border-dashed border-default">
                    <span>{shift.status === 'active' ? 'Saldo Saat Ini:' : 'Saldo Akhir:'}</span> 
                    <span>Rp {(balanceToShow || 0).toLocaleString('id-ID')}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="text-primary">
            <h2 className="text-3xl font-bold mb-6">Sesi & Absensi</h2>
            <div className="flex border-b border-default mb-6">
                {['Sesi Saat Ini', 'Riwayat Sesi', 'Riwayat Absensi'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`py-2 px-4 text-sm font-medium transition-colors ${activeTab === tab ? 'border-b-2 border-accent accent-color' : 'text-secondary hover:text-primary'}`}>
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === 'Sesi Saat Ini' && (
                !activeShift ? <EmptyState title="Tidak Ada Sesi Aktif" message="Silakan mulai sesi baru untuk melihat detailnya." /> :
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-secondary p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-bold mb-4">Informasi Sesi</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between text-lg"><span>Kasir:</span> <span className="font-semibold">{activeShift.adminName}</span></div>
                            <div className="flex justify-between text-lg"><span>Mulai:</span> <span className="font-semibold text-sm">{new Date(activeShift.startTime!).toLocaleTimeString('id-ID')}</span></div>
                            <hr className="border-default my-3"/>
                            {renderShiftDetails(activeShift, expenseCategories)}
                        </div>
                        <div className="mt-6 flex flex-wrap gap-2">
                            <button onClick={() => setShowExpenseModal(true)} className="bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-yellow-600">Tambah Biaya</button>
                            <button onClick={handlePrintReport} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">Cetak Laporan</button>
                            <button onClick={handleEndShift} className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700">Akhiri Sesi</button>
                        </div>
                    </div>
                    <div className="bg-secondary p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-bold mb-4">Laporan Kas</h2>
                        <pre className="bg-tertiary p-4 rounded-md font-mono text-sm whitespace-pre-wrap overflow-x-auto">{reportText}</pre>
                    </div>
                </div>
            )}
            
            {activeTab === 'Riwayat Sesi' && (
                 <div className="bg-secondary p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-bold mb-4">Riwayat Sesi Kasir</h3>
                    {closedShifts.length > 0 ? (
                        <div className="space-y-4">
                            {closedShifts.map((shift) => (
                                <div key={shift.id} className="p-4 border border-default rounded-lg">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="font-bold text-lg">{shift.adminName}</p>
                                            <p className="text-xs text-secondary">{new Date(shift.startTime).toLocaleString('id-ID')} - {shift.endTime ? new Date(shift.endTime).toLocaleString('id-ID') : ''}</p>
                                        </div>
                                        <span className="text-xs font-semibold bg-gray-200 text-gray-700 px-2 py-1 rounded-full">Selesai</span>
                                    </div>
                                    {renderShiftDetails(shift, expenseCategories)}
                                </div>
                            ))}
                        </div>
                    ) : <EmptyState title="Tidak Ada Riwayat" message="Belum ada sesi yang diselesaikan." />}
                 </div>
            )}
            
            {activeTab === 'Riwayat Absensi' && (
                <div className="bg-secondary p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-bold mb-4">Riwayat Absensi Sesi Ini</h3>
                    {shiftAttendances.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-tertiary">
                                    <tr>
                                        <th className="p-3 font-semibold text-secondary">Nama Karyawan</th>
                                        <th className="p-3 font-semibold text-secondary">Masuk</th>
                                        <th className="p-3 font-semibold text-secondary">Keluar</th>
                                        <th className="p-3 font-semibold text-secondary">Durasi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shiftAttendances.map((att: Attendance) => (
                                        <tr key={att.id} className="border-b border-default">
                                            <td className="p-3">{att.employeeName}</td>
                                            <td className="p-3">{new Date(att.clockInTime).toLocaleTimeString('id-ID')}</td>
                                            <td className="p-3">{att.clockOutTime ? new Date(att.clockOutTime).toLocaleTimeString('id-ID') : 'Masih Bekerja'}</td>
                                            <td className="p-3">{calculateDuration(att.clockInTime, att.clockOutTime)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : <EmptyState title="Tidak Ada Absensi" message="Belum ada absensi tercatat untuk sesi ini." />}
                </div>
            )}
            
            <Modal show={showExpenseModal} onClose={() => setShowExpenseModal(false)} title="Tambah Biaya (Kas Keluar)">
                <div className="space-y-4 text-primary">
                    <div>
                        <label className="block text-sm font-bold">Jumlah (Rp)</label>
                        <input type="number" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} className="w-full p-2 mt-1 border border-default rounded-md bg-secondary"/>
                    </div>
                     <div>
                        <label className="block text-sm font-bold">Nama Pengambil</label>
                        <input type="text" value={expenseTakenBy} onChange={e => setExpenseTakenBy(e.target.value)} className="w-full p-2 mt-1 border border-default rounded-md bg-secondary"/>
                    </div>
                    <div>
                        <label className="block text-sm font-bold">Kategori Biaya</label>
                        <select value={expenseCategoryId} onChange={e => setExpenseCategoryId(e.target.value)} className="w-full p-2 mt-1 border border-default rounded-md bg-secondary">
                            <option value="">Pilih Kategori...</option>
                            {expenseCategories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-bold">Keterangan</label>
                        <input type="text" value={expenseDescription} onChange={e => setExpenseDescription(e.target.value)} className="w-full p-2 mt-1 border border-default rounded-md bg-secondary"/>
                    </div>
                    <div className="flex justify-end">
                        <button onClick={handleConfirmAddExpense} className="accent-bg accent-text font-bold py-2 px-4 rounded-lg accent-bg-hover">Simpan</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AttendancePage;