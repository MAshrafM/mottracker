// server/routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const { getActiveMotorReport, 
    exportActiveMotorsToExcel, 
    exportActiveMotorsToPDF,
    exportActiveMotorsDetailedToExcel,
    getActiveMotorDetailedReport,
    getReports,
    getSpareMotorReport,
    exportSpareMotorsToExcel,
    exportSpareMotorsToPDF,
    getBearingsReport,
    exportBearingsReportToExcel,
    exportBearingsReportToPDF,
    getUnitMotorReport,
    exportUnitMotorReportToExcel,
    exportUnitMotorReportToPDF,
    getAllMotorDetailedReport,
    exportAllMotorsDetailedToExcel,
    getShutdownReport,
    exportShutdownReportPDFByDate,
    exportShutdownReportPDFByUnit
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(authorize('admin', 'manager'), getReports);

router.route('/active-motors')
    .get(authorize('admin', 'manager', 'user'), getActiveMotorReport);

router.route('/active-motors-detailed')
    .get(authorize('admin', 'manager', 'user'), getActiveMotorDetailedReport);

router.route('/all-motors-detailed')
    .get(authorize('admin', 'manager', 'user'), getAllMotorDetailedReport);
    
router.route('/active-motors/export-excel')
    .get(authorize('admin', 'manager'), exportActiveMotorsToExcel); // Adjust to call the appropriate export function

router.route('/active-motors-detailed/export-excel')
    .get(authorize('admin', 'manager'), exportActiveMotorsDetailedToExcel);

router.route('/all-motors-detailed/export-excel')
    .get(authorize('admin', 'manager'), exportAllMotorsDetailedToExcel);

router.route('/active-motors/export-pdf')
    .get(authorize('admin', 'manager'), exportActiveMotorsToPDF); // Adjust to call the appropriate export function

router.route('/spare-motors')
    .get(authorize('admin', 'manager', 'user'), getSpareMotorReport);
    
router.route('/spare-motors/export-excel')
    .get(authorize('admin', 'manager'), exportSpareMotorsToExcel); // Adjust to call the appropriate export function

router.route('/spare-motors/export-pdf')
    .get(authorize('admin', 'manager'), exportSpareMotorsToPDF); // Adjust to call the appropriate export function

router.route('/bearings')
    .get(authorize('admin', 'manager', 'user'), getBearingsReport);
router.route('/bearings/export-excel')
    .get(authorize('admin', 'manager'), exportBearingsReportToExcel); // Adjust to call the appropriate export function
router.route('/bearings/export-pdf')
    .get(authorize('admin', 'manager'), exportBearingsReportToPDF); // Adjust to call the appropriate export function

router.route('/unit-motor')
    .get(authorize('admin', 'manager', 'user'), getUnitMotorReport);
router.route('/unit-motor/export-excel')
    .get(authorize('admin', 'manager'), exportUnitMotorReportToExcel);
router.route('/unit-motor/export-pdf')
    .get(authorize('admin', 'manager'), exportUnitMotorReportToPDF);

router.route('/shutdown-report')
    .get(authorize('admin', 'manager', 'user'), getShutdownReport);
router.route('/shutdown-report/export-pdf-by-date')
    .get(authorize('admin', 'manager'), exportShutdownReportPDFByDate);
router.route('/shutdown-report/export-pdf-by-unit')
    .get(authorize('admin', 'manager'), exportShutdownReportPDFByUnit);

module.exports = router;