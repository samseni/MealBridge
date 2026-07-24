import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import messagesAPI from '../../api/messages.api';
import { showToast } from './ToastProvider';
import axios from '../../api/axios';

export default function Chat() {
  const { user } = useAuth();
  const socket = useSocket();
  const [conversations, setConversations] = useState([]);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();

    if (socket) {
      socket.on('message:new', (data) => {
        // Add new message to the list if the conversation is open
        if (selectedClaim && data.claim_id === selectedClaim.claim_id) {
          setMessages(prev => [...prev, data]);
          // Mark as read automatically
          messagesAPI.markAsRead(data.claim_id).catch(console.error);
        }
        // Refresh conversations to update unread count
        fetchConversations();
      });

      return () => {
        socket.off('message:new');
      };
    }
  }, [socket, selectedClaim]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const response = await messagesAPI.getUserConversations();
      setConversations(response.data.conversations);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  const selectConversation = async (conversation) => {
    setSelectedClaim(conversation);
    try {
      const response = await messagesAPI.getClaimMessages(conversation.claim_id);
      setMessages(response.data.messages);
      // Mark messages as read
      await messagesAPI.markAsRead(conversation.claim_id);
      fetchConversations(); // Update unread count
    } catch (error) {
      showToast.error('Failed to load messages');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedClaim) return;

    setSending(true);
    try {
      const response = await messagesAPI.sendMessage({
        claim_id: selectedClaim.claim_id,
        message: newMessage.trim()
      });
      setMessages(prev => [...prev, response.data.data]);
      setNewMessage('');
      fetchConversations(); // Update last message
    } catch (error) {
      showToast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getProfilePictureUrl = (picturePath) => {
    if (picturePath) {
      return `${axios.defaults.baseURL.replace('/api', '')}${picturePath}`;
    }
    return null;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="flex h-[calc(100vh-200px)] bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Conversations List */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-5xl mb-3">💬</div>
              <p className="text-gray-600">No conversations yet</p>
              <p className="text-sm text-gray-500 mt-2">
                Messages will appear here when you claim or donate food
              </p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.claim_id}
                onClick={() => selectConversation(conv)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedClaim?.claim_id === conv.claim_id ? 'bg-primary-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {getProfilePictureUrl(conv.other_user_picture) ? (
                    <img
                      src={getProfilePictureUrl(conv.other_user_picture)}
                      alt={conv.other_user_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                      {conv.other_user_name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {conv.other_user_org || conv.other_user_name}
                      </h3>
                      {conv.last_message_time && (
                        <span className="text-xs text-gray-500">
                          {formatTime(conv.last_message_time)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate mb-1">{conv.listing_title}</p>
                    {conv.last_message && (
                      <p className="text-sm text-gray-500 truncate">{conv.last_message}</p>
                    )}
                    {conv.unread_count > 0 && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-primary-500 text-white text-xs rounded-full">
                        {conv.unread_count} new
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        {selectedClaim ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                {getProfilePictureUrl(selectedClaim.other_user_picture) ? (
                  <img
                    src={getProfilePictureUrl(selectedClaim.other_user_picture)}
                    alt={selectedClaim.other_user_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                    {selectedClaim.other_user_name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {selectedClaim.other_user_org || selectedClaim.other_user_name}
                  </h3>
                  <p className="text-sm text-gray-600">{selectedClaim.listing_title}</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => {
                const isOwnMessage = msg.sender_id === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        isOwnMessage
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isOwnMessage ? 'text-primary-100' : 'text-gray-500'
                        }`}
                      >
                        {new Date(msg.created_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="input flex-1"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="btn btn-primary"
                >
                  {sending ? '...' : 'Send'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-lg">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}