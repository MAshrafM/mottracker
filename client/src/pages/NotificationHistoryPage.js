import React, { useState, useContext } from 'react';
import { useNotifications } from '../context/NotificationContext';
import AuthContext from '../context/AuthContext';
import { Archive, Bell, Check, Trash2, Calendar, Filter } from 'lucide-react';

const NotificationHistoryPage = () => {
    const { notifications, markAsRead, clearAll, removeNotification, unreadCount } = useNotifications();
    const { user } = useContext(AuthContext);
    const [filter, setFilter] = useState('all'); // all, unread, read
    const [searchTerm, setSearchTerm] = useState('');

    const filteredNotifications = notifications.filter(n => {
        const matchesFilter =
            filter === 'all' ? true :
                filter === 'unread' ? !n.read :
                    n.read;

        const matchesSearch = n.message.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    const handleMarkAllRead = () => {
        notifications.forEach(n => !n.read && markAsRead(n.id));
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-6 pt-24">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Bell className="w-8 h-8 text-blue-400" />
                            Notification History
                        </h1>
                        <p className="text-blue-300 mt-2">View and manage your recent system alerts.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors text-sm font-medium"
                            >
                                <Check className="w-4 h-4" />
                                Mark all read
                            </button>
                        )}
                        {notifications.length > 0 && (
                            <button
                                onClick={clearAll}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors text-sm font-medium"
                            >
                                <Trash2 className="w-4 h-4" />
                                Clear History
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-slate-800/50 p-4 rounded-xl border border-white/10 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-lg border border-white/5">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px - 4 py - 1.5 rounded - md text - sm font - medium transition - all ${filter === 'all' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'} `}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilter('unread')}
                            className={`px - 4 py - 1.5 rounded - md text - sm font - medium transition - all ${filter === 'unread' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'} `}
                        >
                            Unread
                        </button>
                        <button
                            onClick={() => setFilter('read')}
                            className={`px - 4 py - 1.5 rounded - md text - sm font - medium transition - all ${filter === 'read' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'} `}
                        >
                            Read
                        </button>
                    </div>

                    <div className="relative w-full md:w-64">
                        <input
                            type="text"
                            placeholder="Search notifications..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors text-white placeholder-slate-500"
                        />
                        <Filter className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    </div>
                </div>

                {/* List */}
                <div className="space-y-3">
                    {filteredNotifications.length === 0 ? (
                        <div className="text-center py-20 bg-slate-800/30 rounded-2xl border border-white/5 flex flex-col items-center">
                            <Archive className="w-16 h-16 text-slate-700 mb-4" />
                            <h3 className="text-xl font-medium text-slate-400">No notifications found</h3>
                            <p className="text-slate-500 mt-2">Try adjusting your filters or search terms.</p>
                        </div>
                    ) : (
                        filteredNotifications.map((note) => (
                            <div
                                key={note.id}
                                className={`
                  relative group p - 5 rounded - xl border transition - all duration - 200
                  ${note.read
                                        ? 'bg-slate-800/40 border-white/5 hover:bg-slate-800/60'
                                        : 'bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10 shadow-[0_0_15px_-3px_rgba(59,130,246,0.1)]'
                                    }
`}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`text - xs font - bold px - 2 py - 0.5 rounded - full uppercase tracking - wide border ${note.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                    note.type === 'warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                        note.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                            'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                } `}>
                                                {note.type}
                                            </span>
                                            <span className="flex items-center text-xs text-slate-400 gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(note.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className={`text - lg leading - relaxed ${note.read ? 'text-slate-300' : 'text-white'} `}>
                                            {note.message}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity self-end sm:self-center">
                                        {!note.read && (
                                            <button
                                                onClick={() => markAsRead(note.id)}
                                                className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                title="Mark as read"
                                            >
                                                <Check className="w-5 h-5" />
                                            </button>
                                        )}
                                        {user?.role === 'admin' && (
                                            <button
                                                onClick={() => removeNotification(note.id)}
                                                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

            </div>
        </div>
    );
};

export default NotificationHistoryPage;
