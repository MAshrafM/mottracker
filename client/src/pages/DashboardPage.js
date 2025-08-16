// client/src/pages/DashboardPage.js
import React, { useContext } from 'react';
import AuthContext from '../context/AuthContext';

const DashboardPage = () => {
  const { user } = useContext(AuthContext);

  return(
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Background Pattern */}
      <div className="absolute inset-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      <div className="relative z-10 p-6 max-w-4xl mx-auto pt-12">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 shadow-2xl">
          <h2 className="text-4xl font-bold text-white mb-6 text-center">Dashboard</h2>
          
          <div className="space-y-4">
            <p className="text-xl text-blue-100 text-center">
              Welcome to the Motor Maintenance Tracker, <span className="text-blue-300 font-semibold">{user?.username}</span>!
            </p>
            
            <p className="text-lg text-blue-200 text-center">
              Your role is: <strong className="text-white capitalize px-3 py-1 bg-blue-500/20 rounded-lg border border-blue-500/30">{user?.role}</strong>
            </p>
            
            {/* Future content placeholder */}
            <div className="mt-8 pt-6 border-t border-white/20">
              <p className="text-blue-300 text-center italic opacity-70">
                {/* We will add motor and equipment summaries here later */}
                Motor and equipment summaries will be added here later
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
