import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { toast } from 'react-toastify';
import { Upload, FileText, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import api from '../api/api';
import { useTheme } from '../context/ThemeContext';

const BulkUpload = ({ isOpen, onClose, onUploadSuccess, uploadUrl }) => {
  const { isDarkMode } = useTheme();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
    } else {
      toast.error('Manifest must be in CSV format.');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a validated CSV manifest');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post(uploadUrl || '/api/leads/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Manifest ingestion completed successfully');
      setFile(null);
      if (onUploadSuccess) onUploadSuccess();
      if (onClose) onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ingestion failed: Manifest mapping error');
    } finally {
      setUploading(false);
    }
  };

  const downloadSample = () => {
    const csvContent = "name,email,mobile\nJohn Doe,,9876543210\nJane Smith,jane@example.com,9988776655\nMike Ross,,9988771122";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lead_manifest_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const modalContent = (
    <div className="modal-overlay d-flex align-items-center justify-content-center px-3" style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: isDarkMode ? 'rgba(2, 6, 17, 0.95)' : 'rgba(248, 250, 252, 0.9)', backdropFilter: 'blur(10px)', zIndex: 11000 
    }}>
      <div className={`premium-card rounded-4 shadow-2xl animate-fade-in d-flex flex-column border ${isDarkMode ? 'border-white border-opacity-10 bg-slate-900' : 'border-slate-200 bg-white'} h-auto`} style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflow: 'hidden' }}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center p-4 border-bottom border-opacity-5">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-primary bg-opacity-10 p-2.5 rounded-circle text-primary shadow-glow">
              <Upload size={22} />
            </div>
            <div>
              <h5 className="fw-black text-main mb-0 text-uppercase tracking-widest small">Propagator Ingest</h5>
              <p className="text-muted small fw-bold mb-0 text-uppercase tracking-widest opacity-50" style={{ fontSize: '8px' }}>Bulk Data Orchestration</p>
            </div>
          </div>
          <button type="button" className={`btn-close ${isDarkMode ? 'btn-close-white' : ''} shadow-none`} onClick={onClose}></button>
        </div>
        
        <div className="p-4 overflow-auto custom-scroll">
            <div className="d-flex justify-content-between align-items-center mb-4">
               <div>
                  <h6 className="fw-black text-main mb-1 text-uppercase small tracking-widest" style={{ fontSize: '11px' }}>Stream Validation</h6>
                  <p className="text-muted small mb-0 fw-bold opacity-75" style={{ fontSize: '10px' }}>Keys required: [name, mobile]</p>
               </div>
               <button 
                onClick={downloadSample}
                className="btn btn-outline-primary btn-sm rounded-pill fw-black text-uppercase px-4 shadow-sm"
                style={{ fontSize: '9px' }}
              >
                <FileText size={12} className="me-2" /> Manifest Template
              </button>
            </div>
            
            <div 
              className={`position-relative border-2 border-dashed rounded-4 d-flex flex-column align-items-center justify-content-center p-5 transition-smooth ${file ? 'border-success bg-success bg-opacity-5' : 'border-primary border-opacity-20 bg-surface'}`}
              style={{ cursor: file ? 'default' : 'pointer', minHeight: '200px' }}
              onClick={() => !file && document.getElementById('csv-upload-portal').click()}
            >
              <input 
                type="file" 
                id="csv-upload-portal"
                accept=".csv" 
                onChange={handleFileChange} 
                className="d-none"
              />
              
              {file ? (
                <div className="d-flex flex-column align-items-center text-center w-100 animate-zoom-in">
                  <div className="mb-3 p-3 bg-success bg-opacity-10 text-success rounded-circle shadow-glow">
                     <CheckCircle size={32} />
                  </div>
                  <h6 className="fw-black text-main mb-1 text-truncate w-100 px-3">{file.name}</h6>
                  <p className="small text-muted text-uppercase fw-black mb-4 font-monospace" style={{ fontSize: '10px' }}>{(file.size / 1024).toFixed(1)} KB MANIFEST DETECTED</p>
                  <button className="btn btn-sm btn-link text-danger fw-bold text-decoration-none transition-smooth hover-scale" onClick={(e) => { e.stopPropagation(); setFile(null); }}>Discard File</button>
                </div>
              ) : (
                <div className="d-flex flex-column align-items-center text-center py-2 text-muted">
                  <div className="mb-4 p-4 bg-primary bg-opacity-10 rounded-circle transition-all shadow-glow">
                     <Upload size={42} className="text-primary opacity-50" />
                  </div>
                  <p className="fw-black text-main text-uppercase small tracking-widest mb-1">Propagate Manifest</p>
                  <p className="text-muted small fw-bold mb-0 opacity-75" style={{ fontSize: '10px' }}>SELECT CSV FILE FOR STREAMING</p>
                </div>
              )}
            </div>

            <div className="mt-4 p-3 bg-surface bg-opacity-50 rounded-4 border border-white border-opacity-5">
               <div className="d-flex gap-3 align-items-center">
                  <AlertCircle size={18} className="text-primary opacity-50" />
                  <p className="text-muted small mb-0 fw-bold" style={{ fontSize: '10px' }}>Ensure the mobile column contains valid numeric silhouettes. System will sanitize and normalize data upon ingestion.</p>
               </div>
            </div>
            
            <button 
              type="button" 
              className={`btn btn-primary w-100 py-3 rounded-pill fw-black text-uppercase tracking-widest shadow-glow border-0 mt-4 hover-up transition-smooth ${!file || uploading ? 'opacity-50' : ''}`}
              onClick={handleUpload} 
              disabled={uploading || !file}
            >
              {uploading ? (
                <div className="d-flex align-items-center justify-content-center gap-2">
                   <span className="spinner-border spinner-border-sm"></span>
                   POLLING INGESTION...
                </div>
              ) : (
                <div className="d-flex align-items-center justify-content-center gap-2">
                   <ShieldCheck size={18} />
                   START CORE INGESTION
                </div>
              )}
            </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default BulkUpload;
