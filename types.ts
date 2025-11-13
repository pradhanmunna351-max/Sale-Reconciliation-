
export enum DataType {
    Sales = 'Sales',
    Purchases = 'Purchases',
    SaleReturns = 'Sale Returns',
    PurchaseReturns = 'Purchase Returns',
    PaymentSummaries = 'Payment Summaries',
    PaymentInvoices = 'Payment Invoices',
    Payables = 'Payables',
}

// Base type for any row from a parsed file
export interface CsvRow {
    [key: string]: any;
}

export interface Sale extends CsvRow {
    'Partner'?: string;
    'Invoice ID': string;
    'New Invoice ID'?: string;
    'Invoice Type'?: string;
    'IRN Number'?: string;
    'Month'?: string;
    'Invoice Date'?: string;
    'Warehouse Name'?: string;
    'Warehouse Code'?: string;
    'GST No'?: string;
    'Box Count'?: number;
    'Sales Without Tax Amount'?: number;
    'Total Tax'?: number;
    'Total Sales Amount'?: number;
    'Total Quantity'?: number;
    'Status'?: string;
}

export interface Purchase extends CsvRow {
    'Company'?: string;
    'Order No'?: string;
    'Invoice ID': string;
    'Invoice Type'?: string;
    'Month'?: string;
    'Invoice Date'?: string;
    'Warehouse Name'?: string;
    'Warehouse Code'?: string;
    'GST No'?: string;
    'Total Without Tax'?: number;
    'Total Tax'?: number;
    'TDS Amount'?: number;
    'Adjustment Amount'?: number;
    'Total With Tax'?: number;
    'Total Quantity'?: number;
    'Status'?: string;
}

export interface SaleReturn extends CsvRow {
    'Partner'?: string;
    'Channel'?: string;
    'Return No.': string;
    'Invoice No': string;
    'Seller Name'?: string;
    'Seller Code'?: string;
    'Month'?: string;
    'Return Date'?: string;
    'Post Date'?: string;
    'Return ID'?: string;
    'GST Invoice Number'?: string;
    'Tracking'?: string;
    'Courier'?: string;
    'Total Qty'?: number;
    'Carton Count'?: number;
    'Total Without Tax'?: number;
    'Total Tax'?: number;
    'Adjustment Amount'?: number;
    'Total With Tax'?: number;
    'Status'?: string;
}

export interface PurchaseReturn extends CsvRow {
    'Sale Return Number'?: string;
    'Purchase Return No.': string;
    'Invoice No': string;
    'Seller Name'?: string;
    'Seller Code'?: string;
    'Month'?: string;
    'Return Date'?: string;
    'Post Date'?: string;
    'Return ID'?: string;
    'Channel'?: string;
    'Warehouse Code'?: string;
    'Total Without Tax'?: number;
    'Total Tax'?: number;
    'Total With Tax'?: number;
    'Total Quantity'?: number;
    'Box No'?: string;
    'Seller Return Tracking No'?: string;
    'Status'?: string;
    'System Tracking Id'?: string;
    'Seller Tracking Id'?: string;
}

export interface PaymentSummary extends CsvRow {
    'Payment Number': string;
    'Month'?: string;
    'Payment Date'?: string;
    'Invoice Currency'?: string;
    'Amount in Invoice Currency'?: number;
    'Payment Currency'?: string;
    'Amount in Payment Currency'?: number;
    'Exchange Rate'?: number;
    'Payment Type'?: string;
    'Payment Status'?: string;
    'Payment Voided Reason'?: string;
    'Payment Number2'?: string;
    'Bank Amount'?: number;
    'Diff'?: number;
}

export interface PaymentInvoice extends CsvRow {
    'Payment Number'?: string;
    'Invoice Number': string;
    'Month'?: string;
    'Invoice Date'?: string;
    'Transaction type'?: string; // Note lowercase 't' as per original request
    'Transaction Description'?: string;
    'Reference Details'?: string;
    'Original Invoice Number'?: string;
    'Invoice Amount'?: number;
    'Invoice Currency'?: string;
    'Withholding Amount'?: number;
    'Terms Discount Taken'?: number;
    'Amount Paid'?: number;
    'Remaining Amount'?: number;
}

export interface Payable extends CsvRow {
    'Type'?: string;
    'status'?: string; // Note lowercase 's'
    'Month'?: string;
    'transaction_date'?: string;
    'transaction_number': string;
    'Party Code'?: string;
    'vendor_name'?: string;
    'transaction_type'?: string;
    'customer_name'?: string;
    'bcy_total'?: number;
    'bcy_balance'?: number;
    'transaction_id'?: string;
    'vendor_id'?: string;
    'customer_id'?: string;
    'currency_code'?: string;
    'currency_id'?: string;
    'receipt_name'?: string;
}

export interface AllData {
    sales: Sale[];
    purchases: Purchase[];
    saleReturns: SaleReturn[];
    purchaseReturns: PurchaseReturn[];
    paymentSummaries: PaymentSummary[];
    paymentInvoices: PaymentInvoice[];
    payables: Payable[];
}

export interface EnrichedSale extends Sale {
    purchaseStatus: 'Done' | 'Pending';
    paymentStatus: 'Paid' | 'Partial Payment' | 'Payment Pending';
    returnStatus: 'Returned' | 'Pending';
}

export interface EnrichedPurchase extends Purchase {
    returnStatus: 'Returned' | 'Pending';
}

export interface SalePurchaseCheck extends Sale {
  purchaseStatus: 'Done' | 'Pending';
  purchaseInvoiceId?: string;
  purchaseAmount?: number;
  amountMismatch: boolean;
}

export interface SalePaymentCheck extends Sale {
  paymentStatus: 'Paid' | 'Partial Payment' | 'Payment Pending';
  totalPaid: number;
  isPartial: boolean;
  invoiceDate?: string;
  paymentDate?: string;
  daysOverdue?: number;
}

export interface SaleReturnCheck {
    paymentInvoiceNumber: string;
    paymentInvoiceDate?: string;
    // FIX: Changed property 'month' to 'Month' for consistency with other data types in the application.
    'Month'?: string;
    returnStatus: 'Done' | 'Return pending';
    saleReturnInvoiceNo?: string;
    returnQty?: number;
    returnValue?: number;
}


export interface DashboardMetrics {
    salesQuantity: number;
    purchaseQuantity: number;
    salesValue: number;
    purchaseValue: number;
    salesReturnQty: number;
    purchaseReturnQty: number;
    salesReturnValue: number;
    purchaseReturnValue: number;
    netSaleQty: number;
    netPurchaseQty: number;
    netSaleValue: number;
    netPurchaseValue: number;
    netProfit: number;
    salesReturnPercentage: number;
    purchaseReturnPercentage: number;
    outstanding: number;
    purchaseOutstanding: number;
    amountPaid: number;
    payable: number;
    grossProfit: number;
    grossProfitPercentage: number;
    avgMonthlySales: number;
    avgPurchaseValue: number;
}
