// components/Admin/AdminDashboard.js
import React, { useEffect, useState } from 'react';


const AdminDashboard = ({ adminData }) => {

  // const [adminData, setAdminData] = useState(null);
  const [tableConfig, setTableConfig] = useState({});
  const [tableConfigGenerated, setTableConfigGenerated] = useState(false);
  const doesTableExist = (localStorage.getItem("table_config_generated") === "true");
  useEffect(() => {
    const savedConfig = localStorage.getItem("invoice_table_config");
    const isGenerated = localStorage.getItem("table_config_generated") === "true";

    if (savedConfig) {
      setTableConfig(JSON.parse(savedConfig));
      setTableConfigGenerated(isGenerated);
    }
  }, []);

  if (!adminData) return <p>Loading...</p>;

  return (
    <div className="admin-dashboard">
      <h2 className="welcome">Welcome, {adminData.name}</h2>
      {!doesTableExist ? (
        <h5 className="Warn">
          Your Processes are not configured yet, select Configure option in menu
        </h5>
      ) : null}
      {/* Optional User Table */}

      {/* {!tableConfigGenerated ? (
        <InvoiceStrucDef
          setTableConfig={setTableConfig}
          setTableConfigGenerated={setTableConfigGenerated}
        />
      ) : (
        <InvoiceTablePreview config={tableConfig} />
      )} */}

      <style>{`
      .Warn {
  color: #e67e22;
  background: #fff7e6;
  padding: 10px 14px;
  border-left: 4px solid #e67e22;
  border-radius: 4px;
  margin: 10px 0;
}

        .admin-dashboard {
          padding: 24px;
          background: #f9f9fb;
        }

        .welcome {
          font-size: 22px;
          color: #2c3e50;
          margin-bottom: 16px;
        }

        .section-title {
          margin-top: 20px;
          margin-bottom: 10px;
          font-size: 18px;
          color: #34495e;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;