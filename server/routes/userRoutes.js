// server/routes/userRoutes.js
const express = require('express');
const router = express.Router();

// Import controllers and middleware
const {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');

const { protect, authorize } = require('../middleware/authMiddleware');

// All routes in this file will be protected and require admin access
router.use(protect);
router.use(authorize('admin'));

// Routes for /api/users
router.route('/')
  .get(getUsers)
  .post(createUser);

// Routes for /api/users/:id
router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;
