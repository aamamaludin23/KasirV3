import React, { useState, useEffect, useCallback } from 'react';
import type { Item, Satuan, Jenis, Merek } from '../../../types';
import { ICONS } from '../../../constants';

interface ItemFormProps {
    initialData: Item | null;
    onSave: (formData: any) => void;
    onCancel: () => void;
    satuanList: Satuan[];
    jenisList: Jenis[];
    merekList: Merek[];
    setIsDirty: (dirty: boolean) => void;
    allItems: Item[];
}

const getPristineState = (): Omit<Item, 'id'> => ({
    name: '', itemCode: '', imageUrl: '', jenis: '', merek: '', statusJual: 'Dijual', hargaModal: 0, satuanModal: '',
    prices: [{ name: '', price: 0, stock: 0, barcode: '', konversi: 1, wholesaleLevels: [] }]
});

export const ItemForm: React.FC<ItemFormProps> = ({ initialData, onSave, onCancel, satuanList, jenisList, merekList, setIsDirty, allItems }) => {
    const [activeTab, setActiveTab] = useState('Informasi');
    const [formData, setFormData] = useState<Omit<Item, 'id'>>(getPristineState());
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [hasBeenTouched, setHasBeenTouched] = useState(false);

    useEffect(() => {
        const initialState = initialData ? {
            ...initialData,
            prices: initialData.prices?.length ? initialData.prices : [{ name: '', price: 0, stock: 0, barcode: '', konversi: 1, wholesaleLevels: [] }],
        } : getPristineState();
        setFormData(initialState);
        setHasBeenTouched(false);
        setErrors({});
    }, [initialData]);
    
    useEffect(() => {
        const originalState = initialData || getPristineState();
        const dirty = JSON.stringify(formData) !== JSON.stringify(originalState);
        setIsDirty(dirty);
    }, [formData, initialData, setIsDirty]);

    const runValidation = useCallback(() => {
        const newErrors: Record<string, string> = {};
        const otherItems = allItems.filter(item => item.id !== initialData?.id);

        if (!formData.name.trim()) newErrors.name = 'Nama Item wajib diisi.';
        else if (otherItems.some(item => item.name.trim().toLowerCase() === formData.name.trim().toLowerCase())) newErrors.name = 'Nama Item sudah digunakan.';
        
        if (!formData.itemCode.trim()) newErrors.itemCode = 'Kode Item wajib diisi.';
        else if (otherItems.some(item => item.itemCode?.trim().toLowerCase() === formData.itemCode.trim().toLowerCase())) newErrors.itemCode = 'Kode Item sudah digunakan.';
        
        if (!formData.hargaModal || formData.hargaModal <= 0) newErrors.hargaModal = 'Harga Modal wajib diisi dan harus lebih dari 0.';
        if (!formData.satuanModal) newErrors.satuanModal = 'Satuan Modal wajib diisi.';

        if (formData.prices.length === 0) {
            newErrors.prices = 'Minimal harus ada satu harga jual.';
        } else {
            const allOtherBarcodes = otherItems.flatMap(item => item.prices.map(p => p.barcode)).filter(Boolean);
            const formBarcodes = new Set<string>();
            formData.prices.forEach((p, index) => {
                if (!p.name) newErrors[`price_name_${index}`] = `Satuan Jual baris ${index + 1} wajib diisi.`;
                if (!p.price || p.price <= 0) newErrors[`price_price_${index}`] = `Harga Jual baris ${index + 1} wajib diisi dan lebih dari 0.`;
                if (p.barcode) {
                    const trimmedBarcode = p.barcode.trim();
                    if (trimmedBarcode) {
                        if (allOtherBarcodes.includes(trimmedBarcode)) newErrors[`price_barcode_${index}`] = `Barcode sudah digunakan.`;
                        else if (formBarcodes.has(trimmedBarcode)) newErrors[`price_barcode_${index}`] = `Barcode duplikat dalam form.`;
                        else formBarcodes.add(trimmedBarcode);
                    }
                }
            });
        }
        return newErrors;
    }, [formData, allItems, initialData]);

    useEffect(() => {
        if (hasBeenTouched) {
            setErrors(runValidation());
        }
    }, [formData, runValidation, hasBeenTouched]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'hargaModal') {
            setFormData(prev => ({ ...prev, [name]: Number(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
        setHasBeenTouched(true);
    };

    const handlePriceChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newPrices = [...formData.prices];
        const valueToSet = (['price', 'stock', 'konversi'].includes(name)) ? Number(value) : value;
        (newPrices[index] as any)[name] = valueToSet;
        setFormData(prev => ({ ...prev, prices: newPrices }));
        setHasBeenTouched(true);
    };

    const addPriceTier = () => {
        setFormData(prev => ({ ...prev, prices: [...prev.prices, { name: '', price: 0, stock: 0, barcode: '', konversi: 1, wholesaleLevels: [] }] }));
        setHasBeenTouched(true);
    };

    const removePriceTier = (index: number) => {
        const newPrices = formData.prices.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, prices: newPrices }));
        setHasBeenTouched(true);
    };
    
    const handleWholesaleChange = (priceIndex: number, levelIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const newPrices = [...formData.prices];
        (newPrices[priceIndex].wholesaleLevels[levelIndex] as any)[name] = Number(value);
        setFormData(prev => ({ ...prev, prices: newPrices }));
        setHasBeenTouched(true);
    };

    const addWholesaleLevel = (priceIndex: number) => {
        const newPrices = [...formData.prices];
        if(!newPrices[priceIndex].wholesaleLevels) {
            newPrices[priceIndex].wholesaleLevels = [];
        }
        newPrices[priceIndex].wholesaleLevels.push({ minQty: 0, price: 0 });
        setFormData(prev => ({ ...prev, prices: newPrices }));
        setHasBeenTouched(true);
    };
    
    const removeWholesaleLevel = (priceIndex: number, levelIndex: number) => {
        const newPrices = [...formData.prices];
        newPrices[priceIndex].wholesaleLevels.splice(levelIndex, 1);
        setFormData(prev => ({ ...prev, prices: newPrices }));
        setHasBeenTouched(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setHasBeenTouched(true);
        const validationErrors = runValidation();
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length === 0) {
            onSave(formData);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="text-primary">
            <div className="flex border-b border-default mb-6">
                 {['Informasi', 'Harga & Stok', 'Harga Partai'].map(tab => (
                    <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`py-3 px-5 text-md font-medium transition-colors ${activeTab === tab ? 'border-b-2 border-accent accent-color' : 'text-secondary hover:text-primary'}`}>
                        {tab}
                    </button>
                 ))}
            </div>
            
            {activeTab === 'Informasi' && (
                <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-bold mb-2">Nama Item</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} className={errors.name ? 'border-red-500' : ''} />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                        </div>
                         <div>
                             <label className="block text-sm font-bold mb-2">Kode Item</label>
                             <input type="text" name="itemCode" value={formData.itemCode} onChange={handleChange} className={errors.itemCode ? 'border-red-500' : ''} />
                             {errors.itemCode && <p className="text-red-500 text-xs mt-1">{errors.itemCode}</p>}
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-bold mb-2">Jenis</label>
                            <select name="jenis" value={formData.jenis} onChange={handleChange}>
                                <option value="">Pilih Jenis...</option>
                                {jenisList.map(j => <option key={j.id} value={j.name}>{j.name}</option>)}
                            </select>
                        </div>
                         <div>
                             <label className="block text-sm font-bold mb-2">Merek</label>
                             <select name="merek" value={formData.merek} onChange={handleChange}>
                                <option value="">Pilih Merek...</option>
                                {merekList.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                            </select>
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-bold mb-2">Harga Modal</label>
                            <input type="number" name="hargaModal" value={formData.hargaModal || ''} onChange={handleChange} className={errors.hargaModal ? 'border-red-500' : ''} />
                            {errors.hargaModal && <p className="text-red-500 text-xs mt-1">{errors.hargaModal}</p>}
                        </div>
                         <div>
                             <label className="block text-sm font-bold mb-2">Satuan Modal</label>
                             <select name="satuanModal" value={formData.satuanModal} onChange={handleChange} className={errors.satuanModal ? 'border-red-500' : ''}>
                                <option value="">Pilih Satuan...</option>
                                {satuanList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                            {errors.satuanModal && <p className="text-red-500 text-xs mt-1">{errors.satuanModal}</p>}
                        </div>
                    </div>
                     <div className="mb-4">
                        <label className="block text-sm font-bold mb-2">Status Jual</label>
                        <select name="statusJual" value={formData.statusJual || 'Dijual'} onChange={handleChange}>
                            <option value="Dijual">Dijual</option>
                            <option value="Tidak Dijual">Tidak Dijual</option>
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-bold mb-2">URL Gambar (Opsional)</label>
                        <input type="text" name="imageUrl" value={formData.imageUrl} onChange={handleChange} />
                    </div>
                </div>
            )}

            {activeTab === 'Harga & Stok' && (
                <div>
                    <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-2 mb-1 px-2">
                        <label className="text-xs font-semibold text-secondary">Satuan Jual</label>
                        <label className="text-xs font-semibold text-secondary">Konversi</label>
                        <label className="text-xs font-semibold text-secondary">Harga Jual</label>
                        <label className="text-xs font-semibold text-secondary">Stok</label>
                        <label className="text-xs font-semibold text-secondary">Barcode</label>
                    </div>
                    {errors.prices && <p className="text-red-500 text-xs my-2 text-center">{errors.prices}</p>}
                    {formData.prices.map((priceTier, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-5 items-start md:items-center gap-2 mb-2 p-2 bg-tertiary rounded-lg">
                            <div>
                                <select name="name" value={priceTier.name} onChange={(e) => handlePriceChange(index, e)} className={errors[`price_name_${index}`] ? 'border-red-500' : ''}>
                                    <option value="">Pilih Satuan...</option>
                                    {satuanList.map(satuan => (<option key={satuan.id} value={satuan.name}>{satuan.name}</option>))}
                                </select>
                                {errors[`price_name_${index}`] && <p className="text-red-500 text-xs mt-1">{errors[`price_name_${index}`]}</p>}
                            </div>
                            <input type="number" name="konversi" value={priceTier.konversi || ''} onChange={(e) => handlePriceChange(index, e)} placeholder="e.g., 24" />
                            <div>
                                <input type="number" name="price" value={priceTier.price || ''} onChange={(e) => handlePriceChange(index, e)} placeholder="Rp..." className={errors[`price_price_${index}`] ? 'border-red-500' : ''} />
                                {errors[`price_price_${index}`] && <p className="text-red-500 text-xs mt-1">{errors[`price_price_${index}`]}</p>}
                            </div>
                            <input type="number" name="stock" value={priceTier.stock || ''} onChange={(e) => handlePriceChange(index, e)} placeholder="Qty..." />
                            <div className="flex items-center">
                                <div className="flex-grow">
                                    <input type="text" name="barcode" value={priceTier.barcode} onChange={(e) => handlePriceChange(index, e)} placeholder="Scan..." className={errors[`price_barcode_${index}`] ? 'border-red-500' : ''} />
                                    {errors[`price_barcode_${index}`] && <p className="text-red-500 text-xs mt-1">{errors[`price_barcode_${index}`]}</p>}
                                </div>
                                {formData.prices.length > 1 && <button type="button" onClick={() => removePriceTier(index)} className="text-red-500 hover:text-red-700 ml-2 p-1 flex-shrink-0">{ICONS.trash}</button>}
                            </div>
                        </div>
                    ))}
                     <button type="button" onClick={addPriceTier} className="text-sm font-semibold accent-color hover:underline mt-2">+ Tambah Harga Satuan</button>
                </div>
            )}

            {activeTab === 'Harga Partai' && (
                 <div>
                    {formData.prices.filter(p => p.name).map((priceTier, priceIndex) => (
                        <div key={priceIndex} className="mb-6 p-4 border border-default rounded-lg">
                            <h4 className="font-bold text-primary mb-3">Harga Partai untuk Satuan: {priceTier.name}</h4>
                            <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-secondary mb-1">
                                <span>Minimal Qty</span>
                                <span>Harga Jual Partai</span>
                                <span>Aksi</span>
                            </div>
                            {priceTier.wholesaleLevels?.map((level, levelIndex) => (
                                <div key={levelIndex} className="grid grid-cols-3 gap-2 items-center mb-2">
                                    <input type="number" name="minQty" value={level.minQty || ''} onChange={(e) => handleWholesaleChange(priceIndex, levelIndex, e)} placeholder="Min. Qty" />
                                    <input type="number" name="price" value={level.price || ''} onChange={(e) => handleWholesaleChange(priceIndex, levelIndex, e)} placeholder="Harga Partai" />
                                    <button type="button" onClick={() => removeWholesaleLevel(priceIndex, levelIndex)} className="text-red-500 hover:text-red-700 p-1">{ICONS.trash}</button>
                                </div>
                            ))}
                            <button type="button" onClick={() => addWholesaleLevel(priceIndex)} className="text-sm font-semibold accent-color hover:underline mt-2">+ Tambah Level Harga</button>
                        </div>
                    ))}
                    {formData.prices.filter(p => p.name).length === 0 && <p className="text-secondary">Silakan tentukan satuan di tab "Harga & Stok" terlebih dahulu.</p>}
                 </div>
            )}

            <div className="flex justify-end mt-6 border-t border-default pt-4 gap-3">
                <button type="button" onClick={onCancel} className="bg-tertiary text-primary font-bold py-3 px-5 rounded-lg hover:bg-gray-300">Batal</button>
                <button type="submit" className="accent-bg accent-text font-bold py-3 px-5 rounded-lg accent-bg-hover disabled:bg-gray-400 disabled:cursor-not-allowed" disabled={Object.keys(errors).length > 0}>
                    Simpan
                </button>
            </div>
        </form>
    );
};