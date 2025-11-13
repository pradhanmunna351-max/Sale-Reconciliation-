import React from 'react';

interface DashboardCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    color?: string;
}

const colorClasses: { [key: string]: { bg: string; text: string } } = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
    green: { bg: 'bg-green-100', text: 'text-green-600' },
    indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
    pink: { bg: 'bg-pink-100', text: 'text-pink-600' },
    red: { bg: 'bg-red-100', text: 'text-red-600' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
    teal: { bg: 'bg-teal-100', text: 'text-teal-600' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
    sky: { bg: 'bg-sky-100', text: 'text-sky-600' },
    rose: { bg: 'bg-rose-100', text: 'text-rose-600' },
    default: { bg: 'bg-gray-100', text: 'text-gray-600' },
};

export const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, icon, color = 'default' }) => {
    const isHex = color.startsWith('#');
    
    const iconStyle = isHex ? { backgroundColor: `${color}20`, color: color } : {};
    const theme = !isHex ? colorClasses[color] || colorClasses.default : null;
    const iconClasses = theme ? `${theme.bg} ${theme.text}` : '';

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex items-center space-x-4">
            <div
                className={`p-3 rounded-full ${iconClasses}`}
                style={iconStyle}
            >
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
        </div>
    );
};