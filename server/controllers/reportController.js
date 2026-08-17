// server/controllers/reportController.js
const Motor = require('../models/motorModel');
const PlantEquipment = require('../models/plantEquipmentModel');
const { generateTablePDF } = require('../utils/pdfService'); // Import the service
const { formatDate, formatMTBM } = require('../utils/helpers'); // Your helper functions
const ExcelJS = require('exceljs');
const { PDFDocument, rgb, StandardFonts, PageSizes, degrees } = require('pdf-lib');
const { transformToMeasurementReport } = require('../utils/measurementExtractor');

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
    prefixes: ['388', '389', '390', '392', '393', '394']
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
  },
  ht: {
    name: 'H.T. Motors',
    isHT: true
  }
};

const parsePower = (powerStr) => {
  if (!powerStr) return 0;
  const match = String(powerStr).match(/([0-9.]+)/);
  return match ? parseFloat(match[1]) : 0;
};

const getPrevMaintenanceDate = (motor) => {
  if (!motor || !motor.maintenanceHistory || !Array.isArray(motor.maintenanceHistory) || motor.maintenanceHistory.length === 0) {
    return null;
  }
  const { calculateMTBMFromEvents } = require('../utils/helpers');
  const { completeEvents } = calculateMTBMFromEvents(motor.maintenanceHistory);
  if (completeEvents.length >= 2) {
    return completeEvents[completeEvents.length - 2].date;
  }
  return null;
};

const getUnitFromTon = (tonNumber) => {
  if (!tonNumber) return '';
  const ton = String(tonNumber).trim();
  const matchDigits = ton.match(/^(\d+)/);
  if (matchDigits) {
    const digits = matchDigits[1];
    return digits.substring(0, 3);
  }
  const matchLetters = ton.match(/^([a-zA-Z]+)/);
  if (matchLetters) {
    return matchLetters[1].toUpperCase();
  }
  return ton.substring(0, 3).toUpperCase();
};


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

  const remainingAfterLeading = leadingDigitsMatch ? ton.slice(3) : ton;
  const followCharMatch = remainingAfterLeading.match(/^([a-zA-Z])/);
  const followChar = followCharMatch ? followCharMatch[1].toUpperCase() : '';

  // Middle digits (digits immediately after followChar)
  const remainingAfterFollow = followCharMatch ? remainingAfterLeading.slice(1) : remainingAfterLeading;
  const midDigitsMatch = remainingAfterFollow.match(/^(\d+)/);
  const midDigits = midDigitsMatch ? parseInt(midDigitsMatch[1], 10) : 0;

  // Sub-character (character immediately after middle digits or before dot or at position -5)
  const remainingAfterMid = midDigitsMatch ? remainingAfterFollow.slice(midDigitsMatch[1].length) : remainingAfterFollow;
  let subChar = '';
  const subCharMatch = remainingAfterMid.match(/^([a-zA-Z])/);
  if (subCharMatch) {
    subChar = subCharMatch[1];
  } else {
    const dotIndex = ton.indexOf('.');
    if (dotIndex > 0) {
      subChar = ton.charAt(dotIndex - 1);
    } else if (ton.length >= 5) {
      subChar = ton.charAt(ton.length - 5);
    }
  }
  subChar = subChar.toUpperCase();

  const allDigits = ton.match(/\d/g);
  let lastTwoDigits = 0;
  if (allDigits && allDigits.length >= 2) {
    lastTwoDigits = parseInt(allDigits.slice(-2).join(''), 10);
  } else if (allDigits && allDigits.length === 1) {
    lastTwoDigits = parseInt(allDigits[0], 10);
  }

  return { leadingDigits, followChar, midDigits, subChar, lastTwoDigits };
};

const compareTons = (tonA, tonB) => {
  const parseA = parseTonNumber(tonA);
  const parseB = parseTonNumber(tonB);

  if (parseA.leadingDigits !== parseB.leadingDigits) {
    return parseA.leadingDigits - parseB.leadingDigits;
  }

  const charCompare = compareFollowChar(parseA.followChar, parseB.followChar);
  if (charCompare !== 0) return charCompare;

  // Compare middle digits
  if (parseA.midDigits !== parseB.midDigits) {
    return parseA.midDigits - parseB.midDigits;
  }

  // Compare sub-characters alphabetically
  const subCompare = parseA.subChar.localeCompare(parseB.subChar);
  if (subCompare !== 0) return subCompare;

  if (parseA.lastTwoDigits !== parseB.lastTwoDigits) {
    return parseA.lastTwoDigits - parseB.lastTwoDigits;
  }

  return String(tonA || '').localeCompare(String(tonB || ''));
};

