import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
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
                    <Toaster
                        position="bottom-right"
                        toastOptions={{
                            style: {
                                background: '#333',
                                color: '#fff',
                                borderRadius: '10px',
                                border: '1px solid rgba(255,255,255,0.1)',
                            },
                        }}
                    />
                    <App />
                </UserProvider>
            </AuthProvider>
        </ErrorBoundary>
    </StrictMode>,
);
