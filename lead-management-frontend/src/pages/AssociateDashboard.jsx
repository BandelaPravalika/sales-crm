import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
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
  Upload
} from 'lucide-react';
import { toast } from 'react-toastify';
import DashboardLayout from '../components/layout/DashboardLayout';
import PaymentHistory from '../components/PaymentHistory';
import TaskBoard from '../components/TaskBoard';
import RevenueTrendChart from './dashboard/components/RevenueTrendChart';
import FiltersBar from './dashboard/components/FiltersBar';
import InvoiceModal from './dashboard/components/InvoiceModal';
import paymentService from '../services/paymentService';

const AssociateDashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('performance');
  const [theme] = useState(localStorage.getItem('theme') || 'dark');
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [trendData, setTrendData] = useState([]);
  const [filters, setFilters] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0] + 'T00:00:00',
    to: new Date().toISOString().split('T')[0] + 'T23:59:59'
  });

  // Invoice state
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedInvoiceData, setSelectedInvoiceData] = useState(null);

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
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

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
      toast.error('Failed to generate link');
    }
  };

  const handleViewInvoice = async (lead) => {
    try {
      toast.info('Retrieving official receipt...');
      const res = await paymentService.generateInvoice(lead.id);
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
      toast.error('Failed to add lead');
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
          <div className="card shadow-sm border-0 rounded-4 overflow-hidden bg-secondary bg-opacity-5">
            <div className="card-header bg-transparent p-4 border-0 d-flex justify-content-between align-items-center">
              <h5 className="fw-semibold mb-0 text-white">My Lead Pool</h5>
              <button 
                className="btn btn-outline-primary btn-sm rounded-pill px-3 fw-semibold d-flex align-items-center gap-2"
                onClick={() => setActiveTab('ingestion')}
              >
                <Upload size={14} /> Add Leads
              </button>
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
                theme={theme}
              />
            </div>
          </div>
        )}

        {activeTab === 'ingestion' && (
          <div className="row g-4 mb-4">
             <div className="col-12 col-lg-5 d-flex flex-column gap-4">
               <div className="card shadow-sm border-0 rounded-4 h-100 overflow-hidden">
                  <div className="card-body p-4">
                      <LeadForm onSubmit={handleAddLead} title="Single Lead Entry" />
                  </div>
               </div>
             </div>
             <div className="col-12 col-lg-7 d-flex flex-column gap-4">
               <div className="card shadow-sm border-0 rounded-4 h-100 overflow-hidden text-center p-5 d-flex align-items-center justify-content-center">
                  <div className="mb-4 text-primary bg-primary bg-opacity-10 rounded-circle p-4 d-inline-flex">
                     <Upload size={48} />
                  </div>
                  <h4 className="fw-semibold text-white mb-2">Mass Data Ingestion</h4>
                  <p className="text-muted w-75 mx-auto mb-4">Upload a large CSV file instantly populating your lead pool. Make sure to download the template format before uploading.</p>
                  <button 
                    className="btn btn-primary rounded-pill fw-semibold px-4 d-flex align-items-center gap-2"
                    onClick={() => setIsBulkUploadModalOpen(true)}
                  >
                     <Upload size={18} /> Open Bulk Uploader
                  </button>
               </div>
             </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <TaskBoard 
            leads={leads} 
            theme={theme} 
            onUpdateStatus={handleUpdateStatus} 
            onSendPaymentLink={handleSendPaymentLink}
            fetchLeads={fetchData} 
          />
        )}

        {activeTab === 'performance' && (
          <div className="d-flex flex-column gap-4">
            <FiltersBar 
              filters={filters} 
              onChange={setFilters} 
              theme={theme} 
              title="Conversion Analytics"
            />

            <div className="row g-4 mb-2">
              <div className="col-12 col-xl-8">
                <div className="card shadow-sm border-0 rounded-4 overflow-hidden h-100">
                   <div className="card-body p-0">
                       <RevenueTrendChart data={trendData} theme={theme} />
                   </div>
                </div>
              </div>
              <div className="col-12 col-xl-4">
                 <div className="d-flex flex-column gap-3 h-100">
                    <StatCard title="Total Leads" value={stats?.TOTAL || 0} sub="Assigned to me" icon={<Users />} color="primary" />
                    <StatCard title="Interested" value={stats?.INTERESTED || 0} sub="Hot Opportunities" icon={<TrendingUp />} color="warning" />
                    <StatCard title="Conversions" value={stats?.PAID || 0} sub="Successful" icon={<Zap />} color="success" />
                    <StatCard title="Activity" value={leads.filter(l => l.status !== 'NEW').length} sub="Contacted Total" icon={<MessageSquare />} color="info" />
                 </div>
              </div>
            </div>

            <div className="card shadow-sm border-0 rounded-4 overflow-hidden bg-secondary bg-opacity-5">
              <div className="card-header bg-transparent p-4 border-0">
                <h5 className="fw-semibold mb-0 text-white small">Conversion Analytics</h5>
              </div>
              <div className="card-body">
                <div className="d-flex align-items-center gap-4 p-4 bg-primary bg-opacity-10 rounded-4 border border-primary border-opacity-10">
                   <div className="p-4 bg-primary rounded-pill text-white shadow-lg d-flex align-items-center justify-content-center">
                      <TrendingUp size={32} />
                   </div>
                   <div>
                       <div className="text-muted small fw-bold text-uppercase tracking-widest mb-1" style={{ fontSize: '9px' }}>Current Performance Index</div>
                       <h2 className="fw-black mb-0 display-6">
                        {stats?.TOTAL > 0 ? ((stats?.PAID / stats?.TOTAL) * 100).toFixed(1) : 0}%
                       </h2>
                       <p className="text-muted small mb-0">Aggregate Conversion Efficiency</p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="d-flex flex-column gap-4">
             <h5 className="fw-semibold mb-0 px-2 text-primary">My Conversion History</h5>
             <PaymentHistory role="ASSOCIATE" />
          </div>
        )}
      </div>

      <BulkUpload 
        isOpen={isBulkUploadModalOpen}
        onClose={() => setIsBulkUploadModalOpen(false)}
        uploadUrl="/api/leads/bulk-upload" 
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
