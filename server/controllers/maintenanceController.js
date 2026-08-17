// server/controllers/maintenanceController.js

const Motor = require('../models/motorModel');
const { createNotification } = require('./notificationController');

// @desc    Get all maintenance events for a motor
// @route   GET /api/motors/:motorId/maintenance
// @access  Private

exports.getMaintenanceEvents = async (req, res) => {
  try {
    const motor = await Motor.findById(req.params.motorId).select('maintenanceHistory').lean();
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
    const { date, description, updateLastMaintenance } = req.body;
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

    // Only update the last maintenance date on the motor if the flag is true
    if (updateLastMaintenance) {
      const { calculateMTBMFromEvents } = require('../utils/helpers');
      const { mtbm } = calculateMTBMFromEvents(motor.maintenanceHistory || []);
      motor.meanTimeBetweenMaintenance = mtbm;
      motor.lastMaintenanceDate = date;
    }

    await motor.save();


    // Notify all clients
    await createNotification(req.app.get('socketio'), {
      type: 'info',
      message: `Maintenance Added: ${motor.serialNumber} - ${description}`,
      relatedId: motor._id
    });

    res.status(201).json({ success: true, data: motor });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Add multiple maintenance events to a motor
// @route   POST /api/motors/:motorId/maintenance/bulk
// @access  Private/Admin
exports.addBulkMaintenanceEvents = async (req, res) => {
  try {
    const { events } = req.body; // Expecting an array of { date, description }

    if (!events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of events.' });
    }

    const motor = await Motor.findById(req.params.motorId);

    if (!motor) {
      return res.status(404).json({ success: false, message: 'Motor not found' });
    }

    let addedCount = 0;
    let latestDate = motor.lastMaintenanceDate ? new Date(motor.lastMaintenanceDate) : new Date(0);

    // Process events
    // We reverse the events array if we want to maintain the order from the text parser which usually parses top-down (oldest first?) 
    // BUT the user parser output seems to be chronological or we should just trust the user provided order.
    // The existing addMaintenanceEvent unshifts (adds to top). 
    // If the input array is chronological (oldest to newest), and we unshift, we'll get newest at top (desired).
    // Let's assume the user sends them in the order they want them processed.

    // Actually, let's just push them all and then sort the array in memory if needed, 
    // OR just rely on the client to send them in the right order/sorting.
    // The current UI sorts by date desc: .sort((a, b) => new Date(b.date) - new Date(a.date))
    // So order in array doesn't matter for display, but it matters for "lastMaintenanceDate".

    for (const event of events) {
      if (event.date && event.description) {
        motor.maintenanceHistory.push({
          date: event.date,
          description: event.description
        });
        addedCount++;

        const eventDate = new Date(event.date);
        if (eventDate > latestDate) {
          latestDate = eventDate;
        }
      }
    }

    if (addedCount === 0) {
      return res.status(400).json({ success: false, message: 'No valid events to add.' });
    }

    motor.lastMaintenanceDate = latestDate;

    // Sort history by date descending to keep it tidy in DB (optional but good)
    motor.maintenanceHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

    await motor.save();

    // Notify all clients
    await createNotification(req.app.get('socketio'), {
      type: 'success',
      message: `Bulk Maintenance Added: ${addedCount} events for ${motor.serialNumber}`,
      relatedId: motor._id
    });

    res.status(201).json({ success: true, data: motor, count: addedCount });

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


    // Notify all clients
    await createNotification(req.app.get('socketio'), {
      type: 'info',
      message: `Maintenance Updated: ${motor.serialNumber}`,
      relatedId: motor._id
    });

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


    // Notify all clients
    await createNotification(req.app.get('socketio'), {
      type: 'warning',
      message: `Maintenance Deleted for Motor: ${motor.serialNumber}`,
      relatedId: motor._id
    });

    res.status(200).json({ success: true, data: motor });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
