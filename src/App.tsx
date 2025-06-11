import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useHotkeys } from 'react-hotkeys-hook';
import { MessageSquare, FileText, Settings as SettingsIcon } from 'lucide-react';

import { AppContext, AppContextType, PAYING_COMPANIES } from './contexts/AppContext';
import { useSettings, ActiveTabType } from './hooks/useSettings';
import { useInvoiceManagement } from './hooks/useInvoiceManagement';
import { useChatManagement } from './hooks/useChatManagement';

import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import InvoiceArea from './components/InvoiceArea';
import SettingsPanel from './components/SettingsPanel';
import RightSidebar from './components/RightSidebar';

const App: React.FC = () => {
  const {
    settings,
    updateSettings,
    theme,
    toggleTheme,
    activeTab,
    setActiveTab,
  } = useSettings();

  const invoiceContext = useInvoiceManagement({ settings });
  const chatContext = useChatManagement({ settings });

  // Combine all context values
  const appContextValue: AppContextType = {
    // General
    settings,
    theme,
    activeTab,
    setActiveTab,
    toggleTheme,
    updateSettings,
    // Chat
    chatConversations: chatContext.chatConversations,
    chatFolders: chatContext.chatFolders,
    currentChatConversationId: chatContext.currentChatConversationId,
    setCurrentChatConversationId: chatContext.setCurrentChatConversationId,
    createNewChatConversation: chatContext.createNewChatConversation,
    createNewChatFolder: chatContext.createNewChatFolder,
    updateChatConversation: chatContext.updateChatConversation,
    updateChatFolder: chatContext.updateChatFolder,
    deleteChatConversation: chatContext.deleteChatConversation,
    deleteChatFolder: chatContext.deleteChatFolder,
    moveChatConversationToFolder: chatContext.moveChatConversationToFolder,
    searchChatConversations: chatContext.searchChatConversations,
    startRecording: chatContext.startRecording,
    stopRecording: chatContext.stopRecording,
    isRecording: chatContext.isRecording,
    // Invoices
    invoices: invoiceContext.invoices,
    clients: invoiceContext.clients,
    invoiceCategories: invoiceContext.invoiceCategories,
    invoiceBatches: invoiceContext.invoiceBatches,
    currentInvoiceId: invoiceContext.currentInvoiceId,
    setCurrentInvoiceId: invoiceContext.setCurrentInvoiceId,
    createNewInvoice: invoiceContext.createNewInvoice,
    createNewInvoiceCategory: invoiceContext.createNewInvoiceCategory,
    createNewClient: invoiceContext.createNewClient,
    updateInvoice: invoiceContext.updateInvoice,
    updateInvoiceCategory: invoiceContext.updateInvoiceCategory,
    updateClient: invoiceContext.updateClient,
    deleteInvoice: invoiceContext.deleteInvoice,
    deleteInvoiceCategory: invoiceContext.deleteInvoiceCategory,
    deleteClient: invoiceContext.deleteClient,
    moveInvoiceToCategory: invoiceContext.moveInvoiceToCategory,
    searchInvoices: invoiceContext.searchInvoices,
    filterInvoices: invoiceContext.filterInvoices,
    exportInvoices: invoiceContext.exportInvoices,
    markInvoiceAsPaid: invoiceContext.markInvoiceAsPaid,
    markInvoiceAsExported: invoiceContext.markInvoiceAsExported,
    processInvoiceNLPCommand: invoiceContext.processInvoiceNLPCommand,
    getInvoiceStatistics: invoiceContext.getInvoiceStatistics,
    importInvoiceData: invoiceContext.importInvoiceData,
    exportInvoiceData: invoiceContext.exportInvoiceData,
    unpaidInvoices: invoiceContext.unpaidInvoices,
    paidInvoices: invoiceContext.paidInvoices,
    getAllInvoices: invoiceContext.getAllInvoices,
    getUnpaidInvoices: invoiceContext.getUnpaidInvoices,
    getPaidInvoices: invoiceContext.getPaidInvoices,
    payingCompanies: PAYING_COMPANIES,
  };

  // Keyboard shortcuts for tabs & new items
  useHotkeys('ctrl+1, cmd+1', () => setActiveTab('chat'), { enableOnFormTags: true });
  useHotkeys('ctrl+2, cmd+2', () => setActiveTab('invoices'), { enableOnFormTags: true });
  useHotkeys('ctrl+3, cmd+3', () => setActiveTab('settings'), { enableOnFormTags: true });

  useHotkeys('ctrl+n, cmd+n', (event) => {
    event.preventDefault();
    if (settings.enableKeyboardShortcuts) {
      if (activeTab === 'chat') {
        chatContext.createNewChatConversation();
      } else if (activeTab === 'invoices') {
        invoiceContext.createNewInvoice();
      }
    }
  }, { enableOnFormTags: true });

  useHotkeys('ctrl+f, cmd+f', (event) => {
    event.preventDefault();
    if (settings.enableKeyboardShortcuts) {
      const searchInput = document.querySelector('.sidebar-search-input') as HTMLInputElement;
      if (searchInput) searchInput.focus();
    }
  }, { enableOnFormTags: true });

  const TabButton: React.FC<{ tabName: ActiveTabType; icon: React.ReactNode; label: string }> = ({ tabName, icon, label }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors duration-150
        ${activeTab === tabName
          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
        }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <AppContext.Provider value={appContextValue}>
      <DndProvider backend={HTML5Backend}>
        <div className={`h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden`}>
          {/* Tab Navigation Header */}
          <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
            <nav className="flex justify-center -mb-px">
              <TabButton tabName="chat" icon={<MessageSquare size={18} />} label="Chat" />
              <TabButton tabName="invoices" icon={<FileText size={18} />} label="Invoices" />
              <TabButton tabName="settings" icon={<SettingsIcon size={18} />} label="Settings" />
            </nav>
          </header>

          <div className="flex-1 flex overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto relative">
              {activeTab === 'chat' && <ChatArea />}
              {activeTab === 'invoices' && <InvoiceArea />}
              {activeTab === 'settings' && (
                <div className="h-full overflow-y-auto">
                  <SettingsPanel />
                </div>
              )}
            </main>
            <RightSidebar />
          </div>
        </div>
      </DndProvider>
    </AppContext.Provider>
  );
};

export default App;
