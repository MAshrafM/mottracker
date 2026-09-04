// server/controllers/motorController.js

const Motor = require('../models/motorModel');
const PlantEquipment = require('../models/plantEquipmentModel');
const { createNotification } = require('./notificationController');
const { calculateMTBMFromEvents } = require('../utils/helpers');

// @desc    Get all motors
// @route   GET /api/motors
// @access  Private
exports.getMotors = async (req, res) => {
  try {
    const motors = await Motor.find()
      .select('-maintenanceHistory -assignmentHistory')
      .lean();
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
    const motor = await Motor.findById(req.params.id)
      .populate('assignmentHistory.equipment')
      .lean();
    if (!motor) {
      return res.status(404).json({ success: false, message: 'Motor not found' });
    }
    res.status(200).json({ success: true, data: motor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all motors with equipment details (optimized via aggregation)
// @route   GET /api/motors/with-equipment
// @access  Private
exports.getMotorWithEquipment = async (req, res) => {
  try {
    // Auto-reconciliation: self-heal any orphan motors marked 'active' without an equipment assignment
    try {
      const activeEquipments = await PlantEquipment.find({ currentMotor: { $ne: null } }).select('currentMotor').lean();
      const activeMotorIds = activeEquipments.map(eq => eq.currentMotor.toString());

      const orphanActiveMotors = await Motor.find({
        status: 'active',
        _id: { $nin: activeMotorIds }
      });

      if (orphanActiveMotors.length > 0) {
        const now = new Date();
        for (const orphan of orphanActiveMotors) {
          orphan.status = 'out of service';
          if (orphan.assignmentHistory && orphan.assignmentHistory.length > 0) {
            orphan.assignmentHistory.forEach(h => {
              if (!h.dateRemoved) {
                h.dateRemoved = now;
                if (!h.dateInstalled) h.dateInstalled = orphan.createdAt || now;
              }
            });
          }
          await orphan.save();
        }
      }
    } catch (reconcileErr) {
      console.warn('Auto-reconciliation warning in getMotorWithEquipment:', reconcileErr.message);
    }

    const motors = await Motor.aggregate([
      {
        $project: {
          maintenanceHistory: 0,
          assignmentHistory: 0
        }
      },
      {
        $lookup: {
          from: 'plantequipments',
          localField: '_id',
          foreignField: 'currentMotor',
          pipeline: [
            {
              $project: {
                tonNumber: 1,
                designation: 1,
                plant: 1
              }
            }
          ],
          as: 'eq'
        }
      },
      {
        $addFields: {
          eq: { $arrayElemAt: ['$eq', 0] }
        }
      }
    ]);
    res.status(200).json({ success: true, data: motors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


// @desc    Create a new motor
// @route   POST /api/motors
// @access  Private/Admin
exports.createMotor = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.speed === '') data.speed = null;
    if (data.lastMaintenanceDate === '') data.lastMaintenanceDate = null;
    // New motors cannot be 'active' upon creation without equipment assignment
    if (data.status === 'active') {
      data.status = 'spare';
    }
    const motor = await Motor.create(data);
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

    if (commonDetails.status === 'active') {
      commonDetails.status = 'spare';
    }

    // Create array of motor objects
    const crypto = require('crypto');
    const motorsToCreate = serialNumbers.map(serial => {
      const data = {
        ...commonDetails,
        serialNumber: serial,
        qrToken: crypto.randomBytes(16).toString('hex')
      };
      if (data.speed === '') data.speed = null;
      if (data.lastMaintenanceDate === '') data.lastMaintenanceDate = null;
      return data;
    });

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
    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.__v;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.eq;
    delete updateData.maintenanceHistory;
    delete updateData.assignmentHistory;

    if (updateData.speed === '') updateData.speed = null;
    if (updateData.lastMaintenanceDate === '') updateData.lastMaintenanceDate = null;
    if (updateData.meanTimeBetweenMaintenance === '') updateData.meanTimeBetweenMaintenance = null;

    const motor = await Motor.findById(req.params.id);
    if (!motor) {
      return res.status(404).json({ success: false, message: 'Motor not found' });
    }

    const now = new Date();

    // If status is being changed to 'spare' or 'out of service', ensure it is removed from any equipment
    if (updateData.status === 'spare' || updateData.status === 'out of service') {
      const linkedEquipments = await PlantEquipment.find({ currentMotor: motor._id });
      for (const eq of linkedEquipments) {
        eq.currentMotor = null;
        eq.motorHistory.forEach(h => {
          if (h.motor && h.motor.toString() === motor._id.toString() && !h.dateRemoved) {
            h.dateRemoved = now;
          }
        });
        await eq.save();
      }

      if (motor.assignmentHistory && motor.assignmentHistory.length > 0) {
        motor.assignmentHistory.forEach(h => {
          if (!h.dateRemoved) {
            h.dateRemoved = now;
            if (!h.dateInstalled) h.dateInstalled = motor.createdAt || now;
          }
        });
      }
    }

    // Apply standard updates
    Object.assign(motor, updateData);

    // Handle dateAssigned (dateInstalled), dateRemoved, and TON if provided
    const hasDateAssigned = req.body.dateAssigned !== undefined || req.body.dateInstalled !== undefined;
    const hasDateRemoved = req.body.dateRemoved !== undefined;
    const tonVal = req.body.tonNumber !== undefined ? req.body.tonNumber : req.body.ton;

    if (hasDateAssigned || hasDateRemoved || (tonVal && typeof tonVal === 'string' && tonVal.trim())) {
      const assignedVal = req.body.dateAssigned !== undefined ? req.body.dateAssigned : req.body.dateInstalled;
      const removedVal = req.body.dateRemoved;

      let equipment = null;
      if (tonVal && typeof tonVal === 'string' && tonVal.trim()) {
        equipment = await PlantEquipment.findOne({ tonNumber: tonVal.trim() });
      }

      // If removedVal is specified, status should transition to 'out of service'
      if (removedVal) {
        motor.status = 'out of service';
      } else if (equipment && !motor.status) {
        motor.status = 'active';
      }

      // Find active or latest assignment in motor.assignmentHistory
      let activeAssignment = motor.assignmentHistory.find(h => !h.dateRemoved);
      if (!activeAssignment && motor.assignmentHistory.length > 0) {
        activeAssignment = motor.assignmentHistory[motor.assignmentHistory.length - 1];
      }

      if (activeAssignment) {
        if (hasDateAssigned) {
          activeAssignment.dateInstalled = assignedVal ? new Date(assignedVal) : null;
        }
        if (hasDateRemoved) {
          activeAssignment.dateRemoved = removedVal ? new Date(removedVal) : null;
        }
        if (equipment) {
          activeAssignment.equipment = equipment._id;
          activeAssignment.ton = equipment.tonNumber;
          activeAssignment.plant = equipment.plant || activeAssignment.plant;
        } else if (tonVal && typeof tonVal === 'string' && tonVal.trim()) {
          activeAssignment.ton = tonVal.trim();
        }
      } else if (hasDateAssigned || hasDateRemoved || (tonVal && typeof tonVal === 'string' && tonVal.trim())) {
        motor.assignmentHistory.push({
          equipment: equipment ? equipment._id : undefined,
          ton: equipment ? equipment.tonNumber : (tonVal && typeof tonVal === 'string' ? tonVal.trim() : undefined),
          plant: equipment ? equipment.plant : undefined,
          dateInstalled: assignedVal ? new Date(assignedVal) : now,
          dateRemoved: removedVal ? new Date(removedVal) : null
        });
      }

      // Synchronize with PlantEquipment if assigned
      try {
        if (!equipment) {
          equipment = await PlantEquipment.findOne({
            $or: [
              { currentMotor: motor._id },
              { 'motorHistory.motor': motor._id }
            ]
          });
        }

        if (equipment) {
          let eqHistory = equipment.motorHistory.find(h => h.motor && h.motor.toString() === motor._id.toString() && !h.dateRemoved);
          if (!eqHistory) {
            const matches = equipment.motorHistory.filter(h => h.motor && h.motor.toString() === motor._id.toString());
            if (matches.length > 0) {
              eqHistory = matches[matches.length - 1];
            }
          }

          if (eqHistory) {
            if (hasDateAssigned) {
              eqHistory.dateAssigned = assignedVal ? new Date(assignedVal) : eqHistory.dateAssigned;
            }
            if (hasDateRemoved) {
              eqHistory.dateRemoved = removedVal ? new Date(removedVal) : null;
            }
          } else {
            equipment.motorHistory.push({
              motor: motor._id,
              dateAssigned: assignedVal ? new Date(assignedVal) : now,
              dateRemoved: removedVal ? new Date(removedVal) : null
            });
          }

          if (!removedVal) {
            // If equipment had another motor, set that previous motor to 'out of service'
            if (equipment.currentMotor && equipment.currentMotor.toString() !== motor._id.toString()) {
              const prevMotor = await Motor.findById(equipment.currentMotor);
              if (prevMotor) {
                prevMotor.status = 'out of service';
                if (prevMotor.assignmentHistory && prevMotor.assignmentHistory.length > 0) {
                  prevMotor.assignmentHistory.forEach(h => {
                    if (!h.dateRemoved) {
                      h.dateRemoved = now;
                      if (!h.dateInstalled) h.dateInstalled = prevMotor.createdAt || now;
                    }
                  });
                }
                await prevMotor.save();
              }
            }
            equipment.currentMotor = motor._id;
            motor.status = 'active';
          } else if (equipment.currentMotor && equipment.currentMotor.toString() === motor._id.toString()) {
            equipment.currentMotor = null;
            motor.status = 'out of service';
          }

          await equipment.save();
        }
      } catch (eqErr) {
        console.warn('Could not sync dateAssigned/dateRemoved to PlantEquipment:', eqErr.message);
      }
    }

    await motor.save();

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


// @desc    Calculate and update MTBM for a motor based on complete maintenance events
// @route   POST /api/motors/:id/calculate-mtbm
// @access  Private/Manager or Admin
exports.calculateMTBM = async (req, res) => {
  try {
    const motor = await Motor.findById(req.params.id);
    if (!motor) {
      return res.status(404).json({ success: false, message: 'Motor not found' });
    }

    const { mtbm, count, completeEvents } = calculateMTBMFromEvents(motor.maintenanceHistory || []);

    motor.meanTimeBetweenMaintenance = mtbm;
    await motor.save();

    await createNotification(req.app.get('socketio'), {
      type: 'info',
      message: `MTBM Calculated for ${motor.serialNumber}: ${mtbm !== null ? `${mtbm} days` : 'N/A'}`,
      relatedId: motor._id
    });

    res.status(200).json({
      success: true,
      data: motor,
      meanTimeBetweenMaintenance: mtbm,
      completeEventsCount: count
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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

// @desc    Export motor details and QR code to PDF
// @route   GET /api/motors/:id/qr-pdf
// @access  Private (or Guest with valid QR Token)
exports.exportMotorQRPDF = async (req, res) => {
  try {
    const motor = await Motor.findById(req.params.id);
    if (!motor) {
      return res.status(404).json({ success: false, message: 'Motor not found' });
    }

    // Ensure motor has a QR token
    if (!motor.qrToken) {
      const crypto = require('crypto');
      motor.qrToken = crypto.randomBytes(16).toString('hex');
      await motor.save({ validateBeforeSave: false });
    }

    const { generateQRPDF } = require('../utils/qrPdfService');
    const qrUrl = `https://mottracker.vercel.app/motors/${motor._id}/maintenance?qrToken=${motor.qrToken}`;

    const pdfBytes = await generateQRPDF({ motor, qrUrl });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=motor_${motor.serialNumber}_qr.pdf`);
    res.status(200).send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Error generating motor QR PDF:', error);
    res.status(500).json({ success: false, message: 'Server error while generating QR PDF.', error: error.message });
  }
};
