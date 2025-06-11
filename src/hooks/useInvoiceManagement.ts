import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Invoice,
  Client,
  BatchExport,
  ExportFormat,
  InvoiceFilters,
  NLPCommandResult as InvoiceNLPCommandResult,
  Currency,
  InvoiceStatus,
  InvoiceStatistics,
  PayingCompanyConfig,
} from '../types/Invoice';
import { ChatFolder } from '../contexts/AppContext'; // Re-using ChatFolder for invoice categories
import { AppSettings } from '../contexts/AppContext'; // For settings dependency
import { PAYING_COMPANIES } from '../constants/companies'; // Import from constants
import {
  getCompanies,
  getClients,
  createClient as createClientSupabase,
  updateClient as updateClientSupabase,
  deleteClient as deleteClientSupabase,
  getInvoices as getInvoicesSupabase,
  createInvoice as createInvoiceSupabase,
  updateInvoice as updateInvoiceSupabase,
  deleteInvoice as deleteInvoiceSupabase,
  markInvoiceAsPaid as markInvoiceAsPaidSupabase,
  markInvoiceAsExported as markInvoiceAsExportedSupabase,
  createBatchExport as createBatchExportSupabase,
  getBatchExports as getBatchExportsSupabase,
} from '../services/supabase';

export interface UseInvoiceManagementProps {
  settings: AppSettings; // Pass settings from AppProvider
}

