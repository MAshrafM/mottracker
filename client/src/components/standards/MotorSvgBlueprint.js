// client/src/components/standards/MotorSvgBlueprint.js
import React from 'react';

const MotorSvgBlueprint = ({ mounting, frameData, poleCount }) => {
  if (!frameData) return null;

  const is2P = poleCount === 2;
  const shaftData = is2P ? frameData.shaft["2P"] : frameData.shaft["4-8P"];
  const b3 = frameData.b3;
  const b5 = frameData.b5;

  return (
    <div className="w-full bg-slate-900 border border-slate-700/80 rounded-2xl p-5 flex flex-col items-center select-none shadow-xl relative overflow-hidden">
      {/* Blueprint Grid Background */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)',
          backgroundSize: '16px 16px'
        }}
      />

      {/* Header bar */}
      <div className="flex flex-wrap justify-between items-center w-full text-xs text-slate-400 font-mono pb-3 mb-2 border-b border-slate-800 z-10 gap-2">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
          <span className="text-slate-300 font-semibold uppercase tracking-wider">
            {mounting === 'B3' ? 'IM B3 (IM 1001) FOOT MOUNTED' : 'IM B5 (IM 3001) FLANGE MOUNTED'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 rounded bg-blue-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
            FRAME: {frameData.frame}
          </span>
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
            {poleCount}P
          </span>
        </div>
      </div>

      {/* Interactive Blueprint SVG */}
      <svg viewBox="0 0 540 300" className="w-full max-w-xl h-auto my-3 drop-shadow-md z-10" role="img" aria-label={`Blueprint diagram for ${frameData.frame}`}>
        <defs>
          {/* Cyan Dimension Line Arrows */}
          <marker id="arrow-cyan" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#38BDF8" />
          </marker>
          {/* Amber Dimension Line Arrows */}
          <marker id="arrow-amber" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#F59E0B" />
          </marker>
          {/* Linear Gradients */}
          <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="50%" stopColor="#334155" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>
          <linearGradient id="shaftGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#94A3B8" />
            <stop offset="50%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#64748B" />
          </linearGradient>
          <linearGradient id="flangeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="50%" stopColor="#64748B" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
        </defs>

        {/* Foundation Baseplane (B3 only) */}
        {mounting === 'B3' && (
          <g>
            <line x1="20" y1="230" x2="500" y2="230" stroke="#475569" strokeWidth="2" strokeDasharray="6 4" />
            <text x="490" y="245" fill="#64748B" fontSize="9" textAnchor="end" fontFamily="monospace">BASEPLANE</text>
          </g>
        )}

        {/* Motor Enclosure Ribbed Body */}
        <rect x="180" y="70" width="180" height="130" rx="6" fill="url(#bodyGrad)" stroke="#64748B" strokeWidth="2" />
        
        {/* Enclosure Cooling Fins */}
        {[90, 110, 130, 150, 170, 190].map((y) => (
          <line key={y} x1="180" y1={y} x2="360" y2={y} stroke="#1E293B" strokeWidth="2" />
        ))}

        {/* Fan Cowl / NDE Housing */}
        <path d="M 360 80 L 415 92 L 415 178 L 360 190 Z" fill="#0F172A" stroke="#64748B" strokeWidth="2" />
        <line x1="415" y1="105" x2="415" y2="165" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />

        {/* Terminal Box */}
        <rect x="235" y="42" width="70" height="28" rx="4" fill="#334155" stroke="#94A3B8" strokeWidth="1.5" />
        <rect x="255" y="36" width="30" height="6" rx="2" fill="#64748B" />
        <text x="270" y="60" fill="#94A3B8" fontSize="8" textAnchor="middle" fontFamily="monospace" fontWeight="bold">T-BOX</text>

        {/* DRIVE END (DE) SHAFT */}
        <rect x="60" y="125" width="80" height="20" rx="1" fill="url(#shaftGrad)" stroke="#CBD5E1" strokeWidth="1.5" />
        {/* Shaft Keyway representation */}
        <rect x="75" y="125" width="45" height="4" fill="#38BDF8" stroke="#0284C7" strokeWidth="0.5" />

        {/* SHAFT EXTENSION DIMENSION (E) */}
        <line x1="60" y1="162" x2="140" y2="162" stroke="#38BDF8" strokeWidth="1.5" markerStart="url(#arrow-cyan)" markerEnd="url(#arrow-cyan)" />
        <rect x="72" y="168" width="56" height="14" rx="3" fill="#0F172A" stroke="#38BDF8" strokeWidth="0.8" />
        <text x="100" y="179" fill="#38BDF8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
          E = {shaftData.E}
        </text>

        {/* SHAFT DIAMETER DIMENSION (D) */}
        <line x1="45" y1="125" x2="45" y2="145" stroke="#38BDF8" strokeWidth="1.5" markerStart="url(#arrow-cyan)" markerEnd="url(#arrow-cyan)" />
        <line x1="40" y1="125" x2="60" y2="125" stroke="#38BDF8" strokeWidth="0.8" strokeDasharray="2 2" />
        <line x1="40" y1="145" x2="60" y2="145" stroke="#38BDF8" strokeWidth="0.8" strokeDasharray="2 2" />
        <text x="40" y="139" fill="#38BDF8" fontSize="10" fontWeight="bold" textAnchor="end" fontFamily="monospace">
          Ø D = {shaftData.D} ({shaftData.D_tol})
        </text>

        {/* MOUNTING SPECIFIC GRAPHICS */}
        {mounting === 'B3' ? (
          /* IM B3: FOOT MOUNTING ELEMENTS */
          <g>
            {/* Front and Rear Feet Pads */}
            <rect x="195" y="200" width="35" height="30" rx="2" fill="#334155" stroke="#94A3B8" strokeWidth="1.5" />
            <circle cx="212.5" cy="215" r="4" fill="#0F172A" stroke="#38BDF8" strokeWidth="1" />
            
            <rect x="315" y="200" width="35" height="30" rx="2" fill="#334155" stroke="#94A3B8" strokeWidth="1.5" />
            <circle cx="332.5" cy="215" r="4" fill="#0F172A" stroke="#38BDF8" strokeWidth="1" />

            {/* Dimension B (Axial Foot Hole Distance) */}
            <line x1="212.5" y1="248" x2="332.5" y2="248" stroke="#38BDF8" strokeWidth="1.5" markerStart="url(#arrow-cyan)" markerEnd="url(#arrow-cyan)" />
            <line x1="212.5" y1="220" x2="212.5" y2="255" stroke="#38BDF8" strokeWidth="0.8" strokeDasharray="2 2" />
            <line x1="332.5" y1="220" x2="332.5" y2="255" stroke="#38BDF8" strokeWidth="0.8" strokeDasharray="2 2" />
            <rect x="245" y="254" width="55" height="15" rx="3" fill="#0F172A" stroke="#38BDF8" strokeWidth="0.8" />
            <text x="272.5" y="265" fill="#38BDF8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              B = {b3.B} mm
            </text>

            {/* Dimension C (Front Foot to Shaft Shoulder) */}
            <line x1="140" y1="248" x2="212.5" y2="248" stroke="#38BDF8" strokeWidth="1.5" markerStart="url(#arrow-cyan)" markerEnd="url(#arrow-cyan)" />
            <line x1="140" y1="145" x2="140" y2="255" stroke="#38BDF8" strokeWidth="0.8" strokeDasharray="2 2" />
            <rect x="150" y="254" width="52" height="15" rx="3" fill="#0F172A" stroke="#38BDF8" strokeWidth="0.8" />
            <text x="176" y="265" fill="#38BDF8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              C = {b3.C} mm
            </text>

            {/* Dimension H (Centerline Shaft Height) */}
            <line x1="445" y1="135" x2="445" y2="230" stroke="#F59E0B" strokeWidth="1.5" markerStart="url(#arrow-amber)" markerEnd="url(#arrow-amber)" />
            <line x1="360" y1="135" x2="455" y2="135" stroke="#F59E0B" strokeWidth="0.8" strokeDasharray="2 2" />
            <rect x="452" y="172" width="76" height="20" rx="4" fill="#0F172A" stroke="#F59E0B" strokeWidth="1.2" />
            <text x="490" y="186" fill="#F59E0B" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              H = {b3.H} mm
            </text>
            <text x="490" y="200" fill="#F59E0B" fontSize="8" textAnchor="middle" fontFamily="monospace">
              ({b3.H_tol} mm)
            </text>
          </g>
        ) : (
          /* IM B5: FLANGE MOUNTING ELEMENTS */
          <g>
            {/* Flange Collar at DE */}
            <rect x="135" y="45" width="18" height="180" rx="3" fill="url(#flangeGrad)" stroke="#94A3B8" strokeWidth="1.5" />
            {/* Centering Spigot Register Step */}
            <rect x="131" y="65" width="4" height="140" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="0.8" />

            {/* Flange Outer Diameter P */}
            <line x1="168" y1="45" x2="168" y2="225" stroke="#F59E0B" strokeWidth="1.5" markerStart="url(#arrow-amber)" markerEnd="url(#arrow-amber)" />
            <line x1="153" y1="45" x2="175" y2="45" stroke="#F59E0B" strokeWidth="0.8" strokeDasharray="2 2" />
            <line x1="153" y1="225" x2="175" y2="225" stroke="#F59E0B" strokeWidth="0.8" strokeDasharray="2 2" />
            
            <rect x="175" y="125" width="70" height="20" rx="4" fill="#0F172A" stroke="#F59E0B" strokeWidth="1" />
            <text x="210" y="139" fill="#F59E0B" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              Ø P = {b5.P} mm
            </text>

            {/* Flange Callout Info Box */}
            <rect x="20" y="15" width="180" height="46" rx="6" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.2" />
            <text x="30" y="32" fill="#38BDF8" fontSize="11" fontWeight="bold" fontFamily="monospace">
              FLANGE: {b5.flangeNo}
            </text>
            <text x="30" y="49" fill="#E2E8F0" fontSize="10" fontFamily="monospace">
              PCD M: Ø{b5.M} | Spigot N: Ø{b5.N} ({b5.N_tol})
            </text>
          </g>
        )}
      </svg>

      {/* Blueprint Subtitle Details */}
      <div className="w-full text-center text-xs text-slate-400 border-t border-slate-800 pt-3 z-10 flex flex-wrap justify-around gap-2 font-mono">
        {mounting === 'B3' ? (
          <>
            <span className="text-slate-300">
              <strong className="text-cyan-400">A (Transverse):</strong> {b3.A} mm
            </span>
            <span className="text-slate-300">
              <strong className="text-cyan-400">K (Bolt Hole):</strong> Ø{b3.K} mm ({b3.bolt})
            </span>
            <span className="text-slate-300">
              <strong className="text-amber-400">H (Shaft Height):</strong> {b3.H} mm ({b3.H_tol})
            </span>
          </>
        ) : (
          <>
            <span className="text-slate-300">
              <strong className="text-cyan-400">PCD (M):</strong> Ø{b5.M} mm
            </span>
            <span className="text-slate-300">
              <strong className="text-cyan-400">Spigot (N):</strong> Ø{b5.N} {b5.N_tol}
            </span>
            <span className="text-slate-300">
              <strong className="text-amber-400">Hole (S):</strong> Ø{b5.S} mm | <strong className="text-amber-400">T/LA:</strong> {b5.T}/{b5.LA} mm
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default MotorSvgBlueprint;
