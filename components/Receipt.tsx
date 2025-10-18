
import React from 'react';
import type { Transaction, Settings } from '../types';

interface ReceiptProps {
    transaction: Transaction | null;
    settings: Settings;
}

export const ReceiptComponent = React.forwardRef<HTMLDivElement, ReceiptProps>(({ transaction, settings }, ref) => {
    if (!transaction) return null;

    const { 
        paperSize = '80mm', 
        detailLines = '1 Baris', 
        taxRate = 11, 
        storeName = 'KasirPro',
        address = 'Alamat Toko Anda',
        phone = 'Nomor Telepon Anda',
        receiptNotes = 'Terima kasih telah berbelanja!'
    } = settings;

    const is58mm = paperSize === '58mm';
    const effectiveTaxRate = (taxRate || 11) / 100;
    const subtotal = transaction.items.reduce((sum, item) => sum + item.priceTier.price * item.quantity, 0);
    const tax = subtotal * effectiveTaxRate;
    const total = transaction.total;

    const receiptClasses = `receipt-container p-2 bg-white ${is58mm ? 'receipt-58mm' : 'receipt-80mm'}`;

    return (
        <div ref={ref} className={receiptClasses} style={{ fontFamily: 'monospace', color: 'black' }}>
            <div className="text-center">
                <h1 className="text-xl font-bold uppercase">{storeName}</h1>
                <p className="text-xs">{address}</p>
                <p className="text-xs">Telp: {phone}</p>
            </div>

            <hr className="border-dashed border-black my-2" />

            <div className="text-xs">
                <div className="flex justify-between">
                    <span>No Struk</span>
                    <span>...{transaction.id.slice(-8)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Tanggal</span>
                    <span>{new Date(transaction.timestamp).toLocaleString('id-ID', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                    })}</span>
                </div>
                <div className="flex justify-between">
                    <span>Kasir</span>
                    <span>{transaction.cashierName || 'Admin'}</span>
                </div>
            </div>

            <hr className="border-dashed border-black my-2" />

            {/* Items */}
            {detailLines === '1 Baris' ? (
                 <div>
                    <div className="flex justify-between text-xs font-semibold">
                        <span className="flex-[3]">Produk</span>
                        <span className="flex-[1] text-right">Jml</span>
                        <span className="flex-[2] text-right">Harga</span>
                        <span className="flex-[2] text-right">Total</span>
                    </div>
                     {transaction.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-xs my-1">
                            <span className="flex-[3]">{`${item.name} (${item.priceTier.name})`}</span>
                            <span className="flex-[1] text-right">{item.quantity}</span>
                            <span className="flex-[2] text-right">{item.priceTier.price.toLocaleString('id-ID')}</span>
                            <span className="flex-[2] text-right">{(item.quantity * item.priceTier.price).toLocaleString('id-ID')}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-xs">
                    {transaction.items.map((item, index) => (
                        <div key={index} className="mb-1">
                            <div>{`${item.name} (${item.priceTier.name})`}</div>
                            <div className="flex justify-between">
                                <span>{`${item.quantity} x ${item.priceTier.price.toLocaleString('id-ID')}`}</span>
                                <span>{(item.quantity * item.priceTier.price).toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <hr className="border-dashed border-black my-2" />

            <div className="text-xs space-y-1">
                <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                {transaction.discount > 0 && (
                    <div className="flex justify-between">
                        <span>Diskon</span>
                        <span>- Rp {transaction.discount.toLocaleString('id-ID')}</span>
                    </div>
                )}
                {transaction.otherFees > 0 && (
                     <div className="flex justify-between">
                        <span>Biaya Lain</span>
                        <span>+ Rp {transaction.otherFees.toLocaleString('id-ID')}</span>
                    </div>
                )}
                <div className="flex justify-between">
                    <span>PPN ({taxRate}%)</span>
                    <span>Rp {tax.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</span>
                </div>
                 <hr className="border-dashed border-black my-1" />
                <div className="flex justify-between font-bold text-base">
                    <span>TOTAL</span>
                    <span>Rp {total.toLocaleString('id-ID')}</span>
                </div>
                 <hr className="border-dashed border-black my-1" />
                <div className="flex justify-between">
                    <span>Bayar ({transaction.paymentMethod})</span>
                    <span>Rp {(transaction.cashReceived || total).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                    <span>Kembali</span>
                    <span>Rp {( (transaction.cashReceived || total) - total).toLocaleString('id-ID')}</span>
                </div>
            </div>

            <hr className="border-dashed border-black my-2" />

            <div className="text-center text-xs mt-2">
                <p>{receiptNotes}</p>
            </div>
        </div>
    );
});
