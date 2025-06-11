import React, { useState, useContext, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  ChevronLeft, 
  Users, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin,
  X,
  Save,
  UserPlus,
  Filter
} from 'lucide-react';
import { AppContext } from '../contexts/AppContext';
import { Client } from '../types/Invoice';

// Panel type for future extensibility
type PanelType = 'clients' | 'templates' | 'analytics';

interface RightSidebarProps {
  width?: number;
}

const RightSidebar: React.FC<RightSidebarProps> = ({ width = 320 }) => {
  const { 
    activeTab, 
    clients, 
    createNewClient, 
    updateClient, 
    deleteClient 
  } = useContext(AppContext);
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activePanel, setActivePanel] = useState<PanelType>('clients');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [newClient, setNewClient] = useState<Partial<Client> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Only show sidebar for invoices tab initially
  const shouldShow = activeTab === 'invoices';

  // Filter clients based on search term
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.ibanName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.ibanNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Focus search input when panel becomes active
  useEffect(() => {
    if (activePanel === 'clients' && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [activePanel]);

  // Handle client form submission
  const handleClientSubmit = (client: Partial<Client>) => {
    if (editingClient) {
      updateClient({...editingClient, ...client} as Client);
      setEditingClient(null);
    } else if (newClient) {
      createNewClient(client);
      setNewClient(null);
    }
  };

  // Handle client deletion with confirmation
  const handleDeleteClient = (clientId: string) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      deleteClient(clientId);
      if (editingClient?.id === clientId) {
        setEditingClient(null);
      }
    }
  };

  // Client form component
  const ClientForm: React.FC<{
    client: Partial<Client>;
    onSubmit: (client: Partial<Client>) => void;
    onCancel: () => void;
  }> = ({ client, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState<Partial<Client>>(client);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="p-4 space-y-3 bg-gray-50 dark:bg-gray-800 rounded-md">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">{client.id ? 'Edit Client' : 'New Client'}</h3>
          <button 
            type="button" 
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={18} />
          </button>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Client Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name || ''}
            onChange={handleChange}
            className="w-full p-2 text-sm rounded-md bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            IBAN Name
          </label>
          <input
            type="text"
            name="ibanName"
            value={formData.ibanName || ''}
            onChange={handleChange}
            className="w-full p-2 text-sm rounded-md bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            IBAN Number
          </label>
          <input
            type="text"
            name="ibanNumber"
            value={formData.ibanNumber || ''}
            onChange={handleChange}
            className="w-full p-2 text-sm rounded-md bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Default Klantnummer
          </label>
          <input
            type="text"
            name="defaultKlantnummer"
            value={formData.defaultKlantnummer || ''}
            onChange={handleChange}
            className="w-full p-2 text-sm rounded-md bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email || ''}
            onChange={handleChange}
            className="w-full p-2 text-sm rounded-md bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Phone
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone || ''}
            onChange={handleChange}
            className="w-full p-2 text-sm rounded-md bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
          />
        </div>
        
        <div className="flex justify-end space-x-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3 py-1.5 text-sm rounded-md bg-blue-500 text-white hover:bg-blue-600 flex items-center"
          >
            <Save size={16} className="mr-1" /> Save
          </button>
        </div>
      </form>
    );
  };

  // Client list item component
  const ClientListItem: React.FC<{
    client: Client;
    onEdit: () => void;
    onDelete: () => void;
  }> = ({ client, onEdit, onDelete }) => {
    return (
      <div className="p-3 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
        <div className="flex justify-between">
          <div className="font-medium">{client.name}</div>
          <div className="flex space-x-1">
            <button 
              onClick={onEdit}
              className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
              title="Edit"
            >
              <Edit size={16} />
            </button>
            <button 
              onClick={onDelete}
              className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {client.ibanName} • {client.ibanNumber}
        </div>
        {client.email && (
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
            <Mail size={12} className="mr-1" /> {client.email}
          </div>
        )}
        {client.phone && (
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
            <Phone size={12} className="mr-1" /> {client.phone}
          </div>
        )}
      </div>
    );
  };

  // Client Management Panel
  const ClientManagementPanel: React.FC = () => {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-3">Client Management</h2>
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-md bg-gray-100 dark:bg-gray-700 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            onClick={() => setNewClient({})}
            className="w-full mt-3 px-3 py-2 text-sm rounded-md bg-blue-500 text-white hover:bg-blue-600 flex items-center justify-center"
          >
            <UserPlus size={16} className="mr-1" /> Add New Client
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {newClient && (
            <div className="m-3">
              <ClientForm 
                client={newClient} 
                onSubmit={handleClientSubmit} 
                onCancel={() => setNewClient(null)} 
              />
            </div>
          )}
          
          {editingClient && (
            <div className="m-3">
              <ClientForm 
                client={editingClient} 
                onSubmit={handleClientSubmit} 
                onCancel={() => setEditingClient(null)} 
              />
            </div>
          )}
          
          {!newClient && !editingClient && (
            <div>
              {filteredClients.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'No clients match your search' : 'No clients yet. Add your first client!'}
                </div>
              ) : (
                filteredClients.map(client => (
                  <ClientListItem
                    key={client.id}
                    client={client}
                    onEdit={() => setEditingClient(client)}
                    onDelete={() => handleDeleteClient(client.id)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Templates Panel (placeholder for future)
  const TemplatesPanel: React.FC = () => (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-3">Invoice Templates</h2>
      <p className="text-gray-500 dark:text-gray-400">
        This feature will be available soon.
      </p>
    </div>
  );

  // Analytics Panel (placeholder for future)
  const AnalyticsPanel: React.FC = () => (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-3">Invoice Analytics</h2>
      <p className="text-gray-500 dark:text-gray-400">
        This feature will be available soon.
      </p>
    </div>
  );

  // If sidebar should not be shown, return null
  if (!shouldShow) {
    return null;
  }

  return (
    <>
      {/* Collapse/Expand Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute right-0 top-24 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-l-md p-1.5 shadow-sm"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>
      
      {/* Sidebar Content */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-l dark:border-gray-700 bg-white dark:bg-gray-800 h-full flex flex-col overflow-hidden"
          >
            {/* Panel Navigation */}
            <div className="border-b dark:border-gray-700 flex">
              <button
                onClick={() => setActivePanel('clients')}
                className={`flex-1 py-3 text-sm font-medium ${
                  activePanel === 'clients'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 dark:border-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Users size={16} className="inline-block mr-1" /> Clients
              </button>
              <button
                onClick={() => setActivePanel('templates')}
                className={`flex-1 py-3 text-sm font-medium ${
                  activePanel === 'templates'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 dark:border-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Templates
              </button>
              <button
                onClick={() => setActivePanel('analytics')}
                className={`flex-1 py-3 text-sm font-medium ${
                  activePanel === 'analytics'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 dark:border-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Analytics
              </button>
            </div>
            
            {/* Active Panel Content */}
            <div className="flex-1 overflow-hidden">
              {activePanel === 'clients' && <ClientManagementPanel />}
              {activePanel === 'templates' && <TemplatesPanel />}
              {activePanel === 'analytics' && <AnalyticsPanel />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default RightSidebar;
