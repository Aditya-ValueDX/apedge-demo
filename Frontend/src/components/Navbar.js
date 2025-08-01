import React, { useState, useRef, useEffect } from 'react';
import { Bell, Settings, LogOut, User, Menu, X } from 'lucide-react';
import { BsCaretDownFill } from 'react-icons/bs';

// Import the CSS file
import './styles/Navbar.css';

const Navbar = ({ toggleCollapse, collapsed }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const storedUser = JSON.parse(sessionStorage.getItem('user') || '{}');
  const user = {
    id: storedUser.id || 'U001',
    name: storedUser.companyName || 'Unknown User',
    role: storedUser.role || 'User',
    email: storedUser.email || 'unknown@example.com',
    avatar: storedUser.avatar || null,
  };

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const handleLogout = () => {
    sessionStorage.clear();
    window.location.href = '/login';
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <div className="navbar">
        <div className="navbar-left">
          <button className="menu-toggle" onClick={toggleCollapse}>
            <Menu size={24} />
          </button>
          <span className="brand-logo-large-screen">
            AP<span className="highlight">Edge</span>
          </span>
        </div>

        <div className="navbar-center-small-screen">
          <span className="brand-logo">
            AP<span className="highlight">Edge</span>
          </span>
        </div>

        <div className="navbar-right">
          {/* Un-comment if you want to use these icons */}
          {/* <div className="nav-item notification-icon">
            <Bell size={20} />
            <span className="notification-badge">3</span>
          </div>
          <div className="nav-item settings-icon">
            <Settings size={20} />
          </div> */}

          <div className="user-dropdown-wrapper" ref={dropdownRef}>
            <div className="user-profile" onClick={toggleDropdown}>
              <div className="user-avatar">
                {user.avatar ? (
                  <img src={user.avatar} alt="User Avatar" />
                ) : (
                  <User size={20} />
                )}
              </div>
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-role">{user.role}</span>
              </div>
              <BsCaretDownFill
                size={16}
                className={`dropdown-arrow ${dropdownOpen ? 'rotated' : ''}`}
              />
            </div>

            {dropdownOpen && (
              <div className={`dropdown-menu ${dropdownOpen ? 'show' : ''}`}>
                <div className="dropdown-header">
                  <div className="user-details">
                    <strong>{user.name}</strong>
                    <div className="user-meta">
                      <span>ID: {user.id}</span>
                      <span>{user.email}</span>
                    </div>
                  </div>
                </div>
                {/* Un-comment if you want these dropdown items */}
                {/* <div className="dropdown-divider"></div>
                <div className="dropdown-item"><User size={16} /><span>Profile Settings</span></div>
                <div className="dropdown-item"><Settings size={16} /><span>Account Settings</span></div>
                <div className="dropdown-divider"></div> */}
                <div className="dropdown-item logout" onClick={handleLogout}>
                  <LogOut size={16} />
                  <span>Logout</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;