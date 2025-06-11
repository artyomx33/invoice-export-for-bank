import React from 'react';
import { CreditCard, Plus, Download } from 'lucide-react'; // Essential icons

interface WelcomeProps {
  onNewInvoice: () => void;
  onImportInvoices?: () => void; // Optional, if import functionality is implemented
  appName?: string;
  appVersion?: string;
  appSubtitle?: string;
}

const Welcome: React.FC<WelcomeProps> = ({
  onNewInvoice,
  onImportInvoices,
  appName = "Invoice Manager", // Default app name
  appVersion = "v0.1.0", // Default version
  appSubtitle = "Your AI-powered assistant for seamless invoice management." // Default subtitle
}) => {
  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-6">
          <CreditCard className="h-8 w-8 text-blue-600 dark:text-blue-300" />
        </div>
        <h1 className="text-4xl font-bold mb-2">{appName}</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-md">
          {appSubtitle}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
          <button
            onClick={onNewInvoice}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors flex flex-col items-center text-center"
          >
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-2">
              <Plus className="h-5 w-5 text-green-600 dark:text-green-300" />
            </div>
            <h3 className="font-medium">Create New Invoice</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manually enter invoice details.</p>
          </button>
          
          {onImportInvoices && (
            <button
              onClick={onImportInvoices}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors flex flex-col items-center text-center"
            >
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-2">
                <Download className="h-5 w-5 text-purple-600 dark:text-purple-300" />
              </div>
              <h3 className="font-medium">Import Invoices</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Upload CSV or JSON files.</p>
            </button>
          )}
        </div>
        
        <div className="mt-12 text-sm text-gray-500 dark:text-gray-400">
          {appName} {appVersion} • Built with Tauri & React
        </div>
      </div>
    </div>
  );
};

export default Welcome;
