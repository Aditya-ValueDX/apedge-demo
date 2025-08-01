// src/components/TextDisplayModal.js
import React from 'react';
import { FaTimes } from 'react-icons/fa'; // Using react-icons for the close button

const TextDisplayModal = ({ isOpen, onRequestClose, title, textContent }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onRequestClose}>
      <div className="modal-content text-display-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header for the text display modal */}
        <div className="modal-header">
          <div className="modal-header-gradient-bar" /> {/* Reusing the gradient bar style */}
          <div className="modal-header-main">
            <div className="modal-title-group">
              {/* No icon needed for simple text display, or add a generic text icon if desired */}
              <h2 className="modal-title">{title || "Details"}</h2>
            </div>
            <div className="modal-actions">
              <button
                onClick={onRequestClose}
                className="modal-action-button"
                title="Close"
              >
                <FaTimes size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Body for the text content */}
        <div className="modal-body text-display-modal-body">
          <pre className="modal-preview-text-full">
            {textContent || "No content available."}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default TextDisplayModal;
