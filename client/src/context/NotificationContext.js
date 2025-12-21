import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { BASE_API_URL } from '../config/api';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        // Derive socket URL from BASE_API_URL
        // If BASE_API_URL is 'http://localhost:5001/api', we want 'http://localhost:5001'
        let socketUrl = BASE_API_URL;
        try {
            const url = new URL(BASE_API_URL);
            socketUrl = url.origin;
        } catch (e) {
            console.error("Invalid API URL for socket:", BASE_API_URL);
        }

        const newSocket = io(socketUrl);

        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected to socket server');
        });

        newSocket.on('notification', (data) => {
            addNotification(data);
        });

        return () => newSocket.close();
    }, []);

    const addNotification = (data) => {
        const id = Date.now();
        setNotifications((prev) => [{ id, ...data }, ...prev]);

        // Auto remove after 5 seconds
        setTimeout(() => {
            removeNotification(id);
        }, 5000);
    };

    const removeNotification = (id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    return (
        <NotificationContext.Provider value={{ notifications, removeNotification }}>
            {children}
        </NotificationContext.Provider>
    );
};
