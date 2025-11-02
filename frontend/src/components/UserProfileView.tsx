import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types/auth';
import { profileService } from '../services/profileService';
import { authService } from '../services/authService';
import ChatInterface from './ChatInterface';

interface UserProfileViewProps {
  userId: number | string;
  onClose: () => void;
}

const UserProfileView: React.FC<UserProfileViewProps> = ({ userId, onClose }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await profileService.getUserProfile(userId);
      setProfile(response.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!profile) return;
    
    setActionLoading(true);
    setError('');
    
    try {
      await profileService.sendFriendRequest(profile.id);
      // Reload profile to update friend status
      await loadProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send friend request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!profile || !window.confirm('Are you sure you want to cancel this friend request?')) return;
    
    setActionLoading(true);
    setError('');
    
    try {
      await profileService.removeFriend(profile.id);
      // Reload profile to update friend status
      await loadProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!profile || !window.confirm('Are you sure you want to remove this friend?')) return;
    
    setActionLoading(true);
    setError('');
    
    try {
      await profileService.removeFriend(profile.id);
      // Reload profile to update friend status
      await loadProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove friend');
    } finally {
      setActionLoading(false);
    }
  };

  const renderFriendButton = () => {
    if (!profile || profile.id === currentUser?.id) return null;

    switch (profile.friend_status) {
      case 'friend':
        return (
          <div className="space-y-2">
            <button
              onClick={() => setShowChat(true)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>Send Message</span>
            </button>
            <button
              onClick={handleRemoveFriend}
              disabled={actionLoading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors duration-200 font-medium disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
              </svg>
              <span>{actionLoading ? 'Removing...' : 'Remove Friend'}</span>
            </button>
          </div>
        );
      
      case 'pending_sent':
        return (
          <button
            onClick={handleCancelRequest}
            disabled={actionLoading}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 font-medium disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>{actionLoading ? 'Canceling...' : 'Cancel Request'}</span>
          </button>
        );
      
      case 'pending_received':
        return (
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            You have a pending friend request from this user
          </div>
        );
      
      default:
        return (
          <button
            onClick={handleSendFriendRequest}
            disabled={actionLoading}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 font-medium disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span>{actionLoading ? 'Sending...' : 'Add Friend'}</span>
          </button>
        );
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8">
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-gray-900 dark:text-white">Loading profile...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative h-32 bg-gradient-to-r from-blue-500 to-purple-600">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            aria-label="Close"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Profile Content */}
        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="flex justify-center -mt-16 mb-4">
            <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden">
              {profile?.profile_picture ? (
                <img src={profile.profile_picture} alt={profile.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white">
                  {profile?.username?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded text-sm">
              {error}
            </div>
          )}

          {/* User Info */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {profile?.display_name || profile?.username}
              </h2>
              {profile?.is_verified && (
                <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <p className="text-gray-600 dark:text-gray-400">@{profile?.username}</p>
          </div>

          {/* Bio */}
          {profile?.bio && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300 text-center whitespace-pre-wrap">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Friends</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {new Date(profile?.created_at || '').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Joined</p>
            </div>
          </div>

          {/* Action Button */}
          {renderFriendButton()}
        </div>
      </div>

      {/* Chat Interface Modal */}
      {showChat && profile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-4xl h-[80vh] bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
            <ChatInterface friend={profile} onClose={() => setShowChat(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileView;
