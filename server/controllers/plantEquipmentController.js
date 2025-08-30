// server/controllers/plantEquipmentController.js

const PlantEquipment = require('../models/plantEquipmentModel');
const Motor = require('../models/motorModel');

// @desc    Get all plant equipment
// @route   GET /api/equipment
// @access  Private
exports.getEquipments = async (req, res) => {
  try {
    // Populate both the current motor and the history
    const equipments = await PlantEquipment.find()
      .populate('currentMotor', 'serialNumber manufacturer type')
      .populate('motorHistory.motor', 'serialNumber manufacturer type');
    res.status(200).json({ success: true, count: equipments.length, data: equipments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create a new piece of plant equipment
// @route   POST /api/equipment
// @access  Private/Admin
exports.createEquipment = async (req, res) => {
  try {
    const equipment = await PlantEquipment.create(req.body);
    res.status(201).json({ success: true, data: equipment });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Update a piece of equipment's details (designation, etc.)
// @route   PUT /api/equipment/:id
// @access  Private/Admin or Manager
exports.updateEquipment = async (req, res) => {
  try {
    const equipment = await PlantEquipment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }
    res.status(200).json({ success: true, data: equipment });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Delete a piece of equipment
// @route   DELETE /api/equipment/:id
// @access  Private/Admin
exports.deleteEquipment = async (req, res) => {
  try {
    const equipment = await PlantEquipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }
    // Business rule: Cannot delete equipment if a motor is currently installed
    if (equipment.currentMotor) {
      return res.status(400).json({ success: false, message: 'Cannot delete equipment with an active motor. Please remove it first.' });
    }
    await equipment.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Assign a motor to a piece of equipment
// @route   POST /api/equipment/:id/assign-motor
// @access  Private/Admin or Manager
exports.assignMotor = async (req, res) => {
  try {
    const { motorId } = req.body;
    const equipment = await PlantEquipment.findById(req.params.id);
    const newMotor = await Motor.findById(motorId);

    // Validations
    if (!equipment) return res.status(404).json({ success: false, message: 'Equipment not found' });
    if (!newMotor) return res.status(404).json({ success: false, message: 'Motor not found' });
    if (newMotor.status !== 'spare') return res.status(400).json({ success: false, message: 'Motor is not a spare.' });

    // --- The Core Logic ---
    // 1. If there's an old motor, set it to 'spare' and update its history record
    if (equipment.currentMotor) {
      await Motor.findByIdAndUpdate(equipment.currentMotor, { status: 'spare' });
      const historyEntry = equipment.motorHistory.find(h => h.motor.equals(equipment.currentMotor) && !h.dateRemoved);
      if (historyEntry) {
        historyEntry.dateRemoved = new Date();
      }
    }

    // 2. Set the new motor to 'active'
    newMotor.status = 'active';
    await newMotor.save();

    // 3. Update the equipment's current motor
    equipment.currentMotor = newMotor._id;

    // 4. Add the new motor to the history
    equipment.motorHistory.push({ motor: newMotor._id });

    await equipment.save();
    
    // Populate the response to send back full data
    const updatedEquipment = await PlantEquipment.findById(req.params.id)
      .populate('currentMotor', 'serialNumber manufacturer type')
      .populate('motorHistory.motor', 'serialNumber manufacturer type');

    res.status(200).json({ success: true, data: updatedEquipment });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc  Get current motor
exports.activeMotor = async(req, res) => {
  try{
    const equipment = await PlantEquipment.findOne({currentMotor: req.params.motorId}).select('tonNumber designation plant')
    if (!equipment) return res.status(404).json({ success: false, message: 'Equipment not found' });
    res.status(200).json({ success: true, data: equipment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};