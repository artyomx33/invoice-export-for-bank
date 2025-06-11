import React, { useState, useContext, useRef, useEffect } from 'react';
import { AppContext, ChatConversation as Conversation, ChatFolder as Folder } from '../contexts/AppContext';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { format } from 'date-fns';
import {
  ChevronRight,
  ChevronDown,
  Folder as FolderIcon,
  MessageSquare,
  MoreVertical,
  Plus,
  Trash2,
  Edit,
  Pin,
  Copy,
  Search,
  X,
  Settings,
  Moon,
  Sun,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Context menu types
interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  type: 'folder' | 'conversation' | null;
  id: string | null;
}

const Sidebar: React.FC = () => {
  const {
    chatConversations,
    chatFolders,
    currentChatConversationId,
    setCurrentChatConversationId,
    createNewChatConversation,
    createNewChatFolder,
    updateChatConversation,
    updateChatFolder,
    deleteChatConversation,
    deleteChatFolder,
    moveChatConversationToFolder,
    searchChatConversations,
    theme,
    toggleTheme,
  } = useContext(AppContext);

  // Local state
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    type: null,
    id: null
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTemplates, setShowTemplates] = useState(true);
  
  const editInputRef = useRef<HTMLInputElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Templates
  const conversationTemplates = [
    {
      id: 'general-assistant',
      name: 'General Assistant',
      description: 'General purpose AI assistant',
      systemPrompt: 'You are a helpful, creative, and friendly assistant.',
      icon: <MessageSquare size={16} />,
    },
    {
      id: 'code-helper',
      name: 'Code Helper',
      description: 'Programming and code assistance',
      systemPrompt: 'You are an expert programmer. Help with coding questions, debugging, and best practices.',
    },
    {
      id: 'meeting-notes',
      name: 'Meeting Notes',
      description: 'Transcribe and summarize meetings',
      systemPrompt: 'You help transcribe and summarize meeting recordings. Extract key points and action items.',
    },
    {
      id: 'creative-writer',
      name: 'Creative Writer',
      description: 'Creative writing assistance',
      systemPrompt: 'You are a creative writing assistant. Help with stories, poems, and creative content.',
    }
  ];

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        setContextMenu({ ...contextMenu, visible: false });
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu]);

  // Focus input when editing
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

  // Filter conversations based on search query
  const filteredConversations = searchQuery.trim() 
    ? searchChatConversations(searchQuery)
    : chatConversations;

  // Toggle folder expansion
  const toggleFolder = (folderId: string) => {
    setExpandedFolders({
      ...expandedFolders,
      [folderId]: !expandedFolders[folderId]
    });
  };

  // Handle right-click context menu
  const handleContextMenu = (e: React.MouseEvent, type: 'folder' | 'conversation', id: string) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      type,
      id
    });
  };

  // Start editing name
  const startEditing = (type: 'folder' | 'conversation', id: string) => {
    const item = type === 'folder' 
      ? chatFolders.find(f => f.id === id)
      : chatConversations.find(c => c.id === id);
    
    if (item) {
      setEditingId(id);
      setEditingName(type === 'folder' ? (item as Folder).name : (item as Conversation).title);
      setContextMenu({ ...contextMenu, visible: false });
    }
  };

  // Save edited name
  const saveEditedName = () => {
    if (!editingId) return;
    
    if (contextMenu.type === 'folder') {
      const folder = chatFolders.find(f => f.id === editingId);
      if (folder) {
        updateChatFolder({ ...folder, name: editingName });
      }
    } else {
      const conversation = chatConversations.find(c => c.id === editingId);
      if (conversation) {
        updateChatConversation({ ...conversation, title: editingName });
      }
    }
    
    setEditingId(null);
    setEditingName('');
  };

  // Handle drag end for drag and drop
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    
    // Extract folder ID from destination droppable ID
    // Format: folder-{folderId} or root
    const destinationId = destination.droppableId === 'root' 
      ? null 
      : destination.droppableId.replace('folder-', '');
    
    // Move conversation to folder
    moveChatConversationToFolder(draggableId, destinationId);
  };

  // Create a new conversation from template
  const createFromTemplate = (template: any) => {
    const newConversation: Conversation = {
      id: crypto.randomUUID(),
      title: `New ${template.name}`,
      messages: [],
      folderId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      model: 'gpt-4o',
      systemPrompt: template.systemPrompt,
      pinned: false,
      statistics: {
        totalMessages: 0,
        userMessages: 0,
        assistantMessages: 0,
        totalTokens: 0,
        averageResponseTime: 0,
        wordCount: 0,
      }
    };
    
    // Add conversation and set as current
    setCurrentChatConversationId(newConversation.id);
  };

  // Pin/unpin conversation
  const togglePin = (conversation: Conversation) => {
    updateChatConversation({
      ...conversation,
      pinned: !conversation.pinned
    });
    setContextMenu({ ...contextMenu, visible: false });
  };

  // Duplicate conversation
  const duplicateConversation = (conversation: Conversation) => {
    const newConversation: Conversation = {
      ...conversation,
      id: crypto.randomUUID(),
      title: `${conversation.title} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date(),
      pinned: false
    };
    
    // Add conversation and set as current
    setCurrentChatConversationId(newConversation.id);
    setContextMenu({ ...contextMenu, visible: false });
  };

  // Group conversations by folder
  const conversationsByFolder: Record<string | 'pinned' | 'root', Conversation[]> = {
    pinned: [],
    root: []
  };

  // Add folder IDs to the record
  chatFolders.forEach(folder => {
    conversationsByFolder[folder.id] = [];
  });

  // Populate conversations by folder
  filteredConversations.forEach(conversation => {
    if (conversation.pinned) {
      conversationsByFolder.pinned.push(conversation);
    }
    
    if (conversation.folderId) {
      if (conversationsByFolder[conversation.folderId]) {
        conversationsByFolder[conversation.folderId].push(conversation);
      } else {
        // If folder doesn't exist anymore, move to root
        conversationsByFolder.root.push({
          ...conversation,
          folderId: null
        });
      }
    } else {
      conversationsByFolder.root.push(conversation);
    }
  });

  // Sort conversations by date
  Object.keys(conversationsByFolder).forEach(key => {
    conversationsByFolder[key].sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  });

  return (
    <div 
      ref={sidebarRef}
      className="h-full bg-gray-50 dark:bg-gray-800 w-72 flex flex-col border-r dark:border-gray-700"
    >
      {/* Sidebar Header - ChatGPT style */}
      <div className="p-3 flex items-center justify-between">
        <h1 className="font-semibold text-lg">Factory Chat</h1>
        <button 
          onClick={createNewChatConversation}
          className="p-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Plus size={16} className="text-gray-700 dark:text-gray-300" />
        </button>
      </div>
      
      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-8 py-2 text-sm rounded-md bg-gray-100 dark:bg-gray-700 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 sidebar-search-input"
          />
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-2"
            >
              <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </button>
          )}
        </div>
      </div>
      
      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-1 py-2">
        <DragDropContext onDragEnd={handleDragEnd}>
          {/* Pinned Conversations */}
          {conversationsByFolder.pinned.length > 0 && (
            <div className="mb-2">
              <div className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Pinned
              </div>
              <Droppable droppableId="pinned">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {conversationsByFolder.pinned.map((conversation, index) => (
                      <ConversationItem
                        key={conversation.id}
                        conversation={conversation}
                        index={index}
                        isActive={conversation.id === currentChatConversationId}
                        onClick={() => setCurrentChatConversationId(conversation.id)}
                        onContextMenu={(e) => handleContextMenu(e, 'conversation', conversation.id)}
                        isEditing={editingId === conversation.id}
                        editingName={editingName}
                        setEditingName={setEditingName}
                        saveEditedName={saveEditedName}
                        editInputRef={editInputRef}
                      />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          )}
          
          {/* Folders */}
          {chatFolders.map(folder => (
            <div key={folder.id} className="mb-1">
              <div 
                className={`group flex items-center px-3 py-2 rounded-md cursor-pointer ${
                  expandedFolders[folder.id] ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                onClick={() => toggleFolder(folder.id)}
                onContextMenu={(e) => handleContextMenu(e, 'folder', folder.id)}
              >
                {expandedFolders[folder.id] ? (
                  <ChevronDown size={16} className="mr-1 text-gray-500" />
                ) : (
                  <ChevronRight size={16} className="mr-1 text-gray-500" />
                )}
                <FolderIcon size={16} className="mr-2 text-gray-500" />
                
                {editingId === folder.id ? (
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={saveEditedName}
                    onKeyDown={(e) => e.key === 'Enter' && saveEditedName()}
                    className="flex-1 bg-transparent focus:outline-none text-sm"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="text-sm truncate flex-1">{folder.name}</span>
                )}
                
                <span className="text-xs text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100">
                  {conversationsByFolder[folder.id]?.length || 0}
                </span>
              </div>
              
              {expandedFolders[folder.id] && (
                <Droppable droppableId={`folder-${folder.id}`}>
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="pl-6"
                    >
                      {conversationsByFolder[folder.id]?.map((conversation, index) => (
                        <ConversationItem
                          key={conversation.id}
                          conversation={conversation}
                          index={index}
                          isActive={conversation.id === currentChatConversationId}
                          onClick={() => setCurrentChatConversationId(conversation.id)}
                          onContextMenu={(e) => handleContextMenu(e, 'conversation', conversation.id)}
                          isEditing={editingId === conversation.id}
                          editingName={editingName}
                          setEditingName={setEditingName}
                          saveEditedName={saveEditedName}
                          editInputRef={editInputRef}
                        />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              )}
            </div>
          ))}
          
          {/* Root Conversations */}
          <div className="mb-2">
            <div className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              Conversations
            </div>
            <Droppable droppableId="root">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {conversationsByFolder.root.map((conversation, index) => (
                    <ConversationItem
                      key={conversation.id}
                      conversation={conversation}
                      index={index}
                      isActive={conversation.id === currentChatConversationId}
                      onClick={() => setCurrentChatConversationId(conversation.id)}
                      onContextMenu={(e) => handleContextMenu(e, 'conversation', conversation.id)}
                      isEditing={editingId === conversation.id}
                      editingName={editingName}
                      setEditingName={setEditingName}
                      saveEditedName={saveEditedName}
                      editInputRef={editInputRef}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </DragDropContext>
        
        {/* Templates Section */}
        <div className="mt-2 px-1">
          <div 
            className="flex items-center px-2 py-1 cursor-pointer"
            onClick={() => setShowTemplates(!showTemplates)}
          >
            {showTemplates ? (
              <ChevronDown size={16} className="mr-1 text-gray-500" />
            ) : (
              <ChevronRight size={16} className="mr-1 text-gray-500" />
            )}
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">Templates</span>
          </div>
          
          {showTemplates && (
            <div className="mt-1 space-y-1">
              {conversationTemplates.map(template => (
                <div
                  key={template.id}
                  className="flex items-center p-2 rounded-md cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                  onClick={() => createFromTemplate(template)}
                >
                  <MessageSquare size={16} className="mr-2 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium">{template.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{template.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Bottom controls - ChatGPT style */}
      <div className="border-t dark:border-gray-700 p-3">
        <div className="flex items-center justify-between">
          <button
            onClick={createNewChatFolder}
            className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            title="New folder"
          >
            <FolderIcon size={18} />
          </button>
          
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          
          <button
            onClick={() => {
              // Open settings modal
              const settingsButton = document.querySelector('[data-settings-button]') as HTMLButtonElement;
              if (settingsButton) settingsButton.click();
            }}
            className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            title="Settings"
          >
            <Settings size={18} />
          </button>
        </div>
        
        {/* App version */}
        <div className="mt-3 text-xs text-center text-gray-500 dark:text-gray-400">
          Factory Chat v0.1.0 • Built with Tauri & React
        </div>
      </div>
      
      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu.visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-50 bg-white dark:bg-gray-800 shadow-lg rounded-md border dark:border-gray-700 py-1 w-48"
            style={{
              left: `${contextMenu.x}px`,
              top: `${contextMenu.y}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {contextMenu.type === 'folder' ? (
              <>
                <div 
                  className="px-3 py-1.5 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  onClick={() => startEditing('folder', contextMenu.id!)}
                >
                  <Edit size={16} className="mr-2" />
                  Rename folder
                </div>
                <div 
                  className="px-3 py-1.5 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center text-red-600 dark:text-red-400"
                  onClick={() => {
                    if (contextMenu.id) deleteChatFolder(contextMenu.id);
                    setContextMenu({ ...contextMenu, visible: false });
                  }}
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete folder
                </div>
              </>
            ) : (
              <>
                {contextMenu.id && (
                  <>
                    <div 
                      className="px-3 py-1.5 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                      onClick={() => {
                        const conversation = chatConversations.find(c => c.id === contextMenu.id);
                        if (conversation) togglePin(conversation);
                      }}
                    >
                      <Pin size={16} className="mr-2" />
                      {chatConversations.find(c => c.id === contextMenu.id)?.pinned ? 'Unpin' : 'Pin'} conversation
                    </div>
                    <div 
                      className="px-3 py-1.5 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                      onClick={() => startEditing('conversation', contextMenu.id!)}
                    >
                      <Edit size={16} className="mr-2" />
                      Rename
                    </div>
                    <div 
                      className="px-3 py-1.5 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                      onClick={() => {
                        const conversation = chatConversations.find(c => c.id === contextMenu.id);
                        if (conversation) duplicateConversation(conversation);
                      }}
                    >
                      <Copy size={16} className="mr-2" />
                      Duplicate
                    </div>
                    <div className="border-t dark:border-gray-700 my-1"></div>
                    <div 
                      className="px-3 py-1.5 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center text-red-600 dark:text-red-400"
                      onClick={() => {
                        if (contextMenu.id) deleteChatConversation(contextMenu.id);
                        setContextMenu({ ...contextMenu, visible: false });
                      }}
                    >
                      <Trash2 size={16} className="mr-2" />
                      Delete
                    </div>
                  </>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Conversation Item Component
interface ConversationItemProps {
  conversation: Conversation;
  index: number;
  isActive: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  isEditing: boolean;
  editingName: string;
  setEditingName: (name: string) => void;
  saveEditedName: () => void;
  editInputRef: React.RefObject<HTMLInputElement>;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  index,
  isActive,
  onClick,
  onContextMenu,
  isEditing,
  editingName,
  setEditingName,
  saveEditedName,
  editInputRef
}) => {
  // Get date display
  const dateDisplay = format(new Date(conversation.updatedAt), 'MMM d');
  
  // Get message count
  const messageCount = conversation.messages?.length || 0;
  
  return (
    <Draggable draggableId={conversation.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`group flex items-center px-3 py-2 my-0.5 rounded-md cursor-pointer ${
            isActive 
              ? 'bg-gray-200 dark:bg-gray-700' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          onClick={onClick}
          onContextMenu={onContextMenu}
        >
          <MessageSquare size={16} className="mr-2 flex-shrink-0 text-gray-500" />
          
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                ref={editInputRef}
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={saveEditedName}
                onKeyDown={(e) => e.key === 'Enter' && saveEditedName()}
                className="w-full bg-transparent focus:outline-none text-sm"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div className="flex items-center">
                <span className="text-sm truncate flex-1 mr-1">
                  {conversation.title}
                </span>
                {conversation.pinned && (
                  <Pin size={12} className="flex-shrink-0 text-gray-500" />
                )}
              </div>
            )}
            
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <span className="truncate">{dateDisplay}</span>
              <span className="mx-1">•</span>
              <span>{messageCount} msg</span>
            </div>
          </div>
          
          <button 
            className="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-gray-300 dark:hover:bg-gray-600"
            onClick={(e) => {
              e.stopPropagation();
              onContextMenu(e);
            }}
          >
            <MoreVertical size={14} />
          </button>
        </div>
      )}
    </Draggable>
  );
};

export default Sidebar;
