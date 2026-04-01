import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const LeadForm = ({ onSubmit, title = "Add New Lead", initialData = {} }) => {
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    email: initialData.email || '',
    mobile: initialData.mobile || '',
    ...initialData
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await onSubmit(formData);
    if (success) {
      setFormData({ name: '', email: '', mobile: '' });
    }
  };

  return (
    <div className="premium-card shadow-lg h-100 mb-0 border-0 overflow-hidden">
      <div className="card-body d-flex flex-column h-100 p-4">
        <div className="d-flex align-items-center gap-3 mb-4">
          <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-circle shadow-glow">
            <UserPlus size={22} />
          </div>
          <div>
            <h5 className="fw-black text-main mb-0 text-uppercase tracking-widest small">{title}</h5>
            <small className="text-muted fw-bold opacity-50" style={{ fontSize: '8px' }}>INITIALIZE SINGLE DATA NODE</small>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="d-flex flex-column flex-grow-1 justify-content-between">
          <div className="row g-4 mb-4">
            <div className="col-12">
              <label className="form-label small fw-black text-uppercase text-muted mb-2 tracking-widest" style={{ fontSize: '10px' }}>Full Name</label>
              <input 
                name="name"
                className="form-control bg-surface border-0 text-main py-2.5 shadow-none rounded-3" 
                placeholder="e.g. John Doe" 
                value={formData.name}
                onChange={handleChange}
                autoComplete="off"
                required 
              />
            </div>
            <div className="col-12">
              <label className="form-label small fw-black text-uppercase text-muted mb-2 tracking-widest" style={{ fontSize: '10px' }}>Email Address <span className="text-lowercase fw-normal">(Optional)</span></label>
              <input 
                name="email"
                type="email"
                className="form-control bg-surface border-0 text-main py-2.5 shadow-none rounded-3" 
                placeholder="e.g. john@example.com" 
                value={formData.email}
                onChange={handleChange}
                autoComplete="off"
              />
            </div>
            <div className="col-12">
              <label className="form-label small fw-black text-uppercase text-muted mb-2 tracking-widest" style={{ fontSize: '10px' }}>Phone Number</label>
              <input 
                name="mobile"
                className="form-control bg-surface border-0 text-main py-2.5 shadow-none rounded-3" 
                placeholder="e.g. 919876543210" 
                value={formData.mobile}
                onChange={handleChange}
                autoComplete="off"
                required 
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary w-100 py-3 rounded-pill fw-black text-uppercase d-flex align-items-center justify-content-center gap-2 mt-auto shadow-glow border-0 transition-smooth hover-up"
            style={{ letterSpacing: '1px' }}
          >
             <UserPlus size={18} /> COMMIT LEAD NODE
          </button>
        </form>
      </div>
    </div>
  );
};

export default LeadForm;
