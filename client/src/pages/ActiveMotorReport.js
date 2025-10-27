import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FileDown, FileSpreadsheet, Loader } from 'lucide-react';

const ActiveMotorsReport = () => {
  const [activeMotors, setActiveMotors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchActiveMotors();
  }, []);


  const fetchActiveMotors = async () => {
    setLoading(true);
    try {
      // API call to fetch active motors with populated equipment data
      const response = await api.get('/reports/active-motors');
      setActiveMotors(response.data.data);
    } catch (error) {
      console.error('Error fetching active motors:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const exportToExcel = async () => {
    try {
    // Trigger Excel export on server
    const response = await api.get('/reports/active-motors/export-excel', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'active_motors.xlsx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
  }
  };

  const exportToPDF = async() => {
    try {
    // Trigger PDF export on server
    const response = await api.get('/reports/active-motors/export-pdf', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'active_motors.pdf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
  }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
        {/* Background Pattern */}
      <div className="absolute inset-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      <div className="relative z-10 p-6 max-w-4xl mx-auto pt-12">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 shadow-2xl">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-4">Active Motors Report</h1>
        {loading ? (
          <div className="flex items-center space-x-3">
            <Loader className="w-6 h-6 text-blue-400 animate-spin" />
            <p className="text-gray-600 text-lg">Loading Active Motors...</p>
          </div>
        ) : (
          <div className="flex-col sm:flex-row items-center justify-between gap-3 mb-4">
            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3 w-full sm:w-auto">
            <button
              onClick={exportToExcel}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors w-full sm:w-auto"
            >
              <FileSpreadsheet size={18} />
              Export to Excel
            </button>
            
            <button
              onClick={exportToPDF}
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors w-full sm:w-auto"
            >
              <FileDown size={18} />
              Export to PDF
            </button>
            
            <div className="text-white-600 font-medium py-2 text-center sm:text-left sm:ml-auto w-full sm:w-auto">
              Total Active Motors: <span className="text-amber-400">{activeMotors.length}</span>
            </div>
          </div>
          </div>
        )
        }
      </div>
      </div>

      {activeMotors.length > 0 && (
        <>
          <div class="hidden lg:block m-4 glass-effect rounded-lg shadow-2xl overflow-x-auto">
            <div class="overflow-x-auto"></div>
              <table className="min-w-full divide-y divide-slate-700">
                <thead className="table-header">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">TON Number</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Designation</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Serial Number</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Power</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Speed</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Current</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">IM</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Frame Size</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Bearing NDE</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Bearing DE</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Last Maintenance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {activeMotors.map((motor, index) => (
                    <tr key={motor._id || index} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-200">{motor.tonNumber}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-200">{motor.designation}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-200">{motor.serialNumber}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-200">{motor.power}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-200">{motor.speed}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-200">{motor.current}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-200">{motor.IM}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-200">{motor.frameSize}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-200">{motor.bearingNDE}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-200">{motor.bearingDE}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-200">{formatDate(motor.lastMaintenanceDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div class="lg:hidden space-y-4 m-4">
              {activeMotors.map((motor, index) => (
                <div key={motor._id || index} class="motor-card rounded-lg p-4">
                  <div class="flex justify-between items-center mb-3 pb-2 border-b border-slate-700">
                    <h3 class="text-lg font-bold text-white">{motor.tonNumber}</h3>
                  </div>
                  <div class="space-y-3">
                    <div class="flex">
                        <span class="field-label">Designation: </span>
                        <span class="field-value ml-2">{motor.designation}</span>
                    </div>
                    <div class="flex">
                        <span class="field-label">Serial Number: </span>
                        <span class="field-value ml-2">{motor.serialNumber}</span>
                    </div>
                    <div class="flex">
                        <span class="field-label">Power: </span>
                        <span class="field-value ml-2">{motor.power}</span>
                    </div>
                    <div class="flex">
                        <span class="field-label">Speed: </span>
                        <span class="field-value ml-2">{motor.speed}</span>
                    </div>
                    <div class="flex">
                        <span class="field-label">Current: </span>
                        <span class="field-value ml-2">{motor.current}</span> 
                    </div>
                    <div class="flex">
                        <span class="field-label">IM: </span>
                        <span class="field-value ml-2">{motor.IM}</span>  
                    </div>
                    <div class="flex">
                        <span class="field-label">Frame Size: </span>
                        <span class="field-value ml-2">{motor.frameSize}</span>  
                    </div>

                    <div class="flex">
                        <span class="field-label">Bearing NDE: </span>
                        <span class="field-value ml-2">{motor.bearingNDE}</span>  
                    </div>
                    <div class="flex">
                        <span class="field-label">Bearing DE: </span>
                        <span class="field-value ml-2">{motor.bearingDE}</span>  
                    </div>
                    <div class="flex">
                        <span class="field-label">Last Maintenance: </span>
                        <span class="field-value ml-2">{formatDate(motor.lastMaintenanceDate)}</span>  
                    </div>
                  </div>
                </div>
                ))}
              </div>       
        </>
      )}

      {activeMotors.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
          No active motors found in the system.
        </div>
      )}
    </div>
  );
};

export default ActiveMotorsReport;