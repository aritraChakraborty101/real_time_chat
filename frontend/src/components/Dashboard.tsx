import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import SettingsPanel from './SettingsPanel';
import UserSearch from './UserSearch';
import FriendsList from './FriendsList';
import FriendRequests from './FriendRequests';
import DashboardHome from './DashboardHome';
import Conversations from './Conversations';

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const user = authService.getCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleSettings = () => setIsSettingsOpen(!isSettingsOpen);
  const closeSettings = () => setIsSettingsOpen(false);

  // Determine active view from URL
  const getActiveView = () => {
    const path = location.pathname;
    if (path.includes('/search')) return 'search';
    if (path.includes('/friends')) return 'friends';
    if (path.includes('/requests')) return 'requests';
    if (path.includes('/messages')) return 'messages';
    return 'dashboard';
  };

  const handleMenuClick = (view: 'dashboard' | 'search' | 'friends' | 'requests' | 'messages') => {
    navigate(`/dashboard/${view === 'dashboard' ? '' : view}`);
    closeSidebar(); // Close sidebar on mobile after selection
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Navbar */}
      <Navbar 
        onToggleSidebar={toggleSidebar}
        onToggleSettings={toggleSettings}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        activeView={getActiveView()}
        onMenuClick={handleMenuClick}
      />

      {/* Settings Panel */}
      <SettingsPanel 
        isOpen={isSettingsOpen}
        onClose={closeSettings}
        onLogout={onLogout}
      />

      {/* Main Content */}
      <main className="pt-16 lg:pl-64 min-h-screen transition-all duration-200">
        <div className="p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="search" element={
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6">
                  Search Users
                </h1>
                <UserSearch />
              </div>
            } />
            <Route path="friends" element={<FriendsList />} />
            <Route path="requests" element={<FriendRequests />} />
            <Route path="messages" element={<Conversations />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
