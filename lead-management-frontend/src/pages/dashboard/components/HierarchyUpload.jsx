import React, { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, Trash2, Link } from 'lucide-react';
import { Card, Button } from '../../../components/common/Components';
import { toast } from 'react-toastify';
import managerService from '../../../services/managerService';
import adminService from '../../../services/adminService';
import { useAuth } from '../../../context/AuthContext';

const HierarchyUpload = ({ onSuccess }) => {
    const { user } = useAuth();
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.name.endsWith('.csv')) {
            setFile(selectedFile);
        } else {
            toast.error('Please upload a valid CSV file');
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const text = e.target.result;
                const lines = text.split('\n');
                const emailMap = {};
                
                // Assuming format: AssociateEmail,SupervisorEmail
                lines.forEach((line, index) => {
                    if (index === 0 || !line.trim()) return; // Skip header
                    const parts = line.split(',');
                    if (parts.length >= 2) {
                        emailMap[parts[0].trim()] = parts[1].trim();
                    }
                });

                const service = user.role === 'ADMIN' ? adminService : managerService;
                const res = await service.bulkAssignHierarchy(emailMap);
                setResult(res.data);
                toast.success('Hierarchy mapping completed');
                if (onSuccess) onSuccess();
            };
            reader.readAsText(file);
        } catch (err) {
            toast.error('Failed to process hierarchy upload');
        } finally {
            setUploading(false);
        }
    };

    return (
        <Card title="Structural Hierarchy Sync" subtitle="Bulk Link Associates to Team Leaders" className="h-100 shadow-lg border-0">
            {!result ? (
                <div className="d-flex flex-column gap-4 py-2">
                    <div className="p-4 bg-surface rounded-4 border-2 border-dashed border-white border-opacity-10 d-flex flex-column align-items-center justify-content-center transition-smooth hover-up">
                        <input type="file" id="hierarchyCsv" className="d-none" accept=".csv" onChange={handleFileChange} />
                        {!file ? (
                            <div className="text-center">
                                <div className="p-3 bg-primary bg-opacity-10 rounded-circle text-primary mb-3 d-inline-block shadow-glow">
                                    <Link size={32} />
                                </div>
                                <h6 className="fw-black text-main text-uppercase tracking-widest small mb-1">Upload Mapping Cloud</h6>
                                <p className="text-muted small mb-3 fw-bold opacity-75">Schema: AssociateEmail, SupervisorEmail</p>
                                <label htmlFor="hierarchyCsv" className="ui-btn ui-btn-primary px-4 py-2 rounded-pill fw-black text-uppercase tracking-wider shadow-glow cursor-pointer" style={{fontSize: '10px'}}>
                                    Select CSV
                                </label>
                            </div>
                        ) : (
                            <div className="text-center w-100">
                                <div className="p-2 bg-success bg-opacity-10 rounded-circle text-success mb-2 d-inline-block shadow-glow">
                                    <CheckCircle size={24} />
                                </div>
                                <p className="text-main fw-black text-truncate px-3 mb-1">{file.name}</p>
                                <p className="text-muted small fw-bold opacity-50 mb-3">CSV Node Ready for Propagation</p>
                                <div className="d-flex gap-2 justify-content-center">
                                    <button className="btn btn-link text-danger text-decoration-none small p-0" onClick={() => setFile(null)}>
                                        <Trash2 size={14} /> Remove
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <button 
                        className={`ui-btn ui-btn-primary py-3 rounded-pill fw-black text-uppercase tracking-widest shadow-glow border-0 d-flex align-items-center justify-content-center gap-2 ${(!file || uploading) ? 'opacity-50' : 'hover-up'}`}
                        disabled={!file || uploading}
                        onClick={handleUpload}
                    >
                        {uploading ? <div className="spinner-border spinner-border-sm"></div> : <Upload size={18} />}
                        {uploading ? 'SYNCING...' : 'EXECUTE HIERARCHY MAPPING'}
                    </button>

                    <div className="bg-primary bg-opacity-10 border border-primary border-opacity-20 p-3 rounded-4">
                        <p className="text-primary small fw-bold mb-0 text-center uppercase tracking-wider" style={{fontSize: '9px'}}>
                            USE THIS TO LINK EXISTING ASSOCIATES TO TEAM LEADERS IN BULK.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="text-center py-4">
                    <div className="p-3 bg-success bg-opacity-10 text-success rounded-circle d-inline-block mb-3 shadow-glow">
                        <CheckCircle size={42} />
                    </div>
                    <h5 className="fw-black text-main text-uppercase tracking-widest mb-4">Sync Sequence Complete</h5>
                    
                    <div className="row g-3 mb-4">
                        <div className="col-6">
                            <div className="p-3 bg-surface rounded-4 border border-white border-opacity-5">
                                <h3 className="fw-black text-primary mb-0">{result.successCount}</h3>
                                <p className="text-muted small fw-bold mb-0 uppercase">SUCCESS</p>
                            </div>
                        </div>
                        <div className="col-6">
                            <div className="p-3 bg-surface rounded-4 border border-white border-opacity-5">
                                <h3 className="fw-black text-danger mb-0">{result.failureCount}</h3>
                                <p className="text-muted small fw-bold mb-0 uppercase">FAILED</p>
                            </div>
                        </div>
                    </div>

                    {result.errors && result.errors.length > 0 && (
                        <div className="text-start mb-4 bg-danger bg-opacity-5 rounded-4 p-3 border border-danger border-opacity-10">
                            <p className="text-danger fw-black small mb-2 uppercase tracking-widest" style={{fontSize: '9px'}}>Trace Logs:</p>
                            <div className="custom-scroll" style={{maxHeight: '100px', overflowY: 'auto'}}>
                                {result.errors.map((err, i) => (
                                    <p key={i} className="text-muted small mb-1 fw-bold opacity-75" style={{fontSize: '10px'}}>{err}</p>
                                ))}
                            </div>
                        </div>
                    )}

                    <button className="ui-btn ui-btn-outline w-100 py-2 rounded-pill fw-black uppercase tracking-wider" onClick={() => setResult(null)}>
                        New Mapping
                    </button>
                </div>
            )}
        </Card>
    );
};

export default HierarchyUpload;
