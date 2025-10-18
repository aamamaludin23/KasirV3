import React, { useState, useCallback, useMemo } from 'react';
import type { Transaction, Item, CartItem, PriceTier } from '../../types';
import { useData } from '../../context/DataContext';
import { useSettings } from '../../context/SettingsContext';
import { Modal } from '../../components/Modal';
import { ICONS } from '../../constants';

interface EditTransactionModalProps {
    transaction: Transaction;
    onClose: () => void;
    onSave: (newCart: CartItem[], newTotal: number, paymentAmount: number) => void;
    onSaveAndPrint: (newCart: CartItem[], newTotal: number, paymentAmount: number) => void;
    onReprint: () => void;
}

const getPriceForCartItem = (cartItem: CartItem): number => {
    const { priceTier, quantity } = cartItem;
    const sortedLevels = [...(priceTier.wholesaleLevels || [])].sort((a,b) => b.minQty - a.minQty);
    for(const level of sortedLevels) {
        if(quantity >= level.minQty) return level.price;
    }
    return priceTier.price;
};

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({ transaction, onClose, onSave, onSaveAndPrint, onReprint }) => {
    const { items: allItems, customers } = useData();
    const { settings } = useSettings();

    const [editedCart, setEditedCart] = useState<CartItem[]>(transaction.items.map(tItem => {
        const fullItem = allItems.find(i => i.id === tItem.id);
        return {
            ...fullItem!,
            quantity: tItem.quantity,
            priceTier: tItem.priceTier,
        };
    }));
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentError, setPaymentError] = useState('');
    
    const customer = useMemo(() => customers.find(c => c.id === transaction.customerId), [customers, transaction.customerId]);

    const taxRate = (settings.taxRate || 11) / 100;
    
    const subtotal = useMemo(() => 
        editedCart.reduce((sum, item) => sum + getPriceForCartItem(item) * item.quantity, 0),
    [editedCart]);

    const total = useMemo(() => {
        const discountedSubtotal = subtotal - (transaction.discount || 0);
        const totalWithTax = discountedSubtotal * (1 + taxRate);
        return totalWithTax + (transaction.otherFees || 0);
    }, [subtotal, transaction.discount, transaction.otherFees, taxRate]);
    
    const remainingDebtOnTransaction = useMemo(() => {
        const debt = total - (transaction.amountPaid || 0);
        return debt > 0 ? debt : 0;
    }, [total, transaction.amountPaid]);

    const updateQuantity = useCallback((itemId: string, priceTierName: string, delta: number) => {
        setEditedCart(prevCart => prevCart.map(item =>
            item.id === itemId && item.priceTier.name === priceTierName
                ? { ...item, quantity: Math.max(1, item.quantity + delta) }
                : item
        ));
    }, []);
    
    const removeItem = useCallback((itemId: string, priceTierName: string) => {
        setEditedCart(prevCart => prevCart.filter(item => 
            !(item.id === itemId && item.priceTier.name === priceTierName)
        ));
    }, []);

    const handleAddItem = useCallback((item: Item, priceTier: PriceTier) => {
        setEditedCart(prevCart => {
            const existingItem = prevCart.find(cartItem => cartItem.id === item.id && cartItem.priceTier.name === priceTier.name);
            if (existingItem) {
                return prevCart.map(cartItem =>
                    cartItem.id === item.id && cartItem.priceTier.name === priceTier.name
                        ? { ...cartItem, quantity: cartItem.quantity + 1 }
                        : cartItem
                );
            }
            return [...prevCart, { ...item, quantity: 1, priceTier }];
        });
    }, []);

    const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const numValue = Number(value);

        setPaymentAmount(value);

        if (value && (numValue < 0 || numValue > remainingDebtOnTransaction)) {
            setPaymentError(`Pembayaran tidak boleh melebihi sisa tagihan.`);
        } else {
            setPaymentError('');
        }
    };


    return (
        <Modal show={true} onClose={onClose} title={`Edit Transaksi ...${transaction.id.slice(-6)}`} size="4xl">
            <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-bold mb-2">Item Transaksi</h4>
                        <div className="max-h-80 overflow-y-auto pr-2">
                        {editedCart.map(item => (
                            <div key={`${item.id}-${item.priceTier.name}`} className="flex items-center justify-between p-2 bg-tertiary rounded mb-2">
                                <div>
                                    <p className="font-semibold">{item.name}</p>
                                    <p className="text-xs text-secondary">{item.priceTier.name} - Rp {item.priceTier.price.toLocaleString('id-ID')}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => updateQuantity(item.id, item.priceTier.name, -1)} className="px-2 py-0.5 bg-secondary rounded hover:bg-gray-300">-</button>
                                    <span>{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.id, item.priceTier.name, 1)} className="px-2 py-0.5 bg-secondary rounded hover:bg-gray-300">+</button>
                                    <button onClick={() => removeItem(item.id, item.priceTier.name)} className="text-red-500 hover:text-red-700 ml-2">{ICONS.trash}</button>
                                </div>
                            </div>
                        ))}
                        </div>
                        <div className="mt-4 p-4 border-t border-default">
                            <div className="flex justify-between font-bold text-xl">
                                <span>Total Baru:</span>
                                <span>Rp {total.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold mb-2">Tambah Item</h4>
                        <div className="max-h-80 overflow-y-auto p-1 bg-tertiary rounded">
                            {allItems.map(item => (
                                item.prices.map(priceTier => (
                                    <div key={`${item.id}-${priceTier.name}`} onClick={() => handleAddItem(item, priceTier)} className="p-2 hover:accent-bg-light cursor-pointer rounded">
                                        <p className="font-semibold">{item.name}</p>
                                        <p className="text-sm text-secondary">{priceTier.name} - Rp {priceTier.price.toLocaleString('id-ID')}</p>
                                    </div>
                                ))
                            ))}
                        </div>
                    </div>
                </div>

                {transaction.paymentMethod === 'Kredit' && customer && (
                    <div className="mt-6 border-t border-default pt-4">
                        <h4 className="font-bold mb-3 text-lg text-primary">Pembayaran Tagihan</h4>
                        <div className="p-4 bg-tertiary rounded-lg space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-secondary">Pelanggan:</span>
                                <span className="font-semibold text-primary">{customer.name}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-secondary">Sisa Tagihan Transaksi Ini:</span>
                                <span className="font-bold text-red-600">Rp {remainingDebtOnTransaction.toLocaleString('id-ID')}</span>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-primary mb-2">Jumlah Bayar (Rp)</label>
                                <input 
                                    type="number"
                                    value={paymentAmount}
                                    onChange={handlePaymentChange}
                                    max={remainingDebtOnTransaction}
                                    className={`w-full text-xl ${paymentError ? 'border-red-500 focus:border-red-500 ring-red-500' : ''}`}
                                    placeholder="0"
                                />
                                {paymentError && <p className="text-red-500 text-xs mt-1">{paymentError}</p>}
                            </div>
                            {remainingDebtOnTransaction > 0 && (
                                <div className="flex justify-end">
                                    <button type="button" onClick={() => { setPaymentAmount(String(remainingDebtOnTransaction)); setPaymentError(''); }} className="text-sm font-semibold accent-color hover:underline">
                                        Bayar Lunas
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-wrap justify-end mt-6 border-t border-default pt-4 gap-2">
                <button onClick={onClose} className="bg-tertiary text-primary font-bold py-2 px-4 rounded-lg hover:bg-gray-300">Batal</button>
                <button onClick={onReprint} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">Cetak Ulang</button>
                <button onClick={() => onSave(editedCart, total, Number(paymentAmount) || 0)} className="accent-bg accent-text font-bold py-2 px-4 rounded-lg accent-bg-hover disabled:bg-gray-400" disabled={!!paymentError}>Simpan</button>
                <button onClick={() => onSaveAndPrint(editedCart, total, Number(paymentAmount) || 0)} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400" disabled={!!paymentError}>Simpan & Cetak</button>
            </div>
        </Modal>
    );
};