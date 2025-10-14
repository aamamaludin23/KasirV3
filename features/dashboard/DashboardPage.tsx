
import React, { useMemo } from 'react';
import type { Transaction } from '../../types';
import { useSession } from '../../context/SessionContext';
import { ICONS } from '../../constants';
import { StatCard } from '../../components/StatCard';

const DashboardPage: React.FC = () => {
    const { transactions } = useSession();

    const { totalRevenue, totalTransactions, itemsSold } = useMemo(() => {
        const revenue = transactions.reduce((sum, t) => sum + t.total, 0);
        const sold = transactions.reduce((sum, t) => sum + t.items.reduce((itemSum, i) => itemSum + i.quantity, 0), 0);
        return { totalRevenue: revenue, totalTransactions: transactions.length, itemsSold: sold };
    }, [transactions]);
    
    const Recharts = (window as any).Recharts;
    if (!Recharts) {
        return (
             <div className="text-primary">
                <h2 className="text-3xl font-bold mb-6">Dasbor</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatCard title="Total Pendapatan" value={`Rp ${totalRevenue.toLocaleString('id-ID')}`} icon={ICONS.dashboard} />
                    <StatCard title="Total Transaksi" value={totalTransactions} icon={ICONS.cashier} />
                    <StatCard title="Produk Terjual" value={itemsSold} icon={ICONS.sales} />
                </div>
                <div className="text-center p-10 mt-8 bg-secondary rounded-lg shadow-md">Memuat komponen grafik...</div>
             </div>
        );
    }

    const { BarChart, LineChart, PieChart, Pie, Cell, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = Recharts;

    const chartData = useMemo(() => {
        const productSales: { [key: string]: number } = {};
        transactions.forEach(t => t.items.forEach(item => {
            const key = `${item.name} (${item.priceTier.name})`;
            productSales[key] = (productSales[key] || 0) + item.quantity;
        }));
        const bestSellersData = Object.entries(productSales)
            .map(([name, quantity]) => ({ name, Terjual: quantity }))
            .sort((a, b) => b.Terjual - a.Terjual)
            .slice(0, 5);

        const paymentMethodRevenue = transactions.reduce((acc, t) => {
            acc[t.paymentMethod] = (acc[t.paymentMethod] || 0) + t.total;
            return acc;
        }, {} as Record<string, number>);
        const paymentMethodData = Object.entries(paymentMethodRevenue).map(([name, value]) => ({ name, value }));

        const dailyRevenue: Record<string, { total: number, timestamp: number }> = {};
        transactions.forEach(t => {
            const dateKey = new Date(t.timestamp).toISOString().slice(0, 10); // YYYY-MM-DD for accurate grouping
            if (!dailyRevenue[dateKey]) {
                dailyRevenue[dateKey] = { total: 0, timestamp: new Date(t.timestamp).setHours(0, 0, 0, 0) };
            }
            dailyRevenue[dateKey].total += t.total;
        });
        const dailyRevenueData = Object.values(dailyRevenue)
            .sort((a, b) => a.timestamp - b.timestamp)
            .map(data => ({
                date: new Date(data.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
                Pendapatan: data.total
            }));


        return { bestSellersData, paymentMethodData, dailyRevenueData };
    }, [transactions]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    return (
        <div className="text-primary">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Dasbor</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Total Pendapatan" value={`Rp ${totalRevenue.toLocaleString('id-ID')}`} icon={ICONS.dashboard} />
                <StatCard title="Total Transaksi" value={totalTransactions} icon={ICONS.cashier} />
                <StatCard title="Produk Terjual" value={itemsSold} icon={ICONS.sales} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8">
                 <div className="xl:col-span-2 bg-secondary p-4 md:p-6 rounded-lg shadow-md">
                     <h3 className="text-lg md:text-xl font-bold mb-4">Tren Pendapatan</h3>
                     <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer><LineChart data={chartData.dailyRevenueData} margin={{ top: 5, right: 20, left: 5, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tick={{ fontSize: 12 }} /><YAxis tickFormatter={(value) => new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(value as number)} /><Tooltip formatter={(value) => `Rp ${Number(value).toLocaleString('id-ID')}`}/><Legend /><Line type="monotone" dataKey="Pendapatan" stroke="var(--accent-color)" strokeWidth={2} activeDot={{ r: 8 }} /></LineChart></ResponsiveContainer>
                    </div>
                 </div>
                 <div className="bg-secondary p-4 md:p-6 rounded-lg shadow-md">
                    <h3 className="text-lg md:text-xl font-bold mb-4">Metode Pembayaran</h3>
                     <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer><PieChart><Pie data={chartData.paymentMethodData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>{chartData.paymentMethodData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip formatter={(value) => `Rp ${Number(value).toLocaleString('id-ID')}`} /><Legend /></PieChart></ResponsiveContainer>
                    </div>
                 </div>
            </div>

            <div className="bg-secondary p-4 md:p-6 rounded-lg shadow-md mt-8">
                <h3 className="text-lg md:text-xl font-bold mb-4">Produk Terlaris</h3>
                <div style={{ width: '100%', height: 300 }}>
                   <ResponsiveContainer><BarChart layout="vertical" data={chartData.bestSellersData} margin={{ top: 5, right: 20, left: 60, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis dataKey="name" type="category" scale="band" width={150} tick={{ fontSize: 12 }} /><Tooltip cursor={{fill: 'var(--background-tertiary)'}} /><Legend /><Bar dataKey="Terjual" fill="var(--accent-color)" /></BarChart></ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;