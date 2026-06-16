// server/controllers/reportController.js
const Motor = require('../models/motorModel');
const PlantEquipment = require('../models/plantEquipmentModel');
const { generateTablePDF } = require('../utils/pdfService'); // Import the service
const { formatDate, formatMTBM } = require('../utils/helpers'); // Your helper functions
const ExcelJS = require('exceljs');
const { PDFDocument, rgb, StandardFonts, PageSizes, degrees } = require('pdf-lib');

const UNIT_CONFIGS = {
  ammonia: {
    name: 'Ammonia',
    prefixes: ['301', '303', '305', '310', '380', '381', '382', '383', '384', '386']
  },
  compressor: {
    name: 'Compressor',
    prefixes: ['302', '305', '307', '309', '320', '385']
  },
  urea: {
    name: 'Urea',
    prefixes: ['321', '322', '323', '328', '329']
  },
  granulation: {
    name: 'Granulation',
    prefixes: ['335']
  },
  water: {
    name: 'Water',
    prefixes: ['388', '389', '390', '392']
  },
  bl: {
    name: 'BL',
    prefixes: ['37']
  },
  uan: {
    name: 'UAN',
    prefixes: ['34']
  },
  zld: {
    name: 'ZLD',
    prefixes: ['Z']
  }
};

const getUnitMotorData = async (unitId) => {
  const config = UNIT_CONFIGS[unitId.toLowerCase()];
  if (!config) {
    throw new Error(`Invalid unit identifier. Valid units are: ${Object.keys(UNIT_CONFIGS).join(', ')}`);
  }

  // Find equipment whose tonNumber starts with any of the prefixes
  const regexes = config.prefixes.map(prefix => new RegExp(`^${prefix}`, 'i'));
  const query = {
    $or: regexes.map(r => ({ tonNumber: r }))
  };

  const equipments = await PlantEquipment.find(query)
    .populate('currentMotor')
    .populate('motorHistory.motor')
    .lean();

  const rows = [];
  for (const eq of equipments) {
    // Collect from history
    if (eq.motorHistory && eq.motorHistory.length > 0) {
      for (const history of eq.motorHistory) {
        if (!history.motor) continue;

        const isCurrent = eq.currentMotor && eq.currentMotor._id.toString() === history.motor._id.toString() && !history.dateRemoved;

        rows.push({
          tonNumber: eq.tonNumber,
          designation: eq.designation,
          serialNumber: history.motor.serialNumber,
          power: history.motor.power || 'N/A',
          speed: history.motor.speed || 'N/A',
          lastMaintenanceDate: history.motor.lastMaintenanceDate,
          status: isCurrent ? 'Active' : 'Historical',
          dateAssigned: history.dateAssigned,
          dateRemoved: history.dateRemoved
        });
      }
    }

    // Fallback if currentMotor is set but somehow not in history (to avoid database inconsistency missing active motor)
    if (eq.currentMotor) {
      const alreadyInHistory = eq.motorHistory && eq.motorHistory.some(
        h => h.motor && h.motor._id.toString() === eq.currentMotor._id.toString()
      );
      if (!alreadyInHistory) {
        rows.push({
          tonNumber: eq.tonNumber,
          designation: eq.designation,
          serialNumber: eq.currentMotor.serialNumber,
          power: eq.currentMotor.power || 'N/A',
          speed: eq.currentMotor.speed || 'N/A',
          lastMaintenanceDate: eq.currentMotor.lastMaintenanceDate,
          status: 'Active',
          dateAssigned: null,
          dateRemoved: null
        });
      }
    }
  }

  // Sort rows: first by tonNumber alphabetically, then by dateAssigned descending (newest first)
  rows.sort((a, b) => {
    const tonCompare = a.tonNumber.localeCompare(b.tonNumber);
    if (tonCompare !== 0) return tonCompare;

    if (!a.dateAssigned) return 1;
    if (!b.dateAssigned) return -1;
    return new Date(b.dateAssigned) - new Date(a.dateAssigned);
  });

  return { unitName: config.name, data: rows };
};


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

