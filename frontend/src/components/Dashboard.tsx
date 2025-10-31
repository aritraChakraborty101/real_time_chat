import React from 'react';
import { authService } from '../services/authService';
import ThemeToggle from './ThemeToggle';

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      <ThemeToggle />
      <nav className="bg-white dark:bg-gray-800 shadow-lg transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Real-Time Chat</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 dark:text-gray-300">Welcome, {user?.username}!</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 transition-colors duration-200">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Dashboard</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 transition-colors duration-200">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">User Information</h3>
              <div className="space-y-2 text-gray-700 dark:text-gray-300">
                <p><span className="font-medium">Email:</span> {user?.email}</p>
                <p><span className="font-medium">Username:</span> {user?.username}</p>
                <p>
                  <span className="font-medium">Status:</span>{' '}
                  <span className="text-green-600 dark:text-green-400 font-semibold">
                    {user?.is_verified ? 'Verified ✓' : 'Not Verified'}
                  </span>
                </p>
                <p><span className="font-medium">Joined:</span> {new Date(user?.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 transition-colors duration-200">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Quick Stats</h3>
              <div className="space-y-2 text-gray-700 dark:text-gray-300">
                <p><span className="font-medium">Total Messages:</span> 0</p>
                <p><span className="font-medium">Active Chats:</span> 0</p>
                <p><span className="font-medium">Online Friends:</span> 0</p>
              </div>
            </div>
          </div>

          <div className="border-t dark:border-gray-700 pt-6 transition-colors duration-200">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Getting Started</h3>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-500 p-4 transition-colors duration-200">
              <p className="text-yellow-800 dark:text-yellow-300">
                <span className="font-semibold">Welcome to Real-Time Chat!</span>
                <br />
                Your account has been successfully created and verified. 
                Chat features are coming soon!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
