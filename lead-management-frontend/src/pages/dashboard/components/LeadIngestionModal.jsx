import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, UserPlus, Upload, FileBox, CheckCircle2, ChevronRight } from 'lucide-react';
import LeadForm from '../../../components/LeadForm';
import BulkUploadModal from './BulkUploadModal';
import { useTheme } from '../../../context/ThemeContext';

const LeadIngestionModal = ({ isOpen, onClose, onAddLead, onSuccess, associates = [], isInline = false }) => {
    const { isDarkMode } = useTheme();
    const [mode, setMode] = useState('CHOICE'); // 'CHOICE', 'SINGLE', 'BULK'

    if (!isOpen && !isInline) return null;

    const handleBack = () => setMode('CHOICE');

    const renderContent = () => {
        if (mode === 'SINGLE') {
            return (
                <div className="animate-fade-in">
                    <div className="d-flex align-items-center gap-2 mb-4 px-2">
                        <button className="btn btn-link text-muted p-0 text-decoration-none small fw-bold" onClick={handleBack}>← BACK</button>
                    </div>
                    <LeadForm
                        onSubmit={async (data) => {
                            const success = await onAddLead(data);
                            if (success && !isInline) onClose();
                            return success;
                        }}
                        title="Manual Node Entry"
                    />
                </div>
            );
        }

        if (mode === 'BULK') {
            return (
                <div className="animate-fade-in h-100">
                    <div className="d-flex align-items-center gap-2 mb-4 px-2">
                        <button className="btn btn-link text-muted p-0 text-decoration-none small fw-bold" onClick={handleBack}>← BACK</button>
                    </div>
                    <BulkUploadModal
                        isOpen={true}
                        isInline={true}
                        onSuccess={() => {
                            onSuccess();
                            // Keep it open for result view
                        }}
                        onClose={onClose}
                        assignees={associates}
                    />
                </div>
            );
        }

        return (
            <div className={`p-4 p-md-5 animate-fade-in position-relative overflow-hidden ${isInline ? 'ui-modal-content rounded-5 border border-white border-opacity-5' : ''}`}>
                {/* Visual accents */}
                <div className="position-absolute top-0 start-0 w-100 h-100 opacity-5 pointer-events-none">
                    <div className="position-absolute top-0 start-0 translate-middle p-5 bg-primary rounded-circle blur-3xl" style={{ width: '300px', height: '300px' }}></div>
                    <div className="position-absolute bottom-0 end-0 translate-middle p-5 bg-success rounded-circle blur-3xl" style={{ width: '300px', height: '300px' }}></div>
                </div>

                <div className="text-center mb-5 position-relative">
                    <div className="d-inline-block px-3 py-1 bg-primary bg-opacity-10 rounded-pill mb-3 border border-primary border-opacity-20 animate-pulse">
                        <span className="text-primary fw-black small tracking-widest" style={{ fontSize: '10px' }}>ACCESSING CENTRAL UPLINK</span>
                    </div>
                    <h2 className="fw-black text-main text-uppercase tracking-widest mb-2" style={{ fontSize: '2rem' }}>Lead Ingestion Terminal</h2>
                    <p className="text-muted small fw-bold opacity-75 mx-auto" style={{ maxWidth: '500px' }}>
                        Establish new data nodes within the GYNATRIX ecosystem through manual entry or high-velocity batch transmission.
                    </p>
                </div>

                <div className="row g-4 position-relative">
                    <div className="col-md-6">
                        <div
                            className="premium-card p-5 border border-white border-opacity-5 cursor-pointer transition-all h-100 ui-glass-card group overflow-hidden position-relative"
                            onClick={() => setMode('SINGLE')}
                            style={{ borderRadius: '24px' }}
                        >
                            <div className="p-4 bg-primary bg-opacity-10 text-primary rounded-4 d-inline-block mb-4 shadow-glow group-hover:scale-110 transition-all">
                                <UserPlus size={40} strokeWidth={1.5} />
                            </div>
                            <h4 className="fw-black text-main mb-3 text-uppercase tracking-wider">Single Node</h4>
                            <p className="text-muted small mb-4 opacity-75 leading-relaxed">
                                Manually initialize a single lead record perfect for real-time customer acquisition and detailed profile mapping.
                            </p>
                            <div className="d-flex align-items-center text-primary small fw-black tracking-widest gap-2 mt-auto">
                                INITIALIZE UPLINK <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </div>

                            {/* Hover accent */}
                            <div className="position-absolute top-0 end-0 w-100 h-2 bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div
                            className="premium-card p-5 border border-white border-opacity-5 cursor-pointer transition-all h-100 ui-glass-card group overflow-hidden position-relative"
                            onClick={() => setMode('BULK')}
                            style={{ borderRadius: '24px' }}
                        >
                            <div className="p-4 bg-success bg-opacity-10 text-success rounded-4 d-inline-block mb-4 shadow-glow group-hover:scale-110 transition-all">
                                <Upload size={40} strokeWidth={1.5} />
                            </div>
                            <h4 className="fw-black text-main mb-3 text-uppercase tracking-wider">Bulk Transmission</h4>
                            <p className="text-muted small mb-4 opacity-75 leading-relaxed">
                                Ingest massive datasets via CSV architecture. Automated parsing and squad distribution for high-velocity operations.
                            </p>
                            <div className="d-flex align-items-center text-success small fw-black tracking-widest gap-2 mt-auto">
                                BATCH EXECUTION <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </div>

                            {/* Hover accent */}
                            <div className="position-absolute top-0 end-0 w-100 h-2 bg-success opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                    </div>
                </div>

                <div className="mt-5 pt-4 text-center border-top border-white border-opacity-5">
                    <p className="text-muted small fw-bold opacity-40 mb-0">SECURE ENCRYPTED DATA CHANNEL • v4.2.0</p>
                </div>
            </div>
        );
    };

    if (isInline) return renderContent();

    const portalContent = (
        <div
            className="modal-backdrop fade show d-flex align-items-center justify-content-center p-3 p-md-0"
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(134, 147, 206, 0.95)',
                backdropFilter: 'blur(12px)',
                zIndex: 1060
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                className={`modal-dialog modal-dialog-centered w-100 transition-all duration-500`}
                style={{
                    maxWidth: mode === 'CHOICE' ? '850px' : '1000px',
                    pointerEvents: 'all'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div className="ui-modal-content border border-white border-opacity-10 rounded-5 shadow-2xl overflow-hidden flex-column d-flex p-1">
                    <div className="position-absolute top-0 end-0 p-4" style={{ zIndex: 10 }}>
                        <button
                            type="button"
                            className="btn btn-link text-muted p-2 rounded-circle hover:bg-surface transition-colors border-0 outline-none shadow-none"
                            onClick={onClose}
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <div className="modal-body custom-scroll p-0" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(portalContent, document.body);
};

export default LeadIngestionModal;
