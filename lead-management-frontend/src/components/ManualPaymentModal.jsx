import React, { useState } from 'react';
import { X, CheckCircle, IndianRupee, Calendar, CreditCard, MessageSquare, ShieldCheck, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const ManualPaymentModal = ({ show, onClose, onConfirm, payment }) => {
  const [actualPaidAmount, setActualPaidAmount] = useState(payment?.amount || '');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [nextDueDate, setNextDueDate] = useState('');
  const [note, setNote] = useState('');

  if (!show || !payment) return null;

  const isPartial = parseFloat(actualPaidAmount || 0) < parseFloat(payment.amount);
  const balance = parseFloat(payment.amount) - parseFloat(actualPaidAmount || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isPartial && !nextDueDate) {
      toast.error('Please select a next due date for the partial payment.');
      return;
    }
    
    toast.info('Processing manual clearance...');
    onConfirm(payment.id, {
      status: 'PAID',
      paymentMethod,
      note,
      actualPaidAmount: parseFloat(actualPaidAmount),
      nextDueDate: nextDueDate ? `${nextDueDate}T23:59:59` : null,
      paymentType: isPartial ? 'EMI' : 'FULL'
    });
  };


  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(10px)', zIndex: 11000, overflowY: 'auto' }}>
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden" style={{ background: '#131826', color: '#fff' }}>
          {/* Header */}
          <div className="modal-header border-bottom border-secondary border-opacity-10 bg-dark bg-opacity-50 p-3 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-success bg-opacity-20 p-2 rounded-4 text-success shadow-sm">
                <CheckCircle size={20} />
              </div>
              <div>
                <h5 className="fw-black text-white mb-0 tracking-tight">Manual Clearance</h5>
                <p className="text-secondary small fw-bold mb-0 text-uppercase tracking-widest" style={{ fontSize: '10px' }}>UID: <span className="text-success">{payment.paymentGatewayId || payment.id}</span></p>
              </div>
            </div>
            <button type="button" className="btn btn-dark rounded-circle p-2 shadow-sm border-secondary border-opacity-25" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
          
          <div className="modal-body p-3 p-md-4 custom-scroll">
            <form onSubmit={handleSubmit}>
              <div className="bg-dark bg-opacity-50 p-3 rounded-4 border border-secondary border-opacity-10 mb-4 text-center shadow-inner">
                 <label className="fw-black text-uppercase text-secondary small mb-1 tracking-widest">Expected Revenue</label>
                 <div className="d-flex align-items-center justify-content-center gap-2">
                    <IndianRupee size={28} className="text-success" />
                    <h2 className="fw-black text-white mb-0 display-4">{payment.amount.toLocaleString()}</h2>
                 </div>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-12">
                  <label className="form-label small fw-black text-secondary text-uppercase mb-2 tracking-wider">Actually Received (₹)</label>
                  <div className="input-group bg-dark bg-opacity-50 rounded-4 overflow-hidden border border-secondary border-opacity-25 focus-within-primary transition-all">
                    <span className="input-group-text bg-transparent border-0 text-secondary ps-3"><IndianRupee size={18} /></span>
                    <input 
                      type="number" 
                      className="form-control bg-transparent border-0 text-white py-2 shadow-none fw-black fs-4" 
                      value={actualPaidAmount}
                      onChange={(e) => setActualPaidAmount(e.target.value)}
                      max={payment.amount}
                      required
                    />
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label small fw-black text-secondary text-uppercase mb-2 tracking-wider">Payment Method</label>
                  <div className="input-group bg-dark bg-opacity-50 rounded-4 overflow-hidden border border-secondary border-opacity-25 h-100">
                    <span className="input-group-text bg-transparent border-0 text-secondary ps-3 w-auto"><CreditCard size={18} /></span>
                    <select 
                      className="form-select bg-transparent border-0 text-white shadow-none fw-bold"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      style={{ cursor: 'pointer', outline: 'none' }}
                    >
                      <option value="UPI" style={{ background: '#1a1f2e' }}>Liquid Cash</option>
                      <option value="CASH" style={{ background: '#1a1f2e' }}>Cash Deposit</option>
                      <option value="BANK_TRANSFER" style={{ background: '#1a1f2e' }}>Bank/IMPS</option>
                      <option value="CARD" style={{ background: '#1a1f2e' }}>Payment Gateway</option>
                    </select>
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label small fw-black text-secondary text-uppercase mb-2 tracking-wider">Identity/Lead</label>
                  <div className="bg-secondary bg-opacity-10 rounded-4 px-3 py-2 border border-secondary border-opacity-10 h-100 d-flex align-items-center" style={{ minHeight: '42px' }}>
                     <span className="fw-bold text-white small text-truncate">{payment.leadName || 'System Record'}</span>
                  </div>
                </div>
              </div>

              {isPartial && (
                <div className="mb-4 p-3 rounded-4 bg-warning bg-opacity-10 border border-warning border-opacity-20 animate-slide-up shadow-sm">
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                     <div className="d-flex align-items-center gap-2 text-warning">
                        <AlertCircle size={18} />
                        <span className="fw-black text-uppercase small tracking-widest">Partial Setup</span>
                     </div>
                     <span className="badge bg-warning bg-opacity-20 text-warning px-2 py-1 fw-black text-uppercase border border-warning border-opacity-25" style={{ fontSize: '11px' }}>Bal: ₹{balance.toLocaleString()}</span>
                  </div>
                  
                  <label className="form-label small fw-black text-warning text-uppercase mb-2 tracking-wider">Next Installment Due Date</label>
                  <div className="input-group bg-dark bg-opacity-50 rounded-4 border border-warning border-opacity-25 overflow-hidden shadow-sm">
                    <span className="input-group-text bg-transparent border-0 text-warning ps-3"><Calendar size={18} /></span>
                    <input 
                      type="date" 
                      className="form-control bg-transparent border-0 text-white fw-bold py-2 shadow-none h-auto" 
                      value={nextDueDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setNextDueDate(e.target.value)}
                      required
                    />
                  </div>
                  <p className="text-secondary mt-2 mb-0 fw-bold italic" style={{ fontSize: '11px' }}>A new trackable task will be created for the balance amount.</p>
                </div>
              )}

              <div className="mb-4">
                <label className="form-label small fw-black text-secondary text-uppercase mb-2 tracking-wider">Transaction Note</label>
                <textarea 
                  className="form-control bg-dark bg-opacity-50 text-white border-secondary border-opacity-25 shadow-sm rounded-4 p-3 fw-bold focus-ring-primary" 
                  rows="2"
                  placeholder="e.g. Received via WhatsApp proof, reference #990..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-success w-100 py-3 rounded-pill fw-black text-uppercase tracking-widest shadow-lg d-flex align-items-center justify-content-center gap-3 transition-smooth hover-up"
              >
                <ShieldCheck size={20} /> Mark as Cleared & Verified
              </button>
            </form>
          </div>
        </div>
      </div>
      <style>{`
        .fw-black { font-weight: 900; }
        .focus-within-primary:focus-within { border-color: #6366f1 !important; box-shadow: 0 0 0 0.25rem rgba(99, 102, 241, 0.25) !important; outline: 0; }
        .focus-ring-primary:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 0.25rem rgba(99, 102, 241, 0.25) !important; outline: 0; }
        .animate-slide-up { animation: slideUp 0.4s ease-out; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .hover-up:hover { transform: translateY(-3px); filter: brightness(1.1); }
        .transition-smooth { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default ManualPaymentModal;
