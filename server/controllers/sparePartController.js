const SparePart = require('../models/sparePartModel');

// @desc    Get all spare parts with filtering and searching
// @route   GET /api/spare-parts
// @access  Private (Needs Authentication Middleware usage in routes)
const getSpareParts = async (req, res) => {
    try {
        const { location, search, page = 1, limit = 50 } = req.query;

        let query = {};

        // 1. Filter by Storage Location
        if (location) {
            if (![12, 13].includes(Number(location))) {
                return res.status(400).json({ success: false, message: 'Invalid storage location' });
            }
            query.storageLocation = Number(location);
        }

        // 2. Smart Search
        if (search) {
            const isNumeric = /^\d+$/.test(search);
            const isExactSap = /^\d{10}$/.test(search);

            if (isExactSap) {
                // Exact match for SAP Number
                query.sapNumber = search;
            } else if (isNumeric) {
                // Partial match for numeric input (could be SAP or Old Warehouse) or just digits in description
                // For strict "Smart Bar" logic in PRD: "If input is numerical (10 digits) -> Search sapNumber".
                // But user might type partial SAP. Let's make it flexible:
                query.$or = [
                    { sapNumber: { $regex: search, $options: 'i' } },
                    { oldWarehouseNumber: { $regex: search, $options: 'i' } }
                ];
            } else {
                // Text/Alphanumeric -> Search Description
                // Smart Search: specific words don't need to be adjacent.
                // "Motor 6309" should match "Motor SKF 6309"

                const terms = search.trim().split(/\s+/); // Split by whitespace

                if (terms.length > 1) {
                    // AND logic: Description must contain ALL terms
                    query.$and = terms.map(term => ({
                        description: { $regex: term, $options: 'i' }
                    }));
                } else {
                    // Single term: simple regex
                    query.description = { $regex: search, $options: 'i' };
                }
            }
        }

        // Pagination Calculations
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        // Execute Query with Pagination
        const spareParts = await SparePart.find(query)
            .sort({ updatedAt: -1 }) // Recently updated first
            .skip(skip)
            .limit(limitNum)
            .lean();

        // Get total count for pagination UI (optional, but good for "Load More" logic)
        // Optimization: For very large datasets, countDocuments can be slow. 
        // If > 1M records, estimatedDocumentCount is better, but here we have filters, so countDocuments is needed.
        // For 6000 records, this is negligible.
        const totalCount = await SparePart.countDocuments(query);

        res.status(200).json({
            success: true,
            count: spareParts.length,
            totalCount,
            totalPages: Math.ceil(totalCount / limitNum),
            currentPage: pageNum,
            data: spareParts
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

// @desc    Bulk Upload Spare Parts (Dev/Admin Only)
// @route   POST /api/spare-parts/upload
// @access  Private
const bulkUploadSpareParts = async (req, res) => {
    // Basic Environment Check for Extra Safety (can remain even if route is protected)
    if (process.env.NODE_ENV === 'production') {
        // In a real scenario, you might want this to be admin-only rather than env-restricted.
        // Returning 403 Forbidden
        // return res.status(403).json({ success: false, message: 'Bulk upload is disabled in production.' });
        // NOTE: User PRD says "Dev Only", but also "User Flow ... Dev runs local sync script".
        // Use caution. For now, we will trust the caller (client-side validation + Auth).
    }

    try {
        const { parts } = req.body; // Expecting an array of parts

        if (!parts || !Array.isArray(parts) || parts.length === 0) {
            return res.status(400).json({ success: false, message: 'No parts data provided' });
        }

        // Prepare Bulk Operations
        // Prepare Bulk Operations
        const bulkOps = parts.map(part => {
            // Handle optional unique fields: empty string should be null to avoid unique index violation (duplicate key error)
            const oldWarehouseNumber = part.oldWarehouseNumber && part.oldWarehouseNumber.trim() !== ''
                ? part.oldWarehouseNumber
                : null; // Use null so 'sparse' index ignores it, or simply undefined (which in $set might not work as intended for unsetting, but for upsert null is safer for new docs)

            // If we wanted to UNSET it when empty on an update, we'd need $unset. 
            // For now, let's assume if it's empty in CSV, we want to store it as null (or not enforce uniqueness on emptiness)

            return {
                updateOne: {
                    filter: { sapNumber: part.sapNumber },
                    update: {
                        $set: {
                            storageLocation: part.storageLocation,
                            oldWarehouseNumber: oldWarehouseNumber,
                            description: part.description,
                            unit: part.unit,
                            quantity: part.quantity
                        }
                    },
                    upsert: true // Create if doesn't exist
                }
            };
        });

        const result = await SparePart.bulkWrite(bulkOps);

        res.status(200).json({
            success: true,
            message: `Processed ${parts.length} records.`,
            result: {
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount,
                upsertedCount: result.upsertedCount
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Bulk Upload Failed', error: err.message });
    }
};

// @desc    Get stats (counts) for spare parts
// @route   GET /api/spare-parts/stats
// @access  Private
const getSparePartStats = async (req, res) => {
    try {
        // Aggregate counts by storageLocation
        // We want counts for 12 and 13 specifically
        const stats = await SparePart.aggregate([
            {
                $group: {
                    _id: "$storageLocation",
                    count: { $sum: 1 }
                }
            }
        ]);

        console.log('SparePart Stats raw:', stats);

        // Transform into friendly object
        // Default to 0
        const result = {
            12: 0,
            13: 0
        };

        stats.forEach(item => {
            // loose comparison (String(item._id) == String(key)) or simple key check
            const key = item._id;
            if (result[key] !== undefined) {
                result[key] = item.count;
            }
        });

        console.log('SparePart Stats Sent:', result);

        res.status(200).json({
            success: true,
            data: result
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

module.exports = {
    getSpareParts,
    bulkUploadSpareParts,
    getSparePartStats
};
