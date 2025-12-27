const express = require('express');
const router = express.Router();
const { getSpareParts, bulkUploadSpareParts } = require('../controllers/sparePartController');
const { protect } = require('../middleware/authMiddleware'); // Assuming this exists based on other routes

// Route: /api/spare-parts

// Public/Private access consideration: 
// PRD says "Production (Vercel): Optimized for read-only speed". 
// However, likely needs to be authenticated.
// The provided file list shows `authMiddleware`, so we'll use `protect`.

router.get('/', protect, getSpareParts);
router.post('/upload', protect, bulkUploadSpareParts);

module.exports = router;
