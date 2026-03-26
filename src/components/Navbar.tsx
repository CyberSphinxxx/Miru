import React, { useState, useEffect } from 'react';
import LoginModal from './LoginModal';
import { ViewMode, SearchType } from './Navbar/types';
import SearchBar from './Navbar/components/SearchBar';
import DesktopNav from './Navbar/components/DesktopNav';
import UserActions from './Navbar/components/UserActions';
import MobileMenu from './Navbar/components/MobileMenu';

export type { ViewMode, SearchType };

interface NavbarProps {
    onSearch: (query: string, type?: SearchType) => void;
    viewMode: ViewMode;
    onViewChange: (view: ViewMode) => void;
}

const Navbar: React.FC<NavbarProps> = ({ onSearch, viewMode, onViewChange }) => {
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Close mobile menu when view changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [viewMode]);

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-6 py-3 sm:py-4">
                <div className="max-w-7xl mx-auto">
                    {/* Floating Glass Header */}
                    <div
                        className="rounded-2xl px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-6 border border-white/10"
                        style={{
                            background: 'rgba(10, 10, 10, 0.7)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                        }}
                    >
                        <div className="flex items-center gap-6">
                            {/* Logo */}
                            <button
                                onClick={() => onViewChange('home')}
                                className="flex items-center gap-2 sm:gap-3 group flex-shrink-0"
                            >
                                <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-miru-primary to-miru-accent flex items-center justify-center shadow-lg group-hover:shadow-miru-primary/30 transition-shadow duration-300">
                                    <img src="/miru-icon.svg" alt="Miru Logo" className="w-full h-full object-contain" />
                                </div>
                                <span className="text-xl sm:text-2xl font-black tracking-tight text-gradient hidden xs:block">MIRU</span>
                            </button>

                            {/* Desktop Navigation - Hidden on mobile */}
                            <DesktopNav viewMode={viewMode} onViewChange={onViewChange} />
                        </div>

                        {/* Search + User Actions */}
                        <div className="flex items-center gap-2 sm:gap-4 flex-1 md:flex-none justify-end">
                            {/* Search */}
                            <SearchBar onSearch={onSearch} setIsMobileMenuOpen={setIsMobileMenuOpen} />

                            {/* User Actions - Notifications and Avatar/Login */}
                            <UserActions viewMode={viewMode} onViewChange={onViewChange} setShowLoginModal={setShowLoginModal} />

                            {/* Mobile Menu Toggle - Visible only on mobile */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="md:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                                aria-label="Toggle menu"
                            >
                                {isMobileMenuOpen ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-400">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-400">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation Dropdown */}
                <MobileMenu
                    isMobileMenuOpen={isMobileMenuOpen}
                    setIsMobileMenuOpen={setIsMobileMenuOpen}
                    viewMode={viewMode}
                    onViewChange={onViewChange}
                    setShowLoginModal={setShowLoginModal}
                />
            </nav>

            {/* Login Modal */}
            <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
        </>
    );
};

export default Navbar;
