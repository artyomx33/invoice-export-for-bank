import React, { createContext } from 'react';
import {
  Invoice,
  Client,
  BatchExport,
  ExportFormat,
  InvoiceFilters,
  NLPCommandResult as InvoiceNLPCommandResult,
  Currency,
  InvoiceStatus, // Make sure InvoiceStatus is imported
  InvoiceStatistics, // Import the actual InvoiceStatistics type
  PayingCompany,
  PayingCompanyConfig
} from '../types/Invoice'; // Assuming all invoice types are here

// Paying Company Configurations
export const PAYING_COMPANIES: PayingCompanyConfig[] = [
  {
    id: PayingCompany.TEDDY_KIDS,
    name: 'Teddy Kids',
    fullName: 'Teddy Kids B.V.',
    iban: 'NL21RABO0175461910',
    bic: 'RABONL2U',
    address: {
      street: 'Rijnsburgerweg',
      postalCode: '2334BA',
      city: 'Leiden',
      country: 'NL'
    },
    sepaId: '028ecb7182cd42c88ef28ca422f70c10'
  },
  {
    id: PayingCompany.TISA,
    name: 'TISA',
    fullName: 'TISA - Teddy Kids B.V.',
    iban: 'NL72RABO0377186945',
    bic: 'RABONL2U',
    address: {
      street: 'Lorentzkade',
      postalCode: '2313GB',
      city: 'Leiden',
      country: 'NL'
    },
    sepaId: '2bcb032d54f74ecca8628347cd6b58a7'
  },
  {
    id: PayingCompany.TEDDY_DAYCARE,
    name: 'Teddy Daycare',
    fullName: 'Teddy Kids Daycare',
    iban: 'NL62RABO0383960053',
    bic: 'RABONL2U',
    address: {
      street: 'Rijnsburgerweg',
      postalCode: '2334BE',
      city: 'Leiden',
      country: 'NL'
    },
    sepaId: 'b2328cd951c44f6aa82cad3ed1db05b6'
  },
  {
    id: PayingCompany.TEDDY_CAFE,
    name: 'Teddy Cafe',
    fullName: 'Teddy\'s Cafe B.V.',
    iban: 'NL81RABO0340536691',
    bic: 'RABONL2U',
    address: {
      street: 'Lorentzkade',
      postalCode: '2313GB',
      city: 'Leiden',
      country: 'NL'
    },
    sepaId: '7e3ff2448e6a4197a63c0ddfc8575a78'
  }
];

// Chat specific types (defined here for now, could be moved to ../types/Chat.ts)
export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  folderId: string | null;
  createdAt: Date;
  updatedAt: Date;
  model: string;
  systemPrompt: string;
  pinned: boolean;
  audioRecordings?: AudioRecording[];
  statistics?: ChatConversationStatistics;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  tokenCount?: number;
  reactions?: string[];
  attachments?: ChatAttachment[];
  audioTranscription?: boolean;
}

export interface ChatFolder {
  id: string;
  name: string;
  color?: string;
  parentId: string | null;
  createdAt: Date;
}

export interface AudioRecording {
  id: string;
  filename: string;
  duration: number;
  transcription?: string;
  messageId?: string;
  createdAt: Date;
}

export interface ChatAttachment {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  url: string;
}

export interface ChatConversationStatistics {
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  totalTokens: number;
  averageResponseTime: number;
  wordCount: number;
}

// Merged AppSettings
export interface AppSettings {
  // General
  theme: 'light' | 'dark' | 'system';
  enableKeyboardShortcuts: boolean;
  enableAnalytics: boolean;

  // Chat Specific
  chatApiKey: string;
  defaultChatModel: string;
  autoSaveChatDrafts: boolean;
  showChatTypingIndicator: boolean;

  // Invoice Specific
  autoGenerateInvoiceNumbers: boolean;
  invoiceNumberPrefix: string;
  defaultDueDays: number;
  showInvoiceReminderNotifications: boolean;
  defaultInvoiceExportFormat: ExportFormat;
  sepaSettings: {
    initiatingPartyName: string;
    initiatingPartyId: string;
    batchBooking: boolean;
  };
}

// Merged Context Type
export interface AppContextType {
  // General
  settings: AppSettings;
  theme: 'light' | 'dark';
  activeTab: 'chat' | 'invoices' | 'settings';
  setActiveTab: (tab: 'chat' | 'invoices' | 'settings') => void;
  toggleTheme: () => void;
  updateSettings: (settings: Partial<AppSettings>) => void;

  // Chat
  chatConversations: ChatConversation[];
  chatFolders: ChatFolder[];
  currentChatConversationId: string | null;
  setCurrentChatConversationId: (id: string | null) => void;
  createNewChatConversation: () => void;
  createNewChatFolder: () => void;
  updateChatConversation: (conversation: ChatConversation) => void;
  updateChatFolder: (folder: ChatFolder) => void;
  deleteChatConversation: (id: string) => void;
  deleteChatFolder: (id: string) => void;
  moveChatConversationToFolder: (conversationId: string, folderId: string | null) => void;
  searchChatConversations: (query: string) => ChatConversation[];
  startRecording?: () => void;
  stopRecording?: () => Promise<AudioRecording | null>;
  isRecording?: boolean;

