const express = require('express');
const { getNotifications, markAsRead, deleteNotification, clearAllNotifications } = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // All routes are protected

router.route('/')
    .get(getNotifications)
    .delete(authorize('admin'), clearAllNotifications);

router.route('/:id/read').put(markAsRead);
router.route('/:id').delete(authorize('admin'), deleteNotification);

module.exports = router;
