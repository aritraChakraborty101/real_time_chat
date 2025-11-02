import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConversationWithUser, MessageSearchResult } from '../types/auth';
import { messageService } from '../services/messageService';

const Conversations: React.FC = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ConversationWithUser[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<ConversationWithUser[]>([]);
  const [searchResults, setSearchResults] = useState<MessageSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchMode, setSearchMode] = useState(false);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredConversations(conversations);
      setSearchMode(false);
      setSearchResults([]);
    } else {
      // Filter conversations by name
      const filtered = conversations.filter((conv) =>
        (conv.other_user.display_name || conv.other_user.username)
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
      setFilteredConversations(filtered);
    }
  }, [searchQuery, conversations]);

  const loadConversations = async () => {
    try {
      const convos = await messageService.getConversations();
      setConversations(convos);
      if (searchQuery.trim() === '') {
        setFilteredConversations(convos);
      }
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchMessages = async () => {
    if (searchQuery.trim() === '') return;

    setIsSearching(true);
    setSearchMode(true);

    try {
      const results = await messageService.searchMessages(searchQuery);
      setSearchResults(results.results);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search messages');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchMessages();
    }
  };

  const handleMuteConversation = async (conversationId: number, currentlyMuted: boolean, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      await messageService.muteConversation(conversationId, undefined, !currentlyMuted);
      await loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mute conversation');
    }
  };

  const handleConversationClick = (conversation: ConversationWithUser) => {
    navigate(`/dashboard/chat/${conversation.other_user.id}`);
  };

  const handleSearchResultClick = (result: MessageSearchResult) => {
    if (result.conversation_id && result.other_user) {
      navigate(`/dashboard/chat/${result.other_user.id}`);
    } else if (result.group_id && result.group) {
      navigate(`/dashboard/group/${result.group_id}`);
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
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3">
          <svg className="w-6 h-6 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-gray-900 dark:text-white">Loading conversations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Messages
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {conversations.length} {conversations.length === 1 ? 'conversation' : 'conversations'}
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative flex space-x-2">
          <input
            type="text"
            placeholder="Search conversations or messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleSearchKeyPress}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleSearchMessages}
            disabled={isSearching || searchQuery.trim() === ''}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSearching ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </button>
        </div>
        {searchMode && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSearchMode(false);
              setSearchResults([]);
            }}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            ← Back to conversations
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded">
          {error}
        </div>
      )}

      {/* Search Results */}
      {searchMode && (
        <div className="space-y-2 mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Search Results ({searchResults.length})
          </h3>
          {searchResults.length > 0 ? (
            searchResults.map((result, index) => (
              <div
                key={index}
                onClick={() => handleSearchResultClick(result)}
                className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
              >
                <div className="flex items-start space-x-3">
                  {result.other_user && (
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0">
                      {result.other_user.profile_picture ? (
                        <img src={result.other_user.profile_picture} alt={result.other_user.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-semibold">
                          {result.other_user.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  )}
                  {result.group && (
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-green-500 to-blue-600 flex-shrink-0">
                      {result.group.group_picture ? (
                        <img src={result.group.group_picture} alt={result.group.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-semibold">
                          {result.group.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {result.other_user ? (result.other_user.display_name || result.other_user.username) : result.group?.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 truncate mt-1">
                      {result.message.content}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatTime(result.message.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">No messages found</p>
          )}
        </div>
      )}

      {/* Conversations List */}
      {!searchMode && (filteredConversations.length > 0 ? (
        <div className="space-y-2">
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => handleConversationClick(conversation)}
              className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
            >
              {/* Profile Picture */}
              <div className="flex-shrink-0">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600">
                  {conversation.other_user.profile_picture ? (
                    <img
                      src={conversation.other_user.profile_picture}
                      alt={conversation.other_user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-semibold text-xl">
                      {conversation.other_user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* Conversation Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {conversation.other_user.display_name || conversation.other_user.username}
                    </p>
                    {conversation.other_user.is_verified && (
                      <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    {conversation.is_muted && (
                      <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  {conversation.last_message && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTime(conversation.last_message.created_at)}
                    </span>
                  )}
                </div>
                {conversation.last_message ? (
                  <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                    {conversation.last_message.content}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500 italic">No messages yet</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                {/* Mute/Unmute Button */}
                <button
                  onClick={(e) => handleMuteConversation(conversation.id, conversation.is_muted, e)}
                  className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title={conversation.is_muted ? 'Unmute' : 'Mute'}
                >
                  {conversation.is_muted ? (
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>

                {/* Unread Badge */}
                {conversation.unread_count > 0 && (
                  <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full">
                    {conversation.unread_count}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg
            className="mx-auto w-16 h-16 text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchQuery ? 'No conversations found' : 'No conversations yet'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchQuery ? 'Try a different search term' : 'Start chatting with your friends from the Friends list'}
          </p>
        </div>
      ))}
    </div>
  );
};

export default Conversations;
