import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import './App.css';
import { Loader } from 'lucide-react';
import { NotificationProvider } from './context/NotificationContext';
import NotificationToast from './components/NotificationToast';

// Lazy-loaded pages for bundle size optimization
const UserManagementPage = lazy(() => import('./pages/UserManagementPage'));
const MotorManagementPage = lazy(() => import('./pages/MotorManagementPage'));
const MotorHistoryPage = lazy(() => import('./pages/MotorHistoryPage'));
const PlantEquipmentPage = lazy(() => import('./pages/PlantEquipmentPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const NotificationHistoryPage = lazy(() => import('./pages/NotificationHistoryPage'));
const ActiveMotorReport = lazy(() => import('./pages/ActiveMotorReport'));
const ActiveMotorDetailedReport = lazy(() => import('./pages/ActiveMotorDetailedReport'));
const AllMotorDetailedReport = lazy(() => import('./pages/AllMotorDetailedReport'));
const SpareMotorsReport = lazy(() => import('./pages/SpareMotorReport'));
const BearingReport = lazy(() => import('./pages/BearingReport'));
const MotorMaintenanceReportPage = lazy(() => import('./pages/MotorMaintenanceReportPage'));
const UnitMotorReport = lazy(() => import('./pages/UnitMotorReport'));
const ShutdownReportPage = lazy(() => import('./pages/ShutdownReportPage'));
const SparePartsPage = lazy(() => import('./pages/SparePartsPage'));
const EquipmentByPowerPage = lazy(() => import('./pages/EquipmentByPowerPage'));
const DevParserPage = lazy(() => import('./pages/DevParserPage'));
const CableSizingPage = lazy(() => import('./pages/CableSizingPage'));
const MotorStandardsPage = lazy(() => import('./pages/MotorStandardsPage'));

const PageFallback = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 shadow-xl text-white">
      <Loader className="w-6 h-6 text-blue-400 animate-spin" />
      <span className="text-lg font-medium">Loading page...</span>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <NotificationProvider>
        <Navbar />
        <NotificationToast />
        <main>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              {/* Public Route */}
              <Route path="/login" element={<LoginPage />} />

              {/* Private Routes */}
              <Route element={<PrivateRoute />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/users" element={<UserManagementPage />} />
                <Route path="/motors" element={<MotorManagementPage />} />
                <Route path="/motors/:motorId/maintenance" element={<MotorHistoryPage />} />
                <Route path="/equipment" element={<PlantEquipmentPage />} />
                <Route path="/equipment-by-power" element={<EquipmentByPowerPage />} />
                <Route path="/notifications" element={<NotificationHistoryPage />} />
                <Route path="/reports/*" element={<ReportsPage />} />
                <Route path="/reports/active-motors" element={<ActiveMotorReport />} />
                <Route path="/reports/active-motors-detailed" element={<ActiveMotorDetailedReport />} />
                <Route path="/reports/all-motors-detailed" element={<AllMotorDetailedReport />} />
                <Route path="/reports/spare-motors" element={<SpareMotorsReport />} />
                <Route path="/reports/bearings" element={<BearingReport />} />
                <Route path="/reports/motor-maintenance" element={<MotorMaintenanceReportPage />} />
                <Route path="/reports/unit-motor" element={<UnitMotorReport />} />
                <Route path="/reports/shutdown" element={<ShutdownReportPage />} />
                <Route path="/spare-parts" element={<SparePartsPage />} />
                <Route path="/cable-sizing" element={<CableSizingPage />} />
                <Route path="/standards/motor-dimensions" element={<MotorStandardsPage />} />
                <Route path="/framesize-selection" element={<MotorStandardsPage />} />
                <Route path="/frame-size-selection" element={<MotorStandardsPage />} />
              </Route>

              {/* Development Only Routes */}
              {process.env.NODE_ENV === 'development' && (
                <Route path="/dev/parser" element={<DevParserPage />} />
              )}
            </Routes>
          </Suspense>
        </main>
      </NotificationProvider>
    </Router>
  );
}

export default App;
