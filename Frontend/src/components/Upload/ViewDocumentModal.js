import React from 'react';
import Modal from 'react-modal';
import { FaFilePdf, FaFileImage, FaFileExcel, FaFileWord } from 'react-icons/fa';

Modal.setAppElement('#root');

const ViewDocumentModal = ({ isOpen, onRequestClose, fileUrl }) => {
  const isValidFile = fileUrl && fileUrl !== 'not-found';
  const fileType = isValidFile ? fileUrl.split('.').pop().toLowerCase() : '';

  const getFileIcon = () => {
    if (fileType === 'pdf') return <FaFilePdf color="red" />;
    if (['png', 'jpg', 'jpeg'].includes(fileType)) return <FaFileImage color="green" />;
    if (['xls', 'xlsx'].includes(fileType)) return <FaFileExcel color="green" />;
    if (['doc', 'docx'].includes(fileType)) return <FaFileWord color="blue" />;
    return null;
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Document Viewer"
      className="modal"
      overlayClassName="overlay"
    >
      <div className="modal-header">
        <h2>Uploaded Document</h2>
        <button onClick={onRequestClose}>❌</button>
      </div>

      <div className="document-viewer">
        {!isValidFile ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
            <h3>⚠️ Document Not Found</h3>
            <p>The file you are trying to view does not exist or the path is invalid.</p>
          </div>
        ) : fileType === 'pdf' ? (
          <iframe src={fileUrl} width="100%" height="500px" title="PDF Preview" />
        ) : ['png', 'jpg', 'jpeg'].includes(fileType) ? (
          <img src={fileUrl} alt="Preview" style={{ maxHeight: '500px', width: '100%', objectFit: 'contain' }} />
        ) : (
          <iframe
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`}
            width="100%"
            height="500px"
            frameBorder="0"
            title="Document Preview"
          />
        )}
      </div>
    </Modal>
  );
};

export default ViewDocumentModal;
