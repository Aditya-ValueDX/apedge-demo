// src/components/ViewDocumentModal.js
import { useState, useEffect, useRef } from 'react';
import {
  FaFilePdf,
  FaFileImage,
  FaFileWord, // Can be used for .doc/.docx
  FaFileExcel, // For .xlsx/.xls
  FaFileAlt, // Generic file icon, also good for plain text/CSV
  FaTimes,
  FaDownload,
  FaExpand,
  FaCompress,
} from 'react-icons/fa';
// No direct CSS import needed if all styles are in index.css

const ViewDocumentModal = ({
  isOpen,
  onRequestClose,
  fileUrl,
  fileName = 'Document',
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [textContent, setTextContent] = useState(null);
  const [csvData, setCsvData] = useState(null);
  const [effectiveFileType, setEffectiveFileType] = useState(null);
  const [displayUrl, setDisplayUrl] = useState(''); // Re-added displayUrl state

  const objectUrlRef = useRef(null);

  const isValidFile = fileUrl && fileUrl !== 'not-found' && fileUrl.trim() !== '';

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen || !isValidFile) {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      // Clear states when modal is closed or file is invalid
      setEffectiveFileType(null);
      setTextContent(null);
      setCsvData(null);
      setDisplayUrl(''); // Clear displayUrl on close
      return;
    }

    setIsLoading(true);
    setEffectiveFileType(null);
    setTextContent(null);
    setCsvData(null);
    setDisplayUrl(''); // Clear displayUrl at the start of new load

    const identifyAndLoadFile = async () => {
      try {
        const response = await fetch(fileUrl);
        if (!response.ok)
          throw new Error(`File fetch failed: ${response.statusText}`);

        const originalBlob = await response.blob();
        const fileExtension = fileName.split('.').pop().toLowerCase();

        let newBlob = null;
        let identifiedType = 'unsupported';

        // Check by file extension first for common types
        if (fileExtension === 'pdf') {
          identifiedType = 'pdf';
          newBlob = new Blob([originalBlob], { type: 'application/pdf' });
        } else if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(fileExtension)) {
          identifiedType = 'image';
          newBlob = new Blob([originalBlob], { type: originalBlob.type || `image/${fileExtension}` });
        } else if (fileExtension === 'json') {
          try {
            const fileText = await originalBlob.text();
            const jsonData = JSON.parse(fileText);
            setTextContent(JSON.stringify(jsonData, null, 2));
            identifiedType = 'json';
          } catch (jsonError) {
            identifiedType = 'unsupported';
          }
        } else if (fileExtension === 'csv') {
            identifiedType = 'csv';
            const fileText = await originalBlob.text();

            const parseCSV = (text) => {
                const rows = [];
                let inQuote = false;
                let currentCell = '';
                let currentRow = [];

                for (let i = 0; i < text.length; i++) {
                    const char = text[i];
                    const nextChar = text[i + 1];

                    if (char === '"') {
                        if (inQuote && nextChar === '"') {
                            currentCell += '"';
                            i++;
                        } else {
                            inQuote = !inQuote;
                        }
                    } else if (char === ',' && !inQuote) {
                        currentRow.push(currentCell.trim());
                        currentCell = '';
                    } else if (char === '\n' && !inQuote) {
                        if (text[i - 1] === '\r') {
                            currentCell = currentCell.slice(0, -1);
                        }
                        currentRow.push(currentCell.trim());
                        rows.push(currentRow);
                        currentRow = [];
                        currentCell = '';
                    } else if (char === '\r' && !inQuote) {
                        // Ignore carriage return if not followed by newline
                    }
                    else {
                        currentCell += char;
                    }
                }
                if (currentCell || currentRow.length > 0) {
                    currentRow.push(currentCell.trim());
                    rows.push(currentRow);
                }
                return rows.filter(row => row.some(cell => cell.length > 0));
            };

            const parsedData = parseCSV(fileText);
            setCsvData(parsedData);
        } else if (fileExtension === 'txt') {
            identifiedType = 'text';
            const fileText = await originalBlob.text();
            setTextContent(fileText);
        } else if (['doc', 'docx'].includes(fileExtension)) {
          identifiedType = 'word';
        } else if (['xls', 'xlsx'].includes(fileExtension)) {
          identifiedType = 'excel';
        }

        // Fallback to magic numbers if extension isn't definitive or known
        if (identifiedType === 'unsupported') {
            const headerBuffer = await originalBlob.slice(0, 4).arrayBuffer();
            const headerView = new Uint8Array(headerBuffer);
            const headerText = new TextDecoder('utf-8').decode(headerBuffer);

            if (headerText.startsWith('%PDF')) {
                identifiedType = 'pdf';
                newBlob = new Blob([originalBlob], { type: 'application/pdf' });
            } else if (
                headerView[0] === 0x89 && headerView[1] === 0x50 &&
                headerView[2] === 0x4e && headerView[3] === 0x47
            ) {
                identifiedType = 'image'; // PNG
                newBlob = new Blob([originalBlob], { type: 'image/png' });
            } else if (headerView[0] === 0xff && headerView[1] === 0xd8) {
                identifiedType = 'image'; // JPEG/JPG
                newBlob = new Blob([originalBlob], { type: 'image/jpeg' });
            } else if (headerText.startsWith('GIF')) {
                identifiedType = 'image'; // GIF
                newBlob = new Blob([originalBlob], { type: 'image/gif' });
            }
        }

        setEffectiveFileType(identifiedType);

        if (newBlob) {
          if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
          }
          const newUrl = URL.createObjectURL(newBlob);
          objectUrlRef.current = newUrl;
          // Only set displayUrl if it's a type that can be displayed directly (pdf, image)
          if (identifiedType === 'pdf' || identifiedType === 'image') {
              setDisplayUrl(newUrl);
          } else {
              setDisplayUrl('');
          }
        } else {
          setDisplayUrl('');
        }
      } catch (error) {
        console.error('Error loading or identifying document:', error);
        setEffectiveFileType('unsupported');
        setDisplayUrl('');
        setTextContent(null);
        setCsvData(null);
      } finally {
        setIsLoading(false);
      }
    };

    identifyAndLoadFile();
  }, [isOpen, fileUrl, fileName, isValidFile]);

  const getFileIcon = () => {
    const iconSize = 24;
    switch (effectiveFileType) {
      case 'pdf':
        return <FaFilePdf size={iconSize} style={{ color: '#ef4444' }} />;
      case 'image':
        return <FaFileImage size={iconSize} style={{ color: '#10b981' }} />;
      case 'json':
        return <FaFileWord size={iconSize} style={{ color: '#4f46e5' }} />;
      case 'word':
        return <FaFileWord size={iconSize} style={{ color: '#2b579a' }} />;
      case 'excel':
        return <FaFileExcel size={iconSize} style={{ color: '#217346' }} />;
      case 'text':
      case 'csv':
        return <FaFileAlt size={iconSize} style={{ color: '#6b7280' }} />;
      default:
        return <FaFileAlt size={iconSize} style={{ color: '#9ca3af' }} />;
    }
  };

  const getFileTypeText = () => {
    switch (effectiveFileType) {
        case 'pdf': return 'PDF Document';
        case 'image': return 'Image File';
        case 'json': return 'JSON Data';
        case 'word': return 'Word Document';
        case 'excel': return 'Excel Spreadsheet';
        case 'text': return 'Text File';
        case 'csv': return 'CSV Data';
        case 'unsupported': return 'Unsupported File Type';
        default: return 'Loading...';
    }
  };

  const handleDownload = () => {
    if (isValidFile) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onRequestClose}
    >
      <div
        className={`modal-content ${isFullscreen ? 'fullscreen' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-gradient-bar" />
          <div className="modal-header-main">
            <div className="modal-title-group">
              {getFileIcon()}
              <div>
                <h2 className="modal-title">{fileName}</h2>
                <p className="modal-subtitle">{getFileTypeText()}</p>
              </div>
            </div>
            <div className="modal-actions">
              {isValidFile && !isLoading && (
                <>
                  <button
                    onClick={toggleFullscreen}
                    className="modal-action-button"
                    title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                  >
                    {isFullscreen ? (
                      <FaCompress size={16} />
                    ) : (
                      <FaExpand size={16} />
                    )}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="modal-action-button"
                    title="Download File"
                  >
                    <FaDownload size={16} />
                  </button>
                </>
              )}
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
        {/* Content */}
        <div className="modal-body">
          {isLoading ? (
            <div className="modal-loading-state">
              <div className="spinner modal-spinner" />
              <p className="modal-loading-text">
                Identifying document...
              </p>
            </div>
          ) : (
            <div className="modal-preview-area">
              {effectiveFileType === 'pdf' && displayUrl && ( // Check displayUrl
                <iframe
                  src={displayUrl}
                  className="modal-preview-iframe"
                  title="PDF Preview"
                />
              )}
              {effectiveFileType === 'image' && displayUrl && ( // Check displayUrl
                <img
                  src={displayUrl}
                  alt={fileName}
                  className="modal-preview-image"
                />
              )}
              {(effectiveFileType === 'json' || effectiveFileType === 'text') && (
                <pre className="modal-preview-text">{textContent}</pre>
              )}
              {effectiveFileType === 'csv' && csvData && (
                <div className="modal-preview-csv-container">
                  <table className="modal-preview-csv-table">
                    <thead>
                      {csvData.length > 0 && (
                        <tr>
                          {csvData[0].map((header, index) => (
                            <th key={index}>{header}</th>
                          ))}
                        </tr>
                      )}
                    </thead>
                    <tbody>
                      {csvData.slice(1).map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {(effectiveFileType === 'word' || effectiveFileType === 'excel' || effectiveFileType === 'unsupported') && (
                <div className="modal-preview-not-available">
                  <div className="modal-preview-not-available-content">
                    <h3 className="modal-preview-not-available-title">
                      Preview Not Available
                    </h3>
                    <p className="modal-preview-not-available-message">
                      {effectiveFileType === 'word' ? 'Word documents cannot be previewed directly in the browser.' :
                       effectiveFileType === 'excel' ? 'Excel spreadsheets cannot be previewed directly in the browser.' :
                       'This file type cannot be previewed.'}
                      <br /> Please download to view.
                    </p>
                    <button
                      onClick={handleDownload}
                      className="btn-primary modal-download-button"
                    >
                      <FaDownload />
                      <span>Download File</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewDocumentModal;
