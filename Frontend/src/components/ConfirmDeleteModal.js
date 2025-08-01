// src/components/common/ConfirmDeleteModal.js
import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, message }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content confirm-delete-modal">
        <div className="modal-header">
            <div className="modal-header-gradient-bar"></div>
            <div className="modal-header-main">
                <div className="modal-title-group">
                    <AlertTriangle className="modal-title-icon text-red-600" size={24} />
                    <h3 className="modal-title">Confirm Deletion</h3>
                </div>
                <button onClick={onClose} className="modal-action-button" title="Close">
                    <X size={24} />
                </button>
            </div>
        </div>
        <div className="modal-body text-center">
          <p className="mb-6 text-gray-700">{message}</p>
          <div className="form-actions-bottom" style={{ justifyContent: 'center' }}>
            <button onClick={onClose} className="btn-secondary mr-4">
              Cancel
            </button>
            <button onClick={onConfirm} className="btn-danger">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
