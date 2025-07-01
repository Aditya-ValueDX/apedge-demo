import React from 'react';
import BulkUploadHeader from './BulkUploadHeader';
import Navbar from '../Navbar';
import UploadSection from './UploadSection';
import ProcessingQueue from '../ProcessingQueue';
import ManualUploadHandler from './ManualUploadHandler';

const BulkUploadApp = () => {
  return (
    <>
      {/* <BulkUploadHeader /> */}
      <div className="main-container">
        <Navbar />
        <div className="content-area">
          <UploadSection />
          <ManualUploadHandler />
          <ProcessingQueue />
        </div>
      </div>

      <style>{`
        .main-container {
          display: flex;
          height: calc(100vh - 60px);
        }
        .content-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
      `}</style>
    </>
  );
};

export default BulkUploadApp;