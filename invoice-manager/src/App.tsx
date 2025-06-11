import { useState } from 'react';
import { FileDown, Filter, Plus, Search, Settings as SettingsIcon, FileText, Users } from 'lucide-react';
import { format } from 'date-fns';

// Mock data for testing
const MOCK_COMPANIES = [
  { id: '1', name: 'Teddy Kids B.V.', iban: 'NL91ABNA0417164300', bic: 'ABNANL2A', address: 'Amsterdam, Netherlands', vat_number: 'NL123456789B01' },
  { id: '2', name: 'TISA - Teddy Kids B.V.', iban: 'NL29INGB0123456789', bic: 'INGBNL2A', address: 'Amsterdam, Netherlands', vat_number: 'NL987654321B01' },
  { id: '3', name: 'Teddy Kids Daycare', iban: 'NL39RABO0300065264', bic: 'RABONL2U', address: 'Amsterdam, Netherlands', vat_number: 'NL456789123B01' },
  { id: '4', name: 'Teddy\'s Cafe B.V.', iban: 'NL20TRIO0786543210', bic: 'TRIONL2U', address: 'Amsterdam, Netherlands', vat_number: 'NL321654987B01' }
];

const MOCK_CLIENTS = [
  { id: '1', name: 'Acme Corp', email: 'billing@acmecorp.com', phone: '+1 (555) 123-4567', address: '123 Main St, Anytown, CA 94001', iban: 'NL91ABNA0417164300', bic: 'ABNANL2A' },
  { id: '2', name: 'Globex Inc', email: 'accounts@globex.com', phone: '+1 (555) 987-6543', address: '456 Oak Ave, Somewhere, NY 10001', iban: 'DE89370400440532013000', bic: 'DEUTDEFF' },
  { id: '3', name: 'Initech LLC', email: 'finance@initech.com', phone: '+1 (555) 246-8102', address: '789 Pine Rd, Nowhere, TX 75001', iban: 'FR7630006000011234567890189', bic: 'BNPAFRPP' }
];

const MOCK_INVOICES = [
  { id: '1', invoice_number: 'INV-2025-001', client_id: '1', company_id: '1', amount: 1500.00, issue_date: '2025-05-15', due_date: '2025-06-15', status: 'pending', notes: 'Monthly service fee' },
  { id: '2', invoice_number: 'INV-2025-002', client_id: '2', company_id: '2', amount: 2750.50, issue_date: '2025-05-20', due_date: '2025-06-20', status: 'paid', notes: 'Consulting services' },
  { id: '3', invoice_number: 'INV-2025-003', client_id: '3', company_id: '1', amount: 950.25, issue_date: '2025-05-25', due_date: '2025-06-10', status: 'overdue', notes: 'Software license' },
  { id: '4', invoice_number: 'INV-2025-004', client_id: '1', company_id: '3', amount: 3200.00, issue_date: '2025-06-01', due_date: '2025-07-01', status: 'pending', notes: 'Project milestone payment' },
  { id: '5', invoice_number: 'INV-2025-005', client_id: '2', company_id: '4', amount: 1800.75, issue_date: '2025-06-05', due_date: '2025-07-05', status: 'paid', notes: 'Monthly retainer' }
];

