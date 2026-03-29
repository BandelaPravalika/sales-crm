import React, { useState } from 'react';
import { X, Send, Plus, Trash2, Calendar, IndianRupee, Layers, ShieldCheck, AlertCircle } from 'lucide-react';

const GeneratePaymentLinkModal = ({ show, onClose, onConfirm, lead }) => {
  const [totalAmount, setTotalAmount] = useState('499');
  const [initialAmount, setInitialAmount] = useState('499');
  const [paymentType, setPaymentType] = useState('FULL'); // FULL or PART
  const [installments, setInstallments] = useState([]);
  const [note, setNote] = useState('');

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

  const sumOfParts = Number(initialAmount || 0) + installments.reduce((sum, inst) => sum + Number(inst.amount || 0), 0);
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
      installments: installments.map(inst => ({
        amount: parseFloat(inst.amount),
        dueDate: inst.dueDate ? `${inst.dueDate}T23:59:59` : null
      }))
    });
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', zIndex: 10600 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden" style={{ background: '#131826', color: '#fff' }}>
          {/* Header */}
          <div className="modal-header border-bottom border-secondary border-opacity-10 p-4 d-flex justify-content-between align-items-center bg-dark bg-opacity-50">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-primary p-3 rounded-4 shadow-sm text-white">
                <Send size={24} className="animate-pulse-slow" />
              </div>
              <div>
                <h4 className="fw-black text-white mb-0 tracking-tight">Generate Payment Link</h4>
                <p className="text-secondary small fw-bold mb-0">Configuring conversion for <span className="text-primary">{lead.name}</span></p>
              </div>
            </div>
            <button type="button" className="btn btn-dark rounded-circle p-2 shadow-sm border-secondary border-opacity-25" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          
          <div className="modal-body p-4 custom-scroll">
            <form onSubmit={handleSubmit}>
              {/* Type Selector */}
              <div className="bg-dark bg-opacity-50 p-2 rounded-pill shadow-sm mb-4 d-inline-flex gap-1 border border-secondary border-opacity-10">
                <button 
                  type="button"
                  className={`btn rounded-pill px-4 py-2 fw-black text-uppercase small transition-all ${paymentType === 'FULL' ? 'btn-primary shadow' : 'btn-link text-secondary'}`}
                  onClick={() => {
                    setPaymentType('FULL');
                    setInstallments([]);
                    setInitialAmount(totalAmount);
                  }}
                >
                  Single Full Payment
                </button>
                <button 
                  type="button"
                  className={`btn rounded-pill px-4 py-2 fw-black text-uppercase small transition-all ${paymentType === 'PART' ? 'btn-primary shadow' : 'btn-link text-secondary'}`}
                  onClick={() => setPaymentType('PART')}
                >
                  Installment Plan
                </button>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-12 col-md-6">
                  <div className="p-4 rounded-4 bg-dark bg-opacity-25 border border-secondary border-opacity-10 h-100 shadow-sm">
                    <label className="form-label small fw-black text-secondary text-uppercase mb-3 tracking-wider d-flex align-items-center gap-2">
                       <Layers size={14} /> Total Package Amount
                    </label>
                    <div className="input-group input-group-lg shadow-none border-bottom border-secondary border-opacity-25 bg-transparent">
                      <span className="input-group-text bg-transparent border-0 text-secondary ps-0"><IndianRupee size={20} /></span>
                      <input 
                        type="number" 
                        className="form-control bg-transparent border-0 fw-black fs-2 p-0 shadow-none text-white" 
                        placeholder="0.00"
                        value={totalAmount}
                        onChange={(e) => {
                          setTotalAmount(e.target.value);
                          if (paymentType === 'FULL') setInitialAmount(e.target.value);
                        }}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <div className="p-4 rounded-4 bg-primary bg-opacity-10 border border-primary border-opacity-25 shadow-sm h-100 animate-slide-right">
                    <label className="form-label small fw-black text-primary text-uppercase mb-3 tracking-wider d-flex align-items-center gap-2">
                       <ShieldCheck size={14} /> Initial Link Amount
                    </label>
                    <div className="input-group input-group-lg shadow-none border-bottom border-primary border-opacity-25 bg-transparent">
                      <span className="input-group-text bg-transparent border-0 text-primary ps-0"><IndianRupee size={20} /></span>
                      <input 
                        type="number" 
                        className="form-control bg-transparent border-0 fw-black fs-2 p-0 shadow-none text-primary" 
                        placeholder="0.00"
                        value={initialAmount}
                        onChange={(e) => setInitialAmount(e.target.value)}
                        required
                      />
                    </div>
                    <p className="small text-secondary mb-0 mt-2 fw-bold italic">Generated link will hold this value.</p>
                  </div>
                </div>
              </div>

              {/* Installments Section */}
              {paymentType === 'PART' && (
                <div className="mb-4 animate-fade-in bg-dark bg-opacity-25 rounded-4 p-4 border border-secondary border-opacity-10">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h6 className="fw-black text-uppercase text-secondary small mb-0 tracking-widest d-flex align-items-center gap-2">
                      <Calendar size={18} /> Installment Schedule
                    </h6>
                    <button 
                      type="button" 
                      className="btn btn-primary btn-sm rounded-pill px-4 py-1 fw-bold d-flex align-items-center gap-2 shadow-sm"
                      onClick={addInstallment}
                    >
                      <Plus size={14} /> Add Part
                    </button>
                  </div>

                  <div className="d-flex flex-column gap-3">
                    {installments.map((inst, index) => (
                      <div key={index} className="bg-dark bg-opacity-50 p-4 rounded-4 border border-secondary border-opacity-10 shadow-sm animate-slide-up">
                        <div className="row g-4 align-items-center">
                          <div className="col-auto">
                            <span className="badge bg-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>{index + 1}</span>
                          </div>
                          
                          <div className="col-12 col-md-4">
                             <div className="form-floating bg-secondary bg-opacity-10 rounded-3">
                                <input 
                                  type="number" 
                                  className="form-control border-0 bg-transparent text-white fw-bold pt-4 pb-2 px-3 shadow-none" 
                                  id={`amt-${index}`}
                                  placeholder="Amount"
                                  value={inst.amount}
                                  onChange={(e) => handleInstallmentChange(index, 'amount', e.target.value)}
                                  required
                                />
                                <label htmlFor={`amt-${index}`} className="text-secondary small fw-bold">Installment Value (₹)</label>
                             </div>
                          </div>

                          <div className="col-12 col-md-4">
                             <div className="form-floating bg-secondary bg-opacity-10 rounded-3">
                                <input 
                                  type="date" 
                                  className="form-control border-0 bg-transparent text-white fw-bold pt-4 pb-2 px-3 shadow-none" 
                                  id={`date-${index}`}
                                  value={inst.dueDate}
                                  onChange={(e) => handleInstallmentChange(index, 'dueDate', e.target.value)}
                                  required
                                />
                                <label htmlFor={`date-${index}`} className="text-secondary small fw-bold">Due Date</label>
                             </div>
                          </div>

                          <div className="col-12 col-md-auto ms-md-auto text-end">
                            <button 
                              type="button" 
                              className="btn btn-outline-danger border-0 p-2 rounded-circle transition-all hover-bg-danger hover-text-white" 
                              onClick={() => removeInstallment(index)}
                              title="Delete Row"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Validation Bar */}
                    <div className={`mt-2 p-3 rounded-4 d-flex justify-content-between align-items-center transition-all ${isMatch ? 'bg-success bg-opacity-20 text-success' : 'bg-warning bg-opacity-20 text-warning border border-warning border-opacity-25'}`}>
                       <div className="d-flex align-items-center gap-2">
                          {isMatch ? <ShieldCheck size={18} /> : <AlertCircle size={18} />}
                          <span className="fw-black text-uppercase small tracking-wider">
                            {isMatch ? 'All Parts Balanced' : `Total sum is ₹${sumOfParts.toFixed(2)}`}
                          </span>
                       </div>
                       {!isMatch && (
                         <span className="fw-black text-uppercase small tracking-wider">
                            Remaining: ₹{Math.abs(balanceRemaining).toFixed(2)}
                         </span>
                       )}
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="form-label small fw-black text-secondary text-uppercase mb-2 tracking-wider">Internal Note (Optional)</label>
                <textarea 
                  className="form-control bg-dark text-white border-secondary border-opacity-25 shadow-sm rounded-4 p-3 fw-bold focus-ring-primary" 
                  rows="2"
                  placeholder="Payment remarks or reference details..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              {/* Action */}
              <button 
                type="submit" 
                className={`btn w-100 py-3 rounded-pill fw-black text-uppercase tracking-widest shadow-lg d-flex align-items-center justify-content-center gap-3 transition-smooth ${paymentType === 'PART' && !isMatch ? 'btn-outline-secondary opacity-50' : 'btn-primary'}`}
                disabled={paymentType === 'PART' && !isMatch}
              >
                <Send size={20} /> Generate & Blast Link
              </button>
            </form>
          </div>
        </div>
      </div>
      <style>{`
        .fw-black { font-weight: 900; }
        .animate-pulse-slow { animation: pulse 3s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.05); } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
        .animate-slide-up { animation: slideUp 0.4s ease-out; }
        .animate-slide-right { animation: slideRight 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideRight { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        .focus-ring-primary:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 0.25rem rgba(99, 102, 241, 0.25) !important; outline: 0; }
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default GeneratePaymentLinkModal;
