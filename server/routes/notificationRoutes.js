const express = require('express');
const { getNotifications, markAsRead, deleteNotification, clearAllNotifications } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // All routes are protected

router.route('/')
    .get(getNotifications)
    .delete(clearAllNotifications);

router.route('/:id/read').put(markAsRead);
router.route('/:id').delete(deleteNotification);

module.exports = router;
