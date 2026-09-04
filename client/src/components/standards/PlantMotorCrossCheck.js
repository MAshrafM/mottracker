// client/src/components/standards/PlantMotorCrossCheck.js
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataContext } from '../../context/DataContext';
import { Database, ArrowRight, ExternalLink } from 'lucide-react';

const PlantMotorCrossCheck = ({ currentFrame, mounting }) => {
  const navigate = useNavigate();
  const { motors, loading } = useDataContext();

  const matchingMotors = useMemo(() => {
    if (!motors || !currentFrame) return [];
    const normalizedFrame = currentFrame.toUpperCase().replace(/\s+/g, '');
    
    return motors.filter((m) => {
      if (!m.frameSize) return false;
      const mFrame = m.frameSize.toString().toUpperCase().replace(/\s+/g, '');
      // Match either exact (e.g. 280M) or prefix/suffix variations
      return mFrame === normalizedFrame || mFrame.includes(normalizedFrame) || normalizedFrame.includes(mFrame);
    });
  }, [motors, currentFrame]);

  const stats = useMemo(() => {
    const total = matchingMotors.length;
    const active = matchingMotors.filter((m) => m.status === 'active').length;
    const spare = matchingMotors.filter((m) => m.status === 'spare').length;
    const outOfService = matchingMotors.filter((m) => m.status === 'out of service').length;
    return { total, active, spare, outOfService };
  }, [matchingMotors]);

  const handleNavigateToMotors = () => {
    navigate(`/motors?frame=${encodeURIComponent(currentFrame)}&mounting=${encodeURIComponent(mounting)}`);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-blue-500/10 rounded-xl text-blue-600">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Plant Asset Cross-Check</h3>
            <p className="text-xs text-slate-500">Live query for Frame <span className="font-bold text-blue-600">{currentFrame}</span> in plant inventory</p>
          </div>
        </div>

        <button
          onClick={handleNavigateToMotors}
          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
        >
          <span>View in Inventory</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {loading ? (
        <div className="py-4 text-center text-xs text-slate-400">Scanning inventory assets...</div>
      ) : matchingMotors.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 text-center text-xs text-slate-500">
          No registered motors currently found in plant database matching frame size <strong className="text-slate-700">{currentFrame}</strong>.
        </div>
      ) : (
        <div className="space-y-3">
          {/* Quick Stats Badges */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Matches</span>
              <span className="text-base font-black text-slate-800">{stats.total}</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2">
              <span className="text-emerald-600 block text-[10px] uppercase font-semibold">Active In-Service</span>
              <span className="text-base font-black text-emerald-700">{stats.active}</span>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
              <span className="text-amber-600 block text-[10px] uppercase font-semibold">Spares Ready</span>
              <span className="text-base font-black text-amber-700">{stats.spare}</span>
            </div>
          </div>

          {/* Asset Preview List */}
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {matchingMotors.slice(0, 6).map((motor) => (
              <div
                key={motor._id}
                onClick={() => navigate(`/motors/${motor._id}/maintenance`)}
                className="group flex items-center justify-between p-2.5 bg-slate-50/80 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-300 rounded-xl cursor-pointer transition-all text-xs"
              >
                <div className="flex items-center space-x-2.5">
                  <span className={`w-2 h-2 rounded-full ${motor.status === 'active' ? 'bg-emerald-500' : motor.status === 'spare' ? 'bg-amber-500' : 'bg-red-500'}`} />
                  <div>
                    <span className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                      {motor.serialNumber || 'No Serial'}
                    </span>
                    <span className="text-slate-400 text-[11px] ml-2">
                      {motor.power ? `${motor.power} kW` : ''} {motor.speed ? `• ${motor.speed} rpm` : ''}
                    </span>
                    {motor.equipmentId?.name && (
                      <p className="text-[11px] text-slate-500 line-clamp-1">Eq: {motor.equipmentId.name}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                    {motor.IM || mounting}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </div>
            ))}
          </div>
          {matchingMotors.length > 6 && (
            <p className="text-[11px] text-center text-slate-400">
              + {matchingMotors.length - 6} more matching motors in database
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default PlantMotorCrossCheck;
