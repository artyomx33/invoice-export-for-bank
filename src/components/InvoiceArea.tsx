import React, { useState, useEffect, useRef, useContext, FormEvent, useMemo } from 'react';
import { AppContext, PAYING_COMPANIES } from '../contexts/AppContext';
import { Invoice, InvoiceStatus, ExportFormat, PayingCompany } from '../types/Invoice';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle,
  Download,
  Filter,
  PackageSearch,
  Plus,
  RefreshCw,
  Search,
  Send,
  CreditCard, // For Welcome screen icon
  FileText, // Tab icon for unpaid
  Receipt // Tab icon for paid
} from 'lucide-react';

// Import newly created child components
import InvoiceForm from './InvoiceForm';
import InvoiceTable from './InvoiceTable';
import ExportModal from './ExportModal';
import Welcome from './Welcome';

const InvoiceArea: React.FC = () => {
  const {
    unpaidInvoices,
    paidInvoices,
    payingCompanies,
    createNewInvoice,
    updateInvoice,
    deleteInvoice,
    searchInvoices,
    exportInvoices,
    markInvoiceAsPaid,
    processInvoiceNLPCommand,
    // settings, // Potentially needed for default values if not handled in forms
  } = useContext(AppContext);

  // Local state
  const [activeTab, setActiveTab] = useState<'unpaid' | 'paid'>('unpaid');
  const [activeCompanyFilter, setActiveCompanyFilter] = useState<PayingCompany | 'all'>('all');
  const [nlpInput, setNlpInput] = useState('');
  const [isSubmittingNLP, setIsSubmittingNLP] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Partial<Invoice> | null>(null);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false); // Placeholder for filter UI
  // const [activeFilters, setActiveFilters] = useState<any>({}); // Define proper filter type later
  const [showExportModal, setShowExportModal] = useState(false);
  const [nlpError, setNlpError] = useState<string | null>(null);

  const nlpInputRef = useRef<HTMLTextAreaElement>(null);

  // Get the appropriate invoices based on active tab, company filter, and search term
  const displayedInvoices = useMemo(() => {
    let invoices = activeTab === 'unpaid' ? unpaidInvoices : paidInvoices;
    
    // Filter by company if not 'all'
    if (activeCompanyFilter !== 'all') {
      invoices = invoices.filter(inv => inv.payingCompany === activeCompanyFilter);
    }
    
    // Apply search if there's a search term
    if (searchTerm) {
      return searchInvoices(searchTerm).filter(inv => 
        invoices.some(i => i.id === inv.id)
      );
    }
    
    return invoices;
  }, [activeTab, activeCompanyFilter, searchTerm, unpaidInvoices, paidInvoices, searchInvoices]);

  useEffect(() => {
    if (nlpInputRef.current) {
      nlpInputRef.current.style.height = 'auto';
      nlpInputRef.current.style.height = `${Math.min(nlpInputRef.current.scrollHeight, 150)}px`; // Max height for NLP input
    }
  }, [nlpInput]);

  // Reset selected invoices when changing tabs
  useEffect(() => {
    setSelectedInvoices([]);
  }, [activeTab]);

  const handleNLPInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNlpInput(e.target.value);
  };

  const handleNLPSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!nlpInput.trim()) return;

    setIsSubmittingNLP(true);
    setNlpError(null);
    try {
      const result = await processInvoiceNLPCommand(nlpInput);
      if (result.error) {
        setNlpError(result.error);
      } else {
        if (result.command === 'create' && result.invoiceData) {
          createNewInvoice(result.invoiceData);
        } else if (result.command === 'update' && result.invoiceData?.id && result.invoiceData.status === InvoiceStatus.PAID) {
          markInvoiceAsPaid(result.invoiceData.id);
        }
        setNlpInput(''); 
      }
    } catch (error: any) {
      setNlpError(error.message || 'Failed to process command');
    } finally {
      setIsSubmittingNLP(false);
    }
  };
  
  const handleNLPKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleNLPSubmit();
    }
  };

  const handleSelectInvoice = (invoiceId: string) => {
    setSelectedInvoices(prev =>
      prev.includes(invoiceId)
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const handleSelectAllInvoices = () => {
    if (selectedInvoices.length === displayedInvoices.length && displayedInvoices.length > 0) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(displayedInvoices.map(inv => inv.id));
    }
  };

  const openNewInvoiceForm = () => {
    setEditingInvoice({}); // Initialize with empty object
    setShowInvoiceForm(true);
  };

  const openEditInvoiceForm = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setShowInvoiceForm(true);
  };

  const handleInvoiceFormSubmit = (invoiceData: Partial<Invoice>) => {
    if (editingInvoice && editingInvoice.id) { 
      updateInvoice({ ...editingInvoice, ...invoiceData, updatedAt: new Date() } as Invoice);
    } else { 
      createNewInvoice(invoiceData);
    }
    setShowInvoiceForm(false);
    setEditingInvoice(null);
  };
  
  const handleBulkMarkAsPaid = () => {
    selectedInvoices.forEach(id => markInvoiceAsPaid(id));
    setSelectedInvoices([]); 
  };

  const handleBulkExport = async (format: ExportFormat) => {
    if (selectedInvoices.length === 0) return;
    try {
      const fileContent = await exportInvoices(selectedInvoices, format);
      const blob = new Blob([fileContent], { 
        type: format === ExportFormat.SEPA_XML ? 'application/xml' : (format === ExportFormat.CSV ? 'text/csv' : 'application/json') 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoices_export_${format}_${new Date().toISOString().slice(0,10)}.${format === ExportFormat.SEPA_XML ? 'xml' : format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSelectedInvoices([]); 
    } catch (error) {
      console.error("Export failed:", error);
      setNlpError("Failed to export invoices. Please try again.");
    }
    setShowExportModal(false);
  };

  // Remove the Welcome screen logic so the invoice table is always shown
  // Previously showed Welcome screen when no invoices exist

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Header with Search and Actions */}
      <div className="p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Invoices</h2>
          <div className="flex items-center space-x-2">
            <button 
              onClick={openNewInvoiceForm}
              className="px-3 py-1.5 text-sm rounded-md bg-blue-500 text-white hover:bg-blue-600 flex items-center"
            >
              <Plus size={16} className="mr-1" /> New Invoice
            </button>
            <button 
              onClick={() => setShowFilters(!showFilters)} 
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
              title="Filters"
            >
              <Filter size={18} />
            </button>
          </div>
        </div>

        {/* Company Filter Tabs */}
        <div className="mt-3 flex space-x-2 overflow-x-auto">
          <button
            onClick={() => setActiveCompanyFilter('all')}
            className={`px-3 py-1.5 text-sm rounded-md whitespace-nowrap ${
              activeCompanyFilter === 'all'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            All ({unpaidInvoices.length + paidInvoices.length})
          </button>
          {payingCompanies.map(company => {
            const count = [...unpaidInvoices, ...paidInvoices].filter(
              inv => inv.payingCompany === company.id
            ).length;
            return (
              <button
                key={company.id}
                onClick={() => setActiveCompanyFilter(company.id)}
                className={`px-3 py-1.5 text-sm rounded-md whitespace-nowrap ${
                  activeCompanyFilter === company.id
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {company.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Tab Navigation */}
        <div className="mt-3 border-b dark:border-gray-700">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('unpaid')}
              className={`pb-2 px-1 flex items-center space-x-2 ${
                activeTab === 'unpaid'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 dark:border-blue-400 font-medium'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <FileText size={16} />
              <span>Unpaid</span>
              <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-full px-2 py-0.5">
                {unpaidInvoices.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('paid')}
              className={`pb-2 px-1 flex items-center space-x-2 ${
                activeTab === 'paid'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 dark:border-blue-400 font-medium'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Receipt size={16} />
              <span>Paid</span>
              <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-full px-2 py-0.5">
                {paidInvoices.length}
              </span>
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-center space-x-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search invoices (e.g., Factuur #, Name, IBAN)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-md bg-gray-100 dark:bg-gray-700 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
          </div>
          {selectedInvoices.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">{selectedInvoices.length} selected</span>
              {activeTab === 'unpaid' && (
                <button
                  onClick={handleBulkMarkAsPaid}
                  className="px-4 py-2 text-sm rounded-md bg-green-600 text-white hover:bg-green-700 flex items-center font-medium shadow-md"
                >
                  <CreditCard size={16} className="mr-1.5" /> PAY
                </button>
              )}
              <button
                onClick={() => setShowExportModal(true)}
                className="px-3 py-1.5 text-sm rounded-md bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 flex items-center"
              >
                <Download size={16} className="mr-1" /> Export
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Table Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <InvoiceTable
          invoices={displayedInvoices}
          selectedInvoices={selectedInvoices}
          onSelectInvoice={handleSelectInvoice}
          onSelectAllInvoices={handleSelectAllInvoices}
          onEdit={openEditInvoiceForm}
          onDelete={deleteInvoice}
        />
      </div>

      {/* NLP Command Input Area */}
      <div className="border-t dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sticky bottom-0 z-10">
        <div className="max-w-3xl mx-auto">
          {nlpError && (
            <div className="mb-2 p-2 rounded-md bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm flex items-center">
              <AlertCircle size={16} className="mr-2 flex-shrink-0" /> {nlpError}
            </div>
          )}
          <form onSubmit={handleNLPSubmit} className="relative">
            <div className="flex items-end rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-sm">
              <textarea
                ref={nlpInputRef}
                value={nlpInput}
                onChange={handleNLPInputChange}
                onKeyDown={handleNLPKeyPress}
                placeholder="Type a command (e.g., 'Add invoice for John Doe 100 EUR IBAN XX...' or 'Mark invoice INV-001 as paid')"
                className="w-full p-3 pr-10 rounded-lg bg-transparent resize-none focus:outline-none max-h-[150px] min-h-[56px] text-sm"
                rows={1}
                disabled={isSubmittingNLP}
              />
              <button
                type="submit"
                className={`p-3 ${
                  nlpInput.trim() === ''
                    ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300'
                }`}
                disabled={isSubmittingNLP || nlpInput.trim() === ''}
              >
                {isSubmittingNLP ? <RefreshCw size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Invoice Form Modal */}
      <AnimatePresence>
        {showInvoiceForm && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowInvoiceForm(false); setEditingInvoice(null); }}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: -20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <InvoiceForm
                initialData={editingInvoice || {}}
                onSubmit={handleInvoiceFormSubmit}
                onCancel={() => { setShowInvoiceForm(false); setEditingInvoice(null); }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleBulkExport}
        selectedInvoiceCount={selectedInvoices.length}
      />
    </div>
  );
};

export default InvoiceArea;
