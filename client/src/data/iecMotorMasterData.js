// client/src/data/iecMotorMasterData.js

export const IEC_POLE_CONFIGS = [
  { poles: 2, syncSpeed: 3000, label: "2 Poles (3000 rpm)" },
  { poles: 4, syncSpeed: 1500, label: "4 Poles (1500 rpm)" },
  { poles: 6, syncSpeed: 1000, label: "6 Poles (1000 rpm)" },
  { poles: 8, syncSpeed: 750,  label: "8 Poles (750 rpm)" }
];

export const IEC_MOTOR_DATABASE = [
  // --- FRAME 63 ---
  {
    frame: "63M",
    powerKw: { 2: "0.18 - 0.25", 4: "0.12 - 0.18", 6: "0.09", 8: "0.04 - 0.06" },
    b3: { A: 100, B: 80, H: 63, H_tol: "-0.5", C: 40, K: 7, bolt: "M6" },
    b5: { flangeNo: "FF115", M: 115, N: 95, N_tol: "j6", P: 140, S: 10, T: 3.0, LA: 9 },
    shaft: {
      "2P":   { D: 11, D_tol: "j6", E: 23, F: 4, GA: 12.5 },
      "4-8P": { D: 11, D_tol: "j6", E: 23, F: 4, GA: 12.5 }
    },
    series: "1LE10 / 1LE15"
  },
  // --- FRAME 71 ---
  {
    frame: "71M",
    powerKw: { 2: "0.37 - 0.55", 4: "0.25 - 0.37", 6: "0.18 - 0.25", 8: "0.09 - 0.12" },
    b3: { A: 112, B: 90, H: 71, H_tol: "-0.5", C: 45, K: 7, bolt: "M6" },
    b5: { flangeNo: "FF130", M: 130, N: 110, N_tol: "j6", P: 160, S: 10, T: 3.5, LA: 10 },
    shaft: {
      "2P":   { D: 14, D_tol: "j6", E: 30, F: 5, GA: 16.0 },
      "4-8P": { D: 14, D_tol: "j6", E: 30, F: 5, GA: 16.0 }
    },
    series: "1LE10 / 1LE15"
  },
  // --- FRAME 80 ---
  {
    frame: "80M",
    powerKw: { 2: "0.75 - 1.1", 4: "0.55 - 0.75", 6: "0.37 - 0.55", 8: "0.18 - 0.25" },
    b3: { A: 125, B: 100, H: 80, H_tol: "-0.5", C: 50, K: 10, bolt: "M8" },
    b5: { flangeNo: "FF165", M: 165, N: 130, N_tol: "j6", P: 200, S: 12, T: 3.5, LA: 10 },
    shaft: {
      "2P":   { D: 19, D_tol: "j6", E: 40, F: 6, GA: 21.5 },
      "4-8P": { D: 19, D_tol: "j6", E: 40, F: 6, GA: 21.5 }
    },
    series: "1LE10 / 1LE15"
  },
  // --- FRAME 90S ---
  {
    frame: "90S",
    powerKw: { 2: "1.5", 4: "1.1", 6: "0.75", 8: "0.37" },
    b3: { A: 140, B: 100, H: 90, H_tol: "-0.5", C: 56, K: 10, bolt: "M8" },
    b5: { flangeNo: "FF165", M: 165, N: 130, N_tol: "j6", P: 200, S: 12, T: 3.5, LA: 10 },
    shaft: {
      "2P":   { D: 24, D_tol: "j6", E: 50, F: 8, GA: 27.0 },
      "4-8P": { D: 24, D_tol: "j6", E: 50, F: 8, GA: 27.0 }
    },
    series: "1LE10 / 1LE15"
  },
  // --- FRAME 90L ---
  {
    frame: "90L",
    powerKw: { 2: "2.2", 4: "1.5", 6: "1.1", 8: "0.55" },
    b3: { A: 140, B: 125, H: 90, H_tol: "-0.5", C: 56, K: 10, bolt: "M8" },
    b5: { flangeNo: "FF165", M: 165, N: 130, N_tol: "j6", P: 200, S: 12, T: 3.5, LA: 10 },
    shaft: {
      "2P":   { D: 24, D_tol: "j6", E: 50, F: 8, GA: 27.0 },
      "4-8P": { D: 24, D_tol: "j6", E: 50, F: 8, GA: 27.0 }
    },
    series: "1LE10 / 1LE15"
  },
  // --- FRAME 100L ---
  {
    frame: "100L",
    powerKw: { 2: "3.0", 4: "2.2 - 3.0", 6: "1.5", 8: "0.75 - 1.1" },
    b3: { A: 160, B: 140, H: 100, H_tol: "-0.5", C: 63, K: 12, bolt: "M10" },
    b5: { flangeNo: "FF215", M: 215, N: 180, N_tol: "j6", P: 250, S: 15, T: 4.0, LA: 11 },
    shaft: {
      "2P":   { D: 28, D_tol: "j6", E: 60, F: 8, GA: 31.0 },
      "4-8P": { D: 28, D_tol: "j6", E: 60, F: 8, GA: 31.0 }
    },
    series: "1LE10 / 1LE15"
  },
  // --- FRAME 112M ---
  {
    frame: "112M",
    powerKw: { 2: "4.0", 4: "4.0", 6: "2.2", 8: "1.5" },
    b3: { A: 190, B: 140, H: 112, H_tol: "-0.5", C: 70, K: 12, bolt: "M10" },
    b5: { flangeNo: "FF215", M: 215, N: 180, N_tol: "j6", P: 250, S: 15, T: 4.0, LA: 11 },
    shaft: {
      "2P":   { D: 28, D_tol: "j6", E: 60, F: 8, GA: 31.0 },
      "4-8P": { D: 28, D_tol: "j6", E: 60, F: 8, GA: 31.0 }
    },
    series: "1LE10 / 1LE15"
  },
  // --- FRAME 132S ---
  {
    frame: "132S",
    powerKw: { 2: "5.5 - 7.5", 4: "5.5", 6: "3.0", 8: "2.2" },
    b3: { A: 216, B: 140, H: 132, H_tol: "-0.5", C: 89, K: 12, bolt: "M10" },
    b5: { flangeNo: "FF265", M: 265, N: 230, N_tol: "j6", P: 300, S: 15, T: 4.0, LA: 12 },
    shaft: {
      "2P":   { D: 38, D_tol: "k6", E: 80, F: 10, GA: 41.0 },
      "4-8P": { D: 38, D_tol: "k6", E: 80, F: 10, GA: 41.0 }
    },
    series: "1LE10 / 1LE15"
  },
  // --- FRAME 132M ---
  {
    frame: "132M",
    powerKw: { 2: "7.5", 4: "7.5", 6: "4.0 - 5.5", 8: "3.0" },
    b3: { A: 216, B: 178, H: 132, H_tol: "-0.5", C: 89, K: 12, bolt: "M10" },
    b5: { flangeNo: "FF265", M: 265, N: 230, N_tol: "j6", P: 300, S: 15, T: 4.0, LA: 12 },
    shaft: {
      "2P":   { D: 38, D_tol: "k6", E: 80, F: 10, GA: 41.0 },
      "4-8P": { D: 38, D_tol: "k6", E: 80, F: 10, GA: 41.0 }
    },
    series: "1LE10 / 1LE15"
  },
  // --- FRAME 160M ---
  {
    frame: "160M",
    powerKw: { 2: "11 - 15", 4: "11", 6: "7.5", 8: "4.0 - 5.5" },
    b3: { A: 254, B: 210, H: 160, H_tol: "-0.5", C: 108, K: 15, bolt: "M12" },
    b5: { flangeNo: "FF300", M: 300, N: 250, N_tol: "j6", P: 350, S: 19, T: 5.0, LA: 13 },
    shaft: {
      "2P":   { D: 42, D_tol: "k6", E: 110, F: 12, GA: 45.0 },
      "4-8P": { D: 42, D_tol: "k6", E: 110, F: 12, GA: 45.0 }
    },
    series: "1LE10 / 1LE15"
  },
  // --- FRAME 160L ---
  {
    frame: "160L",
    powerKw: { 2: "18.5", 4: "15", 6: "11", 8: "7.5" },
    b3: { A: 254, B: 254, H: 160, H_tol: "-0.5", C: 108, K: 15, bolt: "M12" },
    b5: { flangeNo: "FF300", M: 300, N: 250, N_tol: "j6", P: 350, S: 19, T: 5.0, LA: 13 },
    shaft: {
      "2P":   { D: 42, D_tol: "k6", E: 110, F: 12, GA: 45.0 },
      "4-8P": { D: 42, D_tol: "k6", E: 110, F: 12, GA: 45.0 }
    },
    series: "1LE10 / 1LE15"
  },
  // --- FRAME 180M ---
  {
    frame: "180M",
    powerKw: { 2: "22", 4: "18.5", 6: "-", 8: "-" },
    b3: { A: 279, B: 241, H: 180, H_tol: "-0.5", C: 121, K: 15, bolt: "M12" },
    b5: { flangeNo: "FF300", M: 300, N: 250, N_tol: "j6", P: 350, S: 19, T: 5.0, LA: 13 },
    shaft: {
      "2P":   { D: 48, D_tol: "k6", E: 110, F: 14, GA: 51.5 },
      "4-8P": { D: 48, D_tol: "k6", E: 110, F: 14, GA: 51.5 }
    },
    series: "1LE10 / 1LE15"
  },
  // --- FRAME 180L ---
  {
    frame: "180L",
    powerKw: { 2: "-", 4: "22", 6: "15", 8: "11" },
    b3: { A: 279, B: 279, H: 180, H_tol: "-0.5", C: 121, K: 15, bolt: "M12" },
    b5: { flangeNo: "FF300", M: 300, N: 250, N_tol: "j6", P: 350, S: 19, T: 5.0, LA: 13 },
    shaft: {
      "2P":   { D: 48, D_tol: "k6", E: 110, F: 14, GA: 51.5 },
      "4-8P": { D: 48, D_tol: "k6", E: 110, F: 14, GA: 51.5 }
    },
    series: "1LE10 / 1LE15"
  },
  // --- FRAME 200L ---
  {
    frame: "200L",
    powerKw: { 2: "30 - 37", 4: "30", 6: "18.5 - 22", 8: "15" },
    b3: { A: 318, B: 305, H: 200, H_tol: "-0.5", C: 133, K: 19, bolt: "M16" },
    b5: { flangeNo: "FF350", M: 350, N: 300, N_tol: "j6", P: 400, S: 19, T: 5.0, LA: 15 },
    shaft: {
      "2P":   { D: 55, D_tol: "m6", E: 110, F: 16, GA: 59.0 },
      "4-8P": { D: 55, D_tol: "m6", E: 110, F: 16, GA: 59.0 }
    },
    series: "1LE10 / 1LE15"
  },
  // --- FRAME 225S ---
  {
    frame: "225S",
    powerKw: { 2: "-", 4: "37", 6: "-", 8: "18.5" },
    b3: { A: 356, B: 286, H: 225, H_tol: "-0.5", C: 149, K: 19, bolt: "M16" },
    b5: { flangeNo: "FF400", M: 400, N: 350, N_tol: "j6", P: 450, S: 19, T: 5.0, LA: 16 },
    shaft: {
      "2P":   { D: 55, D_tol: "m6", E: 110, F: 16, GA: 59.0 },
      "4-8P": { D: 60, D_tol: "m6", E: 140, F: 18, GA: 64.0 }
    },
    series: "1LE15 / 1LE16"
  },
  // --- FRAME 225M ---
  {
    frame: "225M",
    powerKw: { 2: "45", 4: "45", 6: "30", 8: "22" },
    b3: { A: 356, B: 311, H: 225, H_tol: "-0.5", C: 149, K: 19, bolt: "M16" },
    b5: { flangeNo: "FF400", M: 400, N: 350, N_tol: "j6", P: 450, S: 19, T: 5.0, LA: 16 },
    shaft: {
      "2P":   { D: 55, D_tol: "m6", E: 110, F: 16, GA: 59.0 },
      "4-8P": { D: 60, D_tol: "m6", E: 140, F: 18, GA: 64.0 }
    },
    series: "1LE15 / 1LE16"
  },
  // --- FRAME 250M ---
  {
    frame: "250M",
    powerKw: { 2: "55", 4: "55", 6: "37", 8: "30" },
    b3: { A: 406, B: 349, H: 250, H_tol: "-0.5", C: 168, K: 24, bolt: "M20" },
    b5: { flangeNo: "FF500", M: 500, N: 450, N_tol: "j6", P: 550, S: 19, T: 5.0, LA: 18 },
    shaft: {
      "2P":   { D: 60, D_tol: "m6", E: 140, F: 18, GA: 64.0 },
      "4-8P": { D: 65, D_tol: "m6", E: 140, F: 18, GA: 69.0 }
    },
    series: "1LE15 / 1LE16"
  },
  // --- FRAME 280S ---
  {
    frame: "280S",
    powerKw: { 2: "75", 4: "75", 6: "45", 8: "37" },
    b3: { A: 457, B: 368, H: 280, H_tol: "-1.0", C: 190, K: 24, bolt: "M20" },
    b5: { flangeNo: "FF500", M: 500, N: 450, N_tol: "h6", P: 550, S: 19, T: 5.0, LA: 18 },
    shaft: {
      "2P":   { D: 65, D_tol: "m6", E: 140, F: 18, GA: 69.0 },
      "4-8P": { D: 75, D_tol: "m6", E: 140, F: 20, GA: 79.5 }
    },
    series: "1LE15 / 1LE16"
  },
  // --- FRAME 280M ---
  {
    frame: "280M",
    powerKw: { 2: "90", 4: "90", 6: "55", 8: "45" },
    b3: { A: 457, B: 419, H: 280, H_tol: "-1.0", C: 190, K: 24, bolt: "M20" },
    b5: { flangeNo: "FF500", M: 500, N: 450, N_tol: "h6", P: 550, S: 19, T: 5.0, LA: 18 },
    shaft: {
      "2P":   { D: 65, D_tol: "m6", E: 140, F: 18, GA: 69.0 },
      "4-8P": { D: 75, D_tol: "m6", E: 140, F: 20, GA: 79.5 }
    },
    series: "1LE15 / 1LE16"
  },
  // --- FRAME 315S ---
  {
    frame: "315S",
    powerKw: { 2: "110", 4: "110", 6: "75", 8: "55" },
    b3: { A: 508, B: 406, H: 315, H_tol: "-1.0", C: 216, K: 28, bolt: "M24" },
    b5: { flangeNo: "FF600", M: 600, N: 550, N_tol: "h6", P: 660, S: 24, T: 6.0, LA: 22 },
    shaft: {
      "2P":   { D: 65, D_tol: "m6", E: 140, F: 18, GA: 69.0 },
      "4-8P": { D: 80, D_tol: "m6", E: 170, F: 22, GA: 85.0 }
    },
    series: "1LE15 / 1LE55"
  },
  // --- FRAME 315M ---
  {
    frame: "315M",
    powerKw: { 2: "132", 4: "132", 6: "90", 8: "75" },
    b3: { A: 508, B: 457, H: 315, H_tol: "-1.0", C: 216, K: 28, bolt: "M24" },
    b5: { flangeNo: "FF600", M: 600, N: 550, N_tol: "h6", P: 660, S: 24, T: 6.0, LA: 22 },
    shaft: {
      "2P":   { D: 65, D_tol: "m6", E: 140, F: 18, GA: 69.0 },
      "4-8P": { D: 80, D_tol: "m6", E: 170, F: 22, GA: 85.0 }
    },
    series: "1LE15 / 1LE55"
  },
  // --- FRAME 315L ---
  {
    frame: "315L",
    powerKw: { 2: "160 - 200", 4: "160 - 200", 6: "110 - 132", 8: "90 - 110" },
    b3: { A: 508, B: 508, H: 315, H_tol: "-1.0", C: 216, K: 28, bolt: "M24" },
    b5: { flangeNo: "FF600", M: 600, N: 550, N_tol: "h6", P: 660, S: 24, T: 6.0, LA: 22 },
    shaft: {
      "2P":   { D: 65, D_tol: "m6", E: 140, F: 18, GA: 69.0 },
      "4-8P": { D: 80, D_tol: "m6", E: 170, F: 22, GA: 85.0 }
    },
    series: "1LE15 / 1LE55"
  },
  // --- FRAME 355S ---
  {
    frame: "355S",
    powerKw: { 2: "250", 4: "250", 6: "160", 8: "132" },
    b3: { A: 610, B: 500, H: 355, H_tol: "-1.0", C: 254, K: 28, bolt: "M24" },
    b5: { flangeNo: "FF740", M: 740, N: 680, N_tol: "h6", P: 800, S: 24, T: 6.0, LA: 25 },
    shaft: {
      "2P":   { D: 75, D_tol: "m6", E: 140, F: 20, GA: 79.5 },
      "4-8P": { D: 100, D_tol: "m6", E: 210, F: 28, GA: 106.0 }
    },
    series: "1LE55 (Innomotics)"
  },
  // --- FRAME 355M ---
  {
    frame: "355M",
    powerKw: { 2: "280 - 315", 4: "280 - 315", 6: "200", 8: "160" },
    b3: { A: 610, B: 560, H: 355, H_tol: "-1.0", C: 254, K: 28, bolt: "M24" },
    b5: { flangeNo: "FF740", M: 740, N: 680, N_tol: "h6", P: 800, S: 24, T: 6.0, LA: 25 },
    shaft: {
      "2P":   { D: 75, D_tol: "m6", E: 140, F: 20, GA: 79.5 },
      "4-8P": { D: 100, D_tol: "m6", E: 210, F: 28, GA: 106.0 }
    },
    series: "1LE55 (Innomotics)"
  },
  // --- FRAME 355L ---
  {
    frame: "355L",
    powerKw: { 2: "355", 4: "355 - 400", 6: "250 - 315", 8: "200 - 250" },
    b3: { A: 610, B: 630, H: 355, H_tol: "-1.0", C: 254, K: 28, bolt: "M24" },
    b5: { flangeNo: "FF740", M: 740, N: 680, N_tol: "h6", P: 800, S: 24, T: 6.0, LA: 25 },
    shaft: {
      "2P":   { D: 75, D_tol: "m6", E: 140, F: 20, GA: 79.5 },
      "4-8P": { D: 100, D_tol: "m6", E: 210, F: 28, GA: 106.0 }
    },
    series: "1LE55 (Innomotics)"
  },
  // --- FRAME 400M ---
  {
    frame: "400M",
    powerKw: { 2: "450 - 500", 4: "450 - 500", 6: "355 - 400", 8: "280 - 315" },
    b3: { A: 686, B: 630, H: 400, H_tol: "-1.0", C: 280, K: 35, bolt: "M30" },
    b5: { flangeNo: "FF940", M: 940, N: 880, N_tol: "h6", P: 1000, S: 28, T: 6.0, LA: 28 },
    shaft: {
      "2P":   { D: 80, D_tol: "m6", E: 170, F: 22, GA: 85.0 },
      "4-8P": { D: 110, D_tol: "m6", E: 210, F: 28, GA: 116.0 }
    },
    series: "1LE55 (Innomotics)"
  },
  // --- FRAME 400L ---
  {
    frame: "400L",
    powerKw: { 2: "560 - 630", 4: "560 - 630", 6: "450 - 500", 8: "355 - 400" },
    b3: { A: 686, B: 710, H: 400, H_tol: "-1.0", C: 280, K: 35, bolt: "M30" },
    b5: { flangeNo: "FF940", M: 940, N: 880, N_tol: "h6", P: 1000, S: 28, T: 6.0, LA: 28 },
    shaft: {
      "2P":   { D: 80, D_tol: "m6", E: 170, F: 22, GA: 85.0 },
      "4-8P": { D: 110, D_tol: "m6", E: 210, F: 28, GA: 116.0 }
    },
    series: "1LE55 (Innomotics)"
  },
  // --- FRAME 450M ---
  {
    frame: "450M",
    powerKw: { 2: "710", 4: "710 - 800", 6: "560 - 630", 8: "450 - 500" },
    b3: { A: 750, B: 800, H: 450, H_tol: "-1.0", C: 315, K: 35, bolt: "M30" },
    b5: { flangeNo: "FF1080", M: 1080, N: 1000, N_tol: "h6", P: 1150, S: 28, T: 6.0, LA: 30 },
    shaft: {
      "2P":   { D: 90, D_tol: "m6", E: 170, F: 25, GA: 95.0 },
      "4-8P": { D: 120, D_tol: "m6", E: 210, F: 32, GA: 127.0 }
    },
    series: "1LE55 (Innomotics)"
  },
  // --- FRAME 450L ---
  {
    frame: "450L",
    powerKw: { 2: "800 - 1000", 4: "900 - 1000", 6: "710 - 800", 8: "560 - 630" },
    b3: { A: 750, B: 900, H: 450, H_tol: "-1.0", C: 315, K: 35, bolt: "M30" },
    b5: { flangeNo: "FF1080", M: 1080, N: 1000, N_tol: "h6", P: 1150, S: 28, T: 6.0, LA: 30 },
    shaft: {
      "2P":   { D: 90, D_tol: "m6", E: 170, F: 25, GA: 95.0 },
      "4-8P": { D: 120, D_tol: "m6", E: 210, F: 32, GA: 127.0 }
    },
    series: "1LE55 (Innomotics)"
  }
];

export const getMotorByFrame = (frame) => {
  return IEC_MOTOR_DATABASE.find((m) => m.frame.toUpperCase() === frame?.toUpperCase());
};

export const findFramesByPower = (powerValue, pole = 4) => {
  if (!powerValue) return [];
  const numVal = parseFloat(powerValue);
  return IEC_MOTOR_DATABASE.filter((m) => {
    const pStr = m.powerKw[pole];
    if (!pStr || pStr === "-") return false;
    if (pStr.includes("-")) {
      const parts = pStr.split("-").map((s) => parseFloat(s.trim()));
      return !isNaN(numVal) && numVal >= parts[0] && numVal <= parts[1];
    }
    return !isNaN(numVal) && Math.abs(parseFloat(pStr) - numVal) < 0.01;
  });
};
