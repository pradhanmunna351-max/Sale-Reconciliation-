import React from 'react';

interface BarChartData {
    label: string;
    value: number;
    color: string;
}

interface BarChartProps {
    data: BarChartData[];
}

export const BarChart: React.FC<BarChartProps> = ({ data }) => {
    if (!data || data.length === 0) {
        return <div className="text-center text-gray-500">No data to display</div>;
    }
    
    const maxValue = Math.max(...data.map(d => d.value), 0);
    const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

    return (
        <div className="w-full h-80 p-4">
            <svg width="100%" height="100%" viewBox={`0 0 500 300`} preserveAspectRatio="xMidYMid meet">
                {/* Y-axis labels */}
                <text x="0" y="20" fill="#6B7280" fontSize="12">{formatCurrency(maxValue)}</text>
                <line x1="40" y1="20" x2="500" y2="20" stroke="#E5E7EB" strokeDasharray="2,2" />

                <text x="0" y="150" fill="#6B7280" fontSize="12">{formatCurrency(maxValue / 2)}</text>
                <line x1="40" y1="150" x2="500" y2="150" stroke="#E5E7EB" strokeDasharray="2,2" />
                
                <text x="0" y="280" fill="#6B7280" fontSize="12">₹0</text>
                <line x1="40" y1="280" x2="500" y2="280" stroke="#4B5563" />

                {/* Bars */}
                {data.map((item, index) => {
                    const barHeight = maxValue === 0 ? 0 : (item.value / maxValue) * 260;
                    const x = 60 + index * 150;
                    const y = 280 - barHeight;

                    return (
                        <g key={item.label} className="group">
                             <title>{`${item.label}: ${formatCurrency(item.value)}`}</title>
                             <rect
                                x={x}
                                y={y}
                                width="100"
                                height={barHeight}
                                fill={item.color}
                                rx="8"
                                className="transition-opacity duration-300 group-hover:opacity-80"
                            />
                            <text 
                                x={x + 50} 
                                y={y - 10} 
                                textAnchor="middle" 
                                fill="#111827" 
                                fontSize="14"
                                fontWeight="bold"
                                className="opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                            >
                                {formatCurrency(item.value)}
                            </text>
                             <text x={x + 50} y="295" textAnchor="middle" fill="#374151" fontSize="14">
                                {item.label}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};