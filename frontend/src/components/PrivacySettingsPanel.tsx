import React, { useState, useEffect } from 'react';
import { privacyService, PrivacySettings, UpdatePrivacySettingsRequest } from '../services/privacyService';

interface PrivacySettingsPanelProps {
  onClose: () => void;
}

const PrivacySettingsPanel: React.FC<PrivacySettingsPanelProps> = ({ onClose }) => {
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [profilePictureVisibility, setProfilePictureVisibility] = useState<'everyone' | 'friends' | 'nobody'>('everyone');
  const [lastSeenVisibility, setLastSeenVisibility] = useState<'everyone' | 'friends' | 'nobody'>('everyone');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchPrivacySettings();
  }, []);

  const fetchPrivacySettings = async () => {
    try {
      setLoading(true);
      const data = await privacyService.getPrivacySettings();
      setSettings(data);
      setProfilePictureVisibility(data.profile_picture_visibility);
      setLastSeenVisibility(data.last_seen_visibility);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const updateData: UpdatePrivacySettingsRequest = {
        profile_picture_visibility: profilePictureVisibility,
        last_seen_visibility: lastSeenVisibility,
      };

      const updatedSettings = await privacyService.updatePrivacySettings(updateData);
      setSettings(updatedSettings);
      setSuccess('Privacy settings updated successfully!');
      
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update privacy settings');
    } finally {
      setSaving(false);
    }
  };

  const VisibilityOption = ({ 
    value, 
    current, 
    onChange, 
    label, 
    description 
  }: { 
    value: 'everyone' | 'friends' | 'nobody'; 
    current: string; 
    onChange: (value: 'everyone' | 'friends' | 'nobody') => void; 
    label: string; 
    description: string;
  }) => (
    <button
      onClick={() => onChange(value)}
      className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
        current === value
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      <div className="flex items-center">
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${
          current === value
            ? 'border-blue-500'
            : 'border-gray-300 dark:border-gray-600'
        }`}>
          {current === value && (
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          )}
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{label}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>
    </button>
  );

  if (loading) {
    return (
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8 transition-colors duration-200">
        <div className="flex items-center justify-center py-12">
          <svg className="w-8 h-8 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8 transition-colors duration-200 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Privacy Settings</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          aria-label="Close"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-400 rounded">
          {success}
        </div>
      )}

      <div className="space-y-8">
        {/* Profile Picture Visibility */}
        <div>
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Picture</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Control who can see your profile picture</p>
            </div>
          </div>
          <div className="space-y-2">
            <VisibilityOption
              value="everyone"
              current={profilePictureVisibility}
              onChange={setProfilePictureVisibility}
              label="Everyone"
              description="Anyone can see your profile picture"
            />
            <VisibilityOption
              value="friends"
              current={profilePictureVisibility}
              onChange={setProfilePictureVisibility}
              label="My Friends"
              description="Only your friends can see your profile picture"
            />
            <VisibilityOption
              value="nobody"
              current={profilePictureVisibility}
              onChange={setProfilePictureVisibility}
              label="Nobody"
              description="Hide your profile picture from everyone"
            />
          </div>
        </div>

        {/* Last Seen Visibility */}
        <div>
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Last Seen</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Control who can see your last seen status</p>
            </div>
          </div>
          <div className="space-y-2">
            <VisibilityOption
              value="everyone"
              current={lastSeenVisibility}
              onChange={setLastSeenVisibility}
              label="Everyone"
              description="Anyone can see when you were last active"
            />
            <VisibilityOption
              value="friends"
              current={lastSeenVisibility}
              onChange={setLastSeenVisibility}
              label="My Friends"
              description="Only your friends can see when you were last active"
            />
            <VisibilityOption
              value="nobody"
              current={lastSeenVisibility}
              onChange={setLastSeenVisibility}
              label="Nobody"
              description="Hide your last seen status from everyone"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-800 dark:text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettingsPanel;
