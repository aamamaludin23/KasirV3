import React, { useState, useEffect, useRef } from 'react';
import type { Customer, Bank } from '../../types';
import { Modal } from '../../components/Modal';

interface PaymentModalProps {
    show: boolean;
    onClose: () => void;
    total: number;
    onConfirm: (paymentDetails: any) => void;
    selectedCustomerId: string;
    customers: Customer[];
    banks: Bank[];
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ show, onClose, total, onConfirm, selectedCustomerId, customers, banks }) => {
    const [method, setMethod] = useState('Tunai');
    const [amountPaid, setAmountPaid] = useState('');
    const [selectedBank, setSelectedBank] = useState('');
    const cashInputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        if(show && method === 'Tunai' && cashInputRef.current) {
            cashInputRef.current.focus();
            cashInputRef.current.select();
        }
    }, [show, method]);

    const change = (method === 'Tunai' && Number(amountPaid) >= total) ? Number(amountPaid) - total : 0;
    
    const handleConfirm = () => {
        const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

        if (method === 'Kredit' && (!selectedCustomer || selectedCustomer.name === 'UMUM')) {
            alert("Pelanggan 'UMUM' tidak bisa berhutang. Silakan pilih pelanggan lain untuk metode kredit.");
            return;
        }
         if (method === 'Debit' && !selectedBank) {
            alert("Silakan pilih bank untuk pembayaran Debit.");
            return;
        }
        if (method === 'Tunai' && Number(amountPaid) < total) {
            alert("Jumlah bayar kurang dari total belanja.");
            return;
        }
        
        onConfirm({
            total,
            method,
            amountPaid: method === 'Kredit' ? 0 : (method === 'Tunai' ? Number(amountPaid) : total),
            change,
            customerId: selectedCustomerId || null,
            bank: method === 'Debit' ? selectedBank : null,
        });
        setAmountPaid('');
        setSelectedBank('');
    }
    
    const isConfirmDisabled = () => {
        if (method === 'Kredit') {
            const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
            return !selectedCustomer || selectedCustomer.name === 'UMUM';
        }
        if (method === 'Tunai') return Number(amountPaid) < total;
        if (method === 'Debit') return !selectedBank;
        return false;
    };

    const handleCashKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !isConfirmDisabled()) {
            handleConfirm();
        }
    }

    return (
        <Modal show={show} onClose={onClose} title="Metode Pembayaran">
            <div className="flex justify-center border-b border-default mb-4">
                {['Tunai', 'Debit', 'E-Money', 'Kredit'].map(m => (
                    <button key={m} onClick={() => setMethod(m)} className={`py-3 px-6 text-md font-medium transition-colors ${method === m ? 'border-b-2 border-accent accent-color' : 'text-secondary hover:text-primary'}`}>
                        {m}
                    </button>
                ))}
            </div>
            <div className="text-center my-6">
                <p className="text-secondary text-lg">Total Belanja</p>
                <p className="text-5xl font-bold accent-color">Rp {total.toLocaleString('id-ID')}</p>
            </div>
            
            {method === 'Tunai' && (
                <div className="my-4">
                    <label className="block text-primary text-sm font-bold mb-2">Jumlah Bayar (Rp)</label>
                    <input 
                        ref={cashInputRef}
                        type="number" 
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
                        className="w-full p-4 text-2xl border-2 text-right"
                        placeholder="0"
                        onKeyDown={handleCashKeyDown}
                    />
                    <div className="grid grid-cols-4 gap-2 mt-3">
                        {[20000, 50000, 100000, total].map(val => (
                           <button key={val} type="button" onClick={() => setAmountPaid(String(val))} className="bg-tertiary text-primary py-3 rounded-lg hover:bg-gray-300 font-semibold">Rp {val.toLocaleString('id-ID')}</button>
                        ))}
                    </div>
                    <div className="flex justify-between mt-4 text-2xl font-medium text-primary">
                        <span>Kembalian:</span>
                        <span className="font-bold">Rp {change.toLocaleString('id-ID')}</span>
                    </div>
                </div>
            )}
            {method === 'Debit' && (
                <div className="my-4">
                    <label className="block text-primary text-sm font-bold mb-2">Pilih Bank</label>
                    <select
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                        className="w-full text-lg"
                        required
                    >
                        <option value="">-- Pilih Bank --</option>
                        {banks.map(bank => (
                            <option key={bank.id} value={bank.name}>{bank.name}</option>
                        ))}
                    </select>
                </div>
            )}
            {method === 'Kredit' && (
                 <div className="my-4 p-4 bg-yellow-100 text-yellow-800 rounded-lg text-center">
                    Transaksi akan ditambahkan ke tagihan pelanggan yang dipilih.
                </div>
            )}

            <div className="mt-6">
                 <button 
                    onClick={handleConfirm}
                    disabled={isConfirmDisabled()}
                    className="w-full accent-bg accent-text font-bold py-4 text-xl rounded-lg accent-bg-hover transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                    Konfirmasi Pembayaran
                </button>
            </div>
        </Modal>
    );
};