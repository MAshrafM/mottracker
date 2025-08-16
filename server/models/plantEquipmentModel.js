// server/models/plantEquipmentModel.js

const mongoose = require('mongoose');
const { Schema } = mongoose;

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
  motor: {
    type: Schema.Types.ObjectId,
    ref: 'Motor', // The 'ref' tells Mongoose which model to use during population
    default: null,
  },
  plant: {
    type: String,
    required: [true, 'Please add a plant name'],
    },
}, {
  timestamps: true
});

module.exports = mongoose.model('PlantEquipment', PlantEquipmentSchema);
