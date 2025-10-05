import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="navigation">
      <div className="nav-brand">🎙️ nAnalyzer</div>
      <ul className="nav-links">
        <li>
          <Link 
            to="/" 
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
          >
            📊 Dashboard
          </Link>
        </li>
        <li>
          <Link 
            to="/live" 
            className={`nav-link ${isActive('/live') ? 'active' : ''}`}
          >
            🔴 Live Monitoring
          </Link>
        </li>
        <li>
          <Link 
            to="/history" 
            className={`nav-link ${isActive('/history') ? 'active' : ''}`}
          >
            📚 Call History
          </Link>
        </li>
        <li>
          <Link 
            to="/analytics" 
            className={`nav-link ${isActive('/analytics') ? 'active' : ''}`}
          >
            📈 Analytics
          </Link>
        </li>
        <li>
          <Link 
            to="/settings" 
            className={`nav-link ${isActive('/settings') ? 'active' : ''}`}
          >
            ⚙️ Settings
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navigation;
