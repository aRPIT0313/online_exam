function Navbar({ role, onLogout }) {
  return (
    <div className="navbar">
      <div className="navbar-brand">
        📝 Exam<span>Portal</span>
      </div>
      <div className="navbar-right">
        {role && <span className="role-badge">{role}</span>}
        {onLogout && (
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        )}
      </div>
    </div>
  );
}

export default Navbar;
