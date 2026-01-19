import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Search, MapPin, Database, RefreshCw, AlertCircle, Clock, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import SparePartService from '../services/sparePartService';
import CSVUpload from '../components/SpareParts/CSVUpload';
import AuthContext from '../context/AuthContext';

const SparePartsPage = () => {
    const { user } = useContext(AuthContext);
    const [location, setLocation] = useState(13); // Default to Motors (13)
    const [searchQuery, setSearchQuery] = useState('');
    const [spareParts, setSpareParts] = useState([]);
    const [stats, setStats] = useState({ 12: 0, 13: 0 }); // Storage Location Counts
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showUpload, setShowUpload] = useState(false); // Toggle for upload section (Power User / Dev)

    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Initial Load
    // useEffect(() => {
    //     fetchStats();
    // }, []); // Removed as per user request to avoid separate endpoint

    // Reset pagination when search or location changes
    useEffect(() => {
        setPage(1);
        setHasMore(true);
        setSpareParts([]); // Clear current list to avoid confusion
    }, [searchQuery, location]);

    // Debounce Search


    const fetchParts = useCallback(async (pageNum = 1) => {
        if (pageNum === 1) setIsLoading(true);
        else setIsLoadingMore(true);

        setError('');

        try {
            const response = await SparePartService.getSpareParts({
                location,
                search: searchQuery,
                page: pageNum,
                limit: 50
            });

            const newData = response.data.data;

            if (pageNum === 1) {
                setSpareParts(newData);
            } else {
                setSpareParts(prev => [...prev, ...newData]);
            }

            // Check if there are more pages
            setHasMore(pageNum < response.data.totalPages);

            // Lazy update stats for current location
            // This relies on the 'count' property from the API response (if provided for filtered total)
            // Note: The totalCount from backend is the filtered count.
            // If search is empty, this "totalCount" effectively represents the count for the location.
            if (!searchQuery && response.data.totalCount !== undefined) {
                // Or use response.data.count if your existing logic preferred the count per request, 
                // but 'totalCount' is better for the badge.
                setStats(prev => ({
                    ...prev,
                    [location]: response.data.totalCount
                }));
            }

        } catch (err) {
            setError('Failed to fetch spare parts. ' + (err.response?.data?.message || err.message));
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [location, searchQuery]);

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchParts(1);
        }, 500);

        return () => clearTimeout(timer);
    }, [fetchParts]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchParts(nextPage);
    };

    const calculateFreshness = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        return `${diffDays} days ago`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 overflow-x-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 z-0 pointer-events-none" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
                    <div className="flex items-center space-x-4">
                        <Link to="/dashboard" className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-blue-300 hover:text-white transition-colors shrink-0">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div className="min-w-0">
                            <h1 className="text-2xl md:text-3xl font-bold text-white flex flex-wrap items-center">
                                <Database className="w-6 h-6 md:w-8 md:h-8 mr-2 md:mr-3 text-blue-400 shrink-0" />
                                <span>Spare Parts Inventory</span>
                            </h1>
                            <p className="text-blue-200/60 text-sm mt-1 truncate">Search motors and electrical components</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        {/* Dev Env / Power User Trigger - For now just a visible button or Environment check */}
                        {/* In a real app, maybe hide this behind a role check */}
                        {user && user.role === 'admin' && (
                            <button
                                onClick={() => setShowUpload(!showUpload)}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${showUpload ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-white/5 text-blue-300 border border-white/10 hover:bg-white/10'
                                    } shrink-0`}
                            >
                                <RefreshCw className="w-4 h-4" />
                                <span className="hidden sm:inline">{showUpload ? 'Hide Upload' : 'Sync Data'}</span>
                                <span className="sm:hidden">{showUpload ? 'Hide' : 'Sync'}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Upload Section */}
                {showUpload && (
                    <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
                        <CSVUpload onUploadSuccess={() => { setShowUpload(false); fetchParts(); }} />
                    </div>
                )}

                {/* Search & Filter Bar */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-4 md:p-6 shadow-xl mb-8">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Location Toggle (High Contrast) */}
                        <div className="flex w-full md:w-auto bg-slate-800/80 p-1.5 rounded-xl border border-white/10 shrink-0">
                            <button
                                onClick={() => setLocation(13)}
                                className={`flex-1 md:flex-none justify-center px-2 py-2 md:px-6 md:py-2.5 rounded-lg flex items-center space-x-2 font-medium text-sm md:text-base transition-all duration-300 ${location === 13
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                                    : 'text-blue-400 hover:text-blue-200 hover:bg-white/5'
                                    }`}
                            >
                                <span>Motors <span className="hidden sm:inline">(13)</span></span>
                                <span className={`ml-2 px-2 py-0.5 rounded text-xs ${location === 13 ? 'bg-white/20 text-white' : 'bg-white/10 text-blue-300'}`}>
                                    {stats[13] || 0}
                                </span>
                            </button>
                            <button
                                onClick={() => setLocation(12)}
                                className={`flex-1 md:flex-none justify-center px-2 py-2 md:px-6 md:py-2.5 rounded-lg flex items-center space-x-2 font-medium text-sm md:text-base transition-all duration-300 ${location === 12
                                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/25'
                                    : 'text-blue-400 hover:text-blue-200 hover:bg-white/5'
                                    }`}
                            >
                                <span>Electrical <span className="hidden sm:inline">(12)</span></span>
                                <span className={`ml-2 px-2 py-0.5 rounded text-xs ${location === 12 ? 'bg-white/20 text-white' : 'bg-white/10 text-blue-300'}`}>
                                    {stats[12] || 0}
                                </span>
                            </button>
                        </div>

                        {/* Smart Search Input */}
                        <div className="flex-1 relative group min-w-0">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-blue-300/50 group-focus-within:text-blue-400 transition-colors" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-11 pr-4 py-3.5 bg-slate-800/80 border border-white/10 rounded-xl text-white placeholder-blue-300/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium"
                                placeholder="Search by SAP Number (10 digits) or Description..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                    <span className="text-xs text-blue-300/40 bg-white/5 px-2 py-1 rounded">
                                        {/^\d+$/.test(searchQuery) ? (searchQuery.length === 10 ? 'SAP Search' : 'Numeric Search') : 'Text Search'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Results List */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="text-center py-12">
                            <RefreshCw className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
                            <p className="text-blue-200">Searching inventory...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 bg-red-500/10 rounded-2xl border border-red-500/20">
                            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                            <p className="text-red-200">{error}</p>
                        </div>
                    ) : spareParts.length === 0 ? (
                        <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
                            <Database className="w-16 h-16 text-blue-300/20 mx-auto mb-4" />
                            <h3 className="text-xl font-medium text-white mb-2">No items found</h3>
                            <p className="text-blue-300/60 max-w-sm mx-auto">
                                We couldn't find any parts matching your search in {location === 13 ? 'Motors' : 'Electrical'} storage.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {spareParts.map((part) => (
                                <div
                                    key={part._id}
                                    className="bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-4 transition-all duration-200 group flex flex-col md:flex-row md:items-center justify-between gap-4 w-full"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/20">
                                                SAP: {part.sapNumber}
                                            </span>
                                            {part.oldWarehouseNumber && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700/50 text-slate-400 border border-white/5">
                                                    Old: {part.oldWarehouseNumber}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-lg font-medium text-white truncate pr-4" title={part.description}>
                                            {part.description}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-blue-200/60">
                                            <span className="flex items-center">
                                                <MapPin className="w-4 h-4 mr-1 opacity-70" />
                                                Loc: {part.storageLocation}
                                            </span>
                                            <span className="flex items-center">
                                                <Clock className="w-4 h-4 mr-1 opacity-70" />
                                                Updated {calculateFreshness(part.updatedAt)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end gap-6 min-w-[140px] border-t md:border-t-0 border-white/10 pt-4 md:pt-0">
                                        <div className="text-right">
                                            <p className="text-xs text-blue-300 mb-1">Quantity</p>
                                            <p className="text-2xl font-bold text-white tracking-tight">
                                                {part.quantity}
                                                <span className="text-sm font-normal text-blue-300/60 ml-1">{part.unit}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Load More Button */}
                {!isLoading && !error && hasMore && spareParts.length > 0 && (
                    <div className="mt-8 text-center">
                        <button
                            onClick={handleLoadMore}
                            disabled={isLoadingMore}
                            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-blue-300 transition-all flex items-center justify-center mx-auto space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoadingMore ? (
                                <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : (
                                <span>Load More</span>
                            )}
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};

export default SparePartsPage;
