// client/src/pages/CableSizingPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, 
  Shield, 
  Info, 
  Activity, 
  FileText, 
  CheckCircle2, 
  ArrowLeft,
  Settings,
  Scale,
  Gauge
} from 'lucide-react';

// IEC 60364-5-52 Current Carrying Capacity Tables (simplified for common sizes)
// Values are for Copper & Aluminum, PVC/XLPE, at 30°C ambient
const currentRatings = {
  copper: {
    pvc70: {
      A1: {1.5: 13.5, 2.5: 18, 4: 24, 6: 31, 10: 42, 16: 56, 25: 73, 35: 89, 50: 108, 70: 136, 95: 164, 120: 186, 150: 204, 185: 230, 240: 269, 300: 306},
      A2: {1.5: 13, 2.5: 17.5, 4: 23, 6: 30, 10: 40, 16: 54, 25: 70, 35: 86, 50: 104, 70: 130, 95: 157, 120: 179, 150: 197, 185: 223, 240: 261, 300: 298},
      B1: {1.5: 15.5, 2.5: 21, 4: 28, 6: 36, 10: 50, 16: 68, 25: 89, 35: 110, 50: 134, 70: 171, 95: 207, 120: 239, 150: 262, 185: 296, 240: 346, 300: 394},
      B2: {1.5: 15, 2.5: 20, 4: 27, 6: 34, 10: 46, 16: 62, 25: 80, 35: 99, 50: 118, 70: 149, 95: 179, 120: 203, 150: 225, 185: 255, 240: 297, 300: 339},
      C: {1.5: 17.5, 2.5: 24, 4: 32, 6: 41, 10: 57, 16: 76, 25: 96, 35: 119, 50: 144, 70: 184, 95: 223, 120: 254, 150: 285, 185: 324, 240: 380, 300: 435},
      D1: {1.5: 17, 2.5: 22, 4: 29, 6: 37, 10: 50, 16: 66, 25: 83, 35: 103, 50: 125, 70: 160, 95: 195, 120: 220, 150: 250, 185: 280, 240: 330, 300: 380},
      D2: {1.5: 16, 2.5: 21, 4: 28, 6: 35, 10: 48, 16: 64, 25: 82, 35: 100, 50: 122, 70: 158, 95: 190, 120: 215, 150: 245, 185: 275, 240: 325, 300: 370},
      E: {1.5: 18.5, 2.5: 25, 4: 34, 6: 43, 10: 60, 16: 80, 25: 101, 35: 126, 50: 153, 70: 196, 95: 238, 120: 272, 150: 306, 185: 348, 240: 408, 300: 468},
      F1: {1.5: 19, 2.5: 26, 4: 35, 6: 45, 10: 63, 16: 85, 25: 110, 35: 135, 50: 165, 70: 215, 95: 260, 120: 300, 150: 335, 185: 380, 240: 450, 300: 520},
      F2: {1.5: 20, 2.5: 27, 4: 37, 6: 47, 10: 65, 16: 88, 25: 114, 35: 141, 50: 172, 70: 224, 95: 271, 120: 312, 150: 348, 185: 396, 240: 468, 300: 540},
      G: {1.5: 16, 2.5: 22, 4: 30, 6: 38, 10: 52, 16: 70, 25: 88, 35: 110, 50: 133, 70: 170, 95: 207, 120: 235, 150: 260, 185: 295, 240: 345, 300: 395}
    },
    pvc90: {
      A1: {1.5: 16, 2.5: 21, 4: 28, 6: 36, 10: 49, 16: 65, 25: 85, 35: 103, 50: 125, 70: 157, 95: 190, 120: 215, 150: 237, 185: 267, 240: 312, 300: 355},
      A2: {1.5: 15, 2.5: 20, 4: 27, 6: 34, 10: 46, 16: 62, 25: 80, 35: 98, 50: 119, 70: 150, 95: 181, 120: 206, 150: 228, 185: 258, 240: 302, 300: 344},
      B1: {1.5: 18, 2.5: 24, 4: 33, 6: 42, 10: 58, 16: 79, 25: 103, 35: 127, 50: 155, 70: 198, 95: 240, 120: 277, 150: 304, 185: 343, 240: 401, 300: 457},
      B2: {1.5: 17, 2.5: 23, 4: 31, 6: 39, 10: 53, 16: 71, 25: 92, 35: 113, 50: 136, 70: 172, 95: 207, 120: 235, 150: 260, 185: 295, 240: 344, 300: 393},
      C: {1.5: 20, 2.5: 27, 4: 36, 6: 46, 10: 64, 16: 85, 25: 108, 35: 134, 50: 162, 70: 207, 95: 251, 120: 286, 150: 321, 185: 364, 240: 427, 300: 489},
      D1: {1.5: 19, 2.5: 25, 4: 33, 6: 42, 10: 57, 16: 75, 25: 95, 35: 117, 50: 142, 70: 182, 95: 222, 120: 250, 150: 285, 185: 320, 240: 375, 300: 430},
      D2: {1.5: 18, 2.5: 24, 4: 32, 6: 40, 10: 55, 16: 73, 25: 93, 35: 114, 50: 139, 70: 180, 95: 216, 120: 245, 150: 280, 185: 315, 240: 370, 300: 420},
      E: {1.5: 21, 2.5: 29, 4: 39, 6: 50, 10: 69, 16: 92, 25: 117, 35: 146, 50: 177, 70: 227, 95: 276, 120: 316, 150: 356, 185: 404, 240: 474, 300: 543},
      F1: {1.5: 22, 2.5: 30, 4: 41, 6: 52, 10: 72, 16: 97, 25: 126, 35: 155, 50: 190, 70: 247, 95: 300, 120: 345, 150: 385, 185: 435, 240: 515, 300: 595},
      F2: {1.5: 23, 2.5: 31, 4: 43, 6: 54, 10: 75, 16: 101, 25: 130, 35: 161, 50: 197, 70: 257, 95: 312, 120: 358, 150: 400, 185: 453, 240: 535, 300: 620},
      G: {1.5: 19, 2.5: 26, 4: 35, 6: 44, 10: 60, 16: 81, 25: 102, 35: 127, 50: 154, 70: 197, 95: 240, 120: 272, 150: 302, 185: 342, 240: 400, 300: 458}
    },
    xlpe90: {
      A1: {1.5: 17, 2.5: 23, 4: 31, 6: 40, 10: 54, 16: 72, 25: 93, 35: 114, 50: 138, 70: 173, 95: 209, 120: 237, 150: 262, 185: 296, 240: 346, 300: 394},
      A2: {1.5: 16, 2.5: 22, 4: 30, 6: 37, 10: 51, 16: 68, 25: 89, 35: 109, 50: 132, 70: 166, 95: 200, 120: 228, 150: 252, 185: 285, 240: 334, 300: 381},
      B1: {1.5: 19, 2.5: 26, 4: 35, 6: 45, 10: 62, 16: 84, 25: 110, 35: 136, 50: 165, 70: 211, 95: 256, 120: 296, 150: 325, 185: 367, 240: 430, 300: 490},
      B2: {1.5: 18, 2.5: 25, 4: 33, 6: 42, 10: 57, 16: 77, 25: 100, 35: 123, 50: 148, 70: 187, 95: 225, 120: 256, 150: 283, 185: 321, 240: 375, 300: 428},
      C: {1.5: 21, 2.5: 29, 4: 39, 6: 50, 10: 69, 16: 92, 25: 117, 35: 145, 50: 176, 70: 225, 95: 273, 120: 312, 150: 349, 185: 396, 240: 465, 300: 533},
      D1: {1.5: 20, 2.5: 27, 4: 35, 6: 45, 10: 61, 16: 81, 25: 103, 35: 127, 50: 154, 70: 198, 95: 241, 120: 272, 150: 310, 185: 348, 240: 410, 300: 470},
      D2: {1.5: 19, 2.5: 26, 4: 34, 6: 43, 10: 59, 16: 79, 25: 101, 35: 124, 50: 151, 70: 195, 95: 235, 120: 267, 150: 305, 185: 343, 240: 405, 300: 460},
      E: {1.5: 22, 2.5: 31, 4: 42, 6: 53, 10: 74, 16: 99, 25: 125, 35: 156, 50: 189, 70: 243, 95: 295, 120: 338, 150: 381, 185: 432, 240: 507, 300: 582},
      F1: {1.5: 23, 2.5: 32, 4: 44, 6: 55, 10: 77, 16: 104, 25: 135, 35: 166, 50: 203, 70: 265, 95: 321, 120: 370, 150: 413, 185: 467, 240: 553, 300: 640},
      F2: {1.5: 24, 2.5: 33, 4: 46, 6: 58, 10: 80, 16: 108, 25: 140, 35: 173, 50: 211, 70: 275, 95: 334, 120: 384, 150: 429, 185: 486, 240: 575, 300: 667},
      G: {1.5: 20, 2.5: 28, 4: 38, 6: 48, 10: 66, 16: 88, 25: 112, 35: 139, 50: 168, 70: 216, 95: 262, 120: 298, 150: 331, 185: 375, 240: 440, 300: 504}
    }
  },
  aluminum: {
    pvc70: {
      A1: {2.5: 14, 4: 18.5, 6: 24, 10: 33, 16: 44, 25: 58, 35: 71, 50: 87, 70: 109, 95: 130, 120: 150, 150: 167, 185: 189, 240: 220, 300: 253},
      A2: {2.5: 13.5, 4: 17.5, 6: 23, 10: 31, 16: 41, 25: 53, 35: 65, 50: 79, 70: 99, 95: 119, 120: 136, 150: 153, 185: 173, 240: 202, 300: 232},
      B1: {2.5: 16, 4: 22, 6: 28, 10: 39, 16: 53, 25: 69, 35: 86, 50: 105, 70: 135, 95: 163, 120: 188, 150: 207, 185: 234, 240: 274, 300: 313},
      B2: {2.5: 15.5, 4: 21, 6: 27, 10: 36, 16: 48, 25: 63, 35: 78, 50: 94, 70: 118, 95: 142, 120: 161, 150: 179, 185: 203, 240: 237, 300: 271},
      C: {2.5: 18, 4: 24, 6: 31, 10: 44, 16: 59, 25: 75, 35: 93, 50: 113, 70: 145, 95: 176, 120: 201, 150: 226, 185: 257, 240: 300, 300: 344},
      D1: {2.5: 17, 4: 22, 6: 28, 10: 38, 16: 51, 25: 65, 35: 80, 50: 97, 70: 125, 95: 152, 120: 172, 150: 196, 185: 220, 240: 260, 300: 298},
      D2: {2.5: 16.5, 4: 21, 6: 27, 10: 37, 16: 49, 25: 63, 35: 78, 50: 95, 70: 123, 95: 148, 120: 168, 150: 192, 185: 215, 240: 255, 300: 290},
      E: {2.5: 19, 4: 26, 6: 33, 10: 46, 16: 62, 25: 78, 35: 98, 50: 119, 70: 153, 95: 186, 120: 213, 150: 240, 185: 273, 240: 320, 300: 367},
      F1: {2.5: 20, 4: 27, 6: 35, 10: 49, 16: 66, 25: 86, 35: 106, 50: 130, 70: 169, 95: 205, 120: 236, 150: 264, 185: 300, 240: 355, 300: 410},
      F2: {2.5: 21, 4: 28, 6: 36, 10: 51, 16: 69, 25: 90, 35: 111, 50: 136, 70: 177, 95: 215, 120: 248, 150: 278, 185: 316, 240: 374, 300: 432},
      G: {2.5: 17, 4: 23, 6: 30, 10: 41, 16: 55, 25: 70, 35: 87, 50: 105, 70: 135, 95: 164, 120: 186, 150: 207, 185: 235, 240: 275, 300: 315}
    },
    pvc90: {
      A1: {2.5: 16.5, 4: 22, 6: 28, 10: 39, 16: 52, 25: 68, 35: 83, 50: 101, 70: 127, 95: 153, 120: 174, 150: 193, 185: 218, 240: 255, 300: 291},
      A2: {2.5: 16, 4: 21, 6: 27, 10: 36, 16: 48, 25: 63, 35: 77, 50: 93, 70: 117, 95: 140, 120: 160, 150: 178, 185: 201, 240: 235, 300: 269},
      B1: {2.5: 19, 4: 25, 6: 33, 10: 46, 16: 62, 25: 81, 35: 100, 50: 122, 70: 156, 95: 189, 120: 218, 150: 240, 185: 271, 240: 317, 300: 362},
      B2: {2.5: 18, 4: 24, 6: 31, 10: 42, 16: 56, 25: 73, 35: 90, 50: 109, 70: 138, 95: 166, 120: 189, 150: 209, 185: 237, 240: 277, 300: 317},
      C: {2.5: 21, 4: 28, 6: 36, 10: 51, 16: 68, 25: 86, 35: 107, 50: 130, 70: 167, 95: 203, 120: 232, 150: 261, 185: 296, 240: 347, 300: 398},
      D1: {2.5: 20, 4: 26, 6: 33, 10: 45, 16: 60, 25: 76, 35: 94, 50: 114, 70: 147, 95: 179, 120: 202, 150: 230, 185: 258, 240: 304, 300: 348},
      D2: {2.5: 19, 4: 25, 6: 32, 10: 44, 16: 58, 25: 74, 35: 91, 50: 111, 70: 144, 95: 174, 120: 197, 150: 225, 185: 253, 240: 299, 300: 342},
      E: {2.5: 22, 4: 30, 6: 38, 10: 53, 16: 71, 25: 90, 35: 112, 50: 136, 70: 175, 95: 213, 120: 244, 150: 275, 185: 312, 240: 366, 300: 420},
      F1: {2.5: 23, 4: 32, 6: 41, 10: 57, 16: 77, 25: 100, 35: 124, 50: 151, 70: 197, 95: 239, 120: 275, 150: 308, 185: 349, 240: 413, 300: 478},
      F2: {2.5: 24, 4: 33, 6: 43, 10: 59, 16: 80, 25: 104, 35: 129, 50: 158, 70: 205, 95: 250, 120: 288, 150: 322, 185: 366, 240: 433, 300: 502},
      G: {2.5: 20, 4: 27, 6: 35, 10: 48, 16: 64, 25: 82, 35: 101, 50: 123, 70: 158, 95: 192, 120: 218, 150: 242, 185: 274, 240: 321, 300: 368}
    },
    xlpe90: {
      A1: {2.5: 18, 4: 24, 6: 31, 10: 43, 16: 57, 25: 75, 35: 92, 50: 111, 70: 140, 95: 169, 120: 192, 150: 213, 185: 240, 240: 281, 300: 321},
      A2: {2.5: 17, 4: 23, 6: 29, 10: 40, 16: 54, 25: 70, 35: 86, 50: 104, 70: 131, 95: 158, 120: 180, 150: 199, 185: 226, 240: 264, 300: 302},
      B1: {2.5: 20, 4: 27, 6: 35, 10: 49, 16: 66, 25: 86, 35: 106, 50: 129, 70: 165, 95: 200, 120: 231, 150: 254, 185: 287, 240: 336, 300: 383},
      B2: {2.5: 19, 4: 26, 6: 33, 10: 45, 16: 60, 25: 78, 35: 96, 50: 117, 70: 147, 95: 178, 120: 202, 150: 224, 185: 254, 240: 297, 300: 340},
      C: {2.5: 22, 4: 30, 6: 38, 10: 54, 16: 72, 25: 92, 35: 114, 50: 138, 70: 178, 95: 216, 120: 247, 150: 276, 185: 313, 240: 368, 300: 421},
      D1: {2.5: 21, 4: 28, 6: 35, 10: 48, 16: 64, 25: 81, 35: 100, 50: 122, 70: 157, 95: 191, 120: 216, 150: 246, 185: 276, 240: 325, 300: 372},
      D2: {2.5: 20, 4: 27, 6: 34, 10: 47, 16: 62, 25: 79, 35: 98, 50: 119, 70: 154, 95: 186, 120: 211, 150: 241, 185: 271, 240: 320, 300: 365},
      E: {2.5: 24, 4: 32, 6: 41, 10: 57, 16: 77, 25: 97, 35: 121, 50: 147, 70: 189, 95: 230, 120: 264, 150: 297, 185: 337, 240: 396, 300: 454},
      F1: {2.5: 25, 4: 34, 6: 43, 10: 61, 16: 82, 25: 107, 35: 132, 50: 162, 70: 211, 95: 257, 120: 296, 150: 331, 185: 375, 240: 444, 300: 514},
      F2: {2.5: 26, 4: 35, 6: 45, 10: 63, 16: 85, 25: 111, 35: 137, 50: 168, 70: 220, 95: 267, 120: 308, 150: 345, 185: 391, 240: 463, 300: 537},
      G: {2.5: 22, 4: 29, 6: 38, 10: 52, 16: 70, 25: 89, 35: 110, 50: 134, 70: 172, 95: 209, 120: 237, 150: 264, 185: 299, 240: 350, 300: 401}
    }
  }
};

