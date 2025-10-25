// client/src/pages/UserManagementPage.js
import React, { useState, useEffect, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { Users, UserPlus, Edit3, Trash2, Save, X, Shield, User, Crown, Loader } from 'lucide-react';
import api from '../services/api';
import AuthContext from '../context/AuthContext';

const UserManagementPage = () => {
  const { user: loggedInUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // State for the create/edit form
  const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'user' });
  const [isEditing, setIsEditing] = useState(null); // Will hold user ID when editing

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.data);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to fetch users.');
      console.error(err);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        // Update user
        const { password, ...updateData } = formData; // Exclude password from update
        await api.put(`/users/${isEditing}`, updateData);
      } else {
        // Create user
        await api.post('/users', formData);
      }
      resetForm();
      fetchUsers(); // Refresh the list
    } catch (err) {
      setError('Failed to save user.');
      console.error(err);
    }
  };

  const handleEdit = (user) => {
    setIsEditing(user._id);
    setFormData({ username: user.username, email: user.email, role: user.role, password: '' });
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/users/${userId}`);
        fetchUsers(); // Refresh the list
      } catch (err) {
        setError('Failed to delete user.');
        console.error(err);
      }
    }
  };

  const resetForm = () => {
    setIsEditing(null);
    setFormData({ username: '', email: '', password: '', role: 'user' });
  };

  // Security check: Only admins can access this page
  if (loggedInUser?.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  if (loggedInUser?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="bg-red-500/20 backdrop-blur-lg rounded-xl border border-red-500/30 p-8 shadow-xl">
          <p className="text-red-300 text-lg">Access Denied: Admin privileges required</p>
        </div>
      </div>
    );
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4" />;
      case 'manager': return <Shield className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'text-purple-300 bg-purple-500/20 border-purple-500/30';
      case 'manager': return 'text-blue-300 bg-blue-500/20 border-blue-500/30';
      default: return 'text-green-300 bg-green-500/20 border-green-500/30';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-8 shadow-xl flex items-center space-x-3">
          <Loader className="w-6 h-6 text-blue-400 animate-spin" />
          <p className="text-white text-lg">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="bg-red-500/20 backdrop-blur-lg rounded-xl border border-red-500/30 p-8 shadow-xl">
          <p className="text-red-300 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Background Pattern */}
      <div className="absolute inset-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 shadow-xl mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <h2 className="text-3xl font-bold text-white">User Management</h2>
          </div>
        </div>

        {/* Form for Creating/Editing Users */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 shadow-xl mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              {isEditing ? <Edit3 className="w-5 h-5 text-blue-400" /> : <UserPlus className="w-5 h-5 text-blue-400" />}
            </div>
            <h3 className="text-xl font-semibold text-white">
              {isEditing ? 'Edit User' : 'Create New User'}
            </h3>
          </div>

          <div onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">Username</label>
                <input
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Enter username"
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">Email</label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">Password</label>
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder={isEditing ? "Leave blank to keep current" : "Enter password"}
                  disabled={isEditing}
                  required={!isEditing}
                  className={`w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all"
                >
                  <option value="user" className="bg-slate-800 text-white">User</option>
                  <option value="manager" className="bg-slate-800 text-white">Manager</option>
                  <option value="admin" className="bg-slate-800 text-white">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex items-center space-x-4 pt-4">
              <button
                type="submit"
                onClick={handleSubmit}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 shadow-lg"
              >
                <Save className="w-4 h-4" />
                <span>{isEditing ? 'Update User' : 'Create User'}</span>
              </button>

              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex items-center space-x-2 bg-gray-500/20 text-gray-300 px-6 py-3 rounded-lg font-semibold hover:bg-gray-500/30 hover:text-white transition-all duration-200 border border-gray-500/30"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel Edit</span>
                </button>
              )}
            </div>
          </div>
        </div>
      
      {/* Table of Users */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-blue-100 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-blue-100 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-blue-100 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-blue-100 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-white/5 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{user.username}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-blue-200">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                        {getRoleIcon(user.role)}
                        <span className="capitalize">{user.role}</span>
                      </span>
                    </td>      
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="inline-flex items-center space-x-1 bg-blue-500/20 text-blue-300 hover:text-white hover:bg-blue-500/30 px-3 py-2 rounded-lg transition-all duration-200 border border-blue-500/30"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(user._id)}
                        disabled={loggedInUser._id === user._id}
                        className={`inline-flex items-center space-x-1 px-3 py-2 rounded-lg transition-all duration-200 border ${
                          loggedInUser._id === user._id
                            ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed border-gray-500/30'
                            : 'bg-red-500/20 text-red-300 hover:text-white hover:bg-red-500/30 border-red-500/30'
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-blue-400 mx-auto mb-4 opacity-50" />
              <p className="text-blue-200 text-lg">No users found</p>
              <p className="text-blue-300 text-sm">Create your first user to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
      
export default UserManagementPage;
