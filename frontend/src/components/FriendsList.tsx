import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types/auth';
import { profileService } from '../services/profileService';
import UserProfileView from './UserProfileView';
import ChatInterface from './ChatInterface';

const FriendsList: React.FC = () => {
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [chatWithUser, setChatWithUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    setLoading(true);
    setError('');

    try {
      const friendsList = await profileService.getFriends();
      setFriends(friendsList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (userId: number) => {
    setSelectedUser(userId);
  };

  const handleChatClick = (e: React.MouseEvent, friend: UserProfile) => {
    e.stopPropagation();
    setChatWithUser(friend);
  };

  const closeProfile = () => {
    setSelectedUser(null);
    // Refresh friends list to update status
    loadFriends();
  };

  const closeChat = () => {
    setChatWithUser(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3">
          <svg className="w-6 h-6 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-gray-900 dark:text-white">Loading friends...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          My Friends
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {friends.length} {friends.length === 1 ? 'friend' : 'friends'}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded">
          {error}
        </div>
      )}

      {/* Friends List */}
      {friends.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {friends.map((friend) => (
            <div
              key={friend.id}
              onClick={() => handleUserClick(friend.id)}
              className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
            >
              {/* Profile Picture */}
              <div className="flex-shrink-0">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600">
                  {friend.profile_picture ? (
                    <img src={friend.profile_picture} alt={friend.username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-semibold text-xl">
                      {friend.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* Friend Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {friend.display_name || friend.username}
                  </p>
                  {friend.is_verified && (
                    <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">@{friend.username}</p>
                {friend.bio && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 truncate mt-1">
                    {friend.bio}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => handleChatClick(e, friend)}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  title="Start chat"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg className="mx-auto w-16 h-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No friends yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Start by searching for users and sending friend requests
          </p>
        </div>
      )}

      {/* User Profile Modal */}
      {selectedUser && (
        <UserProfileView
          userId={selectedUser}
          onClose={closeProfile}
        />
      )}

      {/* Chat Modal */}
      {chatWithUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-4xl h-[80vh] bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
            <ChatInterface friend={chatWithUser} onClose={closeChat} />
          </div>
        </div>
      )}
    </div>
  );
};

export default FriendsList;
