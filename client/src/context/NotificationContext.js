import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import AuthContext from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);
    const [showLog, setShowLog] = useState(false);

    // Polling interval in milliseconds (e.g., 30 seconds)
    const POLLING_INTERVAL = 30000;

    useEffect(() => {
        // Only fetch if user is logged in
        if (!user) {
            setNotifications([]); // Clear notifications on logout
            return;
        }

        // Fetch initial notifications
        fetchNotifications();

        // Set up polling
        const intervalId = setInterval(() => {
            fetchNotifications();
        }, POLLING_INTERVAL);

        // Cleanup function
        return () => clearInterval(intervalId);
    }, [user]);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            // Assuming the API returns similar structure to DB objects
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
            fetchNotifications(); // Revert on error
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
