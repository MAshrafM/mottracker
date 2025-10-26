// server/routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const { getActiveMotorReport, 
    exportActiveMotorsToExcel, 
    exportActiveMotorsToPDF,
    getReports
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(authorize('admin', 'manager'), getReports);

router.route('/active-motors')
    .get(authorize('admin', 'manager', 'user'), getActiveMotorReport);
    
router.route('/active-motors/export-excel')
    .get(authorize('admin', 'manager'), exportActiveMotorsToExcel); // Adjust to call the appropriate export function

router.route('/active-motors/export-pdf')
    .get(authorize('admin', 'manager'), exportActiveMotorsToPDF); // Adjust to call the appropriate export function

module.exports = router;