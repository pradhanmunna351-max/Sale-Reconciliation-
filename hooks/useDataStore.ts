
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
    AllData,
    DataType,
    Sale,
    Purchase,
    SaleReturn,
    PurchaseReturn,
    PaymentSummary,
    PaymentInvoice,
    Payable,
    EnrichedSale,
    SalePurchaseCheck,
    SalePaymentCheck,
    SaleReturnCheck,
    DashboardMetrics,
    CsvRow
} from '../types';
import { parseFile, toNumber } from '../utils/helpers';
import { loadAllData as dbLoadAllData, saveData as dbSaveData, clearAllData as dbClearAllData } from '../utils/db';

const initialData: AllData = {
    sales: [],
    purchases: [],
    saleReturns: [],
    purchaseReturns: [],
    paymentSummaries: [],
    paymentInvoices: [],
    payables: [],
};

// This custom hook manages all application data, loading, and processing.
export const useDataStore = () => {
    const [data, setData] = useState<AllData>(initialData);
    const [isLoading, setIsLoading] = useState(true); // Start true to load from DB
    const [progress, setProgress] = useState(0);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Load data from IndexedDB on initial mount
    useEffect(() => {
        const loadPersistedData = async () => {
            setIsLoading(true);
            try {
                const persistedData = await dbLoadAllData();
                setData(persistedData);
            } catch (error) {
                console.error("Failed to load data from IndexedDB", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadPersistedData();
    }, []);

    // Generic function to cast parsed CSV data to a more specific type.
    const mapData = <T extends CsvRow>(rows: CsvRow[]): T[] => {
        return rows as T[];
    };

    const loadData = useCallback(async (dataType: DataType, file: File) => {
        setIsLoading(true);
        setProgress(0);
        abortControllerRef.current = new AbortController();

        try {
            const parsedData = await parseFile(file, setProgress, abortControllerRef.current.signal);
            
            await dbSaveData(dataType, parsedData);

            setData(prevData => {
                const newData = { ...prevData };
                switch (dataType) {
                    case DataType.Sales:
                        newData.sales = mapData<Sale>(parsedData);
                        break;
                    case DataType.Purchases:
                        newData.purchases = mapData<Purchase>(parsedData);
                        break;
                    case DataType.SaleReturns:
                        newData.saleReturns = mapData<SaleReturn>(parsedData);
                        break;
                    case DataType.PurchaseReturns:
                        newData.purchaseReturns = mapData<PurchaseReturn>(parsedData);
                        break;
                    case DataType.PaymentSummaries:
                        newData.paymentSummaries = mapData<PaymentSummary>(parsedData);
                        break;
                    case DataType.PaymentInvoices:
                        newData.paymentInvoices = mapData<PaymentInvoice>(parsedData);
                        break;
                    case DataType.Payables:
                        newData.payables = mapData<Payable>(parsedData);
                        break;
                }
                return newData;
            });

        } catch (error) {
            if ((error as DOMException).name !== 'AbortError') {
                 console.error(`Error loading ${dataType} data:`, error);
            }
        } finally {
            setIsLoading(false);
            setProgress(0);
            abortControllerRef.current = null;
        }
    }, []);

    const cancelLoad = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    }, []);

    const clearData = useCallback(async () => {
        setIsLoading(true);
        try {
            await dbClearAllData();
            setData(initialData);
        } catch (error) {
            console.error("Failed to clear all data:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    const enrichedSales = useMemo<EnrichedSale[]>(() => {
        const { sales, purchases, paymentInvoices, saleReturns } = data;
        if (!sales.length) return [];
        
        const purchaseMap = new Map<string, Purchase>(purchases.map(p => [p['Invoice ID'], p]));
        const paymentMap = new Map<string, number>();
        paymentInvoices.forEach(p => {
            const invoiceId = p['Invoice Number'] || p['Original Invoice Number'];
            if (invoiceId) {
                const currentPaid = paymentMap.get(invoiceId) || 0;
                paymentMap.set(invoiceId, currentPaid + toNumber(p['Amount Paid']));
            }
        });
        const saleReturnMap = new Map<string, SaleReturn>(saleReturns.map(sr => [sr['Invoice No'], sr]));

        return sales.map(sale => {
            const saleInvoiceId = sale['Invoice ID'];
            const saleAmount = toNumber(sale['Total Sales Amount']);

            const purchaseStatus: 'Done' | 'Pending' = purchaseMap.has(saleInvoiceId) ? 'Done' : 'Pending';
            
            const totalPaid = paymentMap.get(saleInvoiceId) || 0;
            let paymentStatus: 'Paid' | 'Partial Payment' | 'Payment Pending' = 'Payment Pending';
            if (totalPaid > 0) {
                paymentStatus = totalPaid >= saleAmount ? 'Paid' : 'Partial Payment';
            }

            const returnStatus: 'Returned' | 'Pending' = saleReturnMap.has(saleInvoiceId) ? 'Returned' : 'Pending';

            return { ...sale, purchaseStatus, paymentStatus, returnStatus };
        });
    }, [data.sales, data.purchases, data.paymentInvoices, data.saleReturns]);

    const salePurchaseCheckData = useMemo<SalePurchaseCheck[]>(() => {
        const { sales, purchases } = data;
        if (!sales.length) return [];

        const purchaseMap = new Map<string, Purchase>(purchases.map(p => [p['Invoice ID'], p]));

        return sales.map(sale => {
            const matchingPurchase = purchaseMap.get(sale['Invoice ID']);
            const saleAmount = toNumber(sale['Total Sales Amount']);
            const purchaseAmount = matchingPurchase ? toNumber(matchingPurchase['Total With Tax']) : 0;

            return {
                ...sale,
                purchaseStatus: matchingPurchase ? 'Done' : 'Pending',
                purchaseInvoiceId: matchingPurchase ? matchingPurchase['Invoice ID'] : undefined,
                purchaseAmount,
                amountMismatch: !!matchingPurchase && saleAmount !== purchaseAmount,
            };
        });
    }, [data.sales, data.purchases]);
    
    const salePaymentCheckData = useMemo<SalePaymentCheck[]>(() => {
        const { sales, paymentInvoices, paymentSummaries } = data;
        if (!sales.length) return [];

        const paymentAmountMap = new Map<string, number>();
        paymentInvoices.forEach(p => {
            const invoiceId = p['Invoice Number']?.trim() || p['Original Invoice Number']?.trim();
            if (invoiceId) {
                const currentPaid = paymentAmountMap.get(invoiceId) || 0;
                paymentAmountMap.set(invoiceId, currentPaid + toNumber(p['Amount Paid']));
            }
        });
        
        const paymentDateMap = new Map<string, string>();
        const paymentSummariesMap = new Map<string, PaymentSummary>(paymentSummaries.map(ps => [ps['Payment Number']?.trim(), ps]));
        
        paymentInvoices.forEach(pi => {
            const invoiceId = pi['Invoice Number']?.trim();
            const paymentNum = pi['Payment Number']?.trim();
            if (invoiceId && paymentNum) {
                const matchingSummary = paymentSummariesMap.get(paymentNum);
                if (matchingSummary && matchingSummary['Payment Date']) {
                    paymentDateMap.set(invoiceId, matchingSummary['Payment Date']);
                }
            }
        });

        return sales.map(sale => {
            const saleInvoiceId = (sale['New Invoice ID'] || sale['Invoice ID'])?.trim();
            const saleAmount = toNumber(sale['Total Sales Amount']);
            const totalPaid = paymentAmountMap.get(saleInvoiceId) || 0;

            let paymentStatus: 'Paid' | 'Partial Payment' | 'Payment Pending' = 'Payment Pending';
            if (totalPaid > 0) {
                 const difference = Math.abs(saleAmount - totalPaid);
                 // If the difference is 10 or less, consider it fully paid to account for minor discrepancies.
                 if (difference <= 10) {
                    paymentStatus = 'Paid';
                 } else {
                    paymentStatus = 'Partial Payment';
                 }
            }

            const invoiceDateStr = sale['Invoice Date'];
            let daysOverdue: number | undefined = undefined;

            if (paymentStatus !== 'Paid' && invoiceDateStr) {
                try {
                    const invoiceDate = new Date(invoiceDateStr);
                    if (!isNaN(invoiceDate.getTime())) {
                        const today = new Date();
                        const diffTime = today.getTime() - invoiceDate.getTime();
                        daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    }
                } catch (e) { /* ignore parse errors */ }
            }

            return {
                ...sale,
                paymentStatus,
                totalPaid,
                isPartial: paymentStatus === 'Partial Payment',
                invoiceDate: invoiceDateStr,
                paymentDate: paymentDateMap.get(saleInvoiceId),
                daysOverdue,
            };
        });
    }, [data.sales, data.paymentInvoices, data.paymentSummaries]);

    const saleReturnCheckData = useMemo<SaleReturnCheck[]>(() => {
        const { paymentInvoices, saleReturns } = data;
        const productReturns = paymentInvoices.filter(pi => pi['Transaction Description'] === 'Product returns');
        if (!productReturns.length) return [];

        const saleReturnMap = new Map<string, SaleReturn>();
        saleReturns.forEach(sr => {
            if (sr['Invoice No']) {
                saleReturnMap.set(sr['Invoice No'].trim(), sr);
            }
        });
        
        return productReturns.map(pi => {
            const invoiceNumber = pi['Invoice Number']?.trim();
            const matchingReturn = invoiceNumber ? saleReturnMap.get(invoiceNumber) : undefined;
            
            if (matchingReturn) {
                return {
                    paymentInvoiceNumber: pi['Invoice Number'],
                    paymentInvoiceDate: pi['Invoice Date'],
                    // FIX: Changed property 'month' to 'Month' for data consistency.
                    'Month': pi['Month'],
                    returnStatus: 'Done',
                    saleReturnInvoiceNo: matchingReturn['Invoice No'],
                    returnQty: toNumber(matchingReturn['Total Qty']),
                    returnValue: toNumber(matchingReturn['Total With Tax']),
                };
            } else {
                 return {
                    paymentInvoiceNumber: pi['Invoice Number'],
                    paymentInvoiceDate: pi['Invoice Date'],
                    // FIX: Changed property 'month' to 'Month' for data consistency.
                    'Month': pi['Month'],
                    returnStatus: 'Return pending',
                };
            }
        });

    }, [data.paymentInvoices, data.saleReturns]);

    const calculateMetrics = useCallback((currentData: AllData, _relevantEnrichedSales: EnrichedSale[]): DashboardMetrics => {
        const { sales, purchases, saleReturns, purchaseReturns, paymentInvoices, payables } = currentData;
        
        const salesValue = sales.reduce((acc, s) => acc + toNumber(s['Total Sales Amount']), 0);
        const purchaseValue = purchases.reduce((acc, p) => acc + toNumber(p['Total With Tax']), 0);
        const salesReturnValue = saleReturns.reduce((acc, sr) => acc + toNumber(sr['Total With Tax']), 0);
        const purchaseReturnValue = purchaseReturns.reduce((acc, pr) => acc + toNumber(pr['Total With Tax']), 0);
        
        const netSaleValue = salesValue - salesReturnValue;
        const netPurchaseValue = purchaseValue - purchaseReturnValue;
        
        const grossProfit = netSaleValue - netPurchaseValue;

        const amountPaid = paymentInvoices.reduce((acc, p) => acc + toNumber(p['Amount Paid']), 0);

        const uniqueMonths = new Set(sales.map(s => s.Month).filter(Boolean)).size;
        
        return {
            salesQuantity: sales.reduce((acc, s) => acc + toNumber(s['Total Quantity']), 0),
            purchaseQuantity: purchases.reduce((acc, p) => acc + toNumber(p['Total Quantity']), 0),
            salesValue,
            purchaseValue,
            salesReturnQty: saleReturns.reduce((acc, sr) => acc + toNumber(sr['Total Qty']), 0),
            purchaseReturnQty: purchaseReturns.reduce((acc, pr) => acc + toNumber(pr['Total Quantity']), 0),
            salesReturnValue,
            purchaseReturnValue,
            netSaleQty: sales.reduce((acc, s) => acc + toNumber(s['Total Quantity']), 0) - saleReturns.reduce((acc, sr) => acc + toNumber(sr['Total Qty']), 0),
            netPurchaseQty: purchases.reduce((acc, p) => acc + toNumber(p['Total Quantity']), 0) - purchaseReturns.reduce((acc, pr) => acc + toNumber(pr['Total Quantity']), 0),
            netSaleValue,
            netPurchaseValue,
            netProfit: grossProfit,
            grossProfit,
            salesReturnPercentage: salesValue > 0 ? (salesReturnValue / salesValue) * 100 : 0,
            purchaseReturnPercentage: purchaseValue > 0 ? (purchaseReturnValue / purchaseValue) * 100 : 0,
            outstanding: salesValue - amountPaid,
            purchaseOutstanding: payables.reduce((acc, p) => acc + toNumber(p.bcy_balance), 0),
            amountPaid,
            payable: payables.reduce((acc, p) => acc + toNumber(p.bcy_balance), 0),
            grossProfitPercentage: netSaleValue > 0 ? (grossProfit / netSaleValue) * 100 : 0,
            avgMonthlySales: uniqueMonths > 0 ? salesValue / uniqueMonths : 0,
            avgPurchaseValue: purchases.length > 0 ? purchaseValue / purchases.length : 0,
        };
    }, []);

    return {
        data,
        loadData,
        clearData,
        isLoading,
        progress,
        metrics: calculateMetrics,
        enrichedSales,
        cancelLoad,
        salePurchaseCheckData,
        salePaymentCheckData,
        saleReturnCheckData,
    };
};
