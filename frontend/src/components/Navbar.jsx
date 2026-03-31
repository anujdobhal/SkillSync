import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/dashboard">SkillSync</Link>
      </div>
      <div className="nav-links">
        <Link to="/dashboard" className="nav-item">Dashboard</Link>
        <Link to="/teams" className="nav-item">Teams</Link>
        <Link to="/messages" className="nav-item">Messages</Link>
        <Link to="/profile" className="nav-item user-badge">
          <img src={user?.avatar} alt="avatar" className="avatar" />
          <span>{user?.name}</span>
        </Link>
        <button onClick={handleLogout} className="btn-logout">Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;
