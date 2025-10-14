import React from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => (
    <div className="bg-secondary p-6 rounded-xl shadow-md flex items-center">
        <div className="accent-bg-light accent-color p-4 rounded-full mr-5">
            <div className="w-8 h-8">{icon}</div>
        </div>
        <div>
            <p className="text-secondary text-md font-medium">{title}</p>
            <p className="text-3xl font-bold text-primary">{value}</p>
        </div>
    </div>
);