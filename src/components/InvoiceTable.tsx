import React, { useState, useMemo } from 'react';
import { Invoice, InvoiceStatus, UrgencyLevel } from '../types/Invoice';
import { format, differenceInDays } from 'date-fns';
import { Edit, Trash2, PackageSearch, ChevronUp, ChevronDown, AlertTriangle } from 'lucide-react';
import { PAYING_COMPANIES } from '../contexts/AppContext';

interface InvoiceTableProps {
  invoices: Invoice[];
  selectedInvoices: string[];
  onSelectInvoice: (invoiceId: string) => void;
  onSelectAllInvoices: () => void;
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoiceId: string) => void;
  isLoading?: boolean;
}

type SortField = 'factuurNumber' | 'ibanName' | 'amount' | 'status' | 'dueDate' | 'urgency' | 'payingCompany';
type SortDirection = 'asc' | 'desc';

const InvoiceTable: React.FC<InvoiceTableProps> = ({
  invoices,
  selectedInvoices,
  onSelectInvoice,
  onSelectAllInvoices,
  onEdit,
  onDelete,
  isLoading
}) => {
  const [sortField, setSortField] = useState<SortField>('dueDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Calculate urgency based on due date
  const calculateUrgency = (invoice: Invoice): UrgencyLevel => {
    if (!invoice.dueDate) return UrgencyLevel.LOW;
    
    const daysUntilDue = differenceInDays(new Date(invoice.dueDate), new Date());
    
    if (daysUntilDue < 0 || invoice.status === InvoiceStatus.OVERDUE) {
      return UrgencyLevel.HIGH;
    } else if (daysUntilDue <= 7) {
      return UrgencyLevel.HIGH;
    } else if (daysUntilDue <= 14) {
      return UrgencyLevel.MEDIUM;
    } else {
      return UrgencyLevel.LOW;
    }
  };

  // Sort invoices
  const sortedInvoices = useMemo(() => {
    return [...invoices].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'urgency':
          const urgencyOrder = { [UrgencyLevel.HIGH]: 0, [UrgencyLevel.MEDIUM]: 1, [UrgencyLevel.LOW]: 2 };
          aValue = urgencyOrder[calculateUrgency(a)];
          bValue = urgencyOrder[calculateUrgency(b)];
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'dueDate':
          aValue = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
          bValue = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
          break;
        case 'payingCompany':
          aValue = a.payingCompany || 'teddy-kids';
          bValue = b.payingCompany || 'teddy-kids';
          break;
        default:
          aValue = a[sortField] || '';
          bValue = b[sortField] || '';
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [invoices, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="inline-block ml-1" size={14} /> : 
      <ChevronDown className="inline-block ml-1" size={14} />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <PackageSearch size={48} className="mx-auto mb-2 animate-pulse" />
        <p>Loading invoices...</p>
      </div>
    );
  }
  
  if (invoices.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500 dark:text-gray-400">
        <PackageSearch size={48} className="mx-auto mb-2" />
        No invoices found. Try adjusting your search or creating a new invoice.
      </div>
    );
  }

  const allDisplayedSelected = invoices.length > 0 && selectedInvoices.length === invoices.length;

  return (
    <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th scope="col" className="p-3 text-left w-10">
              <input
                type="checkbox"
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                checked={allDisplayedSelected}
                onChange={onSelectAllInvoices}
                disabled={invoices.length === 0}
              />
            </th>
            <th
              scope="col"
              className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              onClick={() => handleSort('factuurNumber')}
            >
              Factuur # <SortIcon field="factuurNumber" />
            </th>
            <th
              scope="col"
              className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              onClick={() => handleSort('ibanName')}
            >
              Recipient <SortIcon field="ibanName" />
            </th>
            <th
              scope="col"
              className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              IBAN
            </th>
            <th
              scope="col"
              className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              onClick={() => handleSort('payingCompany')}
            >
              Company <SortIcon field="payingCompany" />
            </th>
            <th
              scope="col"
              className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              onClick={() => handleSort('amount')}
            >
              Amount (€) <SortIcon field="amount" />
            </th>
            <th
              scope="col"
              className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Klantnummer
            </th>
            <th
              scope="col"
              className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              onClick={() => handleSort('urgency')}
            >
              Urgency <SortIcon field="urgency" />
            </th>
            <th
              scope="col"
              className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              onClick={() => handleSort('status')}
            >
              Status <SortIcon field="status" />
            </th>
            <th
              scope="col"
              className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              onClick={() => handleSort('dueDate')}
            >
              Due Date <SortIcon field="dueDate" />
            </th>
            <th
              scope="col"
              className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {sortedInvoices.map((invoice) => {
            const urgency = calculateUrgency(invoice);
            return (
              <tr
                key={invoice.id}
                className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                  selectedInvoices.includes(invoice.id) ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                }`}
              >
                <td className="p-3">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    checked={selectedInvoices.includes(invoice.id)}
                    onChange={() => onSelectInvoice(invoice.id)}
                  />
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{invoice.factuurNumber}</td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{invoice.ibanName}</td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{invoice.ibanNumber}</td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {PAYING_COMPANIES.find(c => c.id === (invoice.payingCompany || 'teddy-kids'))?.name || 'Teddy Kids'}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">€{invoice.amount.toFixed(2)}</td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{invoice.klantnummer}</td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <span
                    className={`px-2 py-0.5 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${
                      urgency === UrgencyLevel.HIGH ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' :
                      urgency === UrgencyLevel.MEDIUM ? 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100' :
                      'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                    }`}
                  >
                    {urgency === UrgencyLevel.HIGH && <AlertTriangle size={12} className="mr-1" />}
                    {urgency.toUpperCase()}
                  </span>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <span
                    className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      invoice.status === InvoiceStatus.PAID ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' :
                      invoice.status === InvoiceStatus.PENDING ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' :
                      invoice.status === InvoiceStatus.OVERDUE ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' :
                      invoice.status === InvoiceStatus.EXPORTED ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' :
                      invoice.status === InvoiceStatus.CANCELLED ? 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-100'
                    }`}
                  >
                    {invoice.status}
                  </span>
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM d, yyyy') : '-'}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm font-medium">
                  <button onClick={() => onEdit(invoice)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-2">
                    <Edit size={16}/>
                  </button>
                  <button onClick={() => onDelete(invoice.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                    <Trash2 size={16}/>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default InvoiceTable;
