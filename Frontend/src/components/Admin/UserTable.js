import React, { useState, useEffect, useRef } from "react";
import axios from 'axios';
import { BASE_URL } from '../../config'; // Import BASE_URL

const UserTable = ({ clerks_data = [], triggerRefresh }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingClerk, setEditingClerk] = useState(null); // State to hold clerk being edited

  const dialogRef = useRef(null);

  const [newClerk, setNewClerk] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "Clerk",
  });

  useEffect(() => {
    if (showDialog) {
      const timer = setTimeout(() => {
        setDialogVisible(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setDialogVisible(false);
    }
  }, [showDialog]);

  // Effect to populate form when editingClerk changes
  useEffect(() => {
    if (editingClerk) {
      setNewClerk({
        name: editingClerk.name || "",
        email: editingClerk.email || "",
        phone: editingClerk.contact || "", // Note: API uses 'contact' for phone
        password: "", // Password should ideally not be pre-filled for security
        role: editingClerk.role || "Clerk",
      });
      setShowDialog(true); // Open dialog for editing
    } else {
      // Reset form when not editing
      setNewClerk({
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "Clerk",
      });
    }
  }, [editingClerk]);


  const handleDialogChange = (key, value) => {
    setNewClerk((prev) => ({ ...prev, [key]: value }));
  };

  const handleOpenEditDialog = (clerk) => {
    setEditingClerk(clerk); // Set the clerk to be edited
  };

  const handleCloseDialog = () => {
    setDialogVisible(false);
    setTimeout(() => {
      setShowDialog(false);
      setEditingClerk(null); // Clear editing state
      setNewClerk({ // Reset form fields
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "Clerk",
      });
      setShowPassword(false); // Hide password
    }, 300);
  };

  const handleSubmitClerk = async () => {
    const { name, email, phone, password, role } = newClerk;

    if (!name || !email || !phone || !role) { // Password can be optional for edit
      // Using a custom modal or toast instead of alert
      // alert("Please fill all required fields.");
      console.log("Please fill all required fields.");
      return;
    }

    // Email existence check only when adding or if email is changed during edit
    if (!editingClerk || (editingClerk && editingClerk.email.toLowerCase() !== email.toLowerCase())) {
        const emailExists = clerks_data.some(
            (c) => c.email.toLowerCase() === email.toLowerCase()
        );
        if (emailExists) {
            // Using a custom modal or toast instead of alert
            // alert("Email already exists!");
            console.log("Email already exists!");
            return;
        }
    }


    const sessionUser = JSON.parse(sessionStorage.getItem("user"));
    if (!sessionUser) {
      // Using a custom modal or toast instead of alert
      // alert("Session expired. Please login again.");
      console.log("Session expired. Please login again.");
      return;
    }

    try {
      if (editingClerk) {
        // --- EDIT EXISTING CLERK ---
        await axios.put(`${BASE_URL}/api/update-clerk/${editingClerk.id}`, {
          companyName: sessionUser.companyName,
          email,
          contact: phone,
          password: password || editingClerk.password, // Only update password if provided
          role,
          adminId: sessionUser.id,
          name
        });
        // Using a custom modal or toast instead of alert
        // alert("Clerk updated successfully!");
        console.log("Clerk updated successfully!");
      } else {
        // --- ADD NEW CLERK ---
        if (!password) { // Password is required for new clerk
          // Using a custom modal or toast instead of alert
          // alert("Please provide a password for the new clerk.");
          console.log("Please provide a password for the new clerk.");
          return;
        }

        const maxIdNum = clerks_data.reduce((max, clerk) => {
          const idNum = parseInt(clerk.id?.replace('CID', '') || '0', 10);
          return isNaN(idNum) ? max : Math.max(max, idNum);
        }, 100);
        const newId = `CID${maxIdNum + 1}`;

        await axios.post(`${BASE_URL}/api/add-new-clerk`, {
          id: newId,
          companyName: sessionUser.companyName,
          email,
          contact: phone,
          password,
          role,
          adminId: sessionUser.id,
          name
        });
        // Using a custom modal or toast instead of alert
        // alert("Clerk added successfully!");
        console.log("Clerk added successfully!");
      }
      triggerRefresh();
      handleCloseDialog(); // Close dialog and reset state
    } catch (err) {
      console.error("❌ Operation failed:", err);
      // Using a custom modal or toast instead of alert
      // alert(`Failed to ${editingClerk ? "update" : "add"} clerk. Check console for details.`);
      console.log(`Failed to ${editingClerk ? "update" : "add"} clerk. Check console for details.`);
    }
  };

  return (
    <>
      <div className="table-container">
        <div className="header-section">
          <h3 className="section-title">Your Clerks</h3>
          <button
            className="create-button"
            onClick={() => {
              setEditingClerk(null); // Ensure no clerk is being edited when opening to add
              setShowDialog(true);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="button-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span>Create Clerk</span>
          </button>
        </div>

        {showDialog && (
          <div className="dialog-overlay">
            <div className={`dialog-box ${dialogVisible ? 'is-visible' : ''}`} ref={dialogRef}>
              <h3 className="dialog-title">{editingClerk ? "Edit Clerk Details" : "Add New Clerk"}</h3>
              <div className="dialog-form">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={newClerk.name}
                  onChange={(e) => handleDialogChange("name", e.target.value)}
                  className="dialog-input"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newClerk.email}
                  onChange={(e) => handleDialogChange("email", e.target.value)}
                  className="dialog-input"
                />
                <input
                  type="text"
                  placeholder="Phone Number"
                  value={newClerk.phone}
                  onChange={(e) => handleDialogChange("phone", e.target.value)}
                  className="dialog-input"
                />
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={editingClerk ? "New Password (leave blank to keep current)" : "Password"}
                    value={newClerk.password}
                    onChange={(e) => handleDialogChange("password", e.target.value)}
                    className="dialog-input"
                  />
                  <button
                    type="button"
                    className="password-toggle-button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L10 9.172l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM5.111 5.111l2.41 2.41A6 6 0 0113.477 14.89L15 16.293A8 8 0 105.11 5.11z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
                <select
                  value={newClerk.role}
                  onChange={(e) => handleDialogChange("role", e.target.value)}
                  className="dialog-input dialog-select"
                >
                  <option value="Clerk">Clerk</option>
                </select>
              </div>
              <div className="dialog-actions">
                <button
                  className="button-secondary"
                  onClick={handleCloseDialog}
                >
                  Cancel
                </button>
                <button
                  className="button-primary"
                  onClick={handleSubmitClerk}
                >
                  {editingClerk ? "Save Changes" : "Add Clerk"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="table-wrapper">
          <table className="clerk-table">
            <thead>
              <tr>
                <th>Sr No</th>
                <th>Clerk ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th> {/* Added Actions column */}
              </tr>
            </thead>
            <tbody>
              {clerks_data.length > 0 ? (
                clerks_data.map((clerk, idx) => (
                  <tr key={clerk.id}>
                    <td className="whitespace-nowrap">{idx + 1}</td>
                    <td>{clerk.id}</td>
                    <td>{clerk.name}</td>
                    <td>{clerk.contact}</td>
                    <td>{clerk.email}</td>
                    <td>
                      <span className="role-badge">
                        {clerk.role}
                      </span>
                    </td>
                    <td>
                      <button
                        className="action-button edit-button"
                        onClick={() => handleOpenEditDialog(clerk)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="no-clerks-message">No clerks found. Click "Create Clerk" to add one.</td> {/* Updated colspan */}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <style>{`


        /* Table Container */
        .table-container {
          padding: 1.5rem;
          max-width: 100%;
          box-sizing: border-box;
          margin: 10px;
        }

        /* Header Section */
        .header-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .section-title {
          font-size: 1.875rem; /* ~30px */
          font-weight: 800; /* extra bold */
          color: #1a202c; /* dark gray text */
          margin: 0;
        }

        /* Create Button */
        .create-button {
          padding: 0.75rem 1.5rem;
          background-color: #2b6cb0; /* blue-600 */
          color: white;
          font-weight: 600;
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: background-color 0.3s ease, box-shadow 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border: none;
          cursor: pointer;
        }

        .create-button:hover {
          background-color: #2c5282; /* blue-700 */
          box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
        }

        .create-button:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.5);
        }

        .button-icon {
          height: 1.25rem;
          width: 1.25rem;
        }

        /* Dialog Overlay */
        .dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.5); /* Semi-transparent black overlay */
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000; /* Ensure it's on top of everything */
          padding: 1rem;
          box-sizing: border-box;
        }

        /* Dialog Box */
        .dialog-box {
          background-color: white;
          border-radius: 0.75rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          padding: 2rem;
          width: 100%;
          max-width: 28rem; /* Max width for the dialog */
          
          /* Initial state for transition */
          opacity: 0;
          transform: scale(0.9); /* Start slightly smaller */
          transition: opacity 0.3s ease-out, transform 0.3s ease-out; /* Smooth transition */
        }

        /* Class applied when dialog should be visible */
        .dialog-box.is-visible {
          opacity: 1;
          transform: scale(1); /* End at full size */
        }

        .dialog-title {
          font-size: 1.5rem; /* ~24px */
          font-weight: 700;
          color: #1a202c;
          margin-bottom: 1.5rem;
        }

        .dialog-form {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
          margin-bottom: 1.5rem;
        }

        .dialog-input {
          padding: 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          width: 100%;
          box-sizing: border-box; /* Ensures padding doesn't increase total width */
        }

        .dialog-input:focus {
          outline: none;
          border-color: #3182ce; /* blue-500 */
          box-shadow: 0 0 0 1px #3182ce;
        }

        /* Password input specific styling */
        .password-input-wrapper {
            position: relative;
            display: flex;
            align-items: center;
            width: 100%;
        }

        .password-input-wrapper .dialog-input {
            padding-right: 3rem; /* Make space for the icon */
        }

        .password-toggle-button {
            position: absolute;
            right: 0.75rem;
            background: none;
            border: none;
            cursor: pointer;
            padding: 0.25rem;
            color: #6b7280; /* gray-500 */
            transition: color 0.2s ease;
        }

        .password-toggle-button:hover {
            color: #1a202c; /* dark gray on hover */
        }

        .password-toggle-button svg {
            height: 1.25rem;
            width: 1.25rem;
        }


        .dialog-select {
          background-color: white;
          appearance: none; /* Remove default select arrow */
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd' /%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          background-size: 1.5em;
          padding-right: 2.5rem; /* Make space for the custom arrow */
        }

        .dialog-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
        }

        .button-primary,
        .button-secondary {
          padding: 0.625rem 1.25rem;
          font-weight: 600;
          border-radius: 0.5rem;
          border: none;
          cursor: pointer;
          transition: background-color 0.3s ease, box-shadow 0.3s ease;
        }

        .button-primary {
          background-color: #38a169; /* green-600 */
          color: white;
        }

        .button-primary:hover {
          background-color: #2f855a; /* green-700 */
        }

        .button-primary:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(56, 161, 105, 0.5);
        }

        .button-secondary {
          background-color: #e2e8f0; /* gray-200 */
          color: #4a5568; /* gray-700 */
        }

        .button-secondary:hover {
          background-color: #cbd5e0; /* gray-300 */
        }

        .button-secondary:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(113, 128, 150, 0.5);
        }

        /* Table Styles */
        .table-wrapper {
          background-color: white;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          border-radius: 0.75rem;
          overflow-x: auto; /* Enable horizontal scrolling on small screens */
        }

        .clerk-table {
          width: 100%;
          border-collapse: collapse;
          line-height: 1.5;
        }

        .clerk-table thead tr {
          background-color: #f7fafc;
          color: #4a5568;
          text-transform: uppercase;
          font-size: 0.875rem;
          line-height: 1.25rem;
        }

        .clerk-table th {
          padding: 0.75rem 1.5rem;
          text-align: left;
          font-weight: 600;
        }

        .clerk-table tbody tr {
          border-bottom: 1px solid #e2e8f0;
          color: #4a5568;
          font-size: 0.875rem;
          font-weight: 300;
        }

        .clerk-table tbody tr:hover {
          background-color: #f9fafb;
        }

        .clerk-table td {
          padding: 0.75rem 1.5rem;
          text-align: left;
        }

        .whitespace-nowrap {
          white-space: nowrap;
        }

        .role-badge {
          position: relative;
          display: inline-block;
          padding: 0.25rem 0.75rem;
          font-weight: 600;
          color: #276749;
          line-height: 1.25;
        }

        .role-badge::before {
          content: "";
          position: absolute;
          inset: 0;
          background-color: #b7e4c7;
          opacity: 0.5;
          border-radius: 9999px;
          z-index: 0;
        }

        .role-badge > span {
          position: relative;
          z-index: 1;
        }

        .no-clerks-message {
          padding-top: 1rem;
          padding-bottom: 1rem;
          text-align: center;
          color: #718096;
        }

        /* Actions Button */
        .action-button {
          padding: 0.4rem 0.8rem;
          font-size: 0.8rem;
          border-radius: 0.3rem;
          cursor: pointer;
          border: 1px solid transparent;
          transition: background-color 0.2s ease, border-color 0.2s ease;
        }

        .edit-button {
          background-color: #3182ce; /* blue-500 */
          color: white;
        }

        .edit-button:hover {
          background-color: #2c5282; /* blue-700 */
        }


        /* Responsive adjustments for smaller screens */
        @media (max-width: 768px) {
          .table-container {
            padding: 1rem;
          }
          .header-section {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          .create-button {
            width: 100%;
            justify-content: center;
          }
          .clerk-table th,
          .clerk-table td {
            padding: 0.5rem 0.75rem;
            font-size: 0.75rem;
          }
          .section-title {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </>
  );
};

export default UserTable;
