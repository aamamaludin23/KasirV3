

import React, { useMemo, useState } from 'react';
import type { Item, Expense } from '../../types';
import { useSession } from '../../context/SessionContext';
import { useData } from '../../context/DataContext';
import { useSettings } from '../../context/SettingsContext';
import { EmptyState } from '../../components/EmptyState';

const ReportsPage: React.FC = () => {
    const { transactions, shifts } = useSession();
    const { items, expenseCategories } = useData();
    const { settings } = useSettings();
    const [activeTab, setActiveTab] = useState('Profitabilitas');
    const [dateRange, setDateRange] = useState('all');
    const [reportGeneratedTime] = useState(new Date());
    
    const Recharts = (window as any).Recharts;
    const { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } = Recharts || {};
    
    const filteredData = useMemo(() => {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let startDate: Date;
        if (dateRange === 'today') startDate = startOfDay;
        else if (dateRange === 'week') startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        else if (dateRange === 'month') startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        else startDate = new Date(0); // all time

        return {
            transactions: transactions.filter(t => new Date(t.timestamp) >= startDate),
            shifts: shifts.filter(s => new Date(s.startTime) >= startDate)
        };
    }, [dateRange, transactions, shifts]);

    const reportData = useMemo(() => {
        const { transactions: currentTransactions, shifts: currentShifts } = filteredData;

        // Profitability Report
        const productProfit: Record<string, { totalProfit: number; quantitySold: number }> = {};
        currentTransactions.forEach(t => {
            t.items.forEach(tItem => {
                const fullItem = items.find(i => i.id === tItem.id);
                if (fullItem) {
                    const priceTier = fullItem.prices.find(p => p.name === tItem.priceTier.name);
                    if (priceTier && priceTier.konversi > 0) {
                        const costPerUnit = fullItem.hargaModal / priceTier.konversi;
                        const profitPerUnit = tItem.priceTier.price - costPerUnit;
                        const totalProfitForItem = profitPerUnit * tItem.quantity;
                        const key = `${fullItem.name} (${tItem.priceTier.name})`;
                        if (!productProfit[key]) productProfit[key] = { totalProfit: 0, quantitySold: 0 };
                        productProfit[key].totalProfit += totalProfitForItem;
                        productProfit[key].quantitySold += tItem.quantity;
                    }
                }
            });
        });
        const productProfitabilityData = Object.entries(productProfit).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.totalProfit - a.totalProfit);

        // Payment Method Report
        const paymentMethodSales = currentTransactions.reduce((acc, t) => {
            acc[t.paymentMethod] = (acc[t.paymentMethod] || 0) + t.total;
            return acc;
        }, {} as Record<string, number>);
        const paymentMethodData = Object.entries(paymentMethodSales).map(([name, value]) => ({ name, value }));
        
        // Low Stock Report
        const lowStockItems = items.filter(item => item.prices.some(p => p.stock <= (settings.lowStockThreshold || 5)));

        // Expense Report
        const allExpenses = currentShifts.flatMap(s => s.expenses || []);
        const detailedExpenseData = allExpenses.map(expense => ({
            ...expense,
            categoryName: expenseCategories.find(c => c.id === expense.categoryId)?.name || 'Lain-lain',
        })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // P&L Report
        const totalRevenue = currentTransactions.reduce((sum, t) => sum + t.total, 0);
        const totalCogs = currentTransactions.reduce((sum, t) => {
            return sum + t.items.reduce((itemSum, tItem) => {
                const fullItem = items.find(i => i.id === tItem.id);
                if (fullItem) {
                    const priceTier = fullItem.prices.find(p => p.name === tItem.priceTier.name);
                    if (priceTier && priceTier.konversi > 0) {
                        const costPerUnit = fullItem.hargaModal / priceTier.konversi;
                        return itemSum + (costPerUnit * tItem.quantity);
                    }
                }
                return itemSum;
            }, 0);
        }, 0);
        const grossProfit = totalRevenue - totalCogs;
        const totalExpenses = allExpenses.reduce((sum, ex) => sum + ex.amount, 0);
        const netProfit = grossProfit - totalExpenses;

        return { productProfitabilityData, paymentMethodData, lowStockItems, detailedExpenseData, totalRevenue, totalCogs, grossProfit, totalExpenses, netProfit };
    }, [filteredData, items, settings.lowStockThreshold, expenseCategories]);
    
    const handlePrint = () => {
        const { storeName = 'KasirPro', address = 'Alamat Toko Anda', phone = 'Nomor Telepon Anda' } = settings;
        const dateRangeText = {
            all: 'Semua Waktu',
            today: 'Hari Ini',
            week: '7 Hari Terakhir',
            month: '30 Hari Terakhir'
        }[dateRange];

        let content = '';
        
        const header = `
            <div style="text-align: center; font-family: monospace; color: black;">
                <h1 style="font-size: 1.25rem; font-weight: bold; text-transform: uppercase;">${storeName}</h1>
                <p style="font-size: 0.75rem;">${address}</p>
                <p style="font-size: 0.75rem;">Telp: ${phone}</p>
                <hr style="border-style: dashed; border-color: black; margin: 0.5rem 0;" />
                <h2 style="font-size: 1rem; font-weight: bold;">Laporan ${activeTab}</h2>
                <p style="font-size: 0.75rem;">Periode: ${dateRangeText}</p>
                <p style="font-size: 0.75rem;">Dicetak: ${reportGeneratedTime.toLocaleString('id-ID')}</p>
                <hr style="border-style: dashed; border-color: black; margin: 0.5rem 0;" />
            </div>
        `;

        const footer = `
            <div style="text-align: center; font-family: monospace; color: black; margin-top: 1rem;">
                <p style="font-size: 0.75rem;">Powered by KasirPro</p>
            </div>
        `;

        const tableStyle = `width: 100%; font-family: monospace; font-size: 0.75rem; border-collapse: collapse;`;
        const thStyle = `padding: 5px; text-align: left; border-bottom: 1px solid #ccc;`;
        const tdStyle = `padding: 5px; border-bottom: 1px solid #eee;`;

        if (activeTab === 'Profitabilitas') {
            if (reportData.productProfitabilityData.length === 0) { alert("Tidak ada data untuk dicetak."); return; }
            content = `
                <table style="${tableStyle}">
                    <thead><tr><th style="${thStyle}">Produk</th><th style="${thStyle} text-align: right;">Terjual</th><th style="${thStyle} text-align: right;">Keuntungan</th></tr></thead>
                    <tbody>
                        ${reportData.productProfitabilityData.map(item => `
                            <tr>
                                <td style="${tdStyle}">${item.name}</td>
                                <td style="${tdStyle} text-align: right;">${item.quantitySold}</td>
                                <td style="${tdStyle} text-align: right;">${item.totalProfit.toLocaleString('id-ID')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else if (activeTab === 'Laporan Biaya') {
            if (reportData.detailedExpenseData.length === 0) { alert("Tidak ada data untuk dicetak."); return; }
            content = `
                <table style="${tableStyle}">
                    <thead><tr><th style="${thStyle}">Waktu</th><th style="${thStyle}">Kategori</th><th style="${thStyle}">Keterangan</th><th style="${thStyle} text-align: right;">Jumlah</th></tr></thead>
                    <tbody>
                        ${reportData.detailedExpenseData.map(expense => `
                            <tr>
                                <td style="${tdStyle}">${new Date(expense.timestamp).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                                <td style="${tdStyle}">${expense.categoryName}</td>
                                <td style="${tdStyle}">${expense.description}</td>
                                <td style="${tdStyle} text-align: right;">${expense.amount.toLocaleString('id-ID')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else if (activeTab === 'Stok Kritis') {
            if (reportData.lowStockItems.length === 0) { alert("Tidak ada data untuk dicetak."); return; }
            content = `
                <table style="${tableStyle}">
                    <thead><tr><th style="${thStyle}">Produk</th><th style="${thStyle} text-align: right;">Sisa Stok</th></tr></thead>
                    <tbody>
                        ${reportData.lowStockItems.map(item => `
                            <tr>
                                <td style="${tdStyle}">${item.name}</td>
                                <td style="${tdStyle} text-align: right;">${item.prices.map(p => `${p.stock} ${p.name}`).join(', ')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else if (activeTab === 'Laba Rugi') {
             content = `
                <div style="font-family: monospace; font-size: 0.85rem; color: black;">
                    <div style="display: flex; justify-content: space-between; margin: 0.5rem 0;"><span>Total Pendapatan</span> <span>Rp ${reportData.totalRevenue.toLocaleString('id-ID')}</span></div>
                    <div style="display: flex; justify-content: space-between; margin: 0.5rem 0;"><span>Total HPP (Modal)</span> <span>Rp ${reportData.totalCogs.toLocaleString('id-ID')}</span></div>
                    <hr style="border-style: dashed; border-color: black; margin: 0.5rem 0;" />
                    <div style="display: flex; justify-content: space-between; margin: 0.5rem 0; font-weight: bold;"><span>Laba Kotor</span> <span>Rp ${reportData.grossProfit.toLocaleString('id-ID')}</span></div>
                    <div style="display: flex; justify-content: space-between; margin: 0.5rem 0;"><span>Total Biaya</span> <span>- Rp ${reportData.totalExpenses.toLocaleString('id-ID')}</span></div>
                    <hr style="border-style: dashed; border-color: black; margin: 0.5rem 0;" />
                    <div style="display: flex; justify-content: space-between; margin: 1rem 0; font-weight: bold; font-size: 1.1rem;"><span>LABA BERSIH</span> <span>Rp ${reportData.netProfit.toLocaleString('id-ID')}</span></div>
                </div>
            `;
        } else {
            alert(`Cetak belum didukung untuk laporan "${activeTab}".`);
            return;
        }

        const printWindow = window.open('', '_blank', 'height=600,width=800');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Cetak Laporan</title>');
            printWindow.document.write('<style> @media print { body { margin: 0; } } </style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write(header);
            printWindow.document.write(content);
            printWindow.document.write(footer);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        }
    };
    
    const handleExport = () => {
        const XLSX = (window as any).XLSX;
        if (!XLSX) {
            alert("Pustaka ekspor Excel belum siap. Silakan muat ulang halaman dan coba lagi.");
            return;
        }

        let dataToExport: any[] = [];
        let worksheetName = "Laporan";
        let fileName = "Laporan.xlsx";

        switch (activeTab) {
            case 'Profitabilitas':
                worksheetName = "Profitabilitas Produk";
                fileName = `Laporan_Profitabilitas_${dateRange}.xlsx`;
                dataToExport = reportData.productProfitabilityData.map(item => ({
                    'Nama Produk': item.name,
                    'Jumlah Terjual': item.quantitySold,
                    'Total Keuntungan': item.totalProfit,
                }));
                break;
            case 'Metode Bayar':
                 worksheetName = "Metode Bayar";
                 fileName = `Laporan_Metode_Bayar_${dateRange}.xlsx`;
                 dataToExport = reportData.paymentMethodData.map(item => ({
                    'Metode Bayar': item.name,
                    'Total Penjualan': item.value,
                }));
                break;
            case 'Laporan Biaya':
                worksheetName = "Laporan Biaya";
                fileName = `Laporan_Biaya_${dateRange}.xlsx`;
                dataToExport = reportData.detailedExpenseData.map(expense => ({
                    'Waktu': new Date(expense.timestamp).toLocaleString('id-ID'),
                    'Kategori Biaya': expense.categoryName,
                    'Keterangan': expense.description,
                    'Nama Pengambil': expense.takenBy || '-',
                    'Jumlah': expense.amount,
                }));
                break;
            case 'Stok Kritis':
                worksheetName = "Stok Kritis";
                fileName = `Laporan_Stok_Kritis_${dateRange}.xlsx`;
                dataToExport = reportData.lowStockItems.map(item => ({
                    'Nama Produk': item.name,
                    'Sisa Stok': item.prices.map(p => `${p.stock} ${p.name}`).join(', '),
                }));
                break;
            case 'Laba Rugi':
                worksheetName = "Laba Rugi";
                fileName = `Laporan_Laba_Rugi_${dateRange}.xlsx`;
                dataToExport = [
                    { 'Deskripsi': 'Total Pendapatan', 'Jumlah': reportData.totalRevenue },
                    { 'Deskripsi': 'Total HPP (Modal)', 'Jumlah': reportData.totalCogs },
                    { 'Deskripsi': 'Laba Kotor', 'Jumlah': reportData.grossProfit },
                    { 'Deskripsi': 'Total Biaya Operasional', 'Jumlah': -reportData.totalExpenses },
                    { 'Deskripsi': 'LABA BERSIH', 'Jumlah': reportData.netProfit },
                ];
                break;
            default:
                return;
        }

        if (dataToExport.length === 0) {
            alert("Tidak ada data untuk diekspor.");
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, worksheetName);
        XLSX.writeFile(workbook, fileName);
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];
    const tabs = ['Profitabilitas', 'Metode Bayar', 'Laporan Biaya', 'Stok Kritis', 'Laba Rugi'];

    const renderContent = () => {
        if (activeTab === 'Profitabilitas') {
            return reportData.productProfitabilityData.length > 0 ? (
                <div className="max-h-[60vh] overflow-y-auto">
                    <p className="text-sm text-secondary mb-4">Laporan ini menunjukkan produk mana yang paling menguntungkan dalam periode waktu yang dipilih.</p>
                    <table className="w-full text-left">
                        <thead className="bg-tertiary sticky top-0"><tr><th className="p-2 font-semibold text-secondary">Nama Produk</th><th className="p-2 font-semibold text-secondary text-right">Terjual</th><th className="p-2 font-semibold text-secondary text-right">Total Keuntungan</th></tr></thead>
                        <tbody>{reportData.productProfitabilityData.map(item => (<tr key={item.name} className="border-b border-default"><td className="p-2 font-medium">{item.name}</td><td className="p-2 text-right">{item.quantitySold}</td><td className="p-2 text-right font-semibold text-green-600">Rp {item.totalProfit.toLocaleString('id-ID')}</td></tr>))}</tbody>
                    </table>
                </div>
            ) : <EmptyState title="Belum Ada Data" message="Data profitabilitas akan muncul setelah ada transaksi." />;
        }
        if (activeTab === 'Metode Bayar') {
            return reportData.paymentMethodData.length > 0 && Recharts ? (
                <div className="text-center">
                     <p className="text-sm text-secondary mb-4">Grafik ini memvisualisasikan distribusi pendapatan berdasarkan metode pembayaran yang digunakan oleh pelanggan.</p>
                    <div style={{ width: '100%', height: 350 }}>
                        <ResponsiveContainer>
                            <PieChart><Pie data={reportData.paymentMethodData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>{reportData.paymentMethodData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip formatter={(value) => `Rp ${Number(value).toLocaleString('id-ID')}`}/><Legend /></PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            ) : <EmptyState title="Belum Ada Data" message="Grafik metode pembayaran akan muncul setelah ada transaksi." />;
        }
        if (activeTab === 'Laporan Biaya') {
            return reportData.detailedExpenseData.length > 0 ? (
                <div className="max-h-[60vh] overflow-y-auto">
                    <p className="text-sm text-secondary mb-4">Laporan ini merinci semua pengeluaran yang dicatat dalam periode waktu yang dipilih.</p>
                    <table className="w-full text-left">
                        <thead className="bg-tertiary sticky top-0">
                            <tr>
                                <th className="p-2 font-semibold text-secondary">Waktu</th>
                                <th className="p-2 font-semibold text-secondary">Kategori Biaya</th>
                                <th className="p-2 font-semibold text-secondary">Keterangan</th>
                                <th className="p-2 font-semibold text-secondary">Nama Pengambil</th>
                                <th className="p-2 font-semibold text-secondary text-right">Jumlah</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.detailedExpenseData.map((expense: Expense & { categoryName: string }) => (
                                <tr key={expense.id} className="border-b border-default">
                                    <td className="p-2 text-sm">{new Date(expense.timestamp).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                    <td className="p-2 font-medium">{expense.categoryName}</td>
                                    <td className="p-2">{expense.description}</td>
                                    <td className="p-2">{expense.takenBy || '-'}</td>
                                    <td className="p-2 text-right font-semibold text-red-600">Rp {expense.amount.toLocaleString('id-ID')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : <EmptyState title="Belum Ada Data" message="Data laporan biaya akan muncul setelah ada pengeluaran kas." />;
        }
        if (activeTab === 'Stok Kritis') {
             return reportData.lowStockItems.length > 0 ? (
                <div className="max-h-[60vh] overflow-y-auto">
                    <p className="text-sm text-secondary mb-4">Daftar ini menyoroti produk-produk yang stoknya telah mencapai atau di bawah ambang batas stok kritis ({settings.lowStockThreshold || 5} item) yang telah Anda tentukan.</p>
                    <table className="w-full text-left">
                        <thead className="bg-tertiary sticky top-0"><tr><th className="p-2 font-semibold text-secondary">Nama Produk</th><th className="p-2 font-semibold text-secondary text-right">Sisa Stok</th></tr></thead>
                        <tbody>{reportData.lowStockItems.map(item => (<tr key={item.id} className="border-b border-default"><td className="p-2 font-medium">{item.name}</td><td className="p-2 text-right text-red-500 font-bold">{item.prices.map(p => `${p.stock} ${p.name}`).join(', ')}</td></tr>))}</tbody>
                    </table>
                </div>
            ) : <EmptyState title="Stok Aman" message="Tidak ada produk yang stoknya di bawah batas minimum." />;
        }
        if (activeTab === 'Laba Rugi') {
            return (
                <div className="p-4 space-y-4">
                    <p className="text-sm text-secondary mb-4">Laporan ini memberikan ringkasan keuangan dari kinerja bisnis Anda selama periode yang dipilih, menyoroti profitabilitas secara keseluruhan.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="bg-tertiary p-4 rounded-lg">
                            <p className="text-secondary text-sm font-medium">Total Pendapatan</p>
                            <p className="text-2xl font-bold text-primary">Rp {reportData.totalRevenue.toLocaleString('id-ID')}</p>
                        </div>
                        <div className="bg-tertiary p-4 rounded-lg">
                            <p className="text-secondary text-sm font-medium">Total HPP (Modal)</p>
                            <p className="text-2xl font-bold text-primary">Rp {reportData.totalCogs.toLocaleString('id-ID')}</p>
                        </div>
                    </div>
                    <div className="bg-blue-100 text-blue-800 p-4 rounded-lg">
                        <p className="text-sm font-medium">Laba Kotor</p>
                        <p className="text-3xl font-bold">Rp {reportData.grossProfit.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg">
                        <p className="text-sm font-medium">Total Biaya Operasional</p>
                        <p className="text-2xl font-bold">- Rp {reportData.totalExpenses.toLocaleString('id-ID')}</p>
                    </div>
                     <div className={`${reportData.netProfit >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} p-6 rounded-lg text-center`}>
                        <p className="text-lg font-bold">LABA BERSIH</p>
                        <p className="text-4xl font-extrabold">Rp {reportData.netProfit.toLocaleString('id-ID')}</p>
                    </div>
                </div>
            );
        }
        return null;
    }

    return (
        <div className="text-primary">
            <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
                <div>
                    <h2 className="text-3xl font-bold">Laporan Analitis</h2>
                    <p className="text-sm text-secondary mt-1">
                        {reportGeneratedTime.toLocaleString('id-ID', {
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', 
                            hour: '2-digit', minute: '2-digit'
                        })}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <select onChange={(e) => setDateRange(e.target.value)} value={dateRange} className="p-2 w-full md:w-auto border border-default rounded-md bg-secondary text-sm">
                         <option value="all">Semua Waktu</option>
                         <option value="today">Hari Ini</option>
                         <option value="week">7 Hari Terakhir</option>
                         <option value="month">30 Hari Terakhir</option>
                    </select>
                    <button onClick={handleExport} className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium whitespace-nowrap">
                        Export Excel
                    </button>
                    <button onClick={handlePrint} className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium whitespace-nowrap">
                        Cetak
                    </button>
                </div>
            </div>
            <div className="bg-secondary p-2 md:p-6 rounded-lg shadow-md">
                 <div className="flex border-b border-default mb-4 overflow-x-auto">
                    {tabs.map(tab => (<button key={tab} onClick={() => setActiveTab(tab)} className={`py-2 px-4 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab ? 'border-b-2 border-accent accent-color' : 'text-secondary hover:text-primary'}`}>{tab}</button>))}
                </div>
                {renderContent()}
            </div>
        </div>
    );
};

export default ReportsPage;
