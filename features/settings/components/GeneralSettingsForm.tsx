
import React, { useState, useEffect } from 'react';
import type { Settings } from '../../../types';

interface GeneralSettingsFormProps {
    settings: Settings;
    onSave: (formData: Settings, setStatus: (status: string) => void) => void;
}

export const GeneralSettingsForm: React.FC<GeneralSettingsFormProps> = ({ settings, onSave }) => {
    const [formData, setFormData] = useState<Settings>(settings);
    const [status, setStatus] = useState('');

    useEffect(() => {
        setFormData(settings);
    }, [settings]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData, setStatus);
    }

    return (
         <form onSubmit={handleSave}>
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">PPN (%)</label>
                <input type="number" name="taxRate" value={formData.taxRate || 0} onChange={handleChange} className="w-full p-2 border rounded-md" />
            </div>
             <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">Batas Peringatan Stok</label>
                <input type="number" name="lowStockThreshold" value={formData.lowStockThreshold || 10} onChange={handleChange} className="w-full p-2 border rounded-md" />
            </div>
            <div className="flex items-center justify-between">
                <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">Simpan Pengaturan</button>
                {status && <span className="text-sm text-gray-600">{status}</span>}
            </div>
        </form>
    );
};
