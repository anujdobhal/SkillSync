import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import './TeamView.css';

const TeamView = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    requiredRoles: ''
  });

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const { data } = await api.get('/teams', {
        params: {
          search: searchText || undefined,
          status: statusFilter || undefined,
          role: roleFilter || undefined,
        }
      });
      setTeams(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        requiredRoles: formData.requiredRoles.split(',').map(r => r.trim()).filter(Boolean)
      };
      await api.post('/teams', payload);
      setShowCreate(false);
      fetchTeams();
    } catch (err) {
      alert('Error creating team');
    }
  };

  const handleJoinTeam = async (teamId) => {
    try {
      const role = prompt("What role are you applying for?");
      if (!role) return;
      const note = prompt("Optional note to the team leader:");
      await api.post(`/teams/${teamId}/join`, { role, note });
      fetchTeams();
      alert("Request submitted. The team leader will approve it soon.");
    } catch (err) {
      alert(err.response?.data?.message || 'Error requesting to join');
    }
  };

  const handleApproveRequest = async (teamId, requestId) => {
    try {
      await api.post(`/teams/${teamId}/requests/${requestId}/approve`);
      fetchTeams();
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to approve request');
    }
  };

  const handleRejectRequest = async (teamId, requestId) => {
    try {
      await api.post(`/teams/${teamId}/requests/${requestId}/reject`);
      fetchTeams();
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to reject request');
    }
  };

  const pendingRequestCount = teams.reduce((count, team) => {
    if (team.leader?._id === user.id) {
      return count + (team.requests?.filter(r => r.status === 'Pending').length || 0);
    }
    return count;
  }, 0);

  return (
    <>
      <Navbar />
      <div className="container">
        <header className="dash-header flex-between">
          <div>
            <h1>Discover Teams</h1>
            <p>Join an existing team or create your own.</p>
          </div>
          <button className="btn-save" onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? 'Cancel' : '+ Create Team'}
          </button>
        </header>

        {pendingRequestCount > 0 && (
          <div className="team-alert-banner">
            You have {pendingRequestCount} pending join request{pendingRequestCount > 1 ? 's' : ''} to review.
          </div>
        )}

        <section className="filter-panel card mb-2">
          <div className="filter-row">
            <input
              placeholder="Search teams by name or description"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
            <input
              placeholder="Filter by required role"
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
            />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All status</option>
              <option value="Recruiting">Recruiting</option>
              <option value="Full">Full</option>
              <option value="Completed">Completed</option>
            </select>
            <button type="button" className="btn-save" onClick={fetchTeams}>Apply</button>
          </div>
        </section>

        {showCreate && (
          <form className="profile-form create-team-form mb-2" onSubmit={handleCreateTeam}>
            <h2>Create a New Team</h2>
            <input 
              placeholder="Team Name" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              required 
            />
            <input 
              placeholder="Description & Idea" 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
              required 
            />
            <input 
              placeholder="Required Roles (comma separated)" 
              value={formData.requiredRoles} 
              onChange={e => setFormData({...formData, requiredRoles: e.target.value})} 
            />
            <button type="submit" className="btn-save">Create</button>
          </form>
        )}

        {loading ? (
          <div className="loading">Loading teams...</div>
        ) : (
          <div className="dash-grid">
            {teams.length === 0 && !showCreate && (
              <div className="empty-state" style={{ gridColumn: '1 / -1' }}>No teams available yet. Build something great!</div>
            )}
            {teams.map(team => {
              const amIMember = team.members.some(m => m.user._id === user.id);
              const pendingRequest = team.requests?.some(r => r.user?._id === user.id && r.status === 'Pending');
              const isLeader = team.leader?._id === user.id;
              const pendingRequests = team.requests?.filter(r => r.status === 'Pending') || [];
              return (
                <div key={team._id} className="team-card">
                  <div className="team-card-header">
                    <div>
                      <h2>{team.name}</h2>
                      {pendingRequests.length > 0 && isLeader && (
                        <span className="request-badge">{pendingRequests.length} pending</span>
                      )}
                    </div>
                    <span className="badge">{team.status}</span>
                  </div>
                  <p className="team-desc">{team.description}</p>
                  
                  <div className="team-meta">
                    <p><strong>Leader:</strong> {team.leader?.name}</p>
                    <p><strong>Required:</strong> {team.requiredRoles.join(', ') || 'Any'}</p>
                  </div>

                  <div className="team-members block">
                    <h4>Members ({team.members.length}/5)</h4>
                    <div className="member-avatars">
                      {team.members.map((m, i) => (
                        <div key={i} className="member-tooltip" title={`${m.user?.name} - ${m.role}${m.note ? ` | ${m.note}` : ''}`}>
                          <img src={m.user?.avatar || "https://via.placeholder.com/150"} alt="avatar" className="avatar" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {isLeader && pendingRequests.length > 0 && (
                    <div className="request-panel">
                      <h4>Pending Requests</h4>
                      {pendingRequests.map(request => (
                        <div key={request._id} className="request-card">
                          <div>
                            <strong>{request.user?.name}</strong>
                            <p>{request.role}</p>
                            {request.note && <p className="request-note">{request.note}</p>}
                          </div>
                          <div className="request-actions">
                            <button className="btn-save btn-small" onClick={() => handleApproveRequest(team._id, request._id)}>Approve</button>
                            <button className="btn-secondary btn-small" onClick={() => handleRejectRequest(team._id, request._id)}>Reject</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!amIMember && !pendingRequest && team.status !== 'Full' && (
                    <button className="btn-secondary w-full mt-1" onClick={() => handleJoinTeam(team._id)}>
                      Request to Join
                    </button>
                  )}
                  {!amIMember && pendingRequest && (
                    <div className="joined-badge w-full mt-1">Join request pending</div>
                  )}
                  {!amIMember && team.leader?._id !== user.id && (
                    <button className="btn-secondary w-full mt-1" onClick={() => navigate(`/messages?userId=${team.leader?._id}`)}>
                      Message Leader
                    </button>
                  )}
                  {amIMember && (
                    <div className="joined-badge w-full mt-1">You are a member</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default TeamView;
