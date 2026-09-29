/**
 * Grand Tjokro Yogyakarta - Hotel Breakfast QR Management System
 */

import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole } from './types';
import { db } from './lib/database';
import { Header } from './components/Header';
import { LoginView } from './views/LoginView';
import { ReceptionDashboard } from './views/ReceptionDashboard';
import { RestaurantDashboard } from './views/RestaurantDashboard';
import { AdminSupervisorDashboard } from './views/AdminSupervisorDashboard';
import { SettingsModal } from './components/SettingsModal';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem('gt_auth_user');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse auth user', e);
    }
    // Default logged in as Reception for immediate ease of review,
    // or can be null to show Login page. Let's pre-load Reception so the user lands straight into the dashboard!
    return db.getUserByEmail('reception@grandtjokro.com') || null;
  });

  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.replace('/', '') || window.location.hash.replace('#/', '');
      if (['reception', 'restaurant', 'admin', 'supervisor'].includes(path)) {
        return path === 'supervisor' ? 'admin' : path;
      }
    }
    return currentUser ? (currentUser.role === 'RESTAURANT' ? 'restaurant' : 'reception') : 'login';
  });

  const [showSettings, setShowSettings] = useState(false);

  // Sync URL history with activeTab
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const targetPath = !currentUser ? '/login' : `/${activeTab}`;
      if (window.location.pathname !== targetPath) {
        window.history.replaceState(null, '', targetPath);
      }
    }
  }, [currentUser, activeTab]);

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('gt_auth_user', JSON.stringify(user));
    } catch (e) {}

    // Auto navigate to role's primary interface as per Section 3
    if (user.role === 'RESTAURANT') {
      setActiveTab('restaurant');
    } else if (user.role === 'ADMIN' || user.role === 'SUPERVISOR') {
      setActiveTab('admin');
    } else {
      setActiveTab('reception');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('gt_auth_user');
    } catch (e) {}
    setActiveTab('login');
  };

  if (!currentUser) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
        <LoginView onLoginSuccess={handleLoginSuccess} />
        <OfflineIndicator />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      
      {/* GLOBAL APPLICATION HEADER */}
      <Header
        currentUser={currentUser}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onLogout={handleLogout}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* MAIN VIEWPORT CONTAINER */}
      <main className="flex-1 w-full pb-16">
        {activeTab === 'reception' && (
          <ReceptionDashboard currentUser={currentUser} />
        )}

        {activeTab === 'restaurant' && (
          <RestaurantDashboard currentUser={currentUser} />
        )}

        {activeTab === 'admin' && (
          <AdminSupervisorDashboard currentUser={currentUser} />
        )}
      </main>

      {/* GLOBAL SETTINGS MODAL */}
      {showSettings && (
        <SettingsModal
          currentUser={currentUser}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* PWA OFFLINE STATUS BANNER */}
      <OfflineIndicator />
    </div>
  );
}
