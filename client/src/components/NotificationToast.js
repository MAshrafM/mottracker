import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { X, CheckCircle, Info, AlertTriangle } from 'lucide-react';

const NotificationToast = () => {
    const { notifications, markAsRead } = useNotifications();

    // Only show unread notifications as toasts
    const activeToasts = notifications.filter(n => !n.read);

    // Auto-dismiss toasts (mark as read) after 5 seconds
    React.useEffect(() => {
        if (activeToasts.length > 0) {
            const timers = activeToasts.map(toast => {
                return setTimeout(() => {
                    markAsRead(toast.id);
                }, 5000);
            });
            return () => timers.forEach(timer => clearTimeout(timer));
        }
    }, [activeToasts, markAsRead]);

    if (activeToasts.length === 0) return null;

    return (
        <div className="fixed top-24 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
            {activeToasts.map((notification) => (
                <div
                    key={notification.id}
                    className={`pointer-events-auto transform transition-all duration-300 ease-in-out hover:scale-102 cursor-pointer
            ${getStyleByType(notification.type)}
            backdrop-blur-md border rounded-lg shadow-lg p-4 flex items-start gap-3 animate-slide-in-right ring-1 ring-inset
          `}
                    onClick={() => markAsRead(notification.id)}
                >
                    <div className="flex-shrink-0 mt-0.5">
                        {getIconByType(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold capitalize mb-0.5">
                            {notification.type === 'info' ? 'Update' : notification.type}
                        </h4>
                        <p className="text-sm opacity-90 leading-relaxed font-normal break-words">
                            {notification.message}
                        </p>
                        <span className="text-xs opacity-60 mt-2 block">
                            {new Date(notification.timestamp).toLocaleTimeString()}
                        </span>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                        }}
                        className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity p-1 -mr-2 -mt-2"
                    >
                        <X size={16} />
                    </button>
                </div>
            ))}
        </div>
    );
};

const getStyleByType = (type) => {
    switch (type) {
        case 'success':
            return 'bg-green-500/10 border-green-500/20 text-green-100 ring-green-500/20';
        case 'warning':
        case 'error':
            return 'bg-red-500/10 border-red-500/20 text-red-100 ring-red-500/20';
        case 'info':
        default:
            return 'bg-blue-500/10 border-blue-500/20 text-blue-100 ring-blue-500/20';
    }
};

const getIconByType = (type) => {
    switch (type) {
        case 'success':
            return <CheckCircle size={20} className="text-green-400" />;
        case 'warning':
        case 'error':
            return <AlertTriangle size={20} className="text-red-400" />;
        case 'info':
        default:
            return <Info size={20} className="text-blue-400" />;
    }
};

export default NotificationToast;
