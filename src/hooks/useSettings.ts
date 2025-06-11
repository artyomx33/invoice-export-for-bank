import { useState, useEffect, useCallback } from 'react';
import { AppSettings } from '../contexts/AppContext'; // Keep AppSettings from AppContext
import { Currency, ExportFormat } from '../types/Invoice'; // Import types from Invoice.ts

export type ActiveTabType = 'chat' | 'invoices' | 'settings';

// Default settings, mirroring those in AppContext or a central config
const DEFAULT_SETTINGS: AppSettings = {
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
};

const APP_SETTINGS_LOCAL_STORAGE_KEY = 'appSettings';
const ACTIVE_TAB_LOCAL_STORAGE_KEY = 'activeAppTab';

export const useSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const savedSettings = localStorage.getItem(APP_SETTINGS_LOCAL_STORAGE_KEY);
    return savedSettings ? { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) } : DEFAULT_SETTINGS;
  });

  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activeTab, setActiveTabState] = useState<ActiveTabType>(() => {
    const savedTab = localStorage.getItem(ACTIVE_TAB_LOCAL_STORAGE_KEY) as ActiveTabType | null;
    return savedTab || 'invoices'; // Default to 'invoices' or any preferred tab
  });

  // Effect to apply theme based on settings.theme and system preference
  useEffect(() => {
    const applyResolvedTheme = () => {
      let resolvedTheme: 'light' | 'dark';
      if (settings.theme === 'system') {
        resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        resolvedTheme = settings.theme;
      }
      setTheme(resolvedTheme);

      if (resolvedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyResolvedTheme(); // Apply on mount and settings.theme change

    // Listen for system theme changes if 'system' is selected
    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', applyResolvedTheme);
      return () => mediaQuery.removeEventListener('change', applyResolvedTheme);
    }
  }, [settings.theme]);

  // Effect to save settings to localStorage
  useEffect(() => {
    localStorage.setItem(APP_SETTINGS_LOCAL_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Effect to save active tab to localStorage
  useEffect(() => {
    localStorage.setItem(ACTIVE_TAB_LOCAL_STORAGE_KEY, activeTab);
  }, [activeTab]);
  
  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prevSettings => ({ ...prevSettings, ...newSettings }));
  }, []);

  // This specific toggleTheme function updates the setting, which then triggers the useEffect above.
  const toggleTheme = useCallback(() => {
    updateSettings({
      theme: settings.theme === 'light' ? 'dark' : (settings.theme === 'dark' ? 'system' : 'light')
    });
  }, [settings.theme, updateSettings]);
  
  const setActiveTab = useCallback((tab: ActiveTabType) => {
    setActiveTabState(tab);
  }, []);

  return {
    settings,
    updateSettings,
    theme, // This is the resolved theme ('light' or 'dark')
    toggleTheme, // This cycles through light -> dark -> system -> light ...
    activeTab,
    setActiveTab,
  };
};
