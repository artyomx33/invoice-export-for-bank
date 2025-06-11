import React, { useState, useEffect, createContext } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { X } from 'lucide-react'; // Keep one icon for testing settings toggle
import { AnimatePresence, motion } from 'framer-motion'; // Keep for settings modal animation

// Simplified Types for MinimalApp
interface MinimalAppSettings {
  theme: 'light' | 'dark' | 'system';
  // Add other essential settings if needed for basic rendering, otherwise keep minimal
}

interface MinimalAppContextType {
  settings: MinimalAppSettings;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  updateSettings: (settings: Partial<MinimalAppSettings>) => void;
  // Add other essential context values if needed, otherwise keep minimal
  // For example, if child placeholders need access to something specific
  currentConversationId: string | null; // Example, might not be strictly needed for placeholders
  setCurrentConversationId: (id: string | null) => void; // Example
}

// Simplified Context
export const AppContext = createContext<MinimalAppContextType>({
  settings: {
    theme: 'system',
  },
  theme: 'light',
  toggleTheme: () => {},
  updateSettings: () => {},
  currentConversationId: null,
  setCurrentConversationId: () => {},
});

const MinimalApp: React.FC = () => {
  const [settings, setSettings] = useState<MinimalAppSettings>({
    theme: 'system',
  });
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showSettings, setShowSettings] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);


  // Initialize theme based on system preference & saved settings
  useEffect(() => {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const savedThemeSetting = settings.theme; // Assuming settings are loaded or defaulted
    
    if (savedThemeSetting === 'system') {
      setTheme(systemTheme);
    } else {
      setTheme(savedThemeSetting as 'light' | 'dark');
    }
  }, [settings.theme]);

  // Update theme in DOM
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Persist theme choice if desired (e.g., in localStorage or settings object)
    // For this minimal app, we'll just update the settings object in memory
    updateSettings({ theme: theme });
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const updateSettings = (newSettings: Partial<MinimalAppSettings>) => {
    setSettings(prevSettings => ({ ...prevSettings, ...newSettings }));
  };
  
  // Placeholder components
  const SidebarPlaceholder: React.FC = () => (
    <div className="w-72 h-full bg-gray-100 dark:bg-gray-800 border-r dark:border-gray-700 p-4">
      Sidebar Placeholder
      <button onClick={toggleTheme} className="mt-4 p-2 bg-blue-500 text-white rounded">
        Toggle Theme (Current: {theme})
      </button>
      <button onClick={() => setShowSettings(true)} className="mt-4 p-2 bg-green-500 text-white rounded">
        Open Settings
      </button>
    </div>
  );

  const ChatAreaPlaceholder: React.FC = () => (
    <div className="flex-1 h-full bg-white dark:bg-gray-900 p-4">
      Chat Area Placeholder
      <p>Current Conversation ID: {currentConversationId || 'None'}</p>
      <button onClick={() => setCurrentConversationId('test-id-123')} className="mt-4 p-2 bg-yellow-500 text-black rounded">
        Set Test Conversation
      </button>
    </div>
  );

  const SettingsPanelPlaceholder: React.FC = () => (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-2">Minimal Settings Panel</h3>
      <p>Theme: {settings.theme}</p>
      <button onClick={() => updateSettings({theme: 'light'})} className="mr-2 p-1 bg-gray-200 rounded">Light</button>
      <button onClick={() => updateSettings({theme: 'dark'})} className="mr-2 p-1 bg-gray-700 text-white rounded">Dark</button>
      <button onClick={() => updateSettings({theme: 'system'})} className="p-1 bg-gray-400 rounded">System</button>
    </div>
  );


  return (
    <AppContext.Provider value={{
      settings,
      theme,
      toggleTheme,
      updateSettings,
      currentConversationId,
      setCurrentConversationId,
    }}>
      <DndProvider backend={HTML5Backend}>
        {/* Hidden button to trigger settings modal programmatically */}
        <button
          data-settings-button // Keep this for consistency if ChatArea/Sidebar try to use it
          onClick={() => setShowSettings(prev => !prev)}
          style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}
          aria-hidden="true"
          tabIndex={-1}
        >
          Toggle Settings
        </button>

        <div className={`h-screen flex bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden`}>
          <SidebarPlaceholder />
          <ChatAreaPlaceholder />
          
          <AnimatePresence>
            {showSettings && (
              <motion.div 
                className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSettings(false)} // Close modal on overlay click
              >
                <motion.div 
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden max-w-md w-full" // Simplified width
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
                >
                  <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-semibold">Settings</h2>
                    <button 
                      onClick={() => setShowSettings(false)}
                      className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className="p-4"> {/* Content area for settings */}
                    <SettingsPanelPlaceholder />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DndProvider>
    </AppContext.Provider>
  );
}

export default MinimalApp;
