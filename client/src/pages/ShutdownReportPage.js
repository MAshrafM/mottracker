import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FileDown, FileSpreadsheet, Loader, ChevronLeft, Calendar, Info, Search, Gauge } from 'lucide-react';
import DatePicker from '../components/DatePicker';
import { transformToMeasurementReport } from '../utils/measurementExtractor';

const ShutdownReportPage = () => {
  const navigate = useNavigate();
  
  // Set default date range: from the 1st of the current month to today
  const getDefaultDates = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const formatToInternal = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    return {
      from: formatToInternal(firstDay),
      to: formatToInternal(today)
    };
  };

  const defaults = getDefaultDates();
  // Internal API format: yyyy-mm-dd
  const [fromDate, setFromDate] = useState(defaults.from);
  const [toDate, setToDate] = useState(defaults.to);

  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('date'); // 'date' | 'unit' | 'measurements'

  const fetchReport = async () => {
    if (!fromDate || !toDate) {
      setError('Please provide valid dates.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await api.get('/reports/shutdown-report', {
        params: { from: fromDate, to: toDate }
      });
      setReportData(response.data.data || []);
    } catch (err) {
      console.error('Error fetching shutdown report:', err);
      setError('Failed to load shutdown report data. Please verify date inputs.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch report data only on initial mount
  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportPDFByDate = async () => {
    try {
      const response = await api.get('/reports/shutdown-report/export-pdf-by-date', {
        params: { from: fromDate, to: toDate },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `shutdown_report_by_date_${fromDate}_to_${toDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting PDF by date:', err);
      alert('Failed to export PDF by date.');
    }
  };

  const exportPDFByUnit = async () => {
    try {
      const response = await api.get('/reports/shutdown-report/export-pdf-by-unit', {
        params: { from: fromDate, to: toDate },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `shutdown_report_by_unit_${fromDate}_to_${toDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting PDF by unit:', err);
      alert('Failed to export PDF by unit.');
    }
  };

  const exportExcelMeasurements = async () => {
    try {
      const response = await api.get('/reports/shutdown-report/export-excel-measurements', {
        params: { from: fromDate, to: toDate },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `shutdown_measurement_report_${fromDate}_to_${toDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting Excel measurements:', err);
      alert('Failed to export Excel measurements.');
    }
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Handle Enter key to trigger fetch
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') fetchReport();
  };

  // Prepare sorted data for previews
  const dataSortedByDate = [...reportData].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  const dataSortedByUnit = [...reportData].sort((a, b) => {
    const unitCompare = a.unit.localeCompare(b.unit);
    if (unitCompare !== 0) return unitCompare;
    
    // Fallback comparison for TON numbers
    const tonCompare = String(a.tonNumber).localeCompare(String(b.tonNumber));
    if (tonCompare !== 0) return tonCompare;

    return new Date(a.date) - new Date(b.date);
  });

  const formattedRecordsForMeasurement = dataSortedByDate.map(r => ({
    ...r,
    dateFormatted: formatDateDisplay(r.date)
  }));
  const measurementRecords = transformToMeasurementReport(formattedRecordsForMeasurement);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-6 text-white relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>

      <div className="relative z-10 max-w-7xl mx-auto pt-6">
        {/* Header section */}
        <div className="glass rounded-xl p-6 mb-8 shadow-2xl">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/reports')}
                className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-lg transition-all duration-300 border border-white/20"
                title="Back to Reports"
              >
                <ChevronLeft size={20} />
              </button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Shutdown Report</h1>
                <p className="text-gray-300 mt-1">Filter and export motor maintenance histories & extracted measurements</p>
              </div>
            </div>

            {/* Date Range Picker */}
            <div className="w-full lg:w-auto">
              <div className="flex flex-col sm:flex-row items-stretch gap-3 bg-gradient-to-r from-white/[0.06] to-white/[0.03] p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                
                {/* From Date */}
                <div className="flex-1 min-w-0">
                  <label className="flex items-center gap-1.5 text-[11px] text-blue-300 uppercase font-semibold tracking-wider mb-1.5">
                    <Calendar size={12} />
                    From
                  </label>
                  <DatePicker 
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    onKeyDown={handleKeyDown}
                    name="fromDate"
                  />
                </div>

                {/* Separator */}
                <div className="hidden sm:flex items-center justify-center pt-5 px-1">
                  <span className="text-gray-500 text-lg font-light">—</span>
                </div>

                {/* To Date */}
                <div className="flex-1 min-w-0">
                  <label className="flex items-center gap-1.5 text-[11px] text-blue-300 uppercase font-semibold tracking-wider mb-1.5">
                    <Calendar size={12} />
                    To
                  </label>
                  <DatePicker 
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    onKeyDown={handleKeyDown}
                    name="toDate"
                  />
                </div>

                {/* Generate Button */}
                <div className="flex items-end mt-4 sm:mt-0">
                  <button
                    onClick={fetchReport}
                    disabled={loading || !fromDate || !toDate}
                    className="flex w-full sm:w-auto items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
                    title="Generate Report"
                  >
                    {loading ? (
                      <Loader size={16} className="animate-spin" />
                    ) : (
                      <Search size={16} />
                    )}
                    <span>Generate</span>
                  </button>
                </div>
                
              </div>
            </div>
          </div>
        </div>

        {/* Action and Stats Ribbon */}
        {reportData.length > 0 && (
          <div className="glass rounded-xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl border border-white/10">
            <div className="flex items-center space-x-3">
              <Info className="text-blue-400" size={20} />
              <span className="text-sm">
                Found <span className="text-amber-400 font-bold">{reportData.length}</span> event(s) in this period.
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <button
                onClick={exportPDFByDate}
                className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-semibold shadow-md transition-all duration-300 transform hover:scale-105"
              >
                <FileDown size={18} />
                <span>Export PDF (by Date)</span>
              </button>
              <button
                onClick={exportPDFByUnit}
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-semibold shadow-md transition-all duration-300 transform hover:scale-105"
              >
                <FileDown size={18} />
                <span>Export PDF (by Unit/TON)</span>
              </button>
              <button
                onClick={exportExcelMeasurements}
                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-semibold shadow-md transition-all duration-300 transform hover:scale-105"
              >
                <FileSpreadsheet size={18} />
                <span>Export Excel (Measurements)</span>
              </button>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-6 text-center">
            <p className="text-red-300 font-semibold">{error}</p>
          </div>
        )}

        {/* Loading Display */}
        {loading ? (
          <div className="glass rounded-xl p-12 flex flex-col items-center justify-center space-y-4 shadow-xl border border-white/10">
            <Loader className="w-8 h-8 text-blue-400 animate-spin" />
            <p className="text-gray-300 text-lg font-medium">Filtering maintenance history records...</p>
          </div>
        ) : reportData.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center shadow-xl border border-white/10">
            <p className="text-gray-400 text-lg">No history records found in this date range.</p>
            <p className="text-gray-500 text-sm mt-2">Try adjusting the filter range at the top-right.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex border-b border-white/10 overflow-x-auto">
              <button
                onClick={() => setActiveTab('date')}
                className={`py-3 px-6 font-semibold border-b-2 transition-all duration-200 whitespace-nowrap ${
                  activeTab === 'date'
                    ? 'border-blue-500 text-white bg-white/5'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Arranged by Date
              </button>
              <button
                onClick={() => setActiveTab('unit')}
                className={`py-3 px-6 font-semibold border-b-2 transition-all duration-200 whitespace-nowrap ${
                  activeTab === 'unit'
                    ? 'border-blue-500 text-white bg-white/5'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Arranged by Unit & TON
              </button>
              <button
                onClick={() => setActiveTab('measurements')}
                className={`py-3 px-6 font-semibold border-b-2 transition-all duration-200 flex items-center space-x-2 whitespace-nowrap ${
                  activeTab === 'measurements'
                    ? 'border-blue-500 text-white bg-white/5'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Gauge size={16} className="text-cyan-400" />
                <span>Measurement Sub-Report</span>
              </button>
            </div>

            {/* Table Area */}
            <div className="glass rounded-xl shadow-xl overflow-hidden border border-white/10">
              {activeTab === 'date' ? (
                // Table 1: Arranged by Date
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10 text-xs text-blue-300 font-bold uppercase tracking-wider">
                        <th className="px-6 py-3.5">Date</th>
                        <th className="px-6 py-3.5">TON Number</th>
                        <th className="px-6 py-3.5">Serial Number</th>
                        <th className="px-6 py-3.5">History Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm text-gray-200">
                      {dataSortedByDate.map((row, index) => (
                        <tr key={index} className="hover:bg-white/5 transition-colors duration-150">
                          <td className="px-6 py-4 font-semibold text-blue-200 shrink-0">
                            {formatDateDisplay(row.date)}
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-amber-400">
                            {row.tonNumber}
                          </td>
                          <td className="px-6 py-4 font-mono">{row.serialNumber}</td>
                          <td 
                            className="px-6 py-4 text-gray-300 leading-relaxed break-words prose prose-sm prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: row.description }}
                          />
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : activeTab === 'unit' ? (
                // Table 2: Arranged by Unit & TON
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10 text-xs text-blue-300 font-bold uppercase tracking-wider">
                        <th className="px-6 py-3.5">Unit</th>
                        <th className="px-6 py-3.5">TON Number</th>
                        <th className="px-6 py-3.5">Date of Event</th>
                        <th className="px-6 py-3.5">Serial Number</th>
                        <th className="px-6 py-3.5">History Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm text-gray-200">
                      {dataSortedByUnit.map((row, index) => (
                        <tr key={index} className="hover:bg-white/5 transition-colors duration-150">
                          <td className="px-6 py-4 font-bold text-indigo-300">
                            {row.unit}
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-amber-400">
                            {row.tonNumber}
                          </td>
                          <td className="px-6 py-4 text-blue-200">
                            {formatDateDisplay(row.date)}
                          </td>
                          <td className="px-6 py-4 font-mono">{row.serialNumber}</td>
                          <td 
                            className="px-6 py-4 text-gray-300 leading-relaxed break-words prose prose-sm prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: row.description }}
                          />
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                // Table 3: Measurement Sub-Report
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10 text-xs text-blue-300 font-bold uppercase tracking-wider">
                        <th className="px-4 py-3.5">Date</th>
                        <th className="px-4 py-3.5">TON Number</th>
                        <th className="px-4 py-3.5">Serial Number</th>
                        <th className="px-4 py-3.5 text-center">Rotor (DE / NDE)</th>
                        <th className="px-4 py-3.5 text-center">Housing (DE / NDE)</th>
                        <th className="px-4 py-3.5 text-center">Current (In.L)</th>
                        <th className="px-4 py-3.5 text-center">Vib No-Load (V.NL)</th>
                        <th className="px-4 py-3.5 text-center">Vib Load (V.L)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm text-gray-200">
                      {measurementRecords.map((row, index) => {
                        const hasRotor = row.rotorDE || row.rotorNDE;
                        const hasHousing = row.housingDE || row.housingNDE;

                        return (
                          <tr key={index} title={row.rawText || ''} className="hover:bg-white/5 transition-colors duration-150">
                            <td className="px-4 py-4 font-semibold text-blue-200 whitespace-nowrap">
                              {row.date}
                            </td>
                            <td className="px-4 py-4 font-mono font-bold text-amber-400 whitespace-nowrap">
                              {row.ton}
                            </td>
                            <td className="px-4 py-4 font-mono whitespace-nowrap">{row.serialNumber}</td>
                            
                            {/* Rotor DE / NDE */}
                            <td className="px-4 py-4 text-center font-mono whitespace-nowrap">
                              {hasRotor ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-semibold text-xs">
                                  <span>DE: {row.rotorDE || '-'}</span>
                                  <span className="text-gray-500">|</span>
                                  <span>NDE: {row.rotorNDE || '-'}</span>
                                </span>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </td>

                            {/* Housing DE / NDE */}
                            <td className="px-4 py-4 text-center font-mono whitespace-nowrap">
                              {hasHousing ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-semibold text-xs">
                                  <span>DE: {row.housingDE || '-'}</span>
                                  <span className="text-gray-500">|</span>
                                  <span>NDE: {row.housingNDE || '-'}</span>
                                </span>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </td>

                            {/* Current (In.L) */}
                            <td className="px-4 py-4 text-center font-mono whitespace-nowrap">
                              {row.inL ? (
                                <span className="px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 font-bold text-xs">
                                  {row.inL}
                                </span>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </td>

                            {/* Vib No-Load */}
                            <td className="px-4 py-4 text-center font-mono whitespace-nowrap">
                              {row.vNL ? (
                                <span className="px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-300 font-semibold text-xs">
                                  {row.vNL}
                                </span>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </td>

                            {/* Vib Load */}
                            <td className="px-4 py-4 text-center font-mono whitespace-nowrap">
                              {row.vL ? (
                                <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 font-semibold text-xs">
                                  {row.vL}
                                </span>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShutdownReportPage;

