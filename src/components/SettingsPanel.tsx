import React, { useState, useContext, useRef, useEffect } from 'react';
import { AppContext, AppSettings } from '../contexts/AppContext';
import { ChatConversation as Conversation } from '../contexts/AppContext';
import { X, Save, Upload, Download, Check, AlertCircle, Info, Volume2, Mic, Moon, Sun, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

// Colors for charts
const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const SettingsPanel: React.FC = () => {
  const {
    settings,
    updateSettings,
    chatConversations,
    theme,
    toggleTheme
  } = useContext(AppContext);

  // Local state
  const [localSettings, setLocalSettings] = useState<AppSettings>({ ...settings });
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'api' | 'analytics' | 'audio' | 'about'>('general');
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset success message after delay
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  // Handle settings change
  const handleChange = (key: keyof AppSettings, value: any) => {
    setLocalSettings({ ...localSettings, [key]: value });
  };

  // Save settings
  const saveSettings = () => {
    setIsSaving(true);
    // Simulate API delay
    setTimeout(() => {
      updateSettings(localSettings);
      setIsSaving(false);
      setSaveSuccess(true);
    }, 500);
  };

  // Export settings
  const exportSettings = () => {
    const settingsData = JSON.stringify(settings, null, 2);
    const blob = new Blob([settingsData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `factory-chat-settings-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import settings
  const importSettings = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedSettings = JSON.parse(event.target?.result as string);
        
        // Validate imported settings
        const requiredKeys: (keyof AppSettings)[] = [
          'theme', 'chatApiKey', 'defaultChatModel', 'autoSaveChatDrafts', 
          'showChatTypingIndicator', 'enableKeyboardShortcuts', 'enableAnalytics'
        ];
        
        const missingKeys = requiredKeys.filter(key => !(key in importedSettings));
        
        if (missingKeys.length > 0) {
          setImportError(`Invalid settings file. Missing: ${missingKeys.join(', ')}`);
          return;
        }
        
        setLocalSettings(importedSettings);
        updateSettings(importedSettings);
        setSaveSuccess(true);
      } catch (error) {
        setImportError('Invalid settings file format');
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Generate analytics data
  const generateAnalytics = () => {
    // Token usage by day
    const today = new Date();
    const last7Days = eachDayOfInterval({
      start: subDays(today, 6),
      end: today
    });
    
    const tokenUsageByDay = last7Days.map(day => {
      const dateString = format(day, 'yyyy-MM-dd');
      const dayConversations = chatConversations.filter(conv => 
        format(new Date(conv.updatedAt), 'yyyy-MM-dd') === dateString
      );
      
      const tokens = dayConversations.reduce((sum, conv) => 
        sum + (conv.statistics?.totalTokens || 0), 0
      );
      
      return {
        date: format(day, 'MMM d'),
        tokens
      };
    });
    
    // Message count by type
    const messageTypes = {
      user: 0,
      assistant: 0,
      system: 0
    };
    
    chatConversations.forEach(conv => {
      conv.messages.forEach(msg => {
        if (msg.role in messageTypes) {
          messageTypes[msg.role as keyof typeof messageTypes]++;
        }
      });
    });
    
    const messageCountByType = Object.entries(messageTypes).map(([type, count]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      count
    }));
    
    // Conversation activity by hour
    const activityByHour = Array(24).fill(0).map((_, i) => ({
      hour: i,
      count: 0
    }));
    
    chatConversations.forEach(conv => {
      conv.messages.forEach(msg => {
        const hour = new Date(msg.timestamp).getHours();
        activityByHour[hour].count++;
      });
    });
    
    // Model usage distribution
    const modelUsage: Record<string, number> = {};
    chatConversations.forEach(conv => {
      const model = conv.model;
      modelUsage[model] = (modelUsage[model] || 0) + 1;
    });
    
    const modelUsageData = Object.entries(modelUsage).map(([model, count]) => ({
      model,
      count
    }));
    
    return {
      tokenUsageByDay,
      messageCountByType,
      activityByHour,
      modelUsageData,
      totalTokens: chatConversations.reduce((sum, conv) => 
        sum + (conv.statistics?.totalTokens || 0), 0
      ),
      totalMessages: chatConversations.reduce((sum, conv) => 
        sum + (conv.messages.length || 0), 0
      ),
      totalConversations: chatConversations.length
    };
  };

  const analytics = generateAnalytics();

  return (
    <div className="h-full bg-white dark:bg-gray-900 w-80 flex flex-col border-l dark:border-gray-700">
      {/* Header */}
      <div className="p-3 border-b dark:border-gray-700 flex items-center justify-between">
        <h2 className="font-medium">Settings</h2>
        <button className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
          <X size={18} />
        </button>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b dark:border-gray-700">
        <button
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === 'general' ? 'border-b-2 border-blue-500' : 'text-gray-500 dark:text-gray-400'
          }`}
          onClick={() => setActiveTab('general')}
        >
          General
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === 'api' ? 'border-b-2 border-blue-500' : 'text-gray-500 dark:text-gray-400'
          }`}
          onClick={() => setActiveTab('api')}
        >
          API
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === 'analytics' ? 'border-b-2 border-blue-500' : 'text-gray-500 dark:text-gray-400'
          }`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === 'audio' ? 'border-b-2 border-blue-500' : 'text-gray-500 dark:text-gray-400'
          }`}
          onClick={() => setActiveTab('audio')}
        >
          Audio
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === 'about' ? 'border-b-2 border-blue-500' : 'text-gray-500 dark:text-gray-400'
          }`}
          onClick={() => setActiveTab('about')}
        >
          About
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          {activeTab === 'general' && (
            <motion.div
              key="general"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-6">
                {/* Theme Settings */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Theme</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleChange('theme', 'light')}
                      className={`flex-1 p-2 rounded-md flex flex-col items-center ${
                        localSettings.theme === 'light' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : 'bg-gray-100 dark:bg-gray-800'
                      }`}
                    >
                      <Sun size={20} className="mb-1" />
                      <span className="text-xs">Light</span>
                    </button>
                    <button
                      onClick={() => handleChange('theme', 'dark')}
                      className={`flex-1 p-2 rounded-md flex flex-col items-center ${
                        localSettings.theme === 'dark' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : 'bg-gray-100 dark:bg-gray-800'
                      }`}
                    >
                      <Moon size={20} className="mb-1" />
                      <span className="text-xs">Dark</span>
                    </button>
                    <button
                      onClick={() => handleChange('theme', 'system')}
                      className={`flex-1 p-2 rounded-md flex flex-col items-center ${
                        localSettings.theme === 'system' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : 'bg-gray-100 dark:bg-gray-800'
                      }`}
                    >
                      <Monitor size={20} className="mb-1" />
                      <span className="text-xs">System</span>
                    </button>
                  </div>
                </div>
                
                {/* Model Selection */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Default Model</h3>
                  <select
                    value={localSettings.defaultChatModel}
                    onChange={(e) => handleChange('defaultChatModel', e.target.value)}
                    className="w-full p-2 rounded-md bg-gray-100 dark:bg-gray-800 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  </select>
                </div>
                
                {/* Feature Toggles */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Features</h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <span className="text-sm">Auto-save drafts</span>
                      <div
                        className={`w-10 h-5 rounded-full relative cursor-pointer ${
                          localSettings.autoSaveChatDrafts ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                        onClick={() => handleChange('autoSaveChatDrafts', !localSettings.autoSaveChatDrafts)}
                      >
                        <div
                          className={`w-4 h-4 rounded-full absolute top-0.5 transition-all ${
                            localSettings.autoSaveChatDrafts ? 'right-0.5 bg-white' : 'left-0.5 bg-white'
                          }`}
                        />
                      </div>
                    </label>
                    
                    <label className="flex items-center justify-between">
                      <span className="text-sm">Show typing indicator</span>
                      <div
                        className={`w-10 h-5 rounded-full relative cursor-pointer ${
                          localSettings.showChatTypingIndicator ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                        onClick={() => handleChange('showChatTypingIndicator', !localSettings.showChatTypingIndicator)}
                      >
                        <div
                          className={`w-4 h-4 rounded-full absolute top-0.5 transition-all ${
                            localSettings.showChatTypingIndicator ? 'right-0.5 bg-white' : 'left-0.5 bg-white'
                          }`}
                        />
                      </div>
                    </label>
                    
                    <label className="flex items-center justify-between">
                      <span className="text-sm">Enable keyboard shortcuts</span>
                      <div
                        className={`w-10 h-5 rounded-full relative cursor-pointer ${
                          localSettings.enableKeyboardShortcuts ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                        onClick={() => handleChange('enableKeyboardShortcuts', !localSettings.enableKeyboardShortcuts)}
                      >
                        <div
                          className={`w-4 h-4 rounded-full absolute top-0.5 transition-all ${
                            localSettings.enableKeyboardShortcuts ? 'right-0.5 bg-white' : 'left-0.5 bg-white'
                          }`}
                        />
                      </div>
                    </label>
                    
                    <label className="flex items-center justify-between">
                      <span className="text-sm">Enable analytics</span>
                      <div
                        className={`w-10 h-5 rounded-full relative cursor-pointer ${
                          localSettings.enableAnalytics ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                        onClick={() => handleChange('enableAnalytics', !localSettings.enableAnalytics)}
                      >
                        <div
                          className={`w-4 h-4 rounded-full absolute top-0.5 transition-all ${
                            localSettings.enableAnalytics ? 'right-0.5 bg-white' : 'left-0.5 bg-white'
                          }`}
                        />
                      </div>
                    </label>
                  </div>
                </div>
                
                {/* Export/Import Settings */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Backup & Restore</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={exportSettings}
                      className="flex-1 p-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center"
                    >
                      <Download size={16} className="mr-1" />
                      <span className="text-sm">Export</span>
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 p-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center"
                    >
                      <Upload size={16} className="mr-1" />
                      <span className="text-sm">Import</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={importSettings}
                      className="hidden"
                    />
                  </div>
                  
                  {importError && (
                    <div className="mt-2 p-2 rounded-md bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs flex items-start">
                      <AlertCircle size={14} className="mr-1 flex-shrink-0 mt-0.5" />
                      <span>{importError}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
          
          {activeTab === 'api' && (
            <motion.div
              key="api"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-6">
                {/* API Key */}
                <div>
                  <h3 className="text-sm font-medium mb-2">OpenAI API Key</h3>
                  <div className="relative">
                    <input
                      type={apiKeyVisible ? 'text' : 'password'}
                      value={localSettings.chatApiKey}
                      onChange={(e) => handleChange('chatApiKey', e.target.value)}
                      placeholder="Enter your OpenAI API key"
                      className="w-full p-2 pr-10 rounded-md bg-gray-100 dark:bg-gray-800 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => setApiKeyVisible(!apiKeyVisible)}
                      className="absolute right-2 top-2 text-gray-500"
                    >
                      {apiKeyVisible ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Your API key is stored locally and never sent to our servers.
                  </p>
                </div>
                
                {/* API Usage */}
                <div>
                  <h3 className="text-sm font-medium mb-2">API Usage</h3>
                  <div className="p-3 rounded-md bg-gray-100 dark:bg-gray-800">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs">Total tokens used</span>
                      <span className="text-xs font-medium">{analytics.totalTokens.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs">Estimated cost</span>
                      <span className="text-xs font-medium">
                        ${(analytics.totalTokens / 1000 * 0.01).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs">Total messages</span>
                      <span className="text-xs font-medium">{analytics.totalMessages.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                {/* Rate Limits */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Rate Limits</h3>
                  <div className="p-3 rounded-md bg-gray-100 dark:bg-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      OpenAI enforces rate limits on API requests. If you encounter errors, you may need to wait before making additional requests.
                    </p>
                    <a
                      href="https://platform.openai.com/docs/guides/rate-limits"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline mt-1 inline-block"
                    >
                      Learn more about rate limits
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-6">
                {/* Overview */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Overview</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 rounded-md bg-gray-100 dark:bg-gray-800">
                      <div className="text-2xl font-bold">{analytics.totalConversations}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Conversations</div>
                    </div>
                    <div className="p-3 rounded-md bg-gray-100 dark:bg-gray-800">
                      <div className="text-2xl font-bold">{analytics.totalMessages}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Messages</div>
                    </div>
                    <div className="p-3 rounded-md bg-gray-100 dark:bg-gray-800">
                      <div className="text-2xl font-bold">{analytics.totalTokens.toLocaleString()}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Tokens</div>
                    </div>
                  </div>
                </div>
                
                {/* Token Usage Chart */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Token Usage (Last 7 Days)</h3>
                  <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-md p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.tokenUsageByDay}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                            borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                            color: theme === 'dark' ? '#f9fafb' : '#111827'
                          }}
                        />
                        <Bar dataKey="tokens" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Message Types */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Message Distribution</h3>
                  <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-md p-2 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.messageCountByType}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={5}
                          dataKey="count"
                          nameKey="type"
                          label={(entry) => entry.type}
                        >
                          {analytics.messageCountByType.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                            borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                            color: theme === 'dark' ? '#f9fafb' : '#111827'
                          }}
                          formatter={(value) => [`${value} messages`, 'Count']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Activity by Hour */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Activity by Hour</h3>
                  <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-md p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.activityByHour}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                          dataKey="hour"
                          tick={{ fontSize: 10 }}
                          tickFormatter={(hour) => `${hour}:00`}
                        />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                            borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                            color: theme === 'dark' ? '#f9fafb' : '#111827'
                          }}
                          formatter={(value) => [`${value} messages`, 'Count']}
                          labelFormatter={(hour) => `${hour}:00 - ${hour + 1}:00`}
                        />
                        <Area type="monotone" dataKey="count" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Model Usage */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Model Usage</h3>
                  <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-md p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analytics.modelUsageData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis
                          dataKey="model"
                          type="category"
                          tick={{ fontSize: 10 }}
                          width={60}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                            borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                            color: theme === 'dark' ? '#f9fafb' : '#111827'
                          }}
                          formatter={(value) => [`${value} conversations`, 'Count']}
                        />
                        <Bar dataKey="count" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          {activeTab === 'audio' && (
            <motion.div
              key="audio"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-6">
                {/* Microphone Settings */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Microphone</h3>
                  <select
                    className="w-full p-2 rounded-md bg-gray-100 dark:bg-gray-800 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="default">Default Microphone</option>
                    <option value="device1">Microphone (Built-in)</option>
                    <option value="device2">External Microphone</option>
                  </select>
                  <div className="mt-2 flex items-center">
                    <button className="p-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 mr-2">
                      <Mic size={16} />
                    </button>
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 w-0"></div>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Click the microphone icon to test your input level.
                  </p>
                </div>
                
                {/* Audio Recording Settings */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Recording</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm block mb-1">Sample Rate</label>
                      <select
                        className="w-full p-2 rounded-md bg-gray-100 dark:bg-gray-800 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="16000">16 kHz (Recommended for Whisper)</option>
                        <option value="44100">44.1 kHz (Standard)</option>
                        <option value="48000">48 kHz (High Quality)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-sm block mb-1">Audio Format</label>
                      <select
                        className="w-full p-2 rounded-md bg-gray-100 dark:bg-gray-800 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="mp3">MP3</option>
                        <option value="wav">WAV</option>
                        <option value="m4a">M4A</option>
                      </select>
                    </div>
                    
                    <label className="flex items-center justify-between">
                      <span className="text-sm">Noise Reduction</span>
                      <div
                        className="w-10 h-5 rounded-full relative cursor-pointer bg-blue-500"
                      >
                        <div
                          className="w-4 h-4 rounded-full absolute top-0.5 right-0.5 bg-white"
                        />
                      </div>
                    </label>
                    
                    <label className="flex items-center justify-between">
                      <span className="text-sm">Auto Stop on Silence</span>
                      <div
                        className="w-10 h-5 rounded-full relative cursor-pointer bg-blue-500"
                      >
                        <div
                          className="w-4 h-4 rounded-full absolute top-0.5 right-0.5 bg-white"
                        />
                      </div>
                    </label>
                  </div>
                </div>
                
                {/* Whisper API Settings */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Whisper API</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm block mb-1">Language</label>
                      <select
                        className="w-full p-2 rounded-md bg-gray-100 dark:bg-gray-800 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="auto">Auto-detect</option>
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="ja">Japanese</option>
                        <option value="zh">Chinese</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-sm block mb-1">Whisper Model</label>
                      <select
                        className="w-full p-2 rounded-md bg-gray-100 dark:bg-gray-800 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="whisper-1">Whisper-1 (Default)</option>
                      </select>
                    </div>
                    
                    <label className="flex items-center justify-between">
                      <span className="text-sm">Transcribe in real-time</span>
                      <div
                        className="w-10 h-5 rounded-full relative cursor-pointer bg-gray-300 dark:bg-gray-600"
                      >
                        <div
                          className="w-4 h-4 rounded-full absolute top-0.5 left-0.5 bg-white"
                        />
                      </div>
                    </label>
                  </div>
                </div>
                
                {/* Storage Settings */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Storage</h3>
                  <label className="flex items-center justify-between">
                    <span className="text-sm">Keep audio recordings</span>
                    <div
                      className="w-10 h-5 rounded-full relative cursor-pointer bg-blue-500"
                    >
                      <div
                        className="w-4 h-4 rounded-full absolute top-0.5 right-0.5 bg-white"
                      />
                    </div>
                  </label>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Audio recordings are stored locally on your device.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
          
          {activeTab === 'about' && (
            <motion.div
              key="about"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-6">
                {/* App Info */}
                <div className="text-center">
                  <h1 className="text-xl font-bold mb-1">Factory Chat</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Version 0.1.0</p>
                  <div className="mt-4 p-4 rounded-md bg-gray-100 dark:bg-gray-800 inline-block">
                    <img
                      src="/logo.svg"
                      alt="Factory Chat Logo"
                      className="w-16 h-16 mx-auto"
                    />
                  </div>
                </div>
                
                {/* Features */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Features</h3>
                  <ul className="text-sm space-y-1">
                    <li className="flex items-center">
                      <Check size={14} className="mr-2 text-green-500" />
                      LLM Chat with OpenAI GPT-4o
                    </li>
                    <li className="flex items-center">
                      <Check size={14} className="mr-2 text-green-500" />
                      Voice Recording + Whisper Transcription
                    </li>
                    <li className="flex items-center">
                      <Check size={14} className="mr-2 text-green-500" />
                      Search through conversations
                    </li>
                    <li className="flex items-center">
                      <Check size={14} className="mr-2 text-green-500" />
                      Folder organization with drag & drop
                    </li>
                    <li className="flex items-center">
                      <Check size={14} className="mr-2 text-green-500" />
                      Multiple conversation tabs
                    </li>
                    <li className="flex items-center">
                      <Check size={14} className="mr-2 text-green-500" />
                      File attachments and analysis
                    </li>
                    <li className="flex items-center">
                      <Check size={14} className="mr-2 text-green-500" />
                      Dark/Light theme toggle
                    </li>
                  </ul>
                </div>
                
                {/* Credits */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Built With</h3>
                  <div className="text-sm">
                    <p>Tauri + React + TypeScript</p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                      OpenAI API, Whisper API, TailwindCSS, Recharts, Framer Motion
                    </p>
                  </div>
                </div>
                
                {/* Links */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Links</h3>
                  <div className="space-y-1">
                    <a
                      href="https://www.factory.ai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline block"
                    >
                      Factory AI Website
                    </a>
                    <a
                      href="https://github.com/Factory-AI"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline block"
                    >
                      GitHub Repository
                    </a>
                    <a
                      href="https://www.factory.ai/docs"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline block"
                    >
                      Documentation
                    </a>
                  </div>
                </div>
                
                {/* Legal */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Legal</h3>
                  <div className="space-y-1">
                    <a
                      href="#"
                      className="text-sm text-blue-500 hover:underline block"
                    >
                      Terms of Service
                    </a>
                    <a
                      href="#"
                      className="text-sm text-blue-500 hover:underline block"
                    >
                      Privacy Policy
                    </a>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      © 2025 Factory AI. All rights reserved.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Footer */}
      <div className="p-3 border-t dark:border-gray-700">
        <button
          onClick={saveSettings}
          disabled={isSaving}
          className="w-full p-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              <Save size={16} className="mr-2" />
              Save Settings
            </>
          )}
        </button>
        
        {saveSuccess && (
          <div className="mt-2 p-2 rounded-md bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs flex items-center justify-center">
            <Check size={14} className="mr-1" />
            Settings saved successfully
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPanel;
