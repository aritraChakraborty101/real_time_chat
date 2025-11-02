import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GroupWithDetails } from '../types/auth';
import { groupService } from '../services/groupService';
import { messageService } from '../services/messageService';
import CreateGroup from './CreateGroup';

const Groups: React.FC = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<GroupWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const groupsList = await groupService.getUserGroups();
      setGroups(groupsList);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleGroupClick = (group: GroupWithDetails) => {
    navigate(`/dashboard/group/${group.id}`);
  };

  const handleMuteGroup = async (groupId: number, currentlyMuted: boolean, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      await messageService.muteConversation(undefined, groupId, !currentlyMuted);
      await loadGroups();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mute group');
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
          <span className="text-gray-900 dark:text-white">Loading groups...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Groups
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {groups.length} {groups.length === 1 ? 'group' : 'groups'}
          </p>
        </div>
        <button
          onClick={() => setShowCreateGroup(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Create Group</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded">
          {error}
        </div>
      )}

      {/* Groups List */}
      {groups.length > 0 ? (
        <div className="space-y-2">
          {groups.map((group) => (
            <div
              key={group.id}
              onClick={() => handleGroupClick(group)}
              className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
            >
              {/* Group Picture */}
              <div className="flex-shrink-0">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-green-500 to-blue-600">
                  {group.group_picture ? (
                    <img
                      src={group.group_picture}
                      alt={group.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-semibold text-xl">
                      {group.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* Group Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {group.name}
                    </p>
                    {group.user_role === 'admin' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        Admin
                      </span>
                    )}
                    {group.is_muted && (
                      <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  {group.last_message && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTime(group.last_message.created_at)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
                </p>
                {group.last_message ? (
                  <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                    {group.last_message.content}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500 italic">No messages yet</p>
                )}
              </div>

              {/* Mute/Unmute Button */}
              <button
                onClick={(e) => handleMuteGroup(group.id, group.is_muted, e)}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-shrink-0"
                title={group.is_muted ? 'Unmute' : 'Mute'}
              >
                {group.is_muted ? (
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No groups yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Create a group to start chatting with multiple friends
          </p>
          <button
            onClick={() => setShowCreateGroup(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Your First Group
          </button>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <CreateGroup
          onClose={() => setShowCreateGroup(false)}
          onGroupCreated={() => {
            setShowCreateGroup(false);
            loadGroups();
          }}
        />
      )}
    </div>
  );
};

export default Groups;
