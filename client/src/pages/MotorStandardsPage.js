// client/src/pages/MotorStandardsPage.js
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IEC_MOTOR_DATABASE,
  IEC_POLE_CONFIGS,
  getMotorByFrame,
  findFramesByPower
} from '../data/iecMotorMasterData';
import MotorSvgBlueprint from '../components/standards/MotorSvgBlueprint';
import MotorDimensionTable from '../components/standards/MotorDimensionTable';
import PlantMotorCrossCheck from '../components/standards/PlantMotorCrossCheck';
import {
  Layers,
  ArrowLeft,
  Copy,
  Check,
  Search,
  SlidersHorizontal,
  Printer,
  Info
} from 'lucide-react';

const MotorStandardsPage = () => {
  const navigate = useNavigate();
  const [mounting, setMounting] = useState('B3'); // 'B3' | 'B5'
  const [selectedFrame, setSelectedFrame] = useState('280M');
  const [selectedPole, setSelectedPole] = useState(4); // 2, 4, 6, 8
  const [searchPower, setSearchPower] = useState('');
  const [copied, setCopied] = useState(false);

  // Active motor dataset record
  const currentMotor = useMemo(() => {
    return getMotorByFrame(selectedFrame) || IEC_MOTOR_DATABASE[0];
  }, [selectedFrame]);

  // Suggested frames matching power search
  const powerMatches = useMemo(() => {
    if (!searchPower || isNaN(parseFloat(searchPower))) return [];
    return findFramesByPower(searchPower, selectedPole);
  }, [searchPower, selectedPole]);

  // Handle power input search
  const handlePowerSearchChange = (e) => {
    const val = e.target.value;
    setSearchPower(val);
    if (!val) return;

    const matched = IEC_MOTOR_DATABASE.find((m) => {
      const pStr = m.powerKw[selectedPole];
      return pStr && pStr.includes(val);
    });

    if (matched) {
      setSelectedFrame(matched.frame);
    }
  };

  // Copy specifications to clipboard
  const handleCopySpecs = () => {
    if (!currentMotor) return;
    const is2P = selectedPole === 2;
    const shaft = is2P ? currentMotor.shaft["2P"] : currentMotor.shaft["4-8P"];
    
    let text = `=== IEC MOTOR SPECIFICATION SHEET ===\n`;
    text += `Frame Size: ${currentMotor.frame}\n`;
    text += `Mounting: IM ${mounting} (${mounting === 'B3' ? 'Foot Mounted' : 'Flange Mounted'})\n`;
    text += `Poles / Speed: ${selectedPole}P (${120 * 50 / selectedPole} rpm @ 50 Hz)\n`;
    text += `Rated Power: ${currentMotor.powerKw[selectedPole] || 'N/A'} kW\n`;
    text += `Series: ${currentMotor.series}\n\n`;

    if (mounting === 'B3') {
      text += `[IM B3 FOOT DIMENSIONS]\n`;
      text += `Shaft Height (H): ${currentMotor.b3.H} mm (Tol: ${currentMotor.b3.H_tol} mm)\n`;
      text += `Transverse Hole Spacing (A): ${currentMotor.b3.A} mm\n`;
      text += `Axial Hole Spacing (B): ${currentMotor.b3.B} mm\n`;
      text += `Shoulder to Front Foot (C): ${currentMotor.b3.C} mm\n`;
      text += `Bolt Hole (K): Ø ${currentMotor.b3.K} mm (Bolt: ${currentMotor.b3.bolt})\n\n`;
    } else {
      text += `[IM B5 FLANGE DIMENSIONS]\n`;
      text += `Flange No: ${currentMotor.b5.flangeNo}\n`;
      text += `Pitch Circle Diameter (M): Ø ${currentMotor.b5.M} mm\n`;
      text += `Spigot Register Diameter (N): Ø ${currentMotor.b5.N} mm (${currentMotor.b5.N_tol})\n`;
      text += `Outer Flange Diameter (P): Ø ${currentMotor.b5.P} mm\n`;
      text += `Flange Hole (S): Ø ${currentMotor.b5.S} mm\n`;
      text += `Spigot Step (T): ${currentMotor.b5.T} mm | Flange Thickness (LA): ${currentMotor.b5.LA} mm\n\n`;
    }

    text += `[DRIVE END (DE) SHAFT]\n`;
    text += `Shaft Journal Diameter (D): Ø ${shaft.D} mm (${shaft.D_tol})\n`;
    text += `Shaft Extension Length (E): ${shaft.E} mm\n`;
    text += `Keyway (F x GA): ${shaft.F} x ${shaft.GA} mm (DIN 6885-1)\n`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Background Decor */}
      <div 
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        
        {/* Navigation & Title Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/20 shadow-2xl">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => navigate(-1)}
                className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors inline-flex items-center"
                title="Go Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                IEC 60072-1 / DIN EN 50347
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                50 Hz Standard (63M - 450L)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <Layers className="w-8 h-8 text-cyan-400" />
              Interactive IEC Motor Sizing & Dimensions
            </h1>
            <p className="text-sm text-blue-200">
              Siemens / Innomotics & Standard IEC frame dimensions for <span className="text-white font-semibold">IM B3 Foot</span> and <span className="text-white font-semibold">IM B5 Flange</span> configurations.
            </p>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
            <button
              onClick={handleCopySpecs}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 text-xs font-bold transition-all shadow-sm"
              title="Copy all specs to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-blue-300" />}
              <span>{copied ? 'Copied Specs!' : 'Copy Spec Sheet'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 text-xs font-bold transition-all shadow-sm no-print"
              title="Print spec sheet"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span>Print</span>
            </button>

            {/* B3 vs B5 Mode Toggle */}
            <div className="flex p-1 bg-slate-950/80 rounded-xl border border-white/20 shadow-inner">
              <button
                onClick={() => setMounting('B3')}
                className={`px-4 py-2 text-xs font-black tracking-wider uppercase rounded-lg transition-all ${
                  mounting === 'B3'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                IM B3 (Foot)
              </button>
              <button
                onClick={() => setMounting('B5')}
                className={`px-4 py-2 text-xs font-black tracking-wider uppercase rounded-lg transition-all ${
                  mounting === 'B5'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                IM B5 (Flange)
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Selector Controls Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white/10 backdrop-blur-xl p-5 rounded-3xl border border-white/20 shadow-xl">
          {/* Frame Size Dropdown */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-blue-200">
              IEC Frame Size (63M - 450L)
            </label>
            <div className="relative">
              <select
                value={selectedFrame}
                onChange={(e) => setSelectedFrame(e.target.value)}
                className="w-full bg-slate-900/90 border border-white/20 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 appearance-none cursor-pointer"
              >
                {IEC_MOTOR_DATABASE.map((item) => (
                  <option key={item.frame} value={item.frame} className="bg-slate-900 text-white">
                    Frame {item.frame} {mounting === 'B3' ? `(H = ${item.b3.H} mm)` : `(${item.b5.flangeNo})`} — {item.powerKw[selectedPole] || item.powerKw[4]} kW
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-cyan-400">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* 50 Hz Pole Count Selector */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-blue-200">
              Pole Count & Speed (50 Hz)
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {IEC_POLE_CONFIGS.map(({ poles, syncSpeed }) => (
                <button
                  key={poles}
                  onClick={() => setSelectedPole(poles)}
                  className={`py-2 px-1 text-center rounded-xl border transition-all ${
                    selectedPole === poles
                      ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-cyan-400 shadow-md scale-105 font-black'
                      : 'bg-slate-900/80 text-slate-300 border-white/10 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-xs block font-bold">{poles}P</span>
                  <span className="text-[10px] text-blue-200 block font-normal">{syncSpeed} rpm</span>
                </button>
              ))}
            </div>
          </div>

          {/* Fast Power Jump Search */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-blue-200">
              Quick Jump by Rated Power (kW)
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. 11, 22, 55, 75, 110..."
                value={searchPower}
                onChange={handlePowerSearchChange}
                className="w-full bg-slate-900/90 border border-white/20 rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
            {powerMatches.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                <span className="text-[10px] text-blue-300 mr-1">Matches:</span>
                {powerMatches.map((pm) => (
                  <button
                    key={pm.frame}
                    onClick={() => setSelectedFrame(pm.frame)}
                    className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/40"
                  >
                    {pm.frame}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Interactive Work Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Blueprint Schematic & Plant Cross-Check */}
          <div className="lg:col-span-5 space-y-6">
            <MotorSvgBlueprint
              mounting={mounting}
              frameData={currentMotor}
              poleCount={selectedPole}
            />

            {/* Plant Motor Cross Check */}
            <PlantMotorCrossCheck
              currentFrame={currentMotor.frame}
              mounting={mounting}
            />
          </div>

          {/* Right Column: Complete Dimensions Table & Fit Specs */}
          <div className="lg:col-span-7 space-y-6">
            <MotorDimensionTable
              mounting={mounting}
              frameData={currentMotor}
              poleCount={selectedPole}
            />

            {/* Engineering Standards Reference Callout */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 space-y-2">
              <div className="flex items-center space-x-2 text-cyan-400 font-bold">
                <Info className="w-4 h-4" />
                <span>Standard Tolerances & Alignment Notes</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>
                  <strong className="text-slate-200">Shaft Centerline Height (H):</strong> Has a negative tolerance ({currentMotor.b3.H_tol} mm) to guarantee shimming capability during laser shaft alignment.
                </li>
                <li>
                  <strong className="text-slate-200">2-Pole Shafts (&ge; 225M):</strong> Utilize a reduced shaft diameter (e.g. Frame 280: Ø 65 mm vs Ø 75 mm for 4-8P) to limit peripheral journal surface speeds.
                </li>
                <li>
                  <strong className="text-slate-200">Flange Spigot Fit (N):</strong> Precision register machining according to ISO fit {currentMotor.b5.N_tol} for direct pump/gearbox concentricity.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MotorStandardsPage;
