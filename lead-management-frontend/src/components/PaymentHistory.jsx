import React, { useState, useEffect } from 'react';
import paymentService from '../services/paymentService';
import adminService from '../services/adminService';
import managerService from '../services/managerService';
import { toast } from 'react-toastify';
import { IndianRupee, CheckCircle, Scissors, PlusCircle, Clock, FileText } from 'lucide-react';
import SplitInstallmentModal from './SplitInstallmentModal';
import RecordPaymentModal from './RecordPaymentModal';
import ManualPaymentModal from './ManualPaymentModal';
import InvoiceModal from '../pages/dashboard/components/InvoiceModal';

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
  const [selectedInvoiceData, setSelectedInvoiceData] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  // Client-side EMI filters
  const [studentSearch, setStudentSearch] = useState('');
  const [dueFrom, setDueFrom] = useState('');
  const [dueTo, setDueTo] = useState('');

  const handleViewInvoice = async (payment) => {
    try {
      toast.info('Retrieving official receipt...');
      const res = await paymentService.generateInvoice(payment.paymentGatewayId);
      setSelectedInvoiceData(res.data);
      setIsInvoiceModalOpen(true);
    } catch (err) {
      toast.error('Failed to retrieve invoice. Ensure payment is confirmed.');
    }
  };

  const fetchTeamLeaders = async () => {
    if (role === 'ADMIN' || role === 'MANAGER') {
      try {
        const res = role === 'ADMIN' ? await adminService.fetchUsers() : await managerService.fetchTeamLeaders();
        const users = res.data.content || res.data;
        setTeamLeaders(role === 'ADMIN' ? users.filter(u => u.role === 'TEAM_LEADER' || u.role === 'MANAGER') : users);
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
    setStudentSearch('');
    setDueFrom('');
    setDueTo('');
    setAssociates([]);
  };

  if (loading && payments.length === 0) return (
    <div className="d-flex justify-content-center p-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );

  // Apply client-side filters for student name and due date
  const filteredPayments = payments.filter(payment => {
    if (studentSearch && !(payment.leadName || '').toLowerCase().includes(studentSearch.toLowerCase())) return false;
    const dueDateStr = payment.dueDate ? payment.dueDate.substring(0, 10) : (payment.createdAt ? payment.createdAt.substring(0, 10) : '');
    if (dueFrom && dueDateStr < dueFrom) return false;
    if (dueTo && dueDateStr > dueTo) return false;
    return true;
  });

  return (
    <div className="animate-fade-in mt-4">
      {/* Page Header matching the screenshot context */}
      <div className="mb-4">
         <p className="text-muted small mb-0">Manage payment entries, approvals, and EMI collections.</p>
      </div>

      <div className="card shadow-sm border-0 rounded-4 overflow-hidden mb-5" style={{ backgroundColor: '#ffffff' }}>
        <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <Clock size={18} className="text-muted" />
            <h5 className="fw-bold text-dark mb-0" style={{ letterSpacing: '-0.01em' }}>Active EMI Schedule</h5>
          </div>
          <span className="text-muted small" style={{ fontSize: '12px' }}>Total {filteredPayments.length} Items</span>
        </div>

        {/* Filters Wrapper (Collapsible or just inline if needed, simplified for aesthetic) */}
        <div className="p-3 bg-light bg-opacity-50 border-bottom d-flex flex-wrap gap-3 align-items-end">
          <div className="flex-grow-1" style={{ maxWidth: '200px' }}>
            <label className="form-label small text-muted mb-1 px-1 fw-bold" style={{ fontSize: '10px' }}>STATUS</label>
            <select className="form-select form-select-sm border-secondary border-opacity-25 shadow-none" name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">All Statuses</option>
              <option value="PAID">Cleared (Paid)</option>
              <option value="PENDING">Upcoming EMIs (Pending)</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
          {(role === 'ADMIN' || role === 'MANAGER') && (
             <div className="flex-grow-1" style={{ maxWidth: '200px' }}>
               <label className="form-label small text-muted mb-1 px-1 fw-bold" style={{ fontSize: '10px' }}>TEAM LEADER</label>
               <select className="form-select form-select-sm border-secondary border-opacity-25 shadow-none" name="tlId" value={filters.tlId} onChange={handleFilterChange}>
                 <option value="">All Team Leaders</option>
                 {teamLeaders.map(tl => <option key={tl.id} value={tl.id}>{tl.name}</option>)}
               </select>
             </div>
          )}
          {(role === 'ADMIN' || role === 'MANAGER' || role === 'TEAM_LEADER') && filters.tlId && (
            <div className="flex-grow-1" style={{ maxWidth: '200px' }}>
              <label className="form-label small text-muted mb-1 px-1 fw-bold" style={{ fontSize: '10px' }}>ASSOCIATE</label>
              <select className="form-select form-select-sm border-secondary border-opacity-25 shadow-none" name="associateId" value={filters.associateId} onChange={handleFilterChange} disabled={fetchingAssociates}>
                 <option value="">All Associates</option>
                 {associates.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          )}
          <div className="flex-grow-1" style={{ minWidth: '160px' }}>
            <label className="form-label small text-muted mb-1 px-1 fw-bold" style={{ fontSize: '10px' }}>STUDENT NAME</label>
            <input
              type="text"
              className="form-control form-control-sm border-secondary border-opacity-25 shadow-none"
              placeholder="Search by name..."
              value={studentSearch}
              onChange={e => setStudentSearch(e.target.value)}
            />
          </div>
          <div className="flex-grow-1" style={{ minWidth: '140px' }}>
            <label className="form-label small text-muted mb-1 px-1 fw-bold" style={{ fontSize: '10px' }}>DUE FROM</label>
            <input
              type="date"
              className="form-control form-control-sm border-secondary border-opacity-25 shadow-none"
              value={dueFrom}
              onChange={e => setDueFrom(e.target.value)}
            />
          </div>
          <div className="flex-grow-1" style={{ minWidth: '140px' }}>
            <label className="form-label small text-muted mb-1 px-1 fw-bold" style={{ fontSize: '10px' }}>DUE TO</label>
            <input
              type="date"
              className="form-control form-control-sm border-secondary border-opacity-25 shadow-none"
              value={dueTo}
              onChange={e => setDueTo(e.target.value)}
            />
          </div>
          <button onClick={fetchHistory} className="btn btn-dark btn-sm px-3 fw-bold rounded-pill">Filter</button>
          <button onClick={resetFilters} className="btn btn-outline-secondary btn-sm px-3 rounded-pill">Reset</button>
        </div>

        {/* Desktop Table View */}
        <div className="table-responsive d-none d-md-block p-0">
          <table className="table table-hover align-middle mb-0 border-0 bg-transparent">
            <thead>
              <tr className="border-bottom border-light">
                <th className="ps-4 py-3 text-muted small fw-black text-uppercase tracking-widest" style={{ fontSize: '10px' }}>EMI ID</th>
                <th className="py-3 text-muted small fw-black text-uppercase tracking-widest" style={{ fontSize: '10px' }}>Student</th>
                <th className="py-3 text-muted small fw-black text-uppercase tracking-widest" style={{ fontSize: '10px' }}>Amount</th>
                <th className="py-3 text-muted small fw-black text-uppercase tracking-widest" style={{ fontSize: '10px' }}>Due Date</th>
                <th className="py-3 text-muted small fw-black text-uppercase tracking-widest" style={{ fontSize: '10px' }}>Status</th>
                <th className="pe-4 py-3 text-end text-muted small fw-black text-uppercase tracking-widest" style={{ fontSize: '10px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment, index) => {
                const emiId = payment.paymentGatewayId || `E-${(index + 1).toString().padStart(2, '0')}`;
                const isOverdue = payment.status === 'FAILED';
                const isPending = payment.status === 'PENDING';
                const isPaid = payment.status === 'PAID' || payment.status === 'SUCCESS' || payment.status === 'APPROVED';
                
                const dueDate = payment.dueDate
                  ? new Date(payment.dueDate).toLocaleDateString('en-CA')
                  : new Date(payment.createdAt).toLocaleDateString('en-CA');

                return (
                  <tr key={payment.id} className="border-bottom border-light transition-all">
                    <td className="ps-4 py-4">
                      <span className="fw-bold text-dark">{emiId}</span>
                    </td>
                    <td className="py-4">
                      <span className="fw-medium text-dark">{payment.leadName || 'Student Name'}</span>
                    </td>
                    <td className="py-4">
                      <span className="fw-bold text-dark">₹{payment.amount}</span>
                    </td>
                    <td className="py-4">
                      <span className={`fw-medium ${isOverdue ? 'text-danger' : 'text-muted'}`}>{dueDate}</span>
                    </td>
                    <td className="py-4">
                       {isPaid && (
                         <div className="d-flex align-items-center gap-1 text-success border border-success border-opacity-25 rounded-pill px-2 py-1 w-fit-content" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                           <CheckCircle size={12} className="opacity-75" />
                           <span className="small fw-bold" style={{ fontSize: '11px' }}>Paid</span>
                         </div>
                       )}
                       {isPending && (
                         <div className="d-flex align-items-center gap-1 text-warning border border-warning border-opacity-25 rounded-pill px-2 py-1 w-fit-content" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                           <span className="small fw-bold px-1" style={{ fontSize: '11px' }}>Pending</span>
                         </div>
                       )}
                       {isOverdue && (
                         <div className="d-flex align-items-center gap-1 text-danger border border-danger border-opacity-25 rounded-pill px-2 py-1 w-fit-content" style={{ backgroundColor: 'rgba(244, 63, 94, 0.1)' }}>
                           <span className="small fw-bold px-1" style={{ fontSize: '11px' }}>Overdue</span>
                         </div>
                       )}
                    </td>
                    <td className="pe-4 py-4 text-end">
                      <div className="d-flex align-items-center justify-content-end gap-3">
                         {(isPending || isOverdue) && (
                           <>
                             <button 
                               onClick={() => setSelectedSplitPayment(payment)}
                               className="btn btn-link text-muted p-0 text-decoration-none d-flex align-items-center gap-1 hover-text-primary transition-smooth"
                               style={{ fontSize: '13px', fontWeight: '500' }}
                             >
                               <Scissors size={14} /> Split
                             </button>
                             <button 
                               onClick={() => setSelectedClearPayment(payment)}
                               className="btn btn-dark btn-sm rounded-pill px-3 fw-bold shadow-sm"
                               style={{ fontSize: '12px', padding: '6px 16px' }}
                             >
                               Approve
                             </button>
                           </>
                         )}
                         {isPaid && (
                           <div className="d-flex flex-column align-items-end gap-1">
                             <button 
                               onClick={() => handleViewInvoice(payment)}
                               className="btn btn-link text-muted p-0 text-decoration-none d-flex align-items-center gap-1 hover-text-primary transition-smooth"
                               style={{ fontSize: '12px', fontWeight: '500' }}
                             >
                               <FileText size={14} /> Invoice
                             </button>
                             <span className="text-success small fw-bold" style={{ fontSize: '11px' }}>Approved</span>
                           </div>
                         )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {payments.length === 0 && !loading && (
            <div className="text-center py-5">
              <p className="fw-bold text-muted text-uppercase mb-0 tracking-widest">No EMI Schedules Found</p>
            </div>
          )}
        </div>

        {/* Mobile View Omitted for exact alignment, but normally added here */}
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

      <InvoiceModal 
        isOpen={isInvoiceModalOpen} 
        onClose={() => setIsInvoiceModalOpen(false)} 
        invoiceData={selectedInvoiceData} 
      />
    </div>
  );
};

export default PaymentHistory;
