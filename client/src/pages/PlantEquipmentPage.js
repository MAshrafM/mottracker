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

  // Plant selection state
  const [selectedPlant, setSelectedPlant] = useState(null);

  // Filter - Search on ton number
  const [tonFilter, setTonFilter] = useState('');
  // Serial - search on Spare Motors
  const [motorSearch, setMotorSearch] = useState('');

  // State for loading and error handling
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // State for the CRUD modal
  const [isCrudModalOpen, setIsCrudModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(null); // Will hold equipment ID when editing
  const [formData, setFormData] = useState({ tonNumber: '', designation: '' });

  // State for the 'Assign Motor' modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [selectedMotorId, setSelectedMotorId] = useState('');

  // Plant configuration with TON number prefixes
  const plantConfigs = [
    {
      id: 'ammonia',
      name: 'Ammonia',
      prefixes: ['301', '303', '305', '310', '380', '381', '382', '383', '384', '386'],
      color: 'from-blue-500 to-cyan-500',
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    {
      id: 'compressor',
      name: 'Compressor',
      prefixes: ['302', '305', '307', '309', '320', '385'],
      color: 'from-purple-500 to-indigo-500',
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 8.172V5L8 4z" />
        </svg>
      )
    },
    {
      id: 'urea',
      name: 'Urea',
      prefixes: ['321', '322', '323', '328', '329'],
      color: 'from-green-500 to-emerald-500',
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    {
      id: 'granulation',
      name: 'Granulation',
      prefixes: ['335'],
      color: 'from-orange-500 to-red-500',
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
        </svg>
      )
    },
    {
      id: 'water',
      name: 'Water',
      prefixes: ['388', '389', '390', '392'],
      color: 'from-cyan-500 to-blue-500',
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
        </svg>
      )
    },
    {
      id: 'bl',
      name: 'BL',
      prefixes: ['37'],
      color: 'from-pink-500 to-rose-500',
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      )
    },
    {
      id: 'uan',
      name: 'UAN',
      prefixes: ['34'],
      color: 'from-teal-500 to-green-500',
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    {
      id: 'zld',
      name: 'ZLD',
      prefixes: ['Z'],
      color: 'from-amber-500 to-yellow-500',
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )
    }
  ];

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

  const handlePlantSelection = (plant) => {
    setSelectedPlant(plant);
    setTonFilter(''); // Reset search filter when changing plants
  };

  const handleBackToPlants = () => {
    setSelectedPlant(null);
    setTonFilter('');
  };

  // Filter equipment based on selected plant prefixes and search filter
  const getFilteredEquipments = () => {
    let filtered = equipments;

    // If a plant is selected, filter by TON number prefixes
    if (selectedPlant) {
      filtered = equipments.filter(eq => 
        selectedPlant.prefixes.some(prefix => 
          eq.tonNumber.toLowerCase().startsWith(prefix.toLowerCase())
        )
      );
    }

    // Apply search filter
    if (tonFilter) {
      filtered = filtered.filter(eq =>
        eq.tonNumber.toLowerCase().includes(tonFilter.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredSpareMotors = spareMotors.filter(motor =>
    motor.serialNumber.toLowerCase().includes(motorSearch.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-8 shadow-xl flex items-center space-x-3">
          <Loader className="w-6 h-6 text-blue-400 animate-spin" />
          <p className="text-white text-lg">Loading Equipment...</p>
        </div>
      </div>
    );
  }

  if (error && !selectedPlant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="bg-red-500/20 backdrop-blur-lg rounded-xl border border-red-500/30 p-8 shadow-xl">
          <p className="text-red-300 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  // Plant Selection View
  if (!selectedPlant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-6">
        {/* Header Section */}
        <div className="glass rounded-xl p-6 mb-8 shadow-2xl">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Plant Equipment Management</h1>
            <p className="text-gray-300 text-lg">Select a plant to view and manage its equipment</p>
          </div>
        </div>

        {/* Plant Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plantConfigs.map((plant) => (
            <div
              key={plant.id}
              onClick={() => handlePlantSelection(plant)}
              className="glass rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 
                         transform hover:scale-105 cursor-pointer group relative overflow-hidden"
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-r ${plant.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
              
              {/* Card Content */}
              <div className="relative z-10 text-center">
                <div className={`w-16 h-16 bg-gradient-to-r ${plant.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {plant.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors duration-300">
                  {plant.name}
                </h3>
                <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-4"></div>
                <p className="text-gray-300 text-sm">
                  {equipments.filter(eq => 
                    plant.prefixes.some(prefix => 
                      eq.tonNumber.toLowerCase().startsWith(prefix.toLowerCase())
                    )
                  ).length} Equipment(s)
                </p>
              </div>

              {/* Hover Arrow */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Equipment List View (when a plant is selected)
  const filteredEquipments = getFilteredEquipments();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-6">
      {/* Header Section */}
      <div className="glass rounded-xl p-6 mb-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* Back Button and Title */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToPlants}
              className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-lg transition-all duration-300 
                         transform hover:scale-105 shadow-md hover:shadow-lg border border-white/20"
              title="Back to Plants"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight flex items-center space-x-3">
                <div className={`w-10 h-10 bg-gradient-to-r ${selectedPlant.color} rounded-lg flex items-center justify-center`}>
                  {selectedPlant.icon}
                </div>
                <span>{selectedPlant.name} Equipment</span>
              </h2>
              <p className="text-gray-300 mt-1">
                {filteredEquipments.length} equipment(s) found
              </p>
            </div>
          </div>

          {/* Add Equipment Button */}
          {user.role === 'admin' && (
            <button 
              onClick={() => openCrudModal()}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 
                         text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-all duration-300 
                         transform hover:scale-105 hover:shadow-xl flex items-center space-x-2 w-fit"
            >
              <span className="text-xl">+</span>
              <span className="hidden sm:inline">Add New Equipment</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input 
          type="text" 
          placeholder="Filter by TON Number..." 
          value={tonFilter} 
          onChange={(e) => setTonFilter(e.target.value)}
          className="w-full bg-white/10 border border-white/20 rounded-lg pl-12 pr-4 py-3 text-white 
                    placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 
                    focus:ring-blue-400/50 transition-all duration-300 backdrop-blur-sm
                    hover:border-white/30 hover:bg-white/15"
        />
        {tonFilter && (
          <button
            onClick={() => setTonFilter('')}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors duration-200"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/20 backdrop-blur-lg rounded-xl border border-red-500/30 p-4 mb-6">
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {/* Equipment Grid */}
      {filteredEquipments.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center shadow-xl">
          <div className="w-16 h-16 bg-gray-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Equipment Found</h3>
          <p className="text-gray-400">No equipment matches your current search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredEquipments.map((eq) => (
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
                    {eq.motorHistory.map((h, index) => (
                      <div key={h._id} className="bg-white/5 rounded-lg p-3 border border-white/10 hover:border-white/20 transition-all duration-300">
                        <Link 
                          to={`/motors/${h.motor._id}/maintenance`}
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
      )}

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
                <label className="text-blue-300 text-sm font-semibold">Search Spare Motors</label>
                <input
                  type="text"
                  placeholder="Search by Serial Number..."
                  value={motorSearch}
                  onChange={(e) => setMotorSearch(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white 
                            placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 
                            focus:ring-blue-400/50 transition-all duration-300"
                />
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
                  {filteredSpareMotors.map(motor => (
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