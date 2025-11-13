
import React, { useState, ChangeEvent, useRef, useEffect } from 'react';
import { DataType } from '../types';

interface FileUploadProps {
    onFileUpload: (dataType: DataType, file: File) => void;
    isLoading: boolean;
    onCancel: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isLoading, onCancel }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [dataType, setDataType] = useState<DataType>(DataType.Sales);
    const [uploadingText, setUploadingText] = useState('Uploading');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // FIX: Use ReturnType<typeof setInterval> for browser compatibility instead of NodeJS.Timeout
        let interval: ReturnType<typeof setInterval> | null = null;
        if (isLoading) {
            interval = setInterval(() => {
                setUploadingText(text => {
                    if (text === 'Uploading...') return 'Uploading.';
                    return `${text}.`;
                });
            }, 300);
        } else {
            setUploadingText('Uploading');
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isLoading]);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        } else {
            setSelectedFile(null);
        }
    };

    const handleUpload = () => {
        if (!selectedFile) return;
        onFileUpload(dataType, selectedFile);
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="flex items-center space-x-2">
            <select
                value={dataType}
                onChange={(e) => setDataType(e.target.value as DataType)}
                disabled={isLoading}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            >
                {Object.values(DataType).map((type) => (
                    <option key={type} value={type}>{type}</option>
                ))}
            </select>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={isLoading}
                accept=".csv, .xlsx, .xls"
                className="block text-sm text-gray-500 w-72
                           file:mr-4 file:py-2 file:px-4
                           file:rounded-md file:border-0
                           file:text-sm file:font-semibold
                           file:bg-indigo-50 file:text-indigo-700
                           hover:file:bg-indigo-100
                           disabled:opacity-50"
            />
             {isLoading ? (
                <button
                    onClick={onCancel}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                    Cancel
                </button>
            ) : (
                <button
                    onClick={handleUpload}
                    disabled={!selectedFile || isLoading}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Upload
                </button>
            )}
        </div>
    );
};
