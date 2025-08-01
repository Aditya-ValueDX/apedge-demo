import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation
} from 'react-router-dom';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import ExtractionQueue from './components/queues/ExtractionQueue';
import ReconQueue from './components/queues/ReconQueue';
import Editor from './components/Editor_components/Editor';
import Login from './components/Login';
import Signup from './components/Signup';
import LandingPage from './components/LandingPage';
import NotFound from './components/NotFound';
import InProcess from './components/InProcess';
import UploadInvoice from './components/Upload/UploadInvoice';
import PrivateRoute from './PrivateRoute';
import MatchInvoice from './components/MatchInvoice';
import AdminPanel from "./components/Admin/AdminPanel";
import CompletedQueue from './components/queues/CompletedQueue';
import DocumentsPage from './components/queues/DocumentsPage';
import ReimbursementQueue from './components/queues/ReimbursementQueue';
import ViewReimbursement from './components/ViewReimbursement';


const AppWrapper = () => {
  const location = useLocation();
  const hideLayout = ['/', '/login', '/signup'].includes(location.pathname);

  const [collapsed, setCollapsed] = useState(window.innerWidth < 1024);
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0);
  const triggerSidebarRefresh = () => setSidebarRefreshKey(prev => prev + 1);
  const toggleCollapse = () => setCollapsed(!collapsed);

  React.useEffect(() => {
    if (window.innerWidth <= 1024 && !collapsed) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
  }, [collapsed]);

  return (
    <>
      {!hideLayout && <Navbar collapsed={collapsed} toggleCollapse={toggleCollapse} />}

      <div className={`app-body ${!hideLayout ? 'with-navbar' : ''}`}>
        {!hideLayout && (
          <>
            <Sidebar
              refreshKey={sidebarRefreshKey}
              collapsed={collapsed}
              toggleCollapse={toggleCollapse}
            />
            <div
              className={`sidebar-overlay ${!collapsed ? 'active' : ''}`}
              onClick={toggleCollapse}
            ></div>
          </>
        )}
        <div className={`main-content ${hideLayout ? 'full-screen' : collapsed ? 'collapsed' : ''}`}>
          <div className="content-area">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/editor/:invoiceId" element={<PrivateRoute><Editor /></PrivateRoute>} />
              <Route path="/ocr" element={<PrivateRoute><ExtractionQueue mode="ocr" /></PrivateRoute>} />
              <Route path="/match" element={<PrivateRoute><ReconQueue /></PrivateRoute>} />
              <Route path="/match/:invoiceId" element={<PrivateRoute><MatchInvoice /></PrivateRoute>} />
              <Route path="/documents" element={<PrivateRoute><DocumentsPage /></PrivateRoute>} />
              <Route path="/source" element={<PrivateRoute><UploadInvoice /></PrivateRoute>} />
              <Route path="/completed" element={<PrivateRoute><CompletedQueue /></PrivateRoute>} />
              <Route path="/billing" element={<PrivateRoute><InProcess /></PrivateRoute>} />
              <Route path="/reports" element={<PrivateRoute><InProcess /></PrivateRoute>} />
              <Route path="/admin/*" element={<PrivateRoute><AdminPanel triggerSidebarRefresh={triggerSidebarRefresh} /></PrivateRoute>} />
              <Route path="/reimbursement-queue" element={<PrivateRoute><ReimbursementQueue /></PrivateRoute>} />
              <Route path="/view-reimbursement/:id" element={<ViewReimbursement />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </div>
      </div>

      <style>{`
    :root {
      --sidebar-expanded-width: 270px;
      --sidebar-collapsed-width: 64px;
      --navbar-height: 60px;
      --mobile-nav-height: 65px;
      --main-transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    body.no-scroll { overflow: hidden; }
    .app-body { display: flex; min-height: 100vh; }
    .app-body.with-navbar { margin-top: var(--navbar-height); min-height: calc(100vh - var(--navbar-height)); }

    .main-content {
      flex: 1;
      transition: margin-left var(--main-transition);
      margin-left: var(--sidebar-expanded-width);
      min-width: 0; /* Fix for flexbox overflow */
      display: flex;
      flex-direction: column;
    }
    .main-content.collapsed { margin-left: var(--sidebar-collapsed-width); }
    .main-content.full-screen { margin-left: 0; }

    .content-area {
      flex: 1;
      background: #f8f9fa;
      /* REMOVED height: 100% to allow natural content flow */
    }

    .sidebar-overlay {
      display: none;
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 1099;
      opacity: 0; pointer-events: none;
      transition: opacity var(--main-transition);
    }

    @media (max-width: 1024px) {
      .main-content, .main-content.collapsed { margin-left: 0; }
      .sidebar-overlay { display: block; }
      .sidebar-overlay.active { opacity: 1; pointer-events: auto; }

      .content-area {
        /* Add padding at the bottom to NOT be hidden by the mobile nav bar */
        padding-bottom: var(--mobile-nav-height);
      }
    }

    @media (max-width: 768px) {
      .content-area {
        padding: 15px;
        /* Re-apply bottom padding to override shorthand */
        padding-bottom: calc(var(--mobile-nav-height) + 15px);
      }
    }
  `}</style>
    </>
  );
};

const App = () => {
  // ... (rest of App component is unchanged)
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
};

export default App;