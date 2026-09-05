import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FileSpreadsheet, Loader, ChevronLeft } from 'lucide-react';
import AuthContext from '../context/AuthContext';

const getUnitFromTon = (tonNumber) => {
  if (!tonNumber) return '';
  const ton = String(tonNumber).trim();
  const matchDigits = ton.match(/^(\d+)/);
  if (matchDigits) {
    const digits = matchDigits[1];
    return digits.substring(0, 3);
  }
  const matchLetters = ton.match(/^([a-zA-Z]+)/);
  if (matchLetters) {
    return matchLetters[1].toUpperCase();
  }
  return ton.substring(0, 3).toUpperCase();
};

const AllMotorDetailedReport = () => {
  const { user } = useContext(AuthContext);
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
      const response = await api.get('/reports/all-motors-detailed');
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
      const response = await api.get('/reports/all-motors-detailed/export-excel', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `all_motors_detailed_${new Date().toISOString().split('T')[0]}.xlsx`);
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
    return new Date(date).toLocaleDateString('en-GB');
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
              <h1 className="text-3xl font-bold tracking-tight">All Motor Detailed Report</h1>
              <p className="text-gray-300 mt-1">Categorized active and spare motors listing with full specifications, intervals, and statuses</p>
            </div>
          </div>

          {(user?.role === 'admin' || user?.role === 'manager') && (
            <button
              onClick={exportToExcel}
              disabled={loading || reportData.length === 0}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
            >
              <FileSpreadsheet size={20} />
              <span>Export to Excel</span>
            </button>
          )}
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
            <p className="text-gray-300 text-lg font-medium">Fetching detailed motor records...</p>
          </div>
        ) : reportData.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center shadow-xl">
            <p className="text-gray-400 text-lg">No motors found in the system.</p>
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
                    {group.motors.length} motor record(s)
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
                        <th className="px-4 py-3">Prev. Maint.</th>
                        <th className="px-4 py-3">Last Maint.</th>
                        <th className="px-4 py-3">MTBM</th>
                        <th className="px-4 py-3">Time From Last Maint.</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Grease Interval</th>
                        <th className="px-4 py-3">Warehouse No.</th>
                        <th className="px-4 py-3">SAP No.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm text-gray-200">
                      {group.motors.map((motor, mIndex) => {
                        const currentUnit = getUnitFromTon(motor.tonNumber);
                        const prevMotor = mIndex > 0 ? group.motors[mIndex - 1] : null;
                        const prevUnit = prevMotor ? getUnitFromTon(prevMotor.tonNumber) : null;
                        const showSeparator = prevUnit !== null && currentUnit !== prevUnit;

                        return (
                          <React.Fragment key={mIndex}>
                            {showSeparator && (
                              <tr className="bg-blue-900/30 border-y border-white/5">
                                <td colSpan={17} className="p-0">
                                  <div className="h-2.5 bg-blue-500/10"></div>
                                </td>
                              </tr>
                            )}
                            <tr className={`transition-colors duration-150 ${
                              motor.status === 'Spare'
                                ? 'bg-amber-500/5 hover:bg-amber-500/10'
                                : 'hover:bg-white/5'
                            }`}>
                              <td className="px-4 py-3 font-mono font-semibold text-blue-300">{motor.tonNumber || 'N/A'}</td>
                              <td className="px-4 py-3 font-medium truncate max-w-[200px]" title={motor.designation}>{motor.designation}</td>
                              <td className="px-4 py-3 font-mono">{motor.serialNumber}</td>
                              <td className="px-4 py-3">{motor.power} kW</td>
                              <td className="px-4 py-3">{motor.speed} rpm</td>
                              <td className="px-4 py-3">{motor.IM}</td>
                              <td className="px-4 py-3">{motor.frameSize}</td>
                              <td className="px-4 py-3 font-mono text-xs">{motor.bearingNDE}</td>
                              <td className="px-4 py-3 font-mono text-xs">{motor.bearingDE}</td>
                              <td className="px-4 py-3">{formatDate(motor.prevMaintenanceDate)}</td>
                              <td className="px-4 py-3">{formatDate(motor.lastMaintenanceDate)}</td>
                              <td className="px-4 py-3 font-semibold text-cyan-300">
                                {formatMTBM(motor.meanTimeBetweenMaintenance)}
                              </td>
                              <td className={`px-4 py-3 font-semibold ${motor.isCalculatedMTBM ? 'text-amber-400 italic' : 'text-white'}`}>
                                {formatMTBM(motor.timeSinceLastMaintenance)}
                                {motor.isCalculatedMTBM && ' *'}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                  motor.status === 'Active'
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                }`}>
                                  {motor.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-amber-300 font-semibold">
                                {motor.greaseInterval ? `${motor.greaseInterval} hrs` : 'N/A'}
                              </td>
                              <td className="px-4 py-3 font-mono text-xs">{motor.Warehouse || 'N/A'}</td>
                              <td className="px-4 py-3 font-mono text-xs">{motor.SAP || 'N/A'}</td>
                            </tr>
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile/Tablet Card View */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 xl:hidden bg-black/10">
                  {group.motors.map((motor, mIndex) => {
                    const currentUnit = getUnitFromTon(motor.tonNumber);
                    const prevMotor = mIndex > 0 ? group.motors[mIndex - 1] : null;
                    const prevUnit = prevMotor ? getUnitFromTon(prevMotor.tonNumber) : null;
                    const showSeparator = prevUnit !== null && currentUnit !== prevUnit;

                    return (
                      <React.Fragment key={mIndex}>
                        {showSeparator && (
                          <div className="col-span-full py-2 flex items-center justify-center">
                            <div className="w-full border-t border-dashed border-blue-500/30"></div>
                          </div>
                        )}
                        <div className="glass-dark p-4 rounded-lg border border-white/5 space-y-2 text-sm">
                          <div className="flex justify-between items-center border-b border-white/10 pb-1.5 mb-2">
                            <span className="font-bold text-blue-300 font-mono text-base">{motor.tonNumber || 'N/A'}</span>
                            <span className={`px-2 py-0.5 rounded text-xxs font-semibold ${
                              motor.status === 'Active'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}>
                              {motor.status}
                            </span>
                          </div>
                          <p className="text-gray-300"><span className="text-gray-400 font-medium">Designation:</span> {motor.designation}</p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-300 pt-1">
                            <p>Serial: <span className="text-white font-mono">{motor.serialNumber}</span></p>
                            <p>Power: <span className="text-white">{motor.power} kW</span></p>
                            <p>Speed: <span className="text-white">{motor.speed} rpm</span></p>
                            <p>IM: <span className="text-white">{motor.IM}</span></p>
                            <p>Frame: <span className="text-white">{motor.frameSize}</span></p>
                            <p>NDE Brg: <span className="text-white font-mono">{motor.bearingNDE}</span></p>
                            <p>DE Brg: <span className="text-white font-mono">{motor.bearingDE}</span></p>
                            <p>Prev Maint: <span className="text-white">{formatDate(motor.prevMaintenanceDate)}</span></p>
                            <p>Last Maint: <span className="text-white">{formatDate(motor.lastMaintenanceDate)}</span></p>
                            <p>MTBM: <span className="text-cyan-300 font-semibold">{formatMTBM(motor.meanTimeBetweenMaintenance)}</span></p>
                            <p>Time From Maint: <span className={`font-semibold ${motor.isCalculatedMTBM ? 'text-amber-400 italic' : 'text-white'}`}>{formatMTBM(motor.timeSinceLastMaintenance)}{motor.isCalculatedMTBM && ' *'}</span></p>
                            <p>Grease Int: <span className="text-amber-300 font-semibold">{motor.greaseInterval ? `${motor.greaseInterval} hrs` : 'N/A'}</span></p>
                            <p>Warehouse No: <span className="text-white font-mono">{motor.Warehouse || 'N/A'}</span></p>
                            <p>SAP No: <span className="text-white font-mono">{motor.SAP || 'N/A'}</span></p>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            ))}
            {/* Footnote for calculated MTBM */}
            <div className="mt-6 text-sm text-gray-400 italic bg-white/5 border border-white/10 rounded-xl p-4">
              <p>* Note: Time From Last Maint. values highlighted in <span className="text-amber-400 font-semibold not-italic">amber *</span> are dynamically calculated based on the elapsed time since the last maintenance date because no historical maintenance log exists in the database.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllMotorDetailedReport;
