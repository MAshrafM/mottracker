import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useMotorData } from '../context/MotorContext';
import { Loader, Printer, ArrowLeft, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '../logo_ar.gif';

const MotorMaintenanceReportPage = () => {
    const { motors, refreshData } = useMotorData();
    const [filteredMotors, setFilteredMotors] = useState([]);
    const [selectedMotor, setSelectedMotor] = useState(null);
    const [maintenanceHistory, setMaintenanceHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Search filters
    const [filters, setFilters] = useState({
        power: '',
        speed: '',
        status: '',
        serialNumber: '',
        manufacturer: '',
    });

    useEffect(() => {
        if (motors) {
            setFilteredMotors(motors);
        } else {
            refreshData();
        }
    }, [motors, refreshData]);

    useEffect(() => {
        if (motors) {
            const results = motors.filter((motor) => {
                return (
                    (filters.power === '' || motor.power.toString().toLowerCase().includes(filters.power.toLowerCase())) &&
                    (filters.speed === '' || motor.speed.toString().toLowerCase().includes(filters.speed.toLowerCase())) &&
                    (filters.status === '' || motor.status === filters.status) &&
                    (filters.serialNumber === '' || motor.serialNumber.toString().toLowerCase().includes(filters.serialNumber.toLowerCase())) &&
                    (filters.manufacturer === '' || motor.manufacturer.toString().toLowerCase().includes(filters.manufacturer.toLowerCase()))
                );
            });
            setFilteredMotors(results);
        }
    }, [filters, motors]);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleSelectMotor = async (motor) => {
        setSelectedMotor(motor);
        setLoadingHistory(true);
        try {
            const response = await api.get(`/motors/${motor._id}/maintenance`);
            setMaintenanceHistory(response.data.data.sort((a, b) => new Date(b.date) - new Date(a.date)));
        } catch (err) {
            console.error("Failed to fetch history", err);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleBack = () => {
        setSelectedMotor(null);
        setMaintenanceHistory([]);
    };

    if (!motors) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
                <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-8 shadow-xl flex items-center space-x-3">
                    <Loader className="w-6 h-6 text-blue-400 animate-spin" />
                    <p className="text-white text-lg">Loading Motors...</p>
                </div>
            </div>
        );
    }

    if (selectedMotor) {
        return (
            <div className="min-h-screen bg-white text-black p-4 md:p-8">
                {/* Navigation & Actions - Hidden when printing */}
                <div className="print:hidden flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                    <button
                        onClick={handleBack}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Back to List
                    </button>
                    <button
                        onClick={handlePrint}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                    >
                        <Printer size={20} />
                        Print Report
                    </button>
                </div>

                {/* Report Content */}
                {loadingHistory ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                ) : (
                    <div className="w-full md:max-w-[210mm] mx-auto bg-white relative min-h-[297mm] p-4 md:p-8 shadow-none md:shadow-2xl print:shadow-none print:p-0 print:m-0 print:w-full print:max-w-none">
                        {/* Watermark */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-[0.03]">
                            <img src={logo} alt="Watermark" className="w-[80%] h-auto grayscale" />
                        </div>
                        <style>
                            {`
                                @media print {
                                    @page {
                                        size: A4 portrait;
                                        margin: 10mm;
                                    }
                                    body {
                                        -webkit-print-color-adjust: exact;
                                    }
                                    /* Hide global elements */
                                    nav, header, .navbar, .sidebar { 
                                        display: none !important; 
                                    }
                                }
                            `}
                        </style>

                        <div className="relative z-10">
                            {/* Header */}
                            <div className="flex flex-col md:flex-row print:flex-row justify-between items-center border-b-2 border-slate-800 pb-6 mb-8 gap-4 text-center md:text-left print:text-left">
                                <div>
                                    <h1 className="text-2xl md:text-3xl print:text-3xl font-bold text-slate-900 uppercase tracking-wider">Maintenance Report</h1>
                                    <p className="text-slate-500 mt-1">Generated on {new Date().toLocaleDateString()}</p>
                                </div>
                                <img src={logo} alt="Company Logo" className="h-12 md:h-16 print:h-16 w-auto" />
                            </div>

                            {/* Section 1: Motor Information */}
                            <section className="mb-10">
                                <h2 className="text-lg md:text-xl print:text-xl font-bold text-slate-800 uppercase border-l-4 border-blue-600 pl-3 mb-6">
                                    Motor Information
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-x-12 gap-y-4 text-sm">
                                    <div className="flex justify-between border-b border-slate-200 pb-2">
                                        <span className="font-semibold text-slate-600">Serial Number</span>
                                        <span className="font-bold text-slate-900">{selectedMotor.serialNumber}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-2">
                                        <span className="font-semibold text-slate-600">Manufacturer</span>
                                        <span className="font-medium text-slate-900">{selectedMotor.manufacturer}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-2">
                                        <span className="font-semibold text-slate-600">Type</span>
                                        <span className="font-medium text-slate-900">{selectedMotor.type}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-2">
                                        <span className="font-semibold text-slate-600">Power</span>
                                        <span className="font-medium text-slate-900">{selectedMotor.power} KW</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-2">
                                        <span className="font-semibold text-slate-600">Speed</span>
                                        <span className="font-medium text-slate-900">{selectedMotor.speed} RPM</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-2">
                                        <span className="font-semibold text-slate-600">Current</span>
                                        <span className="font-medium text-slate-900">{selectedMotor.current} A</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-2">
                                        <span className="font-semibold text-slate-600">Mounting (IM)</span>
                                        <span className="font-medium text-slate-900">{selectedMotor.IM}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-2">
                                        <span className="font-semibold text-slate-600">Frame Size</span>
                                        <span className="font-medium text-slate-900">{selectedMotor.frameSize}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-2">
                                        <span className="font-semibold text-slate-600">Bearing DE</span>
                                        <span className="font-medium text-slate-900">{selectedMotor.bearingDE}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-2">
                                        <span className="font-semibold text-slate-600">Bearing NDE</span>
                                        <span className="font-medium text-slate-900">{selectedMotor.bearingNDE}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-2">
                                        <span className="font-semibold text-slate-600">Status</span>
                                        <span className="font-medium text-slate-900 uppercase">{selectedMotor.status}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-2">
                                        <span className="font-semibold text-slate-600">Last Maintenance</span>
                                        <span className="font-medium text-slate-900">
                                            {selectedMotor.lastMaintenanceDate
                                                ? new Date(selectedMotor.lastMaintenanceDate).toLocaleDateString()
                                                : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </section>

                            {/* Section 2: History Log */}
                            <section>
                                <h2 className="text-lg md:text-xl print:text-xl font-bold text-slate-800 uppercase border-l-4 border-blue-600 pl-3 mb-6">
                                    Maintenance History Log
                                </h2>

                                {maintenanceHistory.length > 0 ? (
                                    <div className="overflow-x-auto print:overflow-visible">
                                        <table className="w-full text-sm text-left min-w-[600px] print:min-w-0">
                                            <thead className="text-xs text-slate-500 uppercase bg-slate-100 border-b border-slate-300">
                                                <tr>
                                                    <th scope="col" className="px-6 py-3 w-1/4">Date</th>
                                                    <th scope="col" className="px-6 py-3">Description</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {maintenanceHistory.map((log, index) => (
                                                    <tr key={log._id || index} className="border-b border-slate-200 hover:bg-slate-50">
                                                        <td className="px-6 py-4 font-medium text-slate-900 align-top">
                                                            {new Date(log.date).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-700 whitespace-pre-wrap">
                                                            {log.description}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-slate-500 italic border border-dashed border-slate-300 rounded-lg">
                                        No maintenance history recorded for this motor.
                                    </div>
                                )}
                            </section>

                            {/* Footer */}
                            <div className="mt-16 pt-8 border-t border-slate-200 text-center text-xs text-slate-400">
                                <p>Motor Tracker System - Maintenance Report</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Selection View
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-6">
            {/* Search & Filter Header */}
            <div className="glass rounded-xl p-6 mb-8 shadow-2xl">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-white tracking-tight">Select Motor for Report</h2>
                    <Link to="/reports" className="text-slate-300 hover:text-white transition-colors mt-4 md:mt-0">
                        Back to Reports
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        type="text"
                        name="power"
                        placeholder="Search by Power..."
                        value={filters.power}
                        onChange={handleFilterChange}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 
                      focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 transition-all duration-300"
                    />
                    <input
                        type="text"
                        name="speed"
                        placeholder="Search by Speed..."
                        value={filters.speed}
                        onChange={handleFilterChange}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 
                      focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 transition-all duration-300"
                    />
                    <select
                        name="status"
                        value={filters.status}
                        onChange={handleFilterChange}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white 
                      focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 transition-all duration-300"
                    >
                        <option className="bg-gray-800" value="">All Status</option>
                        <option className="bg-gray-800" value="active">Active</option>
                        <option className="bg-gray-800" value="spare">Spare</option>
                        <option className="bg-gray-800" value="out of service">Out of Service</option>
                    </select>
                    <input
                        type="text"
                        name="serialNumber"
                        placeholder="Search by Serial Number..."
                        value={filters.serialNumber}
                        onChange={handleFilterChange}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 
                      focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 transition-all duration-300"
                    />
                    <input
                        type="text"
                        name="manufacturer"
                        placeholder="Search by Manufacturer..."
                        value={filters.manufacturer}
                        onChange={handleFilterChange}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 
                      focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 transition-all duration-300"
                    />
                    <div className="text-white-600 font-medium py-2 text-center sm:text-left sm:ml-auto w-full sm:w-auto">
                        <p>Total Motors: <span className="text-amber-400">{filteredMotors.length}</span></p>
                    </div>
                </div>
            </div>

            {/* Grid of Motors */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                {filteredMotors.map((motor) => (
                    <div
                        key={motor._id}
                        className="glass rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer group"
                        onClick={() => handleSelectMotor(motor)}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                                    {motor.manufacturer} | {motor.type}
                                </h3>
                                <p className="text-sm text-slate-400 mt-1">S/N: {motor.serialNumber}</p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${motor.status === 'active'
                                ? 'bg-green-500/20 text-green-300'
                                : 'bg-yellow-500/20 text-yellow-300'
                                }`}>
                                {motor.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm text-slate-300">
                            <p>Power: <span className="text-white">{motor.power} KW</span></p>
                            <p>Speed: <span className="text-white">{motor.speed} RPM</span></p>
                            <p>Frame: <span className="text-white">{motor.frameSize}</span></p>
                            <p>Loc: <span className="text-white">{motor.Warehouse || 'N/A'}</span></p>
                        </div>

                        <div className="mt-4 pt-4 border-t border-white/10 flex justify-end">
                            <span className="text-blue-400 text-sm font-medium flex items-center group-hover:translate-x-1 transition-transform">
                                Generate Report <ArrowLeft className="w-4 h-4 ml-1 rotate-180" />
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default MotorMaintenanceReportPage;
