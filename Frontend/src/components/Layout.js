// src/pages/Layout.js
import React, { useState, useEffect, useRef } from 'react';
import { Home, Upload, List, CheckCircle, Database, FileText, Settings, LogOut, Menu, X, ChevronDown, User } from 'lucide-react';

// Mock constants for demonstration
const USER_ROLES = {
  REQUESTER: 'requester',
  APPROVER: 'approver',
  ADMIN: 'admin'
};

// Define navigation items
const navItems = [
  { name: 'Dashboard', icon: Home, route: 'dashboard', roles: [USER_ROLES.REQUESTER, USER_ROLES.APPROVER, USER_ROLES.ADMIN] },
  { name: 'New Request', icon: Upload, route: 'reimbursement_form', roles: [USER_ROLES.REQUESTER] },
  { name: 'Requests', icon: List, route: 'request_list', roles: [USER_ROLES.REQUESTER] },
  { name: 'Approve Requests', icon: CheckCircle, route: 'approval_view', roles: [USER_ROLES.APPROVER] },
  { name: 'ERP Integration', icon: Database, route: 'erp_integration', roles: [USER_ROLES.ADMIN] },
  { name: 'Reports', icon: FileText, route: 'reports', roles: [USER_ROLES.REQUESTER] },
  { name: 'Approver Reports', icon: FileText, route: 'reports', roles: [USER_ROLES.APPROVER] },
  { name: 'Admin Reports', icon: FileText, route: 'reports', roles: [USER_ROLES.ADMIN] },
  { name: 'Master Data', icon: Settings, route: 'master_data', roles: [USER_ROLES.ADMIN] },
];

