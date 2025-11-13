
import { AllData, DataType, CsvRow } from '../types';

const DB_NAME = 'ReconMasterDB';
const DB_VERSION = 2; // Incremented version to trigger schema upgrade

// This mirrors the initialData structure
const initialData: AllData = {
    sales: [],
    purchases: [],
    saleReturns: [],
    purchaseReturns: [],
    paymentSummaries: [],
    paymentInvoices: [],
    payables: [],
};

// Helper to convert DataType enum to store name (which are also keys in AllData)
const dataTypeToKey = (dataType: DataType): keyof AllData => {
    switch (dataType) {
        case DataType.Sales: return 'sales';
        case DataType.Purchases: return 'purchases';
        case DataType.SaleReturns: return 'saleReturns';
        case DataType.PurchaseReturns: return 'purchaseReturns';
        case DataType.PaymentSummaries: return 'paymentSummaries';
        case DataType.PaymentInvoices: return 'paymentInvoices';
        case DataType.Payables: return 'payables';
        default: throw new Error(`Unknown DataType: ${dataType}`);
    }
};

const STORE_NAMES = Object.values(DataType).map(dataTypeToKey);

let dbPromise: Promise<any> | null = null;

// Use the global 'idb' object from the UMD script
const getDb = (): Promise<any> => {
    if (!dbPromise) {
        dbPromise = (window as any).idb.openDB(DB_NAME, DB_VERSION, {
            upgrade(db: any) {
                STORE_NAMES.forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        // FIX: Added autoIncrement to allow IndexedDB to generate keys.
                        db.createObjectStore(storeName, { autoIncrement: true });
                    }
                });
            },
        });
    }
    return dbPromise;
};

export const saveData = async (dataType: DataType, data: CsvRow[]): Promise<void> => {
    const storeName = dataTypeToKey(dataType);
    const db = await getDb();
    const tx = db.transaction(storeName, 'readwrite');
    await tx.objectStore(storeName).clear();
    // With autoIncrement, we don't need to provide a key to add()
    const addPromises = data.map(item => tx.objectStore(storeName).add(item));
    await Promise.all(addPromises);
    await tx.done;
};

export const loadAllData = async (): Promise<AllData> => {
    const db = await getDb();
    const loadedData: AllData = { ...initialData };
    for (const storeName of STORE_NAMES) {
        const data = await db.getAll(storeName);
        if (data) {
             (loadedData as any)[storeName] = data;
        }
    }
    return loadedData;
};

export const clearAllData = async (): Promise<void> => {
    const db = await getDb();
    const tx = db.transaction(STORE_NAMES, 'readwrite');
    const promises = STORE_NAMES.map(storeName => tx.objectStore(storeName).clear());
    await Promise.all(promises);
    await tx.done;
};
