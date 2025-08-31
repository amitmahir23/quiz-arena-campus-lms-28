import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/auth';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  increment,
  where,
  getDocs
} from 'firebase/firestore';
import { MessageCircle, Users, Plus, ArrowLeft, Send, Hash } from 'lucide-react';

// Types
interface Forum {
  id: string;
  title: string;
  description: string;
  category: string;
  createdAt: any;
  createdBy: string;
  createdByName: string;
  messageCount: number;
  lastActivity: any;
  lastMessageBy?: string;
}

interface Message {
  id: string;
  text: string;
  uid: string;
  userName: string;
  userRole: string;
  createdAt: any;
  edited?: boolean;
  editedAt?: any;
}

const CATEGORIES = [
  'General Discussion',
  'Study Groups',
  'Q&A',
  'Announcements',
  'Technical Help'
];

export default function ForumChatSystem() {
  // Get real auth data
  const { user, profile } = useAuth();
  const currentUser = user;
  
  const [forums, setForums] = useState<Forum[]>([]);
  const [selectedForum, setSelectedForum] = useState<Forum | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [showCreateForum, setShowCreateForum] = useState(false);
  const [newForum, setNewForum] = useState({
    title: '',
    description: '',
    category: CATEGORIES[0]
  });
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch forums
  useEffect(() => {
    const forumsRef = collection(db, 'forums');
    const q = query(forumsRef, orderBy('lastActivity', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const forumData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Forum[];
      setForums(forumData);
    });

    return () => unsubscribe();
  }, []);

  // Fetch messages for selected forum
  useEffect(() => {
    if (!selectedForum) return;

    const messagesRef = collection(db, 'forums', selectedForum.id, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(messageData);
    });

    return () => unsubscribe();
  }, [selectedForum]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createForum = async () => {
    if (!newForum.title.trim() || !newForum.description.trim()) return;

    setLoading(true);
    try {
      const forumsRef = collection(db, 'forums');
      await addDoc(forumsRef, {
        title: newForum.title,
        description: newForum.description,
        category: newForum.category,
        createdAt: serverTimestamp(),
        createdBy: currentUser.id,
        createdByName: profile.full_name,
        messageCount: 0,
        lastActivity: serverTimestamp()
      });

      setNewForum({ title: '', description: '', category: CATEGORIES[0] });
      setShowCreateForum(false);
    } catch (error) {
      console.error('Error creating forum:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedForum) return;

    setLoading(true);
    try {
      // Add message
      const messagesRef = collection(db, 'forums', selectedForum.id, 'messages');
      await addDoc(messagesRef, {
        text: messageInput,
        uid: currentUser.id,
        userName: profile.full_name,
        userRole: profile.role,
        createdAt: serverTimestamp()
      });

      // Update forum stats
      const forumRef = doc(db, 'forums', selectedForum.id);
      await updateDoc(forumRef, {
        messageCount: increment(1),
        lastActivity: serverTimestamp(),
        lastMessageBy: profile.full_name
      });

      setMessageInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMessageKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filteredForums = selectedCategory === 'All' 
    ? forums 
    : forums.filter(forum => forum.category === selectedCategory);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-red-600';
      case 'instructor': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'instructor': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Please sign in to access the forums.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      {!selectedForum ? (
        // Forums List View
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Discussion Forums</h1>
              <p className="text-gray-600">Join conversations and connect with the community</p>
            </div>
            <button
              onClick={() => setShowCreateForum(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Forum
            </button>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === 'All'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              All Categories
            </button>
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Forums Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredForums.map(forum => (
              <div
                key={forum.id}
                onClick={() => setSelectedForum(forum)}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <Hash className="w-5 h-5 text-purple-600 mt-1" />
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                    {forum.category}
                  </span>
                </div>
                
                <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
                  {forum.title}
                </h3>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {forum.description}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      {forum.messageCount || 0}
                    </span>
                  </div>
                  
                  {forum.lastMessageBy && (
                    <span className="text-xs">
                      Last: {forum.lastMessageBy}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredForums.length === 0 && (
            <div className="text-center py-12">
              <MessageCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">
                {selectedCategory === 'All' ? 'No forums created yet.' : `No forums in ${selectedCategory} category.`}
              </p>
            </div>
          )}
        </div>
      ) : (
        // Chat View
        <div className="space-y-4">
          {/* Chat Header */}
          <div className="flex items-center gap-4 pb-4 border-b">
            <button
              onClick={() => setSelectedForum(null)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{selectedForum.title}</h2>
              <p className="text-sm text-gray-600">{selectedForum.description}</p>
            </div>
            
            <div className="text-right">
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                {selectedForum.category}
              </span>
              <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Users className="w-3 h-3" />
                {selectedForum.messageCount || 0} messages
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="h-[500px] overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.uid === currentUser.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                        message.uid === currentUser.id
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {message.uid !== currentUser.id && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">
                            {message.userName}
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${getRoleBadge(message.userRole)}`}>
                            {message.userRole}
                          </span>
                        </div>
                      )}
                      
                      <div className="break-words">{message.text}</div>
                      
                      {message.createdAt && (
                        <div className={`text-xs mt-1 ${
                          message.uid === currentUser.id ? 'text-purple-200' : 'text-gray-500'
                        }`}>
                          {new Date(message.createdAt.toDate()).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {message.edited && ' (edited)'}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t p-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleMessageKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={loading || !messageInput.trim()}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Forum Modal */}
      {showCreateForum && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Forum</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Forum Title
                </label>
                <input
                  type="text"
                  value={newForum.title}
                  onChange={(e) => setNewForum({...newForum, title: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter forum title..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newForum.description}
                  onChange={(e) => setNewForum({...newForum, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 h-20 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Describe what this forum is about..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={newForum.category}
                  onChange={(e) => setNewForum({...newForum, category: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForum(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={createForum}
                  disabled={loading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white py-2 rounded-lg transition-colors"
                >
                  {loading ? 'Creating...' : 'Create Forum'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function getRoleBadge(role: string): string {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'instructor': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}