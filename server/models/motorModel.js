// server/models/motorModel.js

const mongoose = require('mongoose');
const { Schema } = mongoose;

// A sub-document schema for maintenance events
const MaintenanceEventSchema = new Schema({
  date: {
    type: Date,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
});

const MotorSchema = new Schema({
  serialNumber: {
    type: String,
    required: [true, 'Please add a serial number'],
    unique: true,
    trim: true,
  },
  type: { type: String },
  power: { type: String }, // e.g., "10 HP"
  current: { type: String }, // e.g., "15 A"
  speed: { type: Number }, // e.g., 1800 RPM
  IM: { type: String }, // Insulation Monitoring
  frameSize: { type: String },
  manufacturer: { type: String },
  bearingNDE: { type: String }, // Non-Drive End
  bearingDE: { type: String }, // Drive End
  lastMaintenanceDate: { type: Date },
  Warehouse: { type: String },
  SAP: { type: String }, // SAP ID
  Note: { type: String },
  maintenanceHistory: [MaintenanceEventSchema],
  status: {
    type: String,
    enum: ['active', 'spare', 'out of service'],
    default: 'spare',
    required: true,
  },
}, {
  timestamps: true
});

module.exports = mongoose.model('Motor', MotorSchema);