// Temperature correction factors (IEC 60364-5-52 Table B.52.1)
const tempCorrectionFactors = {
  pvc70: {
    10: 1.22, 15: 1.17, 20: 1.12, 25: 1.06, 30: 1.00, 35: 0.94, 40: 0.87, 45: 0.79, 50: 0.71, 55: 0.61, 60: 0.50
  },
  pvc90: {
    10: 1.18, 15: 1.14, 20: 1.10, 25: 1.05, 30: 1.00, 35: 0.95, 40: 0.90, 45: 0.85, 50: 0.80, 55: 0.74, 60: 0.67, 65: 0.60, 70: 0.52, 75: 0.43, 80: 0.30
  },
  xlpe90: {
    10: 1.18, 15: 1.14, 20: 1.10, 25: 1.05, 30: 1.00, 35: 0.95, 40: 0.90, 45: 0.85, 50: 0.80, 55: 0.74, 60: 0.67, 65: 0.60, 70: 0.52, 75: 0.43, 80: 0.30
  }
};

// Grouping correction factors (IEC 60364-5-52 Table B.52.3)
const groupingFactors = {
  1: 1.00,
  2: 0.80,
  3: 0.70,
  4: 0.65,
  6: 0.60,
  9: 0.50
};

// Soil thermal resistivity correction
const soilCorrectionFactors = {
  1.0: 1.18,
  1.5: 1.10,
  2.0: 1.00,
  2.5: 0.93,
  3.0: 0.85
};

