
import React, { useState, useEffect } from 'react';
import type { Settings } from '../../../types';

interface StoreProfileFormProps {
    settings: Settings;
    onSave: (formData: Settings, setStatus: (status: string) => void) => void;
}

export const StoreProfileForm: React.FC<StoreProfileFormProps> = ({ settings, onSave }) => {
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
                <label className="block text-gray-700 text-sm font-bold mb-2">Nama Toko</label>
                <input type="text" name="storeName" value={formData.storeName || ''} onChange={handleChange} className="w-full p-2 border rounded-md" />
            </div>
             <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Alamat Toko</label>
                <input type="text" name="address" value={formData.address || ''} onChange={handleChange} className="w-full p-2 border rounded-md" />
            </div>
             <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Nomor Telepon</label>
                <input type="text" name="phone" value={formData.phone || ''} onChange={handleChange} className="w-full p-2 border rounded-md" />
            </div>
            <div className="flex items-center justify-between">
                <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">Simpan Pengaturan</button>
                {status && <span className="text-sm text-gray-600">{status}</span>}
            </div>
        </form>
    );
};
