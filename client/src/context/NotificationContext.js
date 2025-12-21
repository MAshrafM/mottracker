import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { BASE_API_URL } from '../config/api';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [showLog, setShowLog] = useState(false);

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
        // Keep a log of notifications, limited to last 20 for example, to show in the dropdown
        setNotifications((prev) => {
            const newNote = { id, ...data, read: false };
            return [newNote, ...prev].slice(0, 50);
        });

        // We don't auto-remove them entirely from the state anymore if we want a log.
        // Instead, we can have a separate "toasts" state if we want transient toasts + persistent log,
        // OR we just use one list and the Toast component only shows recent/unread ones.
        // simpler: use one main list. Valid "Toast" notifications could be just the unread ones or recent ones.
    };

    const markAsRead = (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    const removeNotification = (id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    const toggleLog = () => setShowLog(prev => !prev);

    // Computed property for unread count
    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{
            notifications,
            removeNotification,
            markAsRead,
            clearAll,
            showLog,
            setShowLog,
            toggleLog,
            unreadCount
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
