// server/routes/plantEquipmentRoutes.js

const express = require('express');
const router = express.Router();
const {
  getEquipments,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  assignMotor,
} = require('../controllers/plantEquipmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getEquipments)
  .post(authorize('admin'), createEquipment);

router.route('/:id')
  .put(authorize('admin', 'manager'), updateEquipment)
  .delete(authorize('admin'), deleteEquipment);

router.route('/:id/assign-motor')
  .post(authorize('admin', 'manager'), assignMotor);

module.exports = router;
