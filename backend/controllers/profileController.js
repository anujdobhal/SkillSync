const Profile = require('../models/Profile');
const User = require('../models/User');

exports.getProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate('user', 'name avatar username');
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { skills, interests, experienceLevel, preferredRoles, projects, avatar } = req.body;
    let profile = await Profile.findOne({ user: req.user.id });
    
    if (!profile) {
      profile = new Profile({ user: req.user.id });
    }

    if (skills) profile.skills = skills;
    if (interests) profile.interests = interests;
    if (experienceLevel) profile.experienceLevel = experienceLevel;
    if (preferredRoles) profile.preferredRoles = preferredRoles;
    if (projects) profile.projects = projects;

    await profile.save();

    let updatedUser = null;
    if (avatar) {
      updatedUser = await User.findByIdAndUpdate(req.user.id, { avatar }, { new: true });
    }

    res.json({ message: 'Profile updated successfully', profile, user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: 'Error updating profile', error: err.message });
  }
};

exports.getMatchingUsers = async (req, res) => {
  try {
    const myProfile = await Profile.findOne({ user: req.user.id });
    if (!myProfile) return res.status(400).json({ message: 'Please complete your profile first' });

    // Simple matching: find users who share interests or have complementary skills
    const matchingProfiles = await Profile.find({ user: { $ne: req.user.id } })
      .populate('user', 'name username avatar');

    // Add a more balanced matching score
    const suggestions = matchingProfiles.map(p => {
      let score = 0;
      const sharedInterests = p.interests.filter(i => myProfile.interests.includes(i));
      score += sharedInterests.length * 3;

      const sharedSkills = p.skills.filter(s => myProfile.skills.includes(s));
      score += sharedSkills.length * 2;

      const complementarySkills = p.skills.filter(s => !myProfile.skills.includes(s));
      score += complementarySkills.length * 1;

      if (p.experienceLevel === myProfile.experienceLevel) {
        score += 2;
      } else if (p.experienceLevel && myProfile.experienceLevel) {
        score += 1;
      }

      return {
        profile: p,
        score,
        sharedInterests,
        sharedSkills,
        complementarySkills
      };
    }).sort((a, b) => b.score - a.score).slice(0, 10);

    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
