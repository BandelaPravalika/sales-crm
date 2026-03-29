import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, TrendingUp, Zap, AlertCircle, LogOut, Sun, Moon, Menu, BarChart3, IndianRupee, Phone, Upload, CheckCircle } from 'lucide-react';
import tlService from '../services/tlService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import StatCard from '../components/StatCard';
import LeadForm from '../components/LeadForm';
import BulkUpload from './dashboard/components/BulkUploadModal.jsx'; // Use the modal version as it has assignment logic
import LeadList from '../components/LeadTable';
import PaymentHistory from '../components/PaymentHistory';
import RevenueTrendChart from './dashboard/components/RevenueTrendChart';
import DashboardLayout from '../components/layout/DashboardLayout';
import TaskBoard from '../components/TaskBoard';
import FiltersBar from './dashboard/components/FiltersBar';

const TeamLeaderDashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [activeTab, setActiveTab] = useState(localStorage.getItem('tl_activeTab') || 'leads');
  const [filters, setFilters] = useState({
    from: new Date().toISOString().split('T')[0] + 'T00:00:00',
    to: new Date().toISOString().split('T')[0] + 'T23:59:59',
    userId: null
  });
  const [performance, setPerformance] = useState([]);
  const [associates, setAssociates] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('tl_activeTab', activeTab);
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const statsFilters = { start: filters.from, end: filters.to, userId: filters.userId };
      const trendFilters = { from: filters.from.split('T')[0], to: filters.to.split('T')[0], userId: filters.userId };

      const [leadsRes, statsRes, perfRes, subordinatesRes, trendRes] = await Promise.all([
        tlService.fetchMyLeads(),
        tlService.fetchDashboardStats(statsFilters),
        tlService.fetchMemberPerformance(statsFilters),
        tlService.fetchSubordinates(),
        tlService.fetchTrendData(trendFilters)
      ]);
      setLeads(leadsRes.data);
      setStats(statsRes.data);
      setPerformance(perfRes.data);
      setAssociates(subordinatesRes.data);
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

  const handleAddLead = async (leadData) => {
    try {
      await tlService.addLead(leadData);
      toast.success('Lead added! Tracking link sent.');
      fetchData();
      return true;
    } catch (err) {
      toast.error('Failed to add lead');
      return false;
    }
  };

  const handleUpdateStatus = async (leadId, status, note) => {
    try {
      await tlService.updateLeadStatus(leadId, status, note);
      toast.success('Status updated');
      fetchData();
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const handleRecordCallOutcome = async (leadId, data) => {
    try {
      await tlService.recordCallOutcome(leadId, data);
      toast.success('Call outcome recorded');
      fetchData();
    } catch (err) {
      toast.error('Failed to record outcome');
    }
  };

  const handleSendPaymentLink = async (leadId, paymentData) => {
    try {
      const res = await tlService.sendPaymentLink(leadId, paymentData);
      toast.success('Payment link generated!');
      
      const lead = res.data.lead;
      if (!lead.email) {
        toast.info('No email found. Please use the WhatsApp button to share the link.', { autoClose: 6000 });
      } else {
        toast.success('Link sent to lead email!');
      }
      fetchData();
      setActiveTab('payments');
    } catch (err) {
      toast.error('Failed to generate link');
    }
  };

  const handleAssignLead = async (leadId, associateId) => {
    try {
      await tlService.assignLead(leadId, associateId);
      toast.success('Lead assigned to associate');
      fetchData();
    } catch (err) {
      toast.error('Assignment failed');
    }
  };

  return (
    <DashboardLayout
      title="Team Leader Console"
      subtitle="Performance Tracking"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      role="TEAM_LEADER"
    >
      <div className="animate-fade-in d-flex flex-column gap-4">
        {/* Operational Scope Filters */}
        { (activeTab === 'performance' || activeTab === 'team' || activeTab === 'leads') && (
          <FiltersBar 
            filters={filters} 
            onChange={setFilters} 
            theme={theme} 
          />
        )}

        {filters.userId && (
          <div className="alert alert-primary border-0 rounded-4 d-flex align-items-center justify-content-between p-3 animate-fade-in shadow-sm">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-primary bg-opacity-10 p-2 rounded-circle">
                <Users size={20} className="text-primary" />
              </div>
              <div>
                 <p className="mb-0 fw-bold small">Deep-diving into <span className="text-primary">{associates.find(a => a.id === filters.userId)?.name || 'Associate'}</span>'s Performance</p>
                 <small className="text-muted">Currently viewing scoped analytics for this staff member</small>
              </div>
            </div>
            <button 
              className="btn btn-sm btn-outline-primary rounded-pill px-4 fw-bold"
              onClick={() => setFilters({ ...filters, userId: null })}
            >
              Reset to Team Total
            </button>
          </div>
        )}

        {activeTab === 'ingestion' && (
          <div className="animate-fade-in row g-4 mb-4">
             <div className="col-12 col-xl-4">
                <div className="premium-card p-4 h-100">
                    <LeadForm onSubmit={handleAddLead} title="Quick Lead Add" />
                </div>
             </div>
             <div className="col-12 col-xl-8">
                <div className="h-100">
                   <BulkUpload 
                     isOpen={true}
                     isInline={true}
                     onClose={() => setActiveTab('leads')}
                     onSuccess={fetchData}
                     teamLeaders={associates.filter(a => a.role === 'ASSOCIATE')}
                   />
                </div>
             </div>
          </div>
        )}

        {activeTab === 'leads' && (
          <div className="premium-card overflow-hidden animate-fade-in">
             <div className="card-header bg-transparent p-4 border-0 border-bottom border-white border-opacity-5">
                <h5 className="fw-bold text-uppercase mb-0 text-white tracking-wider small">My Pipeline Leads</h5>
             </div>
               <div className="card-body p-0">
                   <LeadList 
                     leads={leads} 
                     onUpdateStatus={handleUpdateStatus} 
                     onSendPaymentLink={handleSendPaymentLink} 
                     onAssignLead={handleAssignLead}
                     onRecordCallOutcome={handleRecordCallOutcome}
                     associates={associates.filter(a => a.role === 'ASSOCIATE')}
                     role="TEAM_LEADER" 
                     fetchLeads={fetchData} 
                     theme={theme}
                   />
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

        {activeTab === 'team' && (
          <div className="d-flex flex-column gap-4">
            <div className="premium-card overflow-hidden">
              <div className="card-header bg-transparent p-4 border-0 border-bottom border-white border-opacity-5">
                 <h5 className="fw-bold text-uppercase mb-0 text-white tracking-wider small">Associate Performance Snapshot</h5>
              </div>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className={theme === 'dark' ? 'table-dark' : 'table-light'}>
                    <tr className="text-uppercase text-muted small fw-bold">
                      <th className="ps-4">Associate</th>
                      <th className="text-center">Leads Handled</th>
                      <th className="text-center">Lost</th>
                      <th className="text-center">Conversions</th>
                      <th className="pe-4 text-end">Efficiency %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performance.map((p) => (
                      <tr key={p.userId} className="cursor-pointer" onClick={() => setFilters({ ...filters, userId: p.userId })}>
                        <td className="ps-4">
                          <div className="d-flex align-items-center gap-2">
                            <span className="fw-bold text-white small">{p.username}</span>
                            <TrendingUp size={12} className="text-primary opacity-0 hover-opacity-100" />
                          </div>
                        </td>
                        <td className="text-center fw-bold">{p.totalLeads}</td>
                        <td className="text-center text-danger fw-bold">{p.lostLeads}</td>
                        <td className="text-center text-success fw-bold">{p.convertedLeads}</td>
                        <td className="pe-4 text-end text-primary fw-bold">
                          {p.totalLeads > 0 ? ((p.convertedLeads / p.totalLeads) * 100).toFixed(1) : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="premium-card overflow-hidden">
               <div className="card-header bg-transparent p-4 border-0 border-bottom border-white border-opacity-5">
                   <h5 className="fw-bold text-uppercase mb-0 text-white tracking-wider small">Team Assignment Matrix</h5>
               </div>
               <div className="card-body p-0">
                   <LeadList 
                     leads={leads} 
                     onUpdateStatus={handleUpdateStatus} 
                     onSendPaymentLink={handleSendPaymentLink} 
                     onAssignLead={handleAssignLead}
                     onRecordCallOutcome={handleRecordCallOutcome}
                     associates={associates.filter(a => a.role === 'ASSOCIATE')}
                     role="TEAM_LEADER" 
                     fetchLeads={fetchData} 
                     theme={theme}
                   />
               </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <>
            <div className="row g-4">
              <div className="col-12">
                <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
                   <div className="card-body p-0">
                       <RevenueTrendChart data={trendData} theme={theme} />
                   </div>
                </div>
              </div>
            </div>

            <div className="row g-3">
              <div className="col-12 col-md-4">
                <StatCard title="Total Managed" value={stats?.leadStats?.TOTAL || 0} sub="Pipeline Records" icon={<Users />} color="primary" />
              </div>
              <div className="col-12 col-md-4">
                <StatCard title="Success Leads" value={stats?.convertedToday || 0} sub="Paid/Partial" icon={<CheckCircle />} color="success" />
              </div>
              <div className="col-12 col-md-4">
                <StatCard title="Interested" value={stats?.interestedToday || 0} sub="Hot Leads" icon={<Zap />} color="warning" />
              </div>
              <div className="col-12 col-md-4">
                <StatCard title="Lost" value={stats?.lostToday || 0} sub="Disinterest" icon={<Phone />} color="danger" />
              </div>
              <div className="col-12 col-md-4">
                <StatCard title="Pending Rev" value={stats?.pendingRevenue || 0} sub="₹ (Projected)" icon={<IndianRupee />} color="info" />
              </div>
              <div className="col-12 col-md-4">
                <StatCard title="Revenue" value={stats?.totalPayments || 0} sub="₹ (Confirmed)" icon={<IndianRupee />} color="success" />
              </div>
            </div>

          </>
        )}

        {activeTab === 'payments' && (
          <div className="d-flex flex-column gap-4">
             <h5 className="fw-bold text-uppercase mb-0 px-2 text-primary">Team Conversion History</h5>
             <PaymentHistory role="TEAM_LEADER" />
          </div>
        )}
      </div>

      <BulkUpload 
        isOpen={isBulkUploadModalOpen}
        onClose={() => setIsBulkUploadModalOpen(false)}
        onUploadSuccess={fetchData} 
        uploadUrl={null} // Default handles it
      />
    </DashboardLayout>
  );
};

export default TeamLeaderDashboard;
