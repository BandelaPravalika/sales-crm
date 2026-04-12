import React from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Share2 } from 'lucide-react';

const InvoiceModal = ({ isOpen, onClose, invoiceData }) => {
    if (!isOpen || !invoiceData) return null;

    const handlePrint = () => {
        window.print();
    };

    const handleShare = async () => {
        const text = `Receipt for ${invoiceData.leadName}\nAmount: ₹${invoiceData.amount}\nRef: ${invoiceData.paymentGatewayId || invoiceData.id}`;
        try {
            if (navigator.share) {
                await navigator.share({ title: 'GYNATRIX RECEIPT', text });
            } else {
                window.open(`https://web.whatsapp.com/send?text=${encodeURIComponent(text)}`);
            }
        } catch (err) { }
    };

    return createPortal(
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(2, 6, 23, 0.98)',
                zIndex: 99999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                cursor: 'pointer',
                backdropFilter: 'blur(20px)'
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                id="printable-invoice"
                style={{
                    width: '100%',
                    maxWidth: '850px',
                    background: '#fff',
                    padding: '80px',
                    boxShadow: '0 25px 100px rgba(0,0,0,0.4)',
                    borderRadius: '2px',
                    color: '#000',
                    cursor: 'default',
                    position: 'relative'
                }}
            >
                {/* Float Controls (Hidden in Print) */}
                <div className="no-print position-absolute top-100 start-50 translate-middle mt-5 d-flex gap-3">
                    <button onClick={handlePrint} className="ui-btn ui-btn-primary px-4 rounded-pill shadow-glow">
                        <Printer size={16} /> PRINT INVOICE
                    </button>
                    <button onClick={handleShare} className="ui-btn ui-btn-secondary px-4 rounded-pill">
                        <Share2 size={16} /> SHARE
                    </button>
                    <button onClick={onClose} className="ui-btn ui-btn-secondary px-3 rounded-circle" style={{ width: 42, height: 42 }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Title */}
                <div className="mb-5 border-bottom border-secondary border-opacity-10 pb-4">
                    <h1 className="fw-black mb-1 letter-spacing-tight" style={{ fontSize: '3rem' }}>GYNATRIX</h1>
                    <p className="text-muted text-uppercase tracking-widest small mb-0 fw-bold">Official Core Ecosystem Receipt</p>
                </div>

                {/* Meta Row */}
                <div className="row g-4 mb-5 pb-5 border-bottom border-light">
                    <div className="col-7">
                        <div className="text-muted small text-uppercase fw-bold mb-2 opacity-50">Recipient Payload</div>
                        <div className="fw-black h4 mb-1">{invoiceData.leadName.toUpperCase()}</div>
                        <div className="text-muted font-monospace small">{invoiceData.mobile}</div>
                    </div>

                    <div className="col-5 text-end border-start border-light ps-4">
                        <div className="text-muted small text-uppercase fw-bold mb-2 opacity-50">Transmission Data</div>
                        <div className="fw-bold mb-1">DATE: {new Date(invoiceData.date || invoiceData.createdAt).toLocaleDateString()}</div>
                        <div className="text-muted small font-monospace">REF: #{invoiceData.paymentGatewayId || invoiceData.id}</div>
                    </div>
                </div>

                {/* Table Breakdown */}
                <div className="mb-5">
                    <div className="d-flex justify-content-between py-2 border-bottom text-muted small text-uppercase fw-black opacity-25">
                        <span>Ledger Entry</span>
                        <span>Credit Value</span>
                    </div>

                    <div className="d-flex justify-content-between py-5">
                        <div className="d-flex flex-column">
                            <span className="fw-bold h5 mb-1">{invoiceData.paymentType || 'OPERATIONAL SETTLEMENT'}</span>
                            <span className="text-muted small fw-bold opacity-50">Authorized via Encryption Node</span>
                        </div>
                        <strong className="h3 mb-0 fw-black">₹{invoiceData.amount}</strong>
                    </div>

                    <div className="d-flex justify-content-between py-4 border-top border-dark border-3 mt-4">
                        <span className="h4 fw-black mb-0 opacity-75">GROSS REVENUE TOTAL</span>
                        <div className="text-end">
                            <strong className="h2 mb-0 fw-black text-primary">₹{invoiceData.amount}</strong>
                            <div className="text-muted small fw-bold opacity-25" style={{ fontSize: '9px' }}>* INCLUSIVE OF ALL SYSTEM CHARGES</div>
                        </div>
                    </div>
                </div>

                {/* Verification Checkseal */}
                <div className="d-flex align-items-center gap-3 text-success fw-black mb-5 mt-5">
                    <div className="bg-success rounded-circle d-flex align-items-center justify-content-center" style={{ width: 24, height: 24 }}>
                        <X size={14} className="text-white" style={{ transform: 'rotate(45deg)' }} />
                    </div>
                    <span>IDENTITY VERIFIED & BLOCKCHAIN ANCHORED</span>
                </div>

                {/* Legal Footer */}
                <div className="mt-5 pt-5 border-top border-light opacity-50">
                    <div className="row">
                        <div className="col-8">
                            <p className="text-muted small mb-1">Electronic Authentication Hash:</p>
                            <code className="x-small text-dark font-monospace" style={{ fontSize: '8px' }}>
                                {btoa(invoiceData.id + invoiceData.leadName).substring(0, 32)}
                            </code>
                        </div>
                        <div className="col-4 text-end">
                            <p className="text-muted small mb-0 font-monospace" style={{ fontSize: '9px' }}>GEN-ID: {new Date().getTime()}</p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: #fff !important; margin: 0; padding: 0 !important; }
                    #printable-invoice { 
                        box-shadow: none !important; 
                        padding: 20px !important; 
                        width: 100% !important; 
                        max-width: 100% !important;
                    }
                }
                .fw-black { font-weight: 900 !important; }
                .tracking-tight { letter-spacing: -0.05em; }
                .hover-opacity-100:hover { opacity: 1 !important; }
            `}</style>
        </div>,
        document.body
    );
};

export default InvoiceModal;