  // Invoices
  invoices: Invoice[];
  unpaidInvoices: Invoice[];
  paidInvoices: Invoice[];
  clients: Client[];
  invoiceCategories: ChatFolder[]; // Using ChatFolder type for invoice categories
  invoiceBatches: BatchExport[];
  currentInvoiceId: string | null;
  setCurrentInvoiceId: (id: string | null) => void;
  createNewInvoice: (invoiceData?: Partial<Invoice>) => void;
  createNewInvoiceCategory: () => void;
  createNewClient: (clientData: Partial<Client>) => void;
  updateInvoice: (invoice: Invoice) => void;
  updateInvoiceCategory: (category: ChatFolder) => void;
  updateClient: (client: Client) => void;
  deleteInvoice: (id: string) => void;
  deleteInvoiceCategory: (id: string) => void;
  deleteClient: (id: string) => void;
  moveInvoiceToCategory: (invoiceId: string, categoryId: string | null) => void;
  searchInvoices: (query: string) => Invoice[];
  filterInvoices: (filters: InvoiceFilters) => Invoice[];
  exportInvoices: (invoiceIds: string[], format: ExportFormat) => Promise<string>;
  markInvoiceAsPaid: (invoiceId: string, paymentDate?: Date) => void;
  markInvoiceAsExported: (invoiceId: string, batchId: string, format: ExportFormat) => void;
  processInvoiceNLPCommand: (command: string) => Promise<InvoiceNLPCommandResult>;
  getInvoiceStatistics: () => InvoiceStatistics;
  importInvoiceData: (jsonData: string) => Promise<boolean>;
  exportInvoiceData: () => string;
  getAllInvoices: () => Invoice[];
  getUnpaidInvoices: () => Invoice[];
  getPaidInvoices: () => Invoice[];
  payingCompanies: PayingCompanyConfig[];
}

// Default Context Value
const defaultAppContextValue: AppContextType = {
  settings: {
    theme: 'system',
    enableKeyboardShortcuts: true,
    enableAnalytics: true,
    chatApiKey: '',
    defaultChatModel: 'gpt-4o',
    autoSaveChatDrafts: true,
    showChatTypingIndicator: true,
    autoGenerateInvoiceNumbers: true,
    invoiceNumberPrefix: 'INV-',
    defaultDueDays: 30,
    showInvoiceReminderNotifications: true,
    defaultInvoiceExportFormat: ExportFormat.SEPA_XML,
    sepaSettings: { initiatingPartyName: '', initiatingPartyId: '', batchBooking: true }
  },
  theme: 'light',
  activeTab: 'invoices',
  setActiveTab: () => {},
  toggleTheme: () => {},
  updateSettings: () => {},
  chatConversations: [],
  chatFolders: [],
  currentChatConversationId: null,
  setCurrentChatConversationId: () => {},
  createNewChatConversation: () => {},
  createNewChatFolder: () => {},
  updateChatConversation: () => {},
  updateChatFolder: () => {},
  deleteChatConversation: () => {},
  deleteChatFolder: () => {},
  moveChatConversationToFolder: () => {},
  searchChatConversations: () => [],
  startRecording: () => {},
  stopRecording: async () => null,
  isRecording: false,
  invoices: [],
  unpaidInvoices: [],
  paidInvoices: [],
  clients: [],
  invoiceCategories: [],
  invoiceBatches: [],
  currentInvoiceId: null,
  setCurrentInvoiceId: () => {},
  createNewInvoice: () => {},
  createNewInvoiceCategory: () => {},
  createNewClient: () => {},
  updateInvoice: () => {},
  updateInvoiceCategory: () => {},
  updateClient: () => {},
  deleteInvoice: () => {},
  deleteInvoiceCategory: () => {},
  deleteClient: () => {},
  moveInvoiceToCategory: () => {},
  searchInvoices: () => [],
  filterInvoices: () => [],
  exportInvoices: async () => '',
  markInvoiceAsPaid: () => {},
  markInvoiceAsExported: () => {},
  processInvoiceNLPCommand: async () => ({ command: 'search' } as InvoiceNLPCommandResult), // Ensure it matches type
  getInvoiceStatistics: () => ({
    totalInvoices: 0,
    pendingInvoices: 0,
    paidInvoices: 0,
    overdueInvoices: 0,
    totalAmountDue: 0,
    totalAmountPaid: 0,
    currencyBreakdown: {} as Record<Currency, { due: number; paid: number }>
  }),
  importInvoiceData: async () => false,
  exportInvoiceData: () => '',
  getAllInvoices: () => [],
  getUnpaidInvoices: () => [],
  getPaidInvoices: () => [],
  payingCompanies: PAYING_COMPANIES,
};

export const AppContext = createContext<AppContextType>(defaultAppContextValue);
