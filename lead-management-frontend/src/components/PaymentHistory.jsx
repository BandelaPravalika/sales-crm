import React, { useState, useEffect } from 'react';
import paymentService from '../services/paymentService';
import adminService from '../services/adminService';
import managerService from '../services/managerService';
import { toast } from 'react-toastify';
import { IndianRupee, CheckCircle, Scissors, PlusCircle } from 'lucide-react';
import SplitInstallmentModal from './SplitInstallmentModal';
import RecordPaymentModal from './RecordPaymentModal';
import ManualPaymentModal from './ManualPaymentModal';

const PaymentHistory = ({ role }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teamLeaders, setTeamLeaders] = useState([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    tlId: '',
    associateId: '',
    status: ''
  });
  const [associates, setAssociates] = useState([]);
  const [fetchingAssociates, setFetchingAssociates] = useState(false);
  const [selectedSplitPayment, setSelectedSplitPayment] = useState(null);
  const [selectedClearPayment, setSelectedClearPayment] = useState(null);

  const fetchTeamLeaders = async () => {
    if (role === 'ADMIN' || role === 'MANAGER') {
      try {
        const res = role === 'ADMIN' ? await adminService.fetchUsers() : await managerService.fetchTeamLeaders();
        setTeamLeaders(role === 'ADMIN' ? res.data.filter(u => u.role === 'TEAM_LEADER') : res.data);
      } catch (err) {
        console.error('Failed to fetch TLs');
      }
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await paymentService.fetchHistory(role, filters);
      setPayments(res.data);
    } catch (err) {
      toast.error('Failed to fetch history');
    } finally {
      setLoading(false);
    }
  };

  const handleManualClear = async (paymentId, data) => {
    try {
      await paymentService.updatePaymentStatus(paymentId, data);
      toast.success('Payment cleared successfully');
      setSelectedClearPayment(null);
      fetchHistory();
    } catch (err) {
      toast.error('Failed to clear payment');
    }
  };

  const handleSplitConfirm = async (paymentId, splitData) => {
    try {
      await paymentService.splitPayment(paymentId, splitData);
      toast.success('Payment split into installments');
      setSelectedSplitPayment(null);
      fetchHistory();
    } catch (err) {
      toast.error('Failed to split payment');
    }
  };

  const handleRecordConfirm = async (formData) => {
    // Feature removed per request
  };

  const fetchAssociates = async (tlId) => {
    if (!tlId) {
      setAssociates([]);
      return;
    }
    setFetchingAssociates(true);
    try {
      const res = await adminService.fetchAssociatesByTl(tlId);
      setAssociates(res.data);
    } catch (err) {
      console.error('Failed to fetch associates');
    } finally {
      setFetchingAssociates(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchTeamLeaders();
  }, [role, filters.startDate, filters.endDate, filters.tlId, filters.status]);

  useEffect(() => {
    if (filters.tlId) {
      fetchAssociates(filters.tlId);
      setFilters(prev => ({ ...prev, associateId: '' }));
    } else {
      setAssociates([]);
    }
  }, [filters.tlId]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const resetFilters = () => {
    setFilters({ startDate: '', endDate: '', tlId: '', associateId: '', status: '' });
    setAssociates([]);
  };

  if (loading && payments.length === 0) return (
    <div className="d-flex justify-content-center p-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );

  return (
    <div className="card shadow-sm rounded-4 mt-4 overflow-hidden mb-5 bg-dark bg-opacity-50 border border-white border-opacity-5">
      <div className="card-body p-4">
        {/* Header and Filters */}
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center mb-4 gap-4">
          <div className="d-flex flex-column flex-sm-row align-items-sm-center gap-3">
            <div>
              <h5 className="fw-black mb-0 text-white" style={{ fontSize: '18px' }}>Financial Transmission Ledger</h5>
              <p className="text-muted small mb-0 fw-bold opacity-50 text-uppercase tracking-wider" style={{ fontSize: '9px' }}>Real-time payment audit</p>
            </div>
          </div>
          
          <div className="d-flex flex-column flex-md-row gap-3 w-100 w-lg-auto align-items-md-end">
            {(role === 'ADMIN' || role === 'MANAGER') && (
              <div className="flex-grow-1">
                <label className="form-label small text-muted mb-1 px-1">Lead Node</label>
                <select 
                  name="tlId"
                  value={filters.tlId}
                  onChange={handleFilterChange}
                  className="form-select dark-input rounded-3 bg-dark bg-opacity-50 text-white border-white border-opacity-10 shadow-none px-3"
                  style={{ fontSize: '12px' }}
                >
                  <option value="" className="bg-dark text-white">All Leaders</option>
                  {teamLeaders.map(tl => (
                    <option key={tl.id} value={tl.id} className="bg-dark text-white">{tl.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="d-flex flex-column flex-sm-row gap-3 flex-grow-1">
              <div className="flex-grow-1">
                <label className="form-label small text-muted mb-1 px-1">Status</label>
                <select 
                  className="form-select dark-input rounded-3 bg-dark bg-opacity-50 text-white border-white border-opacity-10 shadow-none px-3 py-2"
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  style={{ fontSize: '12px', minWidth: '130px' }}
                >
                  <option value="" className="bg-dark text-white">All Statuses</option>
                  <option value="PAID" className="bg-dark text-white">Paid</option>
                  <option value="PENDING" className="bg-dark text-white">Pending</option>
                  <option value="FAILED" className="bg-dark text-white">Failed</option>
                </select>
              </div>
              <div className="flex-grow-1">
                <label className="form-label small text-muted mb-1 px-1">Start Date</label>
                <input 
                  type="date" 
                  className="form-control dark-input rounded-3 bg-dark bg-opacity-50 text-white border-white border-opacity-10 shadow-none px-3 py-2"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  style={{ fontSize: '12px' }}
                />
              </div>
              <div className="flex-grow-1">
                <label className="form-label small text-muted mb-1 px-1 fw-medium" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>End Date</label>
                <input 
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="form-control dark-input rounded-pill bg-dark bg-opacity-50 text-white border-white border-opacity-10 shadow-none px-3 py-2"
                  style={{ fontSize: '12px', height: '38px' }}
                />
              </div>
            </div>

            <div className="d-flex gap-2">
              <button onClick={fetchHistory} className="btn btn-primary rounded-pill px-4 fw-semibold shadow-sm" style={{ fontSize: '12px' }}>Apply</button>
              <button onClick={resetFilters} className="btn btn-outline-secondary rounded-pill px-4 fw-semibold border-opacity-25" style={{ fontSize: '12px' }}>Reset</button>
            </div>
          </div>
        </div>

        <div className="table-responsive d-none d-md-block">
          <table className="table table-hover align-middle table-dark bg-transparent mb-0">
            <thead>
              <tr className="text-muted small fw-semibold border-bottom border-white border-opacity-5">
                <th className="ps-4">Date</th>
                <th>Student</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Lead Node</th>
                <th className="pe-4 text-end">Reference</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="table-row border-white border-opacity-5">
                  <td className="ps-4 table-cell">
                    <div className="d-flex flex-column">
                      <span className="fw-bold">{new Date(payment.createdAt).toLocaleDateString()}</span>
                      <small className="text-muted" style={{ fontSize: '10px' }}>{new Date(payment.createdAt).toLocaleTimeString()}</small>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="d-flex flex-column">
                      <span className="fw-bold text-uppercase" style={{ fontSize: '12px' }}>{payment.leadName}</span>
                      <small className="text-muted fst-italic" style={{ fontSize: '10px' }}>{payment.leadEmail}</small>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className="fw-bold text-success">₹{payment.amount}</span>
                  </td>
                  <td className="table-cell">
                    <div className="d-flex flex-column">
                       <span className={`badge rounded-sm px-2 py-1 fw-bold ${(payment.status === 'PAID' || payment.status === 'SUCCESS' || payment.status === 'APPROVED') ? 'bg-success bg-opacity-10 text-success' : payment.status === 'PENDING' ? 'bg-warning bg-opacity-10 text-warning' : 'bg-danger bg-opacity-10 text-danger'}`} style={{ width: 'fit-content', fontSize: '9px', border: '1px solid currentColor' }}>
                         {payment.status}
                       </span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className="badge bg-secondary bg-opacity-10 text-muted rounded-pill px-2 py-1" style={{ fontSize: '10px' }}>{payment.assignedTlName || "Unassigned"}</span>
                  </td>
                  <td className="pe-4 table-cell text-end">
                     <div className="d-flex justify-content-end gap-2">
                        {payment.status === 'PENDING' && (
                          <>
                            <button 
                              onClick={() => setSelectedClearPayment(payment)}
                              className="btn btn-sm btn-success p-1 px-2 d-flex align-items-center gap-1 fw-bold"
                              title="Manual Clear"
                            >
                              <CheckCircle size={14} /> Clear
                            </button>
                            <button 
                              onClick={() => setSelectedSplitPayment(payment)}
                              className="btn btn-sm btn-outline-primary p-1 px-2 d-flex align-items-center gap-1 fw-bold"
                              title="Split into Installments"
                            >
                              <Scissors size={14} /> Split
                            </button>
                          </>
                        )}
                        <code className="bg-secondary bg-opacity-10 px-2 py-1 rounded border border-secondary border-opacity-25 text-muted small">{payment.paymentGatewayId || payment.referenceId}</code>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>        {/* Mobile Card View */}
        <div className="d-md-none d-flex flex-column gap-3">
          {payments.map((payment) => (
            <div key={payment.id} className="card shadow-sm border border-white border-opacity-5 rounded-4 p-3 bg-dark bg-opacity-20 hover-scale transition-all">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="d-flex flex-column gap-1">
                   <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '10px' }}>{new Date(payment.createdAt).toLocaleDateString()}</small>
                   <span className="fw-bold text-white" style={{ fontSize: '15px' }}>{payment.leadName}</span>
                   <small className="text-muted fst-italic" style={{ fontSize: '11px' }}>{payment.leadEmail}</small>
                </div>
                <span className={`badge rounded-pill px-3 py-1 fw-bold ${(payment.status === 'PAID' || payment.status === 'SUCCESS' || payment.status === 'APPROVED') ? 'bg-success bg-opacity-20 text-success' : 'bg-warning bg-opacity-20 text-warning'}`} style={{ fontSize: '10px' }}>{payment.status}</span>
              </div>
              
              <div className="d-flex justify-content-between align-items-center py-2 border-top border-bottom border-white border-opacity-5 my-2">
                <div>
                  <p className="text-muted small text-uppercase fw-bold mb-1" style={{ fontSize: '9px' }}>Assigned TL</p>
                  <span className="badge bg-secondary bg-opacity-20 rounded-pill px-2 py-1 text-muted" style={{ fontSize: '10px' }}>{payment.assignedTlName || "Unassigned"}</span>
                </div>
                <div className="text-end">
                  <p className="text-muted small text-uppercase fw-bold mb-1" style={{ fontSize: '9px' }}>Amount</p>
                  <span className="fw-bold text-success" style={{ fontSize: '16px' }}>₹{payment.amount}</span>
                </div>
              </div>
              
              <div className="pt-2">
                <p className="text-muted small text-uppercase fw-bold mb-1" style={{ fontSize: '9px' }}>Reference</p>
                <code className="text-muted d-block text-truncate border border-white border-opacity-5 rounded px-2 py-1 bg-white bg-opacity-5" style={{ fontSize: '10px' }}>{payment.paymentGatewayId || payment.referenceId}</code>
              </div>
            </div>
          ))}
        </div>

        {payments.length === 0 && !loading && (
          <div className="text-center py-5 text-muted">
            <p className="fw-bold text-uppercase mb-0">No performance data found</p>
          </div>
        )}
      </div>

      <ManualPaymentModal 
        show={!!selectedClearPayment}
        onClose={() => setSelectedClearPayment(null)}
        payment={selectedClearPayment}
        onConfirm={handleManualClear}
      />

      <SplitInstallmentModal 
        show={!!selectedSplitPayment}
        onClose={() => setSelectedSplitPayment(null)}
        payment={selectedSplitPayment}
        onConfirm={handleSplitConfirm}
      />
    </div>
  );
};

export default PaymentHistory;
