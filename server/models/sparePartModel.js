const mongoose = require('mongoose');

const sparePartSchema = new mongoose.Schema({
    storageLocation: {
        type: Number,
        enum: [12, 13], // 12: Electrical, 13: Motors
        required: true,
        index: true
    },
    sapNumber: {
        type: String,
        required: true,
        unique: true,
        match: [/^\d{10}$/, 'SAP Number must be exactly 10 digits']
    },
    oldWarehouseNumber: {
        type: String,
        sparse: true, // Allows nulls/undefined 
        match: [/^\d{16}$/, 'Old Warehouse Number must be 16 digits']
    },
    description: {
        type: String,
        required: true
    },
    unit: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true // Adds createdAt and updatedAt automatically
});

// Text index for high-speed fuzzy searching on descriptions and SAP numbers
sparePartSchema.index({ description: 'text', sapNumber: 'text' });

module.exports = mongoose.model('SparePart', sparePartSchema);
