import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FileDown, FileSpreadsheet, Loader } from 'lucide-react';

const BearingReport = () => {
  const [bearingData, setBearingData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBearingData = async () => {
      setLoading(true);
      try {
        const response = await api.get('/reports/bearings');
        setBearingData(response.data.data);
      } catch (error) {
        console.error('Error fetching bearing data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBearingData();
  
  }, []);

  const totalBearings = bearingData.reduce((acc, item) => acc + item.count, 0);


  const exportToExcel = async () => {
    
    try {
    // Trigger Excel export on server
    const response = await api.get('/reports/bearings/export-excel', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'bearings.xlsx');
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
    const response = await api.get('/reports/bearings/export-pdf', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'bearings.pdf');
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
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-4">Bearing Report</h1>
        {loading ? (
          <div className="flex items-center space-x-3">
            <Loader className="w-6 h-6 text-blue-400 animate-spin" />
            <p className="text-gray-600 text-lg">Loading Bearings...</p>
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
              <p>Total Bearing Types: <span className="text-amber-400">{bearingData.length}</span></p>
                <p>Total Count: <span className="text-amber-400">{totalBearings}</span></p>
            </div>
          </div>
          </div>
        )
        }
      </div>
      </div>

      {bearingData.length > 0 && (
        <>
          <div class="hidden lg:block m-4 glass-effect rounded-lg shadow-2xl overflow-x-auto">
            <div class="overflow-x-auto"></div>
              <table className="min-w-full divide-y divide-slate-700">
                <thead className="table-header">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Bearing</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {bearingData.map((bearing, index) => (
                    <tr key={bearing._id || index} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-200">{bearing._id}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-200">{bearing.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div class="lg:hidden space-y-4 m-4">
              {bearingData.map((bearing, index) => (
                <div key={bearing._id || index} class="motor-card rounded-lg p-4">
                  
                  <div class="space-y-3">
                    
                    <div class="flex">
                        <span class="field-label">Bearing: </span>
                        <span class="field-value ml-2">{bearing._id}</span>
                    </div>
                    <div class="flex">
                        <span class="field-label">Power: </span>
                        <span class="field-value ml-2">{bearing.count}</span>
                    </div>
                 </div>
                </div>
                ))}
              </div>       
        </>
      )}

      {bearingData.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
          No Bearings found in the system.
        </div>
      )}
    </div>
  );
};

export default BearingReport;