import React, { useState, useRef, useEffect } from 'react';
import { Bell, Settings, LogOut, User, ChevronDown } from 'lucide-react';
import { BsCaretDownFill } from "react-icons/bs"; // Bootstrap solid chevron

const Navbar = ({ collapsed }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [shouldRenderDropdown, setShouldRenderDropdown] = useState(false);

  const dropdownRef = useRef(null);

  const storedUser = JSON.parse(sessionStorage.getItem('user') || '{}');

  const user = {
    id: storedUser.id || 'U001',
    name: storedUser.companyName || 'Unknown User',
    role: storedUser.role || 'User',
    email: storedUser.email || 'unknown@example.com',
    avatar: storedUser.avatar || null,
  };

  const toggleDropdown = () => {
    if (dropdownOpen) {
      setDropdownOpen(false);
      setTimeout(() => setShouldRenderDropdown(false), 300); // Wait for close animation
    } else {
      setShouldRenderDropdown(true); // Render first
      setTimeout(() => setDropdownOpen(true), 10); // Wait 1 frame to trigger animation
    }
  };

  const handleLogout = () => {
    // Clear session and redirect to login
    sessionStorage.clear();
    window.location.href = '/login';
  };

  // Close dropdown on outside click
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
      <div className={`navbar ${collapsed ? 'shifted' : ''}`}>
        <div className="navbar-left">
          {/* <h1 className="app-title">Document Management</h1> */}
          <div className="brand-toggle">
            <span className="brand-logo">APEdge</span>
          </div>
        </div>

        <div className="navbar-right">
          {/* Notifications */}
          <div className="nav-item notification-icon">
            <Bell size={20} />
            <span className="notification-badge">3</span>
          </div>

          {/* Settings */}
          <div className="nav-item">
            <Settings size={20} />
          </div>

          {/* User Profile Dropdown */}
          <div className="user-dropdown-wrapper" ref={dropdownRef}>
            <div className="user-profile" onClick={toggleDropdown}>
              <div className="user-avatar">
                {user.avatar ? <img src={user.avatar} alt="User Avatar" /> : <User size={20} />}
              </div>
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-role">{user.role}</span>
              </div>
              <BsCaretDownFill size={16} className={`dropdown-arrow ${dropdownOpen ? 'rotated' : ''}`} />
            </div>

            {shouldRenderDropdown && (
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
                <div className="dropdown-divider"></div>
                <div className="dropdown-item">
                  <User size={16} />
                  <span>Profile Settings</span>
                </div>
                <div className="dropdown-item">
                  <Settings size={16} />
                  <span>Account Settings</span>
                </div>
                <div className="dropdown-divider"></div>
                <div className="dropdown-item logout" onClick={handleLogout}>
                  <LogOut size={16} />
                  <span>Logout</span>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      <style>{`
  .navbar {
    height: 60px;
    background: #2c3e50;
    color: white;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    position: sticky;
    top: 0;
    z-index: 1000;
    transition: margin-left 0.3s ease;
    margin-left: 0;
  }

  .brand-toggle {
  padding: 0 60px;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  height: 100%;
  transition: all 0.3s ease;
}

.brand-logo {
  white-space: nowrap;
}

  .navbar-right {
    display: flex;
    align-items: center;
  }

  .nav-item {
    padding: 8px;
    border-radius: 4px;
    cursor: pointer;
    position: relative;
    transition: background-color 0.2s;
  }

  .nav-item:hover {
    background: #34495e;
  }

  .notification-icon {
    position: relative;
  }

  .notification-badge {
    position: absolute;
    top: -2px;
    right: -2px;
    background: #e74c3c;
    color: white;
    border-radius: 50%;
    width: 18px;
    height: 18px;
    font-size: 11px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
  }

  .user-dropdown-wrapper {
    position: relative;
  }

  .user-profile {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    background: #34495e;
    transition: background-color 0.2s;
  }

  .user-profile:hover {
    background:rgb(87, 111, 136)
  }

  .user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #3498db;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .user-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .user-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .user-name {
    font-size: 14px;
    font-weight: 600;
    line-height: 1.2;
  }

  .user-role {
    font-size: 12px;
    color: #bdc3c7;
    line-height: 1.2;
  }

  .dropdown-arrow {
    transition: transform 0.25s ease;
  }

  .dropdown-arrow.rotated {
    transform: rotate(180deg);
  }

 .dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: white;
  color: #2c3e50;
  border-radius: 10px;
  box-shadow: 0 30px 40px rgba(0, 0, 0, 0.70);
  min-width: 240px;
  z-index: 1001;
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
  transition: all 0.3s ease-in-out;
  pointer-events: none;
}

.dropdown-menu.show {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}


/* Smooth closing animation */
@keyframes dropdownClose {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(-10px) scale(0.98);
  }
}

.dropdown-menu::before {
  content: "";
  position: absolute;
  top: -8px;
  right: 12px;
  border-width: 0 8px 8px 8px;
  border-style: solid;
  border-color: transparent transparent white transparent;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 0;
}

.dropdown-menu::after {
  content: "";
  position: absolute;
  top: -10px;
  right: 12px;
  border-width: 0 9px 9px 9px;
  border-style: solid;
  border-color: transparent transparent rgba(0, 0, 0, 0.12) transparent;
  z-index: -1;
}



  .dropdown-header {
    padding: 16px;
    background: #1f2d3d;
    border-bottom: 1px solid #e5e5e5;
  }

  .user-details strong {
    display: block;
    font-size: 15px;
    color:rgb(243, 243, 243);
    margin-bottom: 4px;
  }

  .user-meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .user-meta span {
    font-size: 12px;
    color:rgb(209, 209, 209)
  }

  .dropdown-divider {
    height: 1px;
    background: #e9ecef;
    margin: 8px 0;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    cursor: pointer;
    transition: background-color 0.2s;
    font-size: 14px;
  }

  .dropdown-item:hover {
    background:rgb(220, 217, 217)
  }

.dropdown-item.logout {
  color: #e74c3c;
  font-weight: 600;
  background-color: transparent;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.dropdown-item.logout:hover {
  background-color: #fcebea;
  color: #c0392b;
}


  @media (max-width: 768px) {
    .navbar {
      padding: 0 16px;
    }

    .user-info {
      display: none;
    }

    .navbar-right {
      gap: 16px;
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`}</style>

    </>
  );
};

export default Navbar;