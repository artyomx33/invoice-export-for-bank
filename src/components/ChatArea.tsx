import React, { useState, useEffect, useRef, useContext, FormEvent } from 'react';
import { AppContext, ChatMessage as Message, ChatConversation as Conversation, AudioRecording, ChatAttachment as Attachment } from '../contexts/AppContext';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import {
  Send,
  Mic,
  MicOff,
  Paperclip,
  MoreHorizontal,
  Copy,
  Trash2,
  Edit,
  RefreshCw,
  Download,
  File,
  Image,
  Play,
  Pause,
  Star,
  MessageSquare,
  FileText,
  Settings,
  X,
  Check,
  Clock,
  ChevronDown,
  ThumbsUp,
  ThumbsDown,
  Heart,
  Lightbulb,
  Sparkles,
  Bot,
  User,
  Zap,
  Moon,
  Sun,
  AlertCircle
} from 'lucide-react';

// Get OpenAI client with API key from settings
const getOpenAIClient = (apiKey: string): OpenAI => {
  return new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // For client-side usage (in production, use a backend proxy)
  });
};

// Available models
const availableModels = [
  { id: 'gpt-4o', name: 'GPT-4o', description: 'Most capable model, best for complex tasks' },
  { id: 'gpt-4', name: 'GPT-4', description: 'Powerful model with strong reasoning' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and cost-effective' }
];

// Reaction options
const reactionOptions = [
  { emoji: <ThumbsUp className="h-4 w-4" />, name: 'thumbs-up' },
  { emoji: <ThumbsDown className="h-4 w-4" />, name: 'thumbs-down' },
  { emoji: <Heart className="h-4 w-4" />, name: 'heart' },
  { emoji: <Lightbulb className="h-4 w-4" />, name: 'lightbulb' },
  { emoji: <Sparkles className="h-4 w-4" />, name: 'sparkles' }
];

const ChatArea: React.FC = () => {
  const {
    chatConversations,
    currentChatConversationId,
    updateChatConversation,
    startRecording,
    stopRecording: stopRecordingBase,
    isRecording,
    settings,
    createNewChatConversation,
    toggleTheme,
    theme,
    updateSettings
  } = useContext(AppContext);

  // Local state
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<'txt' | 'json'>('txt');
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingInterval, setRecordingInterval] = useState<NodeJS.Timeout | null>(null);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const currentConversation = chatConversations.find(c => c.id === currentChatConversationId) || null;
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Get current conversation
  useEffect(() => {
    if (currentConversation) {
      // Reset states when conversation changes
      setIsStreaming(false);
      setStreamedResponse('');
      setInputValue('');
      setAttachments([]);
      setShowModelSelector(false);
      setShowExportOptions(false);
      setEditingMessageId(null);
      setApiError(null);
      
      // Cancel any ongoing API calls
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    }
  }, [currentChatConversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  // Handle recording timer
  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      setRecordingInterval(interval);
    } else {
      if (recordingInterval) {
        clearInterval(recordingInterval);
        setRecordingInterval(null);
        setRecordingTime(0);
      }
    }

    return () => {
      if (recordingInterval) {
        clearInterval(recordingInterval);
      }
    };
  }, [isRecording]);

  // Close actions menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setShowActionsMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Format recording time
  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Enhanced stopRecording with Whisper API integration
  const stopRecordingWithTranscription = async (): Promise<{text: string, audioRecording: AudioRecording | null}> => {
    try {
      // First stop the recording using the base function
      const recording = await stopRecordingBase();
      
      if (!recording) {
        return { text: "", audioRecording: null };
      }
      
      // Check if we have a valid API key
      if (!settings.chatApiKey) {
        throw new Error("OpenAI API key is missing. Please add your API key in Settings.");
      }
      
      // In a real implementation, we would have the audio file from the recording
      // For this demo, we'll simulate having an audio file
      // In a real app, you would:
      // 1. Get the audio blob from the recording
      // 2. Create a File object from the blob
      // 3. Send it to the Whisper API
      
      // Simulate having an audio file (in a real app, this would be the actual recording)
      // const audioFile = new File([/* audio blob */], recording.filename, { type: 'audio/mp3' });
      
      // Create OpenAI client
      const openai = getOpenAIClient(settings.chatApiKey);
      
      // For demo purposes, we'll return a placeholder
      // In a real app, you would use the OpenAI Whisper API like this:
      /*
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
      });
      
      return { 
        text: transcription.text, 
        audioRecording: recording 
      };
      */
      
      // Simulated response for demo
      return { 
        text: "This is a simulated transcription. In a real app, this would be the actual transcription from Whisper API.",
        audioRecording: recording 
      };
      
    } catch (error: any) {
      console.error('Error transcribing audio:', error);
      setApiError(`Error transcribing audio: ${error.message}`);
      return { text: "", audioRecording: null };
    }
  };

  // Handle message submission
  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    
    if (!currentChatConversationId || (!inputValue.trim() && attachments.length === 0 && !isRecording)) return;
    
    setIsSubmitting(true);
    setApiError(null);
    
    try {
      // Check if API key is available
      if (!settings.chatApiKey) {
        throw new Error("OpenAI API key is missing. Please add your API key in Settings.");
      }
      
      // If recording, stop and transcribe
      let transcription = '';
      let audioRec: AudioRecording | null = null;
      
      if (isRecording) {
        const result = await stopRecordingWithTranscription();
        transcription = result.text;
        audioRec = result.audioRecording;
      }

      // Process attachments
      const processedAttachments: Attachment[] = await Promise.all(
        attachments.map(async (file) => ({
          id: uuidv4(),
          filename: file.name,
          fileType: file.type,
          fileSize: file.size,
          url: URL.createObjectURL(file), // In a real app, we would upload to storage
        }))
      );

      // Create user message
      const userMessage: Message = {
        id: uuidv4(),
        role: 'user',
        content: transcription || inputValue,
        timestamp: new Date(),
        attachments: processedAttachments,
        audioTranscription: !!transcription,
      };

      // Update conversation with user message
      const updatedConversation = {
        ...currentConversation!,
        messages: [...currentConversation!.messages, userMessage],
        updatedAt: new Date(),
        audioRecordings: audioRec 
          ? [...(currentConversation!.audioRecordings || []), audioRec] 
          : currentConversation!.audioRecordings
      };
      
      updateChatConversation(updatedConversation);
      setInputValue('');
      setAttachments([]);
      
      // Prepare messages for API
      const apiMessages = [
        { role: 'system', content: currentConversation!.systemPrompt },
        ...updatedConversation.messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ];
      
      // Start streaming
      setIsStreaming(true);
      setStreamedResponse('');
      
      // Create a new abort controller for this request
      abortControllerRef.current = new AbortController();
      
      // Create OpenAI client
      const openai = getOpenAIClient(settings.chatApiKey);
      
      // Call OpenAI API with streaming
      const stream = await openai.chat.completions.create({
        model: currentConversation!.model,
        messages: apiMessages,
        stream: true,
        // Removed signal parameter that was causing the error
      });
      
      let fullResponse = '';
      let tokenCount = 0;
      
      // Process the stream
      for await (const chunk of stream) {
        if (chunk.choices[0]?.delta?.content) {
          fullResponse += chunk.choices[0].delta.content;
          setStreamedResponse(fullResponse);
          tokenCount += 1; // This is an approximation, in a real app you'd use the token count from the API
        }
      }
      
      // Create assistant message
      const assistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date(),
        tokenCount: tokenCount,
      };
      
      // Update conversation with assistant message
      const finalConversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, assistantMessage],
        updatedAt: new Date(),
        statistics: {
          ...updatedConversation.statistics!,
          totalMessages: updatedConversation.statistics!.totalMessages + 2,
          userMessages: updatedConversation.statistics!.userMessages + 1,
          assistantMessages: updatedConversation.statistics!.assistantMessages + 1,
          totalTokens: (updatedConversation.statistics!.totalTokens || 0) + tokenCount,
          wordCount: (updatedConversation.statistics!.wordCount || 0) + 
            inputValue.split(' ').length + fullResponse.split(' ').length,
        }
      };
      
      updateChatConversation(finalConversation);
      
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Check if the error is due to the request being aborted
      if (error.name === 'AbortError') {
        console.log('Request was aborted');
        return;
      }
      
      // Handle different types of errors
      let errorMessage = 'An error occurred while communicating with OpenAI.';
      
      if (error.status === 401) {
        errorMessage = 'Invalid API key. Please check your API key in Settings.';
      } else if (error.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setApiError(errorMessage);
      
      // Add error message to conversation
      if (currentConversation) {
        const errorMessage: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: 'Sorry, there was an error processing your request. Please try again.',
          timestamp: new Date(),
        };
        
        const updatedConversation = {
          ...currentConversation,
          messages: [...currentConversation.messages, errorMessage],
          updatedAt: new Date(),
        };
        
        updateChatConversation(updatedConversation);
      }
    } finally {
      setIsSubmitting(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setAttachments([...attachments, ...filesArray]);
    }
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };

  // Handle voice recording
  const handleRecordToggle = async () => {
    if (isRecording) {
      const result = await stopRecordingWithTranscription();
      if (result.text) {
        setInputValue(result.text);
      }
    } else {
      startRecording();
    }
  };

  // Handle textarea input
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  // Handle key press in textarea
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Copy message to clipboard
  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    // Could show a toast notification here
  };

  // Edit message
  const startEditingMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setInputValue(content);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Regenerate response
  const regenerateResponse = async (messageIndex: number) => {
    if (!currentConversation) return;
    
    // Get messages up to the user message before the assistant message to regenerate
    const messagesToKeep = currentConversation.messages.slice(0, messageIndex);
    const userMessage = currentConversation.messages[messageIndex - 1];
    
    if (!userMessage || userMessage.role !== 'user') return;
    
    // Update conversation with just the user message
    const updatedConversation = {
      ...currentConversation,
      messages: messagesToKeep,
      updatedAt: new Date(),
    };
    
    updateChatConversation(updatedConversation);
    
    // Cancel any ongoing API calls
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Now submit the message again to get a new response
    setIsSubmitting(true);
    setApiError(null);
    
    try {
      // Check if API key is available
      if (!settings.chatApiKey) {
        throw new Error("OpenAI API key is missing. Please add your API key in Settings.");
      }
      
      // Prepare messages for API
      const apiMessages = [
        { role: 'system', content: currentConversation.systemPrompt },
        ...updatedConversation.messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ];
      
      // Start streaming
      setIsStreaming(true);
      setStreamedResponse('');
      
      // Create a new abort controller for this request
      abortControllerRef.current = new AbortController();
      
      // Create OpenAI client
      const openai = getOpenAIClient(settings.chatApiKey);
      
      // Call OpenAI API with streaming
      const stream = await openai.chat.completions.create({
        model: currentConversation.model,
        messages: apiMessages,
        stream: true,
        // Removed signal parameter that was causing the error
      });
      
      let fullResponse = '';
      let tokenCount = 0;
      
      // Process the stream
      for await (const chunk of stream) {
        if (chunk.choices[0]?.delta?.content) {
          fullResponse += chunk.choices[0].delta.content;
          setStreamedResponse(fullResponse);
          tokenCount += 1; // This is an approximation
        }
      }
      
      // Create assistant message
      const assistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date(),
        tokenCount: tokenCount,
      };
      
      // Update conversation with assistant message
      const finalConversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, assistantMessage],
        updatedAt: new Date(),
      };
      
      updateChatConversation(finalConversation);
      
    } catch (error: any) {
      console.error('Error regenerating response:', error);
      
      // Check if the error is due to the request being aborted
      if (error.name === 'AbortError') {
        console.log('Request was aborted');
        return;
      }
      
      // Handle different types of errors
      let errorMessage = 'An error occurred while communicating with OpenAI.';
      
      if (error.status === 401) {
        errorMessage = 'Invalid API key. Please check your API key in Settings.';
      } else if (error.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setApiError(errorMessage);
    } finally {
      setIsSubmitting(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  // Add reaction to message
  const addReaction = (messageId: string, reaction: string) => {
    if (!currentConversation) return;
    
    const updatedMessages = currentConversation.messages.map(msg => {
      if (msg.id === messageId) {
        const reactions = msg.reactions || [];
        // Toggle reaction
        const hasReaction = reactions.includes(reaction);
        const updatedReactions = hasReaction
          ? reactions.filter(r => r !== reaction)
          : [...reactions, reaction];
        
        return {
          ...msg,
          reactions: updatedReactions
        };
      }
      return msg;
    });
    
    const updatedConversation = {
      ...currentConversation,
      messages: updatedMessages,
      updatedAt: new Date(),
    };
    
    updateChatConversation(updatedConversation);
    setShowEmojiPicker(null);
  };

  // Export conversation
  const exportConversation = () => {
    if (!currentConversation) return;
    
    let content = '';
    let filename = '';
    
    if (exportFormat === 'txt') {
      // Format as plain text
      content = currentConversation.messages.map(msg => {
        const role = msg.role.charAt(0).toUpperCase() + msg.role.slice(1);
        const timestamp = format(new Date(msg.timestamp), 'yyyy-MM-dd HH:mm:ss');
        return `[${role} - ${timestamp}]\n${msg.content}\n\n`;
      }).join('');
      
      filename = `${currentConversation.title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.txt`;
    } else {
      // Format as JSON
      const exportData = {
        title: currentConversation.title,
        createdAt: currentConversation.createdAt,
        updatedAt: currentConversation.updatedAt,
        model: currentConversation.model,
        systemPrompt: currentConversation.systemPrompt,
        messages: currentConversation.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          tokenCount: msg.tokenCount,
        })),
      };
      
      content = JSON.stringify(exportData, null, 2);
      filename = `${currentConversation.title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.json`;
    }
    
    // Create and download file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setShowExportOptions(false);
  };

  // Change model
  const changeModel = (modelId: string) => {
    if (!currentConversation) return;
    
    const updatedConversation = {
      ...currentConversation,
      model: modelId,
      updatedAt: new Date(),
    };
    
    updateChatConversation(updatedConversation);
    setShowModelSelector(false);
  };

  // Open settings
  const openSettings = () => {
    // This will be connected to the App.tsx settings modal
    const settingsButton = document.querySelector('[data-settings-button]') as HTMLButtonElement;
    if (settingsButton) settingsButton.click();
    setShowActionsMenu(false);
  };

  // If no conversation is selected - ChatGPT-style welcome screen
  if (!currentConversation) {
    return (
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-6">
            <Bot className="h-8 w-8 text-blue-600 dark:text-blue-300" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Factory Chat</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-md">
            Your advanced AI assistant with voice transcription and file analysis
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl w-full">
            <div 
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              onClick={createNewChatConversation}
            >
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mr-3">
                  <MessageSquare className="h-4 w-4 text-green-600 dark:text-green-300" />
                </div>
                <h3 className="font-medium">New Conversation</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-left">
                Start a fresh chat with the AI assistant
              </p>
            </div>
            
            <div 
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              onClick={() => {
                // Open settings
                openSettings();
              }}
            >
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-3">
                  <Settings className="h-4 w-4 text-purple-600 dark:text-purple-300" />
                </div>
                <h3 className="font-medium">Settings</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-left">
                Configure API keys and preferences
              </p>
            </div>
            
            <div 
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              onClick={toggleTheme}
            >
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center mr-3">
                  {theme === 'light' ? (
                    <Moon className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                  ) : (
                    <Sun className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                  )}
                </div>
                <h3 className="font-medium">
                  Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
                </h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-left">
                Change the appearance of the app
              </p>
            </div>
            
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                  <Zap className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                </div>
                <h3 className="font-medium">Capabilities</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-left">
                Voice transcription, file analysis, and more
              </p>
            </div>
          </div>
          
          <div className="mt-12 text-sm text-gray-500 dark:text-gray-400">
            Factory Chat v0.1.0 • Built with Tauri & React
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
      {/* Messages area - ChatGPT style */}
      <div className="flex-1 overflow-y-auto p-4 md:px-20 lg:px-32 xl:px-48">
        {currentConversation.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
              <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            </div>
            <h2 className="text-xl font-medium mb-2">How can I help you today?</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              Start a conversation! You can ask questions, request creative content, get code help, or try voice recording.
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto w-full space-y-6">
            {currentConversation.messages.map((message, index) => (
              <div key={message.id} className="group">
                {/* Message bubble - ChatGPT style */}
                <div className={`flex ${message.role === 'user' ? 'justify-end md:justify-start' : 'justify-start'}`}>
                  <div className="flex items-start max-w-full">
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user' 
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' 
                        : 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300'
                    } mr-4`}>
                      {message.role === 'user' ? (
                        <User className="h-5 w-5" />
                      ) : (
                        <Bot className="h-5 w-5" />
                      )}
                    </div>
                    
                    {/* Message content */}
                    <div className={`flex-1 overflow-hidden ${message.role === 'assistant' ? 'prose dark:prose-invert max-w-none' : ''}`}>
                      {/* Message content */}
                      <div className="whitespace-pre-wrap break-words">
                        {message.content}
                      </div>
                      
                      {/* Attachments */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {message.attachments.map((attachment) => (
                            <div
                              key={attachment.id}
                              className="flex items-center p-2 rounded-md bg-gray-50 dark:bg-gray-800 border dark:border-gray-700"
                            >
                              {attachment.fileType.startsWith('image/') ? (
                                <Image size={16} className="mr-2" />
                              ) : (
                                <File size={16} className="mr-2" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm truncate">{attachment.filename}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {(attachment.fileSize / 1024).toFixed(1)} KB
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Audio transcription indicator */}
                      {message.audioTranscription && (
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center">
                          <Mic size={12} className="mr-1" />
                          Transcribed from audio
                        </div>
                      )}
                      
                      {/* Message metadata */}
                      <div className="mt-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        {message.tokenCount && <span>{message.tokenCount} tokens</span>}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Message actions */}
                <div className={`flex mt-1 ${message.role === 'user' ? 'justify-end md:justify-start pl-12' : 'justify-start pl-12'}`}>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Copy button */}
                    <button
                      onClick={() => copyMessage(message.content)}
                      className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                      title="Copy message"
                    >
                      <Copy size={14} />
                    </button>
                    
                    {/* Edit button (user messages only) */}
                    {message.role === 'user' && (
                      <button
                        onClick={() => startEditingMessage(message.id, message.content)}
                        className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                        title="Edit message"
                      >
                        <Edit size={14} />
                      </button>
                    )}
                    
                    {/* Regenerate button (assistant messages only) */}
                    {message.role === 'assistant' && index > 0 && (
                      <button
                        onClick={() => regenerateResponse(index)}
                        className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                        title="Regenerate response"
                      >
                        <RefreshCw size={14} />
                      </button>
                    )}
                    
                    {/* Reaction button */}
                    <div className="relative">
                      <button
                        onClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id)}
                        className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                        title="Add reaction"
                      >
                        {message.reactions && message.reactions.length > 0 ? (
                          <div className="flex items-center">
                            <Star size={14} className="text-amber-500" />
                          </div>
                        ) : (
                          <Star size={14} />
                        )}
                      </button>
                      
                      {showEmojiPicker === message.id && (
                        <div className="absolute bottom-full mb-1 bg-white dark:bg-gray-800 shadow-lg rounded-md border dark:border-gray-700 p-1 flex z-10">
                          {reactionOptions.map((option) => (
                            <button
                              key={option.name}
                              onClick={() => addReaction(message.id, option.name)}
                              className={`p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                message.reactions?.includes(option.name)
                                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                                  : ''
                              }`}
                            >
                              {option.emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Reactions display */}
                {message.reactions && message.reactions.length > 0 && (
                  <div className={`flex mt-1 ${message.role === 'user' ? 'justify-end md:justify-start pl-12' : 'justify-start pl-12'}`}>
                    <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-0.5">
                      {message.reactions.map((reaction, i) => {
                        const option = reactionOptions.find(opt => opt.name === reaction);
                        return option ? (
                          <span key={i} className="mx-0.5">
                            {option.emoji}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {/* API Error message */}
            {apiError && (
              <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Error</p>
                    <p>{apiError}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Streaming response */}
            {isStreaming && (
              <div className="flex">
                <div className="flex items-start max-w-full">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 flex items-center justify-center flex-shrink-0 mr-4">
                    <Bot className="h-5 w-5" />
                  </div>
                  
                  {/* Message content */}
                  <div className="flex-1 overflow-hidden prose dark:prose-invert max-w-none">
                    <div className="whitespace-pre-wrap break-words">
                      {streamedResponse}
                      <span className="inline-block w-2 h-4 ml-0.5 bg-gray-400 dark:bg-gray-300 animate-pulse"></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Message input area - ChatGPT style */}
      <div className="border-t dark:border-gray-800 bg-white dark:bg-gray-900 p-4 md:px-20 lg:px-32 xl:px-48">
        <div className="max-w-3xl mx-auto">
          {/* Attachment preview */}
          {attachments.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-md p-2 pr-1"
                >
                  {file.type.startsWith('image/') ? (
                    <Image size={14} className="mr-2" />
                  ) : (
                    <File size={14} className="mr-2" />
                  )}
                  <span className="text-sm truncate max-w-[150px]">{file.name}</span>
                  <button
                    onClick={() => removeAttachment(index)}
                    className="ml-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Recording indicator */}
          {isRecording && (
            <div className="mb-3 flex items-center bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md p-2">
              <div className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></div>
              <span className="text-sm">Recording...</span>
              <span className="ml-2 text-sm">{formatRecordingTime(recordingTime)}</span>
            </div>
          )}
          
          {/* Input form - ChatGPT style */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-end rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyPress}
                  placeholder={isRecording ? "Recording... Press stop when finished" : "Message Factory Chat..."}
                  className="w-full p-3 pr-10 rounded-lg bg-transparent resize-none focus:outline-none max-h-[200px] min-h-[56px]"
                  rows={1}
                  disabled={isSubmitting || isRecording}
                />
                
                {/* Actions menu button */}
                <div className="absolute right-2 bottom-2">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowActionsMenu(!showActionsMenu)}
                      className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    
                    {/* Actions menu */}
                    {showActionsMenu && (
                      <div 
                        ref={actionsMenuRef}
                        className="absolute bottom-full right-0 mb-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg border dark:border-gray-700 overflow-hidden z-10"
                      >
                        {/* Model selector */}
                        <div className="p-2 border-b dark:border-gray-700">
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            MODEL
                          </div>
                          {availableModels.map(model => (
                            <div
                              key={model.id}
                              className={`p-2 rounded-md cursor-pointer flex items-center ${
                                currentConversation.model === model.id 
                                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                              onClick={() => changeModel(model.id)}
                            >
                              <div className="flex-1">
                                <div className="text-sm font-medium">{model.name}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{model.description}</div>
                              </div>
                              {currentConversation.model === model.id && (
                                <Check size={16} className="ml-2 flex-shrink-0" />
                              )}
                            </div>
                          ))}
                        </div>
                        
                        {/* Export options */}
                        <div className="p-2 border-b dark:border-gray-700">
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            EXPORT
                          </div>
                          <div
                            className="p-2 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                            onClick={() => {
                              setExportFormat('txt');
                              exportConversation();
                            }}
                          >
                            <FileText size={16} className="mr-2" />
                            <span className="text-sm">Export as Text</span>
                          </div>
                          <div
                            className="p-2 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                            onClick={() => {
                              setExportFormat('json');
                              exportConversation();
                            }}
                          >
                            <File size={16} className="mr-2" />
                            <span className="text-sm">Export as JSON</span>
                          </div>
                        </div>
                        
                        {/* Settings */}
                        <div className="p-2">
                          <div
                            className="p-2 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                            onClick={openSettings}
                          >
                            <Settings size={16} className="mr-2" />
                            <span className="text-sm">Settings</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Attachment button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                disabled={isSubmitting || isRecording}
              >
                <Paperclip size={20} />
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                multiple
              />
              
              {/* Recording button */}
              <button
                type="button"
                onClick={handleRecordToggle}
                className={`p-3 ${
                  isRecording
                    ? 'text-red-500'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                disabled={isSubmitting}
              >
                {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              
              {/* Send button */}
              <button
                type="submit"
                className={`p-3 rounded-r-lg ${
                  inputValue.trim() === '' && attachments.length === 0 && !isRecording
                    ? 'text-gray-400 dark:text-gray-600'
                    : 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300'
                }`}
                disabled={isSubmitting || (inputValue.trim() === '' && attachments.length === 0 && !isRecording)}
              >
                <Send size={20} />
              </button>
            </div>
            
            {/* Footer text */}
            <div className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
              Factory Chat may produce inaccurate information about people, places, or facts.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
