
import React, { useMemo } from 'react';
import type { Transaction } from '../../types';
import { useSession } from '../../context/SessionContext';
import { ICONS } from '../../constants';
import { StatCard } from '../../components/StatCard';

const DashboardPage: React.FC = () => {
    const { transactions } = useSession();

    const { totalRevenue, totalTransactions, itemsSold, bestSellersData, dailyRevenueData } = useMemo(() => {
        const revenue = transactions.reduce((sum, t) => sum + t.total, 0);
        const sold = transactions.reduce((sum, t) => sum + t.items.reduce((itemSum, i) => itemSum + i.quantity, 0), 0);
        
        const productSales: { [key: string]: number } = {};
        transactions.forEach(t => t.items.forEach(item => {
            const key = `${item.name} (${item.priceTier.name})`;
            productSales[key] = (productSales[key] || 0) + item.quantity;
        }));
        const bestSellers = Object.entries(productSales)
            .map(([name, quantity]) => ({ name, Terjual: quantity }))
            .sort((a, b) => b.Terjual - a.Terjual)
            .slice(0, 5);

        const dailyRevenue: Record<string, { total: number, timestamp: number }> = {};
        transactions.forEach(t => {
            const dateKey = new Date(t.timestamp).toISOString().slice(0, 10);
            if (!dailyRevenue[dateKey]) {
                dailyRevenue[dateKey] = { total: 0, timestamp: new Date(t.timestamp).setHours(0, 0, 0, 0) };
            }
            dailyRevenue[dateKey].total += t.total;
        });
        const dailyRevenues = Object.values(dailyRevenue)
            .sort((a, b) => a.timestamp - b.timestamp)
            .map(data => ({
                date: new Date(data.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
                Pendapatan: data.total
            }));

        return {
            totalRevenue: revenue,
            totalTransactions: transactions.length,
            itemsSold: sold,
            bestSellersData: bestSellers,
            dailyRevenueData: dailyRevenues,
        };
    }, [transactions]);

    return (
        <div className="text-primary">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Dasbor</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Total Pendapatan" value={`Rp ${totalRevenue.toLocaleString('id-ID')}`} icon={ICONS.dashboard} />
                <StatCard title="Total Transaksi" value={totalTransactions} icon={ICONS.cashier} />
                <StatCard title="Produk Terjual" value={itemsSold} icon={ICONS.sales} />
            </div>

            <div className="grid grid-cols-1 gap-6 mt-8">
                 <div className="bg-secondary p-4 md:p-6 rounded-lg shadow-md">
                     <h3 className="text-lg md:text-xl font-bold mb-4">Tren Pendapatan</h3>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-tertiary"><tr><th className="p-2 font-semibold text-secondary">Tanggal</th><th className="p-2 font-semibold text-secondary text-right">Pendapatan</th></tr></thead>
                            <tbody>{dailyRevenueData.map(item => (<tr key={item.date} className="border-b border-default"><td className="p-2 font-medium">{item.date}</td><td className="p-2 text-right">Rp {item.Pendapatan.toLocaleString('id-ID')}</td></tr>))}</tbody>
                        </table>
                    </div>
                 </div>
            </div>

            <div className="bg-secondary p-4 md:p-6 rounded-lg shadow-md mt-8">
                <h3 className="text-lg md:text-xl font-bold mb-4">Produk Terlaris</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-tertiary"><tr><th className="p-2 font-semibold text-secondary">Nama Produk</th><th className="p-2 font-semibold text-secondary text-right">Terjual</th></tr></thead>
                        <tbody>{bestSellersData.map(item => (<tr key={item.name} className="border-b border-default"><td className="p-2 font-medium">{item.name}</td><td className="p-2 text-right">{item.Terjual}</td></tr>))}</tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
