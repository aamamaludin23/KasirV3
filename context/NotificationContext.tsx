import React, { createContext, useContext, useState } from 'react';

interface Notification {
    message: string;
    type: 'success' | 'warning';
}

interface NotificationContextType {
    notification: Notification | null;
    showNotification: (message: string, type?: 'success' | 'warning') => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [notification, setNotification] = useState<Notification | null>(null);

    const showNotification = (message: string, type: 'success' | 'warning' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), type === 'warning' ? 5000 : 3000);
    };

    return (
        <NotificationContext.Provider value={{ notification, showNotification }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) throw new Error('useNotification must be used within a NotificationProvider');
    return context;
};
