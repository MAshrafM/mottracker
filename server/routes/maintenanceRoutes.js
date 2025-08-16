// server/routes/maintenanceRoutes.js

const express = require('express');
// We need mergeParams: true to access :motorId from the parent router
const router = express.Router({ mergeParams: true }); 

const {
    getMaintenanceEvents,
  addMaintenanceEvent,
  updateMaintenanceEvent,
  deleteMaintenanceEvent
} = require('../controllers/maintenanceController');

const { protect, authorize } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

router.route('/')
    .get(getMaintenanceEvents); // Get all maintenance events for a motor

router.route('/')
  .post(authorize('admin', 'manager'), addMaintenanceEvent);

router.route('/:eventId')
  .put(authorize('admin', 'manager'), updateMaintenanceEvent)
  .delete(authorize('admin'), deleteMaintenanceEvent);

module.exports = router;
