import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  ChatConversation,
  ChatMessage,
  ChatFolder,
  AudioRecording,
  ChatConversationStatistics,
  AppSettings,
} from '../contexts/AppContext';

export interface UseChatManagementProps {
  settings: AppSettings; // Pass settings from AppProvider
}

export const useChatManagement = ({ settings }: UseChatManagementProps) => {
  const [chatConversations, setChatConversations] = useState<ChatConversation[]>([]);
  const [chatFolders, setChatFolders] = useState<ChatFolder[]>([]);
  const [currentChatConversationId, setCurrentChatConversationId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  // Load from localStorage on initial mount
  useEffect(() => {
    const savedChatConversations = localStorage.getItem('chatConversations');
    if (savedChatConversations) setChatConversations(JSON.parse(savedChatConversations));

    const savedChatFolders = localStorage.getItem('chatFolders');
    if (savedChatFolders) setChatFolders(JSON.parse(savedChatFolders));
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('chatConversations', JSON.stringify(chatConversations));
  }, [chatConversations]);

  useEffect(() => {
    localStorage.setItem('chatFolders', JSON.stringify(chatFolders));
  }, [chatFolders]);

  const createNewChatConversation = useCallback(() => {
    const newConversation: ChatConversation = {
      id: uuidv4(),
      title: 'New Chat',
      messages: [],
      folderId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      model: settings.defaultChatModel,
      systemPrompt: 'You are a helpful assistant.',
      pinned: false,
      statistics: {
        totalMessages: 0,
        userMessages: 0,
        assistantMessages: 0,
        totalTokens: 0,
        averageResponseTime: 0,
        wordCount: 0,
      },
    };
    setChatConversations(prev => [newConversation, ...prev]);
    setCurrentChatConversationId(newConversation.id);
    return newConversation; // Return the created conversation
  }, [settings.defaultChatModel]);

  const createNewChatFolder = useCallback(() => {
    const newFolder: ChatFolder = { id: uuidv4(), name: 'New Chat Folder', parentId: null, createdAt: new Date() };
    setChatFolders(prev => [...prev, newFolder]);
    return newFolder;
  }, []);

  const updateChatConversation = useCallback((updatedConversation: ChatConversation) => {
    setChatConversations(prev => prev.map(c => c.id === updatedConversation.id ? { ...updatedConversation, updatedAt: new Date() } : c));
  }, []);

  const updateChatFolder = useCallback((updatedFolder: ChatFolder) => {
    setChatFolders(prev => prev.map(f => f.id === updatedFolder.id ? updatedFolder : f));
  }, []);

  const deleteChatConversation = useCallback((id: string) => {
    setChatConversations(prev => prev.filter(c => c.id !== id));
    if (currentChatConversationId === id) setCurrentChatConversationId(null);
  }, [currentChatConversationId]);

  const deleteChatFolder = useCallback((id: string) => {
    setChatConversations(prev => prev.map(c => c.folderId === id ? { ...c, folderId: null } : c));
    setChatFolders(prev => prev.filter(f => f.id !== id));
  }, []);

  const moveChatConversationToFolder = useCallback((conversationId: string, folderId: string | null) => {
    setChatConversations(prev => prev.map(c => c.id === conversationId ? { ...c, folderId, updatedAt: new Date() } : c));
  }, []);

  const searchChatConversations = useCallback((query: string): ChatConversation[] => {
    if (!query.trim()) return chatConversations;
    const lowerQuery = query.toLowerCase();
    return chatConversations.filter(c =>
      c.title.toLowerCase().includes(lowerQuery) ||
      c.messages.some(m => m.content.toLowerCase().includes(lowerQuery))
    );
  }, [chatConversations]);

  const startRecording = useCallback(() => {
    setIsRecording(true);
    // TODO: Implement actual audio recording logic
  }, []);

  const stopRecording = useCallback(async (): Promise<AudioRecording | null> => {
    setIsRecording(false);
    // Mock implementation for now
    const mockRecording: AudioRecording = {
      id: uuidv4(),
      filename: `recording-${Date.now()}.mp3`,
      duration: 5.2, // seconds
      transcription: "This is a mock transcription of your voice recording.",
      createdAt: new Date(),
    };
    // TODO: Implement actual Whisper API integration for transcription
    return mockRecording;
  }, []);

  return {
    chatConversations,
    chatFolders,
    currentChatConversationId,
    isRecording,
    setCurrentChatConversationId,
    createNewChatConversation,
    createNewChatFolder,
    updateChatConversation,
    updateChatFolder,
    deleteChatConversation,
    deleteChatFolder,
    moveChatConversationToFolder,
    searchChatConversations,
    startRecording,
    stopRecording,
  };
};
