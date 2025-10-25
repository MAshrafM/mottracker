// server/models/plantEquipmentModel.js

const mongoose = require('mongoose');
const { Schema } = mongoose;

const MotorHistorySchema = new Schema({
  motor: {
    type: Schema.Types.ObjectId,
    ref: 'Motor',
    required: true,
  },
  dateAssigned: {
    type: Date,
    default: Date.now,
  },
  dateRemoved: {
    type: Date,
  },
});


const PlantEquipmentSchema = new Schema({
  tonNumber: {
    type: String,
    required: [true, 'Please add a TON number'],
    unique: true,
    trim: true,
  },
  designation: {
    type: String,
    required: [true, 'Please add a designation'],
  },
  // This creates a relationship between this schema and the Motor schema
  currentMotor: {
    type: Schema.Types.ObjectId,
    ref: 'Motor', // The 'ref' tells Mongoose which model to use during population
    default: null,
  },
  plant: {
    type: String,
    required: [true, 'Please add a plant name'],
    },
  // A log of all motors ever installed on this equipment
  motorHistory: [MotorHistorySchema],
}, {
  timestamps: true
});

module.exports = mongoose.model('PlantEquipment', PlantEquipmentSchema);
