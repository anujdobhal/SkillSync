const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const auth = require('../middleware/auth');

router.post('/', auth, teamController.createTeam);
router.get('/', auth, teamController.getTeams);
router.get('/me', auth, teamController.getMyTeams);
router.post('/:teamId/join', auth, teamController.joinTeam);
router.post('/:teamId/requests/:requestId/approve', auth, teamController.approveJoinRequest);
router.post('/:teamId/requests/:requestId/reject', auth, teamController.rejectJoinRequest);

module.exports = router;
