
import React from 'react';
import { useSession } from '../context/SessionContext';
import { useSettings } from '../context/SettingsContext';
import { ICONS } from '../constants';

const menuItems = [
    { name: 'Kasir', icon: ICONS.cashier }, { name: 'Penjualan', icon: ICONS.sales },
    { name: 'Absensi', icon: ICONS.attendance }, { name: 'Dasbor', icon: ICONS.dashboard },
    { name: 'Laporan', icon: ICONS.reports }, { name: 'Master Data', icon: ICONS.masterData },
    { name: 'Pengaturan', icon: ICONS.settings },
];

interface HeaderProps {
    page: string;
    setPage: (page: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ page, setPage }) => {
    const { activeShift, handleEndShift } = useSession();
    const { settings } = useSettings();

    if (!activeShift) return null;

    return (
        <nav className="w-full bg-secondary shadow-md flex items-center justify-between p-3 md:p-4 shrink-0 non-printable border-b border-default">
            <div className="flex items-center">
                <div className="accent-bg p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-text-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 21h10"/><path d="M12.5 21l-4.2-8.5a.55.55 0 0 1 1-1.1l2.5 2.5a1.2 1.2 0 0 0 1.5 0l2.5-2.5a.55.55 0 0 1 1 1.1L11.5 21"/><path d="M3 3v11c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z"/><path d="M8 8h8"/><path d="M8 12h8"/></svg>
                </div>
                <h1 className="text-xl md:text-2xl font-bold ml-4 text-primary hidden sm:block">{settings.storeName || 'KasirPro'}</h1>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
                <span className="text-md font-medium text-secondary hidden md:inline">Kasir: <span className="font-bold text-primary">{activeShift.adminName}</span></span>
                <ul className="hidden md:flex items-center space-x-1">
                    {menuItems.map(item => (
                        <li key={item.name}>
                            <button onClick={() => setPage(item.name)} className={`flex items-center p-3 rounded-lg transition-colors ${page === item.name ? 'accent-bg-light accent-color font-semibold' : 'text-secondary hover:bg-tertiary hover:text-primary'}`}>
                                <span className="w-6 h-6">{item.icon}</span>
                                <span className="ml-2 hidden lg:inline">{item.name}</span>
                            </button>
                        </li>
                    ))}
                </ul>
                 <button onClick={handleEndShift} className="ml-2 md:ml-4 bg-red-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    <span className="hidden xl:inline">Akhiri Sesi</span>
                </button>
            </div>
        </nav>
    );
};