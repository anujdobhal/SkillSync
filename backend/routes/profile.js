const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const auth = require('../middleware/auth');

router.get('/me', auth, profileController.getProfile);
router.put('/me', auth, profileController.updateProfile);
router.get('/suggestions', auth, profileController.getMatchingUsers);

module.exports = router;
