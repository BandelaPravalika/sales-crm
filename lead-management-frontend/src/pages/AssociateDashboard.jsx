import React, { useState, useEffect } from 'react';
import { Button, Card, Input, Table } from '../components/common/Components';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import associateService from '../services/associateService';
import LeadTable from '../components/LeadTable';
import StatCard from '../components/StatCard';
import LeadForm from '../components/LeadForm';
import BulkUpload from '../components/BulkUpload';
import {
  Users,
  TrendingUp,
  Zap,
  LogOut,
  Sun,
  Moon,
  Phone,
  CheckCircle,
  MessageSquare,
  IndianRupee,
  Upload,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'react-toastify';
import DashboardLayout from '../components/layout/DashboardLayout';
import PaymentHistory from '../components/PaymentHistory';
import TaskBoard from '../components/TaskBoard';
import RevenueTrendChart from './dashboard/components/RevenueTrendChart';
import FiltersBar from './dashboard/components/FiltersBar';
import InvoiceModal from './dashboard/components/InvoiceModal';
import paymentService from '../services/paymentService';
import AttendanceDashboard from '../components/pages/AttendanceDashboard';

const AssociateDashboard = () => {
  const { user, logout } = useAuth();
  const { isDarkMode } = useTheme();
  const [stats, setStats] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('performance');
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [trendData, setTrendData] = useState([]);
  const [filters, setFilters] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0] + 'T00:00:00',
    to: new Date().toISOString().split('T')[0] + 'T23:59:59'
  });

  // Invoice state
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedInvoiceData, setSelectedInvoiceData] = useState(null);

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const handleSync = () => setRefreshTrigger(prev => prev + 1);

  const fetchData = async () => {
    setLoading(true);
    try {
      const statsFilters = { start: filters.from, end: filters.to };
      const trendFilters = { from: filters.from.split('T')[0], to: filters.to.split('T')[0] };

      const [statsRes, leadsRes, trendRes] = await Promise.all([
        associateService.fetchPerformanceStats(statsFilters),
        associateService.fetchMyLeads(),
        associateService.fetchTrendData(trendFilters)
      ]);
      setStats(statsRes.data);
      setLeads(Array.isArray(leadsRes.data) ? leadsRes.data : (leadsRes.data?.content || []));
      setTrendData(trendRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters, refreshTrigger]);

  const handleUpdateStatus = async (leadId, status, data) => {
    try {
      const note = typeof data === 'string' ? data : data.note;
      await associateService.updateStatus(leadId, status, note);
      toast.success('Status updated');
      fetchData();
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const handleRecordCallOutcome = async (leadId, data) => {
    try {
      await associateService.recordOutcome(leadId, data);
      toast.success('Call outcome recorded');
      fetchData();
    } catch (err) {
      toast.error('Failed to record outcome');
    }
  };

  const handleSendPaymentLink = async (leadId, paymentData) => {
    try {
      const res = await associateService.sendPaymentLink(leadId, paymentData);
      toast.success('Payment link generated!');
      fetchData();
      setActiveTab('payments');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ingestion failed: Manifest mapping error');
    }
  };

  const handleViewInvoice = async (lead) => {
    try {
      toast.info('Retrieving official receipt...');
      const res = await paymentService.fetchInvoiceByLead(lead.id);
      setSelectedInvoiceData(res.data);
      setIsInvoiceModalOpen(true);
    } catch (err) {
      toast.error('Failed to retrieve invoice - no confirmed payment found');
    }
  };

  const handleAddLead = async (leadData) => {
    try {
      await associateService.addLead(leadData);
      toast.success('Lead added! Tracking link sent.');
      fetchData();
      return true;
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to add lead');
      return false;
    }
  };

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      role="ASSOCIATE"
    >
      <div className="animate-fade-in d-flex flex-column gap-4">
        {activeTab === 'leads' && (
          <div className="premium-card overflow-hidden shadow-lg border-0">
            <div className="card-header bg-transparent p-4 border-0 border-bottom border-white border-opacity-5">
              <h5 className="fw-black mb-0 text-main text-uppercase tracking-widest small">Individual Lead Pool</h5>
              <p className="text-muted small mb-0 fw-bold opacity-50" style={{ fontSize: '9px' }}>OPERATIONAL WORKFLOW & CONVERSION PIPELINE</p>
            </div>
            <div className="card-body p-0">
              <LeadTable
                leads={leads}
                onUpdateStatus={handleUpdateStatus}
                onRecordCallOutcome={handleRecordCallOutcome}
                onSendPaymentLink={handleSendPaymentLink}
                onViewInvoice={handleViewInvoice}
                role="ASSOCIATE"
                showActions={true}
              />
            </div>
          </div>
        )}

        {activeTab === 'ingestion' && (
          <div className="row g-4 animate-fade-in">
             <div className="col-12 col-xl-5">
                <div className="premium-card h-100 overflow-hidden shadow-glow">
                   <div className="card-body p-4">
                      <LeadForm onSubmit={handleAddLead} title="SINGLE LEAD ENTRY" />
                   </div>
                </div>
             </div>
             
             <div className="col-12 col-xl-7">
                <div className="premium-card h-100 border-0 shadow-lg overflow-hidden d-flex flex-column">
                   <div className="card-header bg-transparent p-4 border-0 border-bottom border-white border-opacity-5 d-flex align-items-center gap-3">
                      <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-pill">
                         <Upload size={20} />
                      </div>
                      <div>
                         <h6 className="fw-black mb-0 text-main tracking-widest text-uppercase">Mass Data Ingestion</h6>
                         <small className="text-muted fw-bold opacity-50" style={{ fontSize: '8px' }}>PROPAGATE DATASETS INTO PIPELINE</small>
                      </div>
                   </div>
                   
                   <div className="card-body p-5 d-flex flex-column align-items-center justify-content-center text-center gap-4">
                      <div className="p-4 bg-primary bg-opacity-10 rounded-circle text-primary shadow-glow">
                         <FileText size={64} />
                      </div>
                      <div className="max-w-md mx-auto">
                         <h4 className="fw-black text-main mb-2">Validated CSV Ingestion</h4>
                         <p className="text-muted small fw-bold leading-relaxed mb-4">
                            Upload your validated lead manifest stream. The system will automatically sanitize 
                            entries and synchronize them with your active node pool.
                         </p>
                         <button 
                           className="btn btn-primary rounded-pill px-5 py-3 fw-black text-uppercase shadow-glow border-0 hover-up transition-smooth d-flex align-items-center gap-3 mx-auto"
                           onClick={() => setIsBulkUploadModalOpen(true)}
                         >
                           <Upload size={20} /> OPEN BULK UPLOADER
                         </button>
                      </div>
                      
                      <div className="mt-4 p-3 bg-surface bg-opacity-50 rounded-4 border border-white border-opacity-5 w-100 max-w-sm">
                         <div className="d-flex align-items-center gap-3 text-start">
                            <ShieldCheck size={24} className="text-success" />
                            <div>
                               <div className="small fw-black text-main text-uppercase" style={{ fontSize: '10px' }}>Security Protocol</div>
                               <div className="text-muted small fw-bold" style={{ fontSize: '9px' }}>All data is encrypted post-ingestion.</div>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <TaskBoard
            leads={leads}
            theme={isDarkMode ? 'dark' : 'light'}
            onUpdateStatus={handleUpdateStatus}
            onSendPaymentLink={handleSendPaymentLink}
            fetchLeads={fetchData}
          />
        )}

        {activeTab === 'performance' && (
          <div className="d-flex flex-column gap-4 animate-fade-in">
            <FiltersBar 
              filters={filters} 
              onChange={setFilters} 
              onSync={handleSync}
              title="Identity Node Metrics"
            />

            <div className="row g-4 mb-4">
              <div className="col-12 col-md-3">
                <StatCard title="Identity Pool" value={stats?.total || 0} sub="Global Operational Records" icon={<Users size={18} />} color="primary" />
              </div>
              <div className="col-12 col-md-3">
                <StatCard title="Success Nodes" value={stats?.convertedCount || 0} sub="Capital Transmission Verified" icon={<CheckCircle size={18} />} color="success" />
              </div>
              <div className="col-12 col-md-3">
                <StatCard title="Lost Segments" value={stats?.lostCount || 0} sub="Off-Pitch Terminations" icon={<TrendingUp size={18} />} color="danger" unit="Nodes" />
              </div>
              <div className="col-12 col-md-3">
                <StatCard title="Revenue Growth" value={`₹ ${stats?.totalRevenue?.toLocaleString() || 0}`} sub="Total Individual Contribution" icon={<IndianRupee size={18} />} color="info" unit="INR" />
              </div>
            </div>

            <div className="row g-4">
              <div className="col-12">
                <div className="premium-card border-0 shadow-lg overflow-hidden">
                  <div className="card-header bg-transparent p-4 border-0 border-bottom border-white border-opacity-5 d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="fw-black mb-0 text-main small tracking-widest text-uppercase">Revenue Analytics Pipeline</h6>
                      <small className="text-muted fw-bold opacity-50" style={{ fontSize: '8px' }}>CORRELATION: LEADS GENERATED VS CONVERSION VALUE</small>
                    </div>
                    <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-circle shadow-sm border border-primary border-opacity-10">
                      <TrendingUp size={16} />
                    </div>
                  </div>
                  <div className="card-body p-4">
                    <RevenueTrendChart data={trendData} theme={isDarkMode ? 'dark' : 'light'} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="d-flex flex-column gap-4">
            <div className="px-2">
              <h5 className="fw-black mb-1 text-main text-uppercase tracking-widest small">Financial Transmission Archive</h5>
              <p className="text-muted small mb-0 fw-bold opacity-50" style={{ fontSize: '9px' }}>VIEW PERSONAL CONVERSION AND COMMISSION HISTORY</p>
            </div>
            <PaymentHistory role="ASSOCIATE" />
          </div>
        )}

        {activeTab === 'attendance' && (
          <AttendanceDashboard role="ASSOCIATE" />
        )}
      </div>

      <BulkUpload
        isOpen={isBulkUploadModalOpen}
        onClose={() => setIsBulkUploadModalOpen(false)}
        uploadUrl="/leads/bulk-upload"
        onUploadSuccess={() => {
          toast.success("Pool initialized. Refreshing data...");
          fetchData();
        }}
      />

      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        invoiceData={selectedInvoiceData}
      />
    </DashboardLayout>
  );
};

export default AssociateDashboard;
