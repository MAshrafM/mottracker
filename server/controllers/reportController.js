// server/controllers/reportController.js
const Motor = require('../models/motorModel');
const { generateTablePDF } = require('../utils/pdfService'); // Import the service
const { formatDate } = require('../utils/helpers'); // Your date formatter
const ExcelJS = require('exceljs');
const { PDFDocument, rgb, StandardFonts, PageSizes, degrees } = require('pdf-lib');

exports.getReports = async (req, res) => {
  res.status(200).json({ message: 'Reports endpoint' });
};

exports.getActiveMotorReport = async (req, res) => {
  res.status(200).json({ message: 'Active Motor Report' });
};

exports.getSpareMotorReport = async (req, res) => {
  res.status(200).json({ message: 'Spare Motor Report' });
};

// Additional report generation functions (e.g., export to PDF/Excel) can be added here
exports.exportActiveMotorsToExcel = async (req, res) => {
    try {
    const activeMotors = await Motor.find({ status: 'active' }).populate('eq').lean();
    
    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Active Motors');

    // Define columns
    worksheet.columns = [
      { header: 'TON Number', key: 'tonNumber', width: 15 },
      { header: 'Designation', key: 'designation', width: 20 },
      { header: 'Serial Number', key: 'serialNumber', width: 15 },
      { header: 'Power', key: 'power', width: 12 },
      { header: 'Speed (RPM)', key: 'speed', width: 12 },
      { header: 'Current', key: 'current', width: 12 },
      { header: 'IM', key: 'IM', width: 10 },
      { header: 'Frame Size', key: 'frameSize', width: 12 },
      { header: 'Bearing NDE', key: 'bearingNDE', width: 15 },
      { header: 'Bearing DE', key: 'bearingDE', width: 15 },
      { header: 'Last Maintenance', key: 'lastMaintenanceDate', width: 18 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Add data
    activeMotors.forEach(motor => {
      worksheet.addRow({
        tonNumber: motor.eq ? motor.eq.tonNumber : '',
        designation: motor.eq ? motor.eq.designation : '',
        ...motor
      });
    });

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=active_motors_${new Date().toISOString().split('T')[0]}.xlsx`
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



exports.exportActiveMotorsToPDF = async (req, res) => {
  try {
    // 1. DATA FETCHING
    const activeMotors = await Motor.find({ status: 'active' }).populate('eq').lean();
    // 2. DATA PREPARATION (Flatten the data for the PDF service)
    const flatData = activeMotors.map(motor => ({
      tonNumber: motor.eq ? motor.eq.tonNumber : '',
      designation: motor.eq ? motor.eq.designation : '',
      lastMaintenanceDate: formatDate(motor.lastMaintenanceDate),
      ...motor
    }));
    // 3. COLUMN DEFINITION
    const columns = [
      { label: 'TON', key: 'tonNumber', width: 70 },
      { label: 'Designation', key: 'designation', width: 100 },
      { label: 'Serial', key: 'serialNumber', width: 70 },
      { label: 'Power', key: 'power', width: 45 },
      { label: 'Speed', key: 'speed', width: 45 },
      { label: 'Current', key: 'current', width: 45 },
      { label: 'IM', key: 'IM', width: 35 },
      { label: 'Frame', key: 'frameSize', width: 45 },
      { label: 'NDE', key: 'bearingNDE', width: 80 },
      { label: 'DE', key: 'bearingDE', width: 80 },
      { label: 'Last Maint.', key: 'lastMaintenanceDate', width: 70 },
    ];
    // 4. GENERATE PDF (Edit 'orientation' to 'portrait' if needed)
    const pdfBytes = await generateTablePDF({
      title: 'AFC 3 Plant Motors',
      columns: columns,
      data: flatData,
      orientation: 'landscape' // <--- CHANGE THIS TO 'portrait' IF NEEDED
    });

    // 5. SEND RESPONSE
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=active_motors_report.pdf`);
    res.status(200).send(Buffer.from(pdfBytes));


  }catch (error) {
    console.error('Error exporting to PDF with pdf-lib:', error);
    res.status(500).json({ message: 'Server error while generating PDF.', error: error.message });
  }
};

exports.exportSpareMotorsToExcel = async (req, res) => {
  try {
    const spareMotors = await Motor.find({ status: 'spare' }).sort({ power: 1 }).populate('eq').lean();
    
    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Spare Motors');

    // Define columns
    worksheet.columns = [
      { header: 'Serial Number', key: 'serialNumber', width: 15 },
      { header: 'Power', key: 'power', width: 12 },
      { header: 'Speed (RPM)', key: 'speed', width: 12 },
      { header: 'Current', key: 'current', width: 12 },
      { header: 'IM', key: 'IM', width: 10 },
      { header: 'Frame Size', key: 'frameSize', width: 12 },
      { header: 'Bearing NDE', key: 'bearingNDE', width: 15 },
      { header: 'Bearing DE', key: 'bearingDE', width: 15 },
      { header: 'Last Maintenance', key: 'lastMaintenanceDate', width: 18 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Add data
    spareMotors.forEach(motor => {
      worksheet.addRow(motor);
    });

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=spare_motors_${new Date().toISOString().split('T')[0]}.xlsx`
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.exportSpareMotorsToPDF = async (req, res) => {
  try {
    // --- 1. DATA FETCHING  ---
    const spareMotors = await Motor.find({ status: 'spare' }).sort({power: 1}).populate('eq').lean();
    // 2. Col Definitions and PDF Setup    
    const columns = [
      { label: 'Serial', key: 'serialNumber', width: 70 },
      { label: 'Power', key: 'power', width: 45 },
      { label: 'Speed', key: 'speed', width: 45 },
      { label: 'Current', key: 'current', width: 45 },
      { label: 'IM', key: 'IM', width: 35 },
      { label: 'Frame', key: 'frameSize', width: 45 },
      { label: 'NDE', key: 'bearingNDE', width: 80 },
      { label: 'DE', key: 'bearingDE', width: 80 },
      { label: 'Last Maint.', key: 'lastMaintenanceDate', width: 70 },
    ];
    
    // 4. GENERATE PDF (Edit 'orientation' to 'portrait' if needed)
    const pdfBytes = await generateTablePDF({
      title: 'AFC 3 Plant Spare Motors',
      columns: columns,
      data: spareMotors,
      orientation: 'landscape' // <--- CHANGE THIS TO 'portrait' IF NEEDED
    });

    // 5. SEND RESPONSE
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=spare_motors_report.pdf`);
    res.status(200).send(Buffer.from(pdfBytes));

  } catch (error) {
    console.error('Error exporting to PDF with pdf-lib:', error);
    res.status(500).json({ message: 'Server error while generating PDF.', error: error.message });
  }
};

const getBearingPipeline = () => [
  // 1. Filter only active motors
  { $match: { status: 'active' } },
  // 2. Create a temporary array combining both fields
  // We also normalize text to Uppercase to ensure "6309c3" and "6309C3" count as the same
  { $project: {
    bearings: [
      { $toUpper: "$bearingDE" },
      { $toUpper: "$bearingNDE" }
    ]
  }},
  // 3. "Unwind" the array. 
  // This splits 1 document (Motor) into 2 documents (one for each bearing)
  { $unwind: "$bearings" },
  // 4. Remove empty values, nulls, or "N/A" if necessary
  { $match: {
    bearings: { $ne: null, $ne: "", $ne: "N/A" }
  }},
  // 5. Group by the bearing name and count them
  { $group: {
    _id: "$bearings", // Group by the bearing name
    count: { $sum: 1 } // Add 1 for every occurrence
  }},
  // 6. Sort by highest usage first
  { $sort: { count: -1 } }
];

exports.getBearingsReport = async (req, res) => {
  try {
    const bearingStats = await Motor.aggregate(getBearingPipeline());

    // Format the results to a more readable structure
    return res.status(200).json({success: true, data: bearingStats});
  } catch (error) {
    console.error('Error generating bearings report:', error);
    res.status(500).json({ message: 'Server error while generating bearings report.', error: error.message });
  }
};

exports.exportBearingsReportToExcel = async (req, res) => {
  try {
    const bearingStats = await Motor.aggregate(getBearingPipeline());

    // Check if we have any data to export
    if (!bearingStats || bearingStats.length === 0) {
      return res.status(404).json({ message: 'No bearing data found.' });
    }
    // Create a new workbook and add a worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Bearing Report');
    // Define columns
    worksheet.columns = [
      { header: 'Bearing Name', key: 'bearingName', width: 30 },
      { header: 'Usage Count', key: 'usageCount', width: 15 }
    ];
    // Add rows to the worksheet
    bearingStats.forEach(bearing => {
      worksheet.addRow({
        bearingName: bearing._id,
        usageCount: bearing.count
      });
    });

    // Set response headers for Excel download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=bearing_report_${new Date().toISOString().split('T')[0]}.xlsx`
    );
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting bearings report to Excel:', error);
    res.status(500).json({ message: 'Server error while generating bearings report.', error: error.message });
  }
}

exports.exportBearingsReportToPDF = async (req, res) => {
  try {
    // --- 1. DATA FETCHING  ---
    const bearingStats = await Motor.aggregate(getBearingPipeline());
    // --- 2. col Setum ---
    const columns = [
      { label: 'Bearing Name', key: '_id', width: 70 },
      { label: 'Count', key: 'count', width: 45 },
    ];

    // 4. GENERATE PDF (Edit 'orientation' to 'portrait' if needed)
    const pdfBytes = await generateTablePDF({
      title: 'AFC 3 Plant Bearing Usage Report',
      columns: columns,
      data: bearingStats,
      orientation: 'portrait' // <--- CHANGE THIS TO 'portrait' IF NEEDED
    });

    // 5. SEND RESPONSE
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=bearings_report.pdf`);
    res.status(200).send(Buffer.from(pdfBytes));

    
  }  catch (error) {    
    console.error('Error exporting bearings report to PDF:', error);
    res.status(500).json({ message: 'Server error while generating bearings report.', error: error.message });
  }
};
