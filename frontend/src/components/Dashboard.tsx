import React, { useState } from 'react';
import { authService } from '../services/authService';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import SettingsPanel from './SettingsPanel';

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const user = authService.getCurrentUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleSettings = () => setIsSettingsOpen(!isSettingsOpen);
  const closeSettings = () => setIsSettingsOpen(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Navbar */}
      <Navbar 
        onToggleSidebar={toggleSidebar}
        onToggleSettings={toggleSettings}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      {/* Settings Panel */}
      <SettingsPanel 
        isOpen={isSettingsOpen}
        onClose={closeSettings}
        onLogout={onLogout}
      />

      {/* Main Content */}
      <main className="pt-16 lg:pl-64 min-h-screen transition-all duration-200">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Welcome Section */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back, {user?.username}! 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Here's what's happening with your chats today.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
            {/* Total Messages */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Messages</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">0</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Active Chats */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Chats</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">0</p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Friends Online */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Friends Online</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">0</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Unread */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unread Messages</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">0</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* User Information Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-200">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Information</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</span>
                  <span className="text-sm text-gray-900 dark:text-white">{user?.email}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Username</span>
                  <span className="text-sm text-gray-900 dark:text-white">{user?.username}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Account Status</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    <svg className="w-2 h-2 mr-1" fill="currentColor" viewBox="0 0 8 8">
                      <circle cx="4" cy="4" r="3" />
                    </svg>
                    {user?.is_verified ? 'Verified' : 'Not Verified'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Member Since</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {new Date(user?.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-sm p-6 text-white">
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button className="w-full flex items-center space-x-3 p-3 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all duration-200">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="text-sm font-medium">New Chat</span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all duration-200">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span className="text-sm font-medium">Add Friend</span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all duration-200">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-sm font-medium">Create Group</span>
                </button>
              </div>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-l-4 border-yellow-400 dark:border-yellow-500 rounded-lg p-6 shadow-sm">
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-200 mb-1">
                  Welcome to Real-Time Chat!
                </h3>
                <p className="text-yellow-800 dark:text-yellow-300 text-sm">
                  Your account has been successfully created and verified. We're working on exciting chat features that will be available soon. Stay tuned!
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
