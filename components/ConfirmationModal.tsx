
import React from 'react';
import { Modal } from './Modal';

interface ConfirmationModalProps {
    show: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ show, onClose, onConfirm, title, message }) => {
    if (!show) return null;

    return (
        <Modal show={show} onClose={onClose} title={title}>
            <div>
                <p className="text-primary mb-8 text-lg">{message}</p>
                <div className="flex justify-end space-x-3">
                    <button 
                        onClick={onClose} 
                        className="bg-tertiary text-primary font-bold py-3 px-5 rounded-lg hover:bg-gray-300"
                    >
                        Batal
                    </button>
                    <button 
                        onClick={() => { onConfirm(); onClose(); }} 
                        className="bg-red-600 text-white font-bold py-3 px-5 rounded-lg hover:bg-red-700"
                    >
                        Ya, Lanjutkan
                    </button>
                </div>
            </div>
        </Modal>
    );
};