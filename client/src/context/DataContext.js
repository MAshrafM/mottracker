import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [motors, setMotors] = useState(null);
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load all data ONCE on mount — no location dependency
  useEffect(() => {
    // Skip loading if accessed via QR token (external single-motor access)
    const searchParams = new URLSearchParams(window.location.search);
    const qrToken = searchParams.get('qrToken') || searchParams.get('qrtoken');
    if (qrToken) {
      setLoading(false);
      return;
    }

    const loadAllData = async () => {
      try {
        const [motorsRes, equipmentRes] = await Promise.all([
          api.get('/motors/with-equipment'),
          api.get('/equipment'),
        ]);
        setMotors(motorsRes.data.data);
        setEquipment(equipmentRes.data.data);
      } catch (err) {
        setError('Failed to fetch initial data');
        console.error('DataContext load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []); // Empty deps = once per session

  // Selective refresh functions for after CRUD operations
  const refreshMotors = async () => {
    try {
      const res = await api.get('/motors/with-equipment');
      setMotors(res.data.data);
    } catch (err) {
      console.error('Failed to refresh motors:', err);
    }
  };

  const refreshEquipment = async () => {
    try {
      const res = await api.get('/equipment');
      setEquipment(res.data.data);
    } catch (err) {
      console.error('Failed to refresh equipment:', err);
    }
  };

  const refreshAll = async () => {
    await Promise.all([refreshMotors(), refreshEquipment()]);
  };

  // Legacy-compatible alias: refreshData -> refreshMotors (used by MotorManagementPage, etc.)
  const refreshData = refreshMotors;

  return (
    <DataContext.Provider value={{
      motors,
      equipment,
      loading,
      error,
      refreshMotors,
      refreshEquipment,
      refreshAll,
      refreshData,
    }}>
      {children}
    </DataContext.Provider>
  );
};

// Primary hook
export const useDataContext = () => useContext(DataContext);

// Legacy-compatible alias so existing `useMotorData()` calls still work without renaming
export const useMotorData = () => useContext(DataContext);

export default DataContext;
