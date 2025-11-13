import React from 'react';
import { DashboardCard } from './DashboardCard';
import { DashboardMetrics } from '../types';
import { BarChart } from './BarChart';
import { DonutChart } from './DonutChart';
import { 
    CubeIcon, ShoppingCartIcon, CurrencyRupeeIcon, ArrowUturnLeftIcon, 
    BanknotesIcon, ChartBarIcon, ChartPieIcon, ArrowTrendingUpIcon, ClockIcon 
} from './icons';

interface DashboardProps {
    metrics: DashboardMetrics;
}

// New color palette provided by the user
const PALETTE = {
    primaryDark: '#4B49AC',
    primaryLight: '#98BDFF',
    supportBlue: '#7DA0FA',
    supportPurple: '#7978E9',
    supportRed: '#F3797E',
};

export const Dashboard: React.FC<DashboardProps> = ({ metrics }) => {
    const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    const formatNumber = (value: number) => value.toLocaleString('en-IN');
    const formatPercentage = (value: number) => `${value.toFixed(2)}%`;

    const barChartData = [
        { label: 'Net Sales', value: metrics.netSaleValue, color: PALETTE.primaryDark },
        { label: 'Net Purchases', value: metrics.netPurchaseValue, color: PALETTE.primaryLight },
        { label: 'Gross Profit', value: metrics.grossProfit, color: PALETTE.supportPurple },
    ];

    const salesDonutData = [
        { name: 'Net Sales', value: metrics.netSaleValue, color: PALETTE.primaryDark },
        { name: 'Returns', value: metrics.salesReturnValue, color: PALETTE.supportRed }
    ];

    const purchaseDonutData = [
        { name: 'Net Purchases', value: metrics.netPurchaseValue, color: PALETTE.primaryLight },
        { name: 'Returns', value: metrics.purchaseReturnValue, color: PALETTE.supportRed }
    ];

    const metricCards = [
        { title: 'Gross Profit', value: formatCurrency(metrics.grossProfit), icon: <BanknotesIcon />, color: PALETTE.primaryDark },
        { title: 'Gross Profit %', value: formatPercentage(metrics.grossProfitPercentage), icon: <ChartPieIcon />, color: PALETTE.supportPurple },
        { title: 'Net Sale Value', value: formatCurrency(metrics.netSaleValue), icon: <ArrowTrendingUpIcon />, color: PALETTE.primaryDark },
        { title: 'Net Purchase Value', value: formatCurrency(metrics.netPurchaseValue), icon: <ShoppingCartIcon />, color: PALETTE.primaryLight },
        { title: 'Sales Return %', value: formatPercentage(metrics.salesReturnPercentage), icon: <ArrowUturnLeftIcon />, color: PALETTE.supportRed },
        { title: 'Purchase Return %', value: formatPercentage(metrics.purchaseReturnPercentage), icon: <ArrowUturnLeftIcon />, color: PALETTE.supportRed },
        { title: 'Outstanding', value: formatCurrency(metrics.outstanding), icon: <ClockIcon />, color: '#DC2626' }, // Keep a strong red for outstanding
        { title: 'Payable', value: formatCurrency(metrics.payable), icon: <BanknotesIcon />, color: '#F97316' }, // Keep orange for payable
        { title: 'Avg. Monthly Sales', value: formatCurrency(metrics.avgMonthlySales), icon: <ChartBarIcon />, color: PALETTE.supportBlue },
        { title: 'Sales Quantity', value: formatNumber(metrics.salesQuantity), icon: <CubeIcon />, color: PALETTE.primaryDark },
        { title: 'Purchase Quantity', value: formatNumber(metrics.purchaseQuantity), icon: <ShoppingCartIcon />, color: PALETTE.primaryLight },
        { title: 'Amount Paid', value: formatCurrency(metrics.amountPaid), icon: <BanknotesIcon />, color: '#16A34A' }, // Keep green for paid
    ];
    
    return (
        <div className="space-y-8">
            {/* Metrics Card Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {metricCards.map(card => (
                    <DashboardCard key={card.title} title={card.title} value={card.value} icon={card.icon} color={card.color} />
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                     <h3 className="text-xl font-bold text-gray-800 mb-4">Key Financials Overview</h3>
                     <BarChart data={barChartData} />
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Sales Breakdown</h3>
                    <DonutChart data={salesDonutData} title="Total Sales" totalValue={metrics.salesValue} />
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Purchase Breakdown</h3>
                    <DonutChart data={purchaseDonutData} title="Total Purchases" totalValue={metrics.purchaseValue} />
                </div>
            </div>
        </div>
    );
};