import React, { useState } from 'react';
import api from '../services/api';
import { Loader } from 'lucide-react';

const MassMaintenanceEntry = ({ motorId, onClose, onSuccess }) => {
    const [input, setInput] = useState('');
    const [parsedData, setParsedData] = useState([]);
    const [error, setError] = useState('');
    const [step, setStep] = useState('input'); // 'input', 'preview', 'saving'
    const [isSaving, setIsSaving] = useState(false);

    const parseData = () => {
        try {
            setError('');

            if (!input.trim()) {
                setError('Please enter some data to parse');
                return;
            }

            const text = input.trim();
            const jsonArray = [];

            // Find all dates with format dd/mm/yyyy followed by =
            const datePattern = /(\d{1,2}\/\d{1,2}\/\d{4})\s*=\s*/g;
            const matches = [];
            let match;

            // Collect all date matches with their positions
            while ((match = datePattern.exec(text)) !== null) {
                matches.push({
                    date: match[1],
                    index: match.index,
                    fullMatchLength: match[0].length
                });
            }

            if (matches.length === 0) {
                setError('No dates found in format "dd/mm/yyyy =". Make sure dates are followed by an equals sign.');
                return;
            }

            // Process each date and extract content until next date
            for (let i = 0; i < matches.length; i++) {
                const currentMatch = matches[i];
                const nextMatch = matches[i + 1];

                // Validate date
                const dateParts = currentMatch.date.split('/');
                const day = parseInt(dateParts[0]);
                const month = parseInt(dateParts[1]);
                const year = parseInt(dateParts[2]);

                if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) {
                    setError(`Invalid date: ${currentMatch.date}`);
                    return;
                }

                // Convert to ISO string for backend (YYYY-MM-DD)
                const dateObj = new Date(year, month - 1, day);
                const isoDate = dateObj.toISOString();

                // Extract content from after "=" until next date (or end of text)
                const startPos = currentMatch.index + currentMatch.fullMatchLength;
                const endPos = nextMatch ? nextMatch.index : text.length;
                let rawContent = text.substring(startPos, endPos);

                // Clean up the content - split by lines and process
                let description = rawContent
                    .split(/\r?\n/)
                    .map(line => line.trim())
                    .filter(line => line.length > 0)
                    .map(line => {
                        // Remove various bullet points and leading symbols
                        return line.replace(/^[·•\-*\s]+/, '').trim();
                    })
                    .filter(line => line.length > 0)
                    .join(' ')
                    .trim();

                if (description) {
                    jsonArray.push({
                        date: isoDate,
                        originalDate: currentMatch.date, // For display
                        description: description
                    });
                }
            }

            if (jsonArray.length === 0) {
                setError('No valid content found after dates');
                return;
            }

            setParsedData(jsonArray);
            setStep('preview');

        } catch (err) {
            setError('An error occurred while parsing the data: ' + err.message);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError('');
        try {
            const payload = parsedData.map(item => ({
                date: item.date,
                description: item.description
            }));

            await api.post(`/motors/${motorId}/maintenance/bulk`, { events: payload });

            onSuccess();
            onClose();
        } catch (err) {
            console.error('Error saving bulk maintenance:', err);
            setError(err.response?.data?.message || 'Failed to save data.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="glass-dark rounded-2xl p-8 max-w-4xl w-full shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-blue-300">
                    Mass Maintenance Entry
                </h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {step === 'input' && (
                <div className="flex flex-col flex-1 overflow-hidden">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4 text-sm text-blue-200">
                        <p className="font-semibold mb-2">Instructions:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Format dates as <code>dd/mm/yyyy =</code></li>
                            <li>Enter description after the equals sign.</li>
                            <li>Descriptions can span multiple lines.</li>
                            <li>Example:</li>
                        </ul>
                        <pre className="mt-2 bg-black/30 p-2 rounded text-xs font-mono">
                            01/01/2023 = Initial setup completed.
                            15/05/2023 = Replaced bearings.
                        </pre>
                    </div>

                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="w-full flex-1 bg-white/5 border border-white/10 rounded-lg p-4 text-white font-mono text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-none"
                        placeholder="Paste your data here..."
                    />

                    {error && (
                        <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end pt-6 space-x-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 rounded-lg font-semibold text-gray-300 hover:bg-white/10 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={parseData}
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 
                         text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300 
                         transform hover:scale-105 shadow-md hover:shadow-lg"
                        >
                            Parse Data
                        </button>
                    </div>
                </div>
            )}

            {step === 'preview' && (
                <div className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-auto bg-white/5 rounded-lg border border-white/10">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/10 text-gray-300 text-sm border-b border-white/10">
                                    <th className="p-4 font-semibold w-1/4">Date</th>
                                    <th className="p-4 font-semibold">Description</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {parsedData.map((item, index) => (
                                    <tr key={index} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 text-blue-300 font-mono text-sm align-top whitespace-nowrap">
                                            {item.originalDate}
                                        </td>
                                        <td className="p-4 text-gray-300 text-sm align-top">
                                            {item.description}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {error && (
                        <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-6">
                        <button
                            onClick={() => setStep('input')}
                            className="text-blue-400 hover:text-blue-300 flex items-center space-x-2 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <span>Back to Edit</span>
                        </button>

                        <div className="flex space-x-3">
                            <button
                                onClick={onClose}
                                disabled={isSaving}
                                className="px-6 py-2 rounded-lg font-semibold text-gray-300 hover:bg-white/10 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 
                                    text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300 
                                    transform hover:scale-105 shadow-md hover:shadow-lg flex items-center space-x-2 disabled:opacity-50 disabled:scale-100"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader className="w-4 h-4 animate-spin" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <span>Import {parsedData.length} Records</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MassMaintenanceEntry;
