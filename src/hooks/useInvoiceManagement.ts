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
  PayingCompany
} from '../types/Invoice';
import { ChatFolder } from '../contexts/AppContext'; // Re-using ChatFolder for invoice categories
import { AppSettings, PAYING_COMPANIES } from '../contexts/AppContext'; // For settings dependency

export interface UseInvoiceManagementProps {
  initialUnpaidInvoices?: Invoice[];
  initialPaidInvoices?: Invoice[];
  initialClients?: Client[];
  initialInvoiceCategories?: ChatFolder[];
  initialInvoiceBatches?: BatchExport[];
  settings: AppSettings; // Pass settings from AppProvider
}

export const useInvoiceManagement = ({
  initialUnpaidInvoices = [],
  initialPaidInvoices = [],
  initialClients = [],
  initialInvoiceCategories = [],
  initialInvoiceBatches = [],
  settings,
}: UseInvoiceManagementProps) => {
  const [unpaidInvoices, setUnpaidInvoices] = useState<Invoice[]>(initialUnpaidInvoices);
  const [paidInvoices, setPaidInvoices] = useState<Invoice[]>(initialPaidInvoices);
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [invoiceCategories, setInvoiceCategories] = useState<ChatFolder[]>(initialInvoiceCategories);
  const [invoiceBatches, setInvoiceBatches] = useState<BatchExport[]>(initialInvoiceBatches);
  const [currentInvoiceId, setCurrentInvoiceId] = useState<string | null>(null);

  // Load from localStorage on initial mount
  useEffect(() => {
    const savedUnpaidInvoices = localStorage.getItem('unpaidInvoices');
    if (savedUnpaidInvoices) setUnpaidInvoices(JSON.parse(savedUnpaidInvoices));

    const savedPaidInvoices = localStorage.getItem('paidInvoices');
    if (savedPaidInvoices) setPaidInvoices(JSON.parse(savedPaidInvoices));

    const savedClients = localStorage.getItem('clients');
    if (savedClients) setClients(JSON.parse(savedClients));

    const savedInvoiceCategories = localStorage.getItem('invoiceCategories');
    if (savedInvoiceCategories) setInvoiceCategories(JSON.parse(savedInvoiceCategories));

    const savedInvoiceBatches = localStorage.getItem('invoiceBatches');
    if (savedInvoiceBatches) setInvoiceBatches(JSON.parse(savedInvoiceBatches));
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('unpaidInvoices', JSON.stringify(unpaidInvoices));
  }, [unpaidInvoices]);

  useEffect(() => {
    localStorage.setItem('paidInvoices', JSON.stringify(paidInvoices));
  }, [paidInvoices]);

  useEffect(() => {
    localStorage.setItem('clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('invoiceCategories', JSON.stringify(invoiceCategories));
  }, [invoiceCategories]);

  useEffect(() => {
    localStorage.setItem('invoiceBatches', JSON.stringify(invoiceBatches));
  }, [invoiceBatches]);

  // Helper to get all invoices (combined)
  const getAllInvoices = useCallback((): Invoice[] => {
    return [...unpaidInvoices, ...paidInvoices];
  }, [unpaidInvoices, paidInvoices]);

  // Get only unpaid invoices
  const getUnpaidInvoices = useCallback((): Invoice[] => {
    return unpaidInvoices;
  }, [unpaidInvoices]);

  // Get only paid invoices
  const getPaidInvoices = useCallback((): Invoice[] => {
    return paidInvoices;
  }, [paidInvoices]);

  const generateInvoiceNumber = useCallback((): string => {
    if (!settings.autoGenerateInvoiceNumbers) return '';
    const prefix = settings.invoiceNumberPrefix || 'INV-';
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const regex = new RegExp(`^${prefix}${year}${month}-(\\d+)$`);
    let highestNumber = 0;
    
    // Check both paid and unpaid invoices
    const allInvoices = getAllInvoices();
    allInvoices.forEach(invoice => {
      const match = invoice.factuurNumber.match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > highestNumber) highestNumber = num;
      }
    });
    const newNumber = (highestNumber + 1).toString().padStart(4, '0');
    return `${prefix}${year}${month}-${newNumber}`;
  }, [getAllInvoices, settings.autoGenerateInvoiceNumbers, settings.invoiceNumberPrefix]);

  const createNewInvoice = useCallback((invoiceData?: Partial<Invoice>) => {
    const newInvoice: Invoice = {
      id: uuidv4(),
      amount: invoiceData?.amount || 0,
      ibanName: invoiceData?.ibanName || '',
      ibanNumber: invoiceData?.ibanNumber || '',
      klantnummer: invoiceData?.klantnummer || '',
      factuurNumber: invoiceData?.factuurNumber || generateInvoiceNumber(),
      status: invoiceData?.status || InvoiceStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
      currency: Currency.EUR, // Always use EUR as the currency
      category: invoiceData?.category || undefined,
      description: invoiceData?.description || '',
      dueDate: invoiceData?.dueDate || new Date(Date.now() + settings.defaultDueDays * 24 * 60 * 60 * 1000),
      payingCompany: invoiceData?.payingCompany || PayingCompany.TEDDY_KIDS,
    };
    
    // New invoices always go to unpaid
    setUnpaidInvoices(prev => [newInvoice, ...prev]);
    setCurrentInvoiceId(newInvoice.id);
    return newInvoice; // Return the created invoice
  }, [generateInvoiceNumber, settings.defaultDueDays]);

  const createNewInvoiceCategory = useCallback(() => {
    const newCategory: ChatFolder = { id: uuidv4(), name: 'New Invoice Category', parentId: null, createdAt: new Date() };
    setInvoiceCategories(prev => [...prev, newCategory]);
    return newCategory;
  }, []);

  const createNewClient = useCallback((clientData: Partial<Client>) => {
    const newClient: Client = {
      id: uuidv4(), name: clientData.name || '', ibanName: clientData.ibanName || '', ibanNumber: clientData.ibanNumber || '',
      defaultKlantnummer: clientData.defaultKlantnummer || '', defaultDescription: clientData.defaultDescription || '',
      address: clientData.address || '', email: clientData.email || '', phone: clientData.phone || '',
      createdAt: new Date(), updatedAt: new Date(),
    };
    setClients(prev => [...prev, newClient]);
    return newClient;
  }, []);

  const updateInvoice = useCallback((updatedInvoice: Invoice) => {
    const updatedInvoiceWithTimestamp = { ...updatedInvoice, updatedAt: new Date() };
    
    // Check if invoice status has changed to determine which list it belongs to
    const isPaid = updatedInvoice.status === InvoiceStatus.PAID;
    const isExported = updatedInvoice.status === InvoiceStatus.EXPORTED;
    
    // If invoice is marked as paid or exported, move to paid invoices
    if (isPaid || isExported) {
      // If it was previously in unpaid, remove it
      setUnpaidInvoices(prev => prev.filter(inv => inv.id !== updatedInvoice.id));
      
      // Add to paid invoices if not already there
      setPaidInvoices(prev => {
        const exists = prev.some(inv => inv.id === updatedInvoice.id);
        if (exists) {
          return prev.map(inv => inv.id === updatedInvoice.id ? updatedInvoiceWithTimestamp : inv);
        } else {
          return [updatedInvoiceWithTimestamp, ...prev];
        }
      });
    } else {
      // If invoice is not paid or exported, it belongs in unpaid
      
      // If it was previously in paid, remove it
      setPaidInvoices(prev => prev.filter(inv => inv.id !== updatedInvoice.id));
      
      // Update or add to unpaid invoices
      setUnpaidInvoices(prev => {
        const exists = prev.some(inv => inv.id === updatedInvoice.id);
        if (exists) {
          return prev.map(inv => inv.id === updatedInvoice.id ? updatedInvoiceWithTimestamp : inv);
        } else {
          return [updatedInvoiceWithTimestamp, ...prev];
        }
      });
    }
  }, []);

  const updateInvoiceCategory = useCallback((updatedCategory: ChatFolder) => {
    setInvoiceCategories(prev => prev.map(cat => cat.id === updatedCategory.id ? updatedCategory : cat));
  }, []);

  const updateClient = useCallback((updatedClient: Client) => {
    setClients(prev => prev.map(client => client.id === updatedClient.id ? { ...updatedClient, updatedAt: new Date() } : client));
  }, []);

  const deleteInvoice = useCallback((id: string) => {
    // Check both lists and remove from the appropriate one
    setUnpaidInvoices(prev => prev.filter(inv => inv.id !== id));
    setPaidInvoices(prev => prev.filter(inv => inv.id !== id));
    
    // Update current invoice ID if needed
    if (currentInvoiceId === id) {
      const allInvoices = getAllInvoices();
      setCurrentInvoiceId(allInvoices.length > 1 ? allInvoices[0].id : null);
    }
  }, [currentInvoiceId, getAllInvoices]);

  const deleteInvoiceCategory = useCallback((id: string) => {
    // Update both paid and unpaid invoices
    setUnpaidInvoices(prev => prev.map(inv => inv.category === id ? { ...inv, category: undefined } : inv));
    setPaidInvoices(prev => prev.map(inv => inv.category === id ? { ...inv, category: undefined } : inv));
    
    setInvoiceCategories(prev => prev.filter(cat => cat.id !== id));
  }, []);

  const deleteClient = useCallback((id: string) => {
    setClients(prev => prev.filter(client => client.id !== id));
  }, []);

  const moveInvoiceToCategory = useCallback((invoiceId: string, categoryId: string | null) => {
    // Check both lists and update the appropriate one
    setUnpaidInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, category: categoryId || undefined, updatedAt: new Date() } : inv));
    setPaidInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, category: categoryId || undefined, updatedAt: new Date() } : inv));
  }, []);

  const searchInvoices = useCallback((query: string): Invoice[] => {
    if (!query.trim()) return getAllInvoices();
    
    const lowerQuery = query.toLowerCase();
    const allInvoices = getAllInvoices();
    
    return allInvoices.filter(inv =>
      inv.factuurNumber.toLowerCase().includes(lowerQuery) ||
      inv.ibanName.toLowerCase().includes(lowerQuery) ||
      inv.ibanNumber.toLowerCase().includes(lowerQuery) ||
      inv.klantnummer.toLowerCase().includes(lowerQuery) ||
      inv.description?.toLowerCase().includes(lowerQuery)
    );
  }, [getAllInvoices]);

  const filterInvoices = useCallback((filters: InvoiceFilters): Invoice[] => {
    const allInvoices = getAllInvoices();
    
    return allInvoices.filter(inv => {
      if (filters.status && filters.status.length > 0 && !filters.status.includes(inv.status)) return false;
      if (filters.dateRange) {
        const invoiceDate = new Date(inv.createdAt);
        if (invoiceDate < filters.dateRange.start || invoiceDate > filters.dateRange.end) return false;
      }
      if (filters.minAmount !== undefined && inv.amount < filters.minAmount) return false;
      if (filters.maxAmount !== undefined && inv.amount > filters.maxAmount) return false;
      if (filters.client && inv.ibanName.toLowerCase() !== filters.client.toLowerCase()) return false;
      if (filters.category && inv.category !== filters.category) return false;
      return true;
    });
  }, [getAllInvoices]);

  const markInvoiceAsPaid = useCallback((invoiceId: string, paymentDate: Date = new Date()) => {
    // Find the invoice in unpaid invoices
    const invoice = unpaidInvoices.find(inv => inv.id === invoiceId);
    
    if (invoice) {
      // Remove from unpaid invoices
      setUnpaidInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
      
      // Add to paid invoices with updated status
      const updatedInvoice: Invoice = {
        ...invoice,
        status: InvoiceStatus.PAID,
        paymentDate,
        updatedAt: new Date()
      };
      
      setPaidInvoices(prev => [updatedInvoice, ...prev]);
    }
  }, [unpaidInvoices]);

  const markInvoiceAsExported = useCallback((invoiceId: string, batchId: string, format: ExportFormat) => {
    // Find the invoice in unpaid invoices
    const invoice = unpaidInvoices.find(inv => inv.id === invoiceId);
    
    if (invoice) {
      // Remove from unpaid invoices
      setUnpaidInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
      
      // Add to paid invoices with updated status (EXPORTED invoices are now considered PAID)
      const updatedInvoice: Invoice = {
        ...invoice,
        status: InvoiceStatus.EXPORTED, // Keep as EXPORTED for tracking purposes
        exportedAt: new Date(),
        exportFormat: format,
        batchId,
        paymentDate: new Date(), // Add payment date since it's considered paid
        updatedAt: new Date()
      };
      
      setPaidInvoices(prev => [updatedInvoice, ...prev]);
    }
  }, [unpaidInvoices]);
  
  const generateSEPAXML = useCallback((invoicesToExport: Invoice[]): string => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const timestamp = today.toISOString();
    
    // Group invoices by paying company
    const invoicesByCompany = invoicesToExport.reduce((acc, invoice) => {
      const companyId = invoice.payingCompany || 'teddy-kids'; // Default to teddy-kids
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
    // Find invoices in both lists
    const allInvoices = getAllInvoices();
    const selectedInvoices = allInvoices.filter(inv => invoiceIds.includes(inv.id));
    
    const batchId = uuidv4();
    const fileName = `export-${format}-${new Date().toISOString().slice(0, 10)}`;
    const totalAmount = selectedInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const batch: BatchExport = { id: batchId, format, invoiceIds, fileName, timestamp: new Date(), totalAmount, currency: Currency.EUR };
    setInvoiceBatches(prev => [...prev, batch]);
    
    // Mark all selected invoices as exported (which also marks them as paid)
    selectedInvoices.forEach(inv => markInvoiceAsExported(inv.id, batchId, format));
    
    if (format === ExportFormat.SEPA_XML) return generateSEPAXML(selectedInvoices);
    if (format === ExportFormat.CSV) return generateCSV(selectedInvoices);
    if (format === ExportFormat.JSON) return JSON.stringify(selectedInvoices, null, 2);
    return '';
  }, [getAllInvoices, generateSEPAXML, generateCSV, markInvoiceAsExported]);

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
    const allInvoices = getAllInvoices();
    const totalInvoices = allInvoices.length;
    const pendingInvoices = unpaidInvoices.filter(inv => inv.status === InvoiceStatus.PENDING).length;
    const paidInvoices = paidInvoices.length;
    const overdueInvoices = unpaidInvoices.filter(inv => inv.status === InvoiceStatus.OVERDUE).length;
    
    const totalAmountDue = unpaidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalAmountPaid = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
      
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
  }, [getAllInvoices, paidInvoices, unpaidInvoices]);

  const importInvoiceData = useCallback(async (jsonData: string): Promise<boolean> => {
    try {
      const data = JSON.parse(jsonData);
      
      // Split imported invoices into paid and unpaid
      if (data.invoices && Array.isArray(data.invoices)) {
        const paid = data.invoices.filter(inv => inv.status === InvoiceStatus.PAID || inv.status === InvoiceStatus.EXPORTED);
        const unpaid = data.invoices.filter(inv => inv.status !== InvoiceStatus.PAID && inv.status !== InvoiceStatus.EXPORTED);
        
        setPaidInvoices(paid);
        setUnpaidInvoices(unpaid);
      } else if (data.paidInvoices && data.unpaidInvoices) {
        // If data already has the split format
        setPaidInvoices(data.paidInvoices);
        setUnpaidInvoices(data.unpaidInvoices);
      }
      
      if (data.clients && Array.isArray(data.clients)) setClients(data.clients);
      if (data.invoiceCategories && Array.isArray(data.invoiceCategories)) setInvoiceCategories(data.invoiceCategories);
      if (data.invoiceBatches && Array.isArray(data.invoiceBatches)) setInvoiceBatches(data.invoiceBatches);
      
      return true;
    } catch (error) { 
      console.error('Error importing invoice data:', error); 
      return false; 
    }
  }, []);

  const exportInvoiceData = useCallback((): string => {
    return JSON.stringify({ 
      paidInvoices, 
      unpaidInvoices, 
      clients, 
      invoiceCategories, 
      invoiceBatches, 
      exportDate: new Date() 
    }, null, 2);
  }, [paidInvoices, unpaidInvoices, clients, invoiceCategories, invoiceBatches]);

  return {
    invoices: getAllInvoices(), // For backward compatibility
    paidInvoices: getPaidInvoices(),
    unpaidInvoices: getUnpaidInvoices(),
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
  };
};
