import React from 'react';
import type { Transaction } from '../../types';
import { Modal } from '../../components/Modal';

interface TransactionSuccessModalProps {
    show: boolean;
    onClose: () => void;
    onPrint: () => void;
    transaction: Transaction | null;
}

export const TransactionSuccessModal: React.FC<TransactionSuccessModalProps> = ({ show, onClose, onPrint, transaction }) => {
    if (!show || !transaction) return null;

    const handlePrintAndClose = () => {
        onPrint();
        onClose();
    };

    return (
        <Modal show={show} onClose={onClose} title="Transaksi Berhasil">
            <div className="text-center p-4 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-2xl font-bold mb-6">Pembayaran Berhasil!</h3>
                
                <div className="bg-tertiary rounded-lg p-6 space-y-4 text-left">
                    <div className="flex justify-between text-lg">
                        <span className="text-secondary">Total Belanja:</span>
                        <span className="font-semibold">Rp {transaction.total.toLocaleString('id-ID')}</span>
                    </div>
                     <div className="flex justify-between text-lg">
                        <span className="text-secondary">Dibayar:</span>
                        <span className="font-semibold">Rp {transaction.amountPaid.toLocaleString('id-ID')}</span>
                    </div>
                     <div className="flex justify-between text-3xl font-bold border-t border-default pt-4 mt-4">
                        <span className="text-primary">Kembalian:</span>
                        <span className="accent-color">Rp {transaction.change.toLocaleString('id-ID')}</span>
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <button 
                        onClick={handlePrintAndClose}
                        className="bg-blue-600 text-white font-bold py-4 px-5 rounded-lg hover:bg-blue-700 text-lg"
                    >
                        Cetak Struk
                    </button>
                    <button 
                        onClick={onClose} 
                        className="accent-bg accent-text font-bold py-4 px-5 rounded-lg accent-bg-hover text-lg"
                    >
                        Transaksi Baru
                    </button>
                </div>
            </div>
        </Modal>
    );
};