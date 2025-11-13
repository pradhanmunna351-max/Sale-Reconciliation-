
import React, { useState, useMemo } from 'react';
import { SalePurchaseCheck, SalePaymentCheck, SaleReturnCheck } from '../types';
import { Column, DataTable } from './DataTable';

interface ReconciliationProps {
    salePurchaseData: SalePurchaseCheck[];
    salePaymentData: SalePaymentCheck[];
    saleReturnData: SaleReturnCheck[];
}

const salePurchaseColumns: Column<SalePurchaseCheck>[] = [
    { header: 'Sales Invoice ID', accessor: 'Invoice ID' },
    { header: 'Sales Amount', accessor: 'Total Sales Amount', isNumeric: true },
    { header: 'Purchase Invoice ID', accessor: 'purchaseInvoiceId' },
    { header: 'Purchase Amount', accessor: 'purchaseAmount', isNumeric: true },
    { header: 'Invoice Status', accessor: 'purchaseStatus' },
];

const salePaymentColumns: Column<SalePaymentCheck>[] = [
    { header: 'New Invoice ID', accessor: 'New Invoice ID' },
    { header: 'Invoice Date', accessor: 'invoiceDate' },
    { header: 'Sales Amount', accessor: 'Total Sales Amount', isNumeric: true },
    { header: 'Amount Paid', accessor: 'totalPaid', isNumeric: true },
    { header: 'Payment Date', accessor: 'paymentDate' },
    { header: 'Payment Status', accessor: 'paymentStatus' },
    { header: 'Days Overdue', accessor: 'daysOverdue', isNumeric: true },
];

const saleReturnColumns: Column<SaleReturnCheck>[] = [
    { header: 'Payment Invoice Number', accessor: 'paymentInvoiceNumber' },
    { header: 'Return Transaction Date', accessor: 'paymentInvoiceDate' },
    { header: 'Return Status', accessor: 'returnStatus' },
    { header: 'Invoice No.', accessor: 'saleReturnInvoiceNo' },
    { header: 'Return Qty', accessor: 'returnQty', isNumeric: true },
    { header: 'Return Value', accessor: 'returnValue', isNumeric: true },
];


type ReconciliationView = 'salePurchase' | 'salePayment' | 'saleReturn';

export const Reconciliation: React.FC<ReconciliationProps> = ({ salePurchaseData, salePaymentData, saleReturnData }) => {
    const [activeView, setActiveView] = useState<ReconciliationView>('salePurchase');
    
    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-4 border-b border-gray-200 pb-2">
                <button
                    onClick={() => setActiveView('salePurchase')}
                    className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none transition-colors duration-200 ${
                        activeView === 'salePurchase'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    Sale &amp; Purchase Invoice Check
                </button>
                <button
                    onClick={() => setActiveView('salePayment')}
                    className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none transition-colors duration-200 ${
                        activeView === 'salePayment'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    Sale &amp; Payment Invoice Check
                </button>
                <button
                    onClick={() => setActiveView('saleReturn')}
                    className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none transition-colors duration-200 ${
                        activeView === 'saleReturn'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    Sale Return Check
                </button>
            </div>

            {activeView === 'salePurchase' && (
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Sale vs. Purchase Reconciliation</h2>
                    <p className="mb-4 text-gray-600">Compares Sales invoices with Purchase invoices. Rows are highlighted in light red if the invoice amounts do not match.</p>
                    <DataTable columns={salePurchaseColumns} data={salePurchaseData} tableName="Sale-Purchase-Reconciliation" />
                </div>
            )}
            
            {activeView === 'salePayment' && (
                <div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Sale vs. Payment Reconciliation</h2>
                            <p className="text-gray-600 mt-1">Checks payment status for sales invoices. Overdue invoices (45+ days) are highlighted in shades of red.</p>
                        </div>
                    </div>
                    <DataTable columns={salePaymentColumns} data={salePaymentData} tableName="Sale-Payment-Reconciliation" />
                </div>
            )}

            {activeView === 'saleReturn' && (
                 <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Sale Return Entry Check</h2>
                    <p className="mb-4 text-gray-600">Checks if "Product returns" from the payment system have a corresponding entry in the Sale Returns sheet.</p>
                    <DataTable columns={saleReturnColumns} data={saleReturnData} tableName="Sale-Return-Reconciliation" />
                </div>
            )}
        </div>
    );
};
