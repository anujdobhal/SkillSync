import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [teamsRes, suggRes] = await Promise.all([
        api.get('/teams/me').catch(() => ({ data: [] })),
        api.get('/profiles/suggestions').catch(() => ({ data: [] }))
      ]);
      setTeams(teamsRes.data);
      if (Array.isArray(suggRes.data)) {
        setSuggestions(suggRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container dashboard">
        <header className="dash-header">
          <h1>Welcome back, {user?.name}!</h1>
          <p>Find the perfect team members for your next big project.</p>
        </header>

        {loading ? (
          <div className="loading">Loading dashboard...</div>
        ) : (
          <div className="dash-grid">
            <section className="card">
              <div className="card-header">
                <h2>Your Teams</h2>
                <Link to="/teams" className="btn-secondary">View All</Link>
              </div>
              <div className="card-content">
                {teams.length === 0 ? (
                  <div className="empty-state">You are not in any teams yet.</div>
                ) : (
                  <ul className="team-list">
                    {teams.map(team => (
                      <li key={team._id} className="team-item">
                        <div className="team-info">
                          <h3>{team.name}</h3>
                          <span className="badge">{team.status}</span>
                        </div>
                        <p>{team.members.length} members</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <section className="card">
              <div className="card-header">
                <h2>Suggested Teammates</h2>
              </div>
              <div className="card-content">
                {suggestions.length === 0 ? (
                  <div className="empty-state">
                    Complete your <Link to="/profile">profile</Link> to get matches.
                  </div>
                ) : (
                  <ul className="user-list">
                    {suggestions.map(({ profile, score }) => (
                      <li key={profile._id} className="user-item">
                        <img src={profile.user?.avatar} alt="avatar" className="avatar-lg" />
                        <div className="user-info">
                          <h3>{profile.user?.name}</h3>
                          <p>{profile.preferredRoles?.join(', ') || 'No role set'}</p>
                          <div className="match-score">Score: {score}</div>
                          <button type="button" className="btn-secondary btn-small" onClick={() => navigate(`/messages?userId=${profile.user?._id}`)}>
                            Message
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;
