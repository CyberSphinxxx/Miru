import { useLocation, useNavigate } from 'react-router-dom';

interface SubNavItem {
    label: string;
    path: string;
    icon?: React.ReactNode;
}

interface SubNavProps {
    items: SubNavItem[];
    className?: string;
}

/**
 * SubNav Component
 * 
 * A reusable sub-navigation bar that appears below the main Navbar.
 * Used for secondary navigation on Anime and Manga pages.
 */
const SubNav: React.FC<SubNavProps> = ({ items, className = '' }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const isActive = (path: string) => {
        // Exact match or starts with path (for genre details)
        return location.pathname === path ||
            (path !== '/anime' && location.pathname.startsWith(path));
    };

    return (
        <div className={`w-full py-3 ${className}`}>
            <div className="container mx-auto px-6">
                <div
                    className="inline-flex items-center gap-2 p-1.5 rounded-xl border border-white/10"
                    style={{
                        background: 'rgba(20, 20, 20, 0.8)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                    }}
                >
                    {items.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${isActive(item.path)
                                    ? 'bg-miru-accent text-white shadow-lg shadow-miru-accent/30'
                                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SubNav;
