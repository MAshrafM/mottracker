// server/controllers/motorController.js

const Motor = require('../models/motorModel');
const { createNotification } = require('./notificationController');

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
    const motor = await Motor.findById(req.params.id).populate('assignmentHistory.equipment');
    if (!motor) {
      return res.status(404).json({ success: false, message: 'Motor not found' });
    }
    res.status(200).json({ success: true, data: motor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getMotorWithEquipment = async (req, res) => {
  try {
    const motor = await Motor.find()
      .populate('eq');
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

// @desc    Create multiple motors
// @route   POST /api/motors/bulk
// @access  Private/Admin
exports.createBulkMotors = async (req, res) => {
  try {
    const { serialNumbers, ...commonDetails } = req.body;

    if (!serialNumbers || !Array.isArray(serialNumbers) || serialNumbers.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of serial numbers.' });
    }

    // Create array of motor objects
    const motorsToCreate = serialNumbers.map(serial => ({
      ...commonDetails,
      serialNumber: serial
    }));

    let createdMotors = [];
    let errors = [];

    try {
      createdMotors = await Motor.insertMany(motorsToCreate, { ordered: false });
    } catch (e) {
      if (e.insertedDocs) {
        createdMotors = e.insertedDocs;
      }
      if (e.writeErrors) {
        errors = e.writeErrors.map(err => ({
          index: err.index,
          code: err.code,
          errmsg: err.errmsg,
          serial: motorsToCreate[err.index].serialNumber
        }));
      }
    }

    if (createdMotors.length > 0) {
      // Notify all clients (system wide)
      await createNotification(req.app.get('socketio'), {
        type: 'success',
        message: `Bulk Create: ${createdMotors.length} motors added.`,
        relatedId: createdMotors[0]._id
      });
    }

    const response = {
      success: true,
      count: createdMotors.length,
      data: createdMotors,
      errors: errors.length > 0 ? errors : undefined,
      message: errors.length > 0
        ? `Created ${createdMotors.length} motors. ${errors.length} failed (likely duplicates).`
        : `Successfully created ${createdMotors.length} motors.`
    };

    if (createdMotors.length === 0 && errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Failed to create any motors. All serial numbers might be duplicates.',
        errors
      });
    }

    res.status(201).json(response);

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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


    // Notify all clients
    await createNotification(req.app.get('socketio'), {
      type: 'info',
      message: `Motor Updated: ${motor.serialNumber}`,
      relatedId: motor._id
    });

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


    // Notify all clients
    await createNotification(req.app.get('socketio'), {
      type: 'warning',
      message: `Motor Deleted: ${motor.serialNumber}`,
      relatedId: motor._id
    });

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update last greasing date to now
// @route   POST /api/motors/:id/grease
// @access  Private/Manager or Admin
exports.updateLastGreasingDate = async (req, res) => {
  try {
    const motor = await Motor.findByIdAndUpdate(req.params.id, {
      lastGreasingDate: new Date()
    }, {
      new: true
    });

    if (!motor) {
      return res.status(404).json({ success: false, message: 'Motor not found' });
    }

    // Notify all clients (optional but good)
    await createNotification(req.app.get('socketio'), {
      type: 'info',
      message: `Motor Greased: ${motor.serialNumber}`,
      relatedId: motor._id
    });

    res.status(200).json({ success: true, data: motor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
