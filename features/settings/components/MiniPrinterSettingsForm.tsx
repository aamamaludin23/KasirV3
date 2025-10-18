
import React, { useState, useEffect } from 'react';
import type { Settings } from '../../../types';
import { useSession } from '../../../context/SessionContext';
import { ReceiptPreview } from './ReceiptPreview';

interface MiniPrinterSettingsFormProps {
    settings: Settings;
    onSave: (formData: Settings, setStatus: (status: string) => void) => void;
}

export const MiniPrinterSettingsForm: React.FC<MiniPrinterSettingsFormProps> = ({ settings, onSave }) => {
    const [formData, setFormData] = useState<Settings>(settings);
    const [status, setStatus] = useState('');
    const { isPrinterConnected, connectPrinter, testPrinter } = useSession();

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
                <div className="bg-secondary p-4 rounded-lg shadow mb-6 border border-default">
                    <h3 className="text-lg font-semibold text-primary mb-3">Koneksi Printer Thermal</h3>
                    <div className="flex items-center gap-4 mb-4">
                        <p className="text-secondary">Status:</p>
                        {isPrinterConnected ? (
                            <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-800 font-semibold text-sm">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                Terhubung
                            </span>
                        ) : (
                            <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-800 font-semibold text-sm">
                                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                Tidak Terhubung
                            </span>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={connectPrinter}
                            className="accent-bg accent-text font-bold py-2 px-4 rounded-lg accent-bg-hover"
                        >
                            Hubungkan Printer
                        </button>
                        <button
                            type="button"
                            onClick={testPrinter}
                            disabled={!isPrinterConnected}
                            className="bg-tertiary text-primary font-bold py-2 px-4 rounded-lg hover:bg-gray-300 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                            Test Cetak
                        </button>
                    </div>
                    <p className="text-xs text-secondary mt-3">Gunakan browser Chrome/Edge. Jika gagal, coba hubungkan kembali printer lalu klik tombol lagi.</p>
                </div>
                
                <form onSubmit={handleSave} className="bg-secondary p-4 rounded-lg shadow border border-default">
                    <h3 className="text-lg font-semibold text-primary mb-3">Pengaturan Struk</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="mb-4">
                            <label className="block text-secondary text-sm font-bold mb-2">Mode Printer</label>
                            <select name="printerMode" value={formData.printerMode || 'Thermal'} onChange={handleChange} className="w-full p-2 border rounded-md bg-secondary">
                                <option value="Thermal">Thermal</option>
                                <option value="Dot Matrix">Dot Matrix</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-secondary text-sm font-bold mb-2">Buka Laci Kasir</label>
                            <select name="cashdrawer" value={formData.cashdrawer || 'Tidak Aktif'} onChange={handleChange} className="w-full p-2 border rounded-md bg-secondary">
                                <option value="Aktif">Aktif</option>
                                <option value="Tidak Aktif">Tidak Aktif</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="mb-4">
                            <label className="block text-secondary text-sm font-bold mb-2">Ukuran Kertas</label>
                            <select name="paperSize" value={formData.paperSize || '80mm'} onChange={handleChange} className="w-full p-2 border rounded-md bg-secondary">
                                <option value="58mm">58mm</option>
                                <option value="80mm">80mm</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-secondary text-sm font-bold mb-2">Jumlah Cetak</label>
                            <input type="number" name="printCount" value={formData.printCount || 1} onChange={handleChange} min="1" className="w-full p-2 border rounded-md" />
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block text-secondary text-sm font-bold mb-2">Baris Detail</label>
                        <select name="detailLines" value={formData.detailLines || '1 Baris'} onChange={handleChange} className="w-full p-2 border rounded-md bg-secondary">
                            <option value="1 Baris">1 Baris</option>
                            <option value="2 Baris">2 Baris</option>
                        </select>
                    </div>
                    <div className="mb-6">
                        <label className="block text-secondary text-sm font-bold mb-2">Keterangan/Catatan Struk</label>
                        <textarea name="receiptNotes" value={formData.receiptNotes || ''} onChange={handleChange} className="w-full p-2 border rounded-md" rows={3}></textarea>
                    </div>
                    <div className="flex items-center justify-between">
                        <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">Simpan Pengaturan</button>
                        {status && <span className="text-sm text-gray-600">{status}</span>}
                    </div>
                </form>
            </div>
            <div>
                <h3 className="text-lg font-bold mb-4 text-primary">Pratinjau Struk</h3>
                <ReceiptPreview settings={formData} />
            </div>
        </div>
    );
};
