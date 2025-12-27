const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: './.env' });

const connectDB = require('./config/db');

const fixIndexes = async () => {
    try {
        await connectDB();
        console.log('Connected to DB...');

        const db = mongoose.connection.db;
        const collection = db.collection('spareparts');

        // List indexes
        const indexes = await collection.indexes();
        console.log('Current Indexes:', indexes.map(i => i.name));

        // Drop the problematic index
        // The error message says: duplicate key error collection: test.spareparts index: oldWarehouseNumber_1
        const indexName = 'oldWarehouseNumber_1';

        if (indexes.find(i => i.name === indexName)) {
            await collection.dropIndex(indexName);
            console.log(`Dropped index: ${indexName}`);
        } else {
            console.log(`Index ${indexName} not found.`);
        }

        console.log('Done.');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

fixIndexes();
