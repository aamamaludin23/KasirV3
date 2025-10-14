
import React from 'react';
import type { Transaction, Settings } from '../types';

interface ReceiptProps {
    transaction: Transaction | null;
    settings: Settings;
}

export const ReceiptComponent = React.forwardRef<HTMLDivElement, ReceiptProps>(({ transaction, settings }, ref) => {
    if (!transaction) return null;

    const taxRate = (settings.taxRate || 11) / 100;
    const subtotal = transaction.items.reduce((sum, item) => sum + item.priceTier.price * item.quantity, 0);
    const tax = subtotal * taxRate;
    const total = transaction.total;

    return (
        <div ref={ref} className="receipt-container p-2">
            <div className="text-center">
                <h2 className="text-lg font-bold">{settings.storeName || 'KasirPro'}</h2>
                <p className="text-xs">{settings.address || 'Alamat Toko Anda'}</p>
                <p className="text-xs">Telp: {settings.phone || 'Nomor Telepon Anda'}</p>
                <hr className="border-dashed border-black my-2" />
            </div>
            <div className="text-xs">
                <p>No: ...{transaction.id.slice(-6)}</p>
                <p>Tgl: {transaction.timestamp.toLocaleString('id-ID')}</p>
            </div>
            <hr className="border-dashed border-black my-2" />
            <div>
                {transaction.items.map((item, index) => (
                    <div key={index} className="text-xs mb-1">
                        <p className="font-semibold">{item.name} ({item.priceTier.name})</p>
                        <div className="flex justify-between">
                            <span>{item.quantity} x {item.priceTier.price.toLocaleString('id-ID')}</span>
                            <span>{(item.quantity * item.priceTier.price).toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                ))}
            </div>
            <hr className="border-dashed border-black my-2" />
            <div className="text-xs">
                 <div className="flex justify-between"><span>Subtotal:</span><span>{subtotal.toLocaleString('id-ID')}</span></div>
                 {transaction.discount > 0 && <div className="flex justify-between"><span>Diskon:</span><span>- {transaction.discount.toLocaleString('id-ID')}</span></div>}
                 {transaction.otherFees > 0 && <div className="flex justify-between"><span>Biaya Lain:</span><span>+ {transaction.otherFees.toLocaleString('id-ID')}</span></div>}
                 <div className="flex justify-between"><span>PPN ({settings.taxRate || 11}%):</span><span>{tax.toLocaleString('id-ID')}</span></div>
                 <div className="flex justify-between font-bold text-sm mt-1"><span>Total:</span><span>{total.toLocaleString('id-ID')}</span></div>
            </div>
             <hr className="border-dashed border-black my-2" />
             <p className="text-center text-xs mt-2">{settings.receiptNotes || 'Terima kasih telah berbelanja!'}</p>
        </div>
    );
});
