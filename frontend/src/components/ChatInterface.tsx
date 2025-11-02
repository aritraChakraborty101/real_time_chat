import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Message, UserProfile } from '../types/auth';
import { messageService } from '../services/messageService';
import { profileService } from '../services/profileService';
import { authService } from '../services/authService';

interface ChatInterfaceProps {
  friend?: UserProfile;
  onClose?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ friend: propFriend, onClose }) => {
  const { friendId } = useParams<{ friendId: string }>();
  const navigate = useNavigate();
  const [friend, setFriend] = useState<UserProfile | null>(propFriend || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editContent, setEditContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    if (friendId && !propFriend) {
      loadFriend();
    } else if (propFriend) {
      setFriend(propFriend);
    }
  }, [friendId, propFriend]);

  useEffect(() => {
    if (friend) {
      loadMessages();
      const interval = setInterval(() => {
        loadMessages();
        checkTypingStatus();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [friend]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadFriend = async () => {
    if (!friendId) return;
    
    try {
      const response = await profileService.getUserProfile(parseInt(friendId));
      setFriend(response.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load friend profile');
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    if (!friend) return;
    
    try {
      const msgs = await messageService.getMessages(friend.id);
      setMessages(msgs);
      
      // Mark messages as read when viewing
      await messageService.markConversationAsRead(friend.id);
      
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const checkTypingStatus = async () => {
    if (!friend) return;
    
    try {
      const status = await messageService.getTypingStatus(friend.id);
      setOtherUserTyping(status.is_typing);
    } catch (err) {
      // Silently fail for typing status
    }
  };

  const handleTyping = async () => {
    if (!friend || isTyping) return;

    setIsTyping(true);
    try {
      await messageService.updateTypingStatus(friend.id, true);
    } catch (err) {
      // Silently fail
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(async () => {
      setIsTyping(false);
      try {
        await messageService.updateTypingStatus(friend.id, false);
      } catch (err) {
        // Silently fail
      }
    }, 3000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!newMessage.trim() && !editingMessage) || sending || !friend) return;

    // Clear typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsTyping(false);
    try {
      await messageService.updateTypingStatus(friend.id, false);
    } catch (err) {
      // Silently fail
    }

    setSending(true);
    try {
      if (editingMessage) {
        // Edit existing message
        await messageService.editMessage(editingMessage.id, editContent);
        setEditingMessage(null);
        setEditContent('');
      } else {
        // Send new message
        await messageService.sendMessage(friend.id, newMessage.trim(), replyToMessage?.id);
        setNewMessage('');
        setReplyToMessage(null);
      }
      await loadMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: number, deleteForEveryone: boolean) => {
    if (!window.confirm(deleteForEveryone ? 
      'Delete this message for everyone? This cannot be undone.' : 
      'Delete this message for you?')) {
      return;
    }

    try {
      await messageService.deleteMessage(messageId, deleteForEveryone);
      await loadMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message');
    }
  };

  const handleEditMessage = (message: Message) => {
    setEditingMessage(message);
    setEditContent(message.content);
    setReplyToMessage(null);
  };

  const handleReplyToMessage = (message: Message) => {
    setReplyToMessage(message);
    setEditingMessage(null);
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setEditContent('');
  };

  const cancelReply = () => {
    setReplyToMessage(null);
  };

  const canEditMessage = (message: Message): boolean => {
    if (message.sender_id !== currentUser?.id) return false;
    if (message.is_deleted) return false;
    
    const createdAt = new Date(message.created_at);
    const now = new Date();
    const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
    
    return diffMinutes < 15; // Can edit within 15 minutes
  };

  const canDeleteMessage = (message: Message): boolean => {
    return message.sender_id === currentUser?.id && !message.is_deleted;
  };

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/dashboard/messages');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + 
             date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
  };

  const renderMessageStatus = (status: string) => {
    if (status === 'read') {
      // Double checkmark (blue)
      return (
        <span className="inline-flex ml-1 text-blue-400">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
            <path d="M7 18l-2-2 5-5-2-2-5 5-2-2L7 5l2 2-5 5z" transform="translate(3, 0)" />
          </svg>
        </span>
      );
    } else if (status === 'delivered') {
      // Double checkmark (gray)
      return (
        <span className="inline-flex ml-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
            <path d="M7 18l-2-2 5-5-2-2-5 5-2-2L7 5l2 2-5 5z" transform="translate(3, 0)" />
          </svg>
        </span>
      );
    } else {
      // Single checkmark (sent)
      return (
        <span className="inline-flex ml-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
          </svg>
        </span>
      );
    }
  };

  if (!friend && loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3">
          <svg className="w-6 h-6 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-gray-900 dark:text-white">Loading chat...</span>
        </div>
      </div>
    );
  }

  if (!friend) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-gray-900 dark:text-white mb-4">Friend not found</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Messages
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-3">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {/* Profile Picture */}
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0">
            {friend.profile_picture ? (
              <img src={friend.profile_picture} alt={friend.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-semibold">
                {friend.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          {/* Friend Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {friend.display_name || friend.username}
              </h2>
              {friend.is_verified && (
                <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">@{friend.username}</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ minHeight: '400px', maxHeight: 'calc(100vh - 250px)' }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-gray-500 dark:text-gray-400">Loading messages...</span>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 mb-2">No messages yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Start a conversation with {friend.display_name || friend.username}!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const isOwnMessage = message.sender_id === currentUser?.id;
              const isDeleted = message.is_deleted || message.deleted_for_everyone;
              
              return (
                <div
                  key={message.id}
                  className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md group`}>
                    {/* Reply quote if this message is a reply */}
                    {message.reply_to_message && (
                      <div className={`text-xs px-3 py-1 mb-1 rounded border-l-2 ${
                        isOwnMessage
                          ? 'bg-blue-500 text-white border-blue-300'
                          : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-400'
                      }`}>
                        <p className="font-semibold">Replying to:</p>
                        <p className="truncate">{message.reply_to_message.content}</p>
                      </div>
                    )}
                    
                    {/* Message bubble */}
                    <div className="relative">
                      <div
                        className={`px-4 py-2 rounded-lg ${
                          isOwnMessage
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none'
                        } ${isDeleted ? 'italic opacity-60' : ''}`}
                      >
                        <p className="break-words">
                          {isDeleted ? (
                            message.deleted_for_everyone ? 
                              '🚫 This message was deleted' : 
                              '🚫 You deleted this message'
                          ) : (
                            message.content
                          )}
                        </p>
                        <p
                          className={`text-xs mt-1 flex items-center justify-between ${
                            isOwnMessage ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          <span>
                            {formatTime(message.created_at)}
                            {message.is_edited && <span className="ml-1">(edited)</span>}
                          </span>
                          {isOwnMessage && !isDeleted && renderMessageStatus(message.status)}
                        </p>
                      </div>
                      
                      {/* Context menu for own messages */}
                      {isOwnMessage && !isDeleted && (
                        <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex space-x-1 bg-white dark:bg-gray-800 rounded shadow-lg p-1">
                            {canEditMessage(message) && (
                              <button
                                onClick={() => handleEditMessage(message)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                title="Edit"
                              >
                                <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => handleReplyToMessage(message)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                              title="Reply"
                            >
                              <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                              </svg>
                            </button>
                            {canDeleteMessage(message) && (
                              <>
                                <button
                                  onClick={() => handleDeleteMessage(message.id, false)}
                                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                  title="Delete for me"
                                >
                                  <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                                {canEditMessage(message) && (
                                  <button
                                    onClick={() => handleDeleteMessage(message.id, true)}
                                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                                    title="Delete for everyone"
                                  >
                                    <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Reply button for other's messages */}
                      {!isOwnMessage && !isDeleted && (
                        <div className="absolute left-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleReplyToMessage(message)}
                            className="p-1 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded shadow-lg"
                            title="Reply"
                          >
                            <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {otherUserTyping && (
              <div className="flex justify-start">
                <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 rounded-bl-none">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-4 py-2 bg-red-100 dark:bg-red-900/30 border-t border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {/* Reply/Edit indicator */}
        {(replyToMessage || editingMessage) && (
          <div className="px-4 pt-3 pb-2 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between bg-gray-100 dark:bg-gray-700/50 rounded p-2">
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  {editingMessage ? 'Editing message' : `Replying to ${friend.display_name || friend.username}`}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                  {editingMessage ? editingMessage.content : replyToMessage?.content}
                </p>
              </div>
              <button
                type="button"
                onClick={editingMessage ? cancelEdit : cancelReply}
                className="ml-2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
        
        <div className="p-4 flex space-x-2">
          <input
            type="text"
            value={editingMessage ? editContent : newMessage}
            onChange={(e) => {
              if (editingMessage) {
                setEditContent(e.target.value);
              } else {
                setNewMessage(e.target.value);
                handleTyping();
              }
            }}
            placeholder={editingMessage ? "Edit message..." : "Type a message..."}
            disabled={sending}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
          <button
            type="submit"
            disabled={(editingMessage ? !editContent.trim() : !newMessage.trim()) || sending}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {sending ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : editingMessage ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
