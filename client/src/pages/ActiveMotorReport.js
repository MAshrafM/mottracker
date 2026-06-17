import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FileDown, FileSpreadsheet, Loader, ChevronLeft } from 'lucide-react';

const ActiveMotorsReport = () => {
  const navigate = useNavigate();
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/reports/active-motors');
      setReportData(response.data.data);
    } catch (err) {
      console.error('Error fetching report:', err);
      setError('Failed to load active motors report data.');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async () => {
    try {
      const response = await api.get('/reports/active-motors/export-excel', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `active_motors_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      alert('Failed to export report to Excel.');
    }
  };

  const exportToPDF = async () => {
    try {
      const response = await api.get('/reports/active-motors/export-pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `active_motors_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting to PDF:', err);
      alert('Failed to export report to PDF.');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const totalActiveMotors = reportData.reduce((sum, group) => sum + group.motors.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-6 text-white relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>

      <div className="relative z-10 max-w-7xl mx-auto pt-6">
        {/* Header section */}
        <div className="glass rounded-xl p-6 mb-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/reports')}
              className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-lg transition-all duration-300 border border-white/20"
              title="Back to Reports"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Active Motors Report</h1>
              <p className="text-gray-300 mt-1">Categorized active motors listing with core technical details</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <button
              onClick={exportToExcel}
              disabled={loading || reportData.length === 0}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl w-full sm:w-auto"
            >
              <FileSpreadsheet size={20} />
              <span>Export to Excel</span>
            </button>

            <button
              onClick={exportToPDF}
              disabled={loading || reportData.length === 0}
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl w-full sm:w-auto"
            >
              <FileDown size={20} />
              <span>Export to PDF</span>
            </button>

            <div className="bg-blue-500/10 border border-blue-500/20 text-blue-300 px-4 py-2.5 rounded-lg font-semibold text-center w-full sm:w-auto">
              Total Active: <span className="text-amber-400 font-bold">{totalActiveMotors}</span>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-6 text-center">
            <p className="text-red-300 font-semibold">{error}</p>
          </div>
        )}

        {/* Loading display */}
        {loading ? (
          <div className="glass rounded-xl p-12 flex flex-col items-center justify-center space-y-4 shadow-xl">
            <Loader className="w-8 h-8 text-blue-400 animate-spin" />
            <p className="text-gray-300 text-lg font-medium">Fetching active motor records...</p>
          </div>
        ) : reportData.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center shadow-xl">
            <p className="text-gray-400 text-lg">No active motors found in the system.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {reportData.map((group, gIndex) => (
              <div key={gIndex} className="glass rounded-xl shadow-xl overflow-hidden border border-white/10">
                {/* Category Header */}
                <div className="bg-gradient-to-r from-blue-900/60 to-indigo-900/60 px-6 py-4 border-b border-white/10 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-blue-200 tracking-wider">
                    {group.unitName === 'H.T.' ? 'H.T. MOTORS' : `${group.unitName.toUpperCase()} UNIT`}
                  </h2>
                  <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/30">
                    {group.motors.length} active motor(s)
                  </span>
                </div>

                {/* Desktop View Table */}
                <div className="overflow-x-auto hidden xl:block">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10 text-xs text-blue-300 font-bold uppercase tracking-wider">
                        <th className="px-4 py-3">TON Number</th>
                        <th className="px-4 py-3">Designation</th>
                        <th className="px-4 py-3">Serial Number</th>
                        <th className="px-4 py-3">Power</th>
                        <th className="px-4 py-3">Speed</th>
                        <th className="px-4 py-3">Current</th>
                        <th className="px-4 py-3">IM</th>
                        <th className="px-4 py-3">Frame Size</th>
                        <th className="px-4 py-3">Bearing NDE</th>
                        <th className="px-4 py-3">Bearing DE</th>
                        <th className="px-4 py-3">Last Maintenance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm text-gray-200">
                      {group.motors.map((motor, mIndex) => (
                        <tr key={mIndex} className="hover:bg-white/5 transition-colors duration-150">
                          <td className="px-4 py-3 font-mono font-semibold text-blue-300">{motor.tonNumber}</td>
                          <td className="px-4 py-3 font-medium truncate max-w-[200px]" title={motor.designation}>{motor.designation}</td>
                          <td className="px-4 py-3 font-mono">{motor.serialNumber}</td>
                          <td className="px-4 py-3">{motor.power} kW</td>
                          <td className="px-4 py-3">{motor.speed} rpm</td>
                          <td className="px-4 py-3">{motor.current}</td>
                          <td className="px-4 py-3">{motor.IM}</td>
                          <td className="px-4 py-3">{motor.frameSize}</td>
                          <td className="px-4 py-3 font-mono text-xs">{motor.bearingNDE}</td>
                          <td className="px-4 py-3 font-mono text-xs">{motor.bearingDE}</td>
                          <td className="px-4 py-3">{formatDate(motor.lastMaintenanceDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile/Tablet Card View */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 xl:hidden bg-black/10">
                  {group.motors.map((motor, mIndex) => (
                    <div key={mIndex} className="glass-dark p-4 rounded-lg border border-white/5 space-y-2 text-sm">
                      <div className="flex justify-between items-center border-b border-white/10 pb-1.5 mb-2">
                        <span className="font-bold text-blue-300 font-mono text-base">{motor.tonNumber}</span>
                        <span className="text-xs text-gray-400 font-mono">{motor.serialNumber}</span>
                      </div>
                      <p className="text-gray-300"><span className="text-gray-400 font-medium">Designation:</span> {motor.designation}</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-300 pt-1">
                        <p>Power: <span className="text-white">{motor.power} kW</span></p>
                        <p>Speed: <span className="text-white">{motor.speed} rpm</span></p>
                        <p>Current: <span className="text-white">{motor.current}</span></p>
                        <p>IM: <span className="text-white">{motor.IM}</span></p>
                        <p>Frame: <span className="text-white">{motor.frameSize}</span></p>
                        <p>NDE Brg: <span className="text-white font-mono">{motor.bearingNDE}</span></p>
                        <p>DE Brg: <span className="text-white font-mono">{motor.bearingDE}</span></p>
                        <p>Last Maint: <span className="text-white">{formatDate(motor.lastMaintenanceDate)}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveMotorsReport;