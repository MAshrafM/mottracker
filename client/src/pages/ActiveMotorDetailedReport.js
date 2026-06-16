import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FileSpreadsheet, Loader, ChevronLeft } from 'lucide-react';

const ActiveMotorDetailedReport = () => {
  const navigate = useNavigate();
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDetailedReport();
  }, []);

  const fetchDetailedReport = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/reports/active-motors-detailed');
      setReportData(response.data.data);
    } catch (err) {
      console.error('Error fetching detailed report:', err);
      setError('Failed to load detailed report data.');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async () => {
    try {
      const response = await api.get('/reports/active-motors-detailed/export-excel', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `active_motors_detailed_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      alert('Failed to export detailed report to Excel.');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

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
              <h1 className="text-3xl font-bold tracking-tight">Active Motor Detailed Report</h1>
              <p className="text-gray-300 mt-1">Categorized active motors listing with full specifications and intervals</p>
            </div>
          </div>

          <button
            onClick={exportToExcel}
            disabled={loading || reportData.length === 0}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
          >
            <FileSpreadsheet size={20} />
            <span>Export to Excel</span>
          </button>
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
            <p className="text-gray-300 text-lg font-medium">Fetching detailed active motor records...</p>
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
                        <th className="px-4 py-3">IM</th>
                        <th className="px-4 py-3">Frame Size</th>
                        <th className="px-4 py-3">Bearing NDE</th>
                        <th className="px-4 py-3">Bearing DE</th>
                        <th className="px-4 py-3">Last Maint.</th>
                        <th className="px-4 py-3">MTBM</th>
                        <th className="px-4 py-3">Date Assigned</th>
                        <th className="px-4 py-3">Grease Interval</th>
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
                          <td className="px-4 py-3">{motor.IM}</td>
                          <td className="px-4 py-3">{motor.frameSize}</td>
                          <td className="px-4 py-3 font-mono text-xs">{motor.bearingNDE}</td>
                          <td className="px-4 py-3 font-mono text-xs">{motor.bearingDE}</td>
                          <td className="px-4 py-3">{formatDate(motor.lastMaintenanceDate)}</td>
                          <td className={`px-4 py-3 font-semibold ${motor.isCalculatedMTBM ? 'text-amber-400 italic' : 'text-cyan-300'}`}>
                            {formatMTBM(motor.meanTimeBetweenMaintenance)}
                            {motor.isCalculatedMTBM && ' *'}
                          </td>
                          <td className="px-4 py-3">{formatDate(motor.dateAssigned)}</td>
                          <td className="px-4 py-3 text-amber-300 font-semibold">
                            {motor.greaseInterval ? `${motor.greaseInterval} hrs` : 'N/A'}
                          </td>
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
                        <p>IM: <span className="text-white">{motor.IM}</span></p>
                        <p>Frame: <span className="text-white">{motor.frameSize}</span></p>
                        <p>NDE Brg: <span className="text-white font-mono">{motor.bearingNDE}</span></p>
                        <p>DE Brg: <span className="text-white font-mono">{motor.bearingDE}</span></p>
                        <p>Last Maint: <span className="text-white">{formatDate(motor.lastMaintenanceDate)}</span></p>
                        <p>MTBM: <span className={`font-semibold ${motor.isCalculatedMTBM ? 'text-amber-400 italic' : 'text-cyan-300'}`}>{formatMTBM(motor.meanTimeBetweenMaintenance)}{motor.isCalculatedMTBM && ' *'}</span></p>
                        <p>Assigned: <span className="text-white">{formatDate(motor.dateAssigned)}</span></p>
                        <p>Grease Int: <span className="text-amber-300 font-semibold">{motor.greaseInterval ? `${motor.greaseInterval} hrs` : 'N/A'}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {/* Footnote for calculated MTBM */}
            <div className="mt-6 text-sm text-gray-400 italic bg-white/5 border border-white/10 rounded-xl p-4">
              <p>* Note: MTBM values highlighted in <span className="text-amber-400 font-semibold not-italic">amber *</span> are dynamically calculated based on the elapsed time since the last maintenance date because no historical maintenance log exists in the database.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveMotorDetailedReport;
