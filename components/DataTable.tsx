
import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';

export interface Column<T> {
    header: string;
    accessor: keyof T;
    isNumeric?: boolean;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    tableName: string;
}

export const DataTable = <T extends Record<string, any>>({ columns, data, tableName }: DataTableProps<T>) => {
    const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: 'ascending' | 'descending' } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(1000);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Logic to find status columns and generate unique status options for the filter
    const statusColumns = useMemo(() =>
        columns.filter(c => c.header.toLowerCase().includes('status')),
        [columns]
    );

    const statusOptions = useMemo(() => {
        if (!data || statusColumns.length === 0) return [];
        const allStatuses = new Set<string>();
        data.forEach(row => {
            statusColumns.forEach(col => {
                const status = row[col.accessor];
                if (status) {
                    allStatuses.add(String(status));
                }
            });
        });
        return Array.from(allStatuses).sort();
    }, [data, statusColumns]);

    // Reset to first page when filters or page size change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter, itemsPerPage]);

    const handleDownload = () => {
        const dataToExport = sortedData.map(row => {
            const newRow: Record<string, any> = {};
            columns.forEach(col => {
                newRow[col.header] = row[col.accessor];
            });
            return newRow;
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
        
        const filename = `${tableName.replace(/ /g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(workbook, filename);
    };
    
    const filteredData = useMemo(() => {
        if (!data) return [];
        let dataToFilter = [...data];

        // Apply status filter
        if (statusFilter && statusColumns.length > 0) {
            dataToFilter = dataToFilter.filter(row => 
                statusColumns.some(col => String(row[col.accessor]) === statusFilter)
            );
        }

        // Apply search query
        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            dataToFilter = dataToFilter.filter(row =>
                Object.values(row).some(value =>
                    String(value).toLowerCase().includes(lowercasedQuery)
                )
            );
        }

        return dataToFilter;
    }, [data, searchQuery, statusFilter, statusColumns]);

    const sortedData = useMemo(() => {
        let sortableData = [...filteredData];
        if (sortConfig !== null) {
            sortableData.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableData;
    }, [filteredData, sortConfig]);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedData.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedData, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(sortedData.length / itemsPerPage);

    const requestSort = (key: keyof T) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
        setCurrentPage(1); // Reset to first page on sort
    };
    
    const getSortIndicator = (key: keyof T) => {
        if (!sortConfig || sortConfig.key !== key) {
            return ' ↕';
        }
        return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
    };

    const getRowClassName = (row: T) => {
        if (row.amountMismatch) return 'bg-red-200 hover:bg-red-300';
        
        const days = row.daysOverdue;
        const isPartial = row.isPartial;

        if (typeof days === 'number') {
            if (days > 90) return 'bg-red-400 hover:bg-red-500 text-white';
            if (days > 60) return 'bg-red-300 hover:bg-red-400';
            if (days > 45) return 'bg-red-200 hover:bg-red-300';
        }
        
        if(isPartial) return 'bg-red-100 hover:bg-red-200';
        
        if (statusColumns.some(col => String(row[col.accessor]).toLowerCase().includes('pending'))) {
            return 'bg-yellow-50 hover:bg-yellow-100';
        }

        return 'hover:bg-gray-50';
    };

    if (!data || data.length === 0) {
        return <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">No data available to display.</div>;
    }

    return (
        <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 px-1 py-2 gap-4">
                <input
                    type="text"
                    placeholder="Search table..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm w-full sm:w-auto"
                />
                 <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    {statusOptions.length > 0 && (
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        >
                            <option value="">All Statuses</option>
                            {statusOptions.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    )}
                    <button
                        onClick={handleDownload}
                        disabled={sortedData.length === 0}
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Download Excel
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.accessor as string}
                                    scope="col"
                                    className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${column.isNumeric ? 'text-right' : 'text-left'}`}
                                    onClick={() => requestSort(column.accessor)}
                                >
                                    {column.header}
                                    <span className="ml-1">{getSortIndicator(column.accessor)}</span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedData.map((row, rowIndex) => (
                            <tr key={rowIndex} className={`transition-colors ${getRowClassName(row)}`}>
                                {columns.map((column, colIndex) => (
                                    <td
                                        key={colIndex}
                                        className={`px-6 py-4 whitespace-nowrap text-sm text-gray-800 ${column.isNumeric ? 'text-right font-mono' : 'text-left'}`}
                                    >
                                        {String(row[column.accessor] ?? '')}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 0 && (
                 <div className="sticky bottom-0 z-10 bg-white/95 backdrop-blur-sm py-3 px-4 flex items-center justify-between border-t border-gray-200 shadow-[0_-2px_5px_-1px_rgba(0,0,0,0.07)]">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"> Previous </button>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"> Next </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, sortedData.length)}</span> of{' '}
                                <span className="font-medium">{sortedData.length}</span> results
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                             <select value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); }} className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm">
                                <option value={100}>100 / page</option>
                                <option value={250}>250 / page</option>
                                <option value={500}>500 / page</option>
                                <option value={1000}>1000 / page</option>
                            </select>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                                    <span className="sr-only">Previous</span>
                                    &lt;
                                </button>
                                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                    {currentPage} / {totalPages || 1}
                                </span>
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                                    <span className="sr-only">Next</span>
                                    &gt;
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
