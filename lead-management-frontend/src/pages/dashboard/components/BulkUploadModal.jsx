import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { toast } from 'react-toastify';
import managerService from '../../../services/managerService';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';

const BulkUploadModal = ({ isOpen, onClose, onSuccess, assignees = [], isInline = false }) => {
    const { isDarkMode } = useTheme();
    const { user: currentUser } = useAuth();
    const isAssociate = currentUser?.role === 'ASSOCIATE';
    
    const [file, setFile] = useState(null);
    const [assignedToIds, setAssignedToIds] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [assignMode, setAssignMode] = useState('SINGLE'); // 'SINGLE' or 'DISTRIBUTE'

    if (!isOpen && !isInline) return null;

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && (selectedFile.name.endsWith('.csv') || selectedFile.type === 'text/csv')) {
            setFile(selectedFile);
        } else {
            toast.error('Please select a valid CSV file');
        }
    };

    const handleDrag = (e) => {
        e.preventDefault(); e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    };

    const handleDrop = (e) => {
        e.preventDefault(); e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange({ target: { files: e.dataTransfer.files } });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) { toast.warning('No file selected'); return; }

        setUploading(true);
        try {
            const idsString = assignedToIds.join(',');
            const response = await managerService.bulkUploadLeads(file, idsString || null);
            setUploadResult(response.data);
            if (response.data.successCount > 0) {
                toast.success(`${response.data.successCount} leads ingested successfully`);
                onSuccess();
            }
            
            if (response.data.duplicateCount > 0) {
                toast.warning(`${response.data.duplicateCount} records skipped (duplicate mobile numbers found)`);
            }
            
            if (response.data.failureCount > 0) {
                toast.error(`${response.data.failureCount} records failed due to validation errors`);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Bulk upload failed');
        } finally {
            setUploading(false);
        }
    };

    const downloadTemplate = () => {
        const csvContent = "data:text/csv;charset=utf-8,S.No,Name,Email,Mobile,College\n1,John Doe,john@example.com,9999999999,State University";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleReset = () => {
        setFile(null);
        setUploadResult(null);
        setAssignedToIds([]);
    };

    const toggleAssociate = (id) => {
        if (assignMode === 'SINGLE') {
            setAssignedToIds([id]);
        } else {
            setAssignedToIds(prev => 
                prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
            );
        }
    };

    const renderContent = () => (
        <div className={`${!isInline ? 'ui-modal-content border border-white border-opacity-10 rounded-4 shadow-lg overflow-hidden' : 'premium-card p-4'} h-100 flex-column d-flex`}>
            {/* Header - Only if inline or first step */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center gap-3">
                    <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-3 shadow-glow">
                        <Upload size={24} />
                    </div>
                    <div>
                        <h5 className="fw-black text-main mb-0 text-uppercase tracking-widest">Lead Bulk Upload</h5>
                        <p className="text-muted small mb-0 fw-bold opacity-75">Import and distribute datasets</p>
                    </div>
                </div>
                {!isInline && <button type="button" className={`btn-close ${isDarkMode ? 'btn-close-white' : ''} shadow-none`} onClick={onClose}></button>}
            </div>

            {!uploadResult ? (
                <form onSubmit={handleSubmit} className="flex-grow-1 d-flex flex-column overflow-hidden">
                    <div className="row g-4 overflow-auto custom-scroll px-1" style={{ maxHeight: isInline ? 'none' : '60vh' }}>
                        <div className="col-lg-6">
                            <div className="flex-grow-1 d-flex flex-column gap-3 h-100">
                                <div 
                                    className={`p-5 rounded-4 border-2 border-dashed d-flex flex-column align-items-center justify-content-center transition-smooth flex-grow-1 ${
                                        dragActive ? 'border-primary bg-primary bg-opacity-10' : 'border-white border-opacity-10 ui-glass-card'
                                    }`}
                                    onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                                    style={{ minHeight: '250px' }}
                                >
                                    <input type="file" className="d-none" id="csvFile" accept=".csv" onChange={handleFileChange} />
                                    {!file ? (
                                        <div className="text-center">
                                            <div className="p-3 bg-surface rounded-circle mb-3 d-inline-block shadow-sm">
                                                <FileText size={42} className="text-muted" />
                                            </div>
                                            <h6 className="text-main fw-black mb-1 text-uppercase tracking-widest small">Upload CSV Data</h6>
                                            <p className="text-muted small mb-3 fw-bold opacity-75">Drag and drop file here</p>
                                            <label htmlFor="csvFile" className="btn btn-primary px-5 rounded-pill fw-black shadow-glow border-0 text-uppercase" style={{ fontSize: '10px' }}>Browse Files</label>
                                        </div>
                                    ) : (
                                        <div className="text-center animate-fade-in">
                                            <div className="p-3 bg-success bg-opacity-10 rounded-circle mb-3 d-inline-block shadow-glow">
                                                <CheckCircle2 size={42} className="text-success" />
                                            </div>
                                            <h6 className="text-main fw-black mb-1 text-truncate" style={{maxWidth: '200px'}}>{file.name}</h6>
                                            <p className="text-muted small mb-3 fw-bold">{(file.size / 1024).toFixed(2)} KB ready</p>
                                            <button type="button" className="btn btn-link btn-sm text-danger text-decoration-none fw-bold" onClick={() => setFile(null)}>Remove</button>
                                        </div>
                                    )}
                                </div>
                                <div className="bg-primary text-white p-4 rounded-4 d-flex gap-3 mb-0 align-items-center justify-content-center shadow-glow">
                                    <div className="fw-black text-uppercase tracking-widest small">Schema Requirement: S.No, Name, Email, Mobile, College</div>
                                </div>
                            </div>
                        </div>

                        <div className={isAssociate ? "d-none" : "col-lg-6"}>
                            <div className="ui-glass-card p-4 rounded-4 border border-white border-opacity-5 h-100 d-flex flex-column shadow-sm">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <label className="small fw-bold text-muted text-uppercase mb-0" style={{ fontSize: '10px', letterSpacing: '1px' }}>Assignment Strategy</label>
                                    <div className="btn-group btn-group-sm rounded-pill p-1 bg-surface border border-white border-opacity-5 shadow-sm">
                                        <button type="button" className={`btn rounded-pill px-3 border-0 py-1 small transition-all ${assignMode === 'SINGLE' ? 'btn-primary shadow-glow' : 'text-muted'}`} onClick={() => {setAssignMode('SINGLE'); setAssignedToIds([]);}} style={{fontSize: '9px'}}>SINGLE</button>
                                        <button type="button" className={`btn rounded-pill px-3 border-0 py-1 small transition-all ${assignMode === 'DISTRIBUTE' ? 'btn-primary shadow-glow' : 'text-muted'}`} onClick={() => {setAssignMode('DISTRIBUTE'); setAssignedToIds([]);}} style={{fontSize: '9px'}}>SPLIT</button>
                                    </div>
                                </div>

                                <div className="flex-grow-1 overflow-auto custom-scroll pe-2 mb-3 d-flex flex-column gap-2" style={{ maxHeight: '240px' }}>
                                    <button 
                                        type="button"
                                        onClick={() => setAssignedToIds([])}
                                        className={`w-100 text-start p-3 rounded-4 border transition-smooth small ${assignedToIds.length === 0 ? 'border-primary bg-primary bg-opacity-10 text-primary shadow-glow' : 'border-white border-opacity-5 ui-glass-card text-main'}`}
                                    >
                                        <div className="d-flex align-items-center justify-content-between">
                                            <span className="fw-black text-uppercase small tracking-widest" style={{fontSize: '10px'}}>Unassigned Pool</span>
                                            {assignedToIds.length === 0 && <CheckCircle2 size={16} />}
                                        </div>
                                    </button>

                                    {assignees.map(user => (
                                        <button 
                                            key={user.id} 
                                            type="button"
                                            onClick={() => toggleAssociate(user.id)}
                                            className={`w-100 text-start p-3 rounded-4 border transition-smooth small ${assignedToIds.includes(user.id) ? 'border-primary bg-primary bg-opacity-10 text-primary shadow-glow' : 'border-white border-opacity-5 ui-glass-card text-main'}`}
                                        >
                                            <div className="d-flex align-items-center justify-content-between">
                                                <div className="d-flex flex-column">
                                                   <span className="fw-black text-main">{user.name}</span>
                                                   <small className="opacity-50 fw-bold text-uppercase" style={{fontSize: '8px'}}>{user.role?.replace('_', ' ') || 'User Asset'}</small>
                                                </div>
                                                {assignedToIds.includes(user.id) && <CheckCircle2 size={16} />}
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div className="mt-auto">
                                    <div className="p-3 bg-surface bg-opacity-50 rounded-4 border border-white border-opacity-5">
                                        <div className="d-flex justify-content-between align-items-center small">
                                            <span className="text-muted fw-bold">Target Propagation:</span>
                                            <span className="text-main fw-black text-uppercase tracking-widest" style={{fontSize: '10px'}}>{assignedToIds.length ? `${assignedToIds.length} SELECTED` : 'POOL'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 d-flex justify-content-between align-items-center pt-4 border-top border-white border-opacity-5">
                        <button type="button" className="btn btn-link text-info text-decoration-none d-flex align-items-center gap-2 small fw-black tracking-widest p-0" onClick={downloadTemplate}>
                            <Download size={14} /> SAMPLE TEMPLATE
                        </button>
                        <div className="d-flex gap-3">
                            {!isInline && <button type="button" className="btn btn-outline-white btn-sm px-4 rounded-pill fw-bold" onClick={onClose} disabled={uploading}>Cancel</button>}
                            <button 
                                type="submit" 
                                className="btn btn-primary btn-md px-5 rounded-pill fw-black d-flex align-items-center gap-2 shadow-glow border-0 transition-smooth text-uppercase tracking-wider" 
                                style={{ fontSize: '12px' }}
                                disabled={uploading || !file}
                            >
                                {uploading ? <span className="spinner-border spinner-border-sm"></span> : <Upload size={18} />}
                                {uploading ? 'Processing...' : 'Execute Bulk Upload'}
                            </button>
                        </div>
                    </div>
                </form>
            ) : (
                <div className="p-4 text-center animate-fade-in flex-grow-1 d-flex flex-column justify-content-center">
                    <div className="p-4 bg-success bg-opacity-10 text-success rounded-circle d-inline-block mb-4 mx-auto animate-bounce-subtle">
                        <CheckCircle2 size={56} />
                    </div>
                    <h4 className="text-white fw-bold mb-2">Bulk Upload Complete</h4>
                    <p className="text-muted mb-4 mx-auto" style={{maxWidth: '400px'}}>The lead sequence has been successfully processed and distributed among the designated strategic assets.</p>

                    <div className="row g-3 mb-5 justify-content-center">
                        <div className="d-flex justify-content-center gap-4 flex-wrap mb-4">
                             <div className="px-4 py-3 rounded-4 border border-white border-opacity-10 bg-surface text-center shadow-sm" style={{ minWidth: '140px' }}>
                                <div className="text-primary fw-black h2 mb-0">{uploadResult.successCount}</div>
                                <div className="text-muted fw-bold small text-uppercase tracking-widest" style={{ fontSize: '8px' }}>SUCCESSFUL</div>
                             </div>
                             
                             {uploadResult.duplicateCount > 0 && (
                                <div className="px-4 py-3 rounded-4 border border-warning border-opacity-25 bg-warning bg-opacity-10 text-center shadow-sm animate-pulse" style={{ minWidth: '140px' }}>
                                   <div className="text-warning fw-black h2 mb-0">{uploadResult.duplicateCount}</div>
                                   <div className="text-warning fw-bold small text-uppercase tracking-widest" style={{ fontSize: '8px' }}>DUPLICATES</div>
                                </div>
                             )}

                             {uploadResult.failureCount > 0 && (
                                <div className="px-4 py-3 rounded-4 border border-danger border-opacity-25 bg-danger bg-opacity-10 text-center shadow-sm" style={{ minWidth: '140px' }}>
                                   <div className="text-danger fw-black h2 mb-0">{uploadResult.failureCount}</div>
                                   <div className="text-danger fw-bold small text-uppercase tracking-widest" style={{ fontSize: '8px' }}>FAILED</div>
                                </div>
                             )}
                        </div>

                        {uploadResult.duplicateCount > 0 && (
                            <div className="alert bg-warning bg-opacity-10 border border-warning border-opacity-20 text-warning rounded-4 p-3 mb-4 d-flex align-items-center gap-3 justify-content-center animate-fade-in">
                                <AlertCircle size={18} />
                                <span className="small fw-bold">Some leads were skipped because their mobile numbers are already in the database.</span>
                            </div>
                        )}
                    </div>

                    <div className="d-flex gap-3 justify-content-center mt-auto">
                        <button className="btn btn-outline-white px-5 rounded-pill fw-bold" onClick={handleReset}>New Upload</button>
                        <button className="btn btn-primary px-5 rounded-pill fw-bold shadow-glow" onClick={isInline ? handleReset : onClose}>Complete</button>
                    </div>
                </div>
            )}
        </div>
    );

    if (isInline) return renderContent();
    
    const portalContent = (
        <div 
          className="modal-backdrop fade show d-flex align-items-center justify-content-center" 
          style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: isDarkMode ? 'rgba(2, 6, 17, 0.95)' : 'rgba(255, 255, 255, 0.8)', 
            backdropFilter: 'blur(12px)', 
            zIndex: 1100000 
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
            <div className="modal-dialog modal-xl modal-dialog-centered w-100 p-3" style={{ maxWidth: '1000px', pointerEvents: 'all' }} onClick={e => e.stopPropagation()}>
                {renderContent()}
            </div>
        </div>
    );
    
    return ReactDOM.createPortal(portalContent, document.body);
};

export default BulkUploadModal;
