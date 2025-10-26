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
      const logoBase64 = 'data:image/jpeg;base64,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';
      const logoBuffer = Buffer.from(logoBase64.split(',')[1], 'base64');
      //const logoPath = path.join(__dirname, '..', 'assets', 'logo_ar.jpg');
      const pageWidth = doc.page.width;
      const usableWidth = pageWidth - (doc.page.margins.left + doc.page.margins.right);
      const logoX = doc.page.margins.left + (usableWidth - logoWidth) / 2;

      // --- Logo ---
      try {
        doc.image(logoBuffer, logoX, logoY, { width: logoWidth, height: logoHeight });
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