// server/controllers/motorController.js

const Motor = require('../models/motorModel');

// @desc    Get all motors
// @route   GET /api/motors
// @access  Private
exports.getMotors = async (req, res) => {
  try {
    const motors = await Motor.find();
    res.status(200).json({ success: true, count: motors.length, data: motors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get a single motor
// @route   GET /api/motors/:id
// @access  Private
exports.getMotor = async (req, res) => {
  try {
    const motor = await Motor.findById(req.params.id);
    if (!motor) {
      return res.status(404).json({ success: false, message: 'Motor not found' });
    }
    res.status(200).json({ success: true, data: motor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create a new motor
// @route   POST /api/motors
// @access  Private/Admin
exports.createMotor = async (req, res) => {
  try {
    const motor = await Motor.create(req.body);
    res.status(201).json({ success: true, data: motor });
  } catch (error) {
    // Handle duplicate serial number error
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'A motor with this serial number already exists.' });
    }
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Update a motor
// @route   PUT /api/motors/:id
// @access  Private/Manager or Admin
exports.updateMotor = async (req, res) => {
  try {
    const motor = await Motor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!motor) {
      return res.status(404).json({ success: false, message: 'Motor not found' });
    }
    res.status(200).json({ success: true, data: motor });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Delete a motor
// @route   DELETE /api/motors/:id
// @access  Private/Admin
exports.deleteMotor = async (req, res) => {
  try {
    const motor = await Motor.findById(req.params.id);
    if (!motor) {
      return res.status(404).json({ success: false, message: 'Motor not found' });
    }
    // Add a check: cannot delete a motor if it is 'active' (installed on equipment)
    if (motor.status === 'active') {
        return res.status(400).json({ success: false, message: 'Cannot delete an active motor. Please mark it as spare first.' });
    }
    await motor.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