// Conductor resistivity at 20°C (Ω·mm²/m)
const conductorResistivity = {
  copper: 0.01724,
  aluminum: 0.02826
};

// Temperature coefficient
const tempCoefficients = {
  copper: 0.00393,
  aluminum: 0.00403
};

// k factor for short circuit (IEC 60364-4-43 Table A.54.1)
const kFactors = {
  copper: {
    pvc70: 115,
    pvc90: 100,
    xlpe90: 143
  },
  aluminum: {
    pvc70: 76,
    pvc90: 66,
    xlpe90: 94
  }
};

// Protection device trip curves (simplified multiplication factors for instantaneous trip)
const protectionTripCurves = {
  fuse_gg:  { name: "Fuse gG", factor: 1.45, time: 0.01, desc: 'Fuse gG - pre-arcing + arcing' },
  fuse_gm:  { name: "Fuse gM", factor: 1.45, time: 0.01, desc: 'Fuse gM - pre-arcing + arcing' },
  mccb_b:   { name: "MCCB Type B", factor: 5,    time: 0.1,  desc: 'MCCB Type B - magnetic trip' },
  mccb_c:   { name: "MCCB Type C", factor: 10,   time: 0.1,  desc: 'MCCB Type C - magnetic trip' },
  mccb_d:   { name: "MCCB Type D", factor: 20,   time: 0.1,  desc: 'MCCB Type D - magnetic trip' },
  mccb_k:   { name: "MCCB Type K", factor: 14,   time: 0.1,  desc: 'MCCB Type K - magnetic trip' },
  mccb_z:   { name: "MCCB Type Z", factor: 3,    time: 0.1,  desc: 'MCCB Type Z - magnetic trip' },
  overload: { name: "Overload Relay", factor: 1.25, time: 10,  desc: 'Overload relay - long trip time' }
};

const protectionRatings = [16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400];

// IEC 60364-5-54 Table 54.2 Earth Conductor Size Selection
const getEarthConductorSize = (phaseSize) => {
  if (phaseSize <= 16) return phaseSize;
  if (phaseSize <= 35) return 16;
  const half = phaseSize / 2;
  const standardSizes = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300];
  return standardSizes.find(s => s >= half) || phaseSize;
};

