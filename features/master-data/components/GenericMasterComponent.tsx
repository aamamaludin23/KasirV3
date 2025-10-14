
import React, { useState, useMemo } from 'react';
import { Modal } from '../../../components/Modal';
import { ConfirmationModal } from '../../../components/ConfirmationModal';
import { GenericForm } from './GenericForm';
import { ICONS } from '../../../constants';
import { EmptyState } from '../../../components/EmptyState';

interface GenericMasterComponentProps {
    collectionName: string;
    data: any[];
    fields: string[];
    onSave: (formData: any, id?: string) => void;
    onDelete: (id: string) => void;
    // FIX: Changed React.ElementType to React.ComponentType<any> as it's more specific and helps TypeScript.
    customFormComponent?: React.ComponentType<any>;
    customCellRender?: { [key: string]: (item: any) => React.ReactNode };
    customActions?: (item: any) => React.ReactNode;
    rowClassName?: (item: any) => string;
    [key: string]: any; // To pass other props to custom form component
}

const fieldDisplayNames: Record<string, string> = {
    name: "Nama",
    itemCode: "Kode Item",
    jenis: "Jenis",
    merek: "Merek",
    phone: "Telepon"
};

// FIX: Changed the function component definition from using React.FC to a standard function with typed props to resolve a type inference issue.
export const GenericMasterComponent = ({
    collectionName, data, fields, onSave, onDelete,
    // FIX: Aliased customFormComponent to a capitalized variable in destructuring.
    customFormComponent: CustomFormComponent,
    customCellRender, customActions, rowClassName, ...rest
}: GenericMasterComponentProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingData, setEditingData] = useState<any | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormDirty, setIsFormDirty] = useState(false);
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);

    const filteredData = useMemo(() => {
        if (!searchTerm) return data;
        const lowercasedTerm = searchTerm.toLowerCase();
        return data.filter(item =>
            fields.some(field =>
                item[field]?.toString().toLowerCase().includes(lowercasedTerm)
            )
        );
    }, [data, searchTerm, fields]);

    const handleOpenModal = (data: any | null = null) => {
        setEditingData(data);
        setIsModalOpen(true);
    };

    const handleCloseModal = (force = false) => {
        if (CustomFormComponent && isFormDirty && !force) {
            setShowCloseConfirm(true);
        } else {
            setIsModalOpen(false);
            setEditingData(null);
            setIsFormDirty(false); // Reset dirty state on close
        }
    };
    
    const confirmClose = () => {
        setShowCloseConfirm(false);
        handleCloseModal(true); // Force close
    };

    const abortClose = () => {
        setShowCloseConfirm(false);
    };

    const handleSave = (formData: any) => {
        onSave(formData, editingData?.id);
        setIsFormDirty(false); // Reset dirty state on save
        handleCloseModal(true); // Force close after save
    };

    const handleDelete = () => {
        if (deletingId) {
            onDelete(deletingId);
            setDeletingId(null);
        }
    };
    
    return (
        <div className="text-primary">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <input
                    type="text"
                    placeholder={`Cari ${collectionName}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-1/3"
                />
                <button onClick={() => handleOpenModal()} className="w-full md:w-auto accent-bg accent-text font-bold py-3 px-5 rounded-lg accent-bg-hover">
                    + Tambah {collectionName}
                </button>
            </div>
            
            <div className="bg-secondary rounded-xl shadow-md overflow-x-auto">
                {filteredData.length > 0 ? (
                    <table className="w-full text-left">
                        <thead className="border-b border-default">
                            <tr>
                                {fields.map(field => <th key={field} className="p-4 font-semibold text-secondary uppercase text-sm tracking-wider">{fieldDisplayNames[field] || field}</th>)}
                                {customCellRender && Object.keys(customCellRender).map(key => <th key={key} className="p-4 font-semibold text-secondary uppercase text-sm tracking-wider">{key}</th>)}
                                <th className="p-4 font-semibold text-secondary uppercase text-sm tracking-wider text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map(item => (
                                <tr key={item.id} className={`border-b border-default hover:bg-tertiary transition-colors ${rowClassName ? rowClassName(item) : ''}`}>
                                    {fields.map(field => <td key={field} className="p-4">{item[field]}</td>)}
                                    {customCellRender && Object.values(customCellRender).map((renderFunc, index) => <td key={index} className="p-4">{renderFunc(item)}</td>)}
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end items-center gap-4">
                                            {customActions && customActions(item)}
                                            <button onClick={() => handleOpenModal(item)} className="text-blue-600 hover:text-blue-800" title={`Edit ${collectionName}`}>{ICONS.edit}</button>
                                            <button onClick={() => setDeletingId(item.id)} className="text-red-500 hover:text-red-700" title={`Hapus ${collectionName}`}>{ICONS.trash}</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                     <EmptyState title={`Tidak Ada Data ${collectionName}`} message="Silakan tambahkan data baru untuk memulai."/>
                )}
            </div>

            {isModalOpen && (
                <Modal show={isModalOpen} onClose={() => handleCloseModal()} title={`${editingData ? 'Edit' : 'Tambah'} ${collectionName}`} size={CustomFormComponent ? '2xl' : 'lg'}>
                    {CustomFormComponent ? (
                        <CustomFormComponent
                            initialData={editingData}
                            onSave={handleSave}
                            onCancel={() => handleCloseModal()}
                            setIsDirty={setIsFormDirty}
                            allItems={data}
                            {...rest}
                        />
                    ) : (
                        <GenericForm
                            initialData={editingData}
                            onSave={handleSave}
                            onCancel={() => handleCloseModal()}
                            fields={fields}
                        />
                    )}
                </Modal>
            )}

            <ConfirmationModal
                show={!!deletingId}
                onClose={() => setDeletingId(null)}
                onConfirm={handleDelete}
                title={`Hapus ${collectionName}`}
                message={`Apakah Anda yakin ingin menghapus ${collectionName} ini? Tindakan ini tidak dapat diurungkan.`}
            />

            <ConfirmationModal
                show={showCloseConfirm}
                onClose={abortClose}
                onConfirm={confirmClose}
                title="Batalkan Perubahan?"
                message="Anda memiliki perubahan yang belum disimpan. Yakin ingin keluar?"
            />
        </div>
    );
};
