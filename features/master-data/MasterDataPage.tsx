import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useSettings } from '../../context/SettingsContext';
import { useSession } from '../../context/SessionContext';
import { GenericMasterComponent } from './components/GenericMasterComponent';
import { ItemForm } from './components/ItemForm';
import { StockInModal } from './components/StockInModal';
import { CustomerHistoryModal } from './components/CustomerHistoryModal';
import { StockOpnameModal } from './components/StockOpnameModal';
import { PayDebtModal } from './components/PayDebtModal'; // Import the new modal
import type { Item, Customer, PriceTier } from '../../types';

const MasterDataPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('Item');
    const [stockInItem, setStockInItem] = useState<Item | null>(null);
    const [opnameItem, setOpnameItem] = useState<Item | null>(null);
    const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
    const [payingDebtCustomer, setPayingDebtCustomer] = useState<Customer | null>(null); // State for the new modal
    
    const { settings } = useSettings();
    const { transactions, activeShift, handlePayDebt } = useSession();
    const { 
        items, satuans, customers, jenises, mereks, banks, expenseCategories,
        handleMasterDataSave, handleMasterDataDelete, handleStockIn, handleStockOpname 
    } = useData();
    
    const tabs = ['Item', 'Pelanggan', 'Satuan', 'Jenis', 'Merek', 'Bank', 'Kategori Biaya'];

    const renderContent = () => {
        const commonProps = {
            onSave: (formData: any, id?: string) => handleMasterDataSave(activeTab, formData, id),
            onDelete: (id: string) => handleMasterDataDelete(activeTab, id),
        };

        const lowStockThreshold = settings.lowStockThreshold || 5;

        switch (activeTab) {
            case 'Item': return <GenericMasterComponent 
                {...commonProps}
                collectionName="Item" data={items} fields={['name', 'itemCode', 'jenis', 'merek']}
                rowClassName={(item: Item) => {
                    const isLowStock = item.prices.some(p => p.stock <= lowStockThreshold);
                    return isLowStock ? 'bg-yellow-100/50 hover:bg-yellow-200/50' : '';
                }}
                customCellRender={{
                    'Modal': (item: Item) => (
                        <div className="font-semibold">
                            Rp {item.hargaModal.toLocaleString('id-ID')}
                            <span className="text-xs text-secondary font-normal"> / {item.satuanModal}</span>
                        </div>
                    ),
                    'Stok': (item: Item) => <div className="text-sm">{item.prices?.map((p: PriceTier) => <div key={p.name}>{`${p.stock} ${p.name}`}</div>)}</div>,
                    'Terjual': (item: Item) => {
                        const soldByUnit: { [key: string]: number } = {};
                        transactions
                            .filter(t => t.status !== 'pending')
                            .flatMap(t => t.items)
                            .filter(tItem => tItem.id === item.id)
                            .forEach(tItem => {
                                const unitName = tItem.priceTier.name;
                                soldByUnit[unitName] = (soldByUnit[unitName] || 0) + tItem.quantity;
                            });

                        if (!item.prices || item.prices.length === 0) {
                            return <span>-</span>;
                        }
                        
                        return (
                            <div>
                                {item.prices.map(priceTier => {
                                    const soldQuantity = soldByUnit[priceTier.name] || 0;
                                    return (
                                        <div key={priceTier.name} className="font-semibold">
                                            {soldQuantity}
                                            <span className="text-xs text-secondary font-normal"> {priceTier.name}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    },
                    'Harga & Keuntungan': (item: Item) => (
                        <div className="text-xs space-y-1">
                            {item.prices?.map((p: PriceTier) => {
                                const costPerUnit = (p.konversi > 0 && item.hargaModal > 0) ? (item.hargaModal / p.konversi) : 0;
                                const profit = p.price - costPerUnit;
                                return (
                                    <div key={p.name} className="p-2 bg-tertiary rounded-md min-w-[200px]">
                                        <div className="flex justify-between items-center"><span className="font-bold text-sm">{p.name}</span><span className="font-semibold text-primary">Jual: Rp {p.price.toLocaleString('id-ID')}</span></div>
                                        <div className="flex justify-between items-center text-secondary text-[11px] mt-1"><span>Modal: Rp {costPerUnit.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</span><span className={profit >= 0 ? 'font-semibold text-green-600' : 'font-semibold text-red-600'}>Profit: Rp {profit.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</span></div>
                                    </div>
                                )
                            })}
                        </div>
                    )
                }}
                customActions={(item) => (
                    <>
                        <button onClick={() => setStockInItem(item)} className="text-green-600 hover:text-green-800" title="Stok Masuk">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                        </button>
                        <button onClick={() => setOpnameItem(item)} className="text-blue-600 hover:text-blue-800" title="Stok Opname">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6"/><path d="M12 9v6"/></svg>
                        </button>
                    </>
                )}
                customFormComponent={ItemForm} satuanList={satuans} jenisList={jenises} merekList={mereks}
                />;
            case 'Pelanggan': return <GenericMasterComponent 
                {...commonProps}
                collectionName="Pelanggan" data={customers} fields={['name', 'phone']}
                customCellRender={{ 'Hutang': (item) => <span className="font-semibold text-red-600">Rp {(item.hutang || 0).toLocaleString('id-ID')}</span> }}
                customActions={(item) => (
                    <>
                        {item.hutang > 0 && (
                             <button onClick={() => setPayingDebtCustomer(item)} className="text-green-600 hover:text-green-800" title="Bayar Hutang">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4"/><path d="M22 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5"/><path d="M12 16.5V22"/><path d="M12 2v1.5"/></svg>
                            </button>
                        )}
                        <button onClick={() => setHistoryCustomer(item)} className="text-purple-600 hover:text-purple-800" title="Riwayat Transaksi">
                           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg>
                        </button>
                    </>
                )}
                />;
            case 'Satuan': return <GenericMasterComponent {...commonProps} collectionName="Satuan" data={satuans} fields={['name']} />;
            case 'Jenis': return <GenericMasterComponent {...commonProps} collectionName="Jenis" data={jenises} fields={['name']} />;
            case 'Merek': return <GenericMasterComponent {...commonProps} collectionName="Merek" data={mereks} fields={['name']} />;
            case 'Bank': return <GenericMasterComponent {...commonProps} collectionName="Bank" data={banks} fields={['name']} />;
            case 'Kategori Biaya': return <GenericMasterComponent {...commonProps} collectionName="Kategori Biaya" data={expenseCategories} fields={['name']} />;
            default: return null;
        }
    };
    
    return (
        <div className="text-primary">
            <h2 className="text-3xl font-bold mb-6">Master Data</h2>
            <div className="overflow-x-auto">
                <div className="flex border-b border-default mb-6 min-w-max">
                    {tabs.map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`py-3 px-5 text-md font-medium transition-colors whitespace-nowrap ${activeTab === tab ? 'border-b-2 border-accent accent-color font-semibold' : 'text-secondary hover:text-primary'}`}>
                            {tab}
                        </button>
                    ))}
                </div>
            </div>
            <div>{renderContent()}</div>
            {stockInItem && <StockInModal item={stockInItem} onClose={() => setStockInItem(null)} onSave={handleStockIn} />}
            {opnameItem && <StockOpnameModal item={opnameItem} onClose={() => setOpnameItem(null)} onSave={handleStockOpname} />}
            {historyCustomer && <CustomerHistoryModal customer={historyCustomer} transactions={transactions} onClose={() => setHistoryCustomer(null)} />}
            {payingDebtCustomer && <PayDebtModal customer={payingDebtCustomer} onClose={() => setPayingDebtCustomer(null)} onConfirm={(amount) => handlePayDebt(payingDebtCustomer.id, amount, activeShift!.id)} />}
        </div>
    );
};

export default MasterDataPage;