import React, { useState, useEffect } from "react";
import {
  LayoutDashboard, UploadCloud, FileText, ScanText,
  Link2, CheckCircle, BarChart2, Receipt, Shield,
  Home, ArrowLeft, ArrowRight, Folder, File, Users, Settings,
  HandCoins, ListChecks, BadgeCheck, XCircle
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const Sidebar = ({ collapsed, toggleCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const openMenusOnLoad = {};

    menuItems.forEach((item) => {
      if (item.children) {
        const isChildActive = item.children.some((child) =>
          location.pathname.startsWith(child.path)
        );
        if (isChildActive) {
          openMenusOnLoad[item.label] = true;
        }
      } else if (location.pathname === item.path) {
        openMenusOnLoad[item.label] = true;
      }
    });

    setOpenMenus((prev) => ({ ...prev, ...openMenusOnLoad }));
  }, [location.pathname]);

  const [openMenus, setOpenMenus] = useState({
    Input: true,
    Invoice: true,
    Admin: location.pathname.startsWith("/admin"),
  });

  const [hoveredItem, setHoveredItem] = useState(null);

  const user = { role: "Administrator", id: 1 };

  const toggleMenu = (label) => {
    setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (window.innerWidth <= 1024) {
      toggleCollapse();
    }
  };

  const menuItems = [
    { label: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={18} /> },
    {
      label: "Input", path: "/input", icon: <UploadCloud size={18} />, children: [
        { label: "Source", path: "/source", icon: <Folder size={14} /> },
        { label: "Documents", path: "/documents", icon: <File size={14} /> }
      ]
    },
    {
      label: "Invoice", path: "/invoice", icon: <FileText size={18} />, children: [
        { label: "Invoice Queue", path: "/ocr", icon: <ScanText size={14} /> },
        { label: "Reconciliation Queue", path: "/match", icon: <Link2 size={14} /> },
        { label: "Approved Invoices", path: "/completed", icon: <CheckCircle size={14} /> }
      ]
    },
    {
      label: "Reimbursement", path: "/reimbursement", icon: <HandCoins size={18} />, children: [
        { label: "Reimbursement Queue", path: "/reimbursement-queue", icon: <ListChecks size={14} /> },
        // { label: "Approved Reimbursement", path: "/approvedreimbursements", icon: <BadgeCheck size={14} /> },
        // { label: "Rejected Reimbursement", path: "/rejectedreimbursements", icon: <XCircle size={14} /> }
      ]
    },
    { label: "Reports", path: "/reports", icon: <BarChart2 size={18} /> },
    { label: "Billing", path: "/billing", icon: <Receipt size={18} /> },
    ...(user?.role === "Administrator" ? [{
      label: "Admin", path: "/admin", icon: <Shield size={18} />, children: [
        { label: "User Management", path: "/admin/userTable", icon: <Users size={14} /> },
        { label: "Configurations", path: "/admin/ExtQ", icon: <Settings size={14} /> }
      ]
    }] : [])
  ];

  return (
    <>
      <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
        <nav className="nav-menu">
          {menuItems.map((item) => {
            const isOpen = openMenus[item.label] ?? false;
            const isActive = item.children
              ? item.children.some((child) => location.pathname.startsWith(child.path))
              : location.pathname === item.path;

            const isHovered = hoveredItem === item.label;

            return (
              <div
                key={item.label}
                className="nav-item-container"
                onMouseEnter={() => setHoveredItem(item.label)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div className={`nav-item ${isActive ? "active" : ""}`} onClick={() => item.children ? toggleMenu(item.label) : handleNavigation(item.path)}>
                  <div className="nav-icon">{item.icon}</div>
                  {!collapsed && (<>
                    <span className="nav-label">{item.label}</span>
                    {item.children && (<svg className={`caret ${isOpen ? "rotated" : ""}`} width="25" height="25" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z" /></svg>)}
                  </>)}
                </div>

                {item.children && (
                  <>
                    {!collapsed && (
                      <div className={`submenu-wrapper ${isOpen ? 'open' : ''}`}>
                        <div className="submenu">{item.children.map((child) => (
                          <div key={child.path} className={`nav-subitem ${location.pathname === child.path ? "active" : ""}`} onClick={() => handleNavigation(child.path)}>
                            {child.icon && <span className="subitem-icon">{child.icon}</span>}
                            <span>{child.label}</span>
                          </div>))}
                        </div>
                      </div>
                    )}
                    {collapsed && isHovered && (
                      <div className="floating-submenu">
                        <div className="floating-submenu-header">{item.icon}<span>{item.label}</span></div>
                        <div className="floating-submenu-content">{item.children.map((child) => (
                          <div key={child.path} className={`floating-subitem ${location.pathname === child.path ? "active" : ""}`} onClick={() => handleNavigation(child.path)}>
                            {child.icon && <span className="subitem-icon">{child.icon}</span>}
                            <span>{child.label}</span>
                          </div>))}
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

      <style>{`
        :root {
          --sidebar-expanded-width: 260px;
          --sidebar-collapsed-width: 64px;
          --navbar-height: 60px;
          --main-transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .sidebar {
          width: var(--sidebar-expanded-width);
          background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
          color: #fff;
          position: fixed;
          top: var(--navbar-height);
          left: 0;
          height: calc(100vh - var(--navbar-height));
          display: flex;
          flex-direction: column;
          transition: width var(--main-transition), transform var(--main-transition);
          box-shadow: 2px 0 20px rgba(0,0,0,0.2);
          z-index: 1100;
        }
        .sidebar.collapsed { width: var(--sidebar-collapsed-width); }
        .nav-menu {
          flex: 1;
          padding: 10px 0;
          overflow-y: auto;
          overflow-x: hidden;
        }
        .sidebar.collapsed .nav-menu { overflow: visible; }
        .nav-item-container { position: relative; }
        .nav-item {
          padding: 7px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          cursor: pointer;
          transition: all var(--main-transition);
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
        .nav-item:hover::before { left: 100%; }
        .nav-item:hover {
          background: rgba(255,255,255,0.1);
          transform: translateX(4px);
        }
        .nav-item.active {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          transform: translateX(0);
        }
        .nav-item.active:hover { transform: translateX(2px); }
        .nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
          transition: transform var(--main-transition);
        }
        .nav-item:hover .nav-icon { transform: scale(1.1); }
        .nav-label { flex: 1; font-size: 14px; font-weight: 500; }
        .caret { transition: transform var(--main-transition); opacity: 0.7; }
        .caret.rotated { transform: rotate(180deg); }
        .submenu-wrapper { overflow: hidden; transition: max-height var(--main-transition), opacity var(--main-transition); max-height: 0; opacity: 0; }
        .submenu-wrapper.open { max-height: 300px; opacity: 1; }
        .submenu {
          background: rgba(0,0,0,0.2);
          margin: 4px 10px 8px 10px;
          border-radius: 8px;
          padding: 8px 0;
          border-left: 2px solid #3b82f6;
        }
        .nav-subitem {
          padding: 10px 16px;
          font-size: 13px;
          color: #cbd5e1;
          cursor: pointer;
          margin: 2px 5px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all var(--main-transition);
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
          transition: height var(--main-transition);
        }
        .nav-subitem:hover {
          background: rgba(255,255,255,0.1);
          color: #ffffff;
          transform: translateX(4px);
        }
        .nav-subitem:hover::before { height: 60%; }
        .nav-subitem.active {
          background: rgba(59, 130, 246, 0.2);
          color: #ffffff;
          font-weight: 600;
        }
        .nav-subitem.active::before { height: 100%; }
        .subitem-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          transition: all var(--main-transition);
        }
        .nav-subitem.active .subitem-icon,
        .nav-subitem:hover .subitem-icon {
          color: #ffffff;
          transform: scale(1.1);
        }
        .sidebar.collapsed .nav-item { justify-content: center; padding: 14px 0; }
        .sidebar.collapsed .nav-label, .sidebar.collapsed .caret { display: none; }

        @keyframes slideInFloat {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .floating-submenu {
          position: absolute;
          left: 88%;
          top: 0;
          min-width: 220px;
          background: linear-gradient(145deg, #1e293b, #0f172a);
          border-radius: 10px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.4);
          z-index: 1200;
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(15px);
          /* MODIFIED: Reduced margin-left to make it "stick" to the sidebar */
          margin-left: 8px;
          animation: slideInFloat 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
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
        }
        .floating-submenu-content { padding: 4px; }
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
        }
        .floating-subitem:hover {
          background: rgba(255,255,255,0.08);
          color: #ffffff;
          border-left-color: #3b82f6;
          transform: translateX(2px);
        }
        .floating-subitem.active {
          background: rgba(59, 130, 246, 0.15);
          color: #ffffff;
          font-weight: 600;
          border-left-color: #3b82f6;
        }
        .floating-subitem:hover .subitem-icon,
        .floating-subitem.active .subitem-icon {
          color: #60a5fa;
          transform: scale(1.05);
        }

        .floating-controls { position: fixed; top: 80px; left: calc(var(--sidebar-expanded-width) + 10px); display: flex; flex-direction: column; gap: 10px; transition: all var(--main-transition); z-index: 999; }
        .floating-controls.collapsed { left: calc(var(--sidebar-collapsed-width) + 10px); }
        .floating-btn { background: linear-gradient(135deg, #1e293b, #0f172a); color: white; border-radius: 50%; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2); cursor: pointer; transition: all 0.2s ease; border: 1px solid rgba(255,255,255,0.1); }
        .floating-btn:hover { background: linear-gradient(135deg, #334155, #1e293b); transform: scale(1.1) translateY(-2px); box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3); }

        @media (max-width: 1024px) {
          .sidebar { transform: translateX(-100%); }
          .sidebar:not(.collapsed) { transform: translateX(0); }
          .sidebar.collapsed { width: var(--sidebar-expanded-width); }
          .floating-submenu { dispaly:none; left :0 }
          .floating-controls { flex-direction: row; justify-content: space-around; align-items: center; left: 0; right: 0; top: auto; bottom: 0; width: 100%; height: 65px; background: #2c3e50; border-top: 1px solid #485b6f; box-shadow: 0 -2px 10px rgba(0,0,0,0.2); padding: 0 20px; gap: 15px; z-index: 1050; }
          .floating-controls.collapsed { left:0; }
          .floating-btn { background: #34495e; border: 1px solid #485b6f; border-radius: 50px; width: 50px; height: 50px; box-shadow: none; flex-shrink: 0; flex-grow: 0; }
          .floating-btn:hover { background: rgb(87, 111, 136); transform: translateY(-2px); box-shadow: none; }
          .forward-btn { display: flex; }
        }

        .nav-menu::-webkit-scrollbar { width: 4px; }
        .nav-menu::-webkit-scrollbar-track { background: transparent; }
        .nav-menu::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
      `}</style>
    </>
  );
};

export default Sidebar;