const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const QRCode = require('qrcode');
const { logoBase64 } = require('./pdfService');

exports.generateQRPDF = async ({ motor, qrUrl }) => {
  const pdfDoc = await PDFDocument.create();
  
  // Custom label size: 300 pt wide, 400 pt high (approx 4.16 x 5.5 inches)
  const page = pdfDoc.addPage([300, 400]);
  
  const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Embed logo image
  let logoImage;
  try {
    logoImage = await pdfDoc.embedJpg(logoBase64);
  } catch (logoError) {
    console.error('Failed to embed logo in QR PDF:', logoError);
  }

  // Draw header card frame (blue border)
  page.drawRectangle({
    x: 10,
    y: 10,
    width: 280,
    height: 380,
    borderColor: rgb(0.12, 0.45, 0.88), // Sleek blue
    borderWidth: 2,
    color: rgb(0.98, 0.99, 1.0)
  });
  
  // Draw Logo if loaded successfully
  let titleX = 20;
  if (logoImage) {
    const logoDims = logoImage.scale(0.15); // Scale down for label
    page.drawImage(logoImage, {
      x: 20,
      y: 345,
      width: logoDims.width,
      height: logoDims.height,
    });
    titleX = 20 + logoDims.width + 10;
  }
  
  // Draw header title
  page.drawText('MOTOR TRACKER', {
    x: titleX,
    y: 355,
    size: 13,
    font: fontHelveticaBold,
    color: rgb(0.09, 0.18, 0.36)
  });
  
  // Draw divider line
  page.drawLine({
    start: { x: 15, y: 335 },
    end: { x: 285, y: 335 },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85)
  });
  
  // Draw details (serialNumber, manufacturer, etc.)
  let y = 315;
  const drawField = (label, value) => {
    const displayValue = value ? String(value) : 'N/A';
    page.drawText(label + ':', {
      x: 20,
      y,
      size: 9,
      font: fontHelveticaBold,
      color: rgb(0.3, 0.4, 0.5)
    });
    page.drawText(displayValue, {
      x: 110,
      y,
      size: 9,
      font: fontHelvetica,
      color: rgb(0.05, 0.05, 0.05)
    });
    y -= 16;
  };
  
  drawField('Serial Number', motor.serialNumber);
  drawField('Manufacturer', motor.manufacturer);
  drawField('Type/Model', motor.type);
  drawField('Power', motor.power ? `${motor.power} KW` : 'N/A');
  drawField('Speed', motor.speed ? `${motor.speed} RPM` : 'N/A');
  drawField('Current', motor.current ? `${motor.current} A` : 'N/A');
  drawField('SAP ID', motor.SAP);
  
  // Generate QR Code Buffer
  // We wrap the QR URL in a robust config
  const qrBuffer = await QRCode.toBuffer(qrUrl, {
    type: 'png',
    margin: 1,
    width: 140
  });
  
  const qrImage = await pdfDoc.embedPng(qrBuffer);
  
  // Center the QR Code at the bottom (page width is 300, qr width is 140)
  page.drawImage(qrImage, {
    x: 80,
    y: 40,
    width: 140,
    height: 140
  });
  
  // Label at the very bottom
  const infoText = 'Scan QR code to view motor history';
  const infoTextWidth = fontHelvetica.widthOfTextAtSize(infoText, 7.5);
  page.drawText(infoText, {
    x: (300 - infoTextWidth) / 2,
    y: 25,
    size: 7.5,
    font: fontHelvetica,
    color: rgb(0.4, 0.4, 0.4)
  });
  
  return await pdfDoc.save();
};
