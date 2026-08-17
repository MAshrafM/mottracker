import React, { useState } from 'react';
import { Terminal, Download, FileText, AlertCircle, ListPlus, Trash2, Table as TableIcon, Database, Calculator, Calendar, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import DatePicker from '../components/DatePicker';

const parseDateString = (dateStr) => {
  if (!dateStr || String(dateStr).trim() === '') return null;
  const str = String(dateStr).trim();
  const parts = str.split('/');
  if (parts.length === 3) {
    return new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}T00:00:00Z`);
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

const formatMTBM = (days) => {
  if (days === null || days === undefined || isNaN(days)) return 'N/A';
  const months = days / 30;
  if (months > 12) {
    const years = months / 12;
    const formattedYears = Number(years.toFixed(1));
    return `${days} days (${formattedYears} ${formattedYears === 1 ? 'year' : 'years'})`;
  } else {
    const formattedMonths = Number(months.toFixed(1));
    return `${days} days (${formattedMonths} ${formattedMonths === 1 ? 'month' : 'months'})`;
  }
};

const DevParserPage = () => {
  const [input, setInput] = useState('');
  const [motorDetails, setMotorDetails] = useState('');
  const [dateAssigned, setDateAssigned] = useState('');
  const [dateRemoved, setDateRemoved] = useState('');
  const [tonNumber, setTonNumber] = useState('');
  const [calculatedMTBM, setCalculatedMTBM] = useState(null);
  const [mtbmInfo, setMtbmInfo] = useState(null);
  const [records, setRecords] = useState([]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Extract date-description pairs from raw text
  const extractEvents = (text) => {
    if (!text || !text.trim()) return [];
    const datePattern = /(\d{1,2}\/\d{1,2}\/\d{4})\s*=\s*/g;
    const matches = [];
    let match;

    while ((match = datePattern.exec(text)) !== null) {
      matches.push({
        date: match[1],
        index: match.index,
        fullMatchLength: match[0].length
      });
    }

    if (matches.length === 0) return [];

    const jsonArray = [];
    for (let i = 0; i < matches.length; i++) {
      const currentMatch = matches[i];
      const nextMatch = matches[i + 1];

      const dateParts = currentMatch.date.split('/');
      const day = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10);
      const year = parseInt(dateParts[2], 10);

      if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) {
        continue;
      }

      const startPos = currentMatch.index + currentMatch.fullMatchLength;
      const endPos = nextMatch ? nextMatch.index : text.length;
      let rawContent = text.substring(startPos, endPos);

      let description = rawContent
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => line.replace(/^[·•\-*\s]+/, '').trim())
        .filter(line => line.length > 0)
        .join(' ')
        .trim();

      if (description) {
        jsonArray.push({
          date: currentMatch.date,
          description: description
        });
      }
    }
    return jsonArray;
  };

  const isCompleteMaintenanceEvent = (description) => {
    if (!description) return false;
    const clean = String(description)
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;|&#160;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&[a-z0-9]+;/gi, ' ')
      .replace(/[\u00a0\s]+/g, ' ')
      .toLowerCase()
      .trim();

    const regex = /(?:complete|compelet|compelete|compleet|complet|full)\s*(?:motor\s*)?maint|overhaul|صيانة\s*كاملة|عمرة/i;
    return regex.test(clean) ||
      clean.includes('complete maintenance') ||
      clean.includes('compelet maintainance') ||
      clean.includes('complete maint') ||
      clean.includes('motor complete maint') ||
      clean.includes('complete maintainance') ||
      clean.includes('compelete maintainance') ||
      clean.includes('complet maintenance');
  };

  // Compute MTBM with exact standard logic
  const calculateMTBMLogic = (events) => {
    if (!events || events.length === 0) {
      return { mtbm: null, count: 0, reason: 'No maintenance events found' };
    }

    const completeEvents = events
      .filter(event => {
        const parsed = parseDateString(event.date);
        return parsed && !isNaN(parsed.getTime()) && isCompleteMaintenanceEvent(event.description);
      })
      .sort((a, b) => parseDateString(a.date) - parseDateString(b.date));

    if (completeEvents.length >= 2) {
      const latest = completeEvents[completeEvents.length - 1];
      const secondLatest = completeEvents[completeEvents.length - 2];
      const diffTime = Math.abs(parseDateString(latest.date) - parseDateString(secondLatest.date));
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return {
        mtbm: diffDays,
        count: completeEvents.length,
        latestDate: latest.date,
        secondLatestDate: secondLatest.date
      };
    } else if (completeEvents.length === 1) {
      return {
        mtbm: null,
        count: 1,
        latestDate: completeEvents[0].date,
        reason: 'Only 1 complete maintenance event found (needs at least 2)'
      };
    } else {
      return {
        mtbm: null,
        count: 0,
        reason: 'No complete maintenance events found matching keywords'
      };
    }
  };

  const handleCalculateMTBM = () => {
    setError('');
    setSuccessMsg('');
    try {
      const events = extractEvents(input);
      if (events.length === 0) {
        setError('No maintenance dates with format "dd/mm/yyyy =" found to calculate MTBM.');
        setCalculatedMTBM(null);
        setMtbmInfo(null);
        return;
      }

      const res = calculateMTBMLogic(events);
      if (res.mtbm !== null) {
        setCalculatedMTBM(res.mtbm);
        setMtbmInfo(`Calculated: ${formatMTBM(res.mtbm)} (between ${res.secondLatestDate} and ${res.latestDate} across ${res.count} complete maintenance records)`);
        setSuccessMsg(`MTBM calculated: ${res.mtbm} days`);
      } else {
        setCalculatedMTBM(null);
        setMtbmInfo(`MTBM: N/A (${res.reason})`);
      }
    } catch (err) {
      setError('Error calculating MTBM: ' + err.message);
    }
  };

  const addRecord = () => {
    try {
      setError('');
      setSuccessMsg('');

      if (!input.trim() && !motorDetails.trim()) {
        setError('Please enter both motor details and maintenance notes to parse.');
        return;
      }

      let csvField = "''";
      const text = input.trim();
      let jsonArray = [];

      if (text) {
        jsonArray = extractEvents(text);
        if (jsonArray.length === 0) {
          setError('No valid dates found in format "dd/mm/yyyy =". Make sure dates are followed by an equals sign.');
          return;
        }

        const jsonString = JSON.stringify(jsonArray);
        csvField = `"${jsonString.replace(/"/g, '""')}"`;
      }

      let cleanDetails = motorDetails.trim();
      if (cleanDetails.includes('\t')) {
        cleanDetails = cleanDetails.replace(/\t/g, ',');
      }

      if (!cleanDetails) {
        cleanDetails = ",,,,,,,,,,,,,";
      }

      const detailsArr = cleanDetails.split(',');
      const serialNumber = detailsArr[0]?.trim() || 'Unknown';
      const type = detailsArr[1]?.trim() || 'Unknown';

      // Auto-compute MTBM if not manually clicked
      let mtbmValue = calculatedMTBM;
      if (mtbmValue === null && jsonArray.length > 0) {
        const calc = calculateMTBMLogic(jsonArray);
        if (calc.mtbm !== null) {
          mtbmValue = calc.mtbm;
        }
      }

      const rowString = `${cleanDetails},${csvField},${mtbmValue !== null ? mtbmValue : ''},${dateAssigned || ''},${dateRemoved || ''},${tonNumber || ''},Spare`;

      const newRecord = {
        id: Date.now(),
        serialNumber,
        type,
        tonNumber: tonNumber.trim(),
        dateAssigned: dateAssigned || null,
        dateRemoved: dateRemoved || null,
        meanTimeBetweenMaintenance: mtbmValue,
        historyCount: jsonArray.length,
        rowString,
        details: cleanDetails,
        historyRawArray: jsonArray
      };

      setRecords([...records, newRecord]);
      setSuccessMsg(`Record for ${serialNumber} added successfully.`);

      // Clear inputs for next record
      setInput('');
      setMotorDetails('');
      setDateAssigned('');
      setDateRemoved('');
      setTonNumber('');
      setCalculatedMTBM(null);
      setMtbmInfo(null);
    } catch (err) {
      setError('An error occurred while parsing the data: ' + err.message);
    }
  };

  const recalculateRecordMTBM = (recordId) => {
    setRecords(records.map(rec => {
      if (rec.id === recordId) {
        const calc = calculateMTBMLogic(rec.historyRawArray || []);
        return {
          ...rec,
          meanTimeBetweenMaintenance: calc.mtbm
        };
      }
      return rec;
    }));
  };

  const updateRecordDate = (recordId, field, value) => {
    setRecords(records.map(rec => {
      if (rec.id === recordId) {
        return {
          ...rec,
          [field]: value || null
        };
      }
      return rec;
    }));
  };

  const downloadAllCSV = () => {
    if (records.length === 0) return;

    const headerRow = "serialNumber,type,power,current,speed,IM,frameSize,manufacturer,bearingNDE,bearingDE,lastMaintenanceDate,Warehouse,SAP,Note,meanTimeBetweenMaintenance,dateAssigned,dateRemoved,ton,maintenanceHistory,status";
    
    const csvRows = records.map(r => {
      const detailsArr = (r.details || '').split(',');
      const jsonString = JSON.stringify(r.historyRawArray || []);
      const csvField = `"${jsonString.replace(/"/g, '""')}"`;
      
      const rowValues = [
        ...detailsArr.slice(0, 14),
        r.meanTimeBetweenMaintenance !== null && r.meanTimeBetweenMaintenance !== undefined ? r.meanTimeBetweenMaintenance : '',
        r.dateAssigned || '',
        r.dateRemoved || '',
        r.tonNumber || '',
        csvField,
        'Spare'
      ];
      return rowValues.join(',');
    });

    const csvContent = [headerRow, ...csvRows].join('\n');

    const blob = new Blob(['\uFEFF', csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `session_records_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const seedDatabase = async () => {
    if (records.length === 0) return;

    if (!window.confirm(`Are you sure you want to seed ${records.length} records to the database?`)) {
      return;
    }

    try {
      let successCount = 0;
      let failCount = 0;
      let failedSerials = [];

      for (const rec of records) {
        const detailsStr = rec.details || "";
        const detailsArr = detailsStr.split(',');

        const reqBody = {
          serialNumber: detailsArr[0]?.trim(),
          type: detailsArr[1]?.trim() || ' ',
          power: detailsArr[2]?.trim() || ' ',
          current: detailsArr[3]?.trim() || ' ',
          speed: detailsArr[4]?.trim() ? Number(detailsArr[4].trim()) : undefined,
          IM: detailsArr[5]?.trim() || ' ',
          frameSize: detailsArr[6]?.trim() || ' ',
          manufacturer: detailsArr[7]?.trim() || '',
          bearingNDE: detailsArr[8]?.trim() || ' ',
          bearingDE: detailsArr[9]?.trim() || ' ',
          lastMaintenanceDate: parseDateString(detailsArr[10]?.trim()),
          Warehouse: detailsArr[11]?.trim() || '',
          SAP: detailsArr[12]?.trim() || ' ',
          Note: detailsArr[13]?.trim() || ' ',
          meanTimeBetweenMaintenance: rec.meanTimeBetweenMaintenance,
          maintenanceHistory: rec.historyRawArray ? rec.historyRawArray.map(event => ({
            date: parseDateString(event.date),
            description: event.description
          })) : [],
          status: 'spare'
        };

        try {
          const res = await api.post('/motors', reqBody);
          const createdMotor = res.data.data;

          // If dateAssigned / dateRemoved or TON is specified, update motor's assignment
          if (createdMotor && (rec.dateAssigned || rec.dateRemoved || rec.tonNumber)) {
            try {
              await api.put(`/motors/${createdMotor._id}`, {
                dateAssigned: rec.dateAssigned,
                dateRemoved: rec.dateRemoved,
                tonNumber: rec.tonNumber
              });
            } catch (assignErr) {
              console.warn('Assignment update warning:', assignErr.message);
            }
          }

          successCount++;
        } catch (err) {
          console.error("Failed to seed motor", detailsArr[0], err);
          failCount++;
          if (detailsArr[0]) failedSerials.push(detailsArr[0].trim());
        }
      }

      let extraMessage = failedSerials.length > 0 ? `\nFailed Serials: ${failedSerials.join(', ')}` : '';
      alert(`Seeding complete.\nSuccessfully added: ${successCount}\nFailed: ${failCount}${extraMessage}`);
    } catch (err) {
      console.error(err);
      alert('An unexpected error occurred while seeding the database.');
    }
  };

  const removeRecord = (id) => {
    setRecords(records.filter(r => r.id !== id));
  };

  const clearSession = () => {
    if (window.confirm('Are you sure you want to clear all records in this session?')) {
      setRecords([]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>

      <div className="relative z-10 p-6 max-w-6xl mx-auto pt-12 pb-24">
        {/* Header */}
        <div className="text-center mb-10 pb-6 border-b border-white/10">
          <div className="inline-flex items-center justify-center p-4 bg-purple-500/20 rounded-2xl mb-4 shadow-[0_0_30px_rgba(168,85,247,0.3)] border border-purple-500/30">
            <Terminal className="w-10 h-10 text-purple-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-300 to-purple-400 mb-4 tracking-tight">
            Dev Data Parser & MTBM Session
          </h1>
          <p className="text-lg text-purple-200/80 max-w-2xl mx-auto">
            Process motor records with editable assignment dates (dateAssigned, dateRemoved) and auto-calculate MTBM with standard complete maintenance logic.
          </p>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start space-x-3 backdrop-blur-sm animate-in slide-in-from-top-2 duration-300 max-w-4xl mx-auto">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-red-300 font-semibold mb-1">Error</h3>
              <p className="text-red-200/80 text-sm">{error}</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mb-8 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start space-x-3 backdrop-blur-sm animate-in slide-in-from-top-2 duration-300 max-w-4xl mx-auto">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-emerald-300 font-semibold mb-1">Success</h3>
              <p className="text-emerald-200/80 text-sm">{successMsg}</p>
            </div>
          </div>
        )}

        <div className="space-y-8">
          {/* Input Section */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500"></div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 z-10">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center space-x-2 mb-3 text-purple-300">
                    <FileText className="w-6 h-6" />
                    <h2 className="text-2xl font-bold tracking-wide">Motor CSV Details</h2>
                  </div>
                  <textarea
                    className="w-full min-h-[150px] p-4 bg-slate-900/50 border border-purple-500/20 rounded-xl text-purple-100 placeholder-purple-300/30 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300 resize-y"
                    value={motorDetails}
                    onChange={(e) => setMotorDetails(e.target.value)}
                    placeholder="Paste directly from Excel row, or comma-separated: serialNumber,type,power,current,speed,IM,frameSize,manufacturer,bearingNDE,bearingDE,lastMaintenanceDate,Warehouse,SAP,Note"
                  />
                  <p className="text-xs text-purple-200/50 mt-2 ml-1">Provide the 14 values (comma or tab separated).</p>
                </div>

                {/* Dev Controls for dateAssigned, dateRemoved, and TON */}
                <div className="p-4 bg-purple-950/40 border border-purple-500/30 rounded-xl space-y-3">
                  <div className="flex items-center space-x-2 text-purple-300 font-semibold text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>Assignment Dates & Equipment (Dev Options)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-purple-200/70 font-medium block mb-1">Date Assigned</label>
                      <DatePicker
                        value={dateAssigned}
                        onChange={(e) => setDateAssigned(e.target.value)}
                        className="w-full bg-slate-900/70 border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-400"
                        placeholder="YYYY-MM-DD"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-purple-200/70 font-medium block mb-1">Date Removed</label>
                      <DatePicker
                        value={dateRemoved}
                        onChange={(e) => setDateRemoved(e.target.value)}
                        className="w-full bg-slate-900/70 border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-400"
                        placeholder="YYYY-MM-DD (blank if active)"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-purple-200/70 font-medium block mb-1">Equipment TON (Optional)</label>
                      <input
                        type="text"
                        value={tonNumber}
                        onChange={(e) => setTonNumber(e.target.value)}
                        placeholder="e.g., 301-M-01"
                        className="w-full bg-slate-900/70 border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-purple-100 placeholder-purple-400/40 focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2 text-purple-300">
                      <FileText className="w-6 h-6" />
                      <h2 className="text-2xl font-bold tracking-wide">Maintenance Notes</h2>
                    </div>

                    {/* Calculate MTBM Button */}
                    <button
                      type="button"
                      onClick={handleCalculateMTBM}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-xs font-semibold shadow-md hover:shadow-cyan-500/20 transition-all flex items-center space-x-1.5"
                      title="Calculate MTBM from complete maintenance events"
                    >
                      <Calculator className="w-3.5 h-3.5" />
                      <span>Calculate MTBM</span>
                    </button>
                  </div>

                  <textarea
                    className="w-full min-h-[150px] p-4 bg-slate-900/50 border border-purple-500/20 rounded-xl text-purple-100 placeholder-purple-300/30 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300 resize-y"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Expected format:\n01/01/2024 = Complete Maintenance: bearing overhaul\n01/01/2025 = Motor Complete Maint`}
                  />
                </div>

                {/* MTBM Calculation Preview */}
                <div className="p-4 bg-slate-900/70 border border-cyan-500/30 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-cyan-300 font-semibold uppercase tracking-wider block">MTBM Calculation Status</span>
                    <span className="text-sm font-medium text-cyan-100">
                      {mtbmInfo || (calculatedMTBM !== null ? formatMTBM(calculatedMTBM) : 'Not calculated yet. Click "Calculate MTBM" or add record.')}
                    </span>
                  </div>
                  {calculatedMTBM !== null && (
                    <span className="px-3 py-1 bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 rounded-full font-bold text-sm">
                      {calculatedMTBM} Days
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center z-10">
              <button
                onClick={addRecord}
                className="group relative overflow-hidden px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-white shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:shadow-[0_0_50px_rgba(168,85,247,0.5)] transition-all duration-300 hover:-translate-y-1 flex items-center space-x-2 w-full sm:w-auto justify-center"
              >
                <ListPlus className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                <span className="text-lg">Add Record to Session</span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
              </button>
            </div>
          </div>

          {/* Session Table Section */}
          {records.length > 0 && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="absolute top-0 left-0 w-48 h-48 bg-pink-500/10 rounded-br-full -z-10"></div>

              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 z-10 relative space-y-4 md:space-y-0">
                <div className="flex items-center space-x-3 text-pink-300">
                  <TableIcon className="w-7 h-7" />
                  <h2 className="text-3xl font-bold tracking-wide">Session Records ({records.length})</h2>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={clearSession}
                    className="p-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl text-red-300 transition-colors duration-200 flex items-center justify-center"
                    title="Clear All Session Records"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={downloadAllCSV}
                    className="group px-6 py-3 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 rounded-xl font-bold text-pink-100 shadow-lg transition-all duration-300 flex items-center space-x-2 backdrop-blur-sm"
                  >
                    <Download className="w-5 h-5 text-pink-300 group-hover:animate-bounce" />
                    <span>Download All Data</span>
                  </button>
                  <button
                    onClick={seedDatabase}
                    className="group px-6 py-3 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 rounded-xl font-bold text-indigo-100 shadow-lg transition-all duration-300 flex items-center space-x-2 backdrop-blur-sm"
                  >
                    <Database className="w-5 h-5 text-indigo-300 group-hover:scale-110" />
                    <span>Seed to DB</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-900/50 z-10 relative shadow-inner">
                <table className="w-full text-left text-sm text-purple-100">
                  <thead className="bg-white/10 text-purple-300 font-semibold border-b border-white/10 uppercase tracking-wider text-xs">
                    <tr>
                      <th className="px-4 py-4 whitespace-nowrap">#</th>
                      <th className="px-4 py-4 whitespace-nowrap">Serial Number</th>
                      <th className="px-4 py-4 whitespace-nowrap">Type / TON</th>
                      <th className="px-4 py-4 whitespace-nowrap">Date Assigned</th>
                      <th className="px-4 py-4 whitespace-nowrap">Date Removed</th>
                      <th className="px-4 py-4 whitespace-nowrap">MTBM</th>
                      <th className="px-4 py-4 whitespace-nowrap">History Events</th>
                      <th className="px-4 py-4 whitespace-nowrap text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {records.map((rec, idx) => (
                      <tr key={rec.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-4 py-4 font-mono text-purple-400">{idx + 1}</td>
                        <td className="px-4 py-4 font-medium font-mono">{rec.serialNumber}</td>
                        <td className="px-4 py-4">
                          <div>{rec.type}</div>
                          {rec.tonNumber && (
                            <span className="text-xs text-purple-300 font-mono">TON: {rec.tonNumber}</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <input
                            type="date"
                            value={rec.dateAssigned ? String(rec.dateAssigned).split('T')[0] : ''}
                            onChange={(e) => updateRecordDate(rec.id, 'dateAssigned', e.target.value)}
                            className="bg-slate-900/80 border border-purple-500/20 rounded px-2 py-1 text-xs text-purple-200 focus:outline-none focus:ring-1 focus:ring-purple-400"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <input
                            type="date"
                            value={rec.dateRemoved ? String(rec.dateRemoved).split('T')[0] : ''}
                            onChange={(e) => updateRecordDate(rec.id, 'dateRemoved', e.target.value)}
                            className="bg-slate-900/80 border border-purple-500/20 rounded px-2 py-1 text-xs text-purple-200 focus:outline-none focus:ring-1 focus:ring-purple-400"
                            placeholder="Active"
                          />
                        </td>
                        <td className="px-4 py-4">
                          {rec.meanTimeBetweenMaintenance !== null && rec.meanTimeBetweenMaintenance !== undefined ? (
                            <span className="px-2.5 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-xs font-semibold border border-cyan-500/30 whitespace-nowrap">
                              {formatMTBM(rec.meanTimeBetweenMaintenance)}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs border border-purple-500/30 font-medium">
                            {rec.historyCount} events
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => recalculateRecordMTBM(rec.id)}
                              className="p-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg text-xs transition-colors"
                              title="Recalculate MTBM for this record"
                            >
                              <Calculator className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => removeRecord(rec.id)}
                              className="text-red-400/50 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition-all duration-200"
                              title="Remove Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DevParserPage;
