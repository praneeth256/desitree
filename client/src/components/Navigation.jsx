import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navigation({ search, onSearch, showAdmin = false }) {
  const { user, logout } = useAuth();

  return (
    <nav>
      <NavLink to="/" className="logo">Desi<span>Tree</span></NavLink>
      <div className="nav-center">
        <div className="search-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            className="search-bar"
            placeholder="Search videos..."
          />
        </div>
      </div>
      <div className="nav-right">
        {user?.role === 'admin' && (
          <NavLink to="/admin" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Admin</NavLink>
        )}
        {user ? (
          <>
            <span className="user-greeting">Hi, {user.name}</span>
            <button className="btn btn-ghost" onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <NavLink to="/signin" className="btn btn-ghost">Sign In</NavLink>
            <NavLink to="/signup" className="btn btn-premium">Sign Up</NavLink>
          </>
        )}
      </div>
    </nav>
  );
}
