import React, { useState } from 'react';

interface ProfileHeaderProps {
    currentUser: any;
    logout: () => void;
    navigate: (path: string) => void;
}

const BANNER_URL = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1920&q=80';

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ currentUser, logout, navigate }) => {
    const [bannerLoaded, setBannerLoaded] = useState(false);
    const [bannerError, setBannerError] = useState(false);

    return (
        <>
            {/* Banner Header */}
            <div className="relative h-64 md:h-72 overflow-hidden">
                {/* Gradient fallback — always visible underneath */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/60 via-miru-bg to-pink-900/40" />

                {/* External image — lazy-loaded with error handling */}
                {!bannerError && (
                    <img
                        src={BANNER_URL}
                        alt=""
                        loading="lazy"
                        onLoad={() => setBannerLoaded(true)}
                        onError={() => setBannerError(true)}
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                            bannerLoaded ? 'opacity-100' : 'opacity-0'
                        }`}
                    />
                )}

                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/60 via-miru-bg/50 to-pink-900/40" />
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-miru-bg to-transparent" />
            </div>

            {/* Profile Card */}
            <div className="bg-miru-surface/80 backdrop-blur-xl border border-white/10 rounded-t-2xl p-6 shadow-2xl relative z-10 -mt-24 mx-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* Avatar */}
                    <div className="relative -mt-16 flex-shrink-0">
                        <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden border-4 border-miru-bg shadow-2xl shadow-purple-500/20 bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                            {currentUser?.photoURL ? (
                                <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-4xl font-black text-white/90">
                                    {currentUser?.displayName?.charAt(0) || 'U'}
                                </span>
                            )}
                        </div>
                        {/* Online indicator — positioned relative to rounded-2xl corner */}
                        <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-miru-bg" />
                    </div>

                    {/* User Info */}
                    <div className="flex-1 text-center md:text-left min-w-0">
                        <h1 className="text-2xl md:text-3xl font-black text-white mb-1 truncate">
                            {currentUser?.displayName || 'Guest User'}
                        </h1>
                        <p className="text-gray-400 text-sm truncate">
                            {currentUser ? currentUser.email : 'Sign in to sync your progress across devices'}
                        </p>
                    </div>

                    {/* Action Buttons — grouped with ml-auto for proper alignment */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        {currentUser && (
                            <button
                                onClick={() => logout()}
                                className="px-5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 text-red-400 hover:text-red-300 font-medium text-sm transition-all flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                                </svg>
                                Sign Out
                            </button>
                        )}
                        <button
                            onClick={() => navigate('/settings')}
                            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white font-medium text-sm transition-all flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Settings
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProfileHeader;