const Layout = ({ children, navigateTo, currentPage, userRole = USER_ROLES.ADMIN, onLogout, user }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Check if device is mobile and set initial sidebar state
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };

    checkMobile();
    // Set initial sidebar state based on screen size
    setIsSidebarOpen(window.innerWidth >= 1200); // Only open by default on larger screens
    
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const filteredNavItems = navItems.filter(item => userRole && item.roles.includes(userRole));

  const getPageTitle = () => {
    if (currentPage === 'reports') {
      return userRole === USER_ROLES.REQUESTER ? 'Requestor Reports' :
             userRole === USER_ROLES.APPROVER ? 'Approver Reports' :
             userRole === USER_ROLES.ADMIN ? 'Admin Reports' : 'Reports';
    }
    return navItems.find(item => item.route === currentPage && item.roles.includes(userRole))?.name || 'Welcome';
  };

  const handleNavClick = (route) => {
    if (navigateTo) navigateTo(route);
    if (isMobile) setIsSidebarOpen(false); // Close sidebar on mobile after navigation
  };

  const handleLogout = () => {
    setIsDropdownOpen(false);
    if (onLogout) onLogout();
  };

  return (
    <div className="modern-app-container">
      {/* Horizontal Navbar */}
      <nav className="horizontal-navbar">
        <div className="navbar-left">
          <button className="hamburger-button" onClick={toggleSidebar}>
            <Menu size={24} />
          </button>
          <div className="app-title">
            <span className="title-text">
              Reimburse<span className="pro-text">Pro</span>
            </span>
          </div>
        </div>
        
        <div className="navbar-right">
          <div className="user-dropdown-container" ref={dropdownRef}>
            <button className="user-dropdown-trigger" onClick={toggleDropdown}>
              <div className="user-avatar-navbar">
                {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="user-info-display">
                <span className="user-name-display">{user?.email || 'user@reimbursepro.com'}</span>
                <span className="user-role-display">{userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : 'Guest'}</span>
              </div>
              <ChevronDown 
                size={16} 
                className={`dropdown-arrow ${isDropdownOpen ? 'dropdown-arrow-open' : ''}`}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="user-dropdown-menu">
                <div className="dropdown-header">
                  <div className="dropdown-avatar">
                    {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="dropdown-user-info">
                    <div className="dropdown-username">{user?.email || 'user@reimbursepro.com'}</div>
                    {/* <div className="dropdown-email">{user?.email || 'admin@valuedx.com'}</div> */}
                    <div className="dropdown-role">{userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : 'Guest'}</div>
                  </div>
                </div>
                
                <div className="dropdown-divider"></div>
                
                <div className="dropdown-actions">
                  {/* <button className="dropdown-action-item">
                    <User size={16} />
                    <span>Profile Settings</span>
                  </button>
                  <button className="dropdown-action-item">
                    <Settings size={16} />
                    <span>Account Settings</span>
                  </button> */}
                  <button className="dropdown-action-item logout-item" onClick={handleLogout}>
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Sidebar Overlay for Mobile */}
      {isMobile && isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`modern-sidebar ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="sidebar-content">
          <nav className="nav-list">
            <ul>
              {filteredNavItems.map((item) => (
                <li key={item.name} className="nav-item">
                  <button
                    onClick={() => handleNavClick(item.route)}
                    className={`nav-button ${currentPage === item.route ? 'active' : ''}`}
                    title={!isSidebarOpen ? item.name : ''}
                  >
                    <item.icon className="nav-icon" />
                    <span className="nav-text">{item.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`modern-main-content ${isSidebarOpen ? 'content-shifted-open' : 'content-shifted-closed'}`}>
        {/* Page Content */}
        <section className="page-content">
          {children || (
            <div className="demo-content">
              <div className="demo-card">
                <h2>Welcome to ReimbursePro</h2>
                <p>This is a modern, responsive layout for your expense management system.</p>
                <div className="demo-features">
                  <div className="feature-item">
                    <CheckCircle size={20} />
                    <span>Responsive Design</span>
                  </div>
                  <div className="feature-item">
                    <Menu size={20} />
                    <span>Mobile-First Navigation</span>
                  </div>
                  <div className="feature-item">
                    <Settings size={20} />
                    <span>Modern UI Components</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      <style>{` /* Removed jsx attribute */
        .modern-app-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        /* Horizontal Navbar */
        .horizontal-navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 60px;
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(148, 163, 184, 0.2);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          z-index: 1000;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        }

        .navbar-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .hamburger-button {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.1);
        }

        .hamburger-button:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.05);
        }

        .app-title {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .title-text {
          font-size: 30px;
          font-weight: 900;
          color: white;
          line-height: 1;
        }

        .pro-text {
          color: #3498db;
        }

        .navbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        /* User Dropdown */
        .user-dropdown-container {
          position: relative;
        }

        .user-dropdown-trigger {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: white;
          font-size: 14px;
        }

        .user-dropdown-trigger:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        .user-avatar-navbar {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 13px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          flex-shrink: 0;
        }

        .user-info-display {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .user-name-display {
          font-size: 13px;
          font-weight: 600;
          color: white;
          line-height: 1.2;
        }

        .user-role-display {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.2;
        }

        .dropdown-arrow {
          transition: transform 0.2s ease;
          color: rgba(255, 255, 255, 0.7);
        }

        .dropdown-arrow-open {
          transform: rotate(180deg);
        }

        /* Dropdown Menu */
        .user-dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 8px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          border: 1px solid #e2e8f0;
          min-width: 280px;
          z-index: 1001;
          overflow: hidden;
          animation: dropdownSlideIn 0.2s ease-out;
        }

        @keyframes dropdownSlideIn {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .dropdown-header {
          padding: 20px;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .dropdown-avatar {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 18px;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .dropdown-user-info {
          flex: 1;
        }

        .dropdown-username {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 2px;
        }

        .dropdown-email {
          font-size: 13px;
          color: #64748b;
          margin-bottom: 4px;
        }

        .dropdown-role {
          font-size: 12px;
          color: #6366f1;
          font-weight: 600;
          background: rgba(99, 102, 241, 0.1);
          padding: 2px 8px;
          border-radius: 6px;
          display: inline-block;
        }

        .dropdown-divider {
          height: 1px;
          background: #e2e8f0;
          margin: 0;
        }

        .dropdown-actions {
          padding: 12px;
        }

        .dropdown-action-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px 16px;
          border: none;
          background: none;
          color: #475569;
          font-size: 14px;
          font-weight: 500;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .dropdown-action-item:hover {
          background: #f1f5f9;
          color: #334155;
          transform: translateX(2px);
        }

        .dropdown-action-item.logout-item {
          color: #dc2626;
          margin-top: 8px;
        }

        .dropdown-action-item.logout-item:hover {
          background: rgba(220, 38, 38, 0.1);
          color: #dc2626;
        }

        /* Sidebar */
        .sidebar-overlay {
          position: fixed;
          top: 56px;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 999;
        }

        .modern-sidebar {
          position: fixed;
          top: 60px;
          left: 0;
          height: calc(100vh - 56px);
          background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
          border-right: 1px solid rgba(148, 163, 184, 0.2);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1001;
          overflow-y: auto;
          box-shadow: 4px 0 24px rgba(0, 0, 0, 0.1);
        }

        .modern-sidebar.sidebar-open {
          width: 250px;
          transform: translateX(0);
        }

        .modern-sidebar.sidebar-closed {
          width: 64px;
          transform: translateX(0);
        }

        .sidebar-content {
          padding: 24px 12px;
          height: 100%;
        }

        .nav-list ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .nav-item {
          margin: 0;
        }

        .nav-button {
          display: flex;
          align-items: center;
          width: 100%;
          padding: 12px;
          border-radius: 12px;
          text-align: left;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.8);
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
          font-weight: 500;
          position: relative;
          overflow: hidden;
          justify-content: flex-start;
        }

        .sidebar-closed .nav-button {
          justify-content: center;
          padding: 8px 10px;
        }

        .nav-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transition: left 0.5s;
        }

        .nav-button:hover::before {
          left: 100%;
        }

        .nav-button:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          transform: translateX(2px);
        }

        .sidebar-closed .nav-button:hover {
          transform: scale(1.05);
        }

        .nav-button.active {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .nav-button.active::before {
          display: none;
        }

        .nav-icon {
          flex-shrink: 0;
          transition: all 0.3s ease;
        }

        .sidebar-open .nav-icon {
          margin-right: 12px;
        }

        .sidebar-closed .nav-icon {
          margin-left: 12px;
        }

        .nav-text {
          flex: 1;
          opacity: 1;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .sidebar-closed .nav-text {
          opacity: 0;
          width: 0;
          overflow: hidden;
        }

        /* Main Content */
        .modern-main-content {
          margin-top: 56px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          min-height: calc(100vh - 56px);
        }

        .modern-main-content.content-shifted-open {
          margin-left: 250px;
        }

        .modern-main-content.content-shifted-closed {
          margin-left: 64px;
        }

        /* Page Content */
        .page-content {
          flex: 1;
          padding: 32px;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        }

        /* Demo Content */
        .demo-content {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
        }

        .demo-card {
          background: white;
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          text-align: center;
          max-width: 500px;
          border: 1px solid #e2e8f0;
        }

        .demo-card h2 {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 16px;
        }

        .demo-card p {
          color: #64748b;
          margin-bottom: 24px;
          line-height: 1.6;
        }

        .demo-features {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f8fafc;
          border-radius: 8px;
          color: #475569;
          font-weight: 500;
        }

        /* Mobile Responsive */
        @media (max-width: 767px) {
          .horizontal-navbar {
            padding: 0 16px;
            height: 52px;
          }

          .modern-main-content {
            margin-top: 52px;
            min-height: calc(100vh - 52px);
          }

          .sidebar-overlay {
            top: 52px;
          }

          .modern-sidebar {
            top: 52px;
            height: calc(100vh - 52px);
            width: 100%;
            transform: translateX(-100%);
          }

          .modern-sidebar.sidebar-open {
            transform: translateX(0);
            width: 100%;
          }

          .modern-sidebar.sidebar-closed {
            transform: translateX(-100%);
            width: 100%;
          }

          .sidebar-content {
            padding: 24px;
          }

          .nav-button {
            justify-content: flex-start;
            padding: 12px 16px;
          }

          .nav-icon {
            margin-right: 12px;
          }

          .nav-text {
            opacity: 1;
            width: auto;
          }

          .title-text {
            font-size: 18px;
          }

          .user-info-display {
            display: none;
          }

          .modern-main-content.content-shifted-open,
          .modern-main-content.content-shifted-closed {
            margin-left: 0;
          }

          .page-content {
            padding: 20px;
          }

          .demo-card {
            padding: 24px;
            margin: 0 16px;
          }

          .user-dropdown-menu {
            min-width: 260px;
            right: -8px;
          }
        }

        /* Desktop Responsive */
        @media (min-width: 768px) {
          .sidebar-overlay {
            display: none; /* No overlay needed on desktop */
          }
        }

        @media (min-width: 1024px) {
          .page-content {
            padding: 20px;
          }
        }

        /* Tooltip for collapsed sidebar */
        @media (min-width: 768px) {
          .sidebar-closed .nav-button {
            position: relative;
          }

          .sidebar-closed .nav-button::after {
            content: attr(title);
            position: absolute;
            left: 100%;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: all 0.2s ease;
            margin-left: 12px;
            z-index: 1000;
          }

          .sidebar-closed .nav-button:hover::after {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;
