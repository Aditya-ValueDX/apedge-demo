// src/pages/MasterData.js
import React, { useState } from 'react';
import { Upload, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { USER_ROLES, API_BASE_URL } from '../utils/config';
import AddEditModal from '../components/AddEditModal'; // Import the new modal
import ConfirmDeleteModal from '../components/ConfirmDeleteModal'; // Import the new modal

const MasterData = ({ navigateTo, userRole }) => {
  const [activeTab, setActiveTab] = useState('users');

  const [users, setUsers] = useState([
    { id: 'user1', name: 'John Doe', email: 'john.doe@example.com', designation: 'Software Engineer', manager: 'Jane Smith', tenant: 'IT' },
    { id: 'user2', name: 'Jane Smith', email: 'jane.smith@example.com', designation: 'Engineering Manager', manager: 'Robert Johnson', tenant: 'IT' },
    { id: 'user3', name: 'Alice Brown', email: 'alice.brown@example.com', designation: 'Marketing Specialist', manager: 'Jane Smith', tenant: 'Marketing' },
  ]);
  const [designations, setDesignations] = useState([
    { id: 'desig1', name: 'Software Engineer' },
    { id: 'desig2', name: 'Engineering Manager' },
    { id: 'desig3', name: 'Marketing Specialist' },
  ]);
  const [billTypes, setBillTypes] = useState([
    { id: 'bt1', name: 'Travel' },
    { id: 'bt2', name: 'Food' },
    { id: 'bt3', name: 'Office Supplies' },
    { id: 'bt4', name: 'Software' },
  ]);
  const [vendors, setVendors] = useState([
    { id: 'ven1', name: 'Uber' },
    { id: 'ven2', name: 'Cafe Delight' },
    { id: 'ven3', name: 'Stationery Mart' },
  ]);

  // State for Add/Edit Modal
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState(null); // Item being edited, null for adding
  const [modalDataType, setModalDataType] = useState(''); // e.g., 'users', 'designations'

  // State for Delete Confirmation Modal
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [itemToDeleteInfo, setItemToDeleteInfo] = useState(null); // { id, dataType, name }

  if (userRole !== USER_ROLES.ADMIN) {
    return (
      <div className="text-center py-10 text-red-600 font-bold text-xl">
        Access Denied: You do not have permission to view this page.
      </div>
    );
  }

  const handleFileUpload = (e, dataType) => {
    const file = e.target.files[0];
    if (file) {
      console.log(`Simulating upload for ${dataType}:`, file.name);
      alert(`Simulating upload for ${dataType}: ${file.name}. Data would be parsed and updated.`);
      // In a real app, you'd parse the file (e.g., CSV, Excel) and update state
    }
  };

  const handleDeleteClick = (id, dataType, name) => {
    setItemToDeleteInfo({ id, dataType, name });
    setShowDeleteConfirmModal(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDeleteInfo) {
      const { id, dataType } = itemToDeleteInfo;
      switch (dataType) {
        case 'users':
          setUsers(prev => prev.filter(item => item.id !== id));
          break;
        case 'designations':
          setDesignations(prev => prev.filter(item => item.id !== id));
          break;
        case 'billTypes':
          setBillTypes(prev => prev.filter(item => item.id !== id));
          break;
        case 'vendors':
          setVendors(prev => prev.filter(item => item.id !== id));
          break;
        default: break;
      }
      console.log(`Deleted ${dataType} with ID: ${id}`);
    }
    setShowDeleteConfirmModal(false);
    setItemToDeleteInfo(null);
  };

  const handleAddEditClick = (dataType, item = null) => {
    setModalDataType(dataType);
    setCurrentEditItem(item);
    setShowAddEditModal(true);
  };

  const handleSaveItem = (formData) => {
    const newId = currentEditItem ? currentEditItem.id : `${modalDataType.slice(0, 3)}${Date.now()}`;
    
    // Create the new item based on dataType and formData
    let newItem;
    if (modalDataType === 'users') {
      newItem = {
        id: newId,
        name: formData.name,
        email: formData.email,
        designation: formData.designation,
        manager: formData.manager,
        tenant: formData.tenant,
      };
    } else {
      // For designations, billTypes, vendors, assume they only have 'id' and 'name'
      newItem = { id: newId, name: formData.name };
    }

    switch (modalDataType) {
      case 'users':
        if (currentEditItem) {
          setUsers(prev => prev.map(u => u.id === currentEditItem.id ? { ...u, ...newItem } : u));
        } else {
          setUsers(prev => [...prev, newItem]);
        }
        break;
      case 'designations':
        if (currentEditItem) {
          setDesignations(prev => prev.map(d => d.id === currentEditItem.id ? { ...d, name: newItem.name } : d));
        } else {
          setDesignations(prev => [...prev, newItem]);
        }
        break;
      case 'billTypes':
        if (currentEditItem) {
          setBillTypes(prev => prev.map(b => b.id === currentEditItem.id ? { ...b, name: newItem.name } : b));
        } else {
          setBillTypes(prev => [...prev, newItem]);
        }
        break;
      case 'vendors':
        if (currentEditItem) {
          setVendors(prev => prev.map(v => v.id === currentEditItem.id ? { ...v, name: newItem.name } : v));
        } else {
          setVendors(prev => [...prev, newItem]);
        }
        break;
      default: break;
    }
    console.log(`${currentEditItem ? 'Updated' : 'Added'} ${modalDataType}:`, newItem);
  };


  const renderTable = (data, columns, dataType) => (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key}>{col.label}</th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} className="text-center py-6 text-gray-500">No {dataType} data found.</td>
            </tr>
          ) : (
            data.map(item => (
              <tr key={item.id}>
                {columns.map(col => (
                  <td key={`${item.id}-${col.key}`}>{item[col.key]}</td>
                ))}
                <td>
                  <div className="table-actions" style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleAddEditClick(dataType, item)}
                      className="icon-button text-blue"
                      title="Edit"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(item.id, dataType, item.name || item.id)}
                      className="icon-button text-red"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  // Column definitions for AddEditModal
  const userModalColumns = [
    { key: 'id', label: 'User ID', required: true, type: 'text' },
    { key: 'name', label: 'Name', required: true, type: 'text' },
    { key: 'email', label: 'Email', required: true, type: 'email' },
    // designation, manager, tenant are handled separately in AddEditModal for users
  ];

  const genericModalColumns = [
    { key: 'id', label: 'ID', required: true, type: 'text' },
    { key: 'name', label: 'Name', required: true, type: 'text' },
  ];

  const getModalColumns = (type) => {
    if (type === 'users') return userModalColumns;
    return genericModalColumns;
  };


  return (
    <div className="card-container">
      <h2 className="section-title">Master Data Management</h2>

      {/* Tabs */}
      <div className="tab-nav">
        <button
          onClick={() => setActiveTab('users')}
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab('designations')}
          className={`tab-button ${activeTab === 'designations' ? 'active' : ''}`}
        >
          Designations
        </button>
        <button
          onClick={() => setActiveTab('billTypes')}
          className={`tab-button ${activeTab === 'billTypes' ? 'active' : ''}`}
        >
          Bill Types
        </button>
        <button
          onClick={() => setActiveTab('vendors')}
          className={`tab-button ${activeTab === 'vendors' ? 'active' : ''}`}
        >
          Vendors
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'users' && (
        <div>
          <div className="master-data-controls">
            <h3 className="section-title" style={{ marginBottom: '0' }}>Manage Users</h3>
            <div className="master-data-buttons">
              <input
                type="file"
                id="uploadUsers"
                className="upload-input"
                accept=".xlsx,.xls,.csv" // Added .csv
                onChange={(e) => handleFileUpload(e, 'users')}
              />
              <label htmlFor="uploadUsers" className="btn-secondary">
                <Upload className="nav-icon mr-2" /> Upload Users (Excel/CSV)
              </label>
              <button
                onClick={() => handleAddEditClick('users')}
                className="btn-primary"
              >
                <PlusCircle className="nav-icon mr-2" /> Add User
              </button>
            </div>
          </div>
          {renderTable(users, [
            { key: 'id', label: 'User ID' },
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'designation', label: 'Designation' },
            { key: 'manager', label: 'Manager' },
            { key: 'tenant', label: 'Tenant' },
          ], 'users')}
        </div>
      )}

      {activeTab === 'designations' && (
        <div>
          <div className="master-data-controls">
            <h3 className="section-title" style={{ marginBottom: '0' }}>Manage Designations</h3>
            <div className="master-data-buttons">
              <input
                type="file"
                id="uploadDesignations"
                className="upload-input"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => handleFileUpload(e, 'designations')}
              />
              <label htmlFor="uploadDesignations" className="btn-secondary">
                <Upload className="nav-icon mr-2" /> Upload Designations (Excel/CSV)
              </label>
              <button
                onClick={() => handleAddEditClick('designations')}
                className="btn-primary"
              >
                <PlusCircle className="nav-icon mr-2" /> Add Designation
              </button>
            </div>
          </div>
          {renderTable(designations, [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }], 'designations')}
        </div>
      )}

      {activeTab === 'billTypes' && (
        <div>
          <div className="master-data-controls">
            <h3 className="section-title" style={{ marginBottom: '0' }}>Manage Bill Types</h3>
            <div className="master-data-buttons">
              <input
                type="file"
                id="uploadBillTypes"
                className="upload-input"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => handleFileUpload(e, 'billTypes')}
              />
              <label htmlFor="uploadBillTypes" className="btn-secondary">
                <Upload className="nav-icon mr-2" /> Upload Bill Types (Excel/CSV)
              </label>
              <button
                onClick={() => handleAddEditClick('billTypes')}
                className="btn-primary"
              >
                <PlusCircle className="nav-icon mr-2" /> Add Bill Type
              </button>
            </div>
          </div>
          {renderTable(billTypes, [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }], 'billTypes')}
        </div>
      )}

      {activeTab === 'vendors' && (
        <div>
          <div className="master-data-controls">
            <h3 className="section-title" style={{ marginBottom: '0' }}>Manage Vendors</h3>
            <div className="master-data-buttons">
              <input
                type="file"
                id="uploadVendors"
                className="upload-input"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => handleFileUpload(e, 'vendors')}
              />
              <label htmlFor="uploadVendors" className="btn-secondary">
                <Upload className="nav-icon mr-2" /> Upload Vendors (Excel/CSV)
              </label>
              <button
                onClick={() => handleAddEditClick('vendors')}
                className="btn-primary"
              >
                <PlusCircle className="nav-icon mr-2" /> Add Vendor
              </button>
            </div>
          </div>
          {renderTable(vendors, [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }], 'vendors')}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AddEditModal
        isOpen={showAddEditModal}
        onClose={() => setShowAddEditModal(false)}
        onSubmit={handleSaveItem}
        title={currentEditItem ? 'Edit' : 'Add New'}
        data={currentEditItem}
        dataType={modalDataType}
        columns={getModalColumns(modalDataType)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteConfirmModal}
        onClose={() => setShowDeleteConfirmModal(false)}
        onConfirm={handleConfirmDelete}
        message={itemToDeleteInfo ? `Are you sure you want to delete "${itemToDeleteInfo.name}" (${itemToDeleteInfo.id}) from ${itemToDeleteInfo.dataType}? This action cannot be undone.` : 'Are you sure you want to delete this item? This action cannot be undone.'}
      />
    </div>
  );
};

export default MasterData;
