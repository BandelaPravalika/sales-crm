import { useState } from 'react';
import { Upload, FileText, CheckCircle, X } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api/api';

const BulkUpload = ({ isOpen, onClose, onUploadSuccess, uploadUrl }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a CSV file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post(uploadUrl || '/leads/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Leads uploaded successfully');
      setFile(null);
      if (onUploadSuccess) onUploadSuccess();
      if (onClose) onClose();
    } catch (err) {
      toast.error('Bulk upload failed');
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
    a.download = 'sample_leads.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="modal show d-block animate-fade-in" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 2000 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content bg-dark shadow-lg border-0 rounded-4 overflow-hidden">
          <div className="modal-header bg-primary bg-opacity-10 py-3 px-4 border-0">
            <div className="d-flex align-items-center gap-3">
              <div className="p-2 bg-primary bg-opacity-20 text-primary rounded-3 shadow-sm">
                <Upload size={18} />
              </div>
              <div>
                <h6 className="modal-title fw-bold mb-0 tracking-wider small text-uppercase text-white">Bulk Lead Upload</h6>
                <p className="text-muted small mb-0 fw-bold" style={{ fontSize: '10px' }}>Ingest multiple leads</p>
              </div>
            </div>
            <button type="button" className="btn btn-link p-0 opacity-50 hover-opacity-100 text-white" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          
          <div className="modal-body p-4 text-white">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="small text-muted fw-bold">Required fields: name, mobile</span>
              <button 
                onClick={downloadSample}
                className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2 fw-bold text-uppercase"
                style={{ fontSize: '0.70rem' }}
              >
                <FileText size={12} /> <span className="d-none d-sm-inline">Template CSV</span>
              </button>
            </div>
            
            <div 
              className="position-relative border border-2 border-dashed rounded d-flex flex-column align-items-center justify-content-center p-5 bg-opacity-10 bg-secondary transition-all"
              style={{ cursor: 'pointer', borderStyle: 'dashed' }}
              onClick={() => !file && document.getElementById('csv-upload').click()}
              onMouseEnter={(e) => {if(!file) e.currentTarget.classList.add('bg-secondary', 'bg-opacity-10')}}
              onMouseLeave={(e) => {if(!file) e.currentTarget.classList.remove('bg-secondary', 'bg-opacity-10')}}
            >
              <input 
                type="file" 
                id="csv-upload"
                accept=".csv" 
                onChange={handleFileChange} 
                className="d-none"
              />
              
              {file ? (
                <div className="d-flex flex-column align-items-center text-center w-100">
                  <div className="mb-3 p-3 bg-primary bg-opacity-10 text-primary rounded-circle">
                     <FileText size={32} />
                  </div>
                  <p className="fw-bold mb-1 text-truncate w-100">{file.name}</p>
                  <p className="small text-muted text-uppercase fw-bold mb-4">{(file.size / 1024).toFixed(1)} KB READY</p>
                </div>
              ) : (
                <div className="d-flex flex-column align-items-center text-center py-4 text-muted">
                  <div className="mb-3 p-3 bg-secondary bg-opacity-10 rounded-circle transition-all">
                     <Upload size={32} className="opacity-50" />
                  </div>
                  <p className="fw-bold mb-1">Select CSV File</p>
                  <p className="small opacity-75">Click to browse your computer</p>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer border-0 p-3 bg-dark d-flex gap-2">
            <button type="button" className="btn btn-link text-decoration-none fw-bold small text-white text-opacity-50" onClick={onClose}>Cancel</button>
            <button 
              type="button" 
              className="btn btn-primary rounded-pill fw-bold text-uppercase px-4 py-2 shadow-sm d-flex align-items-center justify-content-center gap-2"
              onClick={handleUpload} 
              disabled={uploading || !file}
              style={{ fontSize: '11px', minWidth: '120px' }}
            >
              {uploading ? <span className="spinner-border spinner-border-sm"></span> : <Upload size={14} />}
              {uploading ? 'UPLOADING...' : 'START INGESTION'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkUpload;