export const useInvoiceManagement = ({
  settings,
}: UseInvoiceManagementProps) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoiceCategories, setInvoiceCategories] = useState<ChatFolder[]>([]);
  const [invoiceBatches, setInvoiceBatches] = useState<BatchExport[]>([]);
  const [companies, setCompanies] = useState<PayingCompanyConfig[]>([]);
  const [currentInvoiceId, setCurrentInvoiceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedCompanies = await getCompanies();
        setCompanies(fetchedCompanies);

        const fetchedClients = await getClients();
        setClients(fetchedClients);

        const fetchedInvoices = await getInvoicesSupabase();
        setInvoices(fetchedInvoices);

        const fetchedBatches = await getBatchExportsSupabase();
        setInvoiceBatches(fetchedBatches);

        // Assuming invoice categories are not stored in Supabase yet, or are part of chat folders
        // For now, keep them as empty or load from a default if needed
        setInvoiceCategories([]); // Placeholder, implement Supabase fetch if needed
      } catch (err: any) {
        setError(err.message || 'Failed to fetch data from Supabase');
        console.error('Supabase fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Helper to get all invoices (combined)
  const getAllInvoices = useCallback((): Invoice[] => {
    return invoices;
  }, [invoices]);

  // Get only unpaid invoices
  const getUnpaidInvoices = useCallback((): Invoice[] => {
    return invoices.filter(
      (inv) =>
        inv.status === InvoiceStatus.PENDING ||
        inv.status === InvoiceStatus.OVERDUE
    );
  }, [invoices]);

  // Get only paid invoices
  const getPaidInvoices = useCallback((): Invoice[] => {
    return invoices.filter(
      (inv) =>
        inv.status === InvoiceStatus.PAID || inv.status === InvoiceStatus.EXPORTED
    );
  }, [invoices]);

  const generateInvoiceNumber = useCallback((): string => {
    if (!settings.autoGenerateInvoiceNumbers) return '';
    const prefix = settings.invoiceNumberPrefix || 'INV-';
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const regex = new RegExp(`^${prefix}${year}${month}-(\\d+)$`);
    let highestNumber = 0;

    // Check all invoices
    invoices.forEach((invoice) => {
      const match = invoice.factuurNumber.match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > highestNumber) highestNumber = num;
      }
    });
    const newNumber = (highestNumber + 1).toString().padStart(4, '0');
    return `${prefix}${year}${month}-${newNumber}`;
  }, [invoices, settings.autoGenerateInvoiceNumbers, settings.invoiceNumberPrefix]);

  const createNewInvoice = useCallback(async (invoiceData?: Partial<Invoice>) => {
    try {
      const newInvoice: Partial<Invoice> = {
        amount: invoiceData?.amount || 0,
        ibanName: invoiceData?.ibanName || '',
        ibanNumber: invoiceData?.ibanNumber || '',
        klantnummer: invoiceData?.klantnummer || '',
        factuurNumber: invoiceData?.factuurNumber || generateInvoiceNumber(),
        status: invoiceData?.status || InvoiceStatus.PENDING,
        currency: Currency.EUR, // Always use EUR as the currency
        category: invoiceData?.category || undefined,
        description: invoiceData?.description || '',
        dueDate: invoiceData?.dueDate || new Date(Date.now() + settings.defaultDueDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Format to YYYY-MM-DD
        payingCompany: invoiceData?.payingCompany || PAYING_COMPANIES[0].id,
        issue_date: invoiceData?.issue_date || new Date().toISOString().split('T')[0],
      };

      const created = await createInvoiceSupabase(newInvoice);
      setInvoices((prev) => [...prev, created]);
      setCurrentInvoiceId(created.id);
      return created;
    } catch (err: any) {
      setError(err.message || 'Failed to create invoice');
      throw err;
    }
  }, [generateInvoiceNumber, settings.defaultDueDays]);

  const createNewInvoiceCategory = useCallback(() => {
    const newCategory: ChatFolder = { id: uuidv4(), name: 'New Invoice Category', parentId: null, createdAt: new Date() };
    setInvoiceCategories(prev => [...prev, newCategory]);
    return newCategory;
  }, []);

  const createNewClient = useCallback(async (clientData: Partial<Client>) => {
    try {
      const newClient: Partial<Client> = {
        name: clientData.name || '',
        ibanName: clientData.ibanName || '',
        ibanNumber: clientData.ibanNumber || '',
        defaultKlantnummer: clientData.defaultKlantnummer || '',
        defaultDescription: clientData.defaultDescription || '',
        address: clientData.address || '',
        email: clientData.email || '',
        phone: clientData.phone || '',
      };
      const created = await createClientSupabase(newClient);
      setClients(prev => [...prev, created]);
      return created;
    } catch (err: any) {
      setError(err.message || 'Failed to create client');
      throw err;
    }
  }, []);

  const updateInvoice = useCallback(async (updatedInvoice: Invoice) => {
    try {
      const updated = await updateInvoiceSupabase(updatedInvoice);
      setInvoices(prev => prev.map(inv => inv.id === updated.id ? updated : inv));
      return updated;
    } catch (err: any) {
      setError(err.message || 'Failed to update invoice');
      throw err;
    }
  }, []);

  const updateInvoiceCategory = useCallback((updatedCategory: ChatFolder) => {
    setInvoiceCategories(prev => prev.map(cat => cat.id === updatedCategory.id ? updatedCategory : cat));
  }, []);

  const updateClient = useCallback(async (updatedClient: Client) => {
    try {
      const updated = await updateClientSupabase(updatedClient);
      setClients(prev => prev.map(client => client.id === updated.id ? updated : client));
      return updated;
    } catch (err: any) {
      setError(err.message || 'Failed to update client');
      throw err;
    }
  }, []);

  const deleteInvoice = useCallback(async (id: string) => {
    try {
      await deleteInvoiceSupabase(id);
      setInvoices(prev => prev.filter(inv => inv.id !== id));
      if (currentInvoiceId === id) {
        setCurrentInvoiceId(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete invoice');
      throw err;
    }
  }, [currentInvoiceId]);

  const deleteInvoiceCategory = useCallback((id: string) => {
    setInvoices(prev => prev.map(inv => inv.category === id ? { ...inv, category: undefined } : inv));
    setInvoiceCategories(prev => prev.filter(cat => cat.id !== id));
  }, []);

  const deleteClient = useCallback(async (id: string) => {
    try {
      await deleteClientSupabase(id);
      setClients(prev => prev.filter(client => client.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete client');
      throw err;
    }
  }, []);

  const moveInvoiceToCategory = useCallback((invoiceId: string, categoryId: string | null) => {
    setInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, category: categoryId || undefined } : inv));
  }, []);

  const searchInvoices = useCallback((query: string): Invoice[] => {
    if (!query.trim()) return invoices;

    const lowerQuery = query.toLowerCase();

    return invoices.filter(inv =>
      inv.factuurNumber.toLowerCase().includes(lowerQuery) ||
      inv.ibanName.toLowerCase().includes(lowerQuery) ||
      inv.ibanNumber.toLowerCase().includes(lowerQuery) ||
      (inv.klantnummer && inv.klantnummer.toLowerCase().includes(lowerQuery)) ||
      (inv.description && inv.description.toLowerCase().includes(lowerQuery))
    );
  }, [invoices]);

  const filterInvoices = useCallback((filters: InvoiceFilters): Invoice[] => {
    return invoices.filter(inv => {
      if (filters.status && filters.status.length > 0 && !filters.status.includes(inv.status)) return false;
      if (filters.dateRange) {
        const invoiceDate = new Date(inv.createdAt || inv.issue_date || '');
        if (invoiceDate < filters.dateRange.start || invoiceDate > filters.dateRange.end) return false;
      }
      if (filters.minAmount !== undefined && inv.amount < filters.minAmount) return false;
      if (filters.maxAmount !== undefined && inv.amount > filters.maxAmount) return false;
      if (filters.client && inv.ibanName.toLowerCase() !== filters.client.toLowerCase()) return false;
      if (filters.category && inv.category !== filters.category) return false;
      return true;
    });
  }, [invoices]);

  const markInvoiceAsPaid = useCallback(async (invoiceId: string, paymentDate: Date = new Date()) => {
    try {
      const updated = await markInvoiceAsPaidSupabase(invoiceId);
      setInvoices(prev => prev.map(inv => inv.id === updated.id ? updated : inv));
    } catch (err: any) {
      setError(err.message || 'Failed to mark invoice as paid');
      throw err;
    }
  }, []);

  const markInvoiceAsExported = useCallback(async (invoiceId: string, batchId: string, format: ExportFormat) => {
    try {
      const updated = await markInvoiceAsExportedSupabase(invoiceId, batchId, format);
      setInvoices(prev => prev.map(inv => inv.id === updated.id ? updated : inv));
    } catch (err: any) {
      setError(err.message || 'Failed to mark invoice as exported');
      throw err;
    }
  }, []);

  const generateSEPAXML = useCallback((invoicesToExport: Invoice[]): string => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const timestamp = today.toISOString();

    // Group invoices by paying company
    const invoicesByCompany = invoicesToExport.reduce((acc, invoice) => {
      const companyId = invoice.payingCompany || PAYING_COMPANIES[0].id; // Default to first company
      if (!acc[companyId]) acc[companyId] = [];
      acc[companyId].push(invoice);
      return acc;
    }, {} as Record<string, Invoice[]>);

    // Calculate total amount and number of transactions
    const totalAmount = invoicesToExport.reduce((sum, inv) => sum + inv.amount, 0);
    const msgId = `BATCH${dateStr}${today.getHours()}${today.getMinutes()}${today.getSeconds()}`;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${msgId}</MsgId>
      <CreDtTm>${timestamp}</CreDtTm>
      <NbOfTxs>${invoicesToExport.length}</NbOfTxs>
      <CtrlSum>${totalAmount.toFixed(2)}</CtrlSum>
      <InitgPty>
        <Nm>Teddy Group</Nm>
      </InitgPty>
    </GrpHdr>`;

    // Create payment information for each company
    Object.entries(invoicesByCompany).forEach(([companyId, companyInvoices]) => {
      const company = PAYING_COMPANIES.find(c => c.id === companyId);
      if (!company) return;

      const companyTotal = companyInvoices.reduce((sum, inv) => sum + inv.amount, 0);
      const pmtInfId = `${company.name.replace(/[^A-Za-z0-9]/g, '')}${dateStr}${today.getHours()}${today.getMinutes()}${today.getSeconds()}`;

      xml += `
    <PmtInf>
      <PmtInfId>${pmtInfId}</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <BtchBookg>true</BtchBookg>
      <NbOfTxs>${companyInvoices.length}</NbOfTxs>
      <CtrlSum>${companyTotal.toFixed(2)}</CtrlSum>
      <PmtTpInf>
        <InstrPrty>NORM</InstrPrty>
        <SvcLvl>
          <Cd>SEPA</Cd>
        </SvcLvl>
        <CtgryPurp>
          <Cd>SALA</Cd>
        </CtgryPurp>
      </PmtTpInf>
      <ReqdExctnDt>${today.toISOString().slice(0, 10)}</ReqdExctnDt>
      <Dbtr>
        <Nm>${company.fullName}</Nm>
        <PstlAdr>
          <Ctry>${company.address.country}</Ctry>
          <AdrLine>${company.address.street}</AdrLine>
          <AdrLine>${company.address.postalCode} ${company.address.city}</AdrLine>
        </PstlAdr>
        <Id>
          <OrgId>
            <Othr>
              <Id>${company.sepaId}</Id>
            </Othr>
          </OrgId>
        </Id>
      </Dbtr>
      <DbtrAcct>
        <Id>
          <IBAN>${company.iban}</IBAN>
        </Id>
      </DbtrAcct>
      <DbtrAgt>
        <FinInstnId>
          <BIC>${company.bic}</BIC>
        </FinInstnId>
      </DbtrAgt>
      <ChrgBr>SLEV</ChrgBr>`;

      // Add each transaction
      companyInvoices.forEach((invoice, index) => {
        const endToEndId = `${pmtInfId}V${index}`;
        const ustrd = `${invoice.factuurNumber} ${invoice.klantnummer}`;

        xml += `
      <CdtTrfTxInf>
        <PmtId>
          <EndToEndId>${endToEndId}</EndToEndId>
        </PmtId>
        <Amt>
          <InstdAmt Ccy="EUR">${invoice.amount.toFixed(2)}</InstdAmt>
        </Amt>
        <CdtrAgt>
          <FinInstnId>
            <BIC>BUNQNL2A</BIC>
          </FinInstnId>
        </CdtrAgt>
        <Cdtr>
          <Nm>${invoice.ibanName}</Nm>
          <PstlAdr>
            <Ctry>NL</Ctry>
            <AdrLine>Imported Address</AdrLine>
          </PstlAdr>
        </Cdtr>
        <CdtrAcct>
          <Id>
            <IBAN>${invoice.ibanNumber.replace(/\s/g, '')}</IBAN>
          </Id>
        </CdtrAcct>
        <RmtInf>
          <Ustrd>${ustrd}</Ustrd>
        </RmtInf>
      </CdtTrfTxInf>`;
      });

      xml += `
    </PmtInf>`;
    });

    xml += `
  </CstmrCdtTrfInitn>
</Document>`;

    return xml;
  }, []);

  const generateCSV = useCallback((invoicesToExport: Invoice[]): string => {
    // Group invoices by paying company for CSV export
    const invoicesByCompany = invoicesToExport.reduce((acc, invoice) => {
      const companyId = invoice.payingCompany || 'teddy-kids';
      if (!acc[companyId]) acc[companyId] = [];
      acc[companyId].push(invoice);
      return acc;
    }, {} as Record<string, Invoice[]>);

    let csvContent = '';

    // Create CSV for each company
    Object.entries(invoicesByCompany).forEach(([companyId, companyInvoices]) => {
      const company = PAYING_COMPANIES.find(c => c.id === companyId);
      if (!company) return;

      // Add company header
      csvContent += `Paying Company: ${company.fullName}\n`;
      csvContent += `IBAN: ${company.iban}\n`;
      csvContent += `Date: ${new Date().toISOString().slice(0, 10)}\n\n`;

      // Add CSV headers
      csvContent += 'Name,IBAN,Amount_EUR,Reference\n';

      // Add invoice rows
      companyInvoices.forEach(inv => {
        // Format: Name, IBAN, Amount, Reference (factuurNumber + klantnummer)
        csvContent += `"${inv.ibanName}","${inv.ibanNumber.replace(/\s/g, '')}",${inv.amount.toFixed(2)},"${inv.factuurNumber} ${inv.klantnummer}"\n`;
      });

      csvContent += '\n'; // Empty line between companies
    });

    return csvContent;
  }, []);

  const exportInvoices = useCallback(async (invoiceIds: string[], format: ExportFormat): Promise<string> => {
    try {
      // Find invoices to export
      const selectedInvoices = invoices.filter(inv => invoiceIds.includes(inv.id));
      
      const batchId = uuidv4();
      const fileName = `export-${format}-${new Date().toISOString().slice(0, 10)}`;
      const totalAmount = selectedInvoices.reduce((sum, inv) => sum + inv.amount, 0);
      const batch: Partial<BatchExport> = { 
        batch_id: batchId, 
        format, 
        file_name: fileName, 
        total_amount: totalAmount, 
        currency: Currency.EUR 
      };
      
      // Create batch export in Supabase
      const createdBatch = await createBatchExportSupabase(batch);
      setInvoiceBatches(prev => [...prev, createdBatch]);
      
      // Mark all selected invoices as exported
      for (const invoice of selectedInvoices) {
        await markInvoiceAsExported(invoice.id, batchId, format);
      }
      
      if (format === ExportFormat.SEPA_XML) return generateSEPAXML(selectedInvoices);
      if (format === ExportFormat.CSV) return generateCSV(selectedInvoices);
      if (format === ExportFormat.JSON) return JSON.stringify(selectedInvoices, null, 2);
      return '';
    } catch (err: any) {
      setError(err.message || 'Failed to export invoices');
      throw err;
    }
  }, [invoices, generateSEPAXML, generateCSV, markInvoiceAsExported, createBatchExportSupabase]);

  const processInvoiceNLPCommand = useCallback(async (command: string): Promise<InvoiceNLPCommandResult> => {
    const lowerCommand = command.toLowerCase();
    if (lowerCommand.includes('add invoice') || lowerCommand.includes('create invoice')) {
      const amountMatch = lowerCommand.match(/(\d+([.,]\d+)?)/i);
      const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : 0;
      // Basic parsing, real app would use a library or more robust regex
      return { command: 'create', invoiceData: { amount, ibanName: "Parsed Name", ibanNumber: "Parsed IBAN", klantnummer: "Parsed Ref", factuurNumber: generateInvoiceNumber()} };
    }
    // Add more NLP command parsing logic here
    return { command: 'search', error: 'Command not recognized' };
  }, [generateInvoiceNumber]);

  const getInvoiceStatistics = useCallback((): InvoiceStatistics => {
    const allInvoices = invoices;
    const totalInvoices = allInvoices.length;
    const pendingInvoices = allInvoices.filter(inv => inv.status === InvoiceStatus.PENDING).length;
    const paidInvoices = allInvoices.filter(inv => inv.status === InvoiceStatus.PAID || inv.status === InvoiceStatus.EXPORTED).length;
    const overdueInvoices = allInvoices.filter(inv => inv.status === InvoiceStatus.OVERDUE).length;
    
    const totalAmountDue = allInvoices
      .filter(inv => inv.status === InvoiceStatus.PENDING || inv.status === InvoiceStatus.OVERDUE)
      .reduce((sum, inv) => sum + inv.amount, 0);
      
    const totalAmountPaid = allInvoices
      .filter(inv => inv.status === InvoiceStatus.PAID || inv.status === InvoiceStatus.EXPORTED)
      .reduce((sum, inv) => sum + inv.amount, 0);
      
    // Simplified currency breakdown with only EUR
    const currencyBreakdown = {
      [Currency.EUR]: {
        due: totalAmountDue,
        paid: totalAmountPaid
      }
    };
    
    return {
      totalInvoices,
      pendingInvoices,
      paidInvoices,
      overdueInvoices,
      totalAmountDue,
      totalAmountPaid,
      currencyBreakdown
    };
  }, [invoices]);

  const importInvoiceData = useCallback(async (jsonData: string): Promise<boolean> => {
    try {
      const data = JSON.parse(jsonData);
      
      // This function will now just parse the JSON but not save to localStorage
      // In a real implementation, we would add code to import this data to Supabase
      // For now, we'll just update the local state
      
      if (data.invoices && Array.isArray(data.invoices)) {
        setInvoices(data.invoices);
      } else if (data.paidInvoices && data.unpaidInvoices) {
        // If data already has the split format
        const combinedInvoices = [...data.paidInvoices, ...data.unpaidInvoices];
        setInvoices(combinedInvoices);
      }
      
      if (data.clients && Array.isArray(data.clients)) setClients(data.clients);
      if (data.invoiceCategories && Array.isArray(data.invoiceCategories)) setInvoiceCategories(data.invoiceCategories);
      if (data.invoiceBatches && Array.isArray(data.invoiceBatches)) setInvoiceBatches(data.invoiceBatches);
      
      return true;
    } catch (error) { 
      console.error('Error importing invoice data:', error); 
      setError('Failed to import invoice data');
      return false; 
    }
  }, []);

  const exportInvoiceData = useCallback((): string => {
    // This function now exports the current state, not localStorage data
    return JSON.stringify({ 
      invoices, 
      clients, 
      invoiceCategories, 
      invoiceBatches, 
      exportDate: new Date() 
    }, null, 2);
  }, [invoices, clients, invoiceCategories, invoiceBatches]);

  return {
    invoices: getAllInvoices(),
    unpaidInvoices: getUnpaidInvoices(),
    paidInvoices: getPaidInvoices(),
    clients,
    invoiceCategories,
    invoiceBatches,
    currentInvoiceId,
    setCurrentInvoiceId,
    createNewInvoice,
    createNewInvoiceCategory,
    createNewClient,
    updateInvoice,
    updateInvoiceCategory,
    updateClient,
    deleteInvoice,
    deleteInvoiceCategory,
    deleteClient,
    moveInvoiceToCategory,
    searchInvoices,
    filterInvoices,
    exportInvoices,
    markInvoiceAsPaid,
    markInvoiceAsExported,
    processInvoiceNLPCommand,
    getInvoiceStatistics,
    importInvoiceData,
    exportInvoiceData,
    getAllInvoices,
    getUnpaidInvoices,
    getPaidInvoices,
    isLoading,
    error,
  };
};
