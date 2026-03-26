import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { ViewMode } from '../types';
import { navItems } from '../constants';

interface MobileMenuProps {
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (isOpen: boolean) => void;
    viewMode: ViewMode;
    onViewChange: (view: ViewMode) => void;
    setShowLoginModal: (show: boolean) => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    viewMode,
    onViewChange,
    setShowLoginModal
}) => {
    const { currentUser } = useAuth();

    if (!isMobileMenuOpen) return null;

    return (
        <div
            className="md:hidden mt-2 rounded-xl border border-white/10 overflow-hidden animate-fade-in"
            style={{
                background: 'rgba(10, 10, 10, 0.95)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
            }}
        >
            {navItems.map(item => (
                <button
                    key={item.id}
                    onClick={() => {
                        onViewChange(item.id);
                        setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all border-b border-white/5 ${viewMode === item.id
                        ? 'bg-miru-primary/20 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    {item.icon}
                    {item.label}
                    {viewMode === item.id && (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 ml-auto text-miru-primary">
                            <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                        </svg>
                    )}
                </button>
            ))}

            {/* Divider */}
            <div className="border-t border-white/10 my-1" />

            {/* Notifications */}
            <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all border-b border-white/5"
            >
                <div className="relative">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full"></span>
                </div>
                Notifications
            </button>

            {/* Profile / Sign In */}
            {currentUser ? (
                <button
                    onClick={() => {
                        onViewChange('profile');
                        setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all ${viewMode === 'profile'
                        ? 'bg-miru-primary/20 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <div className="w-6 h-6 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        {currentUser.photoURL ? (
                            <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-white font-bold text-xs">
                                {currentUser.displayName?.charAt(0) || 'U'}
                            </span>
                        )}
                    </div>
                    {currentUser.displayName || 'Profile'}
                    {viewMode === 'profile' && (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 ml-auto text-miru-primary">
                            <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                        </svg>
                    )}
                </button>
            ) : (
                <button
                    onClick={() => {
                        setShowLoginModal(true);
                        setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition-all"
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

export default MobileMenu;
