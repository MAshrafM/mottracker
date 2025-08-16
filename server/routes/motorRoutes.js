// server/routes/motorRoutes.js

const express = require('express');
const router = express.Router();
const {
  getMotors,
  getMotor,
  createMotor,
  updateMotor,
  deleteMotor,
} = require('../controllers/motorController');
const maintenanceRouter = require('./maintenanceRoutes');
const { protect, authorize } = require('../middleware/authMiddleware');

// Apply the 'protect' middleware to all routes in this file
// Any logged-in user (user, manager, admin) can view motors
router.use(protect);

router.route('/')
  .get(getMotors)
  .post(authorize('admin'), createMotor); // Only admin can create

router.route('/:id')
  .get(getMotor)
  .put(authorize('admin', 'manager'), updateMotor) // Admin and manager can update
  .delete(authorize('admin'), deleteMotor); // Only admin can delete

router.use('/:motorId/maintenance', maintenanceRouter);

module.exports = router;
