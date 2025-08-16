// client/src/pages/MotorHistoryPage.js
import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { Loader } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import { useParams, Link } from 'react-router-dom';

const MaintenanceHistory = () => {
  const { motorId } = useParams();
  const { user } = useContext(AuthContext);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [history, setHistory] = useState([]);
  const [motor, setMotor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMotorHistory();
    fetchMotorDetails();
  }, [motorId]);

  const fetchMotorHistory = async () => {
    try {
      setError('');
      const response = await api.get(`/motors/${motorId}/maintenance`);
      setHistory(response.data.data);
    } catch (err) {
      setError('Failed to fetch motors.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMotorDetails = async () => {
    try {
      const response = await api.get(`/motors/${motorId}`);
      console.error('Motor details fetched:', response.data.data);
        setMotor(response.data.data);
    } catch (err) {
        console.error('Error fetching motor details:', err);
      setError('Failed to fetch motor details.');
    }
};

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!description || !date) {
      setError('Date and description are required for maintenance events.');
      return;
    }
    try {
      await api.post(`/motors/${motorId}/maintenance`, { date, description });
      fetchMotorHistory(); // Refresh motor history
      setDescription(''); // Reset form
      setDate(new Date().toISOString().split('T')[0]); // Reset date
    } catch (err) {
        console.error('Error adding maintenance event:', err);
      setError('Failed to add maintenance event.');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this maintenance record?')) {
      try {
        await api.delete(`/motors/${motorId}/maintenance/${eventId}`);
        fetchMotorHistory(); // Refresh the motor details
      } catch (err) {
        setError('Failed to delete maintenance event.');
      }
    }
  };

  if (isLoading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-8 shadow-xl flex items-center space-x-3">
            <Loader className="w-6 h-6 text-blue-400 animate-spin" />
            <p className="text-white text-lg">Loading Motors...</p>
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
    <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 min-h-screen p-6">
      {/* Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent mb-8"></div>
      
      {/* Header Section */}
      <div className="glass rounded-xl p-6 mb-8 shadow-2xl">
        <h4 className="text-2xl font-bold text-white flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span>Maintenance History</span>
        </h4>

        {/* Status Badge */}
        <div className="flex justify-between items-start mb-4 mt-4">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            motor.status === 'active' 
                ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
            }`}>
                {motor.status}
            </span>
        </div>

        {/* Motor Title */}
        <h3 className="text-xl font-bold text-white mb-4 border-b border-white/20 pb-2">
            {motor.manufacturer} - {motor.type}
        </h3>

        {/* Motor Details */}
        <div className="space-y-3 text-gray-300">
            <p className="flex justify-around">
            <strong className="text-blue-300">S/N:</strong> 
            <span className="font-bold text-sm">{motor.serialNumber}</span>
            </p>
            
            <div className="grid grid-cols-3 gap-2 text-sm">
            <p><strong className="text-blue-300">Power:</strong> {motor.power}</p>
            <p><strong className="text-blue-300">Current:</strong> {motor.current} A</p>
            <p><strong className="text-blue-300">Speed:</strong> {motor.speed} RPM</p>
            </div>
              
            <div className="grid grid-cols-3 gap-2 text-sm">
            <p><strong className="text-blue-300">Mounting:</strong> {motor.IM}</p>
            <p className="text-sm">
                <strong className="text-blue-300">Frame Size:</strong> {motor.frameSize}
            </p>
            
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
            <p><strong className="text-blue-300">Warehouse:</strong> {motor.Warehouse}</p>
            <p><strong className="text-blue-300">SAP ID:</strong> {motor.SAP}</p>
            </div>
              
            <p className="text-sm">
            <strong className="text-blue-300">Last Maintenance:</strong> 
            <span className={`ml-2 ${!motor.lastMaintenanceDate ? 'text-red-300' : 'text-green-300'}`}>
                {motor.lastMaintenanceDate ? new Date(motor.lastMaintenanceDate).toLocaleDateString() : 'N/A'}
            </span>
            </p>
              
              
              
            {motor.Note && (
            <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/10">
                <strong className="text-blue-300 text-sm">Notes:</strong>
                <p className="text-sm mt-1 text-gray-300">{motor.Note}</p>
            </div>
            )}
        </div>
      </div>
      
      {/* Form Section for admin/manager */}
      {(user.role === 'admin' || user.role === 'manager') && (
        <div className="glass rounded-xl p-6 mb-8 shadow-xl">
          <h5 className="text-lg font-semibold text-blue-300 mb-4 flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add New Maintenance Event</span>
          </h5>
          
          <form onSubmit={handleAddEvent} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-blue-300 text-sm font-semibold">Maintenance Date</label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                  required 
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white 
                             focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 
                             transition-all duration-300"
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <label className="text-blue-300 text-sm font-semibold">Description</label>
                <input 
                  type="text" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Enter maintenance description..." 
                  required 
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white 
                             placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 
                             focus:ring-blue-400/50 transition-all duration-300"
                />
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <button 
                type="submit"
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 
                           text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 
                           transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add Event</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Maintenance History List */}
      <div className="glass rounded-xl p-6 shadow-xl">
        <h5 className="text-lg font-semibold text-blue-300 mb-6 flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span>Event History</span>
        </h5>

        {history && history.length > 0 ? (
          <div className="space-y-4">
            {history
              .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date, newest first
              .map((event, index) => (
              <div 
                key={event._id}
                className="glass-dark rounded-lg p-4 border border-white/10 hover:border-white/20 
                           transition-all duration-300 hover:shadow-lg group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"></div>
                      <strong className="text-blue-300 font-semibold">
                        {new Date(event.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </strong>
                      <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded-full">
                        {index === 0 ? 'Latest' : `${index + 1} event${index > 0 ? 's' : ''} ago`}
                      </span>
                    </div>
                    <p className="text-gray-300 ml-6 leading-relaxed">{event.description}</p>
                  </div>
                  
                  {/* Delete button for admin */}
                  {user.role === 'admin' && (
                    <button 
                      onClick={() => handleDeleteEvent(event._id)}
                      className="ml-4 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 
                                 text-white p-2 rounded-lg transition-all duration-300 transform hover:scale-110 
                                 shadow-md hover:shadow-lg opacity-0 group-hover:opacity-100"
                      title="Delete this event"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
                
                {/* Timeline connector (except for last item) */}
                {index < history.length - 1 && (
                  <div className="ml-1.5 mt-4 w-0.5 h-4 bg-gradient-to-b from-blue-400 to-transparent"></div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-r from-gray-600 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-400 text-lg font-medium">No maintenance history recorded</p>
            <p className="text-gray-500 text-sm mt-2">
              {(user.role === 'admin' || user.role === 'manager') 
                ? "Use the form above to add the first maintenance event." 
                : "Contact an administrator to add maintenance records."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaintenanceHistory;