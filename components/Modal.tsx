import React from 'react';
import { ICONS } from '../constants';

interface ModalProps {
    show: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'lg' | '2xl' | '4xl';
}

export const Modal: React.FC<ModalProps> = ({ show, onClose, title, children, size = 'lg' }) => {
    if (!show) return null;

    const sizeClasses = {
        lg: 'max-w-lg',
        '2xl': 'max-w-2xl',
        '4xl': 'max-w-4xl'
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 fade-enter-active"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div className={`bg-secondary rounded-xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col transform transition-transform duration-200 scale-100`}>
                <div className="flex justify-between items-center p-5 border-b border-default">
                    <h3 id="modal-title" className="text-xl font-bold text-primary">{title}</h3>
                    <button onClick={onClose} className="text-secondary hover:text-primary transition-colors p-1 rounded-full hover:bg-tertiary">{ICONS.close}</button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};