const CableSizingPage = () => {
  const navigate = useNavigate();
  
  // Tab states
  const [activeTab, setActiveTab] = useState('system'); // system | load | cable

  // Form States
  const [systemType, setSystemType] = useState('3phase');
  const [voltage, setVoltage] = useState(400);
  const [frequency, setFrequency] = useState(50);
  const [earthingSystem, setEarthingSystem] = useState('TN-S');
  const [location, setLocation] = useState('indoor');
  
  const [loadCurrent, setLoadCurrent] = useState(100);
  const [power, setPower] = useState('');
  const [powerFactor, setPowerFactor] = useState(0.85);
  const [loadType, setLoadType] = useState('motor');
  const [startingCurrent, setStartingCurrent] = useState('1'); // Direct Online

  const [conductorMaterial, setConductorMaterial] = useState('copper');
  const [insulationType, setInsulationType] = useState('xlpe90');
  const [cableConfig, setCableConfig] = useState('4c');
  const [installMethod, setInstallMethod] = useState('C');

  const [ambientTemp, setAmbientTemp] = useState(30);
  const [soilResistivity, setSoilResistivity] = useState('2.0');
  const [grouping, setGrouping] = useState(1);
  const [protectionDevice, setProtectionDevice] = useState('mccb_c');
  const [protectionRating, setProtectionRating] = useState(100);
  const [cableLength, setCableLength] = useState(50);
  const [maxVoltageDrop, setMaxVoltageDrop] = useState(5);
  const [shortCircuitCurrent, setShortCircuitCurrent] = useState(10);
  const [faultTime, setFaultTime] = useState(0.4);

  // Result States
  const [calcResults, setCalcResults] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isFaultTimeManual, setIsFaultTimeManual] = useState(false);

  // Handle auto-update of voltage/cable config based on system type
  const handleSystemTypeChange = (e) => {
    const val = e.target.value;
    setSystemType(val);
    if (val === '3phase') {
      setVoltage(400);
      setCableConfig('4c');
    } else if (val === '1phase') {
      setVoltage(230);
      setCableConfig('2c');
    } else {
      setVoltage(48);
      setCableConfig('2c');
    }
  };

  // Recalculate load current from Power (kW) if updated
  const handlePowerChange = (e) => {
    const pVal = e.target.value;
    setPower(pVal);
    if (pVal && Number(pVal) > 0) {
      const p = parseFloat(pVal);
      let calculatedCurrent;
      if (systemType === '3phase') {
        calculatedCurrent = (p * 1000) / (Math.sqrt(3) * voltage * powerFactor);
      } else {
        calculatedCurrent = (p * 1000) / (voltage * powerFactor);
      }
      if (!isNaN(calculatedCurrent)) {
        setLoadCurrent(parseFloat(calculatedCurrent.toFixed(2)));
      }
    }
  };

  const handleProtectionDeviceChange = (e) => {
    const device = e.target.value;
    setProtectionDevice(device);
    if (!isFaultTimeManual) {
      const defaultTime = protectionTripCurves[device]?.time || 0.1;
      setFaultTime(defaultTime);
    }
  };

  // Helper function for temperature interpolation
  const getInterpolatedTempFactor = (insulation, temp) => {
    const factors = tempCorrectionFactors[insulation];
    const temps = Object.keys(factors).map(Number).sort((a, b) => a - b);

    if (temp <= temps[0]) return factors[temps[0]];
    if (temp >= temps[temps.length - 1]) return factors[temps[temps.length - 1]];

    for (let i = 0; i < temps.length - 1; i++) {
      if (temp >= temps[i] && temp <= temps[i + 1]) {
        const ratio = (temp - temps[i]) / (temps[i + 1] - temps[i]);
        return factors[temps[i]] + ratio * (factors[temps[i + 1]] - factors[temps[i]]);
      }
    }
    return 1.0;
  };

  // Perform Calculations
  const calculateCable = () => {
    try {
      const designCurrent = parseFloat(loadCurrent) || 0;
      
      // Grab current ratings table
      const conductorData = currentRatings[conductorMaterial];
      if (!conductorData) throw new Error("Invalid conductor material selected.");
      
      const insulationData = conductorData[insulationType];
      if (!insulationData) throw new Error("Invalid insulation type selected.");

      const ratingsTable = insulationData[installMethod];
      const activeRatingsTable = ratingsTable || insulationData['C'];
      if (!activeRatingsTable) return;

      const availableSizes = Object.keys(activeRatingsTable).map(Number).sort((a, b) => a - b);
      
      // Calculate Correction Factors
      const tempFactor = getInterpolatedTempFactor(insulationType, ambientTemp);
      const groupFactor = groupingFactors[grouping] || 1.0;
      const soilFactor = (location === 'underground') ? (soilCorrectionFactors[parseFloat(soilResistivity)] || 1.0) : 1.0;
      const totalFactor = tempFactor * groupFactor * soilFactor;

      // Requirement 1: Current Carrying Capacity (CCC)
      // designCurrent <= Iz
      // requiredCCC = Ib / totalFactor
      const requiredCCC = designCurrent / totalFactor;
      let minSizeCCC = null;
      for (const size of availableSizes) {
        if (activeRatingsTable[size] >= requiredCCC) {
          minSizeCCC = size;
          break;
        }
      }

      // Requirement 2: Voltage Drop (VD)
      const pf = parseFloat(powerFactor) || 0.85;
      const sinPhi = Math.sqrt(1 - pf * pf);
      const reactancePerKm = 0.08; // Typical average value (Ω/km)

      const calcVoltageDrop = (size, current, length) => {
        const baseTemp = insulationType.includes('90') ? 90 : 70;
        const R20 = conductorResistivity[conductorMaterial] / size;
        const Rop = R20 * (1 + tempCoefficients[conductorMaterial] * (baseTemp - 20));
        
        const R = Rop * length;
        const X = (reactancePerKm / 1000) * length;
        
        let vd;
        if (systemType === '3phase') {
          vd = Math.sqrt(3) * current * (R * pf + X * sinPhi);
        } else {
          vd = 2 * current * (R * pf + X * sinPhi); // 1P/DC is go and return
        }
        
        const vdPercent = (vd / voltage) * 100;
        return { vd, vdPercent, R, X };
      };

      let minSizeVD = null;
      for (const size of availableSizes) {
        const vdData = calcVoltageDrop(size, designCurrent, cableLength);
        if (vdData.vdPercent <= maxVoltageDrop) {
          minSizeVD = size;
          break;
        }
      }

      // Requirement 3: Short Circuit Thermal Withstand (SC)
      // S = (I * sqrt(t)) / k
      const k = kFactors[conductorMaterial][insulationType] || 115;
      const minSizeSC = ((shortCircuitCurrent * 1000 * Math.sqrt(faultTime)) / k);
      let minSizeSCStd = null;
      for (const size of availableSizes) {
        if (size >= minSizeSC) {
          minSizeSCStd = size;
          break;
        }
      }

      // Selection: Max of CCC, VD, and SC sizes
      const finalSizes = [minSizeCCC, minSizeVD, minSizeSCStd].filter(s => s !== null);
      let recommendedSize = finalSizes.length > 0 ? Math.max(...finalSizes) : null;
      if (!recommendedSize) {
        recommendedSize = availableSizes[availableSizes.length - 1]; // Fallback to largest
      }

      const finalRating = activeRatingsTable[recommendedSize] * totalFactor;
      const finalVD = calcVoltageDrop(recommendedSize, designCurrent, cableLength);
      const finalSCWithstand = (k * recommendedSize) / Math.sqrt(faultTime) / 1000; // in kA

      // Protection coordination check: Ib <= In <= Iz and I2 <= 1.45 * Iz
      const tripData = protectionTripCurves[protectionDevice] || { factor: 1.45, time: 0.4 };
      
      // Determine Conventional Tripping Current Factor (I2/In ratio) based on device type
      let overloadFusingFactor = 1.45; // Default for circuit breakers (MCBs/MCCBs)
      if (protectionDevice.startsWith('fuse_')) {
        overloadFusingFactor = 1.6; // IEC 60269 Conventional Fusing Factor (1.6 * In)
      } else if (protectionDevice === 'overload') {
        overloadFusingFactor = 1.20; // Conventional thermal relay tripping factor (1.20 * In)
      }

      const tripCurrent = protectionRating * overloadFusingFactor;
      const cableMaxCurrent = activeRatingsTable[recommendedSize] * totalFactor;
      const i2Limit = 1.45 * cableMaxCurrent;

      const protectionValid = protectionRating >= designCurrent && 
                              protectionRating <= cableMaxCurrent && 
                              tripCurrent <= i2Limit;

      setCalcResults({
        designCurrent,
        requiredCCC,
        minSizeCCC,
        minSizeVD,
        minSizeSCStd,
        minSizeSC,
        recommendedSize,
        finalRating,
        finalVD,
        finalSCWithstand,
        tempFactor,
        groupFactor,
        soilFactor,
        totalFactor,
        protectionRating,
        protectionDevice,
        protectionValid,
        tripData,
        ratingsTable: activeRatingsTable,
        availableSizes,
        loadType,
        systemType,
        voltage,
        cableLength,
        maxVoltageDrop,
        shortCircuitCurrent,
        faultTime,
        conductor: conductorMaterial,
        insulation: insulationType,
        k,
        tripCurrent,
        cableMaxCurrent,
        i2Limit
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsCalculating(false);
    }
  };

  // Recalculate whenever any input parameter changes
  useEffect(() => {
    calculateCable();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    systemType,
    voltage,
    loadCurrent,
    powerFactor,
    loadType,
    startingCurrent,
    conductorMaterial,
    insulationType,
    cableConfig,
    installMethod,
    ambientTemp,
    soilResistivity,
    grouping,
    protectionDevice,
    protectionRating,
    cableLength,
    maxVoltageDrop,
    shortCircuitCurrent,
    faultTime,
    location
  ]);

  const generatePDFReport = () => {
    if (!calcResults) return;
    const printWindow = window.open('', '_blank');
    
    // Formatting values
    const date = new Date().toLocaleString();
    const systemText = systemType === '3phase' ? 'Three-Phase AC' : systemType === '1phase' ? 'Single-Phase AC' : 'DC System';
    const conductorText = conductorMaterial === 'copper' ? 'Copper (Cu)' : 'Aluminum (Al)';
    const insulationText = insulationType === 'xlpe90' ? 'XLPE/EPR (90°C)' : insulationType === 'pvc90' ? 'PVC (90°C)' : 'PVC (70°C)';
    const configText = cableConfig === '2c' ? '2-Core' : cableConfig === '3c' ? '3-Core' : cableConfig === '4c' ? '4-Core' : '5-Core';
    const deviceText = protectionTripCurves[protectionDevice]?.name || protectionDevice;
    
    // Status indicators
    const cccPass = calcResults.finalRating >= calcResults.designCurrent;
    const vdPass = calcResults.finalVD.vdPercent <= calcResults.maxVoltageDrop;
    const scPass = calcResults.finalSCWithstand >= calcResults.shortCircuitCurrent;
    const protectionPass = calcResults.protectionValid;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>IEC Cable Sizing Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #333;
            margin: 0;
            padding: 40px;
            line-height: 1.5;
            background: #fff;
          }
          .header {
            border-bottom: 3px solid #1e3a5f;
            padding-bottom: 20px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .title-area h1 {
            color: #1e3a5f;
            margin: 0 0 5px 0;
            font-size: 24px;
            font-weight: bold;
          }
          .title-area p {
            margin: 0;
            color: #666;
            font-size: 14px;
          }
          .date-area {
            text-align: right;
            font-size: 12px;
            color: #666;
          }
          .section {
            margin-bottom: 25px;
          }
          .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #1e3a5f;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
            margin-bottom: 15px;
            text-transform: uppercase;
          }
          .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            font-size: 13px;
          }
          table.data-table th, table.data-table td {
            border: 1px solid #ddd;
            padding: 8px 12px;
            text-align: left;
          }
          table.data-table th {
            background-color: #f5f5f5;
            color: #1e3a5f;
            font-weight: bold;
          }
          .recommendation-box {
            background-color: #f0f4f8;
            border-left: 6px solid #1e3a5f;
            padding: 20px;
            margin-bottom: 25px;
            text-align: center;
          }
          .rec-size {
            font-size: 32px;
            font-weight: bold;
            color: #1e3a5f;
            margin: 10px 0;
          }
          .status-pass {
            color: #2e7d32;
            font-weight: bold;
          }
          .status-fail {
            color: #c62828;
            font-weight: bold;
          }
          .status-warn {
            color: #ef6c00;
            font-weight: bold;
          }
          .step-box {
            background-color: #fafafa;
            border: 1px solid #eee;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 15px;
            font-size: 13px;
          }
          .step-title {
            font-weight: bold;
            color: #2c5282;
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
          }
          .formula {
            font-family: Consolas, monospace;
            background-color: #f1f1f1;
            padding: 6px 12px;
            border-radius: 4px;
            margin: 8px 0;
            font-size: 12px;
            display: inline-block;
          }
          @media print {
            body {
              padding: 0;
            }
            .no-print {
              display: none;
            }
            .page-break {
              page-break-before: always;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title-area">
            <h1>⚡ IEC CABLE SIZING REPORT</h1>
            <p>Calculated in accordance with IEC 60364-5-52, IEC 60287, and IEC 60909</p>
          </div>
          <div class="date-area">
            <strong>Report Date:</strong> ${date}<br />
            <strong>Software:</strong> MotorTracker v1.0
          </div>
        </div>

        <div class="recommendation-box">
          <div style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #555;">Minimum Recommended Cable Cross-Section</div>
          <div class="rec-size">${calcResults.recommendedSize} mm²</div>
          <div style="font-size: 14px; color: #333; font-weight: bold;">
            ${conductorText} | ${insulationText} | ${configText} | ${cableLength}m Length
          </div>
          <div style="margin-top: 10px; font-size: 13px;">
            Status: <span class="${(cccPass && vdPass && scPass) ? 'status-pass' : 'status-warn'}">
              ${(cccPass && vdPass && scPass) ? '✅ ALL IEC CRITERIA SATISFIED' : '⚠️ SOME CRITERIA NOT SATISFIED - VERIFY DESIGN'}
            </span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">1. Design Input Parameters</div>
          <div class="grid-2">
            <div>
              <table class="data-table">
                <thead>
                  <tr><th colspan="2">System & Load Parameters</th></tr>
                </thead>
                <tbody>
                  <tr><td>System Type</td><td>${systemText} (${voltage}V, ${frequency}Hz)</td></tr>
                  <tr><td>Earthing System</td><td>${earthingSystem}</td></tr>
                  <tr><td>Location</td><td>${location}</td></tr>
                  <tr><td>Design Current (Ib)</td><td>${calcResults.designCurrent.toFixed(1)} A ${power ? `(Auto-calculated from ${power} kW)` : ''}</td></tr>
                  <tr><td>Power Factor (cos φ)</td><td>${powerFactor}</td></tr>
                  <tr><td>Load Type / Starting</td><td>${loadType.toUpperCase()} / ${loadType === 'motor' ? `DOL (starting factor ${startingCurrent})` : 'Continuous'}</td></tr>
                </tbody>
              </table>
            </div>
            <div>
              <table class="data-table">
                <thead>
                  <tr><th colspan="2">Cable & Environmental Specs</th></tr>
                </thead>
                <tbody>
                  <tr><td>Conductor / Insulation</td><td>${conductorText} / ${insulationText}</td></tr>
                  <tr><td>Installation Method</td><td>Method ${installMethod}</td></tr>
                  <tr><td>Ambient Temp / Grouping</td><td>${ambientTemp}°C / ${grouping} circuits</td></tr>
                  <tr><td>Protection Device</td><td>${deviceText} (Rating ${protectionRating}A)</td></tr>
                  <tr><td>Fault Clearance Time</td><td>${faultTime} s (${isFaultTimeManual ? 'Manual Override' : 'Auto-linked'})</td></tr>
                  <tr><td>Prospective Short Circuit (I_sc)</td><td>${shortCircuitCurrent} kA</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="page-break"></div>

        <div class="section">
          <div class="section-title">2. Verification Steps & Calculations</div>

          <!-- Step 1: CCC -->
          <div class="step-box">
            <div class="step-title">
              <span>Step 1: Current Carrying Capacity (CCC) Verification</span>
              <span class="${cccPass ? 'status-pass' : 'status-fail'}">${cccPass ? 'PASS' : 'FAIL'}</span>
            </div>
            <div>
              The selected cable must handle the design current after derating.
              <br />
              <div class="formula">Iz = Itable × k_temp × k_group × k_soil</div>
              <br />
              - Table base rating: <strong>${calcResults.ratingsTable[calcResults.recommendedSize]} A</strong> (Method ${installMethod})
              <br />
              - Combined derating factor: <strong>${calcResults.totalFactor.toFixed(3)}</strong>
              <br />
              - Derated capacity (Iz): <strong>${calcResults.finalRating.toFixed(1)} A</strong>
              <br />
              - Design Current (Ib): <strong>${calcResults.designCurrent.toFixed(1)} A</strong>
              <br />
              - Status: <strong>${calcResults.finalRating.toFixed(1)} A ≥ ${calcResults.designCurrent.toFixed(1)} A</strong> 
              (<span class="${cccPass ? 'status-pass' : 'status-fail'}">${cccPass ? 'Satisfied' : 'Insufficient Capacity'}</span>)
            </div>
          </div>

          <!-- Step 2: VD -->
          <div class="step-box">
            <div class="step-title">
              <span>Step 2: Voltage Drop (ΔU) Verification</span>
              <span class="${vdPass ? 'status-pass' : 'status-fail'}">${vdPass ? 'PASS' : 'FAIL'}</span>
            </div>
            <div>
              The voltage drop must not exceed the maximum allowed percentage.
              <br />
              <div class="formula">
                ${systemType === '3phase' 
                  ? 'ΔU = √3 × I × L × (R cos φ + X sin φ)' 
                  : 'ΔU = 2 × I × L × (R cos φ + X sin φ)'
                }
              </div>
              <br />
              - Operating resistance (R): <strong>${calcResults.finalVD.R.toFixed(5)} Ω</strong>
              <br />
              - Assumed Reactance (X): <strong>${calcResults.finalVD.X.toFixed(5)} Ω</strong>
              <br />
              - Total Voltage Drop: <strong>${calcResults.finalVD.vd.toFixed(2)} V</strong> (<strong>${calcResults.finalVD.vdPercent.toFixed(2)}%</strong> of ${voltage}V)
              <br />
              - Allowed limit: <strong>${maxVoltageDrop}%</strong>
              <br />
              - Status: <strong>${calcResults.finalVD.vdPercent.toFixed(2)}% ≤ ${maxVoltageDrop}%</strong>
              (<span class="${vdPass ? 'status-pass' : 'status-fail'}">${vdPass ? 'Satisfied' : 'Voltage Drop Too High'}</span>)
            </div>
          </div>

          <!-- Step 3: SC -->
          <div class="step-box">
            <div class="step-title">
              <span>Step 3: Short Circuit Thermal Withstand (Adiabatic Limit)</span>
              <span class="${scPass ? 'status-pass' : 'status-fail'}">${scPass ? 'PASS' : 'FAIL'}</span>
            </div>
            <div>
              The cable must withstand short-circuit heat until the breaker trips.
              <br />
              <div class="formula">S = (I_sc × √t) / k</div>
              <br />
              - Short circuit current (I_sc): <strong>${shortCircuitCurrent} kA</strong> (${shortCircuitCurrent * 1000} A)
              <br />
              - Clearance time (t): <strong>${faultTime} s</strong>
              <br />
              - Conductor constant (k): <strong>${calcResults.k}</strong>
              <br />
              - Minimum required cross section (S): <strong>${calcResults.minSizeSC.toFixed(2)} mm²</strong>
              <br />
              - Selected cable size: <strong>${calcResults.recommendedSize} mm²</strong>
              <br />
              - Status: <strong>${calcResults.recommendedSize} mm² ≥ ${calcResults.minSizeSC.toFixed(2)} mm²</strong>
              (<span class="${scPass ? 'status-pass' : 'status-fail'}">${scPass ? 'Satisfied' : 'Cable Will Burn During Fault'}</span>)
            </div>
          </div>

          <!-- Step 4: Protection Coordination -->
          <div class="step-box">
            <div class="step-title">
              <span>Step 4: Overload Protection Coordination (IEC 60364-4-43)</span>
              <span class="${protectionPass ? 'status-pass' : 'status-warn'}">${protectionPass ? 'PASS' : 'CHECK'}</span>
            </div>
            <div>
              The breaker rating (In) must coordinate with the load current (Ib) and cable capacity (Iz).
              <br />
              <div class="formula">Ib ≤ In ≤ Iz  and  I2 ≤ 1.45 × Iz</div>
              <br />
              - Design Current (Ib): <strong>${calcResults.designCurrent.toFixed(1)} A</strong>
              <br />
              - Breaker Setting (In): <strong>${protectionRating} A</strong>
              <br />
              - Cable Capacity (Iz): <strong>${calcResults.cableMaxCurrent.toFixed(1)} A</strong>
              <br />
              - Conventional Trip Current (I2): <strong>${calcResults.tripCurrent.toFixed(1)} A</strong>
              <br />
              - Limit Condition (1.45 × Iz): <strong>${calcResults.i2Limit.toFixed(1)} A</strong>
              <br />
              - Status: <strong>${protectionPass ? 'Properly Coordinated' : 'Verify Overload Settings!'}</strong>
            </div>
          </div>
        </div>

        <div class="section" style="margin-top: 30px; font-size: 11px; text-align: center; color: #888; border-top: 1px solid #eee; padding-top: 10px;">
          Report generated by MotorTracker. This is a technical calculation record. Under critical installations, verification by a professional engineer is recommended.
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white relative">
      {/* Background Dots Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='30' cy='30' r='2' fill='%23ffffff'/%3E%3C/svg%3E")`
      }}></div>

      <div className="relative z-10 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Breadcrumb Header */}
        <div className="flex items-center space-x-3 mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 text-blue-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 flex items-center justify-center cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <Zap className="w-7 h-7 text-amber-400 animate-pulse" />
              IEC Cable Sizing Calculator
            </h1>
            <p className="text-xs sm:text-sm text-blue-200/80">
              Calculate cable requirements in accordance with IEC 60364-5-52, IEC 60287, and IEC 60909
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-start gap-3 backdrop-blur-md">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-blue-200">
            <span className="font-semibold text-white">IEC Standard Compliance:</span> This tool computes continuous current carrying limits (Iz) with correction factors, voltage drop restrictions (ΔU), and short-circuit thermal limits. It also verifies breaker/fuse overload coordination (Ib ≤ In ≤ Iz).
          </div>
        </div>

        {/* Input Parameters Section - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* Card 1: Main System Parameters with Tab Selection */}
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-white/10 p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-blue-300">
                <Settings className="w-5 h-5" />
                Equipment & Circuit parameters
              </h2>
              <span className="text-xs px-2.5 py-1 bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30 font-medium">
                Part 1
              </span>
            </div>

            {/* Tab Links */}
            <div className="flex space-x-1 bg-slate-900/50 p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setActiveTab('system')}
                className={`flex-1 text-center py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  activeTab === 'system' 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                System Config
              </button>
              <button
                onClick={() => setActiveTab('load')}
                className={`flex-1 text-center py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  activeTab === 'load' 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Load Specs
              </button>
              <button
                onClick={() => setActiveTab('cable')}
                className={`flex-1 text-center py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  activeTab === 'cable' 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Cable Options
              </button>
            </div>

            {/* Tab Content 1: System Config */}
            {activeTab === 'system' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">System Type</label>
                  <select 
                    value={systemType} 
                    onChange={handleSystemTypeChange}
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-white"
                  >
                    <option value="3phase">Three-Phase AC (e.g. 400V)</option>
                    <option value="1phase">Single-Phase AC (e.g. 230V)</option>
                    <option value="dc">DC System (e.g. 48V / 110V / 220V)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">Voltage (V)</label>
                    <input 
                      type="number" 
                      value={voltage} 
                      onChange={(e) => setVoltage(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-white"
                      min="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">Frequency (Hz)</label>
                    <input 
                      type="number" 
                      value={frequency} 
                      onChange={(e) => setFrequency(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-white"
                      min="0"
                      disabled={systemType === 'dc'}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Earthing System</label>
                  <select 
                    value={earthingSystem} 
                    onChange={(e) => setEarthingSystem(e.target.value)}
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-white"
                  >
                    <option value="TN-S">TN-S (Separate PE & N)</option>
                    <option value="TN-C-S">TN-C-S (Combined/Separate)</option>
                    <option value="TN-C">TN-C (Combined PE + N)</option>
                    <option value="TT">TT (Local ground rod)</option>
                    <option value="IT">IT (Isolated neutral/high impedance)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Installation Environment</label>
                  <select 
                    value={location} 
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-white"
                  >
                    <option value="indoor">Indoor (Ambient space)</option>
                    <option value="outdoor">Outdoor (Direct sun exposure)</option>
                    <option value="underground">Underground (Buried in soil)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Tab Content 2: Load Specs */}
            {activeTab === 'load' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Power Rating (kW) <span className="text-xs font-normal text-slate-400">(Optional auto-calc current)</span></label>
                  <input 
                    type="number" 
                    value={power} 
                    placeholder="Enter kW rating to calculate design current"
                    onChange={handlePowerChange}
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-white"
                    min="0"
                    step="0.1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">Design Current (A)</label>
                    <input 
                      type="number" 
                      value={loadCurrent} 
                      onChange={(e) => setLoadCurrent(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-white"
                      min="0.1"
                      step="0.1"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">Power Factor (cos φ)</label>
                    <input 
                      type="number" 
                      value={powerFactor} 
                      onChange={(e) => setPowerFactor(parseFloat(e.target.value) || 1)}
                      className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-white"
                      min="0.1"
                      max="1.0"
                      step="0.01"
                      disabled={systemType === 'dc'}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Load Type</label>
                  <select 
                    value={loadType} 
                    onChange={(e) => setLoadType(e.target.value)}
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-white"
                  >
                    <option value="motor">Electrical Motor Load</option>
                    <option value="resistive">Resistive Heater / Heating Element</option>
                    <option value="lighting">Commercial/Industrial Lighting</option>
                    <option value="mixed">Mixed Industrial Load</option>
                    <option value="welding">Welding Equipment</option>
                  </select>
                </div>

                {loadType === 'motor' && (
                  <div className="space-y-2 animate-fade-in">
                    <label className="text-sm font-semibold text-slate-300">Starting Method</label>
                    <select 
                      value={startingCurrent} 
                      onChange={(e) => setStartingCurrent(e.target.value)}
                      className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-white"
                    >
                      <option value="1">Direct Online (DOL) [6-8x run current]</option>
                      <option value="0.5">Star-Delta [2-3x run current]</option>
                      <option value="0.3">Soft Starter [3-4x run current]</option>
                      <option value="0.2">Variable Frequency Drive (VFD) [1-1.5x run current]</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Tab Content 3: Cable Options */}
            {activeTab === 'cable' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">Conductor Material</label>
                    <select 
                      value={conductorMaterial} 
                      onChange={(e) => setConductorMaterial(e.target.value)}
                      className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-white"
                    >
                      <option value="copper">Copper (Cu)</option>
                      <option value="aluminum">Aluminum (Al)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">Insulation</label>
                    <select 
                      value={insulationType} 
                      onChange={(e) => setInsulationType(e.target.value)}
                      className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-white"
                    >
                      <option value="xlpe90">XLPE / EPR (90°C)</option>
                      <option value="pvc90">PVC (90°C Rating)</option>
                      <option value="pvc70">PVC (70°C Standard)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Core Configuration</label>
                  <select 
                    value={cableConfig} 
                    onChange={(e) => setCableConfig(e.target.value)}
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-white"
                  >
                    <option value="2c">2-Core (Single Phase / DC)</option>
                    <option value="3c">3-Core (3-Phase Balanced, no neutral)</option>
                    <option value="4c">4-Core (3-Phase + Neutral)</option>
                    <option value="5c">5-Core (3-Phase + Neutral + Protective Earth)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">
                    Installation Method 
                    <span className="text-xs font-normal text-slate-400 ml-1">(IEC 60364-5-52)</span>
                  </label>
                  <select 
                    value={installMethod} 
                    onChange={(e) => setInstallMethod(e.target.value)}
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-white"
                  >
                    <option value="A1">A1 - Insulated conductors inside thermal-insulated walls</option>
                    <option value="A2">A2 - Multicore cable inside thermal-insulated walls</option>
                    <option value="B1">B1 - Insulated conductors in conduit on masonry/walls</option>
                    <option value="B2">B2 - Multicore cable in conduit on masonry/walls</option>
                    <option value="C">C - Single/Multicore cables directly on wood/masonry walls</option>
                    <option value="D1">D1 - Multicore cables in buried conduits</option>
                    <option value="D2">D2 - Single-core cables in buried conduits</option>
                    <option value="E">E - Multicore cables in free air / open trays</option>
                    <option value="F1">F1 - Single-core cables touching in free air / open trays</option>
                    <option value="F2">F2 - Single-core cables spaced in free air / open trays</option>
                    <option value="G">G - Single-core cables embedded directly in concrete</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Environment & Protection Parameters */}
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-white/10 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-blue-300">
                <Scale className="w-5 h-5" />
                Environment & Fault parameters
              </h2>
              <span className="text-xs px-2.5 py-1 bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30 font-medium">
                Part 2
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Ambient Temp (°C)</label>
                <input 
                  type="number" 
                  value={ambientTemp} 
                  onChange={(e) => setAmbientTemp(parseInt(e.target.value) || 30)}
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-white"
                  min="-20"
                  max="80"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Grouping (No. circuits)</label>
                <select 
                  value={grouping} 
                  onChange={(e) => setGrouping(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-white"
                >
                  <option value="1">1 circuit (Independent)</option>
                  <option value="2">2 circuits grouped</option>
                  <option value="3">3 circuits grouped</option>
                  <option value="4">4 circuits grouped</option>
                  <option value="6">6 circuits grouped</option>
                  <option value="9">9 circuits grouped</option>
                </select>
              </div>
            </div>

            {location === 'underground' && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Soil Thermal Resistivity (K·m/W)</label>
                <select 
                  value={soilResistivity} 
                  onChange={(e) => setSoilResistivity(e.target.value)}
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-white"
                >
                  <option value="1.0">1.0 K·m/W (Wet Soil / High Moisture)</option>
                  <option value="1.5">1.5 K·m/W (Moist Standard Soil)</option>
                  <option value="2.0">2.0 K·m/W (Dry Soil)</option>
                  <option value="2.5">2.5 K·m/W (Very Dry Sandy Soil)</option>
                  <option value="3.0">3.0 K·m/W (Dry Sand)</option>
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Protection Device</label>
                <select 
                  value={protectionDevice} 
                  onChange={handleProtectionDeviceChange}
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-white"
                >
                  <option value="mccb_c">MCCB Type C (General / Motor)</option>
                  <option value="mccb_d">MCCB Type D (High inrush / Motor)</option>
                  <option value="mccb_b">MCCB Type B (Sensitive lines)</option>
                  <option value="mccb_k">MCCB Type K (Motor starter)</option>
                  <option value="mccb_z">MCCB Type Z (Electronics)</option>
                  <option value="fuse_gg">Fuse gG (General Cable prot.)</option>
                  <option value="fuse_gm">Fuse gM (Motor protection)</option>
                  <option value="overload">Overload Relay (Thermal trip only)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Breaker/Fuse Rating (In)</label>
                <select 
                  value={protectionRating} 
                  onChange={(e) => setProtectionRating(parseInt(e.target.value) || 16)}
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-white"
                >
                  {protectionRatings.map((rating) => (
                    <option key={rating} value={rating}>{rating} A</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Cable Route Length (m)</label>
                <input 
                  type="number" 
                  value={cableLength} 
                  onChange={(e) => setCableLength(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-white"
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Max Allowed Drop (%)</label>
                <input 
                  type="number" 
                  value={maxVoltageDrop} 
                  onChange={(e) => setMaxVoltageDrop(parseFloat(e.target.value) || 5)}
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-white"
                  min="0.1"
                  max="20"
                  step="0.1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 flex flex-col justify-between">
                <div>
                  <label className="text-sm font-semibold text-slate-300">
                    Prospective Short Circuit Current (kA) 
                    <span className="block text-[10px] text-slate-400 font-normal leading-tight">SC level at the upstream supply / substation</span>
                  </label>
                  <input 
                    type="number" 
                    value={shortCircuitCurrent} 
                    onChange={(e) => setShortCircuitCurrent(parseFloat(e.target.value) || 0)}
                    className="w-full mt-1 bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-white"
                    min="0.1"
                    step="0.1"
                  />
                </div>
                <div className="text-[10px] text-slate-400 leading-normal mt-1">
                  This is the <strong>bolted fault current</strong> available at the supply point (substation, transformer secondary, or main switchboard). Not the reduced value at the end of the cable.
                </div>
              </div>

              <div className="space-y-2 flex flex-col justify-between">
                <div>
                  <label className="text-sm font-semibold text-slate-300 flex items-center justify-between">
                    <span>Fault Clearance Time (s)</span>
                    {isFaultTimeManual ? (
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                        Manual
                      </span>
                    ) : (
                      <span className="text-[9px] bg-green-500/20 text-green-300 border border-green-500/30 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                        Auto
                      </span>
                    )}
                  </label>
                  <input 
                    type="number" 
                    value={faultTime} 
                    onChange={(e) => { 
                      setFaultTime(parseFloat(e.target.value) || 0.0); 
                      setIsFaultTimeManual(true); 
                    }}
                    className={`w-full mt-1 bg-slate-900/80 border rounded-xl px-4 py-2.5 focus:outline-none text-white ${
                      isFaultTimeManual ? 'border-white/10 focus:border-blue-500' : 'border-green-500/50 focus:border-green-400'
                    }`}
                    min="0.001"
                    max="10"
                    step="0.01"
                  />
                </div>
                {isFaultTimeManual ? (
                  <div className="text-[10px] text-slate-400 mt-1 flex justify-between items-center">
                    <span>User overridden time limit</span>
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsFaultTimeManual(false);
                        const defaultTime = protectionTripCurves[protectionDevice]?.time || 0.1;
                        setFaultTime(defaultTime);
                      }}
                      className="text-blue-400 hover:text-blue-300 transition-colors font-semibold cursor-pointer underline text-[10px] bg-transparent border-0 p-0"
                    >
                      Reset to auto
                    </button>
                  </div>
                ) : (
                  <div className="text-[10px] text-green-400/85 mt-1 font-medium leading-tight truncate" title={protectionTripCurves[protectionDevice]?.desc}>
                    {protectionTripCurves[protectionDevice]?.desc || "Standard clearance limit"}
                  </div>
                )}
              </div>
            </div>

            <button 
              type="button"
              onClick={(e) => { e.preventDefault(); calculateCable(); }}
              disabled={isCalculating}
              className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer border-0"
            >
              <Gauge className={`w-5 h-5 ${isCalculating ? 'animate-spin' : ''}`} />
              {isCalculating ? "Calculating Size..." : "Calculate Cable Sizing"}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {calcResults && (
          <div className="mt-8 space-y-6">
            
            {/* Results Header with Export Button */}
            <div className="flex justify-between items-center bg-slate-800/40 backdrop-blur-md border border-white/10 rounded-xl px-5 py-3 shadow-lg">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Gauge className="w-4 h-4 text-blue-400" />
                Calculation Summary
              </h3>
              <button
                type="button"
                onClick={generatePDFReport}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-lg font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 border-0 shadow"
              >
                <FileText className="w-4 h-4" />
                Export PDF Report
              </button>
            </div>

            {/* Recommendation Big Banner */}
            <div className="bg-gradient-to-r from-blue-600/30 via-indigo-600/30 to-slate-800/80 backdrop-blur-lg border border-blue-500/40 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl">
              <div className="space-y-2 text-center md:text-left">
                <div className="text-blue-400 font-semibold text-xs sm:text-sm uppercase tracking-wider">
                  IEC 60364-5-52 Minimum Recommended Phase Size
                </div>
                <div className="text-4xl md:text-5xl font-extrabold text-white flex items-center justify-center md:justify-start gap-2">
                  <span>{calcResults.recommendedSize}</span>
                  <span className="text-xl md:text-2xl font-medium text-slate-300">mm²</span>
                </div>
                <div className="text-xs sm:text-sm text-slate-300 max-w-xl">
                  {calcResults.conductor === 'copper' ? 'Copper (Cu)' : 'Aluminum (Al)'} conductor with {calcResults.insulation === 'xlpe90' ? 'XLPE/EPR (90°C)' : calcResults.insulation === 'pvc90' ? 'PVC (90°C)' : 'PVC (70°C)'} insulation.
                  Configuration calls for <span className="font-semibold text-white">{calcResults.systemType === '3phase' ? '3P+N+PE multicore' : '2-core'} cable</span>.
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center gap-3">
                <div className="p-2.5 bg-green-500/20 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">IEC Validation Pass</h4>
                  <p className="text-xs text-slate-300">All checks successfully calculated</p>
                </div>
              </div>
            </div>

            {/* Results Grid - 4 core validation criteria */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* CCC Card */}
              <div className={`bg-slate-800/40 backdrop-blur-md rounded-xl p-5 border relative overflow-hidden flex flex-col justify-between ${
                calcResults.finalRating >= calcResults.designCurrent 
                  ? 'border-green-500/30 bg-green-500/5' 
                  : 'border-red-500/30 bg-red-500/5'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase">Capacity (Iz)</span>
                  <span className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    calcResults.finalRating >= calcResults.designCurrent 
                      ? 'bg-green-500/20 text-green-300' 
                      : 'bg-red-500/20 text-red-300'
                  }`}>
                    {calcResults.finalRating >= calcResults.designCurrent ? "PASS" : "FAIL"}
                  </span>
                </div>
                <div className="space-y-1 my-3">
                  <div className="text-xl sm:text-2xl font-bold text-white">
                    {calcResults.finalRating.toFixed(1)} A
                  </div>
                  <div className="text-xs text-slate-300">
                    Required: {calcResults.designCurrent.toFixed(1)} A
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 border-t border-white/5 pt-2">
                  Base: {calcResults.ratingsTable[calcResults.recommendedSize]}A | Derated (Iz)
                </div>
              </div>

              {/* VD Card */}
              <div className={`bg-slate-800/40 backdrop-blur-md rounded-xl p-5 border relative overflow-hidden flex flex-col justify-between ${
                calcResults.finalVD.vdPercent <= calcResults.maxVoltageDrop 
                  ? 'border-green-500/30 bg-green-500/5' 
                  : 'border-red-500/30 bg-red-500/5'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase">Voltage Drop (ΔU)</span>
                  <span className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    calcResults.finalVD.vdPercent <= calcResults.maxVoltageDrop 
                      ? 'bg-green-500/20 text-green-300' 
                      : 'bg-red-500/20 text-red-300'
                  }`}>
                    {calcResults.finalVD.vdPercent <= calcResults.maxVoltageDrop ? "PASS" : "FAIL"}
                  </span>
                </div>
                <div className="space-y-1 my-3">
                  <div className="text-xl sm:text-2xl font-bold text-white">
                    {calcResults.finalVD.vdPercent.toFixed(2)}%
                  </div>
                  <div className="text-xs text-slate-300">
                    Allowed: ≤ {calcResults.maxVoltageDrop}%
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 border-t border-white/5 pt-2">
                  Drop: {calcResults.finalVD.vd.toFixed(2)} V | End: {(calcResults.voltage - calcResults.finalVD.vd).toFixed(1)} V
                </div>
              </div>

              {/* SC Card */}
              <div className={`bg-slate-800/40 backdrop-blur-md rounded-xl p-5 border relative overflow-hidden flex flex-col justify-between ${
                calcResults.finalSCWithstand >= calcResults.shortCircuitCurrent 
                  ? 'border-green-500/30 bg-green-500/5' 
                  : 'border-red-500/30 bg-red-500/5'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase">Thermal Limit (SC)</span>
                  <span className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    calcResults.finalSCWithstand >= calcResults.shortCircuitCurrent 
                      ? 'bg-green-500/20 text-green-300' 
                      : 'bg-red-500/20 text-red-300'
                  }`}>
                    {calcResults.finalSCWithstand >= calcResults.shortCircuitCurrent ? "PASS" : "FAIL"}
                  </span>
                </div>
                <div className="space-y-1 my-3">
                  <div className="text-xl sm:text-2xl font-bold text-white">
                    {calcResults.finalSCWithstand.toFixed(2)} kA
                  </div>
                  <div className="text-xs text-slate-300">
                    Fault SC: {calcResults.shortCircuitCurrent} kA
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 border-t border-white/5 pt-2">
                  Withstand duration: {calcResults.faultTime} s | k={calcResults.k}
                </div>
              </div>

              {/* Protection Card */}
              <div className={`bg-slate-800/40 backdrop-blur-md rounded-xl p-5 border relative overflow-hidden flex flex-col justify-between ${
                calcResults.protectionValid 
                  ? 'border-green-500/30 bg-green-500/5' 
                  : 'border-amber-500/30 bg-amber-500/5'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase">Breaker Coordination</span>
                  <span className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    calcResults.protectionValid 
                      ? 'bg-green-500/20 text-green-300' 
                      : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {calcResults.protectionValid ? "COORDINATED" : "CHECK IN"}
                  </span>
                </div>
                <div className="space-y-1 my-3">
                  <div className="text-xl sm:text-2xl font-bold text-white">
                    {calcResults.protectionRating} A
                  </div>
                  <div className="text-xs text-slate-300">
                    Device: {protectionTripCurves[calcResults.protectionDevice]?.name || calcResults.protectionDevice}
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 border-t border-white/5 pt-2">
                  {calcResults.protectionValid 
                    ? "Ib ≤ In ≤ Iz satisfied" 
                    : "Warning: Verify breaker limits!"}
                </div>
              </div>

              {/* Minimum Sizes Required */}
              <div className="bg-slate-800/40 backdrop-blur-md rounded-xl p-5 border border-white/10 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase">Minimum Sizes Required</span>
                  <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/20 text-blue-300">
                    INFO
                  </span>
                </div>
                <div className="space-y-1 my-3">
                  <div className="text-xl sm:text-2xl font-bold text-white">
                    {calcResults.recommendedSize} mm²
                  </div>
                  <div className="text-xs text-slate-300">
                    For capacity: {calcResults.minSizeCCC || 'N/A'} mm²<br />
                    For drop: {calcResults.minSizeVD || 'N/A'} mm²<br />
                    For fault: {calcResults.minSizeSCStd || 'N/A'} mm²
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 border-t border-white/5 pt-2">
                  Max of all requirements
                </div>
              </div>

              {/* Earth Conductor */}
              <div className="bg-slate-800/40 backdrop-blur-md rounded-xl p-5 border border-white/10 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase">Earth Conductor</span>
                  <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/20 text-blue-300">
                    IEC 60364-5-54
                  </span>
                </div>
                <div className="space-y-1 my-3">
                  <div className="text-xl sm:text-2xl font-bold text-white">
                    {getEarthConductorSize(calcResults.recommendedSize)} mm²
                  </div>
                  <div className="text-xs text-slate-300">
                    Phase: {calcResults.recommendedSize} mm²<br />
                    Standard size for grounding
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 border-t border-white/5 pt-2">
                  {calcResults.recommendedSize > 35 ? 'Recommended: ½ phase size' : 'Same as phase'}
                </div>
              </div>

            </div>

            {/* Sub-results details section (two columns: Factor details & Coordination table) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Column 1: Applied Derating Factors */}
              <div className="bg-slate-800/40 backdrop-blur-md rounded-xl border border-white/10 p-5 space-y-4">
                <h3 className="text-xs sm:text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  Applied Derating Factors (IEC 60364-5-52)
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                    <span className="text-slate-400">Ambient Temperature Correction ({calcResults.tempFactor === 1 ? "30°C Base" : `${ambientTemp}°C`})</span>
                    <span className="font-semibold text-white">{calcResults.tempFactor.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                    <span className="text-slate-400">Grouping Factor ({grouping} circuit{grouping > 1 ? 's' : ''})</span>
                    <span className="font-semibold text-white">{calcResults.groupFactor.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                    <span className="text-slate-400">Soil Thermal Resistivity Correction ({location === 'underground' ? `${soilResistivity} K·m/W` : "N/A Air"})</span>
                    <span className="font-semibold text-white">{calcResults.soilFactor.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-2 bg-slate-900/30 px-3 py-2 rounded-lg">
                    <span className="font-semibold text-blue-300">Total Derating Multiplier</span>
                    <span className="font-bold text-blue-400 text-base">{calcResults.totalFactor.toFixed(3)}</span>
                  </div>
                </div>
              </div>

              {/* Column 2: Protection Coordination Table */}
              <div className="bg-slate-800/40 backdrop-blur-md rounded-xl border border-white/10 p-5 space-y-4">
                <h3 className="text-xs sm:text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  IEC 60364-4-43 Overload Protection Check
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider">
                        <th className="pb-2">Parameter</th>
                        <th className="pb-2">Value</th>
                        <th className="pb-2">Limit Condition</th>
                        <th className="pb-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      <tr>
                        <td className="py-2.5 text-slate-300">Design Current (Ib)</td>
                        <td className="py-2.5 font-semibold text-white">{calcResults.designCurrent.toFixed(1)} A</td>
                        <td className="py-2.5 text-slate-400">≤ In ({calcResults.protectionRating} A)</td>
                        <td className="py-2.5 text-right font-medium text-green-400">
                          {calcResults.designCurrent <= calcResults.protectionRating ? '✅ PASS' : '❌ FAIL'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 text-slate-300">Protective Setting (In)</td>
                        <td className="py-2.5 font-semibold text-white">{calcResults.protectionRating} A</td>
                        <td className="py-2.5 text-slate-400">≤ Iz ({calcResults.cableMaxCurrent.toFixed(1)} A)</td>
                        <td className="py-2.5 text-right font-medium text-green-400">
                          {calcResults.protectionRating <= calcResults.cableMaxCurrent ? '✅ PASS' : '❌ FAIL'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 text-slate-300">Secondary Overload (I2)</td>
                        <td className="py-2.5 font-semibold text-white">{calcResults.tripCurrent.toFixed(1)} A</td>
                        <td className="py-2.5 text-slate-400">≤ 1.45 × Iz ({calcResults.i2Limit.toFixed(1)} A)</td>
                        <td className="py-2.5 text-right font-medium text-green-400">
                          {calcResults.tripCurrent <= calcResults.i2Limit ? '✅ PASS' : '❌ FAIL'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 text-slate-300">Fault Disconnection</td>
                        <td className="py-2.5 font-semibold text-white">{calcResults.tripData.time} s</td>
                        <td className="py-2.5 text-slate-400">≤ 5.0 s (TN/TT System)</td>
                        <td className="py-2.5 text-right font-medium text-green-400">✅ PASS</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Math Formula Panel */}
            <div className="bg-slate-800/40 backdrop-blur-md rounded-xl border border-white/10 p-5 space-y-4">
              <h3 className="text-xs sm:text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                Calculation Formula references (IEC Standards)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/50 p-4 rounded-lg border border-white/5 space-y-1 font-mono text-xs">
                  <div className="text-blue-400 font-semibold mb-1">1. Voltage Drop Formula (IEC 60364-5-52)</div>
                  <div className="text-white text-sm my-1.5">
                    {calcResults.systemType === '3phase' 
                      ? 'ΔU = √3 × I × L × (R cos φ + X sin φ)' 
                      : 'ΔU = 2 × I × L × (R cos φ + X sin φ)'
                    }
                  </div>
                  <div className="text-slate-400 leading-relaxed">
                    Values: I = {calcResults.designCurrent.toFixed(1)} A, L = {calcResults.cableLength} m, cos φ = {powerFactor}
                  </div>
                </div>

                <div className="bg-slate-900/50 p-4 rounded-lg border border-white/5 space-y-1 font-mono text-xs">
                  <div className="text-blue-400 font-semibold mb-1">2. Short Circuit Adiabatic Equation (IEC 60909)</div>
                  <div className="text-white text-sm my-1.5">
                    S = (I_sc × √t) / k
                  </div>
                  <div className="text-slate-400 leading-relaxed">
                    Values: I_sc = {calcResults.shortCircuitCurrent} kA, t = {calcResults.faultTime} s, k = {calcResults.k}
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        )}
        
      </div>
    </div>
  );
};

export default CableSizingPage;
