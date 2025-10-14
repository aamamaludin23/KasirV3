
import React, { useState, useEffect } from 'react';

interface GenericFormProps {
    initialData: any | null;
    onSave: (formData: any) => void;
    onCancel: () => void;
    fields: string[];
}

export const GenericForm: React.FC<GenericFormProps> = ({ initialData, onSave, onCancel, fields }) => {
    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        const data = fields.reduce((acc, field) => {
            acc[field] = initialData?.[field] || '';
            return acc;
        }, {} as any);
        setFormData(data);
    }, [initialData, fields]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="text-primary">
            {fields.map(field => (
                <div key={field} className="mb-4">
                    <label className="block text-sm font-bold mb-2 capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
                    <input
                        type="text"
                        name={field}
                        value={formData[field] || ''}
                        onChange={handleChange}
                        className="w-full"
                    />
                </div>
            ))}
            <div className="flex justify-end mt-6 gap-3">
                <button type="button" onClick={onCancel} className="bg-tertiary text-primary font-bold py-3 px-5 rounded-lg hover:bg-gray-300">Batal</button>
                <button type="submit" className="accent-bg accent-text font-bold py-3 px-5 rounded-lg accent-bg-hover">Simpan</button>
            </div>
        </form>
    );
};