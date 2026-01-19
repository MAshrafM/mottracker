import React, { useState } from 'react';
import Papa from 'papaparse';
import { Upload, FileText, Check, AlertTriangle, X, RefreshCw } from 'lucide-react';
import SparePartService from '../../services/sparePartService';

const CSVUpload = ({ onUploadSuccess }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState([]);
    const [validationErrors, setValidationErrors] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null); // 'success' | 'error'

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.type === 'text/csv') {
            processFile(droppedFile);
        } else {
            setUploadStatus('error');
            setValidationErrors(['Please upload a valid CSV file.']);
        }
    };

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            processFile(selectedFile);
        }
    };

    const processFile = (file) => {
        setFile(file);
        setUploadStatus(null);
        setValidationErrors([]);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                validateData(results.data);
            },
            error: (error) => {
                setValidationErrors([`CSV Parsing Error: ${error.message}`]);
            }
        });
    };

    const validateData = (data) => {
        const errors = [];
        const validData = [];

        data.forEach((row, index) => {
            const rowNum = index + 2; // +1 for header, +1 for 0-index

            // Check required fields
            if (!row.sapNumber || !row.description) {
                // errors.push(`Row ${rowNum}: Missing mandatory fields (SAP Number, Description)`);
                // Skip empty rows if any
                return;
            }

            // precise SAP Validation
            if (!/^\d{10}$/.test(row.sapNumber)) {
                errors.push(`Row ${rowNum}: Invalid SAP Number '${row.sapNumber}' (Must be 10 digits)`);
            }

            // Location Validation
            if (row.storageLocation && ![12, 13, '12', '13'].includes(row.storageLocation)) {
                errors.push(`Row ${rowNum}: Invalid Location '${row.storageLocation}' (Must be 12 or 13)`);
            }

            // Clean up data
            validData.push({
                ...row,
                storageLocation: Number(row.storageLocation),
                quantity: Number(row.quantity) || 0
            });
        });

        if (errors.length > 0) {
            setValidationErrors(errors);
            setPreviewData([]);
        } else {
            setPreviewData(validData);
        }
    };

    const handleUpload = async () => {
        if (previewData.length === 0) return;

        setIsUploading(true);
        try {
            await SparePartService.uploadSparePartsCSV(previewData);
            setUploadStatus('success');
            setFile(null);
            setPreviewData([]);
            if (onUploadSuccess) onUploadSuccess();
        } catch (err) {
            setUploadStatus('error');
            // Check if server returned detailed partial errors
            if (err.response?.data?.errors) {
                const detailedErrors = err.response.data.errors.map(e =>
                    `Row ${e.row}: ${e.sapNumber} - ${e.error}`
                );
                setValidationErrors(detailedErrors);
            } else {
                setValidationErrors([err.response?.data?.message || err.message]);
            }
        } finally {
            setIsUploading(false);
        }
    };

    const reset = () => {
        setFile(null);
        setPreviewData([]);
        setValidationErrors([]);
        setUploadStatus(null);
    };

    return (
        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Upload className="w-5 h-5 mr-2 text-blue-400" />
                Bulk Upload <span className="text-xs ml-2 bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">Dev Only</span>
            </h3>

            {!file ? (
                <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-white/20 hover:border-white/40'}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <Upload className="w-12 h-12 text-blue-300 mx-auto mb-3 opacity-50" />
                    <p className="text-blue-200 mb-2">Drag & Drop CSV here</p>
                    <p className="text-sm text-blue-400/60 mb-4">or</p>
                    <label className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors">
                        Browse Files
                        <input type="file" accept=".csv" className="hidden" onChange={handleFileSelect} />
                    </label>
                    <p className="text-xs text-blue-300/40 mt-4">Headers: sapNumber, description, storageLocation, quantity, unit, oldWarehouseNumber</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/10">
                        <div className="flex items-center space-x-3">
                            <FileText className="w-6 h-6 text-blue-300" />
                            <div>
                                <p className="text-white text-sm font-medium">{file.name}</p>
                                <p className="text-xs text-blue-400">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                        </div>
                        <button onClick={reset} className="text-red-400 hover:text-red-300 p-1">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {validationErrors.length > 0 ? (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                                <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                                <div className="flex-1">
                                    <h4 className="text-red-300 font-medium text-sm mb-2">Validation Errors</h4>
                                    <ul className="text-xs text-red-200/80 space-y-1 list-disc pl-4 max-h-32 overflow-y-auto">
                                        {validationErrors.map((err, idx) => (
                                            <li key={idx}>{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                            <div className="flex items-center space-x-2 mb-2">
                                <Check className="w-5 h-5 text-green-400" />
                                <span className="text-green-300 font-medium">Ready to Sync</span>
                            </div>
                            <p className="text-sm text-green-200/80">
                                Found <strong>{previewData.length}</strong> records.
                                This will perform a bulk upsert operation.
                            </p>
                        </div>
                    )}

                    {validationErrors.length === 0 && (
                        <button
                            onClick={handleUpload}
                            disabled={isUploading}
                            className={`w-full py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all ${isUploading
                                ? 'bg-blue-600/50 cursor-not-allowed text-white/50'
                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
                                }`}
                        >
                            {isUploading ? (
                                <>
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    <span>Syncing...</span>
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-5 h-5" />
                                    <span>Start Sync</span>
                                </>
                            )}
                        </button>
                    )}

                    {uploadStatus === 'success' && (
                        <div className="bg-green-500/20 border border-green-500/30 p-3 rounded-lg text-center">
                            <p className="text-green-300">Sync Completed Successfully!</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CSVUpload;
