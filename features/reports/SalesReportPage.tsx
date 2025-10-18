
import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Customer, SaleItem, Item } from '../../types';

const SalesReportPage = () => {
    const { sales, saleItems, customers, items } = useData();
    const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);

    const getCustomerName = (customerId: string) => {
        const customer = customers.find(c => c.id === customerId);
        return customer?.name || 'Pelanggan Umum';
    };

    const getSaleDetails = (saleId: string) => {
        return saleItems.filter(item => item.saleId === saleId);
    };
    
    const getItemName = (itemId: string) => {
        const item = items.find(i => i.id === itemId);
        return item?.name || 'Item tidak ditemukan';
    }

    // Urutkan penjualan dari yang terbaru
    const sortedSales = [...sales].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Laporan Penjualan</h1>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white shadow-md rounded-lg">
                    <thead className="bg-gray-800 text-white">
                        <tr>
                            <th className="py-3 px-4 text-left">ID Transaksi</th>
                            <th className="py-3 px-4 text-left">Tanggal</th>
                            <th className="py-3 px-4 text-left">Pelanggan</th>
                            <th className="py-3 px-4 text-right">Total</th>
                            <th className="py-3 px-4 text-center">Status</th>
                            <th className="py-3 px-4 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700">
                        {sortedSales.map(sale => (
                            <React.Fragment key={sale.id}>
                                <tr className="border-b hover:bg-gray-100">
                                    <td className="py-3 px-4">#{sale.id}</td>
                                    <td className="py-3 px-4">{new Date(sale.createdAt).toLocaleString('id-ID')}</td>
                                    <td className="py-3 px-4">{getCustomerName(sale.customerId)}</td>
                                    <td className="py-3 px-4 text-right">Rp {sale.total.toLocaleString('id-ID')}</td>
                                    <td className="py-3 px-4 text-center">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${sale.isCredit ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'}`}>
                                            {sale.isCredit ? 'Kredit' : 'Lunas'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <button 
                                            onClick={() => setSelectedSaleId(selectedSaleId === sale.id ? null : sale.id)}
                                            className="text-blue-500 hover:underline text-sm">
                                            {selectedSaleId === sale.id ? 'Tutup' : 'Lihat Detail'}
                                        </button>
                                    </td>
                                </tr>
                                {selectedSaleId === sale.id && (
                                    <tr className="bg-gray-50">
                                        <td colSpan={6} className="p-4">
                                            <h4 className="font-semibold mb-2">Detail Item:</h4>
                                            <ul>
                                                {getSaleDetails(sale.id).map(detail => (
                                                    <li key={detail.id} className="flex justify-between text-sm py-1">
                                                        <span>{getItemName(detail.itemId)} ({detail.quantity} x @Rp {detail.price.toLocaleString('id-ID')})</span>
                                                        <span>Rp {(detail.quantity * detail.price).toLocaleString('id-ID')}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SalesReportPage;
