import React, { useState } from 'react';
import { useSession } from '../../context/SessionContext';

export const StartShiftScreen: React.FC = () => {
    const { handleStartShift } = useSession();
    const [adminName, setAdminName] = useState('');
    const [initialBalance, setInitialBalance] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const balance = Number(initialBalance);
        if (adminName && initialBalance !== '' && !isNaN(balance) && balance >= 0) {
            setError('');
            handleStartShift(adminName, balance);
        } else {
            setError('Saldo awal harus diisi dengan angka dan tidak boleh negatif.');
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-primary text-primary">
            <div className="w-full max-w-md p-8 space-y-8 bg-secondary rounded-xl shadow-lg">
                <div className="text-center">
                    <h1 className="text-4xl font-bold">Mulai Sesi Kasir</h1>
                    <p className="text-secondary mt-2">Masukkan nama dan saldo awal Anda untuk memulai.</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-primary mb-2">Nama Kasir / Admin</label>
                        <input 
                            type="text" 
                            value={adminName}
                            onChange={(e) => setAdminName(e.target.value)}
                            className="w-full"
                            required 
                            placeholder="Contoh: Budi"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-primary mb-2">Saldo Awal (Rp)</label>
                        <input 
                            type="number"
                            value={initialBalance}
                            onChange={(e) => setInitialBalance(e.target.value)}
                            className="w-full"
                            required
                            min="0"
                            placeholder="Contoh: 500000"
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <button type="submit" className="w-full py-4 px-4 font-bold text-lg accent-text accent-bg rounded-lg accent-bg-hover transition-colors">
                        Mulai Sesi
                    </button>
                </form>
            </div>
        </div>
    );
};
