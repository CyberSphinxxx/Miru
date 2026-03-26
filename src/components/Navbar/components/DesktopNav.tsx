import React from 'react';
import { ViewMode } from '../types';
import { navItems } from '../constants';

interface DesktopNavProps {
    viewMode: ViewMode;
    onViewChange: (view: ViewMode) => void;
}

const DesktopNav: React.FC<DesktopNavProps> = ({ viewMode, onViewChange }) => {
    return (
        <div className="hidden md:flex items-center gap-6">
            {navItems.map(item => (
                <button
                    key={item.id}
                    onClick={() => onViewChange(item.id)}
                    className={`flex items-center gap-2 px-2 py-2 text-sm font-medium transition-all duration-300 ${viewMode === item.id
                        ? 'nav-active-glow text-white'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    {item.icon}
                    {item.label}
                </button>
            ))}
        </div>
    );
};

export default DesktopNav;
