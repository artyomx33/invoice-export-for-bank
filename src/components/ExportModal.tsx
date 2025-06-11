import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileCode, FileText, Database } from 'lucide-react';
import { ExportFormat } from '../types/Invoice'; // Assuming types are in ../types/Invoice.ts

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat) => void; // Parent handles the actual export logic
  selectedInvoiceCount: number;
}

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  selectedInvoiceCount,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose} // Close on overlay click
        >
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md"
            initial={{ scale: 0.9, y: -20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: -20, opacity: 0 }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Export Selected Invoices</h3>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                <X size={20} />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              You have selected {selectedInvoiceCount} invoice(s). Choose an export format:
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => onExport(ExportFormat.SEPA_XML)}
                className="w-full flex items-center justify-center px-4 py-2.5 text-sm rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                <FileCode size={18} className="mr-2" /> Export SEPA XML
              </button>
              <button
                onClick={() => onExport(ExportFormat.CSV)}
                className="w-full flex items-center justify-center px-4 py-2.5 text-sm rounded-md bg-green-500 text-white hover:bg-green-600 transition-colors"
              >
                <FileText size={18} className="mr-2" /> Export CSV
              </button>
              <button
                onClick={() => onExport(ExportFormat.JSON)}
                className="w-full flex items-center justify-center px-4 py-2.5 text-sm rounded-md bg-purple-500 text-white hover:bg-purple-600 transition-colors"
              >
                <Database size={18} className="mr-2" /> Export JSON
              </button>
            </div>
            
            <button
              onClick={onClose}
              className="mt-6 w-full px-4 py-2 text-sm rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border dark:border-gray-600 transition-colors"
            >
              Cancel
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ExportModal;
