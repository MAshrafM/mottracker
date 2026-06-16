import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UserManagementPage from './pages/UserManagementPage';
import MotorManagementPage from './pages/MotorManagementPage';
import MotorHistoryPage from './pages/MotorHistoryPage';
import PlantEquipmentPage from './pages/PlantEquipmentPage';
import ReportsPage from './pages/ReportsPage';
import NotificationHistoryPage from './pages/NotificationHistoryPage';
import ActiveMotorReport from './pages/ActiveMotorReport';
import ActiveMotorDetailedReport from './pages/ActiveMotorDetailedReport';
import SpareMotorsReport from './pages/SpareMotorReport';
import BearingReport from './pages/BearingReport';
import MotorMaintenanceReportPage from './pages/MotorMaintenanceReportPage';
import UnitMotorReport from './pages/UnitMotorReport';
import SparePartsPage from './pages/SparePartsPage';
import EquipmentByPowerPage from './pages/EquipmentByPowerPage';
import DevParserPage from './pages/DevParserPage';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import './App.css';


import { NotificationProvider } from './context/NotificationContext';
import NotificationToast from './components/NotificationToast';

function App() {
  return (
    <Router>
      <NotificationProvider>
        <Navbar />
        <NotificationToast />
        <main>
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
              <Route path="/reports/spare-motors" element={<SpareMotorsReport />} />
              <Route path="/reports/bearings" element={<BearingReport />} />
              <Route path="/reports/motor-maintenance" element={<MotorMaintenanceReportPage />} />
              <Route path="/reports/unit-motor" element={<UnitMotorReport />} />
              <Route path="/spare-parts" element={<SparePartsPage />} />
              {/* Add other private routes for motors, equipment etc. here */}
            </Route>

            {/* Development Only Routes */}
            {process.env.NODE_ENV === 'development' && (
              <Route path="/dev/parser" element={<DevParserPage />} />
            )}
          </Routes>
        </main>
      </NotificationProvider>
    </Router>
  );
}

export default App;
