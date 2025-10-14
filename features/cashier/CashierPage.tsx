

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { Item, CartItem, PriceTier } from '../../types';
import { useData } from '../../context/DataContext';
import { useSession } from '../../context/SessionContext';
import { Modal } from '../../components/Modal';
import { PaymentModal } from './PaymentModal';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { EmptyState } from '../../components/EmptyState';
import { ICONS } from '../../constants';

const CashierPage: React.FC = () => {
    const { items, customers, banks } = useData();
    const {
        cart, setCart,
        discount, setDiscount,
        otherFees, setOtherFees,
        selectedCustomerId, setSelectedCustomerId,
        handleTransactionCompleteWrapper,
        handleHoldTransaction,
        pendingTransaction,
        clearPendingTransaction,
        total,
        subtotal,
        tax,
        settings,
    } = useSession();

    const [showPriceModal, setShowPriceModal] = useState(false);
    const [selectedItemForPrice, setSelectedItemForPrice] = useState<Item | null>(null);
    const [itemToEditUnit, setItemToEditUnit] = useState<{ item: CartItem, index: number } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [focusedSearchIndex, setFocusedSearchIndex] = useState(-1);
    const [focusedPriceIndex, setFocusedPriceIndex] = useState(0);
    const [focusedCartIndex, setFocusedCartIndex] = useState(-1);
    const [isSearching, setIsSearching] = useState(false);
    const [itemToFocusQty, setItemToFocusQty] = useState<string | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ itemId: string; priceTierName: string; } | null>(null);

    const searchInputRef = useRef<HTMLInputElement>(null);
    const cartItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const qtyInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
    
    const availableItems = useMemo(() => items.filter(item => item.statusJual !== 'Tidak Dijual'), [items]);

    const Fuse = (window as any).Fuse;

    const fuse = useMemo(() => {
        if (!Fuse) return null;
        return new Fuse(availableItems, {
            keys: ['name', 'itemCode'],
            includeScore: true,
            threshold: 0.3,
        });
    }, [availableItems, Fuse]);

    // High-performance barcode lookup map
    const barcodeMap = useMemo(() => {
        const map = new Map<string, { item: Item, priceTier: PriceTier }>();
        availableItems.forEach(item => {
            item.prices.forEach(priceTier => {
                if (priceTier.barcode) {
                    map.set(priceTier.barcode, { item, priceTier });
                }
            });
        });
        return map;
    }, [availableItems]);

    useEffect(() => {
        if (pendingTransaction) {
            const cartItems = pendingTransaction.items.map(tItem => {
                const fullItem = items.find(i => i.id === tItem.id);
                if (!fullItem) return null;
                return {
                    ...fullItem,
                    quantity: tItem.quantity,
                    priceTier: tItem.priceTier,
                };
            }).filter((item): item is CartItem => item !== null);

            setCart(cartItems);
            setDiscount(pendingTransaction.discount || 0);
            setOtherFees(pendingTransaction.otherFees || 0);
            setSelectedCustomerId(pendingTransaction.customerId || '1');
            clearPendingTransaction();
        }
    }, [pendingTransaction, items, setCart, setDiscount, setOtherFees, setSelectedCustomerId, clearPendingTransaction]);

    const filteredItems = useMemo(() => (searchTerm && fuse) ? fuse.search(searchTerm).map(result => result.item) : [], [searchTerm, fuse]);

    useEffect(() => { if (isSearching && searchInputRef.current) searchInputRef.current.focus(); }, [isSearching]);

    const resetSearch = useCallback(() => {
        setSearchTerm(''); setFocusedSearchIndex(-1); setIsSearching(false);
        setSelectedItemForPrice(null); setShowPriceModal(false); setItemToEditUnit(null);
    }, []);

    const addToCart = useCallback((item: Item, priceTier: PriceTier) => {
        const itemKey = `${item.id}-${priceTier.name}`;
        setCart(prevCart => {
            const existingItemIndex = prevCart.findIndex(ci => ci.id === item.id && ci.priceTier.name === priceTier.name);
            if (existingItemIndex > -1) {
                const newCart = [...prevCart];
                newCart[existingItemIndex] = { ...newCart[existingItemIndex], quantity: newCart[existingItemIndex].quantity + 1 };
                return newCart;
            }
            return [...prevCart, { ...item, quantity: 1, priceTier }];
        });
        setItemToFocusQty(itemKey);
        resetSearch();
    }, [setCart, resetSearch]);

    const handleItemClick = useCallback((item: Item) => {
        if (item.prices?.length > 1) { setSelectedItemForPrice(item); setFocusedPriceIndex(0); setShowPriceModal(true); }
        else if (item.prices?.length === 1) { addToCart(item, item.prices[0]); }
    }, [addToCart]);
    
    // Barcode scanner listener
    useEffect(() => {
        let barcode = '';
        let lastKeyTime = Date.now();

        const handleBarcodeScan = (e: KeyboardEvent) => {
            // Ignore if a modal is open or an input is focused, to prevent interference.
            // Also resets the barcode buffer to avoid capturing partial input.
            if (showPaymentModal || showPriceModal || itemToEditUnit || showDeleteConfirm || (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement)) {
                barcode = '';
                return;
            }
            
            const currentTime = Date.now();
            // A short time diff between keys suggests scanner input vs. manual typing.
            const timeDiff = currentTime - lastKeyTime;
            lastKeyTime = currentTime;

            if (timeDiff > 100) { // If there's a pause, reset the barcode buffer.
                barcode = '';
            }

            if (e.key === 'Enter') {
                if (barcode.length > 3) { // Typical barcodes are longer than 3 chars.
                    const found = barcodeMap.get(barcode);
                    if (found) {
                        addToCart(found.item, found.priceTier);
                    }
                }
                barcode = ''; // Reset after processing.
            } else if (e.key.length === 1) { // Append alphanumeric characters from the scanner.
                barcode += e.key;
            }
        };

        window.addEventListener('keydown', handleBarcodeScan);
        return () => {
            window.removeEventListener('keydown', handleBarcodeScan);
        };
    }, [showPaymentModal, showPriceModal, itemToEditUnit, showDeleteConfirm, barcodeMap, addToCart]);
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (showPaymentModal || showPriceModal || itemToEditUnit || showDeleteConfirm) return;
            if (e.key === 'F10' && cart.length > 0) { e.preventDefault(); setShowPaymentModal(true); }
            if (isSearching) {
                if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedSearchIndex(prev => Math.min(prev + 1, filteredItems.length - 1)); } 
                else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedSearchIndex(prev => Math.max(prev - 1, 0)); } 
                else if (e.key === 'Enter') { e.preventDefault(); if (focusedSearchIndex >= 0) handleItemClick(filteredItems[focusedSearchIndex]); } 
                else if (e.key === 'Escape') { resetSearch(); }
                return;
            }
            if (!isSearching && cart.length > 0) {
                if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedCartIndex(prev => Math.max(0, prev - 1)); }
                else if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedCartIndex(prev => Math.min(cart.length - 1, prev + 1)); }
            }
            // Allow typing to start search
            if (!isSearching && /^[a-zA-Z0-9]$/.test(e.key) && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement)) {
                e.preventDefault();
                setIsSearching(true);
                setSearchTerm(e.key);
            }
            if (!isSearching && e.key === 'Enter') { e.preventDefault(); setIsSearching(true); }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSearching, showPriceModal, itemToEditUnit, focusedSearchIndex, filteredItems, showPaymentModal, cart, focusedCartIndex, handleItemClick, resetSearch, showDeleteConfirm]);
    
    useEffect(() => {
        if (showPriceModal) {
            const handleModalKeyDown = (e: KeyboardEvent) => {
                const prices = selectedItemForPrice?.prices;
                if (!prices) return;
                if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedPriceIndex(prev => (prev + 1) % prices.length); } 
                else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedPriceIndex(prev => (prev - 1 + prices.length) % prices.length); } 
                else if (e.key === 'Enter') { e.preventDefault(); if (focusedPriceIndex >= 0 && selectedItemForPrice) addToCart(selectedItemForPrice, prices[focusedPriceIndex]); }
                else if (e.key === 'Escape') { e.preventDefault(); resetSearch(); }
            };
            window.addEventListener('keydown', handleModalKeyDown);
            return () => window.removeEventListener('keydown', handleModalKeyDown);
        }
    }, [showPriceModal, selectedItemForPrice, focusedPriceIndex, addToCart, resetSearch]);

    useEffect(() => {
        if (itemToFocusQty) {
            const input = qtyInputRefs.current[itemToFocusQty];
            if (input) { input.focus(); input.select(); }
            setItemToFocusQty(null);
        }
    }, [itemToFocusQty]);

    const handleChangeUnit = useCallback((item: CartItem, newPriceTier: PriceTier) => {
        const itemKey = `${item.id}-${newPriceTier.name}`;
        setCart(prevCart => prevCart.map(ci => (ci.id === item.id && ci.priceTier.name === item.priceTier.name) ? { ...ci, priceTier: newPriceTier } : ci));
        setItemToFocusQty(itemKey);
        resetSearch();
    }, [setCart, resetSearch]);

    const updateQuantity = useCallback((itemId: string, priceTierName: string, delta: number) => {
        setCart(prevCart => {
            const item = prevCart.find(i => i.id === itemId && i.priceTier.name === priceTierName);
            if (!item) return prevCart;
    
            const newQuantity = item.quantity + delta;
            
            if (newQuantity <= 0) {
                setItemToDelete({ itemId, priceTierName });
                setShowDeleteConfirm(true);
                return prevCart; 
            }
            
            return prevCart.map(i => 
                i.id === itemId && i.priceTier.name === priceTierName 
                ? { ...i, quantity: newQuantity } 
                : i
            );
        });
    }, [setCart]);

    const confirmDeleteItem = useCallback(() => {
        if (!itemToDelete) return;
        setCart(prevCart => prevCart.filter(i => !(i.id === itemToDelete.itemId && i.priceTier.name === itemToDelete.priceTierName)));
        setItemToDelete(null);
    }, [itemToDelete, setCart]);

    const getPriceForCartItem = (cartItem: CartItem) => {
        const { priceTier, quantity } = cartItem;
        const sortedLevels = [...(priceTier.wholesaleLevels || [])].sort((a,b) => b.minQty - a.minQty);
        for(const level of sortedLevels) if(quantity >= level.minQty) return level.price;
        return priceTier.price;
    }

    const handleConfirmPayment = useCallback((paymentDetails: any) => {
        handleTransactionCompleteWrapper(paymentDetails);
        setShowPaymentModal(false);
    }, [handleTransactionCompleteWrapper]);

    return (
        <div className="flex flex-col lg:flex-row h-full gap-4">
            <div className="flex-grow flex flex-col gap-4">
                <div className="flex-shrink-0 bg-accent-light text-accent text-right p-6 rounded-xl shadow-lg">
                    <p className="text-sm font-bold opacity-80 tracking-widest">TOTAL</p>
                    <p className="text-5xl md:text-7xl font-bold tracking-tighter">Rp {total.toLocaleString('id-ID', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</p>
                </div>

                <div className="flex-grow bg-secondary text-primary p-4 md:p-6 rounded-xl shadow-md flex flex-col">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                        <div className="flex items-center gap-3 self-start md:self-center">
                            <h2 className="text-xl md:text-2xl font-bold">Keranjang</h2>
                            <div title="Ready to Scan" className="flex items-center gap-1.5 text-secondary">
                                {ICONS.barcode}
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            </div>
                        </div>
                        <div className="w-full md:w-1/3">
                            <select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} className="w-full">
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex-grow overflow-y-auto pr-2">
                        {cart.length === 0 ? <EmptyState title="Keranjang Kosong" message="Cari atau scan barang untuk memulai transaksi." /> : (
                            <div className="space-y-3">
                                {cart.map((item, index) => {
                                    const currentPrice = getPriceForCartItem(item);
                                    const itemKey = `${item.id}-${item.priceTier.name}`;
                                    return (
                                    <div key={itemKey} ref={el => { cartItemRefs.current[itemKey] = el; }} className={`p-3 rounded-lg flex items-center justify-between transition-colors ${focusedCartIndex === index ? 'accent-bg-light' : 'bg-tertiary'}`}>
                                        <div className="flex-1">
                                            <p className="font-bold">{item.name}</p>
                                            <p className="text-sm text-secondary">{item.priceTier.name} @ Rp {currentPrice.toLocaleString('id-ID')}</p>
                                        </div>
                                        <div className="flex items-center gap-2 mx-4">
                                            <button onClick={() => updateQuantity(item.id, item.priceTier.name, -1)} className="w-9 h-9 flex items-center justify-center bg-secondary rounded-full text-lg font-bold hover:bg-gray-200">-</button>
                                            <input 
                                                ref={el => { qtyInputRefs.current[itemKey] = el; }} type="number" value={item.quantity} 
                                                onChange={(e) => {
                                                    const newQuantity = parseInt(e.target.value, 10);
                                                    if (!isNaN(newQuantity)) {
                                                        const delta = newQuantity - item.quantity;
                                                        updateQuantity(item.id, item.priceTier.name, delta);
                                                    }
                                                }}
                                                onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); setIsSearching(true); }}}
                                                className="w-16 text-center text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-0"
                                            />
                                            <button onClick={() => updateQuantity(item.id, item.priceTier.name, 1)} className="w-9 h-9 flex items-center justify-center bg-secondary rounded-full text-lg font-bold hover:bg-gray-200">+</button>
                                        </div>
                                        <div className="font-semibold text-lg text-right w-32">Rp {(currentPrice * item.quantity).toLocaleString('id-ID')}</div>
                                    </div>
                                )})}
                            </div>
                        )}
                    </div>
                    <div className="mt-4">
                        {!isSearching ? (
                            <button onClick={() => setIsSearching(true)} className="w-full text-left p-4 accent-color border-2 border-dashed hover:bg-tertiary transition rounded-lg text-lg font-semibold">
                                + Tambah Barang (Ketik untuk mencari...)
                            </button>
                        ) : (
                            <div className="p-2 relative">
                                <input ref={searchInputRef} type="text" placeholder="Ketik nama, kode barang..." value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); setFocusedSearchIndex(0);}} className="w-full p-3 text-lg border-2 border-accent rounded-lg focus:outline-none bg-secondary"/>
                                {searchTerm && (
                                    <div className="absolute left-0 right-0 bottom-full mb-1 bg-secondary border border-default shadow-lg z-20 max-h-60 overflow-y-auto rounded-lg">
                                        {filteredItems.length > 0 ? (
                                            filteredItems.map((item, index) => (
                                                <div key={item.id} onClick={() => handleItemClick(item)} className={`p-4 cursor-pointer hover:bg-tertiary ${index === focusedSearchIndex ? 'accent-bg-light' : ''}`}>
                                                    <p className="font-semibold text-lg">{item.name}</p>
                                                    <p className="text-md text-secondary">{item.itemCode}</p>
                                                </div>
                                            ))
                                        ) : (<div className="p-4 text-secondary">Barang tidak ditemukan.</div>)}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="flex-shrink-0 lg:w-1/3 xl:w-1/4 bg-secondary text-primary p-6 rounded-xl shadow-md flex flex-col justify-between">
                 <div>
                     <div className="space-y-4">
                        <div className="flex justify-between items-center text-lg">
                            <span className="text-secondary">Potongan (Rp)</span> 
                            <input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} className="w-1/2 p-2 rounded-md text-right font-semibold"/> 
                        </div>
                        <div className="flex justify-between items-center text-lg">
                            <span className="text-secondary">Biaya Lain (Rp)</span> 
                            <input type="number" value={otherFees} onChange={e => setOtherFees(Number(e.target.value))} className="w-1/2 p-2 rounded-md text-right font-semibold"/>
                        </div>
                     </div>
                     <div className="space-y-2 text-right mt-6 border-t border-default pt-6">
                         <div className="flex justify-between text-secondary text-lg"><span>Subtotal</span><span>Rp {subtotal.toLocaleString('id-ID')}</span></div>
                         <div className="flex justify-between text-secondary text-lg"><span>PPN ({settings.taxRate || 11}%)</span><span>Rp {tax.toLocaleString('id-ID', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span></div>
                         <div className="flex justify-between font-bold text-2xl md:text-4xl accent-color mt-4"><span>Total</span><span>Rp {total.toLocaleString('id-ID', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span></div>
                     </div>
                 </div>
                 <div className="mt-6 grid grid-cols-2 gap-3">
                     <button onClick={handleHoldTransaction} className="w-full bg-yellow-500 text-white font-bold py-4 text-xl rounded-lg hover:bg-yellow-600 transition-colors disabled:bg-gray-400" disabled={cart.length === 0}>
                        Tahan
                    </button>
                     <button onClick={() => setShowPaymentModal(true)} className="w-full accent-bg accent-text font-bold py-4 text-xl rounded-lg accent-bg-hover transition-colors disabled:bg-gray-400" disabled={cart.length === 0}>
                        Bayar (F10)
                    </button>
                 </div>
            </div>

            <Modal show={showPriceModal || !!itemToEditUnit} onClose={resetSearch} title={`Pilih Satuan untuk ${itemToEditUnit?.item.name || selectedItemForPrice?.name}`}>
                <div className="flex flex-col space-y-3">
                    {(itemToEditUnit?.item.prices || selectedItemForPrice?.prices)?.map((price, index) => (
                         <button key={index} onClick={() => itemToEditUnit ? handleChangeUnit(itemToEditUnit.item, price) : addToCart(selectedItemForPrice!, price)} className={`text-left w-full p-4 bg-tertiary rounded-lg hover:accent-bg-light hover:shadow transition ${index === focusedPriceIndex ? 'accent-bg-light ring-2 ring-accent' : ''}`}>
                             <div className="flex justify-between items-center"><p className="font-semibold text-primary text-lg">{price.name}</p><p className="text-md text-secondary">Stok: {price.stock}</p></div>
                             <p className="accent-color font-bold text-xl">Rp {price.price.toLocaleString('id-ID')}</p>
                         </button>
                    ))}
                </div>
            </Modal>
            
            <ConfirmationModal show={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={confirmDeleteItem} title="Hapus Item" message="Yakin ingin menghapus item ini dari keranjang?" />
            {showPaymentModal && <PaymentModal show={showPaymentModal} onClose={() => setShowPaymentModal(false)} total={total} onConfirm={handleConfirmPayment} selectedCustomerId={selectedCustomerId} customers={customers} banks={banks}/>}
        </div>
    );
};

export default CashierPage;