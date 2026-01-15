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

        // Transform notifications to include 'read' property for the current user
        const mappedNotifications = notifications.map(notif => {
            const notifObj = notif.toObject();
            notifObj.read = notif.readBy ? notif.readBy.some(id => id.toString() === req.user._id.toString()) : false;
            return notifObj;
        });

        res.status(200).json({ success: true, count: mappedNotifications.length, data: mappedNotifications });
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

        // Add user to readBy array if not already present
        if (!notification.readBy.includes(req.user._id)) {
            notification.readBy.push(req.user._id);
            await notification.save();
        }

        // Return the notification with 'read' set to true for the response
        const notifObj = notification.toObject();
        notifObj.read = true;

        res.status(200).json({ success: true, data: notifObj });
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
            io.emit('notification', notification.toJSON());
        }

        return notification;
    } catch (err) {
        console.error('Error creating notification:', err);
    }
};
