import React, { useState, useEffect } from 'react';
import { Button, Card, Input, Table } from '../components/common/Components';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import associateService from '../services/associateService';
import LeadTable from '../components/LeadTable';
import StatCard from '../components/StatCard';
import LeadForm from '../components/LeadForm';
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
import CallAnalyticsGrid from './dashboard/components/CallAnalyticsGrid';
import CallLogDashboard from './dashboard/components/CallLogDashboard';
import TicketManager from '../components/TicketManager';

const AssociateDashboard = () => {
  const { user, logout } = useAuth();
  const { isDarkMode } = useTheme();
  const [stats, setStats] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const [trendData, setTrendData] = useState([]);
  const [callStats, setCallStats] = useState(null);
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

      const [statsRes, leadsRes, trendRes, callStatsRes] = await Promise.all([
        associateService.fetchPerformanceStats(statsFilters),
        associateService.fetchMyLeads(),
        associateService.fetchTrendData(trendFilters),
        associateService.fetchCallStats({ date: filters.from.split('T')[0] })
      ]);
      setStats(statsRes.data);
      setLeads(Array.isArray(leadsRes.data) ? leadsRes.data : (leadsRes.data?.content || []));
      setTrendData(trendRes.data);
      setCallStats(callStatsRes.data?.data || callStatsRes.data);
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
        {activeTab === 'overview' && (
          <div className="d-flex flex-column gap-4 animate-fade-in">
             <div className="row g-4">
                <div className="col-12 col-md-3">
                  <StatCard title="Total Leads" value={stats?.total || 0} sub="Active Workspace" icon={<Users size={18} />} color="primary" />
                </div>
                <div className="col-12 col-md-3">
                  <StatCard title="Conversions" value={stats?.convertedCount || 0} sub="Successful Cycles" icon={<CheckCircle size={18} />} color="success" />
                </div>
                <div className="col-12 col-md-3">
                  <StatCard title="Lost Nodes" value={stats?.lostCount || 0} sub="Closed Files" icon={<Zap size={18} />} color="danger" />
                </div>
                <div className="col-12 col-md-3">
                  <StatCard title="Your Revenue" value={`₹ ${stats?.totalRevenue?.toLocaleString() || 0}`} sub="Current Month" icon={<IndianRupee size={18} />} color="info" unit="INR" />
                </div>
             </div>
             
             <div className="row g-4">
                <div className="col-12 col-xl-8">
                   <Card title="Conversion Velocity" subtitle="Individual Trend Analytics">
                      <div className="py-2" style={{height: '350px'}}>
                         <RevenueTrendChart data={trendData} theme={isDarkMode ? 'dark' : 'light'} />
                      </div>
                   </Card>
                </div>
             </div>
          </div>
        )}

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


        {activeTab === 'tasks' && (
          <TaskBoard
            leads={leads}
            theme={isDarkMode ? 'dark' : 'light'}
            onUpdateStatus={handleUpdateStatus}
            onSendPaymentLink={handleSendPaymentLink}
            fetchLeads={fetchData}
          />
        )}

        {activeTab === 'reports' && (
          <div className="d-flex flex-column gap-4 animate-fade-in">
            <FiltersBar 
              filters={filters} 
              onChange={setFilters} 
              onSync={handleSync}
              title="Identity Node Metrics"
            />

            <div className="row g-4 mb-4">
              {/* Stats moved to Overview */}
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
              <p className="text-muted small mb-0 fw-bold opacity-50" style={{ fontSize: '9px' }}>VIEW PERSONAL CONVERSION AND REVENUE HISTORY</p>
            </div>
            <PaymentHistory role="ASSOCIATE" />
          </div>
        )}

        {activeTab === 'attendance' && (
          <AttendanceDashboard role="ASSOCIATE" />
        )}
        
        {activeTab === 'call-logs' && (
          <div className="animate-fade-in">
             <CallLogDashboard />
          </div>
        )}

        {activeTab === 'tickets' && (
          <div className="animate-fade-in">
             <TicketManager role="ASSOCIATE" />
          </div>
        )}
      </div>


      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        invoiceData={selectedInvoiceData}
      />
    </DashboardLayout>
  );
};

export default AssociateDashboard;
