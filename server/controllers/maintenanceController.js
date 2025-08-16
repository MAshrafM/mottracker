// server/controllers/maintenanceController.js

const Motor = require('../models/motorModel');

// @desc    Get all maintenance events for a motor
// @route   GET /api/motors/:motorId/maintenance
// @access  Private

exports.getMaintenanceEvents = async (req, res) => {
  try {
    const motor = await Motor.findById(req.params.motorId);
    if (!motor) {
      return res.status(404).json({ success: false, message: 'Motor not found' });
    }
    res.status(200).json({ success: true, data: motor.maintenanceHistory });
  }
    catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Add a maintenance event to a motor
// @route   POST /api/motors/:motorId/maintenance
// @access  Private/Manager or Admin
exports.addMaintenanceEvent = async (req, res) => {
  try {
    const { date, description } = req.body;
    if (!date || !description) {
      return res.status(400).json({ success: false, message: 'Please provide a date and description.' });
    }

    const motor = await Motor.findById(req.params.motorId);

    if (!motor) {
      return res.status(404).json({ success: false, message: 'Motor not found' });
    }

    const newEvent = {
      date,
      description,
    };

    // Add to the beginning of the array so newest events are first
    motor.maintenanceHistory.unshift(newEvent);
    
    // Also update the last maintenance date on the motor
    motor.lastMaintenanceDate = date;

    await motor.save();

    res.status(201).json({ success: true, data: motor });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update a maintenance event
// @route   PUT /api/motors/:motorId/maintenance/:eventId
// @access  Private/Manager or Admin
exports.updateMaintenanceEvent = async (req, res) => {
  try {
    const { date, description } = req.body;
    const motor = await Motor.findById(req.params.motorId);

    if (!motor) {
      return res.status(404).json({ success: false, message: 'Motor not found' });
    }

    // Find the specific maintenance event in the array
    const event = motor.maintenanceHistory.id(req.params.eventId);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Maintenance event not found' });
    }

    // Update the fields
    event.date = date || event.date;
    event.description = description || event.description;

    await motor.save();

    res.status(200).json({ success: true, data: motor });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


// @desc    Delete a maintenance event from a motor
// @route   DELETE /api/motors/:motorId/maintenance/:eventId
// @access  Private/Admin
exports.deleteMaintenanceEvent = async (req, res) => {
  try {
    const motor = await Motor.findById(req.params.motorId);

    if (!motor) {
      return res.status(404).json({ success: false, message: 'Motor not found' });
    }

    // Find the specific maintenance event
    const event = motor.maintenanceHistory.id(req.params.eventId);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Maintenance event not found' });
    }

    // Remove the event from the array
    await event.deleteOne();

    await motor.save();

    res.status(200).json({ success: true, data: motor });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
