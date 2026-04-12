import React, { useState } from 'react';
import { Target, X, Check } from 'lucide-react';
import api from '../../../api/api';
import { toast } from 'react-toastify';

const TargetModal = ({ isOpen, onClose, userId, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const now = new Date();
      await api.post('/targets/set', {
        userId,
        amount,
        month: now.getMonth() + 1,
        year: now.getFullYear()
      });
      toast.success('Mission target synchronized');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error('Strategic alignment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop show d-flex align-items-center justify-content-center" style={{zIndex: 1060, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)'}}>
      <div className="premium-card p-4 animate-scale-in" style={{width: '400px', border: '1px solid rgba(255,255,255,0.1)'}}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center gap-3">
            <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-circle">
              <Target size={20} />
            </div>
            <h5 className="fw-black mb-0 text-main text-uppercase tracking-widest">Set Revenue Goal</h5>
          </div>
          <button className="btn-close btn-close-white opacity-50" onClick={onClose}></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="fw-black text-muted small text-uppercase mb-2 d-block">Monthly Capital Target (₹)</label>
            <input
              type="number"
              className="ui-input w-100 bg-surface border-white border-opacity-5 text-main fw-black"
              placeholder="Enter amount..."
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              autoFocus
            />
            <p className="small text-muted fw-bold mt-2 mb-0" style={{fontSize: '9px'}}>Current Period: {new Date().toLocaleString('default', { month: 'long' })} {new Date().getFullYear()}</p>
          </div>

          <div className="d-flex gap-2">
            <button type="button" className="ui-btn ui-btn-outline w-50 justify-content-center" onClick={onClose} disabled={loading}>
              CANCEL
            </button>
            <button type="submit" className="ui-btn ui-btn-primary w-50 justify-content-center" disabled={loading}>
              {loading ? 'SYNCING...' : 'COMMIT TARGET'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TargetModal;