function App() {
  // Tab state
  const [activeTab, setActiveTab] = useState('invoices');
  const [invoiceTab, setInvoiceTab] = useState('unpaid');
  
  // Data states
  const [invoices] = useState(MOCK_INVOICES);
  const [clients] = useState(MOCK_CLIENTS);
  const [companies] = useState(MOCK_COMPANIES);
  const [filteredInvoices, setFilteredInvoices] = useState(MOCK_INVOICES);
  
  // Filter states
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter invoices based on status, company and search query
  const filterInvoices = (
    allInvoices, 
    status, 
    company, 
    query
  ) => {
    let filtered = [...allInvoices];
    
    // Filter by status
    if (status === 'paid') {
      filtered = filtered.filter(inv => inv.status === 'paid');
    } else if (status === 'unpaid') {
      filtered = filtered.filter(inv => inv.status === 'pending' || inv.status === 'overdue');
    }
    
    // Filter by company
    if (company !== 'all') {
      filtered = filtered.filter(inv => inv.company_id === company);
    }
    
    // Filter by search query
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(inv => {
        // Find client name
        const client = clients.find(c => c.id === inv.client_id);
        const clientName = client ? client.name.toLowerCase() : '';
        
        return (
          inv.invoice_number.toLowerCase().includes(lowerQuery) ||
          clientName.includes(lowerQuery)
        );
      });
    }
    
    setFilteredInvoices(filtered);
  };
  
  // Effect to update filtered invoices when filters change
  useState(() => {
    filterInvoices(invoices, invoiceTab, selectedCompany, searchQuery);
  }, [invoiceTab, selectedCompany, searchQuery]);
  
  // Handler functions
  const handleCreateInvoice = () => {
    alert('Create invoice functionality will be implemented soon');
  };
  
  const handleEditInvoice = (invoice) => {
    alert(`Edit invoice ${invoice.invoice_number}`);
  };
  
  const handleCreateClient = () => {
    alert('Create client functionality will be implemented soon');
  };
  
  const handleEditClient = (client) => {
    alert(`Edit client ${client.name}`);
  };
  
  const handleExportSEPA = () => {
    alert('SEPA export functionality will be implemented soon');
  };
  
  // Render client name from ID
  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Unknown Client';
  };
  
  // Render company name from ID
  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : 'Unknown Company';
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-blue-600">Teddy Kids Invoice Manager</h1>
            </div>
            
            <nav className="flex space-x-4 items-center">
              <button 
                className={`px-3 py-2 rounded-md ${activeTab === 'invoices' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setActiveTab('invoices')}
              >
                <div className="flex items-center gap-2">
                  <FileText size={18} />
                  Invoices
                </div>
              </button>
              <button 
                className={`px-3 py-2 rounded-md ${activeTab === 'clients' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setActiveTab('clients')}
              >
                <div className="flex items-center gap-2">
                  <Users size={18} />
                  Clients
                </div>
              </button>
              <button 
                className={`px-3 py-2 rounded-md ${activeTab === 'settings' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setActiveTab('settings')}
              >
                <div className="flex items-center gap-2">
                  <SettingsIcon size={18} />
                  Settings
                </div>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="bg-white shadow rounded-lg">
            {/* Invoice Tab Header */}
            <div className="border-b border-gray-200">
              <div className="flex justify-between items-center p-4">
                <div className="flex space-x-2">
                  <button 
                    className={`px-3 py-1.5 rounded-md ${invoiceTab === 'unpaid' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                    onClick={() => {
                      setInvoiceTab('unpaid');
                      filterInvoices(invoices, 'unpaid', selectedCompany, searchQuery);
                    }}
                  >
                    Unpaid
                  </button>
                  <button 
                    className={`px-3 py-1.5 rounded-md ${invoiceTab === 'paid' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                    onClick={() => {
                      setInvoiceTab('paid');
                      filterInvoices(invoices, 'paid', selectedCompany, searchQuery);
                    }}
                  >
                    Paid
                  </button>
                  <button 
                    className={`px-3 py-1.5 rounded-md ${invoiceTab === 'all' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                    onClick={() => {
                      setInvoiceTab('all');
                      filterInvoices(invoices, 'all', selectedCompany, searchQuery);
                    }}
                  >
                    All
                  </button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <select
                      className="appearance-none bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pr-8"
                      value={selectedCompany}
                      onChange={(e) => {
                        setSelectedCompany(e.target.value);
                        filterInvoices(invoices, invoiceTab, e.target.value, searchQuery);
                      }}
                    >
                      <option value="all">All Companies</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <Filter size={16} />
                    </div>
                  </div>
                  
                  <div className="relative">
                    <input
                      type="text"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pl-10"
                      placeholder="Search invoices..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        filterInvoices(invoices, invoiceTab, selectedCompany, e.target.value);
                      }}
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Search size={16} className="text-gray-500" />
                    </div>
                  </div>
                  
                  <button
                    onClick={handleExportSEPA}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FileDown size={16} className="mr-1" />
                    SEPA Export
                  </button>
                  
                  <button
                    onClick={handleCreateInvoice}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Plus size={16} className="mr-1" />
                    New Invoice
                  </button>
                </div>
              </div>
            </div>
            
            {/* Invoice Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 invoice-table">
                <thead>
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                        No invoices found
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {invoice.invoice_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getClientName(invoice.client_id)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getCompanyName(invoice.company_id)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          €{invoice.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(invoice.issue_date), 'dd/MM/yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(invoice.due_date), 'dd/MM/yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 
                              invoice.status === 'overdue' ? 'bg-red-100 text-red-800' : 
                              'bg-yellow-100 text-yellow-800'}`}>
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => handleEditInvoice(invoice)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Clients Tab */}
        {activeTab === 'clients' && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Clients</h2>
              <button
                onClick={handleCreateClient}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus size={16} className="mr-1" />
                New Client
              </button>
            </div>
            
            {/* Clients Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IBAN
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clients.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        No clients found
                      </td>
                    </tr>
                  ) : (
                    clients.map((client) => (
                      <tr key={client.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {client.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {client.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {client.phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {client.iban}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => handleEditClient(client)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Settings</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Companies</h3>
                <p className="text-sm text-gray-500 mb-4">Manage your company information for invoices</p>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  {companies.map((company) => (
                    <div key={company.id} className="mb-4 p-4 border border-gray-200 rounded-lg bg-white">
                      <h4 className="font-medium">{company.name}</h4>
                      <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                        <div>
                          <p className="text-gray-500">IBAN</p>
                          <p>{company.iban}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">BIC</p>
                          <p>{company.bic}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">VAT Number</p>
                          <p>{company.vat_number}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Address</p>
                          <p>{company.address}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium">Export Settings</h3>
                <p className="text-sm text-gray-500 mb-4">Configure your SEPA export preferences</p>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700">
                    SEPA export functionality allows you to generate XML files compatible with your bank's import system.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
