// client/src/components/standards/MotorDimensionTable.js
import React from 'react';
import { ShieldCheck, Info, Gauge, Cpu } from 'lucide-react';

const MotorDimensionTable = ({ mounting, frameData, poleCount }) => {
  if (!frameData) return null;

  const is2P = poleCount === 2;
  const shaft = is2P ? frameData.shaft["2P"] : frameData.shaft["4-8P"];
  const b3 = frameData.b3;
  const b5 = frameData.b5;
  const activePower = frameData.powerKw[poleCount] || "Special order / On request";
  const frameNum = parseInt(frameData.frame, 10);
  const isHighSpeedJournal = is2P && frameNum >= 225;

  return (
    <div className="space-y-4">
      {/* 50 Hz Rating Banner Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-gradient-to-r from-slate-900/90 to-blue-950/80 p-4 rounded-2xl border border-white/10 shadow-lg text-white">
        <div className="p-3 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center space-x-1.5 text-xs text-blue-200 font-semibold uppercase tracking-wider mb-1">
            <Gauge className="w-3.5 h-3.5 text-emerald-400" />
            <span>Rated 50 Hz kW</span>
          </div>
          <span className="text-xl font-black text-emerald-400">{activePower} <span className="text-sm font-medium text-slate-300">kW</span></span>
        </div>

        <div className="p-3 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center space-x-1.5 text-xs text-blue-200 font-semibold uppercase tracking-wider mb-1">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sync Speed</span>
          </div>
          <span className="text-xl font-black text-cyan-300">
            {120 * 50 / poleCount} <span className="text-sm font-medium text-slate-300">rpm</span>
          </span>
        </div>

        <div className="p-3 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center space-x-1.5 text-xs text-blue-200 font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Standard Series</span>
          </div>
          <span className="text-sm font-bold text-white block mt-0.5">{frameData.series}</span>
        </div>

        <div className="p-3 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center space-x-1.5 text-xs text-blue-200 font-semibold uppercase tracking-wider mb-1">
            <Info className="w-3.5 h-3.5 text-amber-400" />
            <span>Shaft Class</span>
          </div>
          <span className={`text-xs font-bold px-2 py-1 rounded inline-block mt-0.5 ${isHighSpeedJournal ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'}`}>
            {isHighSpeedJournal ? '2P Reduced Journal' : 'Standard 4-8P Journal'}
          </span>
        </div>
      </div>

      {/* Main Dimension Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-md">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-white text-xs uppercase font-mono tracking-wider">
            <tr>
              <th className="py-3.5 px-4 font-semibold">Parameter</th>
              <th className="py-3.5 px-3 text-center font-semibold">Symbol</th>
              <th className="py-3.5 px-4 text-center font-semibold">Dimension</th>
              <th className="py-3.5 px-4 text-center font-semibold">ISO Fit / Tol.</th>
              <th className="py-3.5 px-4 font-semibold">Engineering Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {mounting === 'B3' ? (
              <>
                {/* B3 FOOT DIMENSIONS */}
                <tr className="bg-blue-50/70 font-semibold">
                  <td className="py-3 px-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    Shaft Centerline Height
                  </td>
                  <td className="py-3 px-3 text-center text-blue-900 font-bold font-mono">H</td>
                  <td className="py-3 px-4 text-center text-base font-extrabold text-blue-950">{b3.H} mm</td>
                  <td className="py-3 px-4 text-center font-mono text-xs font-semibold text-slate-700 bg-slate-100 rounded">
                    {b3.H_tol} mm
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600">
                    Baseplate mounting plane to shaft centerline (Standard frame size definition)
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-4">Transverse Foot Hole Distance</td>
                  <td className="py-2.5 px-3 text-center text-blue-900 font-bold font-mono">A</td>
                  <td className="py-2.5 px-4 text-center font-bold text-slate-900">{b3.A} mm</td>
                  <td className="py-2.5 px-4 text-center text-xs font-mono text-slate-600">±1.0 mm</td>
                  <td className="py-2.5 px-4 text-xs text-slate-600">Distance between foot bolt hole centers across width</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-4">Axial Foot Hole Distance</td>
                  <td className="py-2.5 px-3 text-center text-blue-900 font-bold font-mono">B</td>
                  <td className="py-2.5 px-4 text-center font-bold text-slate-900">{b3.B} mm</td>
                  <td className="py-2.5 px-4 text-center text-xs font-mono text-slate-600">±1.0 mm</td>
                  <td className="py-2.5 px-4 text-xs text-slate-600">Distance between foot bolt hole centers along motor length</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-4">Front Foot to Shaft Shoulder</td>
                  <td className="py-2.5 px-3 text-center text-blue-900 font-bold font-mono">C</td>
                  <td className="py-2.5 px-4 text-center font-bold text-slate-900">{b3.C} mm</td>
                  <td className="py-2.5 px-4 text-center text-xs font-mono text-slate-600">±1.5 mm</td>
                  <td className="py-2.5 px-4 text-xs text-slate-600">Axial position of DE shaft shoulder relative to front feet centers</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-4">Foot Anchor Bolt Hole Diameter</td>
                  <td className="py-2.5 px-3 text-center text-blue-900 font-bold font-mono">K</td>
                  <td className="py-2.5 px-4 text-center font-bold text-slate-900">Ø {b3.K} mm</td>
                  <td className="py-2.5 px-4 text-center text-xs font-mono text-slate-600">Clearance</td>
                  <td className="py-2.5 px-4 text-xs text-slate-600">Recommended foundation bolt size: <span className="font-bold text-slate-800">{b3.bolt}</span></td>
                </tr>
              </>
            ) : (
              <>
                {/* B5 FLANGE DIMENSIONS */}
                <tr className="bg-blue-50/70 font-semibold">
                  <td className="py-3 px-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    Flange Pitch Circle Diameter (PCD)
                  </td>
                  <td className="py-3 px-3 text-center text-blue-900 font-bold font-mono">M</td>
                  <td className="py-3 px-4 text-center text-base font-extrabold text-blue-950">Ø {b5.M} mm</td>
                  <td className="py-3 px-4 text-center text-xs font-mono text-slate-600">±0.4 mm</td>
                  <td className="py-3 px-4 text-xs text-slate-600">Flange Standard Designation: <strong className="text-blue-900">{b5.flangeNo}</strong></td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-4">Flange Spigot Centering Register</td>
                  <td className="py-2.5 px-3 text-center text-blue-900 font-bold font-mono">N</td>
                  <td className="py-2.5 px-4 text-center font-bold text-slate-900">Ø {b5.N} mm</td>
                  <td className="py-2.5 px-4 text-center font-mono text-xs font-bold text-indigo-700 bg-indigo-50 rounded">
                    {b5.N_tol}
                  </td>
                  <td className="py-2.5 px-4 text-xs text-slate-600">High-precision centering spigot register fit (ISO fit {b5.N_tol})</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-4">Flange Outer Diameter</td>
                  <td className="py-2.5 px-3 text-center text-blue-900 font-bold font-mono">P</td>
                  <td className="py-2.5 px-4 text-center font-bold text-slate-900">Ø {b5.P} mm</td>
                  <td className="py-2.5 px-4 text-center text-xs font-mono text-slate-600">Nominal</td>
                  <td className="py-2.5 px-4 text-xs text-slate-600">Total outer envelope clearance diameter of the flange ring</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-4">Flange Bolt Hole Diameter</td>
                  <td className="py-2.5 px-3 text-center text-blue-900 font-bold font-mono">S</td>
                  <td className="py-2.5 px-4 text-center font-bold text-slate-900">Ø {b5.S} mm</td>
                  <td className="py-2.5 px-4 text-center text-xs font-mono text-slate-600">Clearance</td>
                  <td className="py-2.5 px-4 text-xs text-slate-600">Clearance through-holes for driven machine flange bolts</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-4">Flange Spigot Step & Flange Thickness</td>
                  <td className="py-2.5 px-3 text-center text-blue-900 font-bold font-mono">T / LA</td>
                  <td className="py-2.5 px-4 text-center font-bold text-slate-900">{b5.T} / {b5.LA} mm</td>
                  <td className="py-2.5 px-4 text-center text-xs font-mono text-slate-600">±0.5 mm</td>
                  <td className="py-2.5 px-4 text-xs text-slate-600">Spigot step projection (T = {b5.T} mm) & flange plate thickness (LA = {b5.LA} mm)</td>
                </tr>
              </>
            )}

            {/* COMMON DRIVE END SHAFT & KEYWAY */}
            <tr className="bg-slate-100/90 font-bold text-slate-800 border-t-2 border-slate-300">
              <td colSpan="5" className="py-2.5 px-4 uppercase text-xs tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded bg-amber-500"></span>
                Drive End (DE) Shaft & Keyway Standard Geometry (IEC 60072-1 / DIN 6885-1)
              </td>
            </tr>
            <tr className="hover:bg-slate-50 transition-colors">
              <td className="py-2.5 px-4">Drive Shaft Extension Diameter</td>
              <td className="py-2.5 px-3 text-center text-blue-900 font-bold font-mono">D</td>
              <td className="py-2.5 px-4 text-center text-base font-extrabold text-blue-950">Ø {shaft.D} mm</td>
              <td className="py-2.5 px-4 text-center font-mono text-xs font-bold text-indigo-700 bg-indigo-50 rounded">
                {shaft.D_tol}
              </td>
              <td className="py-2.5 px-4 text-xs text-slate-600">
                Coupling / pulley cylindrical journal seat ({is2P ? '2-Pole Speed Class' : '4-8 Pole Standard'})
              </td>
            </tr>
            <tr className="hover:bg-slate-50 transition-colors">
              <td className="py-2.5 px-4">Drive Shaft Extension Length</td>
              <td className="py-2.5 px-3 text-center text-blue-900 font-bold font-mono">E</td>
              <td className="py-2.5 px-4 text-center font-bold text-slate-900">{shaft.E} mm</td>
              <td className="py-2.5 px-4 text-center text-xs font-mono text-slate-600">+0.0 / -0.5 mm</td>
              <td className="py-2.5 px-4 text-xs text-slate-600">Axial extension length from shaft shoulder to shaft end face</td>
            </tr>
            <tr className="hover:bg-slate-50 transition-colors">
              <td className="py-2.5 px-4">Keyway & Key Dimensions</td>
              <td className="py-2.5 px-3 text-center text-blue-900 font-bold font-mono">F × GA</td>
              <td className="py-2.5 px-4 text-center font-bold text-slate-900">{shaft.F} × {shaft.GA} mm</td>
              <td className="py-2.5 px-4 text-center text-xs font-mono text-slate-600">DIN 6885-1</td>
              <td className="py-2.5 px-4 text-xs text-slate-600">
                Parallel feather key width (<strong className="text-slate-800">F = {shaft.F} mm</strong>) × shaft bottom to key top height (<strong className="text-slate-800">GA = {shaft.GA} mm</strong>)
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MotorDimensionTable;
