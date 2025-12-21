const Notification = require('../models/notificationModel');

// @desc    Get notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
    try {
        // Fetch system-wide notifications (user: null) OR notifications specific to this user
        // Sort by newest first
        const notifications = await Notification.find({
            $or: [
                { user: null },
                { user: req.user._id }
            ]
        }).sort({ createdAt: -1 }).limit(100);

        // If we want to track 'read' status for global notifications per user, it's complex.
        // For simplicity in this v1:
        // Global notifications are 'read' if the user has marked them read locally? 
        // No, that doesn't persist.
        // Better approach: We clone global notifications for each user? OR we just store a list of 'readBy' users.
        // Simpler V1: Just show them. We will handle 'read' status updates for specific notifications.

        res.status(200).json({ success: true, count: notifications.length, data: notifications });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        // Update read status
        notification.read = true;
        await notification.save();

        res.status(200).json({ success: true, data: notification });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        await notification.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Delete all notifications for user
// @route   DELETE /api/notifications
// @access  Private
exports.clearAllNotifications = async (req, res) => {
    try {
        await Notification.deleteMany({
            $or: [{ user: req.user._id }, { user: null }]
        });
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Helper to create notification (internal use)
exports.createNotification = async (io, { type, message, user = null, relatedId = null }) => {
    try {
        const notification = await Notification.create({
            user,
            type,
            message,
            relatedId
        });

        // Emit via socket
        if (io) {
            io.emit('notification', notification);
        }

        return notification;
    } catch (err) {
        console.error('Error creating notification:', err);
    }
};
