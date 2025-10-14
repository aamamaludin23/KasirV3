import React, { useState } from 'react';
import type { Item } from '../../../types';
import { Modal } from '../../../components/Modal';

interface StockOpnameModalProps {
    item: Item;
    onClose: () => void;
    onSave: (itemId: string, opnameTiers: { name: string; newStock: number }[]) => void;
}

export const StockOpnameModal: React.FC<StockOpnameModalProps> = ({ item, onClose, onSave }) => {
    const [opnameData, setOpnameData] = useState<Record<string, number>>(() => 
        item.prices.reduce((acc, tier) => {
            acc[tier.name] = tier.stock;
            return acc;
        }, {} as Record<string, number>)
    );

    const handleChange = (priceTierName: string, value: string) => {
        setOpnameData(prev => ({ ...prev, [priceTierName]: Number(value) || 0 }));
    };

    const handleSave = () => {
        const opnameTiers = Object.entries(opnameData)
            .map(([name, newStock]) => ({ name, newStock }));
        
        if (opnameTiers.length > 0) {
            onSave(item.id, opnameTiers);
        }
        onClose();
    };

    return (
        <Modal show={true} onClose={onClose} title={`Stok Opname: ${item.name}`}>
            <div>
                <p className="text-sm text-secondary mb-4">Masukkan jumlah stok fisik yang sebenarnya untuk setiap satuan. Data stok lama akan diganti.</p>
                <div className="space-y-3">
                    {item.prices.map(tier => (
                        <div key={tier.name} className="grid grid-cols-2 items-center gap-4 p-2 bg-tertiary rounded">
                            <label className="font-semibold text-primary">{tier.name}<br/><span className="text-xs text-secondary font-normal">Stok Sistem: {tier.stock}</span></label>
                            <input
                                type="number"
                                placeholder="Stok Fisik"
                                min="0"
                                value={opnameData[tier.name]}
                                onChange={(e) => handleChange(tier.name, e.target.value)}
                                className="w-full p-2 border border-default rounded-md bg-secondary"
                            />
                        </div>
                    ))}
                </div>
                <div className="flex justify-end mt-6 border-t border-default pt-4">
                    <button onClick={onClose} className="bg-tertiary text-primary font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300">Batal</button>
                    <button onClick={handleSave} className="accent-bg accent-text font-bold py-2 px-4 rounded-lg accent-bg-hover">Simpan Penyesuaian</button>
                </div>
            </div>
        </Modal>
    );
};
