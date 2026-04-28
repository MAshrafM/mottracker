import React, { useState } from 'react';
import { Terminal, Download, FileText, AlertCircle, ListPlus, Trash2, Table as TableIcon, Database } from 'lucide-react';
import api from '../services/api';

const DevParserPage = () => {
  const [input, setInput] = useState('');
  const [motorDetails, setMotorDetails] = useState('');
  const [records, setRecords] = useState([]);
  const [error, setError] = useState('');

  const addRecord = () => {
    try {
      setError('');
      
      if (!input.trim() && !motorDetails.trim()) {
        setError('Please enter both motor details and maintenance notes to parse.');
        return;
      }

      let csvField = "''";
      const text = input.trim();
      let jsonArray = [];
      
      if (text) {
        // Find all dates with format dd/mm/yyyy followed by =
        const datePattern = /(\d{1,2}\/\d{1,2}\/\d{4})\s*=\s*/g;
        const matches = [];
        let match;

        // Collect all date matches with their positions
        while ((match = datePattern.exec(text)) !== null) {
          matches.push({
            date: match[1],
            index: match.index,
            fullMatchLength: match[0].length
          });
        }

        if (matches.length === 0) {
          setError('No dates found in format "dd/mm/yyyy =". Make sure dates are followed by an equals sign.');
          return;
        }

        // Process each date and extract content until next date
        for (let i = 0; i < matches.length; i++) {
          const currentMatch = matches[i];
          const nextMatch = matches[i + 1];

          // Validate date
          const dateParts = currentMatch.date.split('/');
          const day = parseInt(dateParts[0], 10);
          const month = parseInt(dateParts[1], 10);
          const year = parseInt(dateParts[2], 10);

          if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) {
            setError(`Invalid date: ${currentMatch.date}`);
            return;
          }

          // Extract content from after "=" until next date (or end of text)
          const startPos = currentMatch.index + currentMatch.fullMatchLength;
          const endPos = nextMatch ? nextMatch.index : text.length;
          let rawContent = text.substring(startPos, endPos);

          // Clean up the content - split by lines and process
          let description = rawContent
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => {
              // Remove various bullet points and leading symbols
              return line.replace(/^[·•\-*\s]+/, '').trim();
            })
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

        if (jsonArray.length === 0) {
          setError('No valid content found after dates');
          return;
        }

        // Convert to JSON string and prepare for CSV
        const jsonString = JSON.stringify(jsonArray);

        // Escape double quotes for standard CSV parser so it stays in one single column
        // Standard CSV requires wrapping in "" and escaping internal " with ""
        csvField = `"${jsonString.replace(/"/g, '""')}"`;
      }

      let cleanDetails = motorDetails.trim();
      
      // If user pasted directly from Excel, it will be tab-separated. Convert tabs to commas.
      if (cleanDetails.includes('\t')) {
        cleanDetails = cleanDetails.replace(/\t/g, ',');
      }
      
      // Fallback if completely empty
      if (!cleanDetails) {
        cleanDetails = ",,,,,,,,,,,,,";
      }

      const detailsArr = cleanDetails.split(',');
      const serialNumber = detailsArr[0] || 'Unknown';
      const type = detailsArr[1] || 'Unknown';
      
      const rowString = `${cleanDetails},${csvField},Spare`;
      
      const newRecord = {
        id: Date.now(),
        serialNumber,
        type,
        historyCount: jsonArray.length,
        rowString,
        details: cleanDetails,
        historyRawArray: jsonArray
      };

      setRecords([...records, newRecord]);
      
      // Clear inputs for the next record
      setInput('');
      setMotorDetails('');
    } catch (err) {
      setError('An error occurred while parsing the data: ' + err.message);
    }
  };

  const downloadAllCSV = () => {
    if (records.length === 0) return;
    
    const headerRow = "serialNumber,type,power,current,speed,IM,frameSize,manufacturer,bearingNDE,bearingDE,lastMaintenanceDate,Warehouse,SAP,Note,maintenanceHistory,status";
    const csvContent = [headerRow, ...records.map(r => r.rowString)].join('\n');
    
    // Using '\uFEFF' (UTF-8 Byte Order Mark) ensures Excel accurately parses Arabic/UTF-8 characters
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
    
    if (!window.confirm('Are you sure you want to seed these records to the database?')) {
        return;
    }

    try {
        let successCount = 0;
        let failCount = 0;
        let failedSerials = [];

        const parseDateString = (dateStr) => {
            if (!dateStr || dateStr.trim() === '') return undefined;
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                return new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}T00:00:00Z`);
            }
            return new Date(dateStr);
        };

        // We will seed sequentially to easily track successes and handle bulk rejections (duplicates)
        for (const rec of records) {
            const detailsStr = rec.details || "";
            const detailsArr = detailsStr.split(',');
            
            const reqBody = {
               serialNumber: detailsArr[0]?.trim(),
               type: detailsArr[1]?.trim() || ' ',
               power: detailsArr[2]?.trim() || ' ',
               current: detailsArr[3]?.trim() || ' ',
               speed: detailsArr[4]?.trim() ? Number(detailsArr[4].trim()) : ' ',
               IM: detailsArr[5]?.trim() || ' ',
               frameSize: detailsArr[6]?.trim() || ' ',
               manufacturer: detailsArr[7]?.trim() || '',
               bearingNDE: detailsArr[8]?.trim() || ' ',
               bearingDE: detailsArr[9]?.trim() || ' ',
               lastMaintenanceDate: parseDateString(detailsArr[10]?.trim()),
               Warehouse: detailsArr[11]?.trim() || '',
               SAP: detailsArr[12]?.trim() || ' ',
               Note: detailsArr[13]?.trim() || ' ',
               maintenanceHistory: rec.historyRawArray ? rec.historyRawArray.map(event => ({
                   date: parseDateString(event.date),
                   description: event.description
               })) : [],
               status: 'spare'
            };

            try {
                await api.post('/motors', reqBody);
                successCount++;
            } catch (err) {
                console.error("Failed to seed motor", detailsArr[0], err);
                failCount++;
                if (detailsArr[0]) failedSerials.push(detailsArr[0].trim());
            }
        }
        
        let extraMessage = failedSerials.length > 0 ? `\nFailed Serials: ${failedSerials.join(', ')}` : '';
        alert(`Seeding complete.\nSuccessfully added: ${successCount}\nFailed (likely duplicates): ${failCount}${extraMessage}`);
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
            Dev Data Parser Session
          </h1>
          <p className="text-lg text-purple-200/80 max-w-2xl mx-auto">
            Process multiple motor records in bulk and download them all as a single CSV file.
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start space-x-3 backdrop-blur-sm animate-in slide-in-from-top-2 duration-300 max-w-4xl mx-auto">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-red-300 font-semibold mb-1">Parsing Error</h3>
              <p className="text-red-200/80 text-sm">{error}</p>
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
                    placeholder="Paste directly from Excel row, or use comma-separated: serialNumber,type,power,current,speed,IM,frameSize,manufacturer,bearingNDE,bearingDE,lastMaintenanceDate,Warehouse,SAP,Note"
                  />
                  <p className="text-xs text-purple-200/50 mt-2 ml-1">Provide the 14 values (comma or tab separated).</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center space-x-2 mb-3 text-purple-300">
                    <FileText className="w-6 h-6" />
                    <h2 className="text-2xl font-bold tracking-wide">Maintenance Notes</h2>
                  </div>
                  <textarea
                    className="w-full min-h-[150px] p-4 bg-slate-900/50 border border-purple-500/20 rounded-xl text-purple-100 placeholder-purple-300/30 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300 resize-y"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Expected format:\n01/01/2026 = Event description goes here\n05/02/2026 = Another event...`}
                  />
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
                
                <div className="flex space-x-3">
                  <button 
                    onClick={clearSession}
                    className="p-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl text-red-300 transition-colors duration-200 flex flex-col items-center justify-center"
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
                      <th className="px-6 py-4 whitespace-nowrap">#</th>
                      <th className="px-6 py-4 whitespace-nowrap">Serial Number</th>
                      <th className="px-6 py-4 whitespace-nowrap">Type</th>
                      <th className="px-6 py-4 whitespace-nowrap">History Events</th>
                      <th className="px-6 py-4 whitespace-nowrap text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {records.map((rec, idx) => (
                      <tr key={rec.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4 font-mono text-purple-400">{idx + 1}</td>
                        <td className="px-6 py-4 font-medium">{rec.serialNumber}</td>
                        <td className="px-6 py-4">{rec.type}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs border border-purple-500/30 font-medium">
                            {rec.historyCount} events
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => removeRecord(rec.id)}
                            className="text-red-400/50 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-all duration-200"
                            title="Remove Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
