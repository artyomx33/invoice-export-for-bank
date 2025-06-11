import { supabase } from '../utils/supabase';
import {
  Invoice,
  Client,
  PayingCompanyConfig,
  BatchExport,
  InvoiceStatus,
  ExportFormat,
} from '../types/Invoice';

// Helper for error handling
const handleError = (error: any, message: string) => {
  console.error(`${message}:`, error);
  throw new Error(`${message}: ${error.message || error}`);
};

// --- Companies Operations ---
export const getCompanies = async (): Promise<PayingCompanyConfig[]> => {
  try {
    const { data, error } = await supabase.from('companies').select('*');
    if (error) handleError(error, 'Failed to fetch companies');
    return data || [];
  } catch (error) {
    handleError(error, 'Error in getCompanies');
    return []; // Should not be reached due to throw, but for type safety
  }
};

// --- Clients Operations ---
export const getClients = async (): Promise<Client[]> => {
  try {
    const { data, error } = await supabase.from('clients').select('*');
    if (error) handleError(error, 'Failed to fetch clients');
    return data || [];
  } catch (error) {
    handleError(error, 'Error in getClients');
    return [];
  }
};

export const createClient = async (client: Partial<Client>): Promise<Client> => {
  try {
    const { data, error } = await supabase.from('clients').insert(client).select().single();
    if (error) handleError(error, 'Failed to create client');
    return data;
  } catch (error) {
    handleError(error, 'Error in createClient');
    throw error; // Re-throw to propagate
  }
};

export const updateClient = async (client: Client): Promise<Client> => {
  try {
    const { data, error } = await supabase.from('clients').update(client).eq('id', client.id).select().single();
    if (error) handleError(error, 'Failed to update client');
    return data;
  } catch (error) {
    handleError(error, 'Error in updateClient');
    throw error;
  }
};

export const deleteClient = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) handleError(error, 'Failed to delete client');
  } catch (error) {
    handleError(error, 'Error in deleteClient');
    throw error;
  }
};

// --- Invoices Operations ---
export const getInvoices = async (): Promise<Invoice[]> => {
  try {
    const { data, error } = await supabase.from('invoices').select('*');
    if (error) handleError(error, 'Failed to fetch invoices');
    return data || [];
  } catch (error) {
    handleError(error, 'Error in getInvoices');
    return [];
  }
};

export const createInvoice = async (invoice: Partial<Invoice>): Promise<Invoice> => {
  try {
    const { data, error } = await supabase.from('invoices').insert(invoice).select().single();
    if (error) handleError(error, 'Failed to create invoice');
    return data;
  } catch (error) {
    handleError(error, 'Error in createInvoice');
    throw error;
  }
};

export const updateInvoice = async (invoice: Invoice): Promise<Invoice> => {
  try {
    const { data, error } = await supabase.from('invoices').update(invoice).eq('id', invoice.id).select().single();
    if (error) handleError(error, 'Failed to update invoice');
    return data;
  } catch (error) {
    handleError(error, 'Error in updateInvoice');
    throw error;
  }
};

export const deleteInvoice = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) handleError(error, 'Failed to delete invoice');
  } catch (error) {
    handleError(error, 'Error in deleteInvoice');
    throw error;
  }
};

export const markInvoiceAsPaid = async (id: string): Promise<Invoice> => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .update({ status: InvoiceStatus.PAID, payment_date: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) handleError(error, 'Failed to mark invoice as paid');
    return data;
  } catch (error) {
    handleError(error, 'Error in markInvoiceAsPaid');
    throw error;
  }
};

export const markInvoiceAsExported = async (
  id: string,
  batchId: string,
  format: ExportFormat
): Promise<Invoice> => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .update({ status: InvoiceStatus.EXPORTED, batch_id: batchId, export_format: format, exported_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) handleError(error, 'Failed to mark invoice as exported');
    return data;
  } catch (error) {
    handleError(error, 'Error in markInvoiceAsExported');
    throw error;
  }
};

// --- Batch Exports Operations ---
export const createBatchExport = async (batchExport: Partial<BatchExport>): Promise<BatchExport> => {
  try {
    const { data, error } = await supabase.from('batch_exports').insert(batchExport).select().single();
    if (error) handleError(error, 'Failed to create batch export');
    return data;
  } catch (error) {
    handleError(error, 'Error in createBatchExport');
    throw error;
  }
};

export const getBatchExports = async (): Promise<BatchExport[]> => {
  try {
    const { data, error } = await supabase.from('batch_exports').select('*');
    if (error) handleError(error, 'Failed to fetch batch exports');
    return data || [];
  } catch (error) {
    handleError(error, 'Error in getBatchExports');
    return [];
  }
};
