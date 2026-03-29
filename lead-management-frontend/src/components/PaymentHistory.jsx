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
  const [showRecordModal, setShowRecordModal] = useState(false);
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
    try {
      await paymentService.recordManualPayment(formData);
      toast.success('Payment recorded successfully');
      setShowRecordModal(false);
      fetchHistory();
    } catch (err) {
      toast.error('Failed to record payment');
    }
  };

  const fetchAssociates = async (tlId) => {
    if (!tlId) {
      setAssociates([]);
      return;
    }
    setFetchingAssociates(true);
    try {
      // Assuming AdminController exposed /api/admin/associates/{tlId}
      // and ManagerController has something similar or we use a common admin-level lookup
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
  }, [role]);

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
    <div className="card shadow-sm rounded mt-4 overflow-hidden mb-5">
      <div className="card-body p-4">
        {/* Header and Filters */}
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end mb-4 gap-3">
          <div className="d-flex align-items-center gap-2">
            <div>
              <h4 className="card-title text-uppercase fw-bold mb-1">Conversion History</h4>
              <p className="text-muted small text-uppercase fw-bold mb-0">Real-time payment audit</p>
            </div>
            <button 
              className="btn btn-success d-flex align-items-center gap-2 px-3 py-2 fw-bold shadow-sm"
              onClick={() => setShowRecordModal(true)}
            >
              <PlusCircle size={18} /> Record New Payment
            </button>
          </div>
          
          <div className="d-flex flex-column flex-md-row gap-3 w-100 w-lg-auto">
            {(role === 'ADMIN' || role === 'MANAGER') && (
              <div className="flex-grow-1">
                <label className="form-label text-uppercase small text-muted fw-bold mb-1">Team Leader</label>
                <select 
                  name="tlId"
                  value={filters.tlId}
                  onChange={handleFilterChange}
                  className="form-select bg-secondary bg-opacity-10 border-secondary border-opacity-25"
                >
                  <option value="" className="bg-dark text-white">All Leaders</option>
                  {teamLeaders.map(tl => (
                    <option key={tl.id} value={tl.id} className="bg-dark text-white">{tl.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            {(role === 'ADMIN' || role === 'MANAGER') && (
              <div className="flex-grow-1">
                <label className="form-label text-uppercase small text-muted fw-bold mb-1">Associate (Optional)</label>
                <select 
                  name="associateId"
                  value={filters.associateId}
                  onChange={handleFilterChange}
                  className="form-select bg-secondary bg-opacity-10 border-secondary border-opacity-25"
                  disabled={!filters.tlId || fetchingAssociates}
                >
                  <option value="" className="bg-dark text-white">
                    {fetchingAssociates ? 'Syncing...' : 'All Associates'}
                  </option>
                  {associates.map(assoc => (
                    <option key={assoc.id} value={assoc.id} className="bg-dark text-white">{assoc.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="d-flex flex-column flex-sm-row gap-2 flex-grow-1">
              <div className="flex-grow-1">
                <label className="form-label x-small fw-bold text-uppercase text-muted mb-1">Status</label>
                <select 
                  className="form-select form-select-sm fw-bold shadow-none rounded-3 py-2 px-3 border-secondary border-opacity-25"
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                >
                  <option value="">All Statuses</option>
                  <option value="PAID">PAID</option>
                  <option value="PENDING">PENDING</option>
                  <option value="FAILED">FAILED</option>
                  <option value="APPROVED">APPROVED</option>
                </select>
              </div>
              <div className="flex-grow-1">
                <label className="form-label x-small fw-bold text-uppercase text-muted mb-1">Start Date</label>
                <input 
                  type="date" 
                  className="form-control form-control-sm fw-bold shadow-none rounded-3 py-2 px-3 border-secondary border-opacity-25"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="flex-grow-1">
                <label className="form-label x-small fw-bold text-uppercase text-muted mb-1">End Date</label>
                <input 
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="form-control bg-secondary bg-opacity-10 border-secondary border-opacity-25"
                />
              </div>
            </div>

            <div className="d-flex align-items-end gap-2 mt-2 mt-md-0">
              <button onClick={fetchHistory} className="btn btn-primary w-100 fw-bold px-4">Apply</button>
              <button onClick={resetFilters} className="btn btn-outline-secondary w-100 fw-bold px-4">Reset</button>
            </div>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="table-responsive d-none d-md-block">
          <table className="table table-hover align-middle">
            <thead className="border-bottom opacity-75">
              <tr className="text-uppercase text-muted small fw-bold">
                <th>Date</th>
                <th>Student</th>
                <th>Amount</th>
                <th>Status</th>
                <th>TL</th>
                <th className="text-end">Reference</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>
                    <div className="d-flex flex-column">
                      <span className="fw-bold">{new Date(payment.createdAt).toLocaleDateString()}</span>
                      <small className="text-muted">{new Date(payment.createdAt).toLocaleTimeString()}</small>
                    </div>
                  </td>
                  <td>
                    <div className="d-flex flex-column">
                      <span className="fw-bold text-uppercase">{payment.leadName}</span>
                      <small className="text-muted fst-italic">{payment.leadEmail}</small>
                    </div>
                  </td>
                  <td>
                    <span className="fs-5 fw-bold text-success">₹{payment.amount}</span>
                  </td>
                  <td>
                    <div className="d-flex flex-column">
                       <span className={`badge ${(payment.status === 'PAID' || payment.status === 'SUCCESS' || payment.status === 'APPROVED') ? 'bg-success' : payment.status === 'PENDING' ? 'bg-warning' : 'bg-danger'}`}>
                         {payment.status}
                       </span>
                       <small className="text-muted mt-1 fw-bold">{payment.paymentType || 'FULL'}</small>
                    </div>
                  </td>
                  <td>
                    <span className="badge bg-secondary">{payment.assignedTlName || "Unassigned"}</span>
                  </td>
                  <td className="text-end">
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
        </div>

        {/* Mobile Card View */}
        <div className="d-md-none d-flex flex-column gap-3">
          {payments.map((payment) => (
            <div key={payment.id} className="card shadow-sm border p-3">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="d-flex flex-column">
                   <small className="text-muted fw-bold text-uppercase text-nowrap">{new Date(payment.createdAt).toLocaleDateString()}</small>
                   <span className="fs-5 fw-bold text-uppercase">{payment.leadName}</span>
                   <small className="text-muted fst-italic">{payment.leadEmail}</small>
                </div>
                <span className="badge bg-success">SUCCESS</span>
              </div>
              
              <div className="d-flex justify-content-between align-items-center py-2 border-top border-bottom my-2">
                <div>
                  <p className="text-muted small text-uppercase fw-bold mb-0">Assigned TL</p>
                  <span className="fw-bold text-primary">{payment.assignedTlName || "Unassigned"}</span>
                </div>
                <div className="text-end">
                  <p className="text-muted small text-uppercase fw-bold mb-0">Amount Paid</p>
                  <span className="fs-5 fw-bold text-success">₹{payment.amount}</span>
                </div>
              </div>
              
              <div className="pt-2">
                <p className="text-muted small text-uppercase fw-bold mb-1">Payment Reference</p>
                <code className="text-muted d-block text-truncate border border-secondary border-opacity-25 rounded px-2 py-1 bg-secondary bg-opacity-10">{payment.referenceId}</code>
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

      <RecordPaymentModal 
        show={showRecordModal}
        onClose={() => setShowRecordModal(false)}
        onConfirm={handleRecordConfirm}
      />
    </div>
  );
};

export default PaymentHistory;
