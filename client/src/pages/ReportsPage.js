// client/src/pages/ReportPage.js
import React, { useState, useEffect,useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { Loader, Settings } from 'lucide-react';
import api from '../services/api';

const ReportsPage = () => {
  const { user } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
        {/* Background Pattern */}
      <div className="absolute inset-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      <div className="relative z-10 p-6 max-w-4xl mx-auto pt-12">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 shadow-2xl">
          <h2 className="text-4xl font-bold text-white mb-6 text-center">Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/reports/active-motors" className="group flex flex-col items-center p-6 text-center
                         bg-white/5 backdrop-blur-md rounded-xl 
                         border border-white/10 
                         shadow-lg transition-all duration-300 
                         hover:bg-white/20 hover:border-white/30 hover:shadow-xl">
            <Settings className="w-12 h-12 mb-4 text-white opacity-70 transition-opacity group-hover:opacity-100" />
            <h3 className="text-xl font-semibold mb-2 text-white">Active Motors Report</h3>
            <p className="text-sm text-slate-300">View and export a report of all active motors in service.</p>
            </Link>
          </div>
        </div>
        </div>
      </div>
  );
};

export default ReportsPage;