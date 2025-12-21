// client/src/components/Navbar.js
import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { Car, User, LogOut, Users, ChevronDown, Bell, Check, Trash2, X } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';


const Navbar = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false); // State for notification dropdown
  const { user, logout } = useContext(AuthContext);
  const { notifications, markAsRead, clearAll, removeNotification, unreadCount } = useNotifications();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleBellClick = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    setIsProfileOpen(false); // Close profile if open
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-lg border-b border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo Section */}
            <Link to="/dashboard">
              <div className="flex items-center space-x-3 hover:opacity-90 transition-opacity duration-200 cursor-pointer">
                <div className="p-2 bg-blue-500 rounded-lg shadow-lg">
                  <Car className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">MotorTracker</h1>
                  <p className="text-xs text-blue-200 -mt-1 hidden sm:block">Motor Maintenance</p>
                </div>
              </div>
            </Link>

            {/* Right Side Content */}
            <div className="flex items-center space-x-4">
              {user && (
                <>
                  {/* Notifications Bell */}
                  <div className="relative">
                    <button
                      onClick={handleBellClick}
                      className="p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 cursor-pointer relative"
                    >
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                      )}
                    </button>

                    {/* Notification Dropdown */}
                    {isNotificationsOpen && (
                      <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-800/95 backdrop-blur-lg border border-white/10 rounded-lg shadow-xl py-2 z-50 max-h-[80vh] flex flex-col">
                        <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center bg-slate-800/50 rounded-t-lg">
                          <h3 className="text-sm font-semibold text-white">Notifications</h3>
                          <div className="flex space-x-2">
                            {unreadCount > 0 && (
                              <button onClick={() => notifications.forEach(n => !n.read && markAsRead(n.id))} title="Mark all as read" className="text-blue-300 hover:text-white transition-colors">
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            {notifications.length > 0 && (
                              <button onClick={clearAll} title="Clear all" className="text-red-300 hover:text-red-200 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="overflow-y-auto custom-scrollbar flex-1 p-2 space-y-2">
                          {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-blue-300/50">
                              <Bell className="w-8 h-8 mb-2 opacity-50" />
                              <p className="text-sm">No new notifications</p>
                            </div>
                          ) : (
                            notifications.map(notification => (
                              <div key={notification.id} className={`p-3 rounded-lg border ${notification.read ? 'bg-slate-700/30 border-white/5' : 'bg-blue-500/10 border-blue-500/30'} relative group transition-all duration-200`}>
                                <div className="flex justify-between items-start">
                                  <div className="flex-1 pr-6">
                                    <p className={`text-sm ${notification.read ? 'text-gray-300' : 'text-white font-medium'}`}>{notification.message}</p>
                                    <p className="text-xs text-blue-300/70 mt-1">{new Date(notification.timestamp).toLocaleString()}</p>
                                  </div>
                                  {!notification.read && (
                                    <button onClick={() => markAsRead(notification.id)} className="absolute top-2 right-2 p-1 text-blue-300 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Check className="w-3 h-3" />
                                    </button>
                                  )}
                                  <button onClick={() => removeNotification(notification.id)} className="absolute bottom-2 right-2 p-1 text-red-300/50 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Admin Link */}
                  {user.role === 'admin' && (
                    <div className="hidden sm:flex items-center space-x-2 px-3 py-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 text-sm font-medium cursor-pointer">
                      <Users className="w-4 h-4" />
                      <Link to="/users">Manage Users</Link>
                    </div>
                  )}

                  {/* Mobile Admin Link */}
                  {user.role === 'admin' && (
                    <div className="sm:hidden p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 cursor-pointer"
                      title="Manage Users">
                      <Link to="/users"><Users className="w-5 h-5" /></Link>
                    </div>
                  )}

                  {/* User Profile Section */}
                  <div className="relative">
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="flex items-center space-x-3 p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                    >
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="hidden md:block text-left">
                        <span className="text-sm font-medium text-white">Welcome, {user.username}</span>
                        <p className="text-xs text-blue-300 capitalize">{user.role}</p>
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Profile Dropdown */}
                    {isProfileOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-slate-800/95 backdrop-blur-lg border border-white/10 rounded-lg shadow-xl py-2 z-50">
                        <div className="px-3 py-2 border-b border-white/10">
                          <p className="text-sm font-medium text-white">{user.username}</p>
                          <p className="text-xs text-blue-300 capitalize">{user.role} Account</p>
                        </div>

                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-3 py-2 text-sm text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-all duration-200 flex items-center space-x-2 mt-2"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    )}
                  </div>


                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Backdrop for dropdown */}
      {isProfileOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsProfileOpen(false)}
        ></div>
      )}
    </>
  );
};

export default Navbar;