import React from 'react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', text }) => {
    const sizeClasses = {
        sm: 'w-6 h-6 border-2',
        md: 'w-10 h-10 border-2',
        lg: 'w-14 h-14 border-3'
    };

    return (
        <div className="flex flex-col items-center justify-center gap-4">
            <div className={`${sizeClasses[size]} border-miru-accent border-t-transparent rounded-full animate-spin`} />
            {text && <p className="text-gray-400 text-sm animate-pulse">{text}</p>}
        </div>
    );
};

export default LoadingSpinner;
