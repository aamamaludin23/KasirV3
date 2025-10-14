import React from 'react';
import { ICONS } from '../constants';

const menuItems = [
    { name: 'Kasir', icon: ICONS.cashier },
    { name: 'Penjualan', icon: ICONS.sales },
    { name: 'Dasbor', icon: ICONS.dashboard },
    { name: 'Master Data', icon: ICONS.masterData },
];

interface BottomNavProps {
    page: string;
    setPage: (page: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ page, setPage }) => {
    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-secondary border-t border-default flex justify-around p-1 z-10 non-printable">
            {menuItems.map(item => (
                <button 
                    key={item.name} 
                    onClick={() => setPage(item.name)} 
                    className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors w-1/4 ${page === item.name ? 'accent-color font-bold' : 'text-secondary'}`}
                >
                    <span className="w-7 h-7 mb-1">{item.icon}</span>
                    <span className="text-xs font-semibold">{item.name}</span>
                </button>
            ))}
        </div>
    );
};