
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Settings } from '../types';
import { getSingleSetting, saveSingleSetting } from '../services/db';

interface SettingsContextType {
    settings: Settings;
    handleUpdateSettings: (formData: Settings, setStatus: (status: string) => void) => void;
}

const defaultSettings: Settings = {
    storeName: 'KasirPro (Simulasi)', address: 'Jl. Simulasi No. 1', phone: '081234567890', taxRate: 11,
    printerMode: 'Thermal', cashdrawer: 'Tidak Aktif', paperSize: '80mm',
    detailLines: '1 Baris', printCount: 1, receiptNotes: 'Terima kasih! (Mode Simulasi)',
    theme: 'light', lowStockThreshold: 5
};

// FIX: Export context for use in other providers like SessionContext
export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadSettings = async () => {
            const storedSettings = await getSingleSetting();
            if (storedSettings) {
                setSettings(storedSettings);
            } else {
                // First time load, save default settings
                await saveSingleSetting(defaultSettings);
            }
            setIsLoading(false);
        };
        loadSettings();
    }, []);
    
    useEffect(() => {
        if (!isLoading) {
            const root = document.documentElement;
            root.classList.remove('theme-light', 'theme-dark', 'theme-blue');
            root.classList.add(`theme-${settings.theme || 'light'}`);
        }
    }, [settings.theme, isLoading]);


    const handleUpdateSettings = async (formData: Settings, setStatus: (status: string) => void) => {
        setStatus('Menyimpan...');
        setSettings(formData);
        await saveSingleSetting(formData);
        setStatus('Pengaturan berhasil disimpan!');
        setTimeout(() => setStatus(''), 3000);
    };

    if (isLoading) return <div className="flex justify-center items-center h-screen">Memuat pengaturan...</div>;

    return (
        <SettingsContext.Provider value={{ settings, handleUpdateSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) throw new Error('useSettings must be used within a SettingsProvider');
    return context;
};
