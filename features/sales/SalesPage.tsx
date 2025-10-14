import React, { useState, useMemo } from 'react';
import type { Transaction, CartItem } from '../../types';
import { useData } from '../../context/DataContext';
import { useSettings } from '../../context/SettingsContext';
import { useSession } from '../../context/SessionContext';
import { StatCard } from '../../components/StatCard';
import { EditTransactionModal } from './EditTransactionModal';
import { ICONS } from '../../constants';
import { EmptyState } from '../../components/EmptyState';

const SalesPage: React.FC = () => {
    const { items, customers } = useData();
    const { settings } = useSettings();
    const { transactions, handleUpdateTransaction, loadPendingTransaction, setPage, activeShift } = useSession();

    const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
    const [dateRange, setDateRange] = useState('all');
    const [searchTerm, setSearchTerm] = useState(''); // New state for search

    const filteredTransactions = useMemo(() => {
        let filtered = transactions;

        // Filter by date range
        if (dateRange !== 'all') {
            const now = new Date();
            const startDate = new Date();
            startDate.setHours(0, 0, 0, 0);

            if (dateRange === 'week') startDate.setDate(now.getDate() - 7);
            else if (dateRange === 'month') startDate.setDate(now.getDate() - 30);
            
            filtered = transactions.filter(t => new Date(t.timestamp) >= startDate);
        }

        // Filter by search term
        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(t => {
                const customer = customers.find(c => c.id === t.customerId);
                const customerName = customer ? customer.name.toLowerCase() : '';
                const transactionId = t.id.toLowerCase();
                return transactionId.includes(lowercasedTerm) || customerName.includes(lowercasedTerm);
            });
        }
        
        return filtered;
    }, [dateRange, searchTerm, transactions, customers]);

    const salesSummary = useMemo(() => {
        let revenue = 0;
        let cogs = 0;
        const completedTransactions = filteredTransactions.filter(t => t.status !== 'pending');
        completedTransactions.forEach(t => {
            revenue += t.total;
            t.items.forEach(item => {
                const fullItem = items.find(i => i.id === item.id);
                if (fullItem) {
                    const priceTier = fullItem.prices.find(p => p.name === item.priceTier.name);
                    if (priceTier && priceTier.konversi > 0) {
                        const costPerUnit = fullItem.hargaModal / priceTier.konversi;
                        cogs += costPerUnit * item.quantity;
                    }
                }
            });
        });
        const profit = revenue - cogs;
        return { revenue, cogs, profit };
    }, [filteredTransactions, items]);
    
    const handleExport = () => {
        const XLSX = (window as any).XLSX;
        if (!XLSX) return alert("Pustaka ekspor belum siap, silakan coba lagi.");

        const dataToExport = filteredTransactions.flatMap(t => {
            const customer = customers.find(c => c.id === t.customerId);
            return t.items.map(item => {
                const fullItem = items.find(i => i.id === item.id);
                let costPricePerUnit = 0;
                if (fullItem) {
                    const priceTier = fullItem.prices.find(p => p.name === item.priceTier.name);
                    if (priceTier && priceTier.konversi > 0) costPricePerUnit = fullItem.hargaModal / priceTier.konversi;
                }
                const subtotal = item.priceTier.price * item.quantity;
                const cost = costPricePerUnit * item.quantity;
                
                let statusText = 'Selesai';
                if (t.status === 'pending') statusText = 'Pending';
                else if (t.paymentMethod === 'Kredit') statusText = 'Kredit';

                return { 'Tanggal': new Date(t.timestamp).toLocaleString('id-ID'), 'No. Transaksi': t.id, 'Kasir': t.cashierName, 'Pelanggan': customer?.name || 'UMUM', 'Nama Barang': item.name, 'Satuan': item.priceTier.name, 'Kuantitas': item.quantity, 'Harga Modal': costPricePerUnit, 'Harga Jual': item.priceTier.price, 'Subtotal': subtotal, 'Keuntungan': subtotal - cost, 'Status': statusText };
            });
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Penjualan");
        XLSX.writeFile(workbook, "Laporan_Penjualan.xlsx");
    };

    const handleSaveChanges = (newCart: CartItem[], newTotal: number, paymentAmount: number) => {
        if (!transactionToEdit) return;
        handleUpdateTransaction(transactionToEdit, newCart, newTotal, paymentAmount, activeShift, false);
        setTransactionToEdit(null);
    };
    
    const handleSaveAndPrint = (newCart: CartItem[], newTotal: number, paymentAmount: number) => {
        if (!transactionToEdit) return;
        handleUpdateTransaction(transactionToEdit, newCart, newTotal, paymentAmount, activeShift, true);
        setTransactionToEdit(null);
    };

    const handleContinueTransaction = (transactionId: string) => {
        loadPendingTransaction(transactionId);
        setPage('Kasir');
    };

    const statusStyles = {
        pending: 'bg-yellow-100 text-yellow-800',
        completed: 'bg-green-100 text-green-800',
        kredit: 'bg-red-100 text-red-800',
    };

    return (
        <div className="text-primary">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                 <h2 className="text-2xl md:text-3xl font-bold">Laporan Penjualan</h2>
                 <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 w-full md:w-auto">
                     <input
                        type="text"
                        placeholder="Cari No. Transaksi / Pelanggan..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="p-2 w-full md:w-64 border border-default rounded-md bg-secondary text-sm"
                    />
                     <select onChange={(e) => setDateRange(e.target.value)} value={dateRange} className="p-2 w-full md:w-auto border border-default rounded-md bg-secondary text-sm">
                         <option value="all">Semua Waktu</option>
                         <option value="today">Hari Ini</option>
                         <option value="week">7 Hari Terakhir</option>
                         <option value="month">30 Hari Terakhir</option>
                     </select>
                     <button onClick={handleExport} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 text-sm whitespace-nowrap w-full md:w-auto">
                        Ekspor
                    </button>
                 </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <StatCard title="Pendapatan Kotor" value={`Rp ${salesSummary.revenue.toLocaleString('id-ID')}`} icon={ICONS.dashboard} />
                <StatCard title="Total Modal" value={`Rp ${salesSummary.cogs.toLocaleString('id-ID')}`} icon={ICONS.inventory} />
                <StatCard title="Keuntungan" value={`Rp ${salesSummary.profit.toLocaleString('id-ID')}`} icon={ICONS.sales} />
            </div>

            <div className="bg-secondary p-2 md:p-6 rounded-lg shadow-md">
                {filteredTransactions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-tertiary border-b border-default">
                                <tr>
                                    <th className="p-3 font-semibold text-secondary hidden md:table-cell">ID</th>
                                    <th className="p-3 font-semibold text-secondary">Waktu</th>
                                    <th className="p-3 font-semibold text-secondary hidden md:table-cell">Item</th>
                                    <th className="p-3 font-semibold text-secondary text-right">Total</th>
                                    <th className="p-3 font-semibold text-secondary">Status</th>
                                    <th className="p-3 font-semibold text-secondary">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(t => {
                                    let status: 'completed' | 'pending' | 'kredit';
                                    let statusText: string;

                                    if (t.status === 'pending') {
                                        status = 'pending';
                                        statusText = 'Pending';
                                    } else if (t.paymentMethod === 'Kredit') {
                                        status = 'kredit';
                                        statusText = 'Kredit';
                                    } else {
                                        status = 'completed';
                                        statusText = 'Selesai';
                                    }

                                    return (
                                        <tr key={t.id} className="border-b border-default hover:bg-tertiary">
                                            <td className="p-3 text-sm font-mono hidden md:table-cell">...{t.id.slice(-6)}</td>
                                            <td className="p-3 text-sm">{new Date(t.timestamp).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</td>
                                            <td className="p-3 text-sm hidden md:table-cell">{t.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                                            <td className="p-3 text-sm font-semibold text-right">Rp {t.total.toLocaleString('id-ID')}</td>
                                            <td className="p-3 text-sm">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status]}`}>
                                                    {statusText}
                                                </span>
                                            </td>
                                            <td className="p-3 text-sm">
                                                {status === 'pending' ? (
                                                    <button onClick={() => handleContinueTransaction(t.id)} className="text-green-600 font-bold hover:underline">Lanjutkan</button>
                                                ) : (
                                                    <button onClick={() => setTransactionToEdit(t)} className="accent-color hover:underline">Edit</button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState title="Tidak Ada Penjualan" message="Belum ada transaksi yang cocok dengan kriteria filter." />
                )}
            </div>
            
            {transactionToEdit && (
                <EditTransactionModal 
                    transaction={transactionToEdit}
                    onClose={() => setTransactionToEdit(null)}
                    onSave={handleSaveChanges}
                    onSaveAndPrint={handleSaveAndPrint}
                />
            )}
        </div>
    );
};

export default SalesPage;