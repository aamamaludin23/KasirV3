
import React from 'react';
import type { Settings } from '../../../types';

interface ReceiptPreviewProps {
    settings: Partial<Settings>;
}

export const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({ settings }) => {
    const { paperSize = '80mm', detailLines = '1 Baris', receiptNotes = 'Terima kasih telah berbelanja!' } = settings;

    const is58mm = paperSize === '58mm';

    return (
        <div className={`bg-white p-4 rounded-lg border-2 border-dashed ${is58mm ? 'w-58mm' : 'w-80mm'}`} style={{ fontFamily: 'monospace' }}>
            <div className="text-center">
                <h2 className="text-xl font-bold">Nama Toko Anda</h2>
                <p className="text-sm">Alamat Toko Anda</p>
                <p className="text-sm">Telepon: 123-456-7890</p>
            </div>
            <div className="my-2 border-t border-dashed border-black"></div>
            <div className="flex justify-between text-sm">
                <span>Kasir: Nama Kasir</span>
                <span>Tanggal: {new Date().toLocaleDateString()}</span>
            </div>
            <div className="my-2 border-t border-dashed border-black"></div>
            <div>
                <div className={`grid ${detailLines === '1 Baris' ? 'grid-cols-3' : 'grid-cols-1'} gap-1 text-sm`}>
                    <div className="font-bold">Item</div>
                    {detailLines === '1 Baris' && <div className="text-right font-bold">Qty</div>}
                    {detailLines === '1 Baris' && <div className="text-right font-bold">Harga</div>}
                </div>
                {/* Contoh Item */}
                <div className={`grid ${detailLines === '1 Baris' ? 'grid-cols-3' : 'grid-cols-1'} gap-1 text-sm`}>
                    <div>Contoh Item 1</div>
                    {detailLines === '1 Baris' ? (
                        <>
                            <div className="text-right">1</div>
                            <div className="text-right">10.000</div>
                        </>
                    ) : (
                        <div className="flex justify-between">
                            <span>1 x 10.000</span>
                            <span>10.000</span>
                        </div>
                    )}
                </div>
                 <div className={`grid ${detailLines === '1 Baris' ? 'grid-cols-3' : 'grid-cols-1'} gap-1 text-sm`}>
                    <div>Contoh Item 2</div>
                    {detailLines === '1 Baris' ? (
                        <>
                            <div className="text-right">2</div>
                            <div className="text-right">5.000</div>
                        </>
                    ) : (
                        <div className="flex justify-between">
                            <span>2 x 5.000</span>
                            <span>10.000</span>
                        </div>
                    )}
                </div>
            </div>
            <div className="my-2 border-t border-dashed border-black"></div>
            <div className="text-right text-sm">
                <p>Subtotal: 20.000</p>
                <p>Diskon: 0</p>
                <p className="font-bold">Total: 20.000</p>
            </div>
            <div className="my-2 border-t border-dashed border-black"></div>
            <div className="text-center text-sm">
                <p>{receiptNotes}</p>
            </div>
        </div>
    );
};
