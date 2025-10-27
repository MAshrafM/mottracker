// client/src/pages/DashboardPage.js
import React, { useState, useEffect,useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { Loader } from 'lucide-react';
import api from '../services/api';
import { Zap, ArrowRight, AlertCircle, Activity, Power } from 'lucide-react';


const DashboardPage = () => {
  const { user } = useContext(AuthContext);
  const [totalMotors, setTotalMotors] = useState(0);
  const [activeMotors, setActiveMotors] = useState(0);
  const [spareMotors, setSpareMotors] = useState(0);
  const [oServiceMotors, setOServiceMotors] = useState(0);
  const [totalPower, setTotalPower] = useState(0);
  const [totalEq, setTotalEq] = useState(0);
  

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');


  useEffect(() => {
    fetchMotors();
    fetchEquipments();
  }, []);

  const fetchMotors = async () => {
    try {
      setError('');
      const response = await api.get('/motors');
      let motorData = response.data.data;
      let totalMotors = motorData.length;
      let activeMotors = motorData.filter(f => f.status === "active").length;
      let spareMotors = motorData.filter(f => f.status === "spare").length;
      let oServiceMotors = motorData.filter(f => f.status === "out of service").length;
      let totalPower = motorData.reduce((sum, i) => Number(i.power || 0) + sum, 0);
      setActiveMotors(activeMotors);
      setSpareMotors(spareMotors);
      setOServiceMotors(oServiceMotors);
      setTotalMotors(totalMotors);
      setTotalPower(totalPower);
    } catch (err) {
      setError('Failed to fetch motors.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEquipments = async () => {
      try {
        const response = await api.get('/equipment');
        let eqData = response.data.data;
        setTotalEq(eqData.length);
      } catch (err) {
        setError('Failed to fetch equipment.');
      } finally {
        setIsLoading(false);
      }
    };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-8 shadow-xl flex items-center space-x-3">
          <Loader className="w-6 h-6 text-blue-400 animate-spin" />
          <p className="text-white text-lg">Loading Motors...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="bg-red-500/20 backdrop-blur-lg rounded-xl border border-red-500/30 p-8 shadow-xl">
          <p className="text-red-300 text-lg">{error}</p>
        </div>
      </div>
    );
  }



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
                <div className="grid grid-cols-5 gap-3 mb-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">{totalEq}</div>
                    <div className="text-xs text-blue-200">All Equip.</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">{totalMotors}</div>
                    <div className="text-xs text-blue-200">Total Motors</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-400">{activeMotors}</div>
                    <div className="text-xs text-blue-200">On Service</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-red-400">{spareMotors}</div>
                    <div className="text-xs text-blue-200">Spare</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-red-400">{oServiceMotors}</div>
                    <div className="text-xs text-blue-200">Out of Service</div>
                  </div>
                </div>

                {/* Status Indicators */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-green-400" />
                      <span className="text-blue-200">System Efficiency</span>
                    </div>
                    <span className="text-white font-medium">{(activeMotors/(totalMotors || 1)*100).toFixed(2)}%</span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-2">
                    <div className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full" style={{ width: `${(activeMotors / (totalMotors || 1)) * 100}%` }}></div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="border-t border-white/10 pt-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span className="text-blue-200">{spareMotors} motors Spare</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm mt-2">
                    <Power className="w-4 h-4 text-amber-400" />
                    <span className="text-blue-200">Total power: {totalPower.toFixed(1)}KW</span>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex flex-col md:flex-row md:items-center gap-3 md:space-x-4 mt-4 pt-4 border-t border-white/10">
                  <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/30 rounded-lg px-4 py-2 text-center transition-all duration-300 hover:border-amber-400/50 w-full md:w-auto">
                    <Link to="/motors" className="text-amber-200 hover:text-white text-sm font-medium block">View All Motors</Link>
                  </div>
                  <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/30 rounded-lg px-4 py-2 text-center transition-all duration-300 hover:border-amber-400/50 w-full md:w-auto">
                    <Link to="/equipment" className="text-amber-200 hover:text-white text-sm font-medium block">View All Equipments</Link>
                  </div>
                  <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/30 rounded-lg px-4 py-2 text-center transition-all duration-300 hover:border-amber-400/50 w-full md:w-auto">
                    <Link to="/reports" className="text-amber-200 hover:text-white text-sm font-medium block">Reports</Link>
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
