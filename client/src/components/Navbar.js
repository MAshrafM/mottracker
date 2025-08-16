// client/src/components/Navbar.js
import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { Car, User, LogOut, Users, ChevronDown } from 'lucide-react';

const Navbar = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
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

                  {/* Mobile Welcome Text */}
                  <div className="md:hidden">
                    <span className="text-sm text-blue-200">Hi, {user.username.split(' ')[0]}</span>
                  </div>

                  {/* Logout Button (Fallback) */}
                  <button
                    onClick={handleLogout}
                    className="md:hidden p-2 text-red-300 hover:text-red-200 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
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