import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, TrendingUp, Zap, AlertCircle, LogOut, Sun, Moon, Menu, BarChart3, BarChart2, IndianRupee, Phone, Upload, CheckCircle } from 'lucide-react';
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
import CallLogDashboard from './dashboard/components/CallLogDashboard';

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
      setLeads(Array.isArray(leadsRes.data) ? leadsRes.data : (leadsRes.data?.content || []));
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
      toast.info('Assigning lead to associate...');
      await tlService.assignLead(leadId, associateId);
      toast.success('Assignment confirmed');
      fetchData();
    } catch (err) {
      toast.error('Assignment synchronization failed');
    }
  };


  return (
    <DashboardLayout
      title="Team leader console"
      subtitle="Performance tracking"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      role="TEAM_LEADER"
    >
      <div className="animate-fade-in d-flex flex-column gap-3">
        {/* Operational Scope Filters */}
        {(activeTab === 'performance' || activeTab === 'team' || activeTab === 'leads') && (
          <FiltersBar
            filters={filters}
            onChange={setFilters}
            theme={theme}
          />
        )}

        {filters.userId && (
          <div className="d-flex align-items-center gap-2 mb-4 p-2 bg-primary bg-opacity-10 border border-primary border-opacity-20 rounded-3 animate-fade-in w-fit">
            <span className="label text-primary" style={{ fontSize: '10px', textTransform: 'uppercase' }}>Focus Node:</span>
            <span className="value text-white me-2 small fw-bold">{associates.find(a => a.id === filters.userId)?.name || 'Associate'}</span>
            <button
              className="btn btn-sm btn-link p-0 text-primary fw-bold text-decoration-none border-0 shadow-none hover-scale transition-all"
              onClick={() => setFilters({ ...filters, userId: null })}
              style={{ fontSize: '9px' }}
            >
              [ CLEAR FOCUS ]
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
          <div className="card overflow-hidden border border-white border-opacity-5 animate-fade-in">
            <div className="card-header bg-transparent p-4 border-0 border-bottom border-white border-opacity-5">
              <h5 className="fw-black mb-0 text-white" style={{ fontSize: '16px' }}>Lead Pipeline Management</h5>
              <p className="text-muted small mb-0 fw-bold opacity-50 text-uppercase tracking-wider" style={{ fontSize: '9px' }}>Current Assigned Working Set</p>
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
            {/* Squad Efficiency Snapshot */}
            {(() => {
              const squadStats = performance.reduce((acc, p) => ({
                leads: acc.leads + (p.totalLeads || 0),
                converted: acc.converted + (p.convertedLeads || 0),
                lost: acc.lost + (p.lostLeads || 0),
                revenue: acc.revenue + (p.revenue || 0)
              }), { leads: 0, converted: 0, lost: 0, revenue: 0 });

              const squadConversion = squadStats.leads > 0
                ? ((squadStats.converted / squadStats.leads) * 100).toFixed(1)
                : "0.0";

              return (
                <div className="row g-3 animate-fade-in">
                  <div className="col-12 col-md-3">
                    <div className="premium-card p-4 border border-white border-opacity-5 relative overflow-hidden h-100">
                      <div className="position-absolute top-0 end-0 p-3 opacity-10">
                        <BarChart2 size={40} className="text-primary" />
                      </div>
                      <p className="text-muted small fw-bold text-uppercase tracking-widest mb-1" style={{ fontSize: '10px' }}>Squad Conversion</p>
                      <h3 className="fw-black mb-0 text-white">{squadConversion}%</h3>
                      <div className="progress mt-2 bg-secondary bg-opacity-10" style={{ height: '3px' }}>
                        <div className="progress-bar bg-primary" style={{ width: `${squadConversion}%` }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-md-3">
                    <div className="premium-card p-4 border border-white border-opacity-5 relative overflow-hidden h-100">
                      <p className="text-muted small fw-bold text-uppercase tracking-widest mb-1" style={{ fontSize: '10px' }}>Active Pipeline</p>
                      <h3 className="fw-black mb-0 text-white">{squadStats.leads}</h3>
                      <small className="text-muted fw-bold opacity-50" style={{ fontSize: '9px' }}>TOTAL RANGE LEADS</small>
                    </div>
                  </div>
                  <div className="col-12 col-md-3">
                    <div className="premium-card p-4 border border-white border-opacity-5 relative overflow-hidden h-100">
                      <p className="text-muted small fw-bold text-uppercase tracking-widest mb-1" style={{ fontSize: '10px' }}>Success Nodes</p>
                      <h3 className="fw-black mb-0 text-success">{squadStats.converted}</h3>
                      <small className="text-muted fw-bold opacity-50" style={{ fontSize: '9px' }}>COMPLETED TARGETS</small>
                    </div>
                  </div>
                  <div className="col-12 col-md-3">
                    <div className="premium-card p-4 border border-white border-opacity-5 relative overflow-hidden h-100">
                      <p className="text-muted small fw-bold text-uppercase tracking-widest mb-1" style={{ fontSize: '10px' }}>Lost Assets</p>
                      <h3 className="fw-black mb-0 text-danger">{squadStats.lost}</h3>
                      <small className="text-muted fw-bold opacity-50" style={{ fontSize: '9px' }}>OFF-PITCH TERMINATIONS</small>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="card overflow-hidden border border-white border-opacity-5">
              <div className="card-header bg-transparent p-4 border-0 border-bottom border-white border-opacity-5 d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="fw-black mb-0 text-white" style={{ fontSize: '16px' }}>Associate Performance Snapshot</h5>
                  <p className="text-muted small mb-0 fw-bold opacity-50 text-uppercase tracking-wider" style={{ fontSize: '9px' }}>Current Operational Node Status</p>
                </div>
                <div className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-20 px-3 py-1 fw-bold">
                  {performance.length} TOTAL ASSOCIATES
                </div>
              </div>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr className="text-muted small fw-black border-bottom border-white border-opacity-5">
                      <th className="ps-4" style={{ fontSize: '10px' }}>ASSOCIATE IDENTIFIER</th>
                      <th className="text-center" style={{ fontSize: '10px' }}>MGMT LOAD</th>
                      <th className="text-center" style={{ fontSize: '10px' }}>LOST NODE</th>
                      <th className="text-center" style={{ fontSize: '10px' }}>SUCCESS CONV</th>
                      <th className="pe-4 text-end" style={{ fontSize: '10px' }}>EFFICIENCY RATE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performance.map((p) => (
                      <tr key={p.userId} className="table-row cursor-pointer border-white border-opacity-5" onClick={() => setFilters({ ...filters, userId: p.userId })}>
                        <td className="ps-4 table-cell">
                          <div className="d-flex align-items-center gap-3">
                            <div className="bg-primary bg-opacity-10 text-primary rounded-pill p-1.5 fw-black small" style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {p.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="d-flex flex-column">
                              <span className="fw-black text-white small">{p.username}</span>
                              <small className="text-muted fw-bold opacity-50" style={{ fontSize: '9px' }}>ASSOCIATE OPS</small>
                            </div>
                          </div>
                        </td>
                        <td className="text-center table-cell fw-black text-white">{p.totalLeads}</td>
                        <td className="text-center table-cell text-danger fw-black">{p.lostLeads}</td>
                        <td className="text-center table-cell text-success fw-black">{p.convertedLeads}</td>
                        <td className="pe-4 text-end table-cell">
                          <div className="d-flex flex-column align-items-end">
                            <span className="text-primary fw-black" style={{ fontSize: '12px' }}>
                              {p.totalLeads > 0 ? ((p.convertedLeads / p.totalLeads) * 100).toFixed(1) : 0}%
                            </span>
                            <div className="progress w-100 bg-secondary bg-opacity-10 mt-1" style={{ height: '2px', maxWidth: '60px' }}>
                              <div
                                className="progress-bar bg-primary"
                                role="progressbar"
                                style={{ width: `${p.totalLeads > 0 ? (p.convertedLeads / p.totalLeads) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card overflow-hidden border border-white border-opacity-5">
              <div className="card-header bg-transparent p-4 border-0 border-bottom border-white border-opacity-5">
                <h5 className="fw-black mb-0 text-white" style={{ fontSize: '16px' }}>Team Assignment Matrix</h5>
                <p className="text-muted small mb-0 fw-bold opacity-50 text-uppercase tracking-wider" style={{ fontSize: '9px' }}>Associate Operation Management</p>
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
            <h5 className="fw-semibold mb-0 px-2 text-primary">Team Conversion History</h5>
            <PaymentHistory role="TEAM_LEADER" />
          </div>
        )}

        {activeTab === 'call-logs' && (
          <CallLogDashboard />
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
