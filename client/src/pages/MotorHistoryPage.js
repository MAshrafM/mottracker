// client/src/pages/MotorHistoryPage.js
import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { Loader } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import { useParams } from 'react-router-dom';

const MaintenanceHistory = () => {
  const { motorId } = useParams();
  const { user } = useContext(AuthContext);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [history, setHistory] = useState([]);
  const [motor, setMotor] = useState(null);
  const [eq, setEq] = useState(null);
  const [isActive, setIsActive] = useState(false);

  // State for edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMotorHistory();
    fetchMotorDetails();
    if(isActive){
      fetchEq();
    }
  }, [motorId, isActive]);

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
        setMotor(response.data.data);
        if(response.data.data.status === 'active'){
          setIsActive(true);
        }
    } catch (err) {
        console.error('Error fetching motor details:', err);
      setError('Failed to fetch motor details.');
    }
};

const fetchEq = async () => { 
  try{ 
    setError(''); 
    const res = await api.get(`/equipment/${motorId}`); 
     setEq(res.data.data); 
  } catch(err){ 
    console.error('Failed to fetch Equipment.'); 
  } finally { 
    setIsLoading(false); 
  } 
}

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

  const openEditModal = (event) => {
    // The date from MongoDB is a full ISO string, we need to format it to YYYY-MM-DD for the input field
    const formattedDate = new Date(event.date).toISOString().split('T')[0];
    setEditingEvent({ ...event, date: formattedDate });
    setIsEditModalOpen(true);
    setError('');
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingEvent(null);
  };

  const handleEditInputChange = (e) => {
    setEditingEvent({
      ...editingEvent,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    if (!editingEvent.date || !editingEvent.description) {
      setError('Date and description cannot be empty.');
      return;
    }
    try {
      await api.put(`/motors/${motorId}/maintenance/${editingEvent._id}`, {
        date: editingEvent.date,
        description: editingEvent.description,
      });
      closeEditModal();
      fetchMotorDetails(); // Refresh the list to show the updated event
    } catch (err) {
      setError('Failed to update maintenance event.');
      console.error(err);
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
      <h4 className="text-2xl font-bold text-white flex justify-center items-center space-x-3 mb-4">
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <span>Maintenance History</span>
      </h4>
      {/* Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent mb-8"></div>
       
      {/* Header Section */}
      <div className="glass rounded-xl p-4 md:p-6 mb-6 md:mb-8 shadow-2xl">
        {/* Header with Status and Title */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          {/* Status Badge - Centered on mobile, left on desktop */}
          <div className="flex justify-center md:justify-start">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              motor.status === 'active' 
                ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
            }`}>
              {motor.status}
            </span>
          </div>

          {/* Motor Title - Centered on both screens */}
          <div className="text-center md:text-left md:flex-1 md:px-4">
            <h3 className="text-xl font-bold text-white">
              {motor.manufacturer} - {motor.type}
            </h3>
          </div>

          {/* Empty div to balance flex layout on desktop */}
          <div className="hidden md:block w-20"></div>
        </div>

        {/* Equipment info if active */}
        {eq && motor.status === 'active' && (
          <h4 className="text-lg text-white mb-4 border-b border-white/20 pb-2 text-center md:text-left">
            {eq.tonNumber} - {eq.designation}
          </h4>
        )}

        {/* Motor Details */}
        <div className="space-y-3 text-gray-300">
          {/* Serial Number */}
          <div className="bg-white/5 rounded-lg p-3">
            <p className="flex justify-between items-center">
              <strong className="text-blue-300 text-base">S/N:</strong> 
              <span className="font-bold text-base">{motor.serialNumber}</span>
            </p>
          </div>
          
          {/* Technical Specs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white/5 rounded-lg p-3">
              <p className="flex justify-between items-center">
                <strong className="text-blue-300 text-base">Power:</strong> 
                <span className="text-base">{motor.power} KW</span>
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="flex justify-between items-center">
                <strong className="text-blue-300 text-base">Current:</strong> 
                <span className="text-base">{motor.current} A</span>
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="flex justify-between items-center">
                <strong className="text-blue-300 text-base">Speed:</strong> 
                <span className="text-base">{motor.speed} rpm</span>
              </p>
            </div>
          </div>
            
          {/* Mounting and Frame Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-lg p-3">
              <p className="flex justify-between items-center">
                <strong className="text-blue-300 text-base">Mounting:</strong> 
                <span className="text-base">{motor.IM}</span>
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="flex justify-between items-center">
                <strong className="text-blue-300 text-base">Frame Size:</strong> 
                <span className="text-base">{motor.frameSize}</span>
              </p>
            </div>
          </div>
          
          {/* Bearings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-lg p-3">
              <p className="flex justify-between items-center">
                <strong className="text-blue-300 text-base">Bearing NDE:</strong> 
                <span className="text-base">{motor.bearingNDE}</span>
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="flex justify-between items-center">
                <strong className="text-blue-300 text-base">Bearing DE:</strong> 
                <span className="text-base">{motor.bearingDE}</span>
              </p>
            </div>
          </div>
          
          {/* Warehouse and SAP Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-lg p-3">
              <p className="flex justify-between items-center">
                <strong className="text-blue-300 text-base">Warehouse:</strong> 
                <span className="text-base">{motor.Warehouse}</span>
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="flex justify-between items-center">
                <strong className="text-blue-300 text-base">SAP ID:</strong> 
                <span className="text-base">{motor.SAP}</span>
              </p>
            </div>
          </div>
            
          {/* Last Maintenance */}
          <div className="bg-white/5 rounded-lg p-3">
            <p className="flex justify-between items-center">
              <strong className="text-blue-300 text-base">Last Maintenance:</strong> 
              <span className={`text-base ${!motor.lastMaintenanceDate ? 'text-red-300' : 'text-green-300'}`}>
                {motor.lastMaintenanceDate ? new Date(motor.lastMaintenanceDate).toLocaleDateString() : 'N/A'}
              </span>
            </p>
          </div>
            
          {/* Notes */}
          {motor.Note && (
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <strong className="text-blue-300 text-base">Notes:</strong>
              <p className="text-base mt-2 text-gray-300">{motor.Note}</p>
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
<div className="glass rounded-xl p-4 md:p-6 shadow-xl">
  <h5 className="text-lg font-semibold text-blue-300 mb-4 md:mb-6 flex items-center space-x-2">
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
          {/* Main Content */}
          <div className="flex flex-col">
            {/* Date and Event Info Row */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full flex-shrink-0"></div>
                <div className="min-w-0 flex-1">
                  <strong className="text-blue-300 font-semibold text-sm md:text-base block truncate">
                    {new Date(event.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </strong>
                </div>
              </div>
              
              {/* Event Badge */}
              <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0 ml-2">
                {index === 0 ? 'Latest' : `${index + 1} event${index > 0 ? 's' : ''} ago`}
              </span>
            </div>

            {/* Description */}
            <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-3 ml-6">
              {event.description}
            </p>

            {/* Action Buttons - Always visible on mobile, hover on desktop */}
            <div className="flex justify-end space-x-2 ml-6 mt-2">
              {/* Edit button for admin/manager */}
              {(user.role === 'admin' || user.role === 'manager') && (
                <button 
                  onClick={() => openEditModal(event)}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 
                             text-white p-2 rounded-lg transition-all duration-300 transform hover:scale-105 
                             shadow-md hover:shadow-lg opacity-0 group-hover:opacity-100 flex items-center justify-center"
                  title="Edit this event"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 7H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4m-6-6l3.586-3.586a2 2 0 012.828 0l1.586 1.586a2 2 0 010 2.828L16.414 9M11 7l3.586-3.586a2 2 0 012.828 0l1.586 1.586a2 2 0 010 2.828L16.414 9M11 7l-3.586 3.586a2 2 0 00-2.828 0L3 12.414a2 2 0 000 2.828L6.414 18" />
                  </svg>
                </button>
              )}
              
              {/* Delete button for admin */}
              {user.role === 'admin' && (
                <button 
                  onClick={() => handleDeleteEvent(event._id)}
                  className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 
                             text-white p-2 rounded-lg transition-all duration-300 transform hover:scale-105 
                             shadow-md hover:shadow-lg opacity-0 group-hover:opacity-100 flex items-center justify-center"
                  title="Delete this event"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          {/* Chevron Timeline connector */}
          {index < history.length - 1 && (
            <div className="flex justify-center mt-4 -mb-2 text-blue-400/60">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  ) : (
    <div className="text-center py-8 text-gray-400">
      <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <p>No maintenance events recorded yet.</p>
      <p className="text-gray-500 text-sm mt-2">
              {(user.role === 'admin' || user.role === 'manager') 
                ? "Use the form above to add the first maintenance event." 
                : "Contact an administrator to add maintenance records."
              }
            </p>
    </div>
  )}
</div>
      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-dark rounded-2xl p-8 max-w-lg w-full shadow-2xl">
            <h3 className="text-lg font-semibold text-blue-500 mb-4">Edit Maintenance Event</h3>
            <form onSubmit={handleUpdateEvent} className="space-y-4">
              <div className="space-y-2">
                <label className="text-blue-500 text-sm font-semibold">Date</label>
                <input 
                  type="date"
                  name="date"
                  value={editingEvent.date}
                  onChange={handleEditInputChange}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white 
                             focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 
                             transition-all duration-300"
                />
              </div>
              <div className="space-y-2">
                <label className="text-blue-500 text-sm font-semibold">Description</label>
                <input 
                  type="text"
                  name="description"
                  value={editingEvent.description}
                  onChange={handleEditInputChange}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white 
                             placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 
                             focus:ring-blue-400/50 transition-all duration-300"
                />
              </div>
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 
                             text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300
                              transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Update Event</span>
                </button>
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="ml-4 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Cancel  
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceHistory;