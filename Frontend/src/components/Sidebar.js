import React, { useState, useEffect } from "react";
import {
  LayoutDashboard, UploadCloud, FileText, ScanText,
  Link2, CheckCircle, BarChart2, Receipt, Shield,
  Home, ArrowLeft, ArrowRight, Folder, File, Search, Users, Settings
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const Sidebar = ({ collapsed, toggleCollapse, refreshKey }) => {
  const navigate = useNavigate();
  const location = useLocation();


  const [openMenus, setOpenMenus] = useState({
    Input: true,
    Invoice: true,
    Admin: location.pathname.startsWith("/admin"),
  });

  const [isGenerated, setIsGenerated] = useState(true); // Demo purposes
  const [hoveredItem, setHoveredItem] = useState(null);

  const user = { role: "Administrator", id: 1 }; // Demo user

  const toggleMenu = (label) => {
    setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const menuItems = [];

  if (isGenerated) {
    menuItems.push(
      {
        label: "Dashboard",
        path: "/dashboard",
        icon: <LayoutDashboard size={18} />
      },
      {
        label: "Input",
        path: "/input",
        icon: <UploadCloud size={18} />,
        children: [
          { label: "Source", path: "/source", icon: <Folder size={14} /> },
          { label: "Documents", path: "/documents", icon: <File size={14} /> }
        ]
      },
      {
        label: "Invoice",
        path: "/invoice",
        icon: <FileText size={18} />,
        children: [
          { label: "Invoice Queue", path: "/ocr", icon: <ScanText size={14} /> },
          { label: "Reconciliation Queue", path: "/match", icon: <Link2 size={14} /> },
          { label: "Approved Invoices", path: "/completed", icon: <CheckCircle size={14} /> }
        ]
      },
      {
        label: "Reports",
        path: "/reports",
        icon: <BarChart2 size={18} />
      },
      {
        label: "Billing",
        path: "/billing",
        icon: <Receipt size={18} />
      }
    );
  }

  if (user?.role === "Administrator") {
    menuItems.push({
      label: "Admin",
      path: "/admin",
      icon: <Shield size={18} />,
      children: [
        { label: "User Management", path: "/admin/userTable", icon: <Users size={14} /> },
        { label: "Configure EX Table", path: "/admin/ExtQ", icon: <Settings size={14} /> }
      ]
    });
  }

  return (
    <>
      <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
        {/* <div className="brand-toggle" onClick={toggleCollapse}>
          <span className="brand-logo">{collapsed ? "AP" : "APEdge"}</span>
        </div> */}

        <nav className="nav-menu">
          {menuItems.map((item, index) => {
            const isOpen = openMenus[item.label];
            const isActive =
              location.pathname.startsWith(item.path) ||
              (item.children && item.children.some(child => location.pathname === child.path));
            const isHovered = hoveredItem === item.label;

            return (
              <div
                key={item.label}
                className="nav-item-container"
                onMouseEnter={() => setHoveredItem(item.label)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div
                  className={`nav-item ${isActive ? "active" : ""}`}
                  onClick={() =>
                    item.children ? toggleMenu(item.label) : navigate(item.path)
                  }
                >
                  <div className="nav-icon">{item.icon}</div>
                  {!collapsed && (
                    <>
                      <span className="nav-label">{item.label}</span>
                      {item.children && (
                        <svg
                          className={`caret ${isOpen ? "rotated" : ""}`}
                          width="25"
                          height="25"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M7 10l5 5 5-5z" />
                        </svg>

                      )}
                    </>
                  )}
                </div>

                {item.children && (
                  <>
                    {/* Regular submenu for expanded sidebar */}
                    {!collapsed && (
                      <div className={`submenu-wrapper ${isOpen ? 'open' : ''}`}>
                        <div className="submenu">
                          {item.children.map((child) => (
                            <div
                              key={child.path}
                              className={`nav-subitem ${location.pathname === child.path ? "active" : ""}`}
                              onClick={() => navigate(child.path)}
                            >
                              {child.icon && <span className="subitem-icon">{child.icon}</span>}
                              <span>{child.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Floating submenu for collapsed sidebar */}
                    {collapsed && isHovered && (
                      <div className="floating-submenu">
                        <div className="floating-submenu-header">
                          {item.icon}
                          <span>{item.label}</span>
                        </div>
                        <div className="floating-submenu-content">
                          {item.children.map((child) => (
                            <div
                              key={child.path}
                              className={`floating-subitem ${location.pathname === child.path ? "active" : ""}`}
                              onClick={() => navigate(child.path)}
                            >
                              {child.icon && <span className="subitem-icon">{child.icon}</span>}
                              <span>{child.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      <div className="floating-controls">
        <div className="floating-btn" onClick={toggleCollapse}>
          {collapsed ? "☰" : "✖"}
        </div>
        <div className="floating-btn" onClick={() => navigate("/dashboard")}>
          <Home size={18} />
        </div>
        <div className="floating-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </div>
        <div className="floating-btn" onClick={() => navigate(1)}>
          <ArrowRight size={18} />
        </div>
      </div>

      <style>{`
        :root {
          --sidebar-expanded: 250px;
          --sidebar-collapsed: 64px;
          --floating-offset: 10px;
          --transition-duration: 0.3s;
          --transition-timing: cubic-bezier(0.4, 0, 0.2, 1);
        }

        .sidebar {
          width: var(--sidebar-expanded);
          background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
          color: #fff;
          height: 100vh;
          position: fixed;
          top: 56px;
          left: 0;
          display: flex;
          flex-direction: column;
          transition: width var(--transition-duration) var(--transition-timing),
                      transform var(--transition-duration) var(--transition-timing);
          transform: translateX(0);
          box-shadow: 2px 0 20px rgba(0,0,0,0.2);
          z-index: 100;
          backdrop-filter: blur(10px);
        }

        .sidebar.collapsed {
          width: var(--sidebar-collapsed);
        }

        @media (max-width: 768px) {
          .sidebar {
            width: 100vw;
            transform: translateX(0);
          }
          .sidebar.collapsed {
            transform: translateX(-100%);
          }
        }

        .brand-logo {
          transition: all var(--transition-duration) ease;
        }

        .nav-menu {
          flex: 1;
          padding: 10px 0;
          overflow-y: auto;

        }

        .nav-item-container {
          position: relative;
        }

        .nav-item {
          padding: 7px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          cursor: pointer;
          transition: all var(--transition-duration) var(--transition-timing);
          margin: 2px 8px;
          border-radius: 12px;
          position: relative;
          overflow: hidden;
        }

        .nav-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          transition: left 0.5s ease;
        }

        .nav-item:hover::before {
          left: 100%;
        }

        .nav-item:hover {
          background: rgba(255,255,255,0.1);
          transform: translateX(4px);
        }

        .nav-item.active {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          transform: translateX(0);
        }

        .nav-item.active:hover {
          transform: translateX(2px);
        }

        .nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
          transition: transform var(--transition-duration) ease;
        }

        .nav-item:hover .nav-icon {
          transform: scale(1.1);
        }

        .nav-label {
          flex: 1;
          font-size: 14px;
          font-weight: 500;
          transition: opacity var(--transition-duration) ease;
        }

        .caret {
          transition: transform var(--transition-duration) var(--transition-timing);
          opacity: 0.7;
          transform-origin: center;
          margin-left: auto;
        }

        .caret.rotated {
          transform: rotate(180deg);
        }

        .submenu-wrapper {
          overflow: hidden;
          transition: max-height var(--transition-duration) var(--transition-timing),
                      opacity var(--transition-duration) var(--transition-timing);
          max-height: 0;
          opacity: 0;
        }

        .submenu-wrapper.open {
          max-height: 300px;
          opacity: 1;
        }

        .submenu {
          background: rgba(0,0,0,0.2);
          margin: 4px 12px 8px 12px;
          border-radius: 8px;
          padding: 8px 0;
          border-left: 2px solid #3b82f6;
        }

        .nav-subitem {
          padding: 10px 16px;
          font-size: 13px;
          color: #cbd5e1;
          cursor: pointer;
          margin: 2px 8px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all var(--transition-duration) var(--transition-timing);
          position: relative;
        }

        .nav-subitem::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          width: 4px;
          height: 0;
          background: #3b82f6;
          border-radius: 2px;
          transform: translateY(-50%);
          transition: height var(--transition-duration) ease;
        }

        .nav-subitem:hover {
          background: rgba(255,255,255,0.1);
          color: #ffffff;
          transform: translateX(4px);
        }

        .nav-subitem:hover::before {
          height: 60%;
        }

        .nav-subitem.active {
          background: rgba(59, 130, 246, 0.2);
          color: #ffffff;
          font-weight: 600;
        }

        .nav-subitem.active::before {
          height: 100%;
        }

        .subitem-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          transition: all var(--transition-duration) ease;
        }

        .nav-subitem.active .subitem-icon,
        .nav-subitem:hover .subitem-icon {
          color: #ffffff;
          transform: scale(1.1);
        }

        /* FIXED: Floating submenu for collapsed sidebar */
        .floating-submenu {
  position: fixed;
  left: calc(var(--sidebar-collapsed));
  top: auto;
  min-width: 200px;
  max-width: 280px;
  background: linear-gradient(145deg, #1e293b, #0f172a);
  border-radius: 10px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.4);
  z-index: 1001; /* Increased to appear above floating controls */
  border: 1px solid rgba(255,255,255,0.1);
  backdrop-filter: blur(15px);
  overflow: hidden;
  animation: slideInFloat 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  pointer-events: auto;
  opacity: 1;
  visibility: visible;
}

        /* Hide floating submenu by default in collapsed mode */
        .sidebar.collapsed .floating-submenu {
          display: none;
          opacity: 0;
          visibility: hidden;
        }

        /* Show floating submenu on hover in collapsed mode */
.sidebar.collapsed .nav-item-container:hover .floating-submenu {
  display: block !important;
  opacity: 1 !important;
  visibility: visible !important;
  pointer-events: auto !important;
}

        /* Keep submenu visible when hovering over the submenu itself */
        .sidebar.collapsed .floating-submenu:hover {
          display: block !important;
          opacity: 1 !important;
          visibility: visible !important;
          pointer-events: auto !important;
        }

        @keyframes slideInFloat {
          from {
            opacity: 0;
            transform: translateX(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        .floating-submenu-header {
  padding: 12px 14px;
  background: rgba(59, 130, 246, 0.12);
  border-bottom: 1px solid rgba(255,255,255,0.08);
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 13px;
  color: #60a5fa;
  backdrop-filter: blur(5px);
}

        .floating-submenu-content {
          padding: 4px 0;
        }

        .floating-subitem {
          padding: 10px 14px;
          font-size: 13px;
          color: #cbd5e1;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.15s ease;
          border-left: 3px solid transparent;
          position: relative;
        }

        .floating-subitem::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          width: 0;
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, rgba(59, 130, 246, 0.3));
          transition: width 0.2s ease;
        }

        .floating-subitem:hover {
          background: rgba(255,255,255,0.08);
          color: #ffffff;
          border-left-color: #3b82f6;
          transform: translateX(2px);
        }

        .floating-subitem:hover::before {
          width: 3px;
        }

        .floating-subitem.active {
          background: rgba(59, 130, 246, 0.15);
          color: #ffffff;
          font-weight: 600;
          border-left-color: #3b82f6;
        }

        .floating-subitem.active::before {
          width: 3px;
        }

        .floating-subitem .subitem-icon {
          color: #94a3b8;
          transition: all 0.15s ease;
        }

        .floating-subitem:hover .subitem-icon,
        .floating-subitem.active .subitem-icon {
          color: #60a5fa;
          transform: scale(1.05);
        }

        /* Collapsed sidebar styles */
        .sidebar.collapsed .nav-item {
          justify-content: center;
          padding: 14px 0;
          margin: 2px 4px;
        }

        .sidebar.collapsed .nav-icon {
          margin: 0;
        }

        .sidebar.collapsed .nav-label,
        .sidebar.collapsed .caret {
          display: none;
        }

        .sidebar.collapsed .nav-item.active {
          border-radius: 12px;
        }

        /* Enhanced hover area for better UX */
        .sidebar.collapsed .nav-item-container {
          position: relative;
        }

        .sidebar.collapsed .nav-item-container::after {
          content: '';
          position: absolute;
          top: 0;
          right: -12px;
          width: 12px;
          height: 100%;
          background: transparent;
          z-index: 999;
        }

        /* Floating controls */
        .floating-controls {
          position: fixed;
          top: 80px;
          left: calc(var(--sidebar-expanded) + var(--floating-offset));
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: left var(--transition-duration) var(--transition-timing);
          z-index: 50;
        }

        .sidebar.collapsed ~ .floating-controls {
          left: calc(var(--sidebar-collapsed) + var(--floating-offset));
        }

        .floating-btn {
          background: linear-gradient(135deg, #1e293b, #0f172a);
          color: white;
          border-radius: 50%;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
          cursor: pointer;
          transition: all var(--transition-duration) var(--transition-timing);
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
        }

        .floating-btn:hover {
          background: linear-gradient(135deg, #334155, #1e293b);
          transform: scale(1.1) translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        }

        .floating-btn:active {
          transform: scale(1.05) translateY(0);
        }

        @media (max-width: 768px) {
          .sidebar {
            width: 100vw;
            z-index: 999;
          }
          .sidebar.collapsed {
            transform: translateX(-100%);
          }
          .floating-controls {
            left: 12px;
          }
          .floating-submenu {
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            max-width: 90vw;
          }
        }

        /* Scrollbar styling */
        .nav-menu::-webkit-scrollbar {
          width: 4px;
        }

        .nav-menu::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.1);
        }

        .nav-menu::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.3);
          border-radius: 2px;
        }

        .nav-menu::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.5);
        }
          /* Adjust top positioning to avoid overlapping floating controls */
.sidebar.collapsed .nav-item-container:nth-child(1) .floating-submenu {
  top: 0px;
}
.sidebar.collapsed .nav-item-container:nth-child(2) .floating-submenu {
  top: 60px;
}
.sidebar.collapsed .nav-item-container:nth-child(3) .floating-submenu {
  top: 110px;
}
.sidebar.collapsed .nav-item-container:nth-child(4) .floating-submenu {
  top: 0px;
}
.sidebar.collapsed .nav-item-container:nth-child(5) .floating-submenu {
  top: 0px;
}
.sidebar.collapsed .nav-item-container:nth-child(6) .floating-submenu {
  top: 250px;
}
.sidebar.collapsed .nav-item-container:nth-child(7) .floating-submenu {
  top: 0px;
}

@media (max-width: 1024px) {
  :root {
    --sidebar-expanded: 220px;
  }

  .sidebar {
    width: var(--sidebar-expanded);
    position: fixed;
    top: 56px;
    left: 0;
    height: calc(100vh - 56px);
    z-index: 999;
    transition: transform 0.3s ease;
  }

  .sidebar.collapsed {
    transform: translateX(-100%);
  }

  .floating-controls {
    left: var(--floating-offset);
    top: 60px;
    flex-direction: row;
    background: rgba(15, 23, 42, 0.9);
    padding: 6px;
    border-radius: 12px;
    backdrop-filter: blur(8px);
  }

  .floating-btn {
    width: 40px;
    height: 40px;
  }

  .floating-submenu {
    position: fixed;
    left: 60px;
    top: auto;
    bottom: auto;
    right: 10px;
    max-width: 90vw;
    z-index: 1001;
  }
}

      `}</style>
    </>
  );
};

export default Sidebar;