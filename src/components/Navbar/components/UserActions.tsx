import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNotifications } from '../../../context/NotificationContext';
import NotificationDropdown from '../../NotificationDropdown';
import { ViewMode } from '../types';

interface UserActionsProps {
    viewMode: ViewMode;
    onViewChange: (view: ViewMode) => void;
    setShowLoginModal: (show: boolean) => void;
}

const UserActions: React.FC<UserActionsProps> = ({ viewMode, onViewChange, setShowLoginModal }) => {
    const { currentUser } = useAuth();
    const { unreadCount } = useNotifications();
    const [showNotifications, setShowNotifications] = useState(false);

    return (
        <div className="hidden md:flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
                <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 group"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                    {/* Notification Badge */}
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-xs font-bold bg-purple-500 text-white rounded-full">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
                <NotificationDropdown
                    isOpen={showNotifications}
                    onClose={() => setShowNotifications(false)}
                    onNavigate={(url) => {
                        if (url.startsWith('/watch/')) {
                            window.location.href = url;
                        }
                    }}
                />
            </div>

            {/* Avatar / Sign In */}
            {currentUser ? (
                <button
                    onClick={() => onViewChange('profile')}
                    className={`relative w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center border-2 transition-all duration-300 group ${viewMode === 'profile'
                        ? 'border-purple-500 shadow-lg shadow-purple-500/30'
                        : 'border-white/10 hover:border-purple-500/50'
                        }`}
                    title={currentUser.displayName || 'Profile'}
                >
                    {currentUser.photoURL ? (
                        <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <>
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 opacity-80 group-hover:opacity-100 transition-opacity"></div>
                            <span className="relative z-10 text-white font-bold text-sm">
                                {currentUser.displayName?.charAt(0) || 'U'}
                            </span>
                        </>
                    )}
                </button>
            ) : (
                <button
                    onClick={() => setShowLoginModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-purple-500/25"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                    Sign In
                </button>
            )}
        </div>
    );
};

export default UserActions;
