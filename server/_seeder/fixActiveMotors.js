// server/_seeder/fixActiveMotors.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const Motor = require('../models/motorModel');
const PlantEquipment = require('../models/plantEquipmentModel');

const fixActiveMotors = async () => {
  try {
    console.log('Connecting to database...');
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined in server/.env');
    }
    await mongoose.connect(mongoUri);
    console.log('Connected to database successfully.\n');

    // 1. Fetch all plant equipments that currently have a motor assigned
    const equipmentsWithMotors = await PlantEquipment.find({
      currentMotor: { $ne: null }
    }).select('currentMotor tonNumber designation plant').lean();

    const assignedMotorIdSet = new Set(
      equipmentsWithMotors
        .filter(eq => eq.currentMotor)
        .map(eq => eq.currentMotor.toString())
    );

    console.log(`Found ${equipmentsWithMotors.length} equipments with assigned active motors.`);

    // 2. Fetch all motors currently in 'active' status
    const activeMotors = await Motor.find({ status: 'active' });
    console.log(`Found ${activeMotors.length} motors marked as status: 'active'.\n`);

    let fixedCount = 0;
    const now = new Date();

    for (const motor of activeMotors) {
      const motorIdStr = motor._id.toString();

      // If this active motor is NOT currently installed on any equipment:
      if (!assignedMotorIdSet.has(motorIdStr)) {
        console.log(`--> Fixing orphan active motor: S/N: "${motor.serialNumber}" (ID: ${motorIdStr})`);

        motor.status = 'out of service';

        // Close any dangling / open assignment history entries
        let closedHistoryCount = 0;
        if (motor.assignmentHistory && motor.assignmentHistory.length > 0) {
          motor.assignmentHistory.forEach(h => {
            if (!h.dateRemoved) {
              h.dateRemoved = now;
              if (!h.dateInstalled) {
                h.dateInstalled = motor.createdAt || now;
              }
              closedHistoryCount++;
            }
          });
        }

        await motor.save();
        console.log(`    Status updated to "out of service". Closed ${closedHistoryCount} unclosed assignment history record(s).\n`);
        fixedCount++;
      } else {
        const assignedEq = equipmentsWithMotors.find(eq => eq.currentMotor.toString() === motorIdStr);
        console.log(`[OK] Motor S/N: "${motor.serialNumber}" is legitimately active on TON: ${assignedEq?.tonNumber || 'N/A'} (${assignedEq?.designation || 'N/A'})`);
      }
    }

    console.log('\n========================================');
    console.log(`Summary: Processed ${activeMotors.length} active motors.`);
    console.log(`Fixed: ${fixedCount} orphan motors changed from 'active' to 'out of service'.`);
    console.log(`Legitimately Active: ${activeMotors.length - fixedCount} motors.`);
    console.log('========================================\n');

    await mongoose.disconnect();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (err) {
    console.error('Error fixing active motors:', err);
    process.exit(1);
  }
};

fixActiveMotors();
