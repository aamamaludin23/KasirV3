
import React, { useState } from 'react';
import type { Item, PriceTier } from '../../../types';
import { Modal } from '../../../components/Modal';

interface StockInModalProps {
    item: Item;
    onClose: () => void;
    onSave: (itemId: string, stockInTiers: { name: string; quantity: number }[]) => void;
}

export const StockInModal: React.FC<StockInModalProps> = ({ item, onClose, onSave }) => {
    const [stockInData, setStockInData] = useState<Record<string, number>>({});

    const handleChange = (priceTierName: string, value: string) => {
        setStockInData(prev => ({ ...prev, [priceTierName]: Number(value) || 0 }));
    };

    const handleSave = () => {
        // FIX: Explicitly type the destructured arguments in the filter and map callbacks to resolve the type error.
        const stockInTiers = Object.entries(stockInData)
            .filter(([, quantity]: [string, number]) => quantity > 0)
            .map(([name, quantity]: [string, number]) => ({ name, quantity }));
        
        if (stockInTiers.length > 0) {
            onSave(item.id, stockInTiers);
        }
        onClose();
    };

    return (
        <Modal show={true} onClose={onClose} title={`Stok Masuk: ${item.name}`}>
            <div>
                <p className="text-sm text-secondary mb-4">Masukkan jumlah stok yang ingin ditambahkan untuk setiap satuan.</p>
                <div className="space-y-3">
                    {item.prices.map(tier => (
                        <div key={tier.name} className="grid grid-cols-3 items-center gap-4 p-2 bg-tertiary rounded">
                            <label className="font-semibold text-primary">{tier.name}</label>
                            <span className="text-sm text-secondary">Stok Saat Ini: {tier.stock}</span>
                            <input
                                type="number"
                                placeholder="Jml Tambah"
                                min="0"
                                onChange={(e) => handleChange(tier.name, e.target.value)}
                                className="w-full p-2 border border-default rounded-md bg-secondary"
                            />
                        </div>
                    ))}
                </div>
                <div className="flex justify-end mt-6 border-t border-default pt-4">
                    <button onClick={onClose} className="bg-tertiary text-primary font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300">Batal</button>
                    <button onClick={handleSave} className="accent-bg accent-text font-bold py-2 px-4 rounded-lg accent-bg-hover">Simpan Stok</button>
                </div>
            </div>
        </Modal>
    );
};
