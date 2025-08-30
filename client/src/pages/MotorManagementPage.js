// client/src/pages/MotorManagementPage.js
import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { Loader } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import { Link } from 'react-router-dom';

const MotorManagementPage = () => {
  const { user } = useContext(AuthContext);
  const [motors, setMotors] = useState([]);
  const [updatedMotors, setUpdatedMotors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(null);
  const [formData, setFormData] = useState({
    serialNumber: '', type: '', power: '', current: '', speed: '', IM: '', frameSize: '',
    manufacturer: '', bearingDE: '', bearingNDE: '', status: 'spare', lastMaintenanceDate: '', SAP: '', Note: '', Warehouse: ''
  });


useEffect(() => { 
  fetchMotors(); 
}, []); 
const fetchMotors = async () => { 
  try { setError(''); 
    const response = await api.get('/motors'); 
    setMotors(response.data.data); 
  } catch (err) { 
    setError('Failed to fetch motors.'); 
  } finally { setIsLoading(false); } 
};
  
useEffect(() => {
  const enrichMotors = async () => {
    const withEq = await Promise.all(
      motors.map(async motor => {
        if (motor.status === "active") {
          const motorEq = await fetchEq(motor._id);
          return { ...motor, motorEq };
        }
        return motor;
      })
    );
    setUpdatedMotors(withEq);
  };

  if (motors.length > 0) {
    enrichMotors();
  }
}, [motors]);

const fetchEq = async (motorId) => { 
  try{ 
    setError(''); 
    const res = await api.get(`/equipment/${motorId}`); 
    return res.data.data; 
  } catch(err){ 
    setError('Failed to fetch motors.'); 
  } finally { 
    setIsLoading(false); 
  } 
}


  
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.put(`/motors/${isEditing}`, formData);
      } else {
        await api.post('/motors', formData);
      }
      fetchMotors();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save motor.');
    }
  };

  const handleEdit = (motor) => {
    setIsEditing(motor._id);
    setFormData({ ...motor });
    setIsModalOpen(true);
  };

  const handleDelete = async (motorId) => {
    if (window.confirm('Are you sure you want to delete this motor?')) {
      try {
        await api.delete(`/motors/${motorId}`);
        fetchMotors();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete motor.');
      }
    }
  };

  const openCreateModal = () => {
    setIsEditing(null);
    setFormData({
      serialNumber: '', type: '', power: '', current: '', speed: '', IM: '', frameSize: '',
      manufacturer: '', bearingDE: '', bearingNDE: '', status: 'spare', lastMaintenanceDate: '', SAP: '', Note: '', Warehouse: ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError('');
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
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-white tracking-tight">Motor Inventory</h2>
          {user.role === 'admin' && (
            <button 
              onClick={openCreateModal}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 
                         text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-all duration-300 
                         transform hover:scale-105 hover:shadow-xl flex items-center space-x-2"
            >
              <span className="text-xl">+</span>
              <span>Add New Motor</span>
            </button>
          )}
        </div>
      </div>

      {/* Motors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {updatedMotors.map((motor) => (
          <div key={motor._id} className="glass rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            {/* Status Badge */}
            <div className="flex justify-between items-start mb-4">
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

            {motor.status === 'active' && (
              <h4 className="text-l font-bold text-white mb-4 border-b border-white/20 pb-2 text-center">
              {motor.motorEq.tonNumber} - {motor.motorEq.designation}
            </h4>
            )}

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

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-white/20">
              {(user.role === 'admin' || user.role === 'manager') && (
                <button 
                  onClick={() => handleEdit(motor)}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 
                             text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 
                             transform hover:scale-105 shadow-md hover:shadow-lg"
                >
                  Edit
                </button>
              )}
              {user.role === 'admin' && (
                <button 
                  onClick={() => handleDelete(motor._id)}
                  className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 
                             text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 
                             transform hover:scale-105 shadow-md hover:shadow-lg"
                >
                  Delete
                </button>
              )}
              <Link 
                to={`/motors/${motor._id}/maintenance`}
                className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 
                           text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 
                           transform hover:scale-105 shadow-md hover:shadow-lg inline-block"
              >
                Motor History
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-dark rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <h2 className="text-3xl font-bold text-white mb-6 border-b border-white/20 pb-4">
                {isEditing ? 'Edit Motor' : 'Create New Motor'}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-blue-300 text-sm font-semibold">Serial Number*</label>
                  <input 
                    name="serialNumber" 
                    value={formData.serialNumber} 
                    onChange={handleInputChange} 
                    placeholder="Serial Number*" 
                    required 
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white 
                               placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 
                               focus:ring-blue-400/50 transition-all duration-300"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-blue-300 text-sm font-semibold">Manufacturer</label>
                  <input 
                    name="manufacturer" 
                    value={formData.manufacturer} 
                    onChange={handleInputChange} 
                    placeholder="Manufacturer" 
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white 
                               placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 
                               focus:ring-blue-400/50 transition-all duration-300"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-blue-300 text-sm font-semibold">Type</label>
                  <input 
                    name="type" 
                    value={formData.type} 
                    onChange={handleInputChange} 
                    placeholder="Type" 
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white 
                               placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 
                               focus:ring-blue-400/50 transition-all duration-300"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-blue-300 text-sm font-semibold">Power</label>
                  <input 
                    name="power" 
                    value={formData.power} 
                    onChange={handleInputChange} 
                    placeholder="Power (e.g., 10 HP)" 
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white 
                               placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 
                               focus:ring-blue-400/50 transition-all duration-300"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-blue-300 text-sm font-semibold">Current</label>
                  <input 
                    name="current" 
                    value={formData.current} 
                    onChange={handleInputChange} 
                    placeholder="Current (e.g., 15 A)" 
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white 
                               placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 
                               focus:ring-blue-400/50 transition-all duration-300"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-blue-300 text-sm font-semibold">Speed (RPM)</label>
                  <input 
                    name="speed" 
                    type="number" 
                    value={formData.speed} 
                    onChange={handleInputChange} 
                    placeholder="Speed (RPM)" 
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white 
                               placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 
                               focus:ring-blue-400/50 transition-all duration-300"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-blue-300 text-sm font-semibold">Mounting</label>
                  <input 
                    name="IM" 
                    type="text" 
                    value={formData.IM} 
                    onChange={handleInputChange} 
                    placeholder="B3" 
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white 
                               placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 
                               focus:ring-blue-400/50 transition-all duration-300"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-blue-300 text-sm font-semibold">Frame Size</label>
                  <input 
                    name="frameSize" 
                    value={formData.frameSize} 
                    onChange={handleInputChange} 
                    placeholder="Frame Size" 
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white 
                               placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 
                               focus:ring-blue-400/50 transition-all duration-300"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-blue-300 text-sm font-semibold">Bearing DE</label>
                  <input 
                    name="bearingDE" 
                    value={formData.bearingDE} 
                    onChange={handleInputChange} 
                    placeholder="Bearing DE" 
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white 
                               placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 
                               focus:ring-blue-400/50 transition-all duration-300"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-blue-300 text-sm font-semibold">Bearing NDE</label>
                  <input 
                    name="bearingNDE" 
                    value={formData.bearingNDE} 
                    onChange={handleInputChange} 
                    placeholder="Bearing NDE" 
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white 
                               placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 
                               focus:ring-blue-400/50 transition-all duration-300"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-blue-300 text-sm font-semibold">Status</label>
                  <select 
                    name="status" 
                    value={formData.status} 
                    onChange={handleInputChange} 
                    disabled={isEditing && formData.status === 'active'}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white 
                               focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 
                               transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="spare" className="bg-gray-800">Spare</option>
                    <option value="active" className="bg-gray-800">Active</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-blue-300 text-sm font-semibold">Last Maintenance Date</label>
                  <input 
                    name="lastMaintenanceDate" 
                    type="date" 
                    value={formData.lastMaintenanceDate} 
                    onChange={handleInputChange} 
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white 
                               focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 
                               transition-all duration-300"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-blue-300 text-sm font-semibold">Warehouse Location</label>
                  <input 
                    name="Warehouse" 
                    value={formData.Warehouse} 
                    onChange={handleInputChange} 
                    placeholder="Warehouse Location" 
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white 
                               placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 
                               focus:ring-blue-400/50 transition-all duration-300"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-blue-300 text-sm font-semibold">SAP ID</label>
                  <input 
                    name="SAP" 
                    value={formData.SAP} 
                    onChange={handleInputChange} 
                    placeholder="SAP" 
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white 
                               placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 
                               focus:ring-blue-400/50 transition-all duration-300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-blue-300 text-sm font-semibold">Notes</label>
                <textarea 
                  name="Note" 
                  value={formData.Note} 
                  onChange={handleInputChange} 
                  placeholder="Notes"
                  rows="4"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white 
                             placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 
                             focus:ring-blue-400/50 transition-all duration-300 resize-vertical"
                />
              </div>
              
              <div className="flex justify-end space-x-4 pt-6 border-t border-white/20">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold 
                             transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 
                             text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 
                             transform hover:scale-105 shadow-md hover:shadow-lg"
                >
                  Save Motor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};



export default MotorManagementPage;
