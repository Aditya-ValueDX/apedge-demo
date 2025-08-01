// AdminPanel.js
import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminDashboard from "./AdminDashboard";
import UserTable from "./UserTable";
import InvoiceStrucDef from "./InvoiceStrucDef2";
import axios from 'axios';
import { BASE_URL } from '../../config'; // Import BASE_URL

const AdminPanel = ({triggerSidebarRefresh}) => {
  const adminData = JSON.parse(sessionStorage.getItem("user"));
  const adminId = adminData.id;
  //  const [adminId, setadminId] = useState(adminData.id);
  
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshKeyUP, setRefreshKeyUP] = useState(0);
  
  const triggerRefresh = () => {setRefreshKey(prev => prev + 1);}
  const triggerRefreshUP = () => {setRefreshKeyUP(prev => prev + 1);}

  // to load all clerks and set it to the table//////////////////////////////////////////////////////////
  const [clerks, setClerks] = useState([]);
  useEffect(() => {
    const admin = JSON.parse(sessionStorage.getItem("user"));
    if (!admin || admin.role !== "Administrator") return;
    
    axios.get(`${BASE_URL}/api/users`)
    .then(res => {
      const clerks = res.data.filter(
        u => u.role === "User" && u.adminId === admin.id
      );
      setClerks(clerks);
    })
    .catch(err => console.error("❌ Failed to fetch clerks:", err));
  }, [refreshKey]); // ✅ triggers whenever refreshKey updates
  
  ////////////////////////////////////////////////////////////////////////////

  // to check if the admin has generated the table or not ////////////////////




// Load the table config and pass it to the component///////////////////////////

///////////////////////////////////////////////////////////////////////////////

  if (!adminData) return <p>Loading Admin Data...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <Routes>
        <Route path="/" element={<AdminDashboard  adminData={adminData} />} />

               <Route path="/userTable" element={<UserTable clerks_data={clerks} refreshKey={refreshKey} triggerRefresh={triggerRefresh} />} />
 <Route path="/ExtQ" element={
            
              <InvoiceStrucDef key={refreshKeyUP} triggerRefreshUP={triggerRefreshUP} triggerRefresh={triggerRefresh}  triggerSidebarRefresh={triggerSidebarRefresh}/>
           
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
};

export default AdminPanel;