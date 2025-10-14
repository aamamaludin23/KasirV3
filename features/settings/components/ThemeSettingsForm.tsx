
import React, { useState, useEffect } from 'react';
import type { Settings } from '../../../types';

interface ThemeSettingsFormProps {
    settings: Settings;
    onSave: (formData: Settings, setStatus: (status: string) => void) => void;
}

export const ThemeSettingsForm: React.FC<ThemeSettingsFormProps> = ({ settings, onSave }) => {
    const [formData, setFormData] = useState<Settings>(settings);
    const [status, setStatus] = useState('');

    useEffect(() => {
        setFormData(settings);
    }, [settings]);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value as Settings['theme'] }));
    };
    
    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData, setStatus);
    }

    return (
         <form onSubmit={handleSave} className="text-primary">
            <div className="mb-4">
                <label className="block text-sm font-bold mb-2">Pilih Tema Tampilan</label>
                <select 
                    name="theme" 
                    value={formData.theme || 'light'} 
                    onChange={handleChange} 
                    className="w-full p-2 border border-default rounded-md bg-secondary"
                >
                    <option value="light">Terang (Default)</option>
                    <option value="dark">Gelap</option>
                    <option value="blue">Biru</option>
                </select>
                 <p className="text-xs text-secondary mt-2">Perubahan tema akan terlihat setelah disimpan.</p>
            </div>
            
            <div className="flex items-center justify-between mt-6">
                <button type="submit" className="accent-bg accent-text font-bold py-2 px-4 rounded-lg accent-bg-hover">Simpan Pengaturan</button>
                {status && <span className="text-sm text-secondary">{status}</span>}
            </div>
        </form>
    );
};
