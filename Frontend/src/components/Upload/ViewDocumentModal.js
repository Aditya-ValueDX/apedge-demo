import React, { useState, useEffect } from 'react';
import { FaFilePdf, FaFileImage, FaFileExcel, FaFileWord, FaTimes, FaDownload, FaExpand, FaCompress } from 'react-icons/fa';

const ViewDocumentModal = ({ isOpen, onRequestClose, fileUrl, fileName = 'Document' }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const isValidFile = fileUrl && fileUrl !== 'not-found';
  const fileType = isValidFile ? fileUrl.split('.').pop().toLowerCase() : '';
  
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setImageError(false);
      // Simulate loading time
      const timer = setTimeout(() => setIsLoading(false), 800);
      return () => clearTimeout(timer);
    }
  }, [isOpen, fileUrl]);

  const getFileIcon = () => {
    const iconSize = 24;
    if (fileType === 'pdf') return <FaFilePdf size={iconSize} style={{ color: '#ef4444' }} />;
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(fileType)) return <FaFileImage size={iconSize} style={{ color: '#10b981' }} />;
    if (['xls', 'xlsx'].includes(fileType)) return <FaFileExcel size={iconSize} style={{ color: '#10b981' }} />;
    if (['doc', 'docx'].includes(fileType)) return <FaFileWord size={iconSize} style={{ color: '#4f46e5' }} />;
    return <div style={{ width: '24px', height: '24px', backgroundColor: '#9ca3af', borderRadius: '4px' }}></div>;
  };

  const handleDownload = () => {
    if (isValidFile) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      link.click();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Backdrop */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          transition: 'opacity 0.3s ease'
        }}
        onClick={onRequestClose}
      />
      
      {/* Modal */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)',
        borderRadius: isFullscreen ? '0' : '1rem',
        boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        border: '1px solid #e5e7eb',
        transition: 'all 0.3s ease',
        width: isFullscreen ? '100%' : '90%',
        maxWidth: isFullscreen ? '100%' : '1000px',
        height: isFullscreen ? '100%' : '85vh',
        margin: isFullscreen ? '0' : '1rem',
        display: 'flex',
        flexDirection: 'column',
        animation: 'scaleIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        overflow: 'hidden'
      }}>
        
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.5rem 2rem',
          borderBottom: '1px solid #e5e7eb',
          background: 'linear-gradient(135deg, #f9fafb, #ffffff)',
          borderRadius: isFullscreen ? '0' : '1rem 1rem 0 0',
          position: 'relative',
          flexShrink: 0
        }}>
          {/* Color accent bar */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #4f46e5, #10b981, #f59e0b)',
            borderRadius: isFullscreen ? '0' : '1rem 1rem 0 0'
          }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {getFileIcon()}
            <div>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#1f2937',
                margin: 0,
                letterSpacing: '-0.025em',
                maxWidth: '400px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {fileName}
              </h2>
              <p style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: '500'
              }}>
                {fileType.toUpperCase()} Document
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isValidFile && (
              <>
                              
                <button
                  onClick={toggleFullscreen}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    color: '#6b7280',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.color = '#10b981';
                    e.target.style.backgroundColor = '#ecfdf5';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.color = '#6b7280';
                    e.target.style.backgroundColor = 'transparent';
                  }}
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? <FaCompress size={16} /> : <FaExpand size={16} />}
                </button>
              </>
            )}
            
            <button
              onClick={onRequestClose}
              style={{
                padding: '0.75rem',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                color: '#6b7280',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseOver={(e) => {
                e.target.style.color = '#ef4444';
                e.target.style.backgroundColor = '#fef2f2';
              }}
              onMouseOut={(e) => {
                e.target.style.color = '#6b7280';
                e.target.style.backgroundColor = 'transparent';
              }}
              title="Close"
            >
              <FaTimes size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
          {isLoading && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f9fafb'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  border: '3px solid #e5e7eb',
                  borderTop: '3px solid #4f46e5',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 1rem'
                }} />
                <p style={{
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  margin: 0
                }}>
                  Loading document...
                </p>
              </div>
            </div>
          )}
          
          {!isLoading && !isValidFile && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
              padding: '2rem'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  backgroundColor: '#fee2e2',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem'
                }}>
                  <FaTimes style={{ color: '#ef4444', fontSize: '24px' }} />
                </div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#991b1b',
                  margin: '0 0 0.5rem'
                }}>
                  Document Not Found
                </h3>
                <p style={{
                  color: '#dc2626',
                  maxWidth: '400px',
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                  margin: 0
                }}>
                  The file you are trying to view does not exist or the path is invalid.
                </p>
              </div>
            </div>
          )}
          
          {!isLoading && isValidFile && (
            <div style={{ height: '100%', padding: '1.5rem' }}>
              {fileType === 'pdf' && (
                <iframe 
                  src={fileUrl} 
                  style={{
                    width: '100%',
                    height: '100%',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
                  }}
                  title="PDF Preview"
                  onLoad={() => setIsLoading(false)}
                />
              )}
              
              {['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(fileType) && !imageError && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  backgroundColor: '#f9fafb',
                  borderRadius: '0.75rem',
                  border: '1px solid #e5e7eb'
                }}>
                  <img 
                    src={fileUrl} 
                    alt="Preview" 
                    style={{
                      maxHeight: '100%',
                      maxWidth: '100%',
                      objectFit: 'contain',
                      borderRadius: '0.75rem',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                    }}
                    onError={handleImageError}
                    onLoad={() => setIsLoading(false)}
                  />
                </div>
              )}
              
              {((['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(fileType) && imageError) || 
                ['xls', 'xlsx', 'doc', 'docx'].includes(fileType)) && (
                <div style={{
                  height: '100%',
                  backgroundColor: '#f9fafb',
                  borderRadius: '0.75rem',
                  border: '1px solid #e5e7eb',
                  overflow: 'hidden'
                }}>
                  <iframe
                    src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    title="Document Preview"
                    onLoad={() => setIsLoading(false)}
                  />
                </div>
              )}
              
              {!['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'xls', 'xlsx', 'doc', 'docx'].includes(fileType) && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  background: 'linear-gradient(135deg, #f9fafb, #f3f4f6)',
                  borderRadius: '0.75rem',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1rem'
                    }}>
                      {getFileIcon()}
                    </div>
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      color: '#374151',
                      margin: '0 0 0.5rem'
                    }}>
                      Preview Not Available
                    </h3>
                    <p style={{
                      color: '#6b7280',
                      maxWidth: '400px',
                      fontSize: '0.875rem',
                      lineHeight: '1.5',
                      margin: '0 0 1rem'
                    }}>
                      This file type cannot be previewed in the browser.
                    </p>
                    <button
                      onClick={handleDownload}
                      style={{
                        background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
                        color: 'white',
                        padding: '0.75rem 1.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        margin: '0 auto',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 10px 15px -3px rgb(0 0 0 / 0.1)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1)';
                      }}
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
      
      <style jsx>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default ViewDocumentModal;