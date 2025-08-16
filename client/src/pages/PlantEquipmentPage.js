// client/src/pages/PlantEquipmentPage.js
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Loader } from 'lucide-react';
import api from '../services/api';
import AuthContext from '../context/AuthContext';


const PlantEquipmentPage = () => {
  const { user } = useContext(AuthContext);
  const [equipments, setEquipments] = useState([]);
  const [spareMotors, setSpareMotors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [isCrudModalOpen, setIsCrudModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(null); // Will hold equipment ID when editing
  const [formData, setFormData] = useState({ tonNumber: '', designation: '' });

  // State for the 'Assign Motor' modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [selectedMotorId, setSelectedMotorId] = useState('');

  useEffect(() => {
    fetchEquipments();
    fetchSpareMotors();
  }, []);

  const fetchEquipments = async () => {
    try {
      const response = await api.get('/equipment');
      setEquipments(response.data.data);
    } catch (err) {
      setError('Failed to fetch equipment.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSpareMotors = async () => {
    try {
      const response = await api.get('/motors');
      // Filter for motors with status 'spare'
      setSpareMotors(response.data.data.filter(m => m.status === 'spare'));
    } catch (err) {
      console.error("Failed to fetch spare motors.");
    }
  };

  const openCrudModal = (equipment = null) => {
    setError('');
    if (equipment) {
      setIsEditing(equipment._id);
      setFormData({ tonNumber: equipment.tonNumber, designation: equipment.designation, plant: equipment.plant });
    } else {
      setIsEditing(null);
      setFormData({ tonNumber: '', designation: '', plant: '' });
    }
    setIsCrudModalOpen(true);
  };

  const closeCrudModal = () => {
    setIsCrudModalOpen(false);
    setIsEditing(null);
    setFormData({ tonNumber: '', designation: '', plant: '' });
    setError('');
  };

  const handleCrudSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.put(`/equipment/${isEditing}`, formData);
      } else {
        await api.post('/equipment', formData);
      }
      fetchEquipments();
      closeCrudModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save equipment.');
    }
  };

  const handleDeleteEquipment = async (equipmentId) => {
    if (window.confirm('Are you sure you want to delete this equipment? This cannot be undone.')) {
      try {
        await api.delete(`/equipment/${equipmentId}`);
        fetchEquipments();
      } catch (err) {
        // Display the error in the main view since the modal will be closed
        setError(err.response?.data?.message || 'Failed to delete equipment.');
      }
    }
  };

  const openAssignModal = (equipment) => {
    setSelectedEquipment(equipment);
    setIsAssignModalOpen(true);
  };

  const closeAssignModal = () => {
    setIsAssignModalOpen(false);
    setSelectedEquipment(null);
    setSelectedMotorId('');
    setError('');
  };

  const handleAssignMotor = async (e) => {
    e.preventDefault();
    if (!selectedMotorId) {
      setError('Please select a motor to assign.');
      return;
    }
    try {
      await api.post(`/equipment/${selectedEquipment._id}/assign-motor`, { motorId: selectedMotorId });
      // Refresh both lists after assignment
      fetchEquipments();
      fetchSpareMotors();
      closeAssignModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign motor.');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-6">
      {/* Header Section */}
      <div className="glass rounded-xl p-6 mb-8 shadow-2xl">
        <div className="flex sm:flex-row justify-between items-center gap-4">
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 8.172V5L8 4z" />
              </svg>
            </div>
            <span>Plant Equipment</span>
          </h2>
          {user.role === 'admin' && (
            <button 
              onClick={() => openCrudModal()}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 
                         text-white px-6 py-3 sm:px-6 sm:py-3 rounded-lg font-semibold shadow-lg transition-all duration-300 
                         transform hover:scale-105 hover:shadow-xl flex items-center space-x-2 sm:space-x-2 w-fit"
            >
              <span className="text-xl">+</span>
              <span className="hidden sm:inline">Add New Equipment</span>
            </button>
          )}
        </div>
      </div>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {equipments.map((eq) => (
          <div key={eq._id} className="glass rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 relative group">
            {/* Admin Actions */}
            {user.role === 'admin' && (
              <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button 
                  onClick={() => openCrudModal(eq)}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 
                             text-white p-2 rounded-lg transition-all duration-300 transform hover:scale-110 shadow-md"
                  title="Edit Equipment"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button 
                  onClick={() => handleDeleteEquipment(eq._id)}
                  className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 
                             text-white p-2 rounded-lg transition-all duration-300 transform hover:scale-110 shadow-md"
                  title="Delete Equipment"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}

            {/* Equipment Header */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-3 pr-20">{eq.designation}</h3>
              <div className="flex items-center space-x-2">
                <span className="text-blue-300 font-semibold">TON:</span>
                <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm font-mono border border-blue-500/30">
                  {eq.tonNumber}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6"></div>

            {/* Current Motor Section */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-blue-300 mb-4 flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Current Motor</span>
              </h4>
              
              {eq.currentMotor ? (
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="space-y-2">
                    <p className="flex justify-between items-center">
                      <strong className="text-blue-300">S/N:</strong>
                      <span className="font-mono text-sm text-white bg-white/10 px-2 py-1 rounded">
                        {eq.currentMotor.serialNumber}
                      </span>
                    </p>
                    <p className="text-gray-300">
                      <span className="font-semibold">{eq.currentMotor.manufacturer}</span> - {eq.currentMotor.type}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/30 text-center">
                  <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <p className="text-red-300 font-medium">No motor installed</p>
                </div>
              )}

              {/* Assign/Replace Motor Button */}
              {(user.role === 'admin' || user.role === 'manager') && (
                <button  
                  onClick={() => openAssignModal(eq)}
                  className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 
                             text-white py-3 px-4 rounded-lg font-semibold transition-all duration-300 
                             transform hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span>Assign / Replace Motor</span>
                </button>
              )}
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6"></div>

            {/* Motor History Section */}
            <div>
              <h4 className="text-lg font-semibold text-blue-300 mb-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Motor History</span>
                </div>
                <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full text-xs font-semibold border border-purple-500/30">
                  {eq.motorHistory.length} total
                </span>
              </h4>

              {eq.motorHistory.length > 0 ? (
                <div className="space-y-2">
                  {eq.motorHistory.slice(0, 3).map((h, index) => (
                    <div key={h._id} className="bg-white/5 rounded-lg p-3 border border-white/10 hover:border-white/20 transition-all duration-300">
                      <Link 
                        to={`/motors/${h.motor._id}/history`}
                        className="flex items-center justify-between text-sm hover:text-blue-300 transition-colors duration-300 group"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"></div>
                          <span className="font-mono">S/N: {h.motor.serialNumber}</span>
                        </div>
                        <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  ))}
                  
                  {eq.motorHistory.length > 3 && (
                    <div className="text-center py-2">
                      <span className="text-gray-400 text-sm bg-white/5 px-3 py-1 rounded-full border border-white/10">
                        ...and {eq.motorHistory.length - 3} more
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-gray-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-sm">No motor history available</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* CRUD Modal (Add/Edit Equipment) */}
      {isCrudModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-dark rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <form onSubmit={handleCrudSubmit} className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6 border-b border-white/20 pb-4">
                {isEditing ? 'Edit Equipment' : 'Add New Equipment'}
              </h2>
              
              <div className="space-y-2">
                <label className="text-blue-300 text-sm font-semibold">TON Number</label>
                <input
                  name="tonNumber"
                  value={formData.tonNumber}
                  onChange={(e) => setFormData({...formData, tonNumber: e.target.value})}
                  placeholder="e.g., E-12345"
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white 
                             placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 
                             focus:ring-blue-400/50 transition-all duration-300"
                />
              </div>

              <div className="space-y-2">
                <label className="text-blue-300 text-sm font-semibold">Designation</label>
                <input
                  name="designation"
                  value={formData.designation}
                  onChange={(e) => setFormData({...formData, designation: e.target.value})}
                  placeholder="e.g., Main Conveyor Belt"
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white 
                             placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 
                             focus:ring-blue-400/50 transition-all duration-300"
                />
              </div>

              <div className="space-y-2">
                <label className="text-blue-300 text-sm font-semibold">Plant</label>
                <input
                  name="plant"
                  value={formData.plant}
                  onChange={(e) => setFormData({...formData, plant: e.target.value})}
                  placeholder="AFC 3"
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white 
                             placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 
                             focus:ring-blue-400/50 transition-all duration-300"
                />
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-white/20">
                <button 
                  type="button" 
                  onClick={closeCrudModal}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold 
                             transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 
                             text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 
                             transform hover:scale-105 shadow-md hover:shadow-lg"
                >
                  Save Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Motor Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-dark rounded-2xl p-8 max-w-lg w-full shadow-2xl">
            <form onSubmit={handleAssignMotor} className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white">
                  Assign Motor to {selectedEquipment.designation}
                </h2>
                <p className="text-gray-300 mt-2">
                  Select a spare motor from the inventory to install on this equipment.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-blue-300 text-sm font-semibold">Available Spare Motors</label>
                <select
                  value={selectedMotorId}
                  onChange={(e) => setSelectedMotorId(e.target.value)}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white 
                             focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 
                             transition-all duration-300"
                >
                  <option value="" className="bg-gray-800">-- Select a Spare Motor --</option>
                  {spareMotors.map(motor => (
                    <option key={motor._id} value={motor._id} className="bg-gray-800">
                      {motor.serialNumber} ({motor.manufacturer} - {motor.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-white/20">
                <button 
                  type="button" 
                  onClick={closeAssignModal}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold 
                             transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 
                             text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 
                             transform hover:scale-105 shadow-md hover:shadow-lg"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlantEquipmentPage;
