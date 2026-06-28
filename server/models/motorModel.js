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

const AssignmentHistorySchema = new Schema({
  equipment: {
    type: Schema.Types.ObjectId,
    ref: 'PlantEquipment',
  },
  ton: { type: String },
  plant: { type: String },
  dateInstalled: { type: Date },
  dateRemoved: { type: Date }
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
  meanTimeBetweenMaintenance: { type: Number }, // Mean time between maintenance in days
  lastGreasingDate: { type: Date },
  Warehouse: { type: String },
  SAP: { type: String }, // SAP ID
  Note: { type: String },
  maintenanceHistory: [MaintenanceEventSchema],
  assignmentHistory: [AssignmentHistorySchema],
  status: {
    type: String,
    enum: ['active', 'spare', 'out of service'],
    default: 'spare',
    required: true,
  },
  qrToken: {
    type: String,
    unique: true,
    sparse: true,
  },
}, {
  timestamps: true,
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
});


MotorSchema.virtual('eq', {
  ref: 'PlantEquipment',
  localField: '_id',
  foreignField: 'currentMotor',
  justOne: true
});

// Pre-save hook to calculate meanTimeBetweenMaintenance and generate qrToken
MotorSchema.pre('save', function (next) {
  // Generate unique qrToken if not present
  if (!this.qrToken) {
    const crypto = require('crypto');
    this.qrToken = crypto.randomBytes(16).toString('hex');
  }
  if (!this.isModified('meanTimeBetweenMaintenance') && (this.isModified('maintenanceHistory') || this.meanTimeBetweenMaintenance === undefined)) {
    const completeEvents = this.maintenanceHistory
      .filter(event => {
        const desc = (event.description || '').toLowerCase();
        const hasText = desc.includes('compelet maintainance') ||
                        desc.includes('complete maintenance') ||
                        desc.includes('complete maint') ||
                        desc.includes('motor complete maint');
        return hasText && event.date && !isNaN(new Date(event.date).getTime());
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (completeEvents.length >= 2) {
      const latest = completeEvents[completeEvents.length - 1];
      const secondLatest = completeEvents[completeEvents.length - 2];
      const diffTime = Math.abs(new Date(latest.date) - new Date(secondLatest.date));
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      this.meanTimeBetweenMaintenance = diffDays;
    } else {
      this.meanTimeBetweenMaintenance = null;
    }
  }
  next();
});

module.exports = mongoose.model('Motor', MotorSchema);
