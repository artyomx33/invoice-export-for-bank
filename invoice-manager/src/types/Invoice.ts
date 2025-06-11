export enum InvoiceStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  EXPORTED = 'EXPORTED',
  CANCELLED = 'CANCELLED'
}

export enum UrgencyLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum ExportFormat {
  CSV = 'CSV',
  JSON = 'JSON',
  SEPA_XML = 'SEPA_XML'
}

export interface Invoice {
  id: string;
  factuurNumber: string;
  ibanName: string;
  ibanNumber: string;
  amount: number;
  klantnummer?: string;
  dueDate?: string;
  status: InvoiceStatus;
  payingCompany?: string;
  description?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  iban?: string;
  bic?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PayingCompany {
  id: string;
  name: string;
  iban: string;
  bic: string;
  address?: string;
  vatNumber?: string;
}

export interface InvoiceExportOptions {
  format: ExportFormat;
  includeHeaders?: boolean;
  dateFormat?: string;
}
