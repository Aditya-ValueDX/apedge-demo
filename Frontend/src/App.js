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
import UploadSection from './components/bulkUp_comp/UploadSection';
import ProcessingQueue from './components/ProcessingQueue';
import ExtractionQueue from './components/queues/ExtractionQueue';
import ReconQueue from './components/queues/ReconQueue';
import Editor from './components/Editor_components/Editor';
import Login from './components/Login';
import Signup from './components/Signup';
import LandingPage from './components/LandingPage';
import NotFound from './components/NotFound';
import InProcess from './components/InProcess';
import UploadInvoice from './components/Upload/UploadInvoice';
import axios from 'axios';
import PrivateRoute from './PrivateRoute';
import MatchInvoice from './components/MatchInvoice';
import AdminPanel from "./components/Admin/AdminPanel";
import CompletedQueue from './components/queues/CompletedQueue';
import DocumentsPage from './components/queues/DocumentsPage';

const AppWrapper = () => {
  const location = useLocation();
  const hideSidebar = ['/', '/login', '/signup'].includes(location.pathname);
  const [collapsed, setCollapsed] = useState(false); // Lifted state


  // to refresh sidebar on cmd
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0);
  const triggerSidebarRefresh = () => {
    console.log("🔄 Sidebar refresh triggered");
    debugger
    setSidebarRefreshKey(prev => prev + 1);
  };

  const toggleCollapse = () => setCollapsed(!collapsed);

  return (
    <>
      {!hideSidebar && <Navbar collapsed={collapsed} toggleCollapse={toggleCollapse} />}

      <div className="app-body">
        {!hideSidebar && (
          <Sidebar
            refreshKey={sidebarRefreshKey}
            collapsed={collapsed}
            toggleCollapse={toggleCollapse}
          />
        )}
        <div
          className={`main-content ${hideSidebar ? 'full-screen' : collapsed ? 'collapsed' : ''}`}
        >
          <div className="content-area">
            <Routes>

              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Protected Routes */}
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/editor" element={<PrivateRoute><Editor /></PrivateRoute>} />
              <Route
                path="/editor/:invoiceId"
                element={<PrivateRoute><Editor /></PrivateRoute>}
              />
              <Route path="/ocr" element={<PrivateRoute><ExtractionQueue mode="ocr" /></PrivateRoute>} />
              <Route path="/match" element={<PrivateRoute><ReconQueue /></PrivateRoute>} />
              <Route path="/match/:invoiceId" element={<PrivateRoute><MatchInvoice /></PrivateRoute>} />
              <Route path="/documents" element={<PrivateRoute><DocumentsPage /></PrivateRoute>} />
              <Route path="/source" element={<PrivateRoute><UploadInvoice /></PrivateRoute>} />
              <Route path="/completed" element={<PrivateRoute><CompletedQueue /></PrivateRoute>} />
              <Route path="/billing" element={<PrivateRoute><InProcess /></PrivateRoute>} />
              <Route path="/reports" element={<PrivateRoute><InProcess /></PrivateRoute>} />
              <Route path="/admin/*" element={<PrivateRoute><AdminPanel triggerSidebarRefresh={triggerSidebarRefresh} /></PrivateRoute>} />
              <Route
                path="/both"
                element={
                  <PrivateRoute>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '40px',
                        padding: '20px',
                      }}
                    >
                      <ProcessingQueue mode="ocr" />
                      <ProcessingQueue mode="processing" />
                    </div>
                  </PrivateRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </div>
      </div>

      <style>{`
    .app-body {
      display: flex;
      min-height: calc(100vh - 56px); /* Adjust height to leave space for navbar */
    }

    .main-content {
      flex: 1;
      overflow-y: auto;
      transition: margin-left 0.3s ease;
      margin-left: 250px;
    }

    .main-content.collapsed {
      margin-left: 64px;
    }

    .main-content.full-screen {
      margin-left: 0;
    }

    .content-area {
      flex: 1;
      background: #f8f9fa;
      height: 100%;
    }

    @media (max-width: 768px) {
      .main-content.collapsed,
      .main-content {
        margin-left: 0;
      }
    }
  `}</style>
    </>

  );
};

const App = () => {
  // Log invoice data once (optional)
  React.useEffect(() => {
    axios.get('http://localhost:5000/api/invoices/')
      .then(response => console.log(response.data))
      .catch(error => console.error("API error:", error));
  }, []);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppWrapper />
    </Router>
  );
};

export default App;
