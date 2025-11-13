
import React, { useState, useMemo, useEffect } from 'react';
import { useDataStore } from './hooks/useDataStore';
import { FileUpload } from './components/FileUpload';
import { Dashboard } from './components/Dashboard';
import { Reconciliation } from './components/Reconciliation';
import { DataTable, Column } from './components/DataTable';
import { Sale, Purchase, SaleReturn, PurchaseReturn, PaymentInvoice, PaymentSummary, Payable, AllData } from './types';
import { Loader } from './components/Loader';
import { parseMonthYear } from './utils/helpers';

const TABS = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'reconciliation', label: 'Reconciliation' },
    { id: 'sales', label: 'Sales' },
    { id: 'purchases', label: 'Purchases' },
    { id: 'saleReturns', label: 'Sale Returns' },
    { id: 'purchaseReturns', label: 'Purchase Returns' },
    { id: 'paymentInvoices', label: 'Payment Invoices' },
    { id: 'paymentSummary', label: 'Payment Summary' },
    { id: 'payables', label: 'Payables' },
];

type TabId = typeof TABS[number]['id'];

// Comprehensive column definitions to match user's Excel files
const salesColumns: Column<Sale>[] = [
    { header: 'Partner', accessor: 'Partner' },
    { header: 'Invoice ID', accessor: 'Invoice ID' },
    { header: 'New Invoice ID', accessor: 'New Invoice ID' },
    { header: 'Invoice Type', accessor: 'Invoice Type' },
    { header: 'IRN Number', accessor: 'IRN Number' },
    { header: 'Month', accessor: 'Month' },
    { header: 'Invoice Date', accessor: 'Invoice Date' },
    { header: 'Warehouse Name', accessor: 'Warehouse Name' },
    { header: 'Warehouse Code', accessor: 'Warehouse Code' },
    { header: 'GST No', accessor: 'GST No' },
    { header: 'Box Count', accessor: 'Box Count', isNumeric: true },
    { header: 'Sales Without Tax Amount', accessor: 'Sales Without Tax Amount', isNumeric: true },
    { header: 'Total Tax', accessor: 'Total Tax', isNumeric: true },
    { header: 'Total Sales Amount', accessor: 'Total Sales Amount', isNumeric: true },
    { header: 'Total Quantity', accessor: 'Total Quantity', isNumeric: true },
    { header: 'Status', accessor: 'Status' },
];

const purchaseColumns: Column<Purchase>[] = [
    { header: 'Company', accessor: 'Company' },
    { header: 'Order No', accessor: 'Order No' },
    { header: 'Invoice ID', accessor: 'Invoice ID' },
    { header: 'Invoice Type', accessor: 'Invoice Type' },
    { header: 'Month', accessor: 'Month' },
    { header: 'Invoice Date', accessor: 'Invoice Date' },
    { header: 'Warehouse Name', accessor: 'Warehouse Name' },
    { header: 'Warehouse Code', accessor: 'Warehouse Code' },
    { header: 'GST No', accessor: 'GST No' },
    { header: 'Total Without Tax', accessor: 'Total Without Tax', isNumeric: true },
    { header: 'Total Tax', accessor: 'Total Tax', isNumeric: true },
    { header: 'TDS Amount', accessor: 'TDS Amount', isNumeric: true },
    { header: 'Adjustment Amount', accessor: 'Adjustment Amount', isNumeric: true },
    { header: 'Total With Tax', accessor: 'Total With Tax', isNumeric: true },
    { header: 'Total Quantity', accessor: 'Total Quantity', isNumeric: true },
    { header: 'Status', accessor: 'Status' },
];

const saleReturnColumns: Column<SaleReturn>[] = [
    { header: 'Partner', accessor: 'Partner' },
    { header: 'Channel', accessor: 'Channel' },
    { header: 'Return No.', accessor: 'Return No.' },
    { header: 'Invoice No', accessor: 'Invoice No' },
    { header: 'Seller Name', accessor: 'Seller Name' },
    { header: 'Seller Code', accessor: 'Seller Code' },
    { header: 'Month', accessor: 'Month' },
    { header: 'Return Date', accessor: 'Return Date' },
    { header: 'Post Date', accessor: 'Post Date' },
    { header: 'Return ID', accessor: 'Return ID' },
    { header: 'GST Invoice Number', accessor: 'GST Invoice Number' },
    { header: 'Tracking', accessor: 'Tracking' },
    { header: 'Courier', accessor: 'Courier' },
    { header: 'Total Qty', accessor: 'Total Qty', isNumeric: true },
    { header: 'Carton Count', accessor: 'Carton Count', isNumeric: true },
    { header: 'Total Without Tax', accessor: 'Total Without Tax', isNumeric: true },
    { header: 'Total Tax', accessor: 'Total Tax', isNumeric: true },
    { header: 'Adjustment Amount', accessor: 'Adjustment Amount', isNumeric: true },
    { header: 'Total With Tax', accessor: 'Total With Tax', isNumeric: true },
    { header: 'Status', accessor: 'Status' },
];

