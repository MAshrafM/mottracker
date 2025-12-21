const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null // null implies a system-wide notification for all users
    },
    type: {
        type: String,
        enum: ['info', 'success', 'warning', 'error'],
        default: 'info'
    },
    message: {
        type: String,
        required: true
    },
    read: {
        type: Boolean,
        default: false
    },
    relatedId: {
        type: String, // ID of the motor or maintenance record
        default: null
    }
}, {
    timestamps: true // Adds createdAt and updatedAt
});

module.exports = mongoose.model('Notification', NotificationSchema);
