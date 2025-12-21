import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { BASE_API_URL } from '../config/api';
import api from '../services/api';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [showLog, setShowLog] = useState(false);

    useEffect(() => {
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
            // For persistent ones, standardise structure:
            // If data comes from DB create, it has _id. Use that as id.
            const newNote = {
                id: data._id || Date.now(),
                ...data,
                message: data.message,
                type: data.type,
                timestamp: data.createdAt || new Date(),
                read: false
            };

            addNotification(newNote);
        });

        return () => newSocket.close();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            const notes = res.data.data.map(n => ({
                id: n._id,
                ...n,
                timestamp: n.createdAt
            }));
            setNotifications(notes);
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    };

    const addNotification = (data) => {
        setNotifications((prev) => {
            // Avoid duplicates if socket sends event for something we just fetched?
            // Usually socket is real-time.
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
