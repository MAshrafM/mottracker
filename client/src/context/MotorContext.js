import React, { createContext, useState, useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';

const MotorContext = createContext();

export const MotorProvider = ({ children }) => {
  const [motors, setMotors] = useState(null); // Null indicates "not loaded yet"
  //const [motorsWithEquipment, setMotorsWithEquipment] = useState(null); // Null indicates "not loaded yet"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const qrToken = searchParams.get('qrToken') || searchParams.get('qrtoken');
    if (qrToken) {
      return;
    }
    const loadMotorsOnInit = async () => {
        try {
        const motors = await api.get('/motors/with-equipment');
        setMotors(motors.data.data);
        } catch (err) {
        setError('Failed to fetch motor data on init');
        } finally {
        setLoading(false);
        }
    };
    loadMotorsOnInit();
  }, [location.search]);

  const loadMotors = async () => {
    // If we already have data, STOP. Do not fetch again.
    setLoading(true);
    try {
      // Call the NEW optimized backend endpoint
      const motors = await api.get('/motors/with-equipment'); 
      //const motorsWithEquipment = await api.get('/motors/with-equipment');
      setMotors(motors.data.data);
      //setMotorsWithEquipment(motorsWithEquipment.data.data);
    } catch (err) {
      setError('Failed to fetch motor data');
    } finally {
      setLoading(false);
    }
  };

  // Optional: Function to force reload if a user DOES create/update data
  const refreshData = () => {
    setMotors(null); // Clear cache
    loadMotors();    // Re-fetch
  };

  return (
    <MotorContext.Provider value={{ motors, loading, error, loadMotors, refreshData }}>
      {children}
    </MotorContext.Provider>
  );
};

export const useMotorData = () => useContext(MotorContext);