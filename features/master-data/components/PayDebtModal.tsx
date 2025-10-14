import React, { useState } from 'react';
import type { Customer } from '../../../types';
import { Modal } from '../../../components/Modal';

interface PayDebtModalProps {
    customer: Customer;
    onClose: () => void;
    onConfirm: (amount: number) => void;
}

export const PayDebtModal: React.FC<PayDebtModalProps> = ({ customer, onClose, onConfirm }) => {
    const [amount, setAmount] = useState('');
    const currentDebt = customer.hutang || 0;

    const handleConfirm = () => {
        const paymentAmount = Number(amount);
        if (paymentAmount > 0 && paymentAmount <= currentDebt) {
            onConfirm(paymentAmount);
            onClose();
        } else if (paymentAmount > currentDebt) {
            alert('Jumlah pembayaran tidak boleh melebihi total hutang.');
        } else {
            alert('Masukkan jumlah pembayaran yang valid.');
        }
    };

    return (
        <Modal show={true} onClose={onClose} title={`Bayar Hutang: ${customer.name}`}>
            <div className="text-primary">
                <div className="text-center mb-6">
                    <p className="text-secondary text-lg">Total Hutang Saat Ini</p>
                    <p className="text-4xl font-bold text-red-600">Rp {currentDebt.toLocaleString('id-ID')}</p>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-bold mb-2">Jumlah Pembayaran (Rp)</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full text-2xl text-right"
                        placeholder="0"
                        max={currentDebt}
                        autoFocus
                    />
                </div>
                 <div className="grid grid-cols-2 gap-2 mt-3">
                    <button type="button" onClick={() => setAmount(String(Math.min(50000, currentDebt)))} className="bg-tertiary text-primary py-3 rounded-lg hover:bg-gray-300 font-semibold">Rp 50.000</button>
                    <button type="button" onClick={() => setAmount(String(currentDebt))} className="bg-tertiary text-primary py-3 rounded-lg hover:bg-gray-300 font-semibold">Bayar Lunas</button>
                </div>

                <div className="flex justify-end mt-8 pt-4 border-t border-default gap-3">
                    <button onClick={onClose} className="bg-tertiary text-primary font-bold py-3 px-5 rounded-lg hover:bg-gray-300">
                        Batal
                    </button>
                    <button onClick={handleConfirm} className="accent-bg accent-text font-bold py-3 px-5 rounded-lg accent-bg-hover">
                        Konfirmasi Pembayaran
                    </button>
                </div>
            </div>
        </Modal>
    );
};