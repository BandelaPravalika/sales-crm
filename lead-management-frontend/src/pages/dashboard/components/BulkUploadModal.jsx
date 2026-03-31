import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { toast } from 'react-toastify';
import managerService from '../../../services/managerService';

const BulkUploadModal = ({ isOpen, onClose, onSuccess, assignees = [], isInline = false }) => {
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
        } catch (err) {
            toast.error(err.response?.data?.message || 'Bulk upload failed');
        } finally {
            setUploading(false);
        }
    };

    const downloadTemplate = () => {
        const csvContent = "data:text/csv;charset=utf-8,Name,Email,Mobile\nJohn Doe,john@example.com,9999999999";
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
        <div className={`${!isInline ? 'modal-content border border-white border-opacity-10 rounded-4 shadow-lg overflow-hidden' : 'premium-card p-4'} h-100 flex-column d-flex`} style={{ backgroundColor: !isInline ? '#131826' : 'transparent' }}>
            {/* Header - Only if inline or first step */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center gap-3">
                    <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-3">
                        <Upload size={24} />
                    </div>
                    <div>
                        <h5 className="fw-bold text-white mb-0">Lead Ingestion Hub</h5>
                        <p className="text-muted small mb-0">Import and distribute datasets</p>
                    </div>
                </div>
                {!isInline && <button type="button" className="btn-close btn-close-white shadow-none" onClick={onClose}></button>}
            </div>

            {!uploadResult ? (
                <form onSubmit={handleSubmit} className="flex-grow-1 d-flex flex-column overflow-hidden">
                    <div className="row g-4 overflow-auto custom-scroll px-1" style={{ maxHeight: isInline ? 'none' : '60vh' }}>
                        <div className="col-lg-6">
                            <div className="flex-grow-1 d-flex flex-column gap-3 h-100">
                                <div 
                                    className={`p-5 rounded-4 border-2 border-dashed d-flex flex-column align-items-center justify-content-center transition-smooth flex-grow-1 ${
                                        dragActive ? 'border-primary bg-primary bg-opacity-10' : 'border-white border-opacity-10 bg-black bg-opacity-40'
                                    }`}
                                    onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                                    style={{ minHeight: '250px', backgroundColor: '#090a11' }}
                                >
                                    <input type="file" className="d-none" id="csvFile" accept=".csv" onChange={handleFileChange} />
                                    {!file ? (
                                        <div className="text-center">
                                            <div className="p-3 bg-white bg-opacity-5 rounded-circle mb-3 d-inline-block shadow-sm">
                                                <FileText size={42} className="text-muted" />
                                            </div>
                                            <h6 className="text-white fw-bold mb-1">Upload CSV Data</h6>
                                            <p className="text-muted small mb-3">Drag and drop file here</p>
                                            <label htmlFor="csvFile" className="btn btn-primary btn-sm px-4 rounded-pill fw-black shadow-glow border-0 text-uppercase" style={{ fontSize: '10px' }}>Browse Files</label>
                                        </div>
                                    ) : (
                                        <div className="text-center animate-fade-in">
                                            <div className="p-3 bg-success bg-opacity-10 rounded-circle mb-3 d-inline-block">
                                                <CheckCircle2 size={42} className="text-success" />
                                            </div>
                                            <h6 className="text-white fw-bold mb-1 text-truncate" style={{maxWidth: '200px'}}>{file.name}</h6>
                                            <p className="text-muted small mb-3">{(file.size / 1024).toFixed(2)} KB ready</p>
                                            <button type="button" className="btn btn-link btn-sm text-danger text-decoration-none" onClick={() => setFile(null)}>Remove</button>
                                        </div>
                                    )}
                                </div>
                                <div className="alert bg-primary bg-opacity-5 border-primary border-opacity-10 rounded-4 d-flex gap-3 mb-0">
                                    <AlertCircle size={20} className="text-primary flex-shrink-0" />
                                    <div className="small text-primary opacity-75">Format: <strong>Name, Email, Mobile</strong>. First row header.</div>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-6">
                            <div className="bg-dark bg-opacity-40 p-4 rounded-4 border border-white border-opacity-5 h-100 d-flex flex-column">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <label className="small fw-bold text-muted text-uppercase mb-0" style={{ fontSize: '10px', letterSpacing: '1px' }}>Assignment Strategy</label>
                                    <div className="btn-group btn-group-sm rounded-pill p-1 bg-black bg-opacity-50 border border-white border-opacity-5 shadow-sm">
                                        <button type="button" className={`btn rounded-pill px-3 border-0 py-1 small transition-all ${assignMode === 'SINGLE' ? 'btn-primary' : 'text-muted hover-text-white'}`} onClick={() => {setAssignMode('SINGLE'); setAssignedToIds([]);}} style={{fontSize: '9px'}}>SINGLE</button>
                                        <button type="button" className={`btn rounded-pill px-3 border-0 py-1 small transition-all ${assignMode === 'DISTRIBUTE' ? 'btn-primary' : 'text-muted hover-text-white'}`} onClick={() => {setAssignMode('DISTRIBUTE'); setAssignedToIds([]);}} style={{fontSize: '9px'}}>SPLIT</button>
                                    </div>
                                </div>

                                <div className="flex-grow-1 overflow-auto custom-scroll pe-2 mb-3" style={{ maxHeight: '200px' }}>
                                    <button 
                                        type="button"
                                        onClick={() => setAssignedToIds([])}
                                        className={`w-100 text-start p-3 rounded-4 border mb-2 transition-smooth small ${assignedToIds.length === 0 ? 'border-primary bg-primary bg-opacity-10 text-primary glow-border' : 'border-white border-opacity-5 bg-black bg-opacity-30 text-muted'}`}
                                        style={{ backgroundColor: assignedToIds.length === 0 ? '' : '#0d111b' }}
                                    >
                                        <div className="d-flex align-items-center justify-content-between">
                                            <span className="fw-bold">Direct Pool (Unassigned)</span>
                                            {assignedToIds.length === 0 && <CheckCircle2 size={16} />}
                                        </div>
                                    </button>

                                    {assignees.map(user => (
                                        <button 
                                            key={user.id} 
                                            type="button"
                                            onClick={() => toggleAssociate(user.id)}
                                            className={`w-100 text-start p-3 rounded-4 border mb-2 transition-smooth small ${assignedToIds.includes(user.id) ? 'border-primary bg-primary bg-opacity-10 text-primary glow-border' : 'border-white border-opacity-5 bg-black bg-opacity-30 text-muted'}`}
                                            style={{ backgroundColor: assignedToIds.includes(user.id) ? '' : '#0d111b' }}
                                        >
                                            <div className="d-flex align-items-center justify-content-between">
                                                <span className="fw-bold text-truncate">{user.name} <small className="opacity-50 ms-1 fw-normal text-uppercase" style={{fontSize: '8px'}}>{user.role?.replace('_', ' ') || 'User'}</small></span>
                                                {assignedToIds.includes(user.id) && <CheckCircle2 size={16} />}
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div className="mt-auto">
                                    <div className="p-2 bg-black bg-opacity-20 rounded-3 border border-white border-opacity-5">
                                        <div className="d-flex justify-content-between align-items-center small">
                                            <span className="text-muted">Target Assignees:</span>
                                            <span className="text-white fw-bold">{assignedToIds.length || 'Pool'}</span>
                                        </div>
                                        {assignMode === 'DISTRIBUTE' && assignedToIds.length > 1 && (
                                            <div className="text-primary mt-1 fw-bold" style={{fontSize: '9px'}}>ROUND-ROBIN DISTRIBUTION ENABLED</div>
                                        )}
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
                                {uploading ? 'Processing...' : 'Execute Ingestion'}
                            </button>
                        </div>
                    </div>
                </form>
            ) : (
                <div className="p-4 text-center animate-fade-in flex-grow-1 d-flex flex-column justify-content-center">
                    <div className="p-4 bg-success bg-opacity-10 text-success rounded-circle d-inline-block mb-4 mx-auto animate-bounce-subtle">
                        <CheckCircle2 size={56} />
                    </div>
                    <h4 className="text-white fw-bold mb-2">Ingestion Strategic Complete</h4>
                    <p className="text-muted mb-4 mx-auto" style={{maxWidth: '400px'}}>The lead sequence has been successfully processed and distributed among the designated strategic assets.</p>

                    <div className="row g-3 mb-5 justify-content-center">
                        {[
                            { label: 'Success', val: uploadResult.successCount, color: 'text-success', border: 'border-success' },
                            { label: 'Duplicates', val: uploadResult.duplicateCount, color: 'text-warning', border: 'border-warning' },
                            { label: 'Failed', val: uploadResult.failureCount, color: 'text-danger', border: 'border-danger' }
                        ].map(stat => (
                            <div key={stat.label} className="col-md-3">
                                <div className={`bg-black bg-opacity-20 p-3 rounded-4 text-center border ${stat.border} border-opacity-20`}>
                                    <h4 className={`${stat.color} fw-black mb-0`}>{stat.val}</h4>
                                    <small className="text-muted text-uppercase fw-bold" style={{ fontSize: '9px' }}>{stat.label}</small>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="d-flex gap-3 justify-content-center mt-auto">
                        <button className="btn btn-outline-white px-5 rounded-pill fw-bold" onClick={handleReset}>New Ingestion</button>
                        <button className="btn btn-primary px-5 rounded-pill fw-bold shadow-glow" onClick={isInline ? handleReset : onClose}>Complete</button>
                    </div>
                </div>
            )}
        </div>
    );

    if (isInline) return renderContent();

    return (
        <div className="modal-backdrop fade show d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(2, 6, 17, 0.95)', backdropFilter: 'blur(12px)', zIndex: 2000 }}>
            <div className="modal-dialog modal-xl modal-dialog-centered w-100 p-3" style={{ maxWidth: '1000px' }}>
                {renderContent()}
            </div>
        </div>
    );
};

export default BulkUploadModal;
