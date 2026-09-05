import React, { useState, useEffect, useContext, useCallback } from 'react';
import api from '../services/api';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Loader, Printer, ArrowLeft, QrCode, Calculator } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import MassMaintenanceEntry from '../components/MassMaintenanceEntry';
import DatePicker from '../components/DatePicker';
import logo from '../logo_ar.gif';

const quillModules = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ direction: 'rtl' }],
    [{ align: [] }],
    ['clean']
  ]
};

const MaintenanceHistory = () => {
  const { motorId } = useParams();
  const [searchParams] = useSearchParams();
  const qrToken = searchParams.get('qrToken') || searchParams.get('qrtoken');
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [updateLastMaintenance, setUpdateLastMaintenance] = useState(true);
  const [history, setHistory] = useState([]);
  const [motor, setMotor] = useState(null);
  const [eq, setEq] = useState(null);
  const [isActive, setIsActive] = useState(false);

  // State for edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMassEntryOpen, setIsMassEntryOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  // State for motor edit modal
  const [isEditMotorOpen, setIsEditMotorOpen] = useState(false);
  const [motorFormData, setMotorFormData] = useState({
    serialNumber: '', type: '', power: '', current: '', speed: '', IM: '', frameSize: '',
    manufacturer: '', bearingDE: '', bearingNDE: '', status: 'spare', lastMaintenanceDate: '', SAP: '', Note: '', Warehouse: ''
  });
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const formatMTBM = (days) => {
    if (days === null || days === undefined || isNaN(days)) return 'N/A';
    const months = days / 30;
    if (months > 12) {
      const years = months / 12;
      const formattedYears = Number(years.toFixed(1));
      return `${formattedYears} ${formattedYears === 1 ? 'year' : 'years'}`;
    } else {
      const formattedMonths = Number(months.toFixed(1));
      return `${formattedMonths} ${formattedMonths === 1 ? 'month' : 'months'}`;
    }
  };

  const fetchMotorHistory = useCallback(async () => {
    try {
      setError('');
      const response = await api.get(`/motors/${motorId}/maintenance`);
      setHistory(response.data.data);
    } catch (err) {
      setError('Failed to fetch motors.');
    } finally {
      setIsLoading(false);
    }
  }, [motorId]);

  const fetchMotorDetails = useCallback(async () => {
    try {
      const response = await api.get(`/motors/${motorId}`);
      const motorData = response.data.data;
      setMotor(motorData);
      setIsActive(motorData.status === 'active');
      if (motorData.status !== 'active') {
        setEq(null);
      }
    } catch (err) {
      console.error('Error fetching motor details:', err);
      setError('Failed to fetch motor details.');
    }
  }, [motorId]);

  const fetchEq = useCallback(async () => {
    try {
      setError('');
      const res = await api.get(`/equipment/${motorId}`);
      setEq(res.data.data);
    } catch (err) {
      console.error('Failed to fetch Equipment.');
    } finally {
      setIsLoading(false);
    }
  }, [motorId]);

  const handlePrintQR = () => {
    const token = qrToken || motor?.qrToken;
    const qrPdfUrl = `${api.defaults.baseURL || ''}/motors/${motorId}/qr-pdf${token ? `?qrToken=${token}` : ''}`;
    window.open(qrPdfUrl, '_blank');
  };

  useEffect(() => {
    fetchMotorHistory();
    fetchMotorDetails();
  }, [fetchMotorHistory, fetchMotorDetails]);

  useEffect(() => {
    if (isActive) {
      fetchEq();
    }
  }, [isActive, fetchEq]);

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!description || !date) {
      setError('Date and description are required for maintenance events.');
      return;
    }
    try {
      await api.post(`/motors/${motorId}/maintenance`, { date, description, updateLastMaintenance });
      fetchMotorHistory(); // Refresh motor history
      fetchMotorDetails(); // Refresh motor details (MTBM & last maintenance date)
      setDescription(''); // Reset form
      setDate(new Date().toISOString().split('T')[0]); // Reset date
      setUpdateLastMaintenance(true); // Reset checkbox
    } catch (err) {
      console.error('Error adding maintenance event:', err);
      setError('Failed to add maintenance event.');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this maintenance record?')) {
      try {
        await api.delete(`/motors/${motorId}/maintenance/${eventId}`);
        fetchMotorHistory(); // Refresh motor history
        fetchMotorDetails(); // Refresh motor details (MTBM)
      } catch (err) {
        setError('Failed to delete maintenance event.');
      }
    }
  };

  const handleSpare = async (motor) => {
    if (window.confirm('Are you sure you want to set this motor as Spare?')) {
      try {
        await api.put(`/motors/${motor._id}`, { status: 'spare' });
        fetchMotorDetails();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to update motor status.');
      }
    }
  };

  const handleOutOfService = async (motor) => {
    if (window.confirm('Are you sure you want to set this motor to Out of Service?')) {
      try {
        await api.put(`/motors/${motor._id}`, { status: 'out of service' });
        fetchMotorDetails();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to update motor status.');
      }
    }
  };

  const openEditMotorModal = () => {
    let activeAssignment = null;
    if (motor && motor.assignmentHistory && motor.assignmentHistory.length > 0) {
      activeAssignment = motor.assignmentHistory.find(h => !h.dateRemoved);
      if (!activeAssignment) {
        activeAssignment = motor.assignmentHistory[motor.assignmentHistory.length - 1];
      }
    }

    setMotorFormData({
      serialNumber: motor.serialNumber || '',
      type: motor.type || '',
      power: motor.power || '',
      current: motor.current || '',
      speed: motor.speed || '',
      IM: motor.IM || '',
      frameSize: motor.frameSize || '',
      manufacturer: motor.manufacturer || '',
      bearingDE: motor.bearingDE || '',
      bearingNDE: motor.bearingNDE || '',
      status: motor.status || 'spare',
      lastMaintenanceDate: motor.lastMaintenanceDate 
        ? new Date(motor.lastMaintenanceDate).toISOString().split('T')[0] 
        : '',
      meanTimeBetweenMaintenance: motor.meanTimeBetweenMaintenance !== undefined && motor.meanTimeBetweenMaintenance !== null 
        ? motor.meanTimeBetweenMaintenance 
        : '',
      dateAssigned: activeAssignment && activeAssignment.dateInstalled 
        ? new Date(activeAssignment.dateInstalled).toISOString().split('T')[0] 
        : '',
      dateRemoved: activeAssignment && activeAssignment.dateRemoved 
        ? new Date(activeAssignment.dateRemoved).toISOString().split('T')[0] 
        : '',
      SAP: motor.SAP || '',
      Note: motor.Note || '',
      Warehouse: motor.Warehouse || ''
    });
    setIsEditMotorOpen(true);
    setError('');
  };

  const handleCalculateMTBMForMotor = async () => {
    try {
      setError('');
      const res = await api.post(`/motors/${motorId}/calculate-mtbm`);
      const newMTBM = res.data.meanTimeBetweenMaintenance;
      setMotorFormData(prev => ({
        ...prev,
        meanTimeBetweenMaintenance: newMTBM !== null && newMTBM !== undefined ? newMTBM : ''
      }));
      fetchMotorDetails();
      if (newMTBM !== null && newMTBM !== undefined) {
        alert(`MTBM Calculated: ${newMTBM} days (${formatMTBM(newMTBM)}) based on ${res.data.completeEventsCount} complete maintenance events.`);
      } else {
        alert(`MTBM calculated as N/A: Found ${res.data.completeEventsCount} complete maintenance events (needs at least 2).`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to calculate MTBM.');
    }
  };

  const closeEditMotorModal = () => {
    setIsEditMotorOpen(false);
  };

  const handleMotorInputChange = (e) => {
    setMotorFormData({
      ...motorFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleUpdateMotor = async (e) => {
    e.preventDefault();
    try {
      const cleanedData = { ...motorFormData };
      if (cleanedData.speed === '') cleanedData.speed = null;
      if (cleanedData.lastMaintenanceDate === '') cleanedData.lastMaintenanceDate = null;
      if (cleanedData.meanTimeBetweenMaintenance === '') cleanedData.meanTimeBetweenMaintenance = null;

      await api.put(`/motors/${motorId}`, cleanedData);
      closeEditMotorModal();
      fetchMotorDetails(); // Refresh motor details
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update motor details.');
      console.error(err);
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
      fetchMotorDetails(); // Refresh motor details (MTBM)
      fetchMotorHistory(); // Refresh motor history
    } catch (err) {
      setError('Failed to update maintenance event.');
      console.error(err);
    }
  };

  if (isLoading || (!motor && !error)) {
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

  let displayMTBM = motor ? motor.meanTimeBetweenMaintenance : null;
  let isCalculated = false;
  if (motor && (displayMTBM === null || displayMTBM === undefined || isNaN(displayMTBM))) {
    isCalculated = true;
    displayMTBM = null;
  }

  let timeFromLastMaintenance = null;
  if (motor && motor.lastMaintenanceDate) {
    const today = new Date();
    const lastMaint = new Date(motor.lastMaintenanceDate);
    if (!isNaN(lastMaint.getTime())) {
      const diffTime = Math.abs(today.getTime() - lastMaint.getTime());
      timeFromLastMaintenance = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
  }

  if (isGeneratingReport && (user?.role === 'admin' || user?.role === 'manager')) {
    let activeAssignment = null;
    if (motor && motor.assignmentHistory && motor.assignmentHistory.length > 0) {
      activeAssignment = motor.assignmentHistory.find(h => !h.dateRemoved);
      if (!activeAssignment) {
        activeAssignment = motor.assignmentHistory[motor.assignmentHistory.length - 1];
      }
    }
    const dateAssignedFormatted = activeAssignment && activeAssignment.dateInstalled 
      ? new Date(activeAssignment.dateInstalled).toLocaleDateString('en-GB') 
      : 'N/A';
    const dateRemovedFormatted = activeAssignment && activeAssignment.dateRemoved 
      ? new Date(activeAssignment.dateRemoved).toLocaleDateString('en-GB') 
      : (activeAssignment ? 'Active' : 'N/A');

    return (
      <div className="min-h-screen bg-white text-black p-4 md:p-8">
        {/* Navigation & Actions - Hidden when printing */}
        <div className="print:hidden flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <button
            onClick={() => setIsGeneratingReport(false)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to History
          </button>
          <button
            onClick={() => window.print()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
          >
            <Printer size={20} />
            Print Report
          </button>
        </div>

        {/* Report Content */}
        <div className="w-full md:max-w-[210mm] mx-auto bg-white relative min-h-[297mm] p-4 md:p-8 shadow-none md:shadow-2xl print:shadow-none print:p-0 print:m-0 print:w-full print:max-w-none">
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-[0.03]">
            <img src={logo} alt="Watermark" className="w-[80%] h-auto grayscale" />
          </div>
          <style>
            {`
              @media print {
                @page {
                  size: A4 portrait;
                  margin: 10mm;
                }
                body {
                  -webkit-print-color-adjust: exact;
                }
                /* Hide global elements */
                nav, header, .navbar, .sidebar { 
                  display: none !important; 
                }
              }
            `}
          </style>

          <div className="relative z-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row print:flex-row justify-between items-center border-b-2 border-slate-800 pb-6 mb-8 gap-4 text-center md:text-left print:text-left">
              <div>
                <h1 className="text-2xl md:text-3xl print:text-3xl font-bold text-slate-900 uppercase tracking-wider">Maintenance Report</h1>
                <p className="text-slate-500 mt-1">Generated on {new Date().toLocaleDateString('en-GB')}</p>
              </div>
              <img src={logo} alt="Company Logo" className="h-12 md:h-16 print:h-16 w-auto" />
            </div>

            {/* Equipment Info if active */}
            {eq && motor.status === 'active' && (
              <div className="mb-8 border-b border-slate-300 pb-4">
                <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Current Installation</span>
                <h3 className="text-xl font-bold text-slate-800 mt-1">
                  {eq.tonNumber} - {eq.designation}
                </h3>
              </div>
            )}

            {/* Section 1: Motor Information */}
            <section className="mb-10">
              <h2 className="text-lg md:text-xl print:text-xl font-bold text-slate-800 uppercase border-l-4 border-blue-600 pl-3 mb-6">
                Motor Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-x-12 gap-y-4 text-sm">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="font-semibold text-slate-600">Serial Number</span>
                  <span className="font-bold text-slate-900">{motor.serialNumber}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="font-semibold text-slate-600">Manufacturer</span>
                  <span className="font-medium text-slate-900">{motor.manufacturer}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="font-semibold text-slate-600">Type</span>
                  <span className="font-medium text-slate-900">{motor.type}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="font-semibold text-slate-600">Power</span>
                  <span className="font-medium text-slate-900">{motor.power} KW</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="font-semibold text-slate-600">Speed</span>
                  <span className="font-medium text-slate-900">{motor.speed} rpm</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="font-semibold text-slate-600">Current</span>
                  <span className="font-medium text-slate-900">{motor.current} A</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="font-semibold text-slate-600">Mounting (IM)</span>
                  <span className="font-medium text-slate-900">{motor.IM}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="font-semibold text-slate-600">Frame Size</span>
                  <span className="font-medium text-slate-900">{motor.frameSize}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="font-semibold text-slate-600">Bearing DE</span>
                  <span className="font-medium text-slate-900">{motor.bearingDE}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="font-semibold text-slate-600">Bearing NDE</span>
                  <span className="font-medium text-slate-900">{motor.bearingNDE}</span>
                </div>
                 <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="font-semibold text-slate-600">Status</span>
                  <span className="font-medium text-slate-900 uppercase">{motor.status}</span>
                </div>
                {motor.Warehouse && (
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="font-semibold text-slate-600">Warehouse</span>
                    <span className="font-medium text-slate-900">{motor.Warehouse}</span>
                  </div>
                )}
                {motor.SAP && (
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="font-semibold text-slate-600">SAP ID</span>
                    <span className="font-medium text-slate-900">{motor.SAP}</span>
                  </div>
                )}
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="font-semibold text-slate-600">Last Maintenance</span>
                  <span className="font-medium text-slate-900">
                    {motor.lastMaintenanceDate
                      ? new Date(motor.lastMaintenanceDate).toLocaleDateString('en-GB')
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="font-semibold text-slate-600">MTBM</span>
                  <span className="font-medium text-slate-900 text-cyan-600 font-semibold">{formatMTBM(displayMTBM)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="font-semibold text-slate-600">Time From Last Maint.</span>
                  <span className={`font-semibold ${isCalculated ? 'text-amber-600 italic' : 'text-slate-900'}`}>
                    {formatMTBM(timeFromLastMaintenance)}
                    {isCalculated && timeFromLastMaintenance !== null && ' *'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="font-semibold text-slate-600">Date Assigned</span>
                  <span className="font-medium text-slate-900">{dateAssignedFormatted}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="font-semibold text-slate-600">Date Removed</span>
                  <span className="font-medium text-slate-900">{dateRemovedFormatted}</span>
                </div>
              </div>
              {isCalculated && timeFromLastMaintenance !== null && (
                <p className="text-xs text-amber-600 italic mt-4">
                  * Time From Last Maint. is dynamically calculated because no historical maintenance log exists in the database.
                </p>
              )}
            </section>

            {/* Section 2: History Log */}
            <section>
              <h2 className="text-lg md:text-xl print:text-xl font-bold text-slate-800 uppercase border-l-4 border-blue-600 pl-3 mb-6">
                Maintenance History Log
              </h2>

              {history.length > 0 ? (
                <div className="overflow-x-auto print:overflow-visible">
                  <table className="w-full text-sm text-left min-w-[600px] print:min-w-0">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-100 border-b border-slate-300">
                      <tr>
                        <th scope="col" className="px-6 py-3 w-1/4">Date</th>
                        <th scope="col" className="px-6 py-3">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((log, index) => (
                        <tr key={log._id || index} className="border-b border-slate-200 hover:bg-slate-50">
                          <td className="px-6 py-4 font-medium text-slate-900 align-top">
                            {new Date(log.date).toLocaleDateString('en-GB')}
                          </td>
                          <td className="px-6 py-4 text-slate-700 align-top">
                            <div 
                              className="prose prose-sm max-w-none text-slate-700 break-words overflow-hidden [overflow-wrap:anywhere] [&_img]:max-w-full [&_table]:max-w-full [&_table]:overflow-x-auto"
                              dangerouslySetInnerHTML={{ __html: log.description }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 italic border border-dashed border-slate-300 rounded-lg">
                  No maintenance history recorded for this motor.
                </div>
              )}
            </section>

            {/* Footer */}
            <div className="mt-16 pt-8 border-t border-slate-200 text-center text-xs text-slate-400">
              <p>Motor Tracker System - Maintenance Report</p>
            </div>
          </div>
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
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${motor.status === 'active'
              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
              : motor.status === 'out of service'
              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
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
          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            {motor.status === 'out of service' && (
              <button
                onClick={() => handleSpare(motor)}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 
                                text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 
                                transform hover:scale-105 shadow-md hover:shadow-lg"
              >
                Set Spare
              </button>
            )}
            {(user?.role === 'admin' || user?.role === 'manager') && motor.status === 'spare' && (
              <button
                onClick={() => handleOutOfService(motor)}
                className="bg-gradient-to-r from-gray-500 to-slate-500 hover:from-gray-600 hover:to-slate-600 
                                text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 
                                transform hover:scale-105 shadow-md hover:shadow-lg"
              >
                Set Out of Service
              </button>
            )}
            {(user?.role === 'admin' || user?.role === 'manager') && motor.status === 'active' && !eq && (
              <button
                onClick={() => handleOutOfService(motor)}
                className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 
                                text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 
                                transform hover:scale-105 shadow-md hover:shadow-lg"
              >
                Set Out of Service
              </button>
            )}
            {(user?.role === 'admin' || user?.role === 'manager') && (
              <>
                {process.env.NODE_ENV === 'development' && (
                  <button
                    onClick={handleCalculateMTBMForMotor}
                    className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 
                               text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 
                               transform hover:scale-105 shadow-md hover:shadow-lg flex items-center space-x-1.5"
                    title="Recalculate MTBM based on complete maintenance history"
                  >
                    <Calculator size={16} />
                    <span>Recalculate MTBM</span>
                  </button>
                )}
                <button
                  onClick={openEditMotorModal}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 
                             text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 
                             transform hover:scale-105 shadow-md hover:shadow-lg flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit Motor Details</span>
                </button>
              </>
            )}
            {(user?.role === 'admin' || user?.role === 'manager') && (
              <>
                <button
                  onClick={() => setIsGeneratingReport(true)}
                  className="bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-800 hover:to-slate-700 
                             text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 
                             transform hover:scale-105 shadow-md hover:shadow-lg flex items-center space-x-1.5"
                >
                  <Printer size={16} />
                  <span>Generate Report</span>
                </button>
                <button
                  onClick={handlePrintQR}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 
                             text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 
                             transform hover:scale-105 shadow-md hover:shadow-lg flex items-center space-x-1.5"
                >
                  <QrCode size={16} />
                  <span>Print QR Tag</span>
                </button>
              </>
            )}
            {!user && (
              <button
                onClick={() => navigate('/login')}
                className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 
                           text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 
                           transform hover:scale-105 shadow-md hover:shadow-lg"
              >
                <span>Staff Login</span>
              </button>
            )}
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

        {/* Equipment list if not active */}
        {motor.status !== 'active' && motor.assignmentHistory && motor.assignmentHistory.length > 0 && (
          <div className="mb-4">
            <h4 className="text-lg text-white border-b border-white/20 pb-2 text-center md:text-left">
              Previous Installations:
            </h4>

            <div className="text-sm text-gray-300 mt-2">
              {(() => {
                const uniqueAssignments = motor.assignmentHistory.reduce((acc, current) => {
                  const tonName = current.equipment?.tonNumber || current.ton;
                  if (tonName && !acc.some(item => (item.equipment?.tonNumber || item.ton) === tonName)) {
                    acc.push(current);
                  }
                  return acc;
                }, []);

                return uniqueAssignments.map((historyItem, index) => (
                  <span key={historyItem._id || index} className="block md:inline md:mr-4">
                    {historyItem.equipment?.tonNumber || historyItem.ton}
                    {index < uniqueAssignments.length - 1 ? ' | ' : ''}
                  </span>
                ));
              })()}
            </div>
          </div>
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

          {/* Last Maintenance, Greasing, MTBM, and Time From Last Maint. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white/5 rounded-lg p-3">
              <p className="flex justify-between items-center">
                <strong className="text-blue-300 text-base">Last Maintenance:</strong>
                <span className={`text-base ${!motor.lastMaintenanceDate ? 'text-red-300' : 'text-green-300'}`}>
                  {motor.lastMaintenanceDate ? new Date(motor.lastMaintenanceDate).toLocaleDateString('en-GB') : 'N/A'}
                </span>
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="flex justify-between items-center">
                <strong className="text-blue-300 text-base">Last Greasing:</strong>
                <span className={`text-base ${!motor.lastGreasingDate ? 'text-red-300' : 'text-green-300'}`}>
                  {motor.lastGreasingDate ? new Date(motor.lastGreasingDate).toLocaleDateString('en-GB') : 'N/A'}
                </span>
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <strong className="text-blue-300 text-base">MTBM:</strong>
                <div className="flex items-center space-x-2">
                  <span className="text-base text-cyan-300 font-bold">
                    {formatMTBM(displayMTBM)}
                  </span>
                  {(user?.role === 'admin' || user?.role === 'manager') && process.env.NODE_ENV === 'development' && (
                    <button
                      onClick={handleCalculateMTBMForMotor}
                      className="p-1 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 rounded transition-all transform hover:scale-110"
                      title="Calculate / Recalculate MTBM with complete maintenance logic"
                    >
                      <Calculator className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="flex justify-between items-center">
                <strong className="text-blue-300 text-base">Time From Last Maint.:</strong>
                <span className={`text-base ${isCalculated ? 'text-amber-400 font-semibold italic' : 'text-white'}`}>
                  {formatMTBM(timeFromLastMaintenance)}
                  {isCalculated && timeFromLastMaintenance !== null && ' *'}
                </span>
              </p>
            </div>
          </div>
          {isCalculated && timeFromLastMaintenance !== null && (
            <p className="text-xs text-amber-400/80 italic mt-1 text-right">
              * Time From Last Maint. is dynamically calculated because no historical maintenance log exists in the database.
            </p>
          )}

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
      {(user?.role === 'admin' || user?.role === 'manager') && (
        <div className="glass rounded-xl p-6 mb-8 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h5 className="text-lg font-semibold text-blue-300 flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add New Maintenance Event</span>
            </h5>

            {user?.role === 'admin' && (
              <button
                onClick={() => setIsMassEntryOpen(true)}
                className="text-sm bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>Mass Import</span>
              </button>
            )}
          </div>

          <form onSubmit={handleAddEvent} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-blue-300 text-sm font-semibold">Maintenance Date</label>
                <DatePicker
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
                <div className="bg-white/10 border border-white/20 rounded-lg text-white">
                  <ReactQuill
                    theme="snow"
                    value={description}
                    onChange={setDescription}
                    modules={quillModules}
                    placeholder="Enter maintenance description..."
                    className="h-32 mb-12"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 md:col-span-3">
                <input
                  type="checkbox"
                  id="updateLastMaintenance"
                  checked={updateLastMaintenance}
                  onChange={(e) => setUpdateLastMaintenance(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="updateLastMaintenance" className="text-blue-300 text-sm font-semibold select-none cursor-pointer">
                  Update Motor Last Maintenance Date
                </label>
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

      {/* Mass Entry Modal */}
      {isMassEntryOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <MassMaintenanceEntry
            motorId={motorId}
            onClose={() => setIsMassEntryOpen(false)}
            onSuccess={() => {
              fetchMotorHistory();
              fetchMotorDetails();
            }}
          />
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
                            {new Date(event.date).toLocaleDateString('en-GB', {
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
                    <div 
                      className="text-gray-300 text-sm md:text-base leading-relaxed mb-3 ml-0 md:ml-6 prose prose-sm prose-invert max-w-none break-words overflow-hidden [overflow-wrap:anywhere] [&_img]:max-w-full [&_table]:max-w-full [&_table]:overflow-x-auto"
                      dangerouslySetInnerHTML={{ __html: event.description }}
                    />

                    {/* Action Buttons - Always visible on mobile, hover on desktop */}
                    <div className="flex justify-end space-x-2 ml-0 md:ml-6 mt-2">
                      {/* Edit button for admin/manager */}
                      {(user?.role === 'admin' || user?.role === 'manager') && (
                        <button
                          onClick={() => openEditModal(event)}
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 
                             text-white p-2 rounded-lg transition-all duration-300 transform hover:scale-105 
                             shadow-md hover:shadow-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 flex items-center justify-center"
                          title="Edit this event"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 7H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4m-6-6l3.586-3.586a2 2 0 012.828 0l1.586 1.586a2 2 0 010 2.828L16.414 9M11 7l3.586-3.586a2 2 0 012.828 0l1.586 1.586a2 2 0 010 2.828L16.414 9M11 7l-3.586 3.586a2 2 0 00-2.828 0L3 12.414a2 2 0 000 2.828L6.414 18" />
                          </svg>
                        </button>
                      )}

                      {/* Delete button for admin */}
                      {user?.role === 'admin' && (
                        <button
                          onClick={() => handleDeleteEvent(event._id)}
                          className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 
                             text-white p-2 rounded-lg transition-all duration-300 transform hover:scale-105 
                             shadow-md hover:shadow-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 flex items-center justify-center"
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
              {(user?.role === 'admin' || user?.role === 'manager')
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
                <DatePicker
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
                <div className="bg-white/10 border border-white/20 rounded-lg text-white">
                  <ReactQuill
                    theme="snow"
                    value={editingEvent.description}
                    onChange={(val) => setEditingEvent({ ...editingEvent, description: val })}
                    modules={quillModules}
                    className="h-32 mb-12"
                  />
                </div>
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

      {/* Edit Motor Details Modal */}
      {isEditMotorOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-dark rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <form onSubmit={handleUpdateMotor} className="space-y-6">
              <h2 className="text-3xl font-bold text-white mb-6 border-b border-white/20 pb-4">
                Edit Motor Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-blue-300 text-sm font-semibold">Serial Number*</label>
                  <input
                    name="serialNumber"
                    value={motorFormData.serialNumber}
                    onChange={handleMotorInputChange}
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
                    value={motorFormData.manufacturer}
                    onChange={handleMotorInputChange}
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
                    value={motorFormData.type}
                    onChange={handleMotorInputChange}
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
                    value={motorFormData.power}
                    onChange={handleMotorInputChange}
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
                    value={motorFormData.current}
                    onChange={handleMotorInputChange}
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
                    value={motorFormData.speed}
                    onChange={handleMotorInputChange}
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
                    value={motorFormData.IM}
                    onChange={handleMotorInputChange}
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
                    value={motorFormData.frameSize}
                    onChange={handleMotorInputChange}
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
                    value={motorFormData.bearingDE}
                    onChange={handleMotorInputChange}
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
                    value={motorFormData.bearingNDE}
                    onChange={handleMotorInputChange}
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
                    value={motorFormData.status}
                    onChange={handleMotorInputChange}
                    disabled={motorFormData.status === 'active'}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white 
                               focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 
                               transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="spare" className="bg-gray-800">Spare</option>
                    <option value="active" className="bg-gray-800">Active</option>
                    <option value="out of service" className="bg-gray-800">Out of Service</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-blue-300 text-sm font-semibold">Last Maintenance Date</label>
                  <DatePicker
                    name="lastMaintenanceDate"
                    value={motorFormData.lastMaintenanceDate}
                    onChange={handleMotorInputChange}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white 
                               focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 
                               transition-all duration-300"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-blue-300 text-sm font-semibold">Warehouse Location</label>
                  <input
                    name="Warehouse"
                    value={motorFormData.Warehouse}
                    onChange={handleMotorInputChange}
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
                    value={motorFormData.SAP}
                    onChange={handleMotorInputChange}
                    placeholder="SAP"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white 
                               placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 
                               focus:ring-blue-400/50 transition-all duration-300"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-blue-300 text-sm font-semibold">Date Assigned (Dev / Installation)</label>
                  <DatePicker
                    name="dateAssigned"
                    value={motorFormData.dateAssigned}
                    onChange={handleMotorInputChange}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white 
                               focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 
                               transition-all duration-300"
                    placeholder="YYYY-MM-DD"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-blue-300 text-sm font-semibold">Date Removed (Dev / Removal)</label>
                  <DatePicker
                    name="dateRemoved"
                    value={motorFormData.dateRemoved}
                    onChange={handleMotorInputChange}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white 
                               focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 
                               transition-all duration-300"
                    placeholder="YYYY-MM-DD (blank if active)"
                  />
                </div>

                <div className="space-y-2 md:col-span-2 lg:col-span-3 bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-cyan-300 text-sm font-semibold flex items-center space-x-2">
                      <Calculator className="w-4 h-4" />
                      <span>Mean Time Between Maintenance (MTBM)</span>
                    </label>
                    {process.env.NODE_ENV === 'development' && (
                      <button
                        type="button"
                        onClick={handleCalculateMTBMForMotor}
                        className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 
                                   text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all 
                                   shadow-md flex items-center space-x-1.5"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>Calculate MTBM</span>
                      </button>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      name="meanTimeBetweenMaintenance"
                      type="number"
                      value={motorFormData.meanTimeBetweenMaintenance}
                      onChange={handleMotorInputChange}
                      placeholder="MTBM in days (or click Calculate MTBM)"
                      className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white 
                                 placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 
                                 focus:ring-cyan-400/50 transition-all duration-300 font-mono"
                    />
                    {motorFormData.meanTimeBetweenMaintenance && (
                      <span className="text-sm font-semibold text-cyan-300 whitespace-nowrap">
                        {formatMTBM(Number(motorFormData.meanTimeBetweenMaintenance))}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-blue-300 text-sm font-semibold">Notes</label>
                <textarea
                  name="Note"
                  value={motorFormData.Note}
                  onChange={handleMotorInputChange}
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
                  onClick={closeEditMotorModal}
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
                  Save Changes
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