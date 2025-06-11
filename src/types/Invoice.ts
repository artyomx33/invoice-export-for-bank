/**
 * Invoice Management System - Type Definitions
 */

/**
 * Invoice Status Enum
 */
export enum InvoiceStatus {
  PENDING = 'pending',
  PAID = 'paid',
  EXPORTED = 'exported',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled'
}

/**
 * Currency Enum - Simplified to only EUR as per requirements
 */
export enum Currency {
  EUR = 'EUR'
}

/**
 * Paying Company Options
 */
export enum PayingCompany {
  TEDDY_KIDS = 'teddy-kids',
  TISA = 'tisa',
  TEDDY_DAYCARE = 'teddy-daycare',
  TEDDY_CAFE = 'teddy-cafe'
}

/**
 * Export Format Types
 */
export enum ExportFormat {
  SEPA_XML = 'sepa_xml',
  CSV = 'csv',
  JSON = 'json'
}

/**
 * Urgency Levels for invoices
 */
export enum UrgencyLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

/**
 * Invoice Interface - Core data model for invoices
 */
export interface Invoice {
  id: string;                    // Auto-generated UUID
  
  // Core Payment Fields (Required)
  amount: number;                // AMOUNT - Payment amount
  ibanName: string;              // IBAN NAME - Account holder/recipient name
  ibanNumber: string;            // IBAN NUMBER - Full IBAN account number
  klantnummer: string;           // KLANTNUMMER/KENMERK - Customer reference number
  factuurNumber: string;         // FACTUUR NUMBER - Invoice number (can be auto-generated)
  
  // Status & Tracking
  status: InvoiceStatus;         // Current invoice status
  dueDate?: Date;                // Optional due date
  batchId?: string;              // Optional batch ID for export tracking
  createdAt: Date;               // Creation timestamp
  updatedAt: Date;               // Last update timestamp
  
  // Optional Fields
  currency?: Currency;           // Currency (now optional, defaults to EUR)
  description?: string;          // Additional notes or description
  category?: string;             // Invoice category/type for organization (can be an ID to a Category/ChatFolder type)
  urgency?: UrgencyLevel;        // Urgency level (can be calculated from dueDate)
  payingCompany?: PayingCompany; // Which company will pay this invoice
  
  // Additional metadata
  exportedAt?: Date;             // When the invoice was exported
  exportFormat?: ExportFormat;   // Format used for export
  paymentDate?: Date;            // When the invoice was paid
  reminderSent?: boolean;        // Whether a reminder was sent
}

/**
 * Client Interface - For managing saved clients/payees
 */
export interface Client {
  id: string;                    // Auto-generated UUID
  name: string;                  // Client/Company name
  ibanName: string;              // Account holder name
  ibanNumber: string;            // IBAN account number
  defaultKlantnummer?: string;   // Default customer reference
  defaultDescription?: string;   // Default payment description
  address?: string;              // Optional address
  email?: string;                // Optional email contact
  phone?: string;                // Optional phone contact
  createdAt: Date;               // When client was added
  updatedAt: Date;               // When client was last updated
}

/**
 * Batch Export Interface - For tracking export batches
 */
export interface BatchExport {
  id: string;                    // Batch ID
  format: ExportFormat;          // Export format used
  invoiceIds: string[];          // IDs of included invoices
  fileName: string;              // Name of the exported file
  timestamp: Date;               // When export was created
  totalAmount: number;           // Total amount of all invoices
  currency: Currency;            // Currency of the batch (always EUR)
}

/**
 * Paying Company Configuration
 */
export interface PayingCompanyConfig {
  id: PayingCompany;
  name: string;
  fullName: string;
  iban: string;
  bic: string;
  address: {
    street: string;
    postalCode: string;
    city: string;
    country: string;
  };
  sepaId: string;
}

/**
 * Invoice Filter Options
 */
export interface InvoiceFilters {
  status?: InvoiceStatus[];      // Filter by status
  dateRange?: {                  // Filter by date range
    start: Date;
    end: Date;
  };
  minAmount?: number;            // Minimum amount
  maxAmount?: number;            // Maximum amount
  client?: string;               // Filter by client (name or ID)
  category?: string;             // Filter by category (ID)
}

/**
 * NLP Command Result - For parsing natural language invoice commands
 */
export interface NLPCommandResult {
  command: 'create' | 'update' | 'delete' | 'mark_paid' | 'export' | 'search';
  invoiceData?: Partial<Invoice>;
  clientData?: Partial<Client>;
  filters?: InvoiceFilters;
  error?: string;
}

/**
 * Represents a category for organizing invoices.
 * This can be the same structure as ChatFolder if desired for simplicity.
 */
export interface InvoiceCategory {
    id: string;
    name: string;
    color?: string; // Optional color for visual distinction
    createdAt: Date;
}

/**
 * Statistics related to invoices.
 */
export interface InvoiceStatistics {
    totalInvoices: number;
    pendingInvoices: number;
    paidInvoices: number;
    overdueInvoices: number;
    totalAmountDue: number;
    totalAmountPaid: number;
    averagePaymentTimeDays?: number; // Optional: average time to get paid
    currencyBreakdown: Record<Currency, { due: number; paid: number }>; // Simplified to only include EUR
}