const getUnitMotorData = async (unitId) => {
  const config = UNIT_CONFIGS[unitId.toLowerCase()];
  if (!config) {
    throw new Error(`Invalid unit identifier. Valid units are: ${Object.keys(UNIT_CONFIGS).join(', ')}`);
  }

  let equipments;
  if (config.isHT) {
    equipments = await PlantEquipment.find({})
      .populate('currentMotor', 'serialNumber power speed lastMaintenanceDate')
      .populate('motorHistory.motor', 'serialNumber power speed lastMaintenanceDate')
      .lean();
  } else {
    // Find equipment whose tonNumber starts with any of the prefixes
    const regexes = config.prefixes.map(prefix => new RegExp(`^${prefix}`, 'i'));
    const query = {
      $or: regexes.map(r => ({ tonNumber: r }))
    };

    equipments = await PlantEquipment.find(query)
      .populate('currentMotor', 'serialNumber power speed lastMaintenanceDate')
      .populate('motorHistory.motor', 'serialNumber power speed lastMaintenanceDate')
      .lean();
  }

  const rows = [];
  for (const eq of equipments) {
    // Collect from history
    if (eq.motorHistory && eq.motorHistory.length > 0) {
      for (const history of eq.motorHistory) {
        if (!history.motor) continue;

        const isHTMotor = parsePower(history.motor.power) > 160;
        if (config.isHT && !isHTMotor) continue;
        if (!config.isHT && isHTMotor) continue;

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
      const isHTMotor = parsePower(eq.currentMotor.power) > 160;
      if (config.isHT && !isHTMotor) continue;
      if (!config.isHT && isHTMotor) continue;

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

  // Sort rows: 
  // 1. Status: Active first, Historical second
  // 2. TON number: compareTons custom sort
  // 3. Date assigned: descending (newest first)
  rows.sort((a, b) => {
    // Status comparison (Active before Historical)
    if (a.status !== b.status) {
      return a.status === 'Active' ? -1 : 1;
    }

    // TON number comparison
    const tonCompare = compareTons(a.tonNumber, b.tonNumber);
    if (tonCompare !== 0) return tonCompare;

    // Date assigned comparison (newest first)
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
  try {
    const data = await getActiveMotorDetailedData();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getSpareMotorReport = async (req, res) => {
  res.status(200).json({ message: 'Spare Motor Report' });
};

// Additional report generation functions (e.g., export to PDF/Excel) can be added here
exports.exportActiveMotorsToExcel = async (req, res) => {
  try {
    const groupedData = await getActiveMotorDetailedData();

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
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Add data
    groupedData.forEach(group => {
      const headerText = group.unitName === 'H.T.' ? '--- H.T. MOTORS ---' : `--- ${group.unitName.toUpperCase()} UNIT ---`;
      const catRow = worksheet.addRow({ tonNumber: headerText });
      worksheet.mergeCells(`A${catRow.number}:K${catRow.number}`);
      catRow.font = { bold: true, size: 12, color: { argb: 'FF1F497D' } };
      catRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEAEAEA' }
      };
      catRow.alignment = { horizontal: 'left' };

      group.motors.forEach(row => {
        worksheet.addRow({
          tonNumber: row.tonNumber,
          designation: row.designation,
          serialNumber: row.serialNumber,
          power: row.power,
          speed: row.speed,
          current: row.current || 'N/A',
          IM: row.IM,
          frameSize: row.frameSize,
          bearingNDE: row.bearingNDE,
          bearingDE: row.bearingDE,
          lastMaintenanceDate: row.lastMaintenanceDate ? formatDate(row.lastMaintenanceDate) : 'N/A'
        });
      });

      worksheet.addRow([]);
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
    .populate({ path: 'currentMotor', select: '-assignmentHistory' })
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

    let isCalculatedMTBM = false;
    let calculatedMTBM = motor.meanTimeBetweenMaintenance;
    if (calculatedMTBM === null || calculatedMTBM === undefined || typeof calculatedMTBM !== 'number' || isNaN(calculatedMTBM)) {
      isCalculatedMTBM = true;
      calculatedMTBM = null;
    }

    let timeSinceLastMaintenance = null;
    if (motor.lastMaintenanceDate) {
      const today = new Date();
      const lastMaint = new Date(motor.lastMaintenanceDate);
      if (!isNaN(lastMaint.getTime())) {
        const diffTime = Math.abs(today.getTime() - lastMaint.getTime());
        timeSinceLastMaintenance = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
    }


    activeMotorData.push({
      motorId: motor._id,
      tonNumber: eq.tonNumber || '',
      designation: eq.designation || '',
      serialNumber: motor.serialNumber || '',
      power: motor.power || 'N/A',
      speed: motor.speed || 'N/A',
      current: motor.current || 'N/A',
      IM: motor.IM || 'N/A',
      frameSize: motor.frameSize || 'N/A',
      bearingNDE: motor.bearingNDE || 'N/A',
      bearingDE: motor.bearingDE || 'N/A',
      prevMaintenanceDate: getPrevMaintenanceDate(motor),
      lastMaintenanceDate: motor.lastMaintenanceDate || null,
      meanTimeBetweenMaintenance: calculatedMTBM,
      isCalculatedMTBM: isCalculatedMTBM,
      timeSinceLastMaintenance: timeSinceLastMaintenance,
      dateAssigned: dateAssigned || null,
      greaseInterval: eq.greaseInterval
    });
  }

  const groupedData = [];
  const matchedMotorIds = new Set();

  // Filter H.T. motors first (power > 160)
  const htMotors = activeMotorData.filter(item => {
    return parsePower(item.power) > 160;
  });

  if (htMotors.length > 0) {
    htMotors.sort((a, b) => compareTons(a.tonNumber, b.tonNumber));
    htMotors.forEach(row => matchedMotorIds.add(row.motorId.toString()));
    groupedData.push({
      unitName: 'H.T.',
      motors: htMotors
    });
  }

  const units = Object.keys(UNIT_CONFIGS)
    .filter(key => key !== 'ht')
    .map(key => ({
      id: key,
      name: UNIT_CONFIGS[key].name,
      prefixes: UNIT_CONFIGS[key].prefixes
    }));

  units.forEach(unit => {
    const unitMotors = activeMotorData.filter(item => {
      return !matchedMotorIds.has(item.motorId.toString()) &&
        unit.prefixes.some(prefix =>
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

    const columnsConfig = [
      { header: 'TON Number', key: 'tonNumber', width: 18 },
      { header: 'Designation', key: 'designation', width: 28 },
      { header: 'Serial Number', key: 'serialNumber', width: 18 },
      { header: 'Power', key: 'power', width: 12 },
      { header: 'Speed', key: 'speed', width: 12 },
      { header: 'IM', key: 'IM', width: 10 },
      { header: 'Frame Size', key: 'frameSize', width: 12 },
      { header: 'Bearing NDE', key: 'bearingNDE', width: 15 },
      { header: 'Bearing DE', key: 'bearingDE', width: 15 },
      { header: 'Prev. Maintenance', key: 'prevMaintenanceDate', width: 18 },
      { header: 'Last Maintenance', key: 'lastMaintenanceDate', width: 18 },
      { header: 'MTBM', key: 'meanTimeBetweenMaintenance', width: 15 },
      { header: 'Time Since Last Maint.', key: 'timeSinceLastMaintenance', width: 22 },
      { header: 'Grease Interval', key: 'greaseInterval', width: 18 },
    ];

    worksheet.columns = columnsConfig;

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    groupedData.forEach(group => {
      const headerText = group.unitName === 'H.T.' ? '--- H.T. MOTORS ---' : `--- ${group.unitName.toUpperCase()} UNIT ---`;
      const catRow = worksheet.addRow({ tonNumber: headerText });
      worksheet.mergeCells(`A${catRow.number}:N${catRow.number}`);
      catRow.font = { bold: true, size: 12, color: { argb: 'FF1F497D' } };
      catRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEAEAEA' }
      };
      catRow.alignment = { horizontal: 'left' };

      let prevUnit = null;

      group.motors.forEach(row => {
        const currentUnit = getUnitFromTon(row.tonNumber);
        if (prevUnit !== null && currentUnit !== prevUnit) {
          const sepRow = worksheet.addRow({});
          for (let i = 1; i <= columnsConfig.length; i++) {
            sepRow.getCell(i).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFD9E1F2' }
            };
          }
          sepRow.height = 15;
        }
        prevUnit = currentUnit;

        const isCalculated = row.isCalculatedMTBM;
        const mtbmValue = formatMTBM(row.meanTimeBetweenMaintenance);
        const timeSinceLastMaintValue = isCalculated && row.timeSinceLastMaintenance !== null && row.timeSinceLastMaintenance !== undefined
          ? `${formatMTBM(row.timeSinceLastMaintenance)} *`
          : formatMTBM(row.timeSinceLastMaintenance);

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
          prevMaintenanceDate: row.prevMaintenanceDate ? formatDate(row.prevMaintenanceDate) : 'N/A',
          lastMaintenanceDate: row.lastMaintenanceDate ? formatDate(row.lastMaintenanceDate) : 'N/A',
          meanTimeBetweenMaintenance: mtbmValue,
          timeSinceLastMaintenance: timeSinceLastMaintValue,
          greaseInterval: row.greaseInterval !== null && row.greaseInterval !== undefined
            ? `${row.greaseInterval} hrs`
            : 'N/A'
        });

        if (isCalculated) {
          const cell = newRow.getCell(13); // Column M (Time Since Last Maint.)
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
    const footnoteRow = worksheet.addRow({ tonNumber: '* Note: Time Since Last Maint. values marked with * are dynamically calculated since no historical maintenance log is recorded in the database.' });
    worksheet.mergeCells(`A${footnoteRow.number}:N${footnoteRow.number}`);
    footnoteRow.font = { italic: true, size: 10, color: { argb: 'FF7F7F7F' } };
    footnoteRow.alignment = { horizontal: 'left' };
    worksheet.addRow([]);

    // Add category-specific sheets
    groupedData.forEach(group => {
      // Clean and sanitize the sheet name to fit Excel guidelines (length <= 31, no invalid characters)
      let sheetName = group.unitName.replace(/[\/\\?*:\[\]]/g, '-');
      if (sheetName.length > 31) {
        sheetName = sheetName.substring(0, 31);
      }

      const catSheet = workbook.addWorksheet(sheetName);
      catSheet.columns = columnsConfig;

      catSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      catSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      catSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

      let hasCalculated = false;
      let prevUnit = null;

      group.motors.forEach(row => {
        const currentUnit = getUnitFromTon(row.tonNumber);
        if (prevUnit !== null && currentUnit !== prevUnit) {
          const sepRow = catSheet.addRow({});
          for (let i = 1; i <= columnsConfig.length; i++) {
            sepRow.getCell(i).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFD9E1F2' }
            };
          }
          sepRow.height = 15;
        }
        prevUnit = currentUnit;

        const isCalculated = row.isCalculatedMTBM;
        if (isCalculated) {
          hasCalculated = true;
        }

        const mtbmValue = formatMTBM(row.meanTimeBetweenMaintenance);
        const timeSinceLastMaintValue = isCalculated && row.timeSinceLastMaintenance !== null && row.timeSinceLastMaintenance !== undefined
          ? `${formatMTBM(row.timeSinceLastMaintenance)} *`
          : formatMTBM(row.timeSinceLastMaintenance);

        const newRow = catSheet.addRow({
          tonNumber: row.tonNumber,
          designation: row.designation,
          serialNumber: row.serialNumber,
          power: row.power,
          speed: row.speed,
          IM: row.IM,
          frameSize: row.frameSize,
          bearingNDE: row.bearingNDE,
          bearingDE: row.bearingDE,
          prevMaintenanceDate: row.prevMaintenanceDate ? formatDate(row.prevMaintenanceDate) : 'N/A',
          lastMaintenanceDate: row.lastMaintenanceDate ? formatDate(row.lastMaintenanceDate) : 'N/A',
          meanTimeBetweenMaintenance: mtbmValue,
          timeSinceLastMaintenance: timeSinceLastMaintValue,
          greaseInterval: row.greaseInterval !== null && row.greaseInterval !== undefined
            ? `${row.greaseInterval} hrs`
            : 'N/A'
        });

        if (isCalculated) {
          const cell = newRow.getCell(13); // Column M (Time Since Last Maint.)
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFF9C4' } // soft pastel yellow/amber
          };
          cell.font = { italic: true, color: { argb: 'FF975A16' } };
        }
      });

      if (hasCalculated) {
        catSheet.addRow([]);
        const footnoteRowCat = catSheet.addRow({ tonNumber: '* Note: Time Since Last Maint. values marked with * are dynamically calculated since no historical maintenance log is recorded in the database.' });
        catSheet.mergeCells(`A${footnoteRowCat.number}:N${footnoteRowCat.number}`);
        footnoteRowCat.font = { italic: true, size: 10, color: { argb: 'FF7F7F7F' } };
        footnoteRowCat.alignment = { horizontal: 'left' };
        catSheet.addRow([]);
      }
    });

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

const getStatusRank = (status) => {
  if (status === 'Active') return 1;
  if (status === 'Spare') return 2;
  if (status === 'Historical') return 3;
  return 4;
};

const compareAllMotors = (a, b) => {
  const parseA = parseTonNumber(a.tonNumber);
  const parseB = parseTonNumber(b.tonNumber);

  // 1. Compare leadingDigits
  if (parseA.leadingDigits !== parseB.leadingDigits) {
    return parseA.leadingDigits - parseB.leadingDigits;
  }

  // 2. Compare followChar
  const charCompare = compareFollowChar(parseA.followChar, parseB.followChar);
  if (charCompare !== 0) return charCompare;

  // 3. Compare midDigits (defines principle group, e.g. 001)
  if (parseA.midDigits !== parseB.midDigits) {
    return parseA.midDigits - parseB.midDigits;
  }

  // 4. If same main group, sort by Status Rank
  const rankA = getStatusRank(a.status);
  const rankB = getStatusRank(b.status);
  if (rankA !== rankB) {
    return rankA - rankB;
  }

  // 5. Within the same status, sort by subChar (train)
  const subCompare = parseA.subChar.localeCompare(parseB.subChar);
  if (subCompare !== 0) return subCompare;

  // 6. Within the same status and train, sort by lastTwoDigits (suffix)
  if (parseA.lastTwoDigits !== parseB.lastTwoDigits) {
    return parseA.lastTwoDigits - parseB.lastTwoDigits;
  }

  // 7. For historical, sort by dateAssigned descending (newest first)
  if (a.status === 'Historical' && a.dateAssigned && b.dateAssigned) {
    return new Date(b.dateAssigned) - new Date(a.dateAssigned);
  }

  // 8. Fallback to literal comparison
  return String(a.tonNumber || '').localeCompare(String(b.tonNumber || ''));
};

const getAllMotorDetailedData = async () => {
  // Fetch all equipment with their current motors and history
  const equipments = await PlantEquipment.find({})
    .populate({ path: 'currentMotor', select: '-assignmentHistory' })
    .populate({ path: 'motorHistory.motor', select: '-assignmentHistory' })
    .lean();

  const allMotorRows = [];

  for (const eq of equipments) {
    const activeMotor = eq.currentMotor;

    // A. Active Motor
    if (activeMotor) {
      let dateAssigned = null;
      if (eq.motorHistory && eq.motorHistory.length > 0) {
        const activeHistory = eq.motorHistory.find(
          h => h.motor && h.motor._id.toString() === activeMotor._id.toString() && !h.dateRemoved
        );
        if (activeHistory) {
          dateAssigned = activeHistory.dateAssigned;
        }
      }

      let isCalculatedMTBM = false;
      let calculatedMTBM = activeMotor.meanTimeBetweenMaintenance;
      if (calculatedMTBM === null || calculatedMTBM === undefined || typeof calculatedMTBM !== 'number' || isNaN(calculatedMTBM)) {
        isCalculatedMTBM = true;
        calculatedMTBM = null;
      }

      let timeSinceLastMaintenance = null;
      if (activeMotor.lastMaintenanceDate) {
        const today = new Date();
        const lastMaint = new Date(activeMotor.lastMaintenanceDate);
        if (!isNaN(lastMaint.getTime())) {
          const diffTime = Math.abs(today.getTime() - lastMaint.getTime());
          timeSinceLastMaintenance = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
      }

      allMotorRows.push({
        motorId: activeMotor._id,
        tonNumber: eq.tonNumber || '',
        designation: eq.designation || '',
        serialNumber: activeMotor.serialNumber || '',
        power: activeMotor.power || 'N/A',
        speed: activeMotor.speed || 'N/A',
        current: activeMotor.current || 'N/A',
        IM: activeMotor.IM || 'N/A',
        frameSize: activeMotor.frameSize || 'N/A',
        bearingNDE: activeMotor.bearingNDE || 'N/A',
        bearingDE: activeMotor.bearingDE || 'N/A',
        prevMaintenanceDate: getPrevMaintenanceDate(activeMotor),
        lastMaintenanceDate: activeMotor.lastMaintenanceDate || null,
        meanTimeBetweenMaintenance: calculatedMTBM,
        isCalculatedMTBM: isCalculatedMTBM,
        timeSinceLastMaintenance: timeSinceLastMaintenance,
        dateAssigned: dateAssigned || null,
        dateRemoved: null,
        greaseInterval: eq.greaseInterval,
        status: 'Active',
        Warehouse: activeMotor.Warehouse || 'N/A',
        SAP: activeMotor.SAP || 'N/A'
      });
    }
  }

  // C. Spare Motors
  const spareMotors = await Motor.find({ status: 'spare' }).lean();
  for (const motor of spareMotors) {
    let isCalculatedMTBM = false;
    let calculatedMTBM = motor.meanTimeBetweenMaintenance;
    if (calculatedMTBM === null || calculatedMTBM === undefined || typeof calculatedMTBM !== 'number' || isNaN(calculatedMTBM)) {
      isCalculatedMTBM = true;
      calculatedMTBM = null;
    }

    let timeSinceLastMaintenance = null;
    if (motor.lastMaintenanceDate) {
      const today = new Date();
      const lastMaint = new Date(motor.lastMaintenanceDate);
      if (!isNaN(lastMaint.getTime())) {
        const diffTime = Math.abs(today.getTime() - lastMaint.getTime());
        timeSinceLastMaintenance = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
    }

    let tonNumber = '';
    let designation = 'Spare Motor';
    if (motor.assignmentHistory && motor.assignmentHistory.length > 0) {
      const sortedHistory = [...motor.assignmentHistory].sort((a, b) => new Date(b.dateInstalled) - new Date(a.dateInstalled));
      const lastAssigned = sortedHistory[0];
      if (lastAssigned && lastAssigned.ton) {
        tonNumber = lastAssigned.ton;
        designation = `Spare (Prev: ${lastAssigned.ton})`;
      }
    }

    allMotorRows.push({
      motorId: motor._id,
      tonNumber: tonNumber,
      designation: designation,
      serialNumber: motor.serialNumber || '',
      power: motor.power || 'N/A',
      speed: motor.speed || 'N/A',
      current: motor.current || 'N/A',
      IM: motor.IM || 'N/A',
      frameSize: motor.frameSize || 'N/A',
      bearingNDE: motor.bearingNDE || 'N/A',
      bearingDE: motor.bearingDE || 'N/A',
      prevMaintenanceDate: getPrevMaintenanceDate(motor),
      lastMaintenanceDate: motor.lastMaintenanceDate || null,
      meanTimeBetweenMaintenance: calculatedMTBM,
      isCalculatedMTBM: isCalculatedMTBM,
      timeSinceLastMaintenance: timeSinceLastMaintenance,
      dateAssigned: null,
      dateRemoved: null,
      greaseInterval: null,
      status: 'Spare',
      Warehouse: motor.Warehouse || 'N/A',
      SAP: motor.SAP || 'N/A'
    });
  }

  const groupedData = [];
  const matchedMotorKeys = new Set();
  const getRowKey = (row) => `${row.motorId.toString()}-${row.status}-${row.tonNumber}`;

  // Filter H.T. motors first
  const htMotors = allMotorRows.filter(item => {
    return parsePower(item.power) > 160;
  });

  if (htMotors.length > 0) {
    htMotors.sort(compareAllMotors);
    htMotors.forEach(row => matchedMotorKeys.add(getRowKey(row)));
    groupedData.push({
      unitName: 'H.T.',
      motors: htMotors
    });
  }

  const units = Object.keys(UNIT_CONFIGS)
    .filter(key => key !== 'ht')
    .map(key => ({
      id: key,
      name: UNIT_CONFIGS[key].name,
      prefixes: UNIT_CONFIGS[key].prefixes
    }));

  units.forEach(unit => {
    const unitMotors = allMotorRows.filter(item => {
      return !matchedMotorKeys.has(getRowKey(item)) &&
        unit.prefixes.some(prefix =>
          item.tonNumber.toLowerCase().startsWith(prefix.toLowerCase())
        );
    });

    if (unitMotors.length > 0) {
      unitMotors.sort(compareAllMotors);
      unitMotors.forEach(row => matchedMotorKeys.add(getRowKey(row)));
      groupedData.push({
        unitName: unit.name,
        motors: unitMotors
      });
    }
  });

  const otherMotors = allMotorRows.filter(item => !matchedMotorKeys.has(getRowKey(item)));
  if (otherMotors.length > 0) {
    otherMotors.sort(compareAllMotors);
    groupedData.push({
      unitName: 'Other / Uncategorized',
      motors: otherMotors
    });
  }

  return groupedData;
};

exports.getAllMotorDetailedReport = async (req, res) => {
  try {
    const data = await getAllMotorDetailedData();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.exportAllMotorsDetailedToExcel = async (req, res) => {
  try {
    const groupedData = await getAllMotorDetailedData();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('All Motors Detailed');

    const columnsConfig = [
      { header: 'TON Number', key: 'tonNumber', width: 18 },
      { header: 'Designation', key: 'designation', width: 28 },
      { header: 'Serial Number', key: 'serialNumber', width: 18 },
      { header: 'Power', key: 'power', width: 12 },
      { header: 'Speed', key: 'speed', width: 12 },
      { header: 'IM', key: 'IM', width: 10 },
      { header: 'Frame Size', key: 'frameSize', width: 12 },
      { header: 'Bearing NDE', key: 'bearingNDE', width: 15 },
      { header: 'Bearing DE', key: 'bearingDE', width: 15 },
      { header: 'Prev. Maintenance', key: 'prevMaintenanceDate', width: 18 },
      { header: 'Last Maintenance', key: 'lastMaintenanceDate', width: 18 },
      { header: 'MTBM', key: 'meanTimeBetweenMaintenance', width: 15 },
      { header: 'Time Since Last Maint.', key: 'timeSinceLastMaintenance', width: 22 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Grease Interval', key: 'greaseInterval', width: 18 },
      { header: 'Warehouse No.', key: 'Warehouse', width: 15 },
      { header: 'SAP No.', key: 'SAP', width: 15 },
    ];

    worksheet.columns = columnsConfig;

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    groupedData.forEach(group => {
      const headerText = group.unitName === 'H.T.' ? '--- H.T. MOTORS ---' : `--- ${group.unitName.toUpperCase()} UNIT ---`;
      const catRow = worksheet.addRow({ tonNumber: headerText });
      worksheet.mergeCells(`A${catRow.number}:Q${catRow.number}`);
      catRow.font = { bold: true, size: 12, color: { argb: 'FF1F497D' } };
      catRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEAEAEA' }
      };
      catRow.alignment = { horizontal: 'left' };

      let prevUnit = null;

      group.motors.forEach(row => {
        const currentUnit = getUnitFromTon(row.tonNumber);
        if (prevUnit !== null && currentUnit !== prevUnit) {
          const sepRow = worksheet.addRow({});
          for (let i = 1; i <= columnsConfig.length; i++) {
            sepRow.getCell(i).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFD9E1F2' }
            };
          }
          sepRow.height = 15;
        }
        prevUnit = currentUnit;

        const isCalculated = row.isCalculatedMTBM;
        const mtbmValue = formatMTBM(row.meanTimeBetweenMaintenance);
        const timeSinceLastMaintValue = isCalculated && row.timeSinceLastMaintenance !== null && row.timeSinceLastMaintenance !== undefined
          ? `${formatMTBM(row.timeSinceLastMaintenance)} *`
          : formatMTBM(row.timeSinceLastMaintenance);

        const newRow = worksheet.addRow({
          tonNumber: row.tonNumber || 'N/A',
          designation: row.designation,
          serialNumber: row.serialNumber,
          Warehouse: row.Warehouse || 'N/A',
          SAP: row.SAP || 'N/A',
          power: row.power,
          speed: row.speed,
          IM: row.IM,
          frameSize: row.frameSize,
          bearingNDE: row.bearingNDE,
          bearingDE: row.bearingDE,
          prevMaintenanceDate: row.prevMaintenanceDate ? formatDate(row.prevMaintenanceDate) : 'N/A',
          lastMaintenanceDate: row.lastMaintenanceDate ? formatDate(row.lastMaintenanceDate) : 'N/A',
          meanTimeBetweenMaintenance: mtbmValue,
          timeSinceLastMaintenance: timeSinceLastMaintValue,
          status: row.status,
          greaseInterval: row.greaseInterval !== null && row.greaseInterval !== undefined
            ? `${row.greaseInterval} hrs`
            : 'N/A'
        });

        if (row.status === 'Spare') {
          for (let i = 1; i <= columnsConfig.length; i++) {
            newRow.getCell(i).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFF0E6' }
            };
          }
        }

        if (isCalculated) {
          const cell = newRow.getCell(13); // Column M (Time Since Last Maint.)
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFF9C4' }
          };
          cell.font = { italic: true, color: { argb: 'FF975A16' } };
        }

        const statusCell = newRow.getCell(14); // Column N (Status)
        if (row.status === 'Active') {
          statusCell.font = { color: { argb: 'FF27AE60' }, bold: true };
        } else if (row.status === 'Spare') {
          statusCell.font = { color: { argb: 'FFD35400' }, bold: true }; // Orange color
        }
      });

      worksheet.addRow([]);
    });

    const footnoteRow = worksheet.addRow({ tonNumber: '* Note: Time Since Last Maint. values marked with * are dynamically calculated since no historical maintenance log is recorded in the database.' });
    worksheet.mergeCells(`A${footnoteRow.number}:Q${footnoteRow.number}`);
    footnoteRow.font = { italic: true, size: 10, color: { argb: 'FF7F7F7F' } };
    footnoteRow.alignment = { horizontal: 'left' };
    worksheet.addRow([]);

    // Add category-specific sheets
    groupedData.forEach(group => {
      // Clean and sanitize the sheet name to fit Excel guidelines (length <= 31, no invalid characters)
      let sheetName = group.unitName.replace(/[\/\\?*:\[\]]/g, '-');
      if (sheetName.length > 31) {
        sheetName = sheetName.substring(0, 31);
      }

      const catSheet = workbook.addWorksheet(sheetName);
      catSheet.columns = columnsConfig;

      catSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      catSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      catSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

      let hasCalculated = false;
      let prevUnit = null;

      group.motors.forEach(row => {
        const currentUnit = getUnitFromTon(row.tonNumber);
        if (prevUnit !== null && currentUnit !== prevUnit) {
          const sepRow = catSheet.addRow({});
          for (let i = 1; i <= columnsConfig.length; i++) {
            sepRow.getCell(i).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFD9E1F2' }
            };
          }
          sepRow.height = 15;
        }
        prevUnit = currentUnit;

        const isCalculated = row.isCalculatedMTBM;
        if (isCalculated) {
          hasCalculated = true;
        }

        const mtbmValue = formatMTBM(row.meanTimeBetweenMaintenance);
        const timeSinceLastMaintValue = isCalculated && row.timeSinceLastMaintenance !== null && row.timeSinceLastMaintenance !== undefined
          ? `${formatMTBM(row.timeSinceLastMaintenance)} *`
          : formatMTBM(row.timeSinceLastMaintenance);

        const newRow = catSheet.addRow({
          tonNumber: row.tonNumber || 'N/A',
          designation: row.designation,
          serialNumber: row.serialNumber,
          Warehouse: row.Warehouse || 'N/A',
          SAP: row.SAP || 'N/A',
          power: row.power,
          speed: row.speed,
          IM: row.IM,
          frameSize: row.frameSize,
          bearingNDE: row.bearingNDE,
          bearingDE: row.bearingDE,
          prevMaintenanceDate: row.prevMaintenanceDate ? formatDate(row.prevMaintenanceDate) : 'N/A',
          lastMaintenanceDate: row.lastMaintenanceDate ? formatDate(row.lastMaintenanceDate) : 'N/A',
          meanTimeBetweenMaintenance: mtbmValue,
          timeSinceLastMaintenance: timeSinceLastMaintValue,
          status: row.status,
          greaseInterval: row.greaseInterval !== null && row.greaseInterval !== undefined
            ? `${row.greaseInterval} hrs`
            : 'N/A'
        });

        if (row.status === 'Spare') {
          for (let i = 1; i <= columnsConfig.length; i++) {
            newRow.getCell(i).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFF0E6' }
            };
          }
        }

        if (isCalculated) {
          const cell = newRow.getCell(13); // Column M (Time Since Last Maint.)
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFF9C4' }
          };
          cell.font = { italic: true, color: { argb: 'FF975A16' } };
        }

        const statusCell = newRow.getCell(14); // Column N (Status)
        if (row.status === 'Active') {
          statusCell.font = { color: { argb: 'FF27AE60' }, bold: true };
        } else if (row.status === 'Spare') {
          statusCell.font = { color: { argb: 'FFD35400' }, bold: true };
        }
      });

      if (hasCalculated) {
        catSheet.addRow([]);
        const footnoteRowCat = catSheet.addRow({ tonNumber: '* Note: Time Since Last Maint. values marked with * are dynamically calculated since no historical maintenance log is recorded in the database.' });
        catSheet.mergeCells(`A${footnoteRowCat.number}:Q${footnoteRowCat.number}`);
        footnoteRowCat.font = { italic: true, size: 10, color: { argb: 'FF7F7F7F' } };
        footnoteRowCat.alignment = { horizontal: 'left' };
        catSheet.addRow([]);
      }
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=all_motors_detailed_${new Date().toISOString().split('T')[0]}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting detailed all motors to Excel:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



exports.exportActiveMotorsToPDF = async (req, res) => {
  try {
    // 1. DATA FETCHING
    const groupedData = await getActiveMotorDetailedData();
    // 2. DATA PREPARATION (Flatten the data for the PDF service)
    const flatData = [];
    groupedData.forEach(group => {
      group.motors.forEach(motor => {
        flatData.push({
          tonNumber: motor.tonNumber,
          designation: motor.designation,
          serialNumber: motor.serialNumber,
          power: motor.power,
          speed: motor.speed,
          current: motor.current || 'N/A',
          IM: motor.IM,
          frameSize: motor.frameSize,
          bearingNDE: motor.bearingNDE,
          bearingDE: motor.bearingDE,
          lastMaintenanceDate: formatDate(motor.lastMaintenanceDate)
        });
      });
    });
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


  } catch (error) {
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
    const spareMotors = await Motor.find({ status: 'spare' }).sort({ power: 1 }).populate('eq').lean();
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
  {
    $project: {
      bearings: [
        { $toUpper: "$bearingDE" },
        { $toUpper: "$bearingNDE" }
      ]
    }
  },
  // 3. "Unwind" the array. 
  // This splits 1 document (Motor) into 2 documents (one for each bearing)
  { $unwind: "$bearings" },
  // 4. Remove empty values, nulls, or "N/A" if necessary
  {
    $match: {
      bearings: { $ne: null, $ne: "", $ne: "N/A" }
    }
  },
  // 5. Group by the bearing name and count them
  {
    $group: {
      _id: "$bearings", // Group by the bearing name
      count: { $sum: 1 } // Add 1 for every occurrence
    }
  },
  // 6. Sort by highest usage first
  { $sort: { count: -1 } }
];

exports.getBearingsReport = async (req, res) => {
  try {
    const bearingStats = await Motor.aggregate(getBearingPipeline());

    // Format the results to a more readable structure
    return res.status(200).json({ success: true, data: bearingStats });
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


  } catch (error) {
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

// --- Shutdown Report Helpers and Controllers ---

const parseBoundaryDate = (dateStr, isEnd = false) => {
  if (!dateStr) return isEnd ? new Date() : new Date(0);
  const rawStr = String(dateStr).trim();
  const dateOnlyMatch = rawStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (dateOnlyMatch) {
    const year = parseInt(dateOnlyMatch[1], 10);
    const month = parseInt(dateOnlyMatch[2], 10) - 1;
    const day = parseInt(dateOnlyMatch[3], 10);
    return isEnd 
      ? new Date(year, month, day, 23, 59, 59, 999) 
      : new Date(year, month, day, 0, 0, 0, 0);
  }
  const d = new Date(rawStr);
  if (!isNaN(d.getTime())) {
    if (isEnd) d.setHours(23, 59, 59, 999);
    else d.setHours(0, 0, 0, 0);
    return d;
  }
  return isEnd ? new Date() : new Date(0);
};

const matchTonFromDescription = (description, equipments) => {
  if (!description || typeof description !== 'string') return null;

  const cleanText = description.replace(/<[^>]*>/g, ' ').trim();
  if (!cleanText) return null;

  // 1. Direct search for exact equipment tonNumber in text (case-insensitive)
  for (const eq of equipments) {
    if (eq.tonNumber) {
      const tonClean = eq.tonNumber.trim();
      const regex = new RegExp(`\\b${tonClean.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
      if (regex.test(cleanText)) {
        return eq.tonNumber;
      }
    }
  }

  // 2. Match shorthand like "H12" or "H012" -> 335H012, or "On Service on B." -> 388K002B
  for (const eq of equipments) {
    if (!eq.tonNumber) continue;
    const ton = eq.tonNumber.trim();

    const matchParts = ton.match(/^(\d{3})?([a-zA-Z]+)(\d+)([a-zA-Z0-9.]*)$/);
    if (matchParts) {
      const letter = matchParts[2].toUpperCase();
      const num = parseInt(matchParts[3], 10);
      const suffix = matchParts[4].toUpperCase();

      // Check shorthand like "H12", "H012", "H-12"
      const shorthandRegex = new RegExp(`\\b${letter}[- ]?0*${num}\\b`, 'i');
      if (shorthandRegex.test(cleanText)) {
        return eq.tonNumber;
      }

      // Check pattern like "On Service on B" or "Service on B."
      if (suffix) {
        const cleanSuffix = suffix.replace(/[^a-zA-Z0-9]/g, '');
        if (cleanSuffix.length > 0) {
          const suffixRegex = new RegExp(`\\bon\\s+service\\s+on\\s+${cleanSuffix}\\b`, 'i');
          if (suffixRegex.test(cleanText)) {
            return eq.tonNumber;
          }
        }
      }
    }
  }

  return null;
};

const getTonNumberForMotorAtDate = (motor, eventDate, description = '', motorToEquipmentMap = new Map(), equipments = []) => {
  if (!motor) return 'N/A';

  // Layer 1: Description text match (highest precision for explicit log notes like "On Service on H12")
  if (description && equipments.length > 0) {
    const descMatch = matchTonFromDescription(description, equipments);
    if (descMatch) {
      return descMatch;
    }
  }

  const d = new Date(eventDate);
  const motorIdStr = motor._id ? motor._id.toString() : null;

  // Layer 2: Reverse search in assignmentHistory (newest to oldest)
  if (motor.assignmentHistory && motor.assignmentHistory.length > 0) {
    const historyDesc = [...motor.assignmentHistory].reverse();

    for (let i = 0; i < historyDesc.length; i++) {
      const h = historyDesc[i];
      if (!h || !h.ton) continue;

      const installed = h.dateInstalled ? new Date(h.dateInstalled) : null;
      const removed = h.dateRemoved ? new Date(h.dateRemoved) : null;

      // Latest/Active assignment entry
      if (i === 0) {
        if (!removed || (motor.status === 'active' && motorIdStr && motorToEquipmentMap.get(motorIdStr) === h.ton)) {
          if (!installed || installed <= d) {
            return h.ton;
          }
          // Delayed software logging check: if assignment was created recently in app (installed > d)
          // and prev entry was removed on same date (same app entry session), attribute to current active assignment
          const prevEntry = historyDesc[1];
          if (prevEntry && prevEntry.dateRemoved && installed) {
            const prevRem = new Date(prevEntry.dateRemoved);
            if (Math.abs(installed - prevRem) < 86400000 * 2) {
              return h.ton;
            }
          }
        }
      }

      // Range check [installed, removed]
      if (installed && removed) {
        if (installed <= d && removed >= d) {
          return h.ton;
        }
      } else if (installed && !removed) {
        if (installed <= d) return h.ton;
      } else if (!installed && removed) {
        if (d <= removed) return h.ton;
      }
    }
  }

  // Layer 3: Fallback to active equipment if motor is currently active
  if (motor.eq && motor.eq.tonNumber) {
    return motor.eq.tonNumber;
  }
  if (motorIdStr && motorToEquipmentMap.has(motorIdStr)) {
    return motorToEquipmentMap.get(motorIdStr);
  }

  // Layer 4: Fallback to latest non-empty assignment history entry
  if (motor.assignmentHistory && motor.assignmentHistory.length > 0) {
    for (let i = motor.assignmentHistory.length - 1; i >= 0; i--) {
      const h = motor.assignmentHistory[i];
      if (h && h.ton) {
        return h.ton;
      }
    }
  }

  return 'N/A';
};

const getUnitNameFromTon = (tonNumber) => {
  if (!tonNumber || tonNumber === 'N/A') return 'Other';
  const ton = String(tonNumber).trim().toLowerCase();
  
  for (const key of Object.keys(UNIT_CONFIGS)) {
    const config = UNIT_CONFIGS[key];
    if (config.prefixes && config.prefixes.some(prefix => ton.startsWith(prefix.toLowerCase()))) {
      return config.name;
    }
  }
  return 'Other';
};

const getShutdownReportData = async (startDateStr, endDateStr) => {
  const start = parseBoundaryDate(startDateStr, false);
  const end = parseBoundaryDate(endDateStr, true);

  // Fetch all equipments to construct active motor -> equipment tonNumber lookup map and equipment list
  const equipments = await PlantEquipment.find({}).lean();
  const motorToEquipmentMap = new Map();

  equipments.forEach(eq => {
    if (eq.tonNumber && eq.currentMotor) {
      motorToEquipmentMap.set(eq.currentMotor.toString(), eq.tonNumber);
    }
  });

  const motors = await Motor.find({})
    .populate('eq')
    .lean();

  const filteredEvents = [];

  for (const motor of motors) {
    if (!motor.maintenanceHistory || motor.maintenanceHistory.length === 0) {
      continue;
    }

    for (const event of motor.maintenanceHistory) {
      if (!event.date) continue;
      const eventDate = new Date(event.date);
      if (isNaN(eventDate.getTime())) continue;

      if (eventDate >= start && eventDate <= end) {
        const tonNumber = getTonNumberForMotorAtDate(
          motor, 
          event.date, 
          event.description, 
          motorToEquipmentMap, 
          equipments
        );
        const unitName = getUnitNameFromTon(tonNumber);

        filteredEvents.push({
          date: event.date,
          serialNumber: motor.serialNumber || 'N/A',
          tonNumber: tonNumber,
          power: motor.power || 'N/A',
          speed: motor.speed ? `${motor.speed} rpm` : 'N/A',
          description: event.description || '',
          unit: unitName
        });
      }
    }
  }

  return filteredEvents;
};

exports.getShutdownReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const data = await getShutdownReportData(from, to);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error fetching shutdown report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.exportShutdownReportPDFByDate = async (req, res) => {
  try {
    const { from, to } = req.query;
    const data = await getShutdownReportData(from, to);

    // Sort chronologically by date
    data.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Format dates before passing to PDF generator
    const flatData = data.map(item => ({
      ...item,
      dateFormatted: formatDate(item.date)
    }));

    const dateRangeLabel = from && to 
      ? `(${formatDate(from)} - ${formatDate(to)})` 
      : '';

    const columns = [
      { label: 'Date', key: 'dateFormatted', width: 70 },
      { label: 'TON Number', key: 'tonNumber', width: 80 },
      { label: 'Serial Number', key: 'serialNumber', width: 80 },
      { label: 'History Description', key: 'description', width: 265 }
    ];

    const pdfBytes = await generateTablePDF({
      title: `Shutdown Report by Date ${dateRangeLabel}`.trim(),
      columns: columns,
      data: flatData,
      orientation: 'portrait'
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=shutdown_report_by_date.pdf`);
    res.status(200).send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Error generating PDF by date:', error);
    res.status(500).json({ message: 'Server error while generating PDF.', error: error.message });
  }
};

exports.exportShutdownReportPDFByUnit = async (req, res) => {
  try {
    const { from, to } = req.query;
    const data = await getShutdownReportData(from, to);

    // Sort by unit name, then TON number (using compareTons), and then chronologically
    data.sort((a, b) => {
      const unitCompare = String(a.unit || '').localeCompare(String(b.unit || ''));
      if (unitCompare !== 0) return unitCompare;
      
      const tonCompare = compareTons(a.tonNumber, b.tonNumber);
      if (tonCompare !== 0) return tonCompare;

      return new Date(a.date) - new Date(b.date);
    });

    // Format dates before passing to PDF generator
    const flatData = data.map(item => ({
      ...item,
      dateFormatted: formatDate(item.date)
    }));

    const dateRangeLabel = from && to 
      ? `(${formatDate(from)} - ${formatDate(to)})` 
      : '';

    const columns = [
      { label: 'Unit', key: 'unit', width: 70 },
      { label: 'TON Number', key: 'tonNumber', width: 70 },
      { label: 'Date', key: 'dateFormatted', width: 70 },
      { label: 'Serial Number', key: 'serialNumber', width: 80 },
      { label: 'History Description', key: 'description', width: 205 }
    ];

    const pdfBytes = await generateTablePDF({
      title: `Shutdown Report by Unit/TON ${dateRangeLabel}`.trim(),
      columns: columns,
      data: flatData,
      orientation: 'portrait'
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=shutdown_report_by_unit.pdf`);
    res.status(200).send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Error generating PDF by unit:', error);
    res.status(500).json({ message: 'Server error while generating PDF.', error: error.message });
  }
};

exports.exportShutdownReportExcel = async (req, res) => {
  try {
    const { from, to } = req.query;
    const data = await getShutdownReportData(from, to);

    // Sort chronologically by date
    data.sort((a, b) => new Date(a.date) - new Date(b.date));

    const formattedRecords = data.map(item => ({
      ...item,
      dateFormatted: formatDate(item.date)
    }));

    const measurementRecords = transformToMeasurementReport(formattedRecords);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Measurement Sub-Report');

    worksheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'TON Number', key: 'ton', width: 18 },
      { header: 'Serial Number', key: 'serialNumber', width: 18 },
      { header: 'Rotor DE', key: 'rotorDE', width: 15 },
      { header: 'Rotor NDE', key: 'rotorNDE', width: 15 },
      { header: 'Housing DE', key: 'housingDE', width: 15 },
      { header: 'Housing NDE', key: 'housingNDE', width: 15 },
      { header: 'Current (In.L)', key: 'inL', width: 15 },
      { header: 'Vib No-Load (V.NL)', key: 'vNL', width: 20 },
      { header: 'Vib Load (V.L)', key: 'vL', width: 20 }
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F497D' }
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    measurementRecords.forEach(row => {
      worksheet.addRow({
        date: row.date || 'N/A',
        ton: row.ton || 'N/A',
        serialNumber: row.serialNumber || 'N/A',
        rotorDE: row.rotorDE || '-',
        rotorNDE: row.rotorNDE || '-',
        housingDE: row.housingDE || '-',
        housingNDE: row.housingNDE || '-',
        inL: row.inL || '-',
        vNL: row.vNL || '-',
        vL: row.vL || '-'
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=shutdown_measurement_report_${new Date().toISOString().split('T')[0]}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting measurement report to Excel:', error);
    res.status(500).json({ message: 'Server error while generating Excel.', error: error.message });
  }
};