const purchaseReturnColumns: Column<PurchaseReturn>[] = [
    { header: 'Sale Return Number', accessor: 'Sale Return Number' },
    { header: 'Purchase Return No.', accessor: 'Purchase Return No.' },
    { header: 'Invoice No', accessor: 'Invoice No' },
    { header: 'Seller Name', accessor: 'Seller Name' },
    { header: 'Seller Code', accessor: 'Seller Code' },
    { header: 'Month', accessor: 'Month' },
    { header: 'Return Date', accessor: 'Return Date' },
    { header: 'Post Date', accessor: 'Post Date' },
    { header: 'Return ID', accessor: 'Return ID' },
    { header: 'Channel', accessor: 'Channel' },
    { header: 'Warehouse Code', accessor: 'Warehouse Code' },
    { header: 'Total Without Tax', accessor: 'Total Without Tax', isNumeric: true },
    { header: 'Total Tax', accessor: 'Total Tax', isNumeric: true },
    { header: 'Total With Tax', accessor: 'Total With Tax', isNumeric: true },
    { header: 'Total Quantity', accessor: 'Total Quantity', isNumeric: true },
    { header: 'Box No', accessor: 'Box No' },
    { header: 'Seller Return Tracking No', accessor: 'Seller Return Tracking No' },
    { header: 'Status', accessor: 'Status' },
    { header: 'System Tracking Id', accessor: 'System Tracking Id' },
    { header: 'Seller Tracking Id', accessor: 'Seller Tracking Id' },
];

const paymentInvoiceColumns: Column<PaymentInvoice>[] = [
    { header: 'Payment Number', accessor: 'Payment Number' },
    { header: 'Invoice Number', accessor: 'Invoice Number' },
    { header: 'Month', accessor: 'Month' },
    { header: 'Invoice Date', accessor: 'Invoice Date' },
    { header: 'Transaction type', accessor: 'Transaction type' },
    { header: 'Transaction Description', accessor: 'Transaction Description' },
    { header: 'Reference Details', accessor: 'Reference Details' },
    { header: 'Original Invoice Number', accessor: 'Original Invoice Number' },
    { header: 'Invoice Amount', accessor: 'Invoice Amount', isNumeric: true },
    { header: 'Invoice Currency', accessor: 'Invoice Currency' },
    { header: 'Withholding Amount', accessor: 'Withholding Amount', isNumeric: true },
    { header: 'Terms Discount Taken', accessor: 'Terms Discount Taken', isNumeric: true },
    { header: 'Amount Paid', accessor: 'Amount Paid', isNumeric: true },
    { header: 'Remaining Amount', accessor: 'Remaining Amount', isNumeric: true },
];

const paymentSummaryColumns: Column<PaymentSummary>[] = [
    { header: 'Payment Number', accessor: 'Payment Number' },
    { header: 'Month', accessor: 'Month' },
    { header: 'Payment Date', accessor: 'Payment Date' },
    { header: 'Invoice Currency', accessor: 'Invoice Currency' },
    { header: 'Amount in Invoice Currency', accessor: 'Amount in Invoice Currency', isNumeric: true },
    { header: 'Payment Currency', accessor: 'Payment Currency' },
    { header: 'Amount in Payment Currency', accessor: 'Amount in Payment Currency', isNumeric: true },
    { header: 'Exchange Rate', accessor: 'Exchange Rate', isNumeric: true },
    { header: 'Payment Type', accessor: 'Payment Type' },
    { header: 'Payment Status', accessor: 'Payment Status' },
    { header: 'Payment Voided Reason', accessor: 'Payment Voided Reason' },
    { header: 'Payment Number2', accessor: 'Payment Number2' },
    { header: 'Bank Amount', accessor: 'Bank Amount', isNumeric: true },
    { header: 'Diff', accessor: 'Diff', isNumeric: true },
];

