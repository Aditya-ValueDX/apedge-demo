// src/components/common/AddEditModal.js
import React, { useState, useEffect } from 'react';
import { X, Save, PlusCircle } from 'lucide-react';

const AddEditModal = ({ isOpen, onClose, onSubmit, title, data, dataType, columns }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    // Initialize form data when modal opens or data changes
    if (isOpen) {
      const initialData = {};
      // For editing, populate with existing data
      if (data) {
        columns.forEach(col => {
          initialData[col.key] = data[col.key] || '';
        });
      } else {
        // For adding, initialize with empty strings or defaults
        columns.forEach(col => {
          initialData[col.key] = '';
        });
      }
      setFormData(initialData);
    }
  }, [isOpen, data, columns]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose(); // Close modal after submission
  };

  const capitalize = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content add-edit-modal">
        <div className="modal-header">
          <div className="modal-header-gradient-bar"></div> {/* Added gradient bar for aesthetics */}
          <div className="modal-header-main">
            <div className="modal-title-group">
              <PlusCircle className="modal-title-icon" size={24} /> {/* Icon added */}
              <h3 className="modal-title">{title} {capitalize(dataType.slice(0, -1))}</h3>
            </div>
            <button onClick={onClose} className="modal-action-button" title="Close">
              <X size={24} />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-grid-2-col"> {/* Using a 2-column grid for forms */}
            {columns.map(col => (
              // Skip rendering 'id' field unless it's explicitly needed for editing as a visible field
              col.key === 'id' && !data ? null : ( // Don't show ID input when adding, show it read-only when editing
                <div className="form-group" key={col.key}>
                  <label htmlFor={col.key} className="form-label">{capitalize(col.label)}</label>
                  <input
                    type={col.type || 'text'}
                    id={col.key}
                    name={col.key}
                    value={formData[col.key] || ''}
                    onChange={handleChange}
                    className={`form-input ${col.key === 'id' ? 'read-only' : ''}`}
                    readOnly={col.key === 'id'} // Make ID field read-only if it exists
                    required={col.required || false}
                  />
                </div>
              )
            ))}
            {/* Add specific fields for users (designation, manager, tenant) if dataType is 'users' */}
            {dataType === 'users' && (
                <>
                    <div className="form-group">
                        <label htmlFor="designation" className="form-label">Designation</label>
                        <input
                            type="text"
                            id="designation"
                            name="designation"
                            value={formData.designation || ''}
                            onChange={handleChange}
                            className="form-input"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="manager" className="form-label">Manager</label>
                        <input
                            type="text"
                            id="manager"
                            name="manager"
                            value={formData.manager || ''}
                            onChange={handleChange}
                            className="form-input"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="tenant" className="form-label">Tenant</label>
                        <input
                            type="text"
                            id="tenant"
                            name="tenant"
                            value={formData.tenant || ''}
                            onChange={handleChange}
                            className="form-input"
                        />
                    </div>
                </>
            )}
          </div>
          <div className="form-actions-bottom" style={{ justifyContent: 'flex-end', marginTop: '24px' }}>
            <button type="button" onClick={onClose} className="btn-secondary mr-4">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <Save className="mr-2 w-5 h-5" /> Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditModal;
