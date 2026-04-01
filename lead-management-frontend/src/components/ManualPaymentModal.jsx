import React, { useState, useEffect } from 'react';
import { X, CheckCircle, IndianRupee, Calendar, ShieldCheck, CreditCard } from 'lucide-react';
import { toast } from 'react-toastify';

const ManualPaymentModal = ({ show, onClose, onConfirm, payment }) => {
  const [actualPaidAmount, setActualPaidAmount] = useState(payment?.amount || '');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [nextDueDate, setNextDueDate] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  if (!show || !payment) return null;

  const isPartial = parseFloat(actualPaidAmount || 0) < parseFloat(payment?.amount || 0);
  const balance = parseFloat(payment?.amount || 0) - parseFloat(actualPaidAmount || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isPartial && !nextDueDate) {
      toast.error('Select next due date');
      return;
    }
    
    onConfirm(payment.id, {
      status: 'PAID',
      paymentMethod,
      note,
      actualPaidAmount: parseFloat(actualPaidAmount),
      nextDueDate: nextDueDate ? `${nextDueDate}T23:59:59` : null,
      paymentType: isPartial ? 'EMI' : 'FULL'
    });
    onClose();
  };

  return (
    <div className="modal-overlay d-flex align-items-center justify-content-center px-3" style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(10px)', zIndex: 11000 
    }}>
      <div className="bg-white rounded-4 shadow-2xl animate-slide-up border-0 d-flex flex-column" style={{ width: '100%', maxWidth: '480px', background: '#ffffff', color: '#1e293b', maxHeight: '85vh', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
        {/* Header */}
        <div className="modal-header border-bottom p-3 bg-light bg-opacity-30">
          <div className="d-flex align-items-center gap-2">
            <div className="bg-success bg-opacity-10 p-2 rounded-circle text-success border border-success border-opacity-10">
              <CheckCircle size={18} />
            </div>
            <div>
              <h5 className="fw-black text-dark mb-0 tracking-tight" style={{ fontSize: '16px' }}>Manual Ledger Clearance</h5>
              <p className="text-muted small fw-bold mb-0 text-uppercase tracking-widest" style={{ fontSize: '8px' }}>Institutional Grade Verification</p>
            </div>
          </div>
          <button type="button" className="btn btn-sm btn-light rounded-circle shadow-sm border" onClick={onClose} style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} />
          </button>
        </div>
        
        <div className="modal-body p-4 overflow-auto custom-scroll">
          <form onSubmit={handleSubmit}>
            {/* Amount Summary Card */}
            <div className="d-flex align-items-center justify-content-between mb-4 p-3 rounded-4 border border-info border-opacity-10 shadow-sm" style={{ backgroundColor: '#f8fafc' }}>
               <div className="d-flex align-items-center gap-3">
                  <div className="bg-white p-2 rounded-3 shadow-sm text-primary border">
                    <IndianRupee size={20} />
                  </div>
                  <div>
                    <h4 className="fw-black text-dark mb-0 tracking-tight" style={{ fontSize: '22px' }}>{payment.amount.toLocaleString()}</h4>
                    <p className="text-muted small mb-0 fw-bold text-uppercase tracking-widest" style={{ fontSize: '9px' }}>Receivable Amount</p>
                  </div>
               </div>
               <div className="text-end">
                 <p className="text-muted small mb-0 fw-bold text-uppercase tracking-widest" style={{ fontSize: '9px' }}>Entity Identity</p>
                 <span className="fw-black text-dark small" style={{ fontSize: '12px' }}>{payment.leadName || 'System Record'}</span>
               </div>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-6">
                <label className="form-label small fw-black text-muted text-uppercase mb-1" style={{ fontSize: '10px' }}>Actually Paid (₹)</label>
                <div className="input-group bg-light rounded-3 border overflow-hidden transition-all shadow-sm focus-within-green">
                  <input 
                    type="number" 
                    className="form-control border-0 bg-transparent text-dark py-2.5 shadow-none fw-black" 
                    value={actualPaidAmount}
                    onChange={(e) => setActualPaidAmount(e.target.value)}
                    max={payment.amount}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="col-6">
                <label className="form-label small fw-black text-muted text-uppercase mb-1" style={{ fontSize: '10px' }}>Payment Channel</label>
                <div className="input-group bg-light rounded-3 border overflow-hidden h-100 shadow-sm">
                  <select 
                    className="form-select border-0 bg-transparent text-dark shadow-none fw-bold small py-2.5"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{ fontSize: '13px' }}
                  >
                    <option value="UPI">Liquid (UPI/Mobile)</option>
                    <option value="CASH">Direct Cash</option>
                    <option value="BANK_TRANSFER">Bank/IMPS</option>
                    <option value="CARD">Credit/Debit Card</option>
                  </select>
                </div>
              </div>
            </div>

            {isPartial && (
              <div className="mb-4 p-3 rounded-4 border animate-slide-up shadow-sm" style={{ backgroundColor: 'rgba(251, 191, 36, 0.03)', borderColor: 'rgba(251, 191, 36, 0.2)' }}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                   <div className="d-flex align-items-center gap-2">
                      <Calendar size={14} className="text-warning" />
                      <span className="fw-black text-warning text-uppercase small tracking-widest" style={{ fontSize: '9px' }}>Incremental Settlement</span>
                   </div>
                   <span className="badge bg-warning bg-opacity-10 text-dark px-2 py-0.5 fw-black text-uppercase border border-warning border-opacity-10" style={{ fontSize: '9px' }}>Balance: ₹{balance.toLocaleString()}</span>
                </div>
                
                <div className="input-group bg-white rounded-3 border overflow-hidden shadow-sm">
                  <input 
                    type="date" 
                    className="form-control bg-transparent border-0 text-dark fw-bold py-2 shadow-none h-auto small" 
                    value={nextDueDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setNextDueDate(e.target.value)}
                    required
                  />
                </div>
                <p className="text-muted mb-0 mt-1" style={{ fontSize: '8px' }}>* System will auto-generate subsequent ledger entries.</p>
              </div>
            )}

            <div className="mb-4">
              <label className="form-label small fw-black text-muted text-uppercase mb-1" style={{ fontSize: '10px' }}>Internal Reference Note</label>
              <input 
                type="text"
                className="form-control form-control-sm bg-light border rounded-3 fw-bold shadow-none py-2.5 px-3"
                placeholder="Log transaction rationale (Ref #, proof, etc...)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                style={{ fontSize: '12px' }}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-success w-100 py-3 rounded-4 fw-black text-uppercase tracking-widest shadow-lg d-flex align-items-center justify-content-center gap-3 transition-smooth hover-up border-0"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
            >
              <ShieldCheck size={20} /> VERIFY & FINALIZE
            </button>
          </form>
        </div>
      </div>
      <style>{`
        .fw-black { font-weight: 900; }
        .animate-slide-up { animation: slideUp 0.4s ease-out; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .hover-up:hover { transform: translateY(-3px); filter: brightness(1.05); }
        .transition-smooth { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .focus-within-green:focus-within { border-color: #10b981 !important; box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1) !important; }
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default ManualPaymentModal;