const payableColumns: Column<Payable>[] = [
    { header: 'Type', accessor: 'Type' },
    { header: 'status', accessor: 'status' },
    { header: 'Month', accessor: 'Month' },
    { header: 'transaction_date', accessor: 'transaction_date' },
    { header: 'transaction_number', accessor: 'transaction_number' },
    { header: 'Party Code', accessor: 'Party Code' },
    { header: 'vendor_name', accessor: 'vendor_name' },
    { header: 'transaction_type', accessor: 'transaction_type' },
    { header: 'customer_name', accessor: 'customer_name' },
    { header: 'bcy_total', accessor: 'bcy_total', isNumeric: true },
    { header: 'bcy_balance', accessor: 'bcy_balance', isNumeric: true },
    { header: 'transaction_id', accessor: 'transaction_id' },
    { header: 'vendor_id', accessor: 'vendor_id' },
    { header: 'customer_id', accessor: 'customer_id' },
    { header: 'currency_code', accessor: 'currency_code' },
    { header: 'currency_id', accessor: 'currency_id' },
    { header: 'receipt_name', accessor: 'receipt_name' },
];

const LOADING_MESSAGES = [
    "Processing data, please wait...",
    "Analyzing sales data...",
    "Cross-referencing purchases...",
    "Calculating key metrics...",
    "Building dashboard...",
    "Almost there..."
];