// Helper for Detailed Active Motors
const getActiveMotorDetailedData = async () => {
  const equipments = await PlantEquipment.find({ currentMotor: { $ne: null } })
    .populate('currentMotor')
    .lean();

  const activeMotorData = [];
  for (const eq of equipments) {
    const motor = eq.currentMotor;
    if (!motor) continue;

    let dateAssigned = null;
    if (eq.motorHistory && eq.motorHistory.length > 0) {
      const activeHistory = eq.motorHistory.find(
        h => h.motor && h.motor.toString() === motor._id.toString() && !h.dateRemoved
      );
      if (activeHistory) {
        dateAssigned = activeHistory.dateAssigned;
      }
    }

    let calculatedMTBM = motor.meanTimeBetweenMaintenance;
    let isCalculatedMTBM = false;
    if ((calculatedMTBM === null || calculatedMTBM === undefined || typeof calculatedMTBM !== 'number' || isNaN(calculatedMTBM)) && motor.lastMaintenanceDate) {
      const today = new Date();
      const lastMaint = new Date(motor.lastMaintenanceDate);
      if (!isNaN(lastMaint.getTime())) {
        const diffTime = Math.abs(today.getTime() - lastMaint.getTime());
        calculatedMTBM = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        isCalculatedMTBM = true;
      }
    }


    activeMotorData.push({
      motorId: motor._id,
      tonNumber: eq.tonNumber || '',
      designation: eq.designation || '',
      serialNumber: motor.serialNumber || '',
      power: motor.power || 'N/A',
      speed: motor.speed || 'N/A',
      IM: motor.IM || 'N/A',
      frameSize: motor.frameSize || 'N/A',
      bearingNDE: motor.bearingNDE || 'N/A',
      bearingDE: motor.bearingDE || 'N/A',
      lastMaintenanceDate: motor.lastMaintenanceDate || null,
      meanTimeBetweenMaintenance: calculatedMTBM,
      isCalculatedMTBM: isCalculatedMTBM,
      dateAssigned: dateAssigned || null,
      greaseInterval: eq.greaseInterval
    });
  }

  const getCharRank = (char) => {
    if (char === 'P') return 1;
    if (char === 'K') return 2;
    if (char === 'H') return 3;
    return 4;
  };

  const compareFollowChar = (charA, charB) => {
    const rankA = getCharRank(charA);
    const rankB = getCharRank(charB);
    if (rankA !== rankB) return rankA - rankB;
    return charA.localeCompare(charB);
  };

  const parseTonNumber = (tonNumber) => {
    const ton = (tonNumber || '').trim();
    const leadingDigitsMatch = ton.match(/^(\d{3})/);
    const leadingDigits = leadingDigitsMatch ? parseInt(leadingDigitsMatch[1], 10) : 999;

    const remaining = leadingDigitsMatch ? ton.slice(3) : ton;
    const followCharMatch = remaining.match(/^([a-zA-Z])/);
    const followChar = followCharMatch ? followCharMatch[1].toUpperCase() : '';

    const allDigits = ton.match(/\d/g);
    let lastTwoDigits = 0;
    if (allDigits && allDigits.length >= 2) {
      lastTwoDigits = parseInt(allDigits.slice(-2).join(''), 10);
    } else if (allDigits && allDigits.length === 1) {
      lastTwoDigits = parseInt(allDigits[0], 10);
    }

    return { leadingDigits, followChar, lastTwoDigits };
  };

  const compareTons = (tonA, tonB) => {
    const parseA = parseTonNumber(tonA);
    const parseB = parseTonNumber(tonB);

    if (parseA.leadingDigits !== parseB.leadingDigits) {
      return parseA.leadingDigits - parseB.leadingDigits;
    }

    const charCompare = compareFollowChar(parseA.followChar, parseB.followChar);
    if (charCompare !== 0) return charCompare;

    if (parseA.lastTwoDigits !== parseB.lastTwoDigits) {
      return parseA.lastTwoDigits - parseB.lastTwoDigits;
    }

    return tonA.localeCompare(tonB);
  };

  const units = [
    { id: 'ammonia', name: 'Ammonia', prefixes: ['301', '303', '305', '310', '380', '381', '382', '383', '384', '386'] },
    { id: 'compressor', name: 'Compressor', prefixes: ['302', '305', '307', '309', '320', '385'] },
    { id: 'urea', name: 'Urea', prefixes: ['321', '322', '323', '328', '329'] },
    { id: 'granulation', name: 'Granulation', prefixes: ['335'] },
    { id: 'water', name: 'Water', prefixes: ['388', '389', '390', '392'] },
    { id: 'bl', name: 'BL', prefixes: ['37'] },
    { id: 'uan', name: 'UAN', prefixes: ['34'] },
    { id: 'zld', name: 'ZLD', prefixes: ['Z'] }
  ];

  const groupedData = [];
  const matchedMotorIds = new Set();

  units.forEach(unit => {
    const unitMotors = activeMotorData.filter(item => {
      return unit.prefixes.some(prefix =>
        item.tonNumber.toLowerCase().startsWith(prefix.toLowerCase())
      );
    });

    if (unitMotors.length > 0) {
      unitMotors.sort((a, b) => compareTons(a.tonNumber, b.tonNumber));
      unitMotors.forEach(row => matchedMotorIds.add(row.motorId.toString()));
      groupedData.push({
        unitName: unit.name,
        motors: unitMotors
      });
    }
  });

  const otherMotors = activeMotorData.filter(item => !matchedMotorIds.has(item.motorId.toString()));
  if (otherMotors.length > 0) {
    otherMotors.sort((a, b) => compareTons(a.tonNumber, b.tonNumber));
    groupedData.push({
      unitName: 'Other / Uncategorized',
      motors: otherMotors
    });
  }

  return groupedData;
};

