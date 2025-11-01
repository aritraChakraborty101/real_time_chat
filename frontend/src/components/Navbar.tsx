import React from 'react';
import { authService } from '../services/authService';

interface NavbarProps {
  onToggleSidebar: () => void;
  onToggleSettings: () => void;
  isSidebarOpen: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, onToggleSettings, isSidebarOpen }) => {
  const user = authService.getCurrentUser();

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm z-40 transition-colors duration-200">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left section - Menu button and Logo */}
        <div className="flex items-center space-x-4">
          {/* Hamburger menu button */}
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 lg:hidden"
            aria-label="Toggle sidebar"
          >
            <svg
              className="w-6 h-6 text-gray-600 dark:text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isSidebarOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white hidden sm:block">
               Chat Buddy
            </h1>
          </div>
        </div>

        {/* Right section - User info and settings */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* User greeting - hidden on small screens */}
          <span className="text-sm text-gray-600 dark:text-gray-300 hidden md:block">
            Welcome, <span className="font-medium">{user?.username}</span>
          </span>

          {/* User avatar with dropdown */}
          <div className="flex items-center space-x-2">
            {/* User avatar */}
            <button
              onClick={onToggleSettings}
              className="flex items-center space-x-2 p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              aria-label="Open settings"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <svg className="w-4 h-4 text-gray-600 dark:text-gray-300 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
