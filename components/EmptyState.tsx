import React from 'react';

interface EmptyStateProps {
    title: string;
    message: string;
    icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, message, icon }) => {
    return (
        <div className="text-center p-8 md:p-12 h-full flex flex-col justify-center items-center">
            {icon && <div className="text-secondary opacity-50 mb-4 w-16 h-16">{icon}</div>}
            <h3 className="text-xl font-bold text-primary">{title}</h3>
            <p className="text-secondary mt-2">{message}</p>
        </div>
    );
};