exports.getActiveMotorDetailedReport = async (req, res) => {
  try {
    const data = await getActiveMotorDetailedData();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.exportActiveMotorsDetailedToExcel = async (req, res) => {
  try {
    const groupedData = await getActiveMotorDetailedData();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Active Motors Detailed');

    worksheet.columns = [
      { header: 'TON Number', key: 'tonNumber', width: 18 },
      { header: 'Designation', key: 'designation', width: 28 },
      { header: 'Serial Number', key: 'serialNumber', width: 18 },
      { header: 'Power', key: 'power', width: 12 },
      { header: 'Speed', key: 'speed', width: 12 },
      { header: 'IM', key: 'IM', width: 10 },
      { header: 'Frame Size', key: 'frameSize', width: 12 },
      { header: 'Bearing NDE', key: 'bearingNDE', width: 15 },
      { header: 'Bearing DE', key: 'bearingDE', width: 15 },
      { header: 'Last Maintenance', key: 'lastMaintenanceDate', width: 18 },
      { header: 'MTBM', key: 'meanTimeBetweenMaintenance', width: 15 },
      { header: 'Date Assigned', key: 'dateAssigned', width: 18 },
      { header: 'Grease Interval', key: 'greaseInterval', width: 18 },
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    groupedData.forEach(group => {
      const catRow = worksheet.addRow({ tonNumber: `--- ${group.unitName.toUpperCase()} UNIT ---` });
      worksheet.mergeCells(`A${catRow.number}:M${catRow.number}`);
      catRow.font = { bold: true, size: 12, color: { argb: 'FF1F497D' } };
      catRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEAEAEA' }
      };
      catRow.alignment = { horizontal: 'left' };

      group.motors.forEach(row => {
        const isCalculated = row.isCalculatedMTBM;
        const mtbmValue = isCalculated && row.meanTimeBetweenMaintenance !== null && row.meanTimeBetweenMaintenance !== undefined
          ? `${formatMTBM(row.meanTimeBetweenMaintenance)} *`
          : formatMTBM(row.meanTimeBetweenMaintenance);

        const newRow = worksheet.addRow({
          tonNumber: row.tonNumber,
          designation: row.designation,
          serialNumber: row.serialNumber,
          power: row.power,
          speed: row.speed,
          IM: row.IM,
          frameSize: row.frameSize,
          bearingNDE: row.bearingNDE,
          bearingDE: row.bearingDE,
          lastMaintenanceDate: row.lastMaintenanceDate ? formatDate(row.lastMaintenanceDate) : 'N/A',
          meanTimeBetweenMaintenance: mtbmValue,
          dateAssigned: row.dateAssigned ? formatDate(row.dateAssigned) : 'N/A',
          greaseInterval: row.greaseInterval !== null && row.greaseInterval !== undefined 
            ? `${row.greaseInterval} hrs` 
            : 'N/A'
        });

        if (isCalculated) {
          const cell = newRow.getCell(11); // Column K (MTBM)
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFF9C4' } // soft pastel yellow/amber
          };
          cell.font = { italic: true, color: { argb: 'FF975A16' } };
        }
      });

      worksheet.addRow([]);
    });

    // Add footnote for calculated MTBM fields
    const footnoteRow = worksheet.addRow({ tonNumber: '* Note: MTBM values marked with * are dynamically calculated since no historical maintenance log is recorded in the database.' });
    worksheet.mergeCells(`A${footnoteRow.number}:M${footnoteRow.number}`);
    footnoteRow.font = { italic: true, size: 10, color: { argb: 'FF7F7F7F' } };
    footnoteRow.alignment = { horizontal: 'left' };
    worksheet.addRow([]);


    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=active_motors_detailed_${new Date().toISOString().split('T')[0]}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting detailed active motors to Excel:', error);
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

exports.getUnitMotorReport = async (req, res) => {
  try {
    const { unit } = req.query;
    if (!unit) {
      // Return list of available units for dropdown
      const unitsList = Object.keys(UNIT_CONFIGS).map(key => ({
        id: key,
        name: UNIT_CONFIGS[key].name
      }));
      return res.status(200).json({ success: true, units: unitsList });
    }

    const { unitName, data } = await getUnitMotorData(unit);
    res.status(200).json({ success: true, unitName, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.exportUnitMotorReportToExcel = async (req, res) => {
  try {
    const { unit } = req.query;
    if (!unit) {
      return res.status(400).json({ message: 'Unit parameter is required.' });
    }

    const { unitName, data } = await getUnitMotorData(unit);

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`${unitName} Unit Motors`);

    // Define columns
    worksheet.columns = [
      { header: 'TON Number', key: 'tonNumber', width: 15 },
      { header: 'Designation', key: 'designation', width: 25 },
      { header: 'Serial Number', key: 'serialNumber', width: 18 },
      { header: 'Power', key: 'power', width: 12 },
      { header: 'Speed (RPM)', key: 'speed', width: 12 },
      { header: 'Last Maintenance', key: 'lastMaintenanceDate', width: 18 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Date Assigned', key: 'dateAssigned', width: 18 },
      { header: 'Date Removed', key: 'dateRemoved', width: 18 }
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
    data.forEach(row => {
      worksheet.addRow({
        tonNumber: row.tonNumber,
        designation: row.designation,
        serialNumber: row.serialNumber,
        power: row.power,
        speed: row.speed,
        lastMaintenanceDate: formatDate(row.lastMaintenanceDate),
        status: row.status,
        dateAssigned: formatDate(row.dateAssigned),
        dateRemoved: formatDate(row.dateRemoved)
      });
    });

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${unit.toLowerCase()}_motor_report_${new Date().toISOString().split('T')[0]}.xlsx`
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting Unit Motor Report to Excel:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.exportUnitMotorReportToPDF = async (req, res) => {
  try {
    const { unit } = req.query;
    if (!unit) {
      return res.status(400).json({ message: 'Unit parameter is required.' });
    }

    const { unitName, data } = await getUnitMotorData(unit);

    // Flatten the data for the PDF service
    const flatData = data.map(row => ({
      ...row,
      dateAssignedFormatted: row.dateAssigned ? formatDate(row.dateAssigned) : 'N/A',
      dateRemovedFormatted: row.dateRemoved ? formatDate(row.dateRemoved) : 'N/A'
    }));

    // Column definitions for landscape page
    const columns = [
      { label: 'TON Number', key: 'tonNumber', width: 70 },
      { label: 'Designation', key: 'designation', width: 140 },
      { label: 'Serial Number', key: 'serialNumber', width: 85 },
      { label: 'Power', key: 'power', width: 50 },
      { label: 'Speed', key: 'speed', width: 50 },
      { label: 'Last Maint.', key: 'lastMaintenanceDate', width: 75 },
      { label: 'Status', key: 'status', width: 55 },
      { label: 'Assigned', key: 'dateAssignedFormatted', width: 75 },
      { label: 'Removed', key: 'dateRemovedFormatted', width: 75 }
    ];

    // Generate PDF
    const pdfBytes = await generateTablePDF({
      title: `${unitName} Unit Motor Report`,
      columns: columns,
      data: flatData,
      orientation: 'landscape'
    });

    // Send response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${unit.toLowerCase()}_motor_report.pdf`);
    res.status(200).send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Error exporting Unit Motor Report to PDF:', error);
    res.status(500).json({ message: 'Server error while generating PDF.', error: error.message });
  }
};
