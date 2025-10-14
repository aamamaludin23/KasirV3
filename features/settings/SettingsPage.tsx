
import React, { useState } from 'react';
import type { Settings } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { useData } from '../../context/DataContext';
import { useSession } from '../../context/SessionContext';
import { StoreProfileForm } from './components/StoreProfileForm';
import { GeneralSettingsForm } from './components/GeneralSettingsForm';
import { MiniPrinterSettingsForm } from './components/MiniPrinterSettingsForm';
import { BackupPageComponent } from './components/BackupPageComponent';
import { ThemeSettingsForm } from './components/ThemeSettingsForm';

const SettingsPage: React.FC = () => {
    const { settings, handleUpdateSettings } = useSettings();
    const [activeTab, setActiveTab] = useState('Profil Toko');
    const tabs = ['Profil Toko', 'Umum', 'Printer & Struk', 'Tema', 'Backup Data'];
    
    return (
        <div className="text-primary">
             <h2 className="text-3xl font-bold mb-6">Pengaturan</h2>
             <div className="overflow-x-auto">
                <div className="flex border-b border-default mb-6 min-w-max">
                    {tabs.map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`py-3 px-5 text-md font-medium transition-colors whitespace-nowrap ${activeTab === tab ? 'border-b-2 border-accent accent-color font-semibold' : 'text-secondary hover:text-primary'}`}>
                            {tab}
                        </button>
                    ))}
                </div>
            </div>
            <div className="bg-secondary p-6 md:p-8 rounded-xl shadow-md max-w-3xl mx-auto">
              {activeTab === 'Profil Toko' && <StoreProfileForm settings={settings} onSave={handleUpdateSettings}/>}
              {activeTab === 'Umum' && <GeneralSettingsForm settings={settings} onSave={handleUpdateSettings}/>}
              {activeTab === 'Printer & Struk' && <MiniPrinterSettingsForm settings={settings} onSave={handleUpdateSettings}/>}
              {activeTab === 'Tema' && <ThemeSettingsForm settings={settings} onSave={handleUpdateSettings}/>}
              {activeTab === 'Backup Data' && <BackupPageComponent />}
            </div>
        </div>
    );
};

export default SettingsPage;