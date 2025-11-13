import React from 'react';

interface DonutChartData {
    name: string;
    value: number;
    color: string;
}

interface DonutChartProps {
    data: DonutChartData[];
    title: string;
    totalValue: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({ data, title, totalValue }) => {
    if (!data || data.length === 0) {
        return <div className="text-center text-gray-500">No data to display</div>;
    }
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    let accumulatedAngle = 0;

    return (
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <div className="relative">
                <svg width="160" height="160" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r={radius} fill="transparent" stroke="#E5E7EB" strokeWidth="20" />
                    {data.map((item, index) => {
                        if (total === 0) return null;
                        const percentage = item.value / total;
                        const strokeDashoffset = accumulatedAngle * circumference;
                        const strokeDasharray = `${percentage * circumference} ${circumference}`;
                        accumulatedAngle += percentage;
                        return (
                             <g key={index} className="group">
                                <title>{`${item.name}: ${formatCurrency(item.value)} (${(percentage * 100).toFixed(1)}%)`}</title>
                                <circle
                                    cx="100"
                                    cy="100"
                                    r={radius}
                                    fill="transparent"
                                    stroke={item.color}
                                    strokeWidth="20"
                                    strokeDasharray={strokeDasharray}
                                    strokeDashoffset={strokeDashoffset}
                                    transform="rotate(-90 100 100)"
                                    className="transition-opacity duration-300 group-hover:opacity-80"
                                />
                            </g>
                        );
                    })}
                </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-sm text-gray-500">{title}</span>
                    <span className="text-xl font-bold text-gray-800">{formatCurrency(totalValue)}</span>
                </div>
            </div>
            <div className="space-y-2">
                {data.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <div className="flex justify-between w-36 text-sm">
                            <span className="text-gray-600">{item.name}</span>
                            <span className="font-semibold text-gray-800">{total > 0 ? `${((item.value / total) * 100).toFixed(1)}%` : '0.0%'}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};