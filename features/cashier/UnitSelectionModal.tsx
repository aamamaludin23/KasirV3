import React, { useEffect, useState } from 'react';
import type { Item, PriceTier } from '../../types';
import { Modal } from '../../components/Modal';

interface UnitSelectionModalProps {
    show: boolean;
    onClose: () => void;
    item: Item | null;
    onSelect: (priceTier: PriceTier) => void;
}

export const UnitSelectionModal: React.FC<UnitSelectionModalProps> = ({ show, onClose, item, onSelect }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
        if (!show) {
            setSelectedIndex(0);
            return;
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (!item) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % item.prices.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + item.prices.length) % item.prices.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                onSelect(item.prices[selectedIndex]);
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [show, item, onSelect, selectedIndex]);

    if (!show || !item) return null;

    return (
        <Modal show={show} onClose={onClose} title={`Pilih Satuan untuk: ${item.name}`}>
            <div className="flex flex-col gap-2">
                {item.prices.map((tier, index) => (
                    <button
                        key={tier.name}
                        onClick={() => onSelect(tier)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedIndex === index ? 'border-accent bg-accent-light ring-2 ring-accent' : 'border-default bg-secondary hover:bg-tertiary'}`}
                    >
                        <div className="flex justify-between items-center">
                            <span className="font-semibold text-primary">{tier.name}</span>
                            <span className="font-bold accent-color">Rp {tier.price.toLocaleString('id-ID')}</span>
                        </div>
                         <p className="text-xs text-secondary">Stok: {tier.stock}</p>
                    </button>
                ))}
            </div>
        </Modal>
    );
};
