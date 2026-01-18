import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { getNotificationIcon, formatRelativeTime } from '../types/notification.types';

interface NotificationDropdownProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (url: string) => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose, onNavigate }) => {
    const { notifications, markAsRead, markAllAsRead, unreadCount } = useNotifications();

    if (!isOpen) return null;

    const handleNotificationClick = (notification: typeof notifications[0]) => {
        markAsRead(notification.id);
        if (notification.actionUrl) {
            onNavigate(notification.actionUrl);
        }
        onClose();
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40"
                onClick={onClose}
            />

            {/* Dropdown */}
            <div
                className="absolute top-full right-0 mt-2 w-80 sm:w-96 rounded-xl border border-white/10 shadow-xl z-50 overflow-hidden animate-fade-in"
                style={{
                    background: 'rgba(17, 17, 17, 0.98)',
                    backdropFilter: 'blur(12px)',
                    maxHeight: '70vh'
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-purple-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                        </svg>
                        Notifications
                        {unreadCount > 0 && (
                            <span className="px-2 py-0.5 text-xs bg-purple-500 rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </h3>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                        >
                            Mark all read
                        </button>
                    )}
                </div>

                {/* Notification List */}
                <div className="overflow-y-auto max-h-[50vh] custom-scrollbar">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12 mb-3 opacity-50">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                            </svg>
                            <p className="text-sm">No notifications yet</p>
                            <p className="text-xs mt-1 opacity-60">Add anime to your Watching list to get alerts</p>
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <button
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-white/5 hover:bg-white/5 ${!notification.read ? 'bg-purple-500/5' : ''
                                    }`}
                            >
                                {/* Thumbnail */}
                                <div className="relative flex-shrink-0">
                                    {notification.thumbnail ? (
                                        <img
                                            src={notification.thumbnail}
                                            alt=""
                                            className="w-12 h-12 rounded-lg object-cover"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center text-xl">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                    )}
                                    {/* Unread dot */}
                                    {!notification.read && (
                                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full border-2 border-[#111]" />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start gap-2">
                                        <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium truncate ${notification.read ? 'text-gray-300' : 'text-white'}`}>
                                                {notification.title}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {notification.message}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formatRelativeTime(notification.timestamp)}
                                    </p>
                                </div>
                            </button>
                        ))
                    )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                    <div className="px-4 py-2 border-t border-white/10 bg-white/5">
                        <p className="text-xs text-gray-500 text-center">
                            Showing {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                )}
            </div>
        </>
    );
};

export default NotificationDropdown;
