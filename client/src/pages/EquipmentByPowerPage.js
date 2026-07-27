// client/src/pages/EquipmentByPowerPage.js
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Loader, ImageIcon, ExternalLink, Zap } from 'lucide-react';
import api from '../services/api';
import AuthContext from '../context/AuthContext';
import { useDataContext } from '../context/DataContext';

const EquipmentByPowerPage = () => {
  const { user } = useContext(AuthContext);
  const { equipment: contextEquipment, motors: contextMotors, loading: dataLoading, refreshEquipment, refreshAll } = useDataContext();
  const [equipments, setEquipments] = useState([]);
  const [spareMotors, setSpareMotors] = useState([]);

  // Filters
  const [powerFilter, setPowerFilter] = useState('');
  const [speedFilter, setSpeedFilter] = useState('');
  
  // Serial - search on Spare Motors
  const [motorSearch, setMotorSearch] = useState('');

  // State for loading and error handling
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // State for the CRUD modal
  const [isCrudModalOpen, setIsCrudModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(null); // Will hold equipment ID when editing
  const [formData, setFormData] = useState({ tonNumber: '', designation: '', plant: '', supplySource: '', mccType: '' });

  // State for the 'Assign Motor' modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [selectedMotorId, setSelectedMotorId] = useState('');

  // Sync from context into local state
  useEffect(() => {
    if (contextEquipment) {
      setEquipments(contextEquipment);
    }
    if (contextMotors) {
      setSpareMotors(contextMotors.filter(m => m.status === 'spare'));
    }
    if (!dataLoading && contextEquipment && contextMotors) {
      setIsLoading(false);
    }
  }, [contextEquipment, contextMotors, dataLoading]);

  const handleOpenImage = async (tonNumber) => {
    const ton = tonNumber.replace(/\./g, '');
    const newWindow = window.open('', '_blank');
    try {
      const response = await api.get(`/equipment/drive/${ton}`);
      if (response.data.success && response.data.url) {
        if (newWindow) {
          newWindow.location.href = response.data.url;
        }
      }
    } catch (error) {
      console.error("Failed to get image link", error);
      if (newWindow) {
        newWindow.document.body.innerHTML = '';
        if (error.response && error.response.status === 404) {
          newWindow.document.write('<h3 style="color:red; font-family:sans-serif; text-align:center; margin-top:50px;">Image Not Found</h3>');
        } else {
          newWindow.close();
          alert("Could not open image. Please try again.");
        }
      }
    }
  };

  const openCrudModal = (equipment = null) => {
    setError('');
    if (equipment) {
      setIsEditing(equipment._id);
      setFormData({ 
        tonNumber: equipment.tonNumber, 
        designation: equipment.designation, 
        plant: equipment.plant,
        supplySource: equipment.supplySource || '',
        mccType: equipment.mccType || ''
      });
    } else {
      setIsEditing(null);
      setFormData({ tonNumber: '', designation: '', plant: '', supplySource: '', mccType: '' });
    }
    setIsCrudModalOpen(true);
  };

  const closeCrudModal = () => {
    setIsCrudModalOpen(false);
    setIsEditing(null);
    setFormData({ tonNumber: '', designation: '', plant: '', supplySource: '', mccType: '' });
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
      refreshEquipment();
      closeCrudModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save equipment.');
    }
  };

  const handleDeleteEquipment = async (equipmentId) => {
    if (window.confirm('Are you sure you want to delete this equipment? This cannot be undone.')) {
      try {
        await api.delete(`/equipment/${equipmentId}`);
        refreshEquipment();
      } catch (err) {
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
      refreshAll();
      closeAssignModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign motor.');
    }
  };

  const handleGrease = async (motorId) => {
    if (window.confirm('Mark this motor as greased today?')) {
      try {
        await api.post(`/motors/${motorId}/grease`);
        refreshEquipment();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to update greasing date.');
      }
    }
  };

  const handleUnassignMotor = async (equipment) => {
    if (window.confirm(`Are you sure you want to remove the motor from ${equipment.designation}? The motor will be set to 'Out of Service'.`)) {
      try {
        await api.put(`/equipment/${equipment._id}/unassign`);
        refreshAll();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to unassign motor.');
      }
    }
  };

  // Filter equipment based on power and speed search filter
  const getFilteredEquipments = () => {
    let filtered = equipments;

    if (powerFilter) {
      filtered = filtered.filter(eq => {
        const power = eq.currentMotor?.power;
        if (power === undefined || power === null) return false;
        return String(power).toLowerCase().includes(powerFilter.toLowerCase());
      });
    }

    if (speedFilter) {
      filtered = filtered.filter(eq => {
        const speed = eq.currentMotor?.speed;
        if (speed === undefined || speed === null) return false;
        return String(speed).toLowerCase().includes(speedFilter.toLowerCase());
      });
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

  const filteredEquipments = getFilteredEquipments();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-6">
      {/* Header Section */}
      <div className="glass rounded-xl p-6 mb-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-4">
            <Link
              to="/dashboard"
              className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-lg transition-all duration-300 
                         transform hover:scale-105 shadow-md hover:shadow-lg border border-white/20"
              title="Back to Dashboard"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <span>Equipment by Power</span>
              </h2>
              <p className="text-gray-300 mt-1">
                {filteredEquipments.length} equipment(s) found
              </p>
            </div>
          </div>

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

      {/* Search Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Zap className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Filter by Motor Power (kW)..."
            value={powerFilter}
            onChange={(e) => setPowerFilter(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg pl-12 pr-4 py-3 text-white 
                      placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 
                      focus:ring-blue-400/50 transition-all duration-300 backdrop-blur-sm
                      hover:border-white/30 hover:bg-white/15"
          />
          {powerFilter && (
            <button
              onClick={() => setPowerFilter('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors duration-200"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Filter by Motor Speed (RPM)..."
            value={speedFilter}
            onChange={(e) => setSpeedFilter(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg pl-12 pr-4 py-3 text-white 
                      placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 
                      focus:ring-blue-400/50 transition-all duration-300 backdrop-blur-sm
                      hover:border-white/30 hover:bg-white/15"
          />
          {speedFilter && (
            <button
              onClick={() => setSpeedFilter('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors duration-200"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

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
                <h3 className="text-xl font-bold text-white mb-3 pr-20 break-words">{eq.designation}</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center space-x-2 bg-blue-500/10 rounded-full px-2 py-1 border border-blue-500/20">
                    <span className="text-blue-300 font-semibold text-sm">TON:</span>
                    <span className="text-blue-200 text-sm font-mono">
                      {eq.tonNumber}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 bg-green-500/10 rounded-full px-2 py-1 border border-green-500/20">
                    <span className="text-green-300 font-semibold text-sm">Source:</span>
                    <span className="text-green-200 text-sm font-mono">
                      {eq.supplySource || 'N/A'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 bg-purple-500/10 rounded-full px-2 py-1 border border-purple-500/20">
                    <span className="text-purple-300 font-semibold text-sm">MCC Type:</span>
                    <span className="text-purple-200 text-sm font-mono">
                      {eq.mccType || 'N/A'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenImage(eq.tonNumber)}
                    className="group flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200
                              bg-indigo-500/20 text-indigo-200 border-indigo-500/30 
                              hover:bg-indigo-500/40 hover:text-white hover:border-indigo-400/60
                              whitespace-nowrap"
                  >
                    <ImageIcon size={12} className="group-hover:scale-110 transition-transform" />
                    <span>Datasheet</span>
                    <ExternalLink size={10} className="opacity-60 ml-0.5" />
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6"></div>

              {/* Current Motor Section */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-blue-300 mb-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Current Motor</span>
                  </div>
                  {user.role === 'admin' && eq.currentMotor && (
                    <button
                      onClick={() => handleUnassignMotor(eq)}
                      className="text-red-400 hover:text-red-300 text-xs border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded transition-colors"
                      title="Unassign Motor (Set to Out of Service)"
                    >
                      Remove Motor
                    </button>
                  )}
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
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mt-2 border-t border-white/10 pt-2">
                        <p>Power: <span className="text-white">{eq.currentMotor.power} kW</span></p>
                        <p>Current: <span className="text-white">{eq.currentMotor.current} A</span></p>
                        <p>Speed: <span className="text-white">{eq.currentMotor.speed} RPM</span></p>
                        <p>Maintained: <span className={`text-white ${!eq.currentMotor.lastMaintenanceDate ? 'text-red-300' : 'text-green-300'}`}>
                          {eq.currentMotor.lastMaintenanceDate
                            ? new Date(eq.currentMotor.lastMaintenanceDate).toLocaleDateString('en-GB')
                            : 'N/A'}
                        </span></p>
                        <div className="col-span-2 flex justify-between items-center border-t border-white/10 pt-2 mt-1">
                          <p>Greased: <span className={`text-white ${!eq.currentMotor.lastGreasingDate ? 'text-red-300' : 'text-green-300'}`}>
                            {eq.currentMotor.lastGreasingDate
                              ? new Date(eq.currentMotor.lastGreasingDate).toLocaleDateString('en-GB')
                              : 'N/A'}
                          </span></p>

                          {(user.role === 'admin' || user.role === 'manager') && (
                            <button
                              onClick={() => handleGrease(eq.currentMotor._id)}
                              className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30
                                         px-2 py-1 rounded text-xs transition-colors"
                              title="Update Last Greasing Date to Today"
                            >
                              Grease Now
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-red-300 font-medium">No motor installed</p>
                )}

                {/* Unassign Motor Button (Small X) */}
                {user.role === 'admin' && eq.currentMotor && (
                  <button
                    onClick={() => handleUnassignMotor(eq)}
                    className="absolute top-4 right-4 bg-red-500/20 hover:bg-red-500/30 text-red-300 p-1.5 rounded-full 
                              transition-all duration-300 opacity-0 group-hover:opacity-100"
                    title="Unassign Motor (Set to Out of Service)"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
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
              <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6" ></div>

              {/* Motor History Section */}
              <div className="mt-auto">
                {(() => {
                  const uniqueHistory = eq.motorHistory?.reduce((acc, current) => {
                    if (current.motor && !acc.some(x => x.motor?.serialNumber === current.motor?.serialNumber)) {
                      acc.push(current);
                    }
                    return acc;
                  }, []) || [];

                  return (
                    <>
                      <h4 className="text-lg font-semibold text-blue-300 mb-4 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Motor History</span>
                        </div>
                        <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full text-xs font-semibold border border-purple-500/30">
                          {uniqueHistory.length} total
                        </span>
                      </h4>

                      {uniqueHistory.length > 0 ? (
                        <div className="space-y-2">
                          {uniqueHistory.map((h, index) => (
                            <div key={h._id || index} className="bg-white/5 rounded-lg p-3 border border-white/10 hover:border-white/20 transition-all duration-300">
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
                    </>
                  );
                })()}
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
                  onChange={(e) => setFormData({ ...formData, tonNumber: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, plant: e.target.value })}
                  placeholder="AFC 3"
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white 
                           placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 
                           focus:ring-blue-400/50 transition-all duration-300"
                />
              </div>

              <div className="space-y-2">
                <label className="text-blue-300 text-sm font-semibold">Supply Source (Optional)</label>
                <input
                  name="supplySource"
                  value={formData.supplySource}
                  onChange={(e) => setFormData({ ...formData, supplySource: e.target.value })}
                  placeholder="e.g., MCC-1A"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white 
                           placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 
                           focus:ring-blue-400/50 transition-all duration-300"
                />
              </div>

              <div className="space-y-2">
                <label className="text-blue-300 text-sm font-semibold">MCC Type (Optional)</label>
                <input
                  name="mccType"
                  value={formData.mccType}
                  onChange={(e) => setFormData({ ...formData, mccType: e.target.value })}
                  placeholder="e.g., Drawout"
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

export default EquipmentByPowerPage;
