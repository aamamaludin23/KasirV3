
import React, { useState, useRef } from 'react';
import { useData } from '../../../context/DataContext';
import { useSession } from '../../../context/SessionContext';
import { useSettings } from '../../../context/SettingsContext';
import { clearAllData, saveData, saveSingleSetting } from '../../../services/db';
import { KasirProDBSchema } from '../../../services/db';
import { ConfirmationModal } from '../../../components/ConfirmationModal';

export const BackupPageComponent: React.FC = () => {
    const { items, customers, satuans, mereks, jenises, banks } = useData();
    const { transactions, shifts, attendances } = useSession();
    const { settings } = useSettings();
    
    const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
    const [restoreData, setRestoreData] = useState<any | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleBackup = (collectionName: string, data: any[]) => {
        try {
            if (!data) {
                alert(`Data for ${collectionName} not found.`);
                return;
            }
            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
            const link = document.createElement("a");
            link.href = jsonString;
            link.download = `${collectionName}_backup_${new Date().toISOString().slice(0,10)}.json`;
            link.click();
        } catch(e) {
            console.error("Error backing up data: ", e);
            alert("Gagal melakukan backup data.");
        }
    };

    const handleBackupAll = () => {
        const allData = { settings, items, customers, transactions, shifts, attendances, satuans, mereks, jenises, banks };
        handleBackup('kasirpro_all_data', [allData]);
    };
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File could not be read");
                
                const parsedData = JSON.parse(text);
                const dataToRestore = Array.isArray(parsedData) ? parsedData[0] : parsedData;

                if (!dataToRestore.items || !dataToRestore.settings) {
                    throw new Error("Invalid backup file format.");
                }
                setRestoreData(dataToRestore);
                setShowRestoreConfirm(true);

            } catch (error) {
                console.error("Error restoring data:", error);
                alert(`Gagal memuat file backup. Pastikan file valid. Error: ${(error as Error).message}`);
            } finally {
                 if(fileInputRef.current) fileInputRef.current.value = "";
            }
        };
        reader.readAsText(file);
    };

    const handleConfirmRestore = async () => {
        if (!restoreData) return;
        
        try {
            await clearAllData();

            if (restoreData.settings) {
                await saveSingleSetting(restoreData.settings);
            }

            const storeNames: (keyof KasirProDBSchema)[] = ['items', 'transactions', 'customers', 'banks', 'shifts', 'satuans', 'jenises', 'mereks', 'attendances'];
            
            for (const key of storeNames) {
                if (restoreData[key] && Array.isArray(restoreData[key])) {
                    await saveData(key, restoreData[key]);
                }
            }

            alert("Data berhasil dipulihkan! Aplikasi akan dimuat ulang.");
            window.location.reload();

        } catch (error) {
            console.error("Error during restore process:", error);
            alert("Terjadi kesalahan saat memulihkan data.");
        }
    };
    
    const backupCollections: {name: string, data: any[]}[] = [
        { name: 'items', data: items },
        { name: 'customers', data: customers },
        { name: 'transactions', data: transactions },
        { name: 'shifts', data: shifts },
        { name: 'attendances', data: attendances },
        { name: 'satuans', data: satuans },
        { name: 'mereks', data: mereks },
        { name: 'jenises', data: jenises },
        { name: 'banks', data: banks }
    ];

    return (
        <div className="text-primary">
            <div className="mb-8 p-4 border border-blue-200 rounded-lg bg-blue-50">
                <h3 className="text-xl font-bold text-blue-800 mb-2">Backup Semua Data</h3>
                <p className="text-blue-700 mb-4">Simpan semua data aplikasi Anda (barang, penjualan, pengaturan, dll.) ke dalam satu file. Simpan file ini di tempat yang aman.</p>
                <button onClick={handleBackupAll} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                    Unduh Semua Data (.json)
                </button>
            </div>
            
            <div className="mb-8 p-4 border border-red-200 rounded-lg bg-red-50">
                 <h3 className="text-xl font-bold text-red-800 mb-2">Pulihkan Data</h3>
                 <p className="text-red-700 mb-4">
                    <span className="font-bold">PERINGATAN:</span> Memulihkan data dari file backup akan <span className="font-bold">MENGHAPUS SEMUA DATA YANG ADA SAAT INI</span> dan menggantinya dengan data dari file.
                 </p>
                 <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-100 file:text-red-700 hover:file:bg-red-200"/>
            </div>

            <h4 className="text-lg font-semibold text-secondary mb-3 mt-8 border-t pt-4">Backup Data Individual</h4>
            <div className="grid grid-cols-2 gap-4">
                {backupCollections.map(col => (
                     <button key={col.name} onClick={() => handleBackup(col.name, col.data)} className="bg-tertiary text-primary font-semibold py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors capitalize">
                        Backup {col.name === 'transactions' ? 'Penjualan' : col.name.replace(/s$/, '')}
                    </button>
                ))}
            </div>

            <ConfirmationModal 
                show={showRestoreConfirm}
                onClose={() => setShowRestoreConfirm(false)}
                onConfirm={handleConfirmRestore}
                title="Konfirmasi Pemulihan Data"
                message="Apakah Anda benar-benar yakin? Semua data saat ini akan dihapus dan diganti dengan data dari file backup. Tindakan ini tidak dapat diurungkan."
            />
        </div>
    );
};
