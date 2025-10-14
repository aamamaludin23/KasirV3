
import React, { useMemo } from 'react';
import type { Customer, Transaction } from '../../../types';
import { Modal } from '../../../components/Modal';

interface CustomerHistoryModalProps {
    customer: Customer;
    transactions: Transaction[];
    onClose: () => void;
}

export const CustomerHistoryModal: React.FC<CustomerHistoryModalProps> = ({ customer, transactions, onClose }) => {
    const customerTransactions = useMemo(() => {
        return transactions
            .filter(t => t.customerId === customer.id)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [customer, transactions]);

    return (
        <Modal show={true} onClose={onClose} title={`Riwayat Transaksi: ${customer.name}`} size="2xl">
            <div className="max-h-[60vh] overflow-y-auto">
                {customerTransactions.length > 0 ? (
                    <table className="w-full text-left text-primary">
                        <thead className="bg-tertiary">
                            <tr>
                                <th className="p-2 text-sm font-semibold text-secondary">Tanggal</th>
                                <th className="p-2 text-sm font-semibold text-secondary">ID Transaksi</th>
                                <th className="p-2 text-sm font-semibold text-secondary text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customerTransactions.map(t => (
                                <tr key={t.id} className="border-b border-default">
                                    <td className="p-2 text-sm">{new Date(t.timestamp).toLocaleString('id-ID')}</td>
                                    <td className="p-2 text-sm font-mono">...{t.id.slice(-6)}</td>
                                    <td className="p-2 text-sm font-semibold text-right">Rp {t.total.toLocaleString('id-ID')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-secondary text-center p-4">Tidak ada riwayat transaksi untuk pelanggan ini.</p>
                )}
            </div>
             <div className="flex justify-end mt-4">
                <button onClick={onClose} className="bg-tertiary text-primary font-bold py-2 px-4 rounded-lg hover:bg-gray-300">Tutup</button>
            </div>
        </Modal>
    );
};
