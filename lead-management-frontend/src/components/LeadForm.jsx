import { useState } from 'react';
import { UserPlus } from 'lucide-react';

const LeadForm = ({ onSubmit, title = "Add New Lead", initialData = {} }) => {
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
    <div className="card shadow-sm h-100 mb-4">
      <div className="card-body d-flex flex-column h-100">
        <div className="d-flex align-items-center gap-2 mb-4">
          <div className="p-2 bg-primary bg-opacity-10 text-primary rounded">
            <UserPlus size={20} />
          </div>
          <h5 className="card-title fw-bold mb-0">{title}</h5>
        </div>
        
        <form onSubmit={handleSubmit} className="d-flex flex-column flex-grow-1 justify-content-between">
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-4">
              <label className="form-label small text-muted text-uppercase fw-bold mb-1">Full Name</label>
              <input 
                name="name"
                className="form-control bg-secondary bg-opacity-10 border-secondary border-opacity-25" 
                placeholder="e.g. John Doe" 
                value={formData.name}
                onChange={handleChange}
                autoComplete="off"
                required 
              />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label small text-muted text-uppercase fw-bold mb-1">Email <span className="text-lowercase fw-normal">(Optional)</span></label>
              <input 
                name="email"
                type="email"
                className="form-control bg-secondary bg-opacity-10 border-secondary border-opacity-25" 
                placeholder="e.g. john@example.com" 
                value={formData.email}
                onChange={handleChange}
                autoComplete="off"
              />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label small text-muted text-uppercase fw-bold mb-1">Mobile Number</label>
              <input 
                name="mobile"
                className="form-control bg-secondary bg-opacity-10 border-secondary border-opacity-25" 
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
            className="btn btn-primary w-100 py-3 fw-black text-uppercase d-flex align-items-center justify-content-center gap-2 mt-auto shadow-glow border-0 transition-smooth"
            style={{ letterSpacing: '1px' }}
          >
             <UserPlus size={18} /> CREATE LEAD ENTRY
          </button>
        </form>
      </div>
    </div>
  );
};

export default LeadForm;