const App: React.FC = () => {
    const {
        data,
        loadData,
        clearData,
        isLoading,
        progress,
        metrics: calculateMetrics, // Renaming to avoid conflict
        enrichedSales,
        cancelLoad,
        salePurchaseCheckData,
        salePaymentCheckData,
        saleReturnCheckData,
    } = useDataStore();

    const [activeTab, setActiveTab] = useState<TabId>('dashboard');
    const [selectedMonth, setSelectedMonth] = useState<string>('All Months');
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
    const [transactionTypeFilter, setTransactionTypeFilter] = useState('');
    const [transactionDescFilter, setTransactionDescFilter] = useState('');

    const transactionTypeOptions = [
        "Financial Debit Note Invoice", "Invoice", "GST Debit Note", "GST Credit Note",
        "Provision deduction", "Provision reversal", "Others"
    ];
    const transactionDescOptions = [
        "Allowance – Discounts received", "Product returns", "COOP – Service agreement",
        "Provision for aged receivable", "Payments", "Quantity shortage",
        "Quantity shortage reversal", "Provision for to be billed receivable",
        "Price variance reversal", "Price variance", "COOP"
    ];

    useEffect(() => {
        if (isLoading) {
            const interval = setInterval(() => {
                setLoadingMessageIndex((prevIndex) => (prevIndex + 1) % LOADING_MESSAGES.length);
            }, 2000);
            return () => clearInterval(interval);
        }
    }, [isLoading]);

    useEffect(() => {
        // Reset specific filters when tab changes
        if (activeTab !== 'paymentInvoices') {
            setTransactionTypeFilter('');
            setTransactionDescFilter('');
        }
    }, [activeTab]);

    const uniqueMonths = useMemo(() => {
        const months = new Set<string>();
        // Iterate over all datasets in 'data'
        (Object.values(data) as any[][]).flat().forEach(row => {
            if (row && row.Month) {
                months.add(row.Month);
            }
        });
        
        const monthArray = Array.from(months);

        // Sort months chronologically
        monthArray.sort((a, b) => {
            const dateA = parseMonthYear(a);
            const dateB = parseMonthYear(b);

            if (dateA && dateB) {
                return dateA.getTime() - dateB.getTime();
            }
            // Fallback for unparseable month strings
            return a.localeCompare(b);
        });

        return ['All Months', ...monthArray];
    }, [data]);

    const filteredData = useMemo(() => {
        if (selectedMonth === 'All Months') {
            return data;
        }
        const newFilteredData: AllData = {
            sales: [],
            purchases: [],
            saleReturns: [],
            purchaseReturns: [],
            paymentSummaries: [],
            paymentInvoices: [],
            payables: [],
        };
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                 (newFilteredData as any)[key] = (data as any)[key].filter((row: any) => row.Month === selectedMonth);
            }
        }
        return newFilteredData;
    }, [data, selectedMonth]);

    const metrics = useMemo(() => {
        const relevantEnrichedSales = enrichedSales.filter(s => selectedMonth === 'All Months' || s.Month === selectedMonth);
        return calculateMetrics(filteredData, relevantEnrichedSales);
    }, [filteredData, enrichedSales, selectedMonth, calculateMetrics]);

    const filteredPaymentInvoices = useMemo(() => {
        let data = filteredData.paymentInvoices;
        if (transactionTypeFilter) {
            data = data.filter(row => row['Transaction type'] === transactionTypeFilter);
        }
        if (transactionDescFilter) {
            data = data.filter(row => row['Transaction Description'] === transactionDescFilter);
        }
        return data;
    }, [filteredData.paymentInvoices, transactionTypeFilter, transactionDescFilter]);

    
    const renderContent = () => {
        const filteredSalePurchaseCheck = salePurchaseCheckData.filter(s => selectedMonth === 'All Months' || s.Month === selectedMonth);
        const filteredSalePaymentCheck = salePaymentCheckData.filter(s => selectedMonth === 'All Months' || s.Month === selectedMonth);
        // FIX: Used 'Month' property for filtering to align with the consistent data model.
        const filteredSaleReturnCheck = saleReturnCheckData.filter(s => selectedMonth === 'All Months' || s.Month === selectedMonth);

        switch(activeTab) {
            case 'dashboard':
                return <Dashboard metrics={metrics} />;
            case 'reconciliation':
                return <Reconciliation 
                            salePurchaseData={filteredSalePurchaseCheck} 
                            salePaymentData={filteredSalePaymentCheck}
                            saleReturnData={filteredSaleReturnCheck}
                        />;
            case 'sales':
                return <DataTable columns={salesColumns} data={filteredData.sales} tableName="Sales Data" />;
            case 'purchases':
                return <DataTable columns={purchaseColumns} data={filteredData.purchases} tableName="Purchases Data" />;
            case 'saleReturns':
                return <DataTable columns={saleReturnColumns} data={filteredData.saleReturns} tableName="Sale Returns Data" />;
            case 'purchaseReturns':
                return <DataTable columns={purchaseReturnColumns} data={filteredData.purchaseReturns} tableName="Purchase Returns Data" />;
            case 'paymentInvoices':
                return (
                    <div className="space-y-4">
                         <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <label htmlFor="transactionType" className="block text-sm font-medium text-gray-700">Transaction Type</label>
                                <select
                                    id="transactionType"
                                    value={transactionTypeFilter}
                                    onChange={(e) => setTransactionTypeFilter(e.target.value)}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                >
                                    <option value="">All Types</option>
                                    {transactionTypeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                            <div className="flex-1">
                                 <label htmlFor="transactionDesc" className="block text-sm font-medium text-gray-700">Transaction Description</label>
                                 <select
                                    id="transactionDesc"
                                    value={transactionDescFilter}
                                    onChange={(e) => setTransactionDescFilter(e.target.value)}
                                     className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                >
                                    <option value="">All Descriptions</option>
                                    {transactionDescOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                        </div>
                        <DataTable columns={paymentInvoiceColumns} data={filteredPaymentInvoices} tableName="Payment Invoices Data" />
                    </div>
                );
            case 'paymentSummary':
                return <DataTable columns={paymentSummaryColumns} data={filteredData.paymentSummaries} tableName="Payment Summary Data" />;
            case 'payables':
                return <DataTable columns={payableColumns} data={filteredData.payables} tableName="Payables Data" />;
            default:
                return null;
        }
    }

    return (
        <div className="bg-gray-50 min-h-screen font-sans">
            <div className="sticky top-0 z-40 bg-gray-50/95 backdrop-blur-sm border-b border-gray-200">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                     <header className="py-4">
                        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                            <h1 className="text-3xl font-bold text-gray-800">Sales Reconciliation Dashboard</h1>
                            <div className="flex items-center space-x-2 flex-wrap justify-center sm:justify-end">
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    disabled={isLoading || uniqueMonths.length <= 1}
                                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm disabled:opacity-50"
                                >
                                    {uniqueMonths.map(month => (
                                        <option key={month} value={month}>{month}</option>
                                    ))}
                                </select>
                                <FileUpload onFileUpload={loadData} isLoading={isLoading} onCancel={cancelLoad} />
                                <button
                                    onClick={clearData}
                                    disabled={isLoading}
                                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? 'Processing...' : 'Clear All Data'}
                                </button>
                            </div>
                        </div>
                    </header>
                    <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`${
                                    activeTab === tab.id
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm focus:outline-none`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <main>
                    {isLoading && (
                       <Loader progress={progress} message={LOADING_MESSAGES[loadingMessageIndex]} />
                    )}
                    
                    <div>
                        {renderContent()}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;
