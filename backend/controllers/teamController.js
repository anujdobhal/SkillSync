const Team = require('../models/Team');
const Profile = require('../models/Profile');

exports.createTeam = async (req, res) => {
  try {
    const { name, description, requiredRoles } = req.body;
    
    const team = await Team.create({
      name,
      description,
      leader: req.user.id,
      members: [{ user: req.user.id, role: 'Leader', note: 'Team creator' }],
      requiredRoles: requiredRoles || [],
      requests: []
    });

    res.status(201).json(team);
  } catch (err) {
    res.status(500).json({ message: 'Error creating team', error: err.message });
  }
};

exports.getTeams = async (req, res) => {
  try {
    const { search, status, role } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (search) {
      const regex = { $regex: search, $options: 'i' };
      filter.$or = [
        { name: regex },
        { description: regex }
      ];
    }

    if (role) {
      filter.requiredRoles = { $in: [new RegExp(role, 'i')] };
    }

    const teams = await Team.find(filter)
      .populate('leader', 'name username avatar')
      .populate('members.user', 'name avatar')
      .populate('requests.user', 'name username avatar');
    res.json(teams);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching teams', error: err.message });
  }
};

exports.getMyTeams = async (req, res) => {
  try {
    const teams = await Team.find({ 'members.user': req.user.id })
                           .populate('leader', 'name avatar')
                           .populate('members.user', 'name avatar')
                           .populate('requests.user', 'name username avatar');
    res.json(teams);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching your teams', error: err.message });
  }
};

exports.joinTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { role, note } = req.body;
    
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    if (team.members.some(m => m.user.toString() === req.user.id)) {
      return res.status(400).json({ message: 'You are already a member of this team' });
    }

    if (team.requests.some(r => r.user.toString() === req.user.id && r.status === 'Pending')) {
      return res.status(400).json({ message: 'You already have a pending join request' });
    }

    if (team.status === 'Full') {
      return res.status(400).json({ message: 'This team is already full' });
    }

    team.requests.push({
      user: req.user.id,
      role: role || 'Member',
      note: note || '',
      status: 'Pending',
    });

    await team.save();
    res.json({ message: 'Request submitted. Waiting for leader approval.', team });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.approveJoinRequest = async (req, res) => {
  try {
    const { teamId, requestId } = req.params;
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });
    if (team.leader.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the team leader can approve requests' });
    }

    const request = team.requests.id(requestId);
    if (!request || request.status !== 'Pending') {
      return res.status(400).json({ message: 'Request is not pending or not found' });
    }

    if (team.members.some(m => m.user.toString() === request.user.toString())) {
      request.status = 'Approved';
      await team.save();
      return res.status(400).json({ message: 'User is already a member' });
    }

    team.members.push({
      user: request.user,
      role: request.role || 'Member',
      note: request.note || '',
    });
    request.status = 'Approved';

    if (team.members.length >= 5) {
      team.status = 'Full';
    }

    await team.save();
    res.json({ message: 'Join request approved', team });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.rejectJoinRequest = async (req, res) => {
  try {
    const { teamId, requestId } = req.params;
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });
    if (team.leader.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the team leader can reject requests' });
    }

    const request = team.requests.id(requestId);
    if (!request || request.status !== 'Pending') {
      return res.status(400).json({ message: 'Request is not pending or not found' });
    }

    request.status = 'Rejected';
    await team.save();
    res.json({ message: 'Join request rejected', team });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
