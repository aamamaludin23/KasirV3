
import React, { useState, useEffect } from 'react';
import type { Settings } from '../../../types';
import { ReceiptPreview } from './ReceiptPreview';

interface MiniPrinterSettingsFormProps {
    settings: Settings;
    onSave: (formData: Settings, setStatus: (status: string) => void) => void;
}

export const MiniPrinterSettingsForm: React.FC<MiniPrinterSettingsFormProps> = ({ settings, onSave }) => {
    const [formData, setFormData] = useState<Settings>(settings);
    const [status, setStatus] = useState('');

    useEffect(() => {
        setFormData(settings);
    }, [settings]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData, setStatus);
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <form onSubmit={handleSave}>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">Mode Printer</label>
                            <select name="printerMode" value={formData.printerMode || 'Thermal'} onChange={handleChange} className="w-full p-2 border rounded-md bg-white">
                                <option value="Thermal">Thermal</option>
                                <option value="Dot Matrix">Dot Matrix</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">Buka Laci Kasir</label>
                            <select name="cashdrawer" value={formData.cashdrawer || 'Tidak Aktif'} onChange={handleChange} className="w-full p-2 border rounded-md bg-white">
                                <option value="Aktif">Aktif</option>
                                <option value="Tidak Aktif">Tidak Aktif</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">Ukuran Kertas</label>
                            <select name="paperSize" value={formData.paperSize || '80mm'} onChange={handleChange} className="w-full p-2 border rounded-md bg-white">
                                <option value="58mm">58mm</option>
                                <option value="80mm">80mm</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">Jumlah Cetak</label>
                            <input type="number" name="printCount" value={formData.printCount || 1} onChange={handleChange} min="1" className="w-full p-2 border rounded-md" />
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Baris Detail</label>
                        <select name="detailLines" value={formData.detailLines || '1 Baris'} onChange={handleChange} className="w-full p-2 border rounded-md bg-white">
                            <option value="1 Baris">1 Baris</option>
                            <option value="2 Baris">2 Baris</option>
                        </select>
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Keterangan/Catatan Struk</label>
                        <textarea name="receiptNotes" value={formData.receiptNotes || ''} onChange={handleChange} className="w-full p-2 border rounded-md" rows={3}></textarea>
                    </div>
                    <div className="flex items-center justify-between">
                        <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">Simpan Pengaturan</button>
                        {status && <span className="text-sm text-gray-600">{status}</span>}
                    </div>
                </form>
            </div>
            <div>
                <h3 className="text-lg font-bold mb-4">Pratinjau Struk</h3>
                <ReceiptPreview settings={formData} />
            </div>
        </div>
    );
};
