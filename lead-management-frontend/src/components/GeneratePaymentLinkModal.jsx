import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Send, Plus, Trash2, Zap, IndianRupee, CreditCard, ShieldCheck } from 'lucide-react';

const GeneratePaymentLinkModal = ({ show, onClose, onConfirm, lead }) => {
  const [totalAmount, setTotalAmount] = useState('499');
  const [initialAmount, setInitialAmount] = useState('499');
  const [paymentType, setPaymentType] = useState('FULL');
  const [installments, setInstallments] = useState([]);
  const [note, setNote] = useState('');

  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  if (!show || !lead) return null;

  const addInstallment = () => {
    setInstallments([...installments, { amount: '', dueDate: '' }]);
    setPaymentType('PART');
  };

  const removeInstallment = (index) => {
    const newInstallments = installments.filter((_, i) => i !== index);
    setInstallments(newInstallments);
    if (newInstallments.length === 0) setPaymentType('FULL');
  };

  const handleInstallmentChange = (index, field, value) => {
    const newInstallments = [...installments];
    newInstallments[index][field] = value;
    setInstallments(newInstallments);
  };

  const sumOfParts =
    Number(initialAmount || 0) +
    installments.reduce((sum, inst) => sum + Number(inst.amount || 0), 0);

  const targetTotal = Number(totalAmount || 0);
  const isMatch = Math.abs(sumOfParts - targetTotal) < 1;
  const balanceRemaining = targetTotal - sumOfParts;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (paymentType === 'PART' && !isMatch) return;

    onConfirm(lead.id, {
      totalAmount: targetTotal,
      initialAmount: parseFloat(initialAmount),
      paymentType,
      note,
      installments: installments.map((inst) => ({
        amount: parseFloat(inst.amount),
        dueDate: inst.dueDate ? `${inst.dueDate}T23:59:59` : null,
      })),
    });

    onClose();
  };

  const modalContent = (
    <div className="modal-overlay d-flex align-items-center justify-content-center px-3" style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(10px)', zIndex: 11000 
    }}>
      <div className="bg-white rounded-4 shadow-2xl animate-fade-in d-flex flex-column" style={{ width: '100%', maxWidth: '520px', background: '#fff', color: '#1e293b', maxHeight: '90vh', overflow: 'hidden' }}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom bg-light bg-opacity-30">
          <div className="d-flex align-items-center gap-2">
            <div className="bg-primary bg-opacity-10 p-2 rounded-circle text-primary border border-primary border-opacity-10">
              <Zap size={18} />
            </div>
            <div>
              <h5 className="fw-black text-dark mb-0 tracking-tight" style={{ fontSize: '16px' }}>Generate Payment Schedule</h5>
              <p className="text-muted small fw-bold mb-0 text-uppercase tracking-widest" style={{ fontSize: '8px' }}>Asset Transmission Protocol</p>
            </div>
          </div>
          <button type="button" className="btn btn-sm btn-light rounded-circle shadow-sm border" onClick={onClose} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>
 
        <div className="p-4 overflow-auto custom-scroll">
          {/* Quick Action */}
          <div className="mb-4 p-3 rounded-4 border border-primary border-opacity-10 d-flex justify-content-between align-items-center transition-smooth hover-up bg-primary bg-opacity-5 cursor-pointer" 
               onClick={() => { onConfirm(lead.id, { totalAmount: 499, initialAmount: 499, paymentType: 'FULL' }); onClose(); }}>
            <div>
               <div className="text-primary fw-black text-uppercase tracking-widest mb-1" style={{ fontSize: '8px' }}>Standard Protocol</div>
               <h6 className="fw-black mb-0 text-dark">One-Tap Quick Invoice</h6>
               <p className="text-muted small mb-0 fw-bold opacity-75" style={{ fontSize: '10px' }}>Generate ₹499 Full Clearance Link</p>
            </div>
            <div className="p-2 bg-primary rounded-pill text-white shadow-glow">
               <Send size={16} />
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="row g-3 mb-4">
              <div className="col-12 col-md-6">
                 <label className="form-label small fw-black text-muted text-uppercase mb-1" style={{ fontSize: '10px' }}>Total Amount</label>
                 <div className="input-group bg-light rounded-3 border overflow-hidden shadow-sm">
                    <span className="input-group-text bg-transparent border-0 text-muted ps-3 pe-0"><IndianRupee size={14} /></span>
                    <input type="number" className="form-control border-0 bg-transparent text-dark py-2.5 fw-black shadow-none" value={totalAmount} onChange={(e) => { setTotalAmount(e.target.value); if (paymentType === 'FULL') setInitialAmount(e.target.value); }} />
                 </div>
              </div>
              <div className="col-12 col-md-6">
                 <label className="form-label small fw-black text-muted text-uppercase mb-1" style={{ fontSize: '10px' }}>Initial Amount</label>
                 <div className="input-group bg-light rounded-3 border overflow-hidden shadow-sm">
                    <span className="input-group-text bg-transparent border-0 text-muted ps-3 pe-0"><CreditCard size={14} /></span>
                    <input type="number" className="form-control border-0 bg-transparent text-dark py-2.5 fw-black shadow-none" value={initialAmount} onChange={(e) => setInitialAmount(e.target.value)} />
                 </div>
              </div>
            </div>

            <div className="mb-4">
               <label className="form-label small fw-black text-muted text-uppercase mb-2" style={{ fontSize: '10px' }}>Transmission Logic</label>
               <div className="d-flex gap-2 p-1 bg-light rounded-pill border">
                  <button type="button" className={`btn flex-grow-1 rounded-pill fw-black text-uppercase border-0 py-2 ${paymentType === 'FULL' ? 'btn-primary shadow-sm' : 'btn-transparent text-muted'}`} onClick={() => { setPaymentType('FULL'); setInstallments([]); }} style={{ fontSize: '10px' }}>Full Transmission</button>
                  <button type="button" className={`btn flex-grow-1 rounded-pill fw-black text-uppercase border-0 py-2 ${paymentType === 'PART' ? 'btn-primary shadow-sm' : 'btn-transparent text-muted'}`} onClick={() => setPaymentType('PART')} style={{ fontSize: '10px' }}>Installment Matrix</button>
               </div>
            </div>

            {paymentType === 'PART' && (
              <div className="mb-4 animate-fade-in">
                {installments.map((inst, i) => (
                  <div key={i} className="d-flex gap-2 mb-2 align-items-center">
                    <div className="flex-grow-1 input-group bg-light rounded-3 border overflow-hidden shadow-sm">
                       <span className="input-group-text bg-transparent border-0 text-muted pe-1 ps-2 small">₹</span>
                       <input type="number" placeholder="Amount" className="form-control border-0 bg-transparent py-2 small fw-bold shadow-none" value={inst.amount} onChange={(e) => handleInstallmentChange(i, 'amount', e.target.value)} />
                    </div>
                    <div className="flex-grow-1 input-group bg-light rounded-3 border overflow-hidden shadow-sm">
                       <input type="date" className="form-control border-0 bg-transparent py-2 small fw-bold shadow-none" value={inst.dueDate} onChange={(e) => handleInstallmentChange(i, 'dueDate', e.target.value)} />
                    </div>
                    <button type="button" className="btn btn-outline-danger border-0 rounded-circle p-2" onClick={() => removeInstallment(i)}>
                       <Trash2 size={16} />
                    </button>
                  </div>
                ))}

                <button type="button" className="btn btn-sm btn-outline-primary rounded-pill fw-bold border-0 d-flex align-items-center gap-2 mb-3" onClick={addInstallment}>
                  <Plus size={14} /> APPEND INSTALLMENT
                </button>

                <div className={`p-3 rounded-4 text-center border shadow-sm ${isMatch ? 'bg-success bg-opacity-10 border-success border-opacity-25 text-success' : 'bg-warning bg-opacity-10 border-warning border-opacity-25 text-warning'}`}>
                  {isMatch ? (
                    <div className="small fw-black text-uppercase tracking-widest"><ShieldCheck size={14} className="me-1" /> All Fragments Balanced</div>
                  ) : (
                    <div className="small fw-black text-uppercase tracking-widest">Awaiting Balance Integration: ₹{Math.abs(balanceRemaining).toFixed(2)}</div>
                  )}
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="form-label small fw-black text-muted text-uppercase mb-1" style={{ fontSize: '10px' }}>Reference Note</label>
              <textarea className="form-control bg-light border-0 rounded-4 py-3 shadow-none fw-bold small" rows="2" placeholder="Institutional details for this invoicing schedule..." value={note} onChange={(e) => setNote(e.target.value)} />
            </div>

            <button className={`btn btn-primary w-100 py-3 rounded-pill fw-black text-uppercase tracking-widest shadow-glow border-0 hover-up transition-smooth ${paymentType === 'PART' && !isMatch ? 'opacity-50' : ''}`} disabled={paymentType === 'PART' && !isMatch}>
              INITIALIZE TRANSMISSION LINK
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default GeneratePaymentLinkModal;