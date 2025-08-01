import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Upload, X, FileText, Image, AlertCircle, CheckCircle, Eye } from 'lucide-react';
import '../styles/UploadInvoice.css';
import { BASE_URL } from '../../config'; // Import BASE_URL

const UploadInvoice = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const MAX_FILE_SIZE_MB = 10;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  const validateFile = (file) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const errors = [];

    if (!allowedTypes.includes(file.type)) {
      errors.push('Invalid file type. Only PDF, JPG, JPEG, and PNG files are allowed.');
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      errors.push(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit.`);
    }

    return errors;
  };

  const handleFileSelect = (selectedFiles) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

    const newFiles = Array.from(selectedFiles)
      .filter(file => allowedTypes.includes(file.type)) // ✅ Filter allowed types only
      .map(file => {
        const errors = validateFile(file);
        return {
          id: Math.random().toString(36).substr(2, 9),
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          errors,
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
          status: errors.length > 0 ? 'error' : 'ready',
        };
      });

    setFiles(prev => [...prev, ...newFiles]);
  };


  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeFile = (fileId) => {
    setFiles(prev => {
      const updatedFiles = prev.filter(f => f.id !== fileId);
      // Clean up preview URLs
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return updatedFiles;
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type) => {
    if (type === 'application/pdf') return <FileText className="file-icon pdf" />;
    if (type.startsWith('image/')) return <Image className="file-icon image" />;
    return <FileText className="file-icon default" />;
  };

  const handleUpload = async () => {
    const validFiles = files.filter(f => f.errors.length === 0);

    if (validFiles.length === 0) {
      alert("⚠️ Please select at least one valid file.");
      return;
    }

    setLoading(true);
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');

    try {
      for (let fileData of validFiles) {
        setUploadProgress(prev => ({ ...prev, [fileData.id]: 0 }));

        const formData = new FormData();
        formData.append('invoice', fileData.file);
        formData.append('companyId', user.id);
        formData.append('clerkId', user.id);

        // Simulate upload progress
        const uploadInterval = setInterval(() => {
          setUploadProgress(prev => {
            const currentProgress = prev[fileData.id] || 0;
            if (currentProgress >= 90) {
              clearInterval(uploadInterval);
              return prev;
            }
            return { ...prev, [fileData.id]: currentProgress + 10 };
          });
        }, 200);

        const uploadRes = await axios.post(`${BASE_URL}}/api/upload/`, formData);
        const uploadedInvoice = uploadRes.data.invoice;

        // Send basic OCR metadata after upload
        await axios.post(`${BASE_URL}/api/ocr/${uploadedInvoice.id}`, {
          invoiceNumber: uploadedInvoice.id,
          invoiceDate: new Date().toISOString().split('T')[0],
          dueDate: new Date().toISOString().split('T')[0],
          extractedBy: user.id,
          amountInWords: 'Amount in words placeholder'
        });

        // Complete progress
        setUploadProgress(prev => ({ ...prev, [fileData.id]: 100 }));

        // Update file status
        setFiles(prev => prev.map(f =>
          f.id === fileData.id ? { ...f, status: 'uploaded' } : f
        ));
      }

      alert('✅ All files uploaded and processed!');

      // Navigate after showing success for a moment
      setTimeout(() => {
        navigate('/ocr');
      }, 2000);

    } catch (err) {
      console.error(err);
      alert("❌ Some uploads failed. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const openFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="upload-invoice-container">
      <div className="upload-content-wrapper">
        {/* Header */}
        <div className="upload-header">
          <h1 className="upload-title">Upload Invoice</h1>
          <p className="upload-subtitle">
            Upload invoice files like PDF, JPG, JPEG, or PNG (Max size: {MAX_FILE_SIZE_MB}MB)
          </p>
        </div>

        {/* Upload Area */}
        <div className="upload-card">
          <div
            className={`upload-dropzone ${dragOver ? 'drag-over' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={openFileInput}
          >
            <Upload className="upload-icon" />
            <h3 className="upload-dropzone-title">
              Drag & drop files here
            </h3>
            <p className="upload-dropzone-text">or click to browse</p>

            <button
              type="button"
              className="upload-browse-btn"
            >
              Choose Files
            </button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="upload-file-input"
            />
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="file-list-card">
            <h3 className="file-list-title">
              Selected Files ({files.length})
            </h3>

            <div className="file-grid">
              {files.map((fileData) => (
                <div key={fileData.id} className={`file-card ${fileData.status}`}>
                  <div className="file-thumbnail">
                    {fileData.preview ? (
                      <img src={fileData.preview} alt={fileData.name} className="thumbnail-image" />
                    ) : (
                      getFileIcon(fileData.type)
                    )}
                  </div>
                  <div className="file-meta">
                    <p className="file-name" title={fileData.name}>{fileData.name}</p>
                    <p className="file-size">{formatFileSize(fileData.size)}</p>
                    {fileData.status === 'error' && <span className="file-status error">Error</span>}
                    {fileData.status === 'uploaded' && <span className="file-status uploaded">Uploaded</span>}
                    {fileData.status === 'ready' && <span className="file-status ready">Ready</span>}
                  </div>
                  <button onClick={() => removeFile(fileData.id)} className="remove-btn" disabled={loading}>
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>


            {/* Upload Button */}
            <div className="upload-button-container">
              <button
                onClick={handleUpload}
                disabled={loading || files.filter(f => f.errors.length === 0).length === 0}
                className={`upload-submit-btn ${loading || files.filter(f => f.errors.length === 0).length === 0
                  ? 'disabled'
                  : 'active'
                  }`}
                type="button"
              >
                {loading
                  ? 'Uploading...'
                  : `Upload ${files.filter(f => f.errors.length === 0).length} Files`
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadInvoice;