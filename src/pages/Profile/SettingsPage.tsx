import { useNavigate } from 'react-router-dom';
import SettingsPlayerSection from './components/Settings/SettingsPlayerSection';
import SettingsAppearanceSection from './components/Settings/SettingsAppearanceSection';
import SettingsNotificationsSection from './components/Settings/SettingsNotificationsSection';
import SettingsAdvancedSection from './components/Settings/SettingsAdvancedSection';
import SettingsShortcutsSection from './components/Settings/SettingsShortcutsSection';

const Settings = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-miru-bg pt-32 pb-12">
            <div className="container mx-auto px-6 max-w-4xl">
                <button
                    onClick={() => navigate(-1)}
                    className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 group-hover:-translate-x-1 transition-transform">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    Back
                </button>

                <h1 className="text-4xl font-bold mb-2 text-white bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                    Settings
                </h1>
                <p className="text-gray-400 mb-8">Customize your viewing experience</p>

                <div className="space-y-6">
                    <SettingsPlayerSection />
                    <SettingsAppearanceSection />
                    <SettingsNotificationsSection />
                    <SettingsAdvancedSection />
                    <SettingsShortcutsSection />
                </div>
            </div>
        </div>
    );
};

export default Settings;
