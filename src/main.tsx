import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { UserProvider } from './context/UserContext';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ErrorBoundary>
            <AuthProvider>
                <UserProvider>
                    <App />
                </UserProvider>
            </AuthProvider>
        </ErrorBoundary>
    </StrictMode>,
);
