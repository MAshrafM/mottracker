// client/src/pages/DashboardPage.js
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { Zap, ArrowRight, Gauge, Settings, AlertCircle, Activity, Power } from 'lucide-react';


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
              <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-amber-500/20 rounded-lg group-hover:bg-amber-500/30 transition-colors duration-300">
                      <Zap className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white group-hover:text-amber-200 transition-colors duration-300">
                        Motors
                      </h3>
                      <p className="text-sm text-blue-200">Electrical Motors</p>
                    </div>
                  </div>
                  <Link to="/motors"><ArrowRight className="w-5 h-5 text-blue-300 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" /></Link>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">47</div>
                    <div className="text-xs text-blue-200">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-400">41</div>
                    <div className="text-xs text-blue-200">On Service</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-red-400">6</div>
                    <div className="text-xs text-blue-200">Spare</div>
                  </div>
                </div>

                {/* Status Indicators */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-green-400" />
                      <span className="text-blue-200">System Efficiency</span>
                    </div>
                    <span className="text-white font-medium">92%</span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-2">
                    <div className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full" style={{width: '92%'}}></div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="border-t border-white/10 pt-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span className="text-blue-200">6 motors Spare</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm mt-2">
                    <Power className="w-4 h-4 text-amber-400" />
                    <span className="text-blue-200">Avg power: 750W</span>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex items-center space-x-4 mt-4 pt-4 border-t border-white/10">
                  <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/30 rounded-lg px-4 py-2 text-center transition-all duration-300 group-hover:border-amber-400/50">
                    <Link to="/motors" className="text-amber-200 group-hover:text-white text-sm font-medium">View All Motors</Link>
                  </div>
                  <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/30 rounded-lg px-4 py-2 text-center transition-all duration-300 group-hover:border-amber-400/50">
                    <Link to="/equipment" className="text-amber-200 group-hover:text-white text-sm font-medium">View All Equipments</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
