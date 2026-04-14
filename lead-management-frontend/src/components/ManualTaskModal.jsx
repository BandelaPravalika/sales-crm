import React, { useState } from 'react';
import { X, Calendar, AlignLeft, User, Target, Clock, CheckCircle, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import tlService from '../services/tlService';

const ManualTaskModal = ({ show, onClose, onTaskCreated, leads, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialData ? {
    ...initialData,
    dueDate: initialData.dueDate || ''
  } : {
    leadId: '',
    title: '',
    description: '',
    dueDate: '',
    taskType: 'FOLLOW_UP'
  });

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        dueDate: initialData.dueDate || ''
      });
    }
  }, [initialData]);

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Format ISO string to handle LocalDateTime.parse
      const payload = {
        ...formData,
        dueDate: formData.dueDate ? `${formData.dueDate}T09:00:00` : null
      };

      if (!payload.dueDate) {
        toast.error('Please select a schedule date');
        return;
      }

      await tlService.createTask(payload);
      toast.success('Task scheduled successfully');
      onTaskCreated();
      onClose();
    } catch (err) {
      toast.error('Failed to schedule task');
    } finally {
      setLoading(false);
    }
  };

  const setQuickDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setFormData({ ...formData, dueDate: d.toISOString().split('T')[0] });
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 11000 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden bg-card" style={{ color: 'var(--text-main)' }}>

          {/* Header */}
          <div className="modal-header border-bottom border-secondary border-opacity-10 bg-surface bg-opacity-30 p-4">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-primary bg-opacity-20 p-3 rounded-4 text-primary shadow-sm">
                <Calendar size={24} />
              </div>
              <div>
                <h4 className="fw-black text-main mb-0 tracking-tight">Schedule Activity</h4>
                <p className="text-muted small fw-bold mb-0 text-uppercase tracking-widest" style={{ fontSize: '9px' }}>Manual Ledger Entry</p>
              </div>
            </div>
            <button type="button" className="btn btn-link text-main rounded-circle p-2 shadow-sm border border-secondary border-opacity-25" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <div className="modal-body p-4">
            <form onSubmit={handleSubmit}>

              {/* Lead Selection */}
              <div className="mb-4">
                <label className="form-label small fw-black text-muted text-uppercase mb-2 tracking-wider">Linked Student / Lead</label>
                <div className="input-group bg-surface bg-opacity-50 rounded-4 overflow-hidden border border-secondary border-opacity-25 focus-within-primary transition-all">
                  <span className="input-group-text bg-transparent border-0 text-muted ps-3"><User size={18} /></span>
                  <select
                    className="form-select bg-transparent border-0 text-main py-2 shadow-none fw-bold"
                    value={formData.leadId}
                    onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
                    required
                  >
                    <option value="" className="bg-card">Select Opportunity...</option>
                    {leads.map(l => (
                      <option key={l.id} value={l.id} className="bg-card">{l.name} ({l.email || 'No email'})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title & Type */}
              <div className="row g-3 mb-4">
                <div className="col-12 col-md-8">
                  <label className="form-label small fw-black text-muted text-uppercase mb-2 tracking-wider">Objective / Title</label>
                  <div className="input-group bg-surface bg-opacity-50 rounded-4 overflow-hidden border border-secondary border-opacity-25 focus-within-primary transition-all">
                    <span className="input-group-text bg-transparent border-0 text-muted ps-3"><Target size={18} /></span>
                    <input
                      type="text"
                      className="form-control bg-transparent border-0 text-main py-3 shadow-none fw-black"
                      placeholder="e.g. Closing Call @ 5PM"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-black text-muted text-uppercase mb-2 tracking-wider">Classification</label>
                  <select
                    className="form-select bg-surface bg-opacity-80 rounded-4 border-secondary border-opacity-30 text-main py-3 shadow-none fw-bold"
                    value={formData.taskType}
                    onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}
                  >
                    <option value="FOLLOW_UP" className="bg-card">Follow-up</option>
                    <option value="EMI_COLLECTION" className="bg-card">EMI Collection</option>
                    <option value="INVITATION" className="bg-card">Invitation</option>
                    <option value="CLOSING" className="bg-card">Closing</option>
                  </select>
                </div>
              </div>

              {/* Date Selection - Think like a calendar! */}
              <div className="mb-4">
                <label className="form-label small fw-black text-muted text-uppercase mb-2 tracking-wider">Scheduled Target Date</label>
                <div className="input-group bg-surface bg-opacity-80 rounded-4 overflow-hidden border border-secondary border-opacity-30 focus-within-primary transition-all mb-3">
                  <span className="input-group-text bg-transparent border-0 text-muted ps-3"><Clock size={18} /></span>
                  <input
                    type="date"
                    className="form-control bg-transparent border-0 text-main py-3 shadow-none fw-black h-auto"
                    value={formData.dueDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    style={{ colorScheme: 'dark' }}
                    required
                  />
                </div>
                <div className="d-flex gap-2 flex-wrap">
                  <button type="button" onClick={() => setQuickDate(0)} className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 fw-black x-small">Today</button>
                  <button type="button" onClick={() => setQuickDate(1)} className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 fw-black x-small">Tomorrow</button>
                  <button type="button" onClick={() => setQuickDate(7)} className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 fw-black x-small">Next Week</button>
                </div>
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="form-label small fw-black text-muted text-uppercase mb-2 tracking-wider">Strategy / Notes</label>
                <div className="input-group bg-surface bg-opacity-80 rounded-4 overflow-hidden border border-secondary border-opacity-30 focus-within-primary transition-all">
                  <span className="input-group-text bg-transparent border-0 text-muted ps-3 pt-3 align-self-start"><AlignLeft size={18} /></span>
                  <textarea
                    className="form-control bg-transparent border-0 text-main py-3 shadow-none fw-bold"
                    placeholder="Document specific points for this interaction..."
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 py-3 rounded-pill fw-black text-uppercase tracking-widest shadow-lg d-flex align-items-center justify-content-center gap-2 hover-up"
                disabled={loading}
              >
                {loading ? <RefreshCw className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                {loading ? 'Committing...' : 'Commit to Schedule'}
              </button>
            </form>
          </div>
        </div>
      </div>
      <style>{`
        .premium-modal-card { background: rgba(13, 17, 23, 0.95); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); }
        .premium-input-group { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; overflow: hidden; display: flex; align-items: center; }
        .premium-input-group.focused { border-color: #6366f1; background: rgba(99, 102, 241, 0.05); }
        .btn-close-custom { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .btn-close-custom:hover { background: #ef4444; border-color: #ef4444; transform: rotate(90deg); }
        .search-dropdown-overlay { position: absolute; top: 100%; left: 0; right: 0; background: #1a1f2e; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; margin-top: 8px; z-index: 1000; overflow: hidden; }
        .dropdown-item-custom { padding: 12px 20px; cursor: pointer; transition: all 0.2s; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .dropdown-item-custom:hover { background: rgba(99, 102, 241, 0.1); }
        .dropdown-item-custom.active { background: rgba(99, 102, 241, 0.2); border-left: 4px solid #6366f1; }
        .avatar-sm { width: 32px; height: 32px; font-size: 11px; }
        .quick-date-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #6366f1; font-weight: 900; font-size: 10px; padding: 6px 16px; border-radius: 100px; text-transform: uppercase; transition: all 0.2s; }
        .quick-date-btn:hover { background: #6366f1; color: white; transform: translateY(-2px); }
        .btn-sync-action { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; border: none; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .btn-sync-action:hover { transform: translateY(-3px); box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.5); }
        .btn-sync-action:active { transform: translateY(0); }
        .animate-slide-down { animation: slideDown 0.3s ease-out; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .rotate-180 { transform: rotate(180deg); }
      `}</style>
    </div>
  );
};

export default ManualTaskModal;
