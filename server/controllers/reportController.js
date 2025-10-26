// server/controllers/reportController.js
const Motor = require('../models/motorModel');
const PlantEquipment = require('../models/plantEquipmentModel');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

exports.getReports = async (req, res) => {
  res.status(200).json({ message: 'Reports endpoint' });
};

exports.getActiveMotorReport = async (req, res) => {
  try {
    const activeMotors = await Motor.find({ status: 'active' }).lean(); 
    // For each active motor, find the equipment it's installed on
    const motorsWithEquipment = await Promise.all(
      activeMotors.map(async (motor) => {
        const equipment = await PlantEquipment.findOne({ 
          currentMotor: motor._id 
        }).lean();
        
        return {
          _id: motor._id,
          tonNumber: equipment?.tonNumber || 'N/A',
          designation: equipment?.designation || 'N/A',
          serialNumber: motor.serialNumber,
          power: motor.power,
          speed: motor.speed,
          current: motor.current,
          IM: motor.IM,
          frameSize: motor.frameSize,
          bearingNDE: motor.bearingNDE,
          bearingDE: motor.bearingDE,
          lastMaintenanceDate: motor.lastMaintenanceDate,
        };
      })
    );
   
    res.status(200).json({success: true, data: motorsWithEquipment});
  } catch (error) {
    console.error('Error fetching active motors:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Additional report generation functions (e.g., export to PDF/Excel) can be added here
exports.exportActiveMotorsToExcel = async (req, res) => {
    try {
    const activeMotors = await Motor.find({ status: 'active' }).lean();
    
    const motorsWithEquipment = await Promise.all(
      activeMotors.map(async (motor) => {
        const equipment = await PlantEquipment.findOne({ 
          currentMotor: motor._id 
        }).lean();
        
        return {
          tonNumber: equipment?.tonNumber || 'N/A',
          designation: equipment?.designation || 'N/A',
          serialNumber: motor.serialNumber,
          power: motor.power,
          speed: motor.speed,
          current: motor.current,
          IM: motor.IM,
          frameSize: motor.frameSize,
          bearingNDE: motor.bearingNDE,
          bearingDE: motor.bearingDE,
          lastMaintenanceDate: motor.lastMaintenanceDate 
            ? new Date(motor.lastMaintenanceDate).toLocaleDateString() 
            : 'N/A',
        };
      })
    );

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
    motorsWithEquipment.forEach(motor => {
      worksheet.addRow(motor);
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
    const activeMotors = await Motor.find({ status: 'active' }).lean();
    
    const motorsWithEquipment = await Promise.all(
      activeMotors.map(async (motor) => {
        const equipment = await PlantEquipment.findOne({ 
          currentMotor: motor._id 
        }).lean();
        
        return {
          tonNumber: equipment?.tonNumber || 'N/A',
          designation: equipment?.designation || 'N/A',
          serialNumber: motor.serialNumber,
          power: motor.power || 'N/A',
          speed: motor.speed || 'N/A',
          current: motor.current || 'N/A',
          IM: motor.IM || 'N/A',
          frameSize: motor.frameSize || 'N/A',
          bearingNDE: motor.bearingNDE || 'N/A',
          bearingDE: motor.bearingDE || 'N/A',
          lastMaintenanceDate: motor.lastMaintenanceDate 
            ? new Date(motor.lastMaintenanceDate).toLocaleDateString() 
            : 'N/A',
        };
      })
    );

    // Create PDF document
    const doc = new PDFDocument({ 
      layout: 'landscape',
      margin: 50,
      size: 'A4',
      bufferPages: true,
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=active_motors_${new Date().toISOString().split('T')[0]}.pdf`
    );

    // Table settings
    const rowHeight = 25;
    const headerFontSize = 9;
    const rowFontSize = 8;

    // Page dimensions for landscape A4
    const pageWidth = 841.89;
    const pageHeight = 595.28;
    const pageMargin = 50;
    const usableWidth = pageWidth - (pageMargin * 2);
    const usableHeight = pageHeight - (pageMargin * 2);

    // Header
    const drawPageHeader = () => {
      const logoWidth = 50;
      const logoHeight = 50;
      const logoY = 45;
      const logoPath = path.join(__dirname, '..', 'assets', 'logo_ar.jpg');
      const pageWidth = doc.page.width;
      const usableWidth = pageWidth - (doc.page.margins.left + doc.page.margins.right);
      const logoX = doc.page.margins.left + (usableWidth - logoWidth) / 2;

      // --- Logo ---
      try {
        doc.image(logoPath, logoX, logoY, { width: logoWidth, height: logoHeight });
      } catch (err) {
        console.warn('Logo not found, skipping.');
      }

      // --- Title ---
      const titleY = logoY + logoHeight + 15;
      const generatedY = titleY + 25;
      doc.fontSize(18).text('AFC 3 Plant Motors', pageMargin, titleY, { align: 'center' });
      doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, pageMargin, generatedY, { align: 'center' });

      return generatedY + 30;
    };

    // Pipe PDF to response
    doc.pipe(res);

    const columnDefinitions = [
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
    
    // Calculate total table width and starting X to center it
    const totalTableWidth = columnDefinitions.reduce((acc, col) => acc + col.width, 0);
    let currentX = pageMargin + (usableWidth - totalTableWidth) / 2;

    // Add calculated X position to each column
    const columns = columnDefinitions.map(col => {
      const columnWithX = { ...col, x: currentX };
      currentX += col.width;
      return columnWithX;
    });

    // --- Helper function to draw table header ---
    const drawTableHeader = (y) => {
      doc.fontSize(headerFontSize).font('Helvetica-Bold');
      columns.forEach(col => {
        doc.rect(col.x, y, col.width, rowHeight).stroke();
        doc.text(col.label, col.x + 5, y + 7, {
          width: col.width - 10,
          align: 'center'
        });
      });
      return y + rowHeight;
    };

    // --- Helper function to draw table row ---
    const drawTableRow = (motor, y) => {
      doc.fontSize(rowFontSize).font('Helvetica');
      columns.forEach(col => {
        const text = String(motor[col.key] || 'N/A');
        doc.rect(col.x, y, col.width, rowHeight).stroke();
        doc.text(text, col.x, y + 7, {
          width: col.width,
          align: 'center',
          ellipsis: true
        });
      });
      return y + rowHeight;
    };

    // --- Draw Table ---
    let currentY = drawPageHeader();

    // Draw initial header
    currentY = drawTableHeader(currentY);
    let pageNumber = 1;
    // Draw rows
    motorsWithEquipment.forEach((motor, index) => {
      // Check if we need a new page
      if (currentY + rowHeight > pageHeight - pageMargin - 60) {
        pageNumber++;
        doc.addPage();
        currentY = drawPageHeader();
        currentY = drawTableHeader(currentY);
      }
      currentY = drawTableRow(motor, currentY);
    });

    // Now draw all footers with total page count
    const range = doc.bufferedPageRange();
    const totalPages = range.count;

    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      const footerY = pageHeight - 60;
      const footerLineY = footerY - 15;
      const footerX = pageMargin;
      const footerWidth = usableWidth;

      // Draw separator line
      doc
        .strokeColor('#aaaaaa')
        .lineWidth(0.5)
        .moveTo(footerX, footerLineY)
        .lineTo(footerX + footerWidth, footerLineY)
        .stroke();

      // Draw footer text with total pages
      let footerText = '';
      if (i === 0) {
        footerText = `Total Active Motors: ${motorsWithEquipment.length} | Page ${i + 1} of ${totalPages}`;
      } else {
        footerText = `Page ${i + 1} of ${totalPages}`;
      }

      const savedY = doc.y;
      doc.y = 0;
      doc.fillColor('black').fontSize(8).text(
        footerText,
        footerX, footerY,
        { align: 'center', width: footerWidth, continued: false, baseline: 'bottom' }
      );
      doc.y = savedY;
    }

    doc.end();
    
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};