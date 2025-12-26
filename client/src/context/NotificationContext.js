import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { BASE_API_URL } from '../config/api';
import api from '../services/api';
import AuthContext from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);



export const NotificationProvider = ({ children }) => {
    const { user } = useContext(AuthContext); // Get user from AuthContext
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [showLog, setShowLog] = useState(false);

    useEffect(() => {
        // Only fetch/connect if user is logged in
        if (!user) {
            if (socket) {
                socket.close();
                setSocket(null);
            }
            setNotifications([]); // Clear notifications on logout
            return;
        }

        // Fetch initial notifications
        fetchNotifications();

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
            // Create a local notification object from the socket data
            // Ensure we use the persistent DB ID if available
            // If data._id is missing, something is wrong with backend emission, but we fallback safely to avoid crashes.
            const safeDate = (dateStr) => {
                try {
                    const d = new Date(dateStr);
                    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
                } catch (e) {
                    return new Date().toISOString();
                }
            };

            const newNote = {
                id: data.id || data._id || `temp-${Date.now()}`,
                message: data.message,
                type: data.type,
                timestamp: safeDate(data.createdAt),
                read: false,
                relatedId: data.relatedId
            };

            // Console warning if we are falling back to temp ID, which means persistence will fail for this item's actions
            if (!data._id && !data.id) console.warn("Received notification without DB ID:", data);

            addNotification(newNote);
        });

        return () => newSocket.close();
    }, [user]); // Add user dependency

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            const notes = res.data.data.map(n => ({
                id: n._id,
                message: n.message,
                type: n.type,
                timestamp: n.createdAt,
                read: n.read,
                relatedId: n.relatedId
            }));
            setNotifications(notes);
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    };

    const addNotification = (data) => {
        setNotifications((prev) => {
            // Check if this ID already exists (to prevent duplicates from race conditions between fetch and socket)
            if (prev.some(n => n.id === data.id)) {
                return prev;
            }
            return [data, ...prev].slice(0, 50);
        });
    };

    const markAsRead = async (id) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        try {
            await api.put(`/notifications/${id}/read`);
        } catch (err) {
            console.error("Failed to mark as read", err);
        }
    };

    const clearAll = async () => {
        setNotifications([]);
        try {
            await api.delete('/notifications');
        } catch (err) {
            console.error("Failed to clear notifications", err);
            // Revert? simpler to just log error
            fetchNotifications();
        }
    };

    const removeNotification = async (id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        try {
            await api.delete(`/notifications/${id}`);
        } catch (err) {
            console.error("Failed to delete notification", err);
        }
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
