import React, { useState, useEffect, useContext, FormEvent } from 'react';
import { AppContext } from '../contexts/AppContext'; // Assuming AppContext provides settings
import { Invoice, InvoiceStatus, Currency, Client, PayingCompany } from '../types/Invoice';
import { format } from 'date-fns';

// InvoiceForm Component
interface InvoiceFormProps {
  initialData: Partial<Invoice>;
  onSubmit: (data: Partial<Invoice>) => void;
  onCancel: () => void;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Invoice>>(initialData);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const { settings, clients, payingCompanies } = useContext(AppContext);

  useEffect(() => {
    // Set initial form data, applying defaults for new invoices
    const defaults: Partial<Invoice> = {};
    if (!initialData.id) { // New invoice
      defaults.dueDate = new Date(Date.now() + settings.defaultDueDays * 24 * 60 * 60 * 1000);
      defaults.status = InvoiceStatus.PENDING;
      defaults.currency = Currency.EUR; // Always set to EUR
      defaults.payingCompany = PayingCompany.TEDDY_KIDS; // Default to Teddy Kids
    }
    setFormData({ ...defaults, ...initialData });
  }, [initialData, settings.defaultDueDays]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | number | Date | undefined = value;

    if (type === 'number') {
      processedValue = parseFloat(value);
      if (isNaN(processedValue as number)) { // Handle case where parseFloat results in NaN (e.g. empty string)
        processedValue = undefined; // Or 0, depending on desired behavior for empty number fields
      }
    } else if (type === 'date') {
      processedValue = value ? new Date(value) : undefined; // Ensure date is not created from empty string
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue,
    }));
  };

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value;
    
    if (clientId === "new") {
      // Reset client-related fields if "New client" is selected
      setSelectedClientId(null);
      setFormData(prev => ({
        ...prev,
        ibanName: '',
        ibanNumber: '',
        klantnummer: '',
      }));
    } else if (clientId) {
      // Find the selected client
      const selectedClient = clients.find(client => client.id === clientId);
      if (selectedClient) {
        // Auto-fill client data
        setSelectedClientId(clientId);
        setFormData(prev => ({
          ...prev,
          ibanName: selectedClient.ibanName,
          ibanNumber: selectedClient.ibanNumber,
          klantnummer: selectedClient.defaultKlantnummer || '',
        }));
      }
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const formFields = [
    { name: 'factuurNumber', label: 'Factuur Number', type: 'text', required: true },
    { name: 'ibanName', label: 'Recipient Name (IBAN Name)', type: 'text', required: true },
    { name: 'ibanNumber', label: 'IBAN Number', type: 'text', required: true },
    { name: 'amount', label: 'Amount', type: 'number', required: true, step: "0.01" },
    { name: 'klantnummer', label: 'Klantnummer/Reference', type: 'text', required: true },
    { name: 'dueDate', label: 'Due Date', type: 'date' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'status', label: 'Status', type: 'select', options: Object.values(InvoiceStatus), required: true },
    { name: 'category', label: 'Category ID', type: 'text' }, // Simple text input for category ID for now
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">{initialData.id ? 'Edit Invoice' : 'Create New Invoice'}</h2>
      
      {/* Client Selection Dropdown */}
      <div>
        <label htmlFor="clientSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Client
        </label>
        <select
          id="clientSelect"
          value={selectedClientId || ""}
          onChange={handleClientChange}
          className="w-full p-2 rounded-md bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select a client...</option>
          <option value="new">New client (manual entry)</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>
              {client.name} - {client.ibanName}
            </option>
          ))}
        </select>
      </div>

      {/* Paying Company Selection */}
      <div>
        <label htmlFor="payingCompany" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Paying Company <span className="text-red-500">*</span>
        </label>
        <select
          id="payingCompany"
          name="payingCompany"
          value={formData.payingCompany || PayingCompany.TEDDY_KIDS}
          onChange={handleChange}
          required
          className="w-full p-2 rounded-md bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
        >
          {payingCompanies.map(company => (
            <option key={company.id} value={company.id}>
              {company.fullName}
            </option>
          ))}
        </select>
      </div>

      {formFields.map(field => (
        <div key={field.name}>
          <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          {field.type === 'select' ? (
            <select
              name={field.name}
              id={field.name}
              value={(formData as any)[field.name] || ''}
              onChange={handleChange}
              required={field.required}
              className="w-full p-2 rounded-md bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
            >
              {field.options?.map(option => (
                <option key={String(option)} value={String(option)}>{String(option).toUpperCase()}</option>
              ))}
            </select>
          ) : field.type === 'textarea' ? (
            <textarea
              name={field.name}
              id={field.name}
              value={(formData as any)[field.name] || ''}
              onChange={handleChange}
              rows={3}
              className="w-full p-2 rounded-md bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
            />
          ) : (
            <input
              type={field.type}
              name={field.name}
              id={field.name}
              value={(formData as any)[field.name] !== undefined ? 
                     (field.type === 'date' && formData.dueDate ? format(new Date(formData.dueDate), 'yyyy-MM-dd') : (formData as any)[field.name]) 
                     : ''}
              onChange={handleChange}
              required={field.required}
              step={field.step}
              className="w-full p-2 rounded-md bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
            />
          )}
        </div>
      ))}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border dark:border-gray-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm rounded-md bg-blue-500 text-white hover:bg-blue-600"
        >
          {initialData.id ? 'Save Changes' : 'Create Invoice'}
        </button>
      </div>
    </form>
  );
};

export default InvoiceForm;
