import React, { useState, useEffect } from 'react';
import { FriendRequestResponse } from '../types/auth';
import { profileService } from '../services/profileService';
import UserProfileView from './UserProfileView';

const FriendRequests: React.FC = () => {
  const [requests, setRequests] = useState<FriendRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    setError('');

    try {
      const requestsList = await profileService.getFriendRequests();
      setRequests(requestsList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load friend requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (friendId: number) => {
    setActionLoading(friendId);
    setError('');

    try {
      await profileService.respondToFriendRequest(friendId, 'accept');
      // Remove from list after accepting
      setRequests(requests.filter(req => req.friend.id !== friendId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (friendId: number) => {
    setActionLoading(friendId);
    setError('');

    try {
      await profileService.respondToFriendRequest(friendId, 'reject');
      // Remove from list after declining
      setRequests(requests.filter(req => req.friend.id !== friendId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decline request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUserClick = (userId: number) => {
    setSelectedUser(userId);
  };

  const closeProfile = () => {
    setSelectedUser(null);
    // Refresh requests to update status
    loadRequests();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3">
          <svg className="w-6 h-6 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-gray-900 dark:text-white">Loading requests...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Friend Requests
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {requests.length} pending {requests.length === 1 ? 'request' : 'requests'}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded">
          {error}
        </div>
      )}

      {/* Requests List */}
      {requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              {/* Profile Picture - Clickable */}
              <div
                onClick={() => handleUserClick(request.friend.id)}
                className="flex-shrink-0 cursor-pointer"
              >
                <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 hover:ring-2 hover:ring-blue-500 transition-all duration-200">
                  {request.friend.profile_picture ? (
                    <img src={request.friend.profile_picture} alt={request.friend.username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-semibold text-xl">
                      {request.friend.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* User Info - Clickable */}
              <div
                onClick={() => handleUserClick(request.friend.id)}
                className="flex-1 min-w-0 cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate hover:underline">
                    {request.friend.display_name || request.friend.username}
                  </p>
                  {request.friend.is_verified && (
                    <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">@{request.friend.username}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {new Date(request.created_at).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex-shrink-0 flex space-x-2">
                <button
                  onClick={() => handleAccept(request.friend.id)}
                  disabled={actionLoading === request.friend.id}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === request.friend.id ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    'Accept'
                  )}
                </button>
                <button
                  onClick={() => handleDecline(request.friend.id)}
                  disabled={actionLoading === request.friend.id}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-800 dark:text-white text-sm font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg className="mx-auto w-16 h-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No pending requests</h3>
          <p className="text-gray-500 dark:text-gray-400">
            You're all caught up! New friend requests will appear here.
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
    </div>
  );
};

export default FriendRequests;
