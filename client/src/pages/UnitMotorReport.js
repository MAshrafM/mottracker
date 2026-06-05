import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { FileDown, FileSpreadsheet, Loader, ArrowLeft, Layers, Calendar, CheckCircle2, History } from 'lucide-react';
import AuthContext from '../context/AuthContext';

const UnitMotorReport = () => {
  const { user } = useContext(AuthContext);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const unitConfigs = [
    {
      id: 'ammonia',
      name: 'Ammonia',
      color: 'from-blue-500 to-cyan-500',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    {
      id: 'compressor',
      name: 'Compressor',
      color: 'from-purple-500 to-indigo-500',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 8.172V5L8 4z" />
        </svg>
      )
    },
    {
      id: 'urea',
      name: 'Urea',
      color: 'from-green-500 to-emerald-500',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    {
      id: 'granulation',
      name: 'Granulation',
      color: 'from-orange-500 to-red-500',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
        </svg>
      )
    },
    {
      id: 'water',
      name: 'Water',
      color: 'from-cyan-500 to-blue-500',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
        </svg>
      )
    },
    {
      id: 'bl',
      name: 'BL',
      color: 'from-pink-500 to-rose-500',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      )
    },
    {
      id: 'uan',
      name: 'UAN',
      color: 'from-teal-500 to-green-500',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    {
      id: 'zld',
      name: 'ZLD',
      color: 'from-amber-500 to-yellow-500',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )
    }
  ];

  useEffect(() => {
    if (selectedUnit) {
      fetchReportData();
    }
  }, [selectedUnit]);

  const fetchReportData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/reports/unit-motor?unit=${selectedUnit.id}`);
      if (response.data.success) {
        setReportData(response.data.data);
      } else {
        setError('Failed to fetch unit motor report.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error connecting to the reports server.');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async () => {
    if (!selectedUnit) return;
    try {
      const response = await api.get(`/reports/unit-motor/export-excel?unit=${selectedUnit.id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedUnit.id}_unit_motor_report.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    }
  };

  const exportToPDF = async () => {
    if (!selectedUnit) return;
    try {
      const response = await api.get(`/reports/unit-motor/export-pdf?unit=${selectedUnit.id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedUnit.id}_unit_motor_report.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const getStats = () => {
    const total = reportData.length;
    const active = reportData.filter(r => r.status === 'Active').length;
    const historical = total - active;
    return { total, active, historical };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-6 text-white relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>

      <div className="relative z-10 max-w-6xl mx-auto pt-6">
        {/* Header Navigation */}
        <div className="flex justify-between items-center mb-8 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 shadow-2xl">
          <div className="flex items-center space-x-4">
            <Link
              to="/reports"
              className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-lg transition-all duration-300 
                         transform hover:scale-105 shadow-md border border-white/20"
              title="Back to Reports"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Unit Motor Report</h1>
              <p className="text-gray-300 text-sm mt-1">
                {selectedUnit ? `${selectedUnit.name} Unit Details` : 'Select a unit to view active & historical motors'}
              </p>
            </div>
          </div>
        </div>

        {/* Unit Selection View */}
        {!selectedUnit ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {unitConfigs.map((unit) => (
              <div
                key={unit.id}
                onClick={() => setSelectedUnit(unit)}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 
                           transform hover:scale-105 cursor-pointer group relative overflow-hidden text-center"
              >
                {/* Visual Accent */}
                <div className={`absolute inset-0 bg-gradient-to-r ${unit.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
                
                <div className={`w-16 h-16 bg-gradient-to-r ${unit.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {unit.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors duration-300">
                  {unit.name}
                </h3>
                <div className="w-12 h-0.5 bg-white/20 mx-auto mt-4 group-hover:w-20 transition-all duration-300"></div>
              </div>
            ))}
          </div>
        ) : (
          /* Report View */
          <div className="space-y-6">
            {/* Control Bar & Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Export Buttons */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-xl flex flex-col justify-center gap-4">
                <h3 className="text-lg font-semibold border-b border-white/10 pb-2">Export Options</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  {(user.role === 'admin' || user.role === 'manager') ? (
                    <>
                      <button
                        onClick={exportToExcel}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
                      >
                        <FileSpreadsheet size={18} />
                        Excel
                      </button>
                      <button
                        onClick={exportToPDF}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
                      >
                        <FileDown size={18} />
                        PDF
                      </button>
                    </>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Exporting reports is restricted to Administrators and Managers.</p>
                  )}
                </div>
                <button
                  onClick={() => { setSelectedUnit(null); setReportData([]); }}
                  className="text-center text-sm text-blue-400 hover:text-blue-300 transition-colors mt-2"
                >
                  Change Unit
                </button>
              </div>

              {/* Stat Card: Active */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 shadow-xl flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 uppercase font-semibold">Active Motors</p>
                  <h3 className="text-4xl font-bold mt-1 text-green-400">{stats.active}</h3>
                  <p className="text-xs text-gray-400 mt-2">Currently in service</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                  <CheckCircle2 size={24} />
                </div>
              </div>

              {/* Stat Card: Historical */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 shadow-xl flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 uppercase font-semibold">Historical Records</p>
                  <h3 className="text-4xl font-bold mt-1 text-purple-400">{stats.historical}</h3>
                  <p className="text-xs text-gray-400 mt-2">Previous assignments logged</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <History size={24} />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-red-300 text-center font-medium">
                {error}
              </div>
            )}

            {/* Data View */}
            {loading ? (
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-12 flex flex-col items-center justify-center space-y-4 shadow-xl">
                <Loader className="w-8 h-8 text-blue-400 animate-spin" />
                <p className="text-gray-300 font-medium text-lg">Fetching unit motor report...</p>
              </div>
            ) : reportData.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center shadow-xl">
                <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-1">No Data Available</h3>
                <p className="text-gray-400">No active or historical motors were found for this unit.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block bg-white/5 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/10">
                      <thead className="bg-white/10">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">TON Number</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Designation</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Serial Number</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Power</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Speed (RPM)</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Last Maint.</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Date Assigned</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Date Removed</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {reportData.map((row, index) => (
                          <tr key={index} className="hover:bg-white/5 transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-300 font-mono">{row.tonNumber}</td>
                            <td className="px-6 py-4 text-sm text-gray-200 font-medium max-w-xs truncate" title={row.designation}>{row.designation}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">{row.serialNumber}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{row.power}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{row.speed}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{formatDate(row.lastMaintenanceDate)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                row.status === 'Active' 
                                  ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                  : 'bg-white/10 text-gray-400 border-white/10'
                              }`}>
                                {row.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">{formatDate(row.dateAssigned)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">{formatDate(row.dateRemoved)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile View Card List */}
                <div className="lg:hidden space-y-4">
                  {reportData.map((row, index) => (
                    <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-5 shadow-lg space-y-3 relative overflow-hidden">
                      <div className={`absolute top-0 right-0 w-24 h-1 ${row.status === 'Active' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                      <div className="flex justify-between items-center border-b border-white/10 pb-2">
                        <span className="font-mono font-bold text-blue-300">{row.tonNumber}</span>
                        <span className={`px-2 py-0.5 rounded text-xxs font-semibold ${
                          row.status === 'Active' 
                            ? 'bg-green-500/15 text-green-400 border border-green-500/20' 
                            : 'bg-white/10 text-gray-400 border border-white/5'
                        }`}>
                          {row.status}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-white">{row.designation}</p>
                      <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-gray-300">
                        <p><span className="text-gray-400">Serial:</span> <span className="font-mono text-white">{row.serialNumber}</span></p>
                        <p><span className="text-gray-400">Power:</span> <span className="text-white">{row.power}</span></p>
                        <p><span className="text-gray-400">Speed:</span> <span className="text-white">{row.speed} RPM</span></p>
                        <p><span className="text-gray-400">Last Maint:</span> <span className="text-white">{formatDate(row.lastMaintenanceDate)}</span></p>
                        <div className="col-span-2 border-t border-white/5 pt-2 flex justify-between">
                          <p><span className="text-gray-400">Assigned:</span> <span className="font-mono text-white">{formatDate(row.dateAssigned)}</span></p>
                          {row.dateRemoved && <p><span className="text-gray-400">Removed:</span> <span className="font-mono text-white">{formatDate(row.dateRemoved)}</span></p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UnitMotorReport;
