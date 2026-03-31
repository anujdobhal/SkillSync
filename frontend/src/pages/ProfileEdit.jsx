import { useState, useEffect, useContext } from 'react';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import './ProfileEdit.css';

const ProfileEdit = () => {
  const { checkUser } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    avatar: '',
    skills: '',
    interests: '',
    experienceLevel: 'Beginner',
    preferredRoles: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/profiles/me');
      if (data) {
        setFormData({
          avatar: data.user?.avatar || '',
          skills: data.skills?.join(', ') || '',
          interests: data.interests?.join(', ') || '',
          experienceLevel: data.experienceLevel || 'Beginner',
          preferredRoles: data.preferredRoles?.join(', ') || ''
        });
      }
    } catch (err) {
      console.error('No profile found or error fetching');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, avatar: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const payload = {
        avatar: formData.avatar,
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
        interests: formData.interests.split(',').map(s => s.trim()).filter(Boolean),
        preferredRoles: formData.preferredRoles.split(',').map(s => s.trim()).filter(Boolean),
        experienceLevel: formData.experienceLevel
      };
      await api.put('/profiles/me', payload);
      await checkUser();
      setMessage('Profile updated successfully!');
    } catch (err) {
      setMessage('Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-placeholder">Loading...</div>;

  return (
    <>
      <Navbar />
      <div className="container profile-container">
        <header className="dash-header">
          <h1>Edit Profile</h1>
          <p>Update your skills and interests to find better matches.</p>
        </header>

        {message && <div className={message.includes('Error') ? 'error-alert' : 'success-alert'}>{message}</div>}

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label>Upload Profile Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
          {formData.avatar && (
            <div className="form-group avatar-preview">
              <label>Preview</label>
              <img src={formData.avatar} alt="Profile preview" className="avatar-preview-img" />
            </div>
          )}
          <div className="form-group">
            <label>Skills (comma separated)</label>
            <input 
              name="skills" 
              value={formData.skills} 
              onChange={handleChange} 
              placeholder="React, Node.js, Python..." 
            />
          </div>

          <div className="form-group">
            <label>Interests (comma separated)</label>
            <input 
              name="interests" 
              value={formData.interests} 
              onChange={handleChange} 
              placeholder="Web Dev, AI, Design..." 
            />
          </div>

          <div className="form-group">
            <label>Preferred Roles (comma separated)</label>
            <input 
              name="preferredRoles" 
              value={formData.preferredRoles} 
              onChange={handleChange} 
              placeholder="Frontend Developer, UX Designer..." 
            />
          </div>

          <div className="form-group">
            <label>Experience Level</label>
            <select name="experienceLevel" value={formData.experienceLevel} onChange={handleChange}>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <button type="submit" className="btn-save" disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </>
  );
};

export default ProfileEdit;
