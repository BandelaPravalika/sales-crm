import React, { useState, useEffect } from 'react';
import { Button, Card, Input, Table } from '../components/common/Components';
import { LayoutDashboard, Users, TrendingUp, Zap, AlertCircle, LogOut, Sun, Moon, Menu, BarChart3, BarChart2, IndianRupee, Phone, Upload, CheckCircle, FileText } from 'lucide-react';
import tlService from '../services/tlService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-toastify';
import StatCard from '../components/StatCard';
import LeadList from '../components/LeadTable';
import PaymentHistory from '../components/PaymentHistory';
import RevenueTrendChart from './dashboard/components/RevenueTrendChart';
import DashboardLayout from '../components/layout/DashboardLayout';
import TaskBoard from '../components/TaskBoard';
import FiltersBar from './dashboard/components/FiltersBar';
import LeadForm from '../components/LeadForm';
import BulkUpload from '../components/BulkUpload';
import CallLogDashboard from './dashboard/components/CallLogDashboard';
import AttendanceDashboard from '../components/pages/AttendanceDashboard';

const TeamLeaderDashboard = () => {
  const { user, logout } = useAuth();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? 'dark' : 'light';

  const [stats, setStats] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [associates, setAssociates] = useState([]);
  const [leads, setLeads] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(localStorage.getItem('tl_activeTab') || 'overview');
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const handleSync = () => setRefreshTrigger(prev => prev + 1);

  // Operational Filters
  const [filters, setFilters] = useState({
    from: new Date().toISOString().split('T')[0] + 'T00:00:00',
    to: new Date().toISOString().split('T')[0] + 'T23:59:59',
    userId: null
  });

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
  }, [filters, refreshTrigger]);

  const handleAddLead = async (leadData) => {
    try {
      await tlService.addLead(leadData);
      toast.success('Lead added! Tracking link sent.');
      fetchData();
      return true;
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to add lead');
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
        {activeTab === 'overview' && (
          <FiltersBar
            filters={filters}
            onChange={setFilters}
            onSync={handleSync}
          />
        )}

        {filters.userId && (
          <div className="d-flex align-items-center gap-2 mb-4 p-2 bg-primary bg-opacity-10 border border-primary border-opacity-20 rounded-3 animate-fade-in w-fit">
            <span className="label text-primary" style={{ fontSize: '10px', textTransform: 'uppercase' }}>Focus Node:</span>
            <span className="value text-main me-2 small fw-bold">{associates.find(a => a.id === filters.userId)?.name || 'Associate'}</span>
            <button
              className="btn btn-sm btn-link p-0 text-primary fw-bold text-decoration-none border-0 shadow-none hover-scale transition-all"
              onClick={() => setFilters({ ...filters, userId: null })}
              style={{ fontSize: '9px' }}
            >
              [ CLEAR FOCUS ]
            </button>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="d-flex flex-column gap-4">
            <div className="row g-4">
              <div className="col-12 col-xl-8">
                <div className="premium-card p-0 overflow-hidden shadow-lg border-0">
                  <div className="card-header bg-transparent p-4 border-0">
                     <h6 className="fw-black mb-0 text-main small tracking-widest text-uppercase">Engagement Curve</h6>
                  </div>
                  <div className="card-body p-0">
                    <RevenueTrendChart data={trendData} theme={theme} />
                  </div>
                </div>
              </div>
              <div className="col-12 col-xl-4">
                <div className="d-flex flex-column gap-3 h-100">
                  <StatCard title="Pipeline" value={stats?.leadStats?.TOTAL || 0} sub="Active Operational Records" icon={<Users />} color="primary" />
                  <StatCard title="Success" value={stats?.convertedToday || 0} sub="Targets Synchronized" icon={<CheckCircle />} color="success" />
                  <StatCard title="Efficiency" value={stats?.totalPayments || 0} sub="₹ Capital Transmission" icon={<IndianRupee />} color="success" />
                </div>
              </div>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-12 col-md-4">
                <StatCard title="Interested" value={stats?.interestedToday || 0} sub="Hot Opportunities" icon={<Zap />} color="warning" />
              </div>
              <div className="col-12 col-md-4">
                <StatCard title="Lost" value={stats?.lostToday || 0} sub="Off-Pitch Segments" icon={<Phone />} color="danger" />
              </div>
              <div className="col-12 col-md-4">
                <StatCard title="Revenue (P)" value={stats?.pendingRevenue || 0} sub="₹ Projected Margin" icon={<IndianRupee />} color="info" />
              </div>
            </div>

            <div className="row g-3">
              <div className="col-12 text-main">
                <Card title="Team Performance Snapshot" subtitle="Member Efficiency & Pipeline Load">
                  <Table 
                    headers={[
                      'Staff Member', 
                      'Designation', 
                      <div className="text-center">Leads</div>, 
                      <div className="text-center">Success</div>, 
                      <div className="text-center">Lost</div>, 
                      'Sync Rate'
                    ]}
                    data={performance}
                    renderRow={(p) => (
                      <>
                        <td onClick={() => setFilters({ ...filters, userId: p.userId })} className="ps-4 cursor-pointer fw-bold text-primary">
                          <div className="d-flex align-items-center gap-3">
                            <div className="bg-primary bg-opacity-10 text-primary rounded-pill p-1 fw-black small" style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                              {p.username.charAt(0).toUpperCase()}
                            </div>
                            <span className="small">{p.username}</span>
                          </div>
                        </td>
                        <td><span className="ui-badge bg-surface text-muted small" style={{ fontSize: '9px' }}>{p.role || 'ASSOCIATE'}</span></td>
                        <td className="text-center fw-bold">{p.totalLeads}</td>
                        <td className="text-center text-success fw-bold">{p.convertedLeads}</td>
                        <td className="text-center text-danger fw-bold">{p.lostLeads}</td>
                        <td className="pe-4 text-end text-primary fw-black">
                          {p.totalLeads > 0 ? ((p.convertedLeads / p.totalLeads) * 100).toFixed(1) : 0}%
                        </td>
                      </>
                    )}
                  />
                </Card>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pipeline' && (
          <Card title="Lead Pipeline Management" subtitle="Current Assigned Working Set">
              <LeadList
                leads={leads}
                onUpdateStatus={handleUpdateStatus}
                onSendPaymentLink={handleSendPaymentLink}
                onAssignLead={handleAssignLead}
                onRecordCallOutcome={handleRecordCallOutcome}
                associates={associates.filter(a => a.role === 'ASSOCIATE')}
                role="TEAM_LEADER"
                currentUser={user}
                fetchLeads={fetchData}
              />
          </Card>
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

        {activeTab === 'reports' && (
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
                    <div className="premium-card p-4 border border-white border-opacity-5 relative overflow-hidden h-100 shadow-glow">
                      <div className="position-absolute top-0 end-0 p-3 opacity-10">
                        <BarChart2 size={40} className="text-primary" />
                      </div>
                      <p className="text-muted small fw-bold text-uppercase tracking-widest mb-1" style={{ fontSize: '10px' }}>Squad Conversion</p>
                      <h3 className="fw-black mb-0 text-main">{squadConversion}%</h3>
                      <div className="progress mt-2 bg-secondary bg-opacity-10" style={{ height: '3px' }}>
                        <div className="progress-bar bg-primary shadow-glow" style={{ width: `${squadConversion}%` }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-md-3">
                    <div className="premium-card p-4 border border-white border-opacity-5 relative overflow-hidden h-100">
                      <p className="text-muted small fw-bold text-uppercase tracking-widest mb-1" style={{ fontSize: '10px' }}>Active Pipeline</p>
                      <h3 className="fw-black mb-0 text-main">{squadStats.leads}</h3>
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

            <Card title="Associate Performance Snapshot" subtitle="Current Operational Node Status">
              <Table 
                headers={[
                  'Staff Member', 
                  'Designation', 
                  <div className="text-center">Leads</div>, 
                  <div className="text-center">Success</div>, 
                  <div className="text-center">Lost</div>, 
                  'Sync Rate'
                ]}
                data={performance}
                renderRow={(p) => (
                  <>
                    <td onClick={() => setFilters({ ...filters, userId: p.userId })} className="ps-4 cursor-pointer fw-bold text-primary">
                      <div className="d-flex align-items-center gap-3">
                        <div className="bg-primary bg-opacity-10 text-primary rounded-pill p-1 fw-black small" style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                          {p.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="small">{p.username}</span>
                      </div>
                    </td>
                    <td><span className="ui-badge bg-surface text-muted small" style={{ fontSize: '9px' }}>{p.role || 'ASSOCIATE'}</span></td>
                    <td className="text-center fw-bold">{p.totalLeads}</td>
                    <td className="text-center text-success fw-bold">{p.convertedLeads}</td>
                    <td className="text-center text-danger fw-bold">{p.lostLeads}</td>
                    <td className="pe-4 text-end text-primary fw-black">
                      {p.totalLeads > 0 ? ((p.convertedLeads / p.totalLeads) * 100).toFixed(1) : 0}%
                    </td>
                  </>
                )}
              />
            </Card>
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
                         <h6 className="fw-black mb-0 text-main tracking-widest text-uppercase">Lead Ingestion Hub</h6>
                         <small className="text-muted fw-bold opacity-50" style={{ fontSize: '8px' }}>MASS DATA ORCHESTRATION & DISTRIBUTION</small>
                      </div>
                   </div>
                   
                   <div className="card-body p-4 d-flex flex-column gap-4">
                      <div className="row g-4 flex-grow-1">
                         <div className="col-12 col-md-6 border-end border-white border-opacity-5">
                            <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center py-4 px-3 bg-surface bg-opacity-30 rounded-4 border border-dashed border-secondary border-opacity-20 transition-smooth hover-bg-opaque">
                               <div className="p-4 bg-primary bg-opacity-10 rounded-circle text-primary mb-4 shadow-glow">
                                  <FileText size={48} />
                               </div>
                               <h5 className="fw-black text-main mb-2">Upload CSV Data</h5>
                               <p className="small text-muted fw-bold mb-4 px-3">Propagate lead datasets into the ecosystem using a validated CSV manifest.</p>
                               <button 
                                 className="btn btn-primary rounded-pill px-5 fw-black text-uppercase shadow-glow"
                                 onClick={() => setIsBulkUploadModalOpen(true)}
                               >
                                 Browse Files
                               </button>
                            </div>
                         </div>
                         
                         <div className="col-12 col-md-6">
                            <div className="d-flex flex-column h-100">
                               <div className="d-flex justify-content-between align-items-center mb-3">
                                  <h6 className="small fw-black text-muted text-uppercase tracking-widest mb-0" style={{ fontSize: '10px' }}>Assignment Strategy</h6>
                                  <div className="d-flex p-1 bg-surface rounded-pill border border-white border-opacity-10">
                                     <button className="btn btn-xs py-1 px-3 rounded-pill fw-black small bg-primary text-white shadow-sm" style={{ fontSize: '8px' }}>SINGLE</button>
                                     <button className="btn btn-xs py-1 px-3 rounded-pill fw-black small text-muted border-0" style={{ fontSize: '8px' }}>SPLIT</button>
                                  </div>
                               </div>
                               
                               <div className="flex-grow-1 overflow-auto custom-scroll pe-2 d-flex flex-column gap-2" style={{ maxHeight: '240px' }}>
                                  <div className={`p-3 rounded-3 border transition-smooth cursor-pointer d-flex align-items-center justify-content-between ${selectedAssignees.length === 0 ? 'border-primary bg-primary bg-opacity-10 shadow-glow' : 'border-white border-opacity-5 bg-surface'}`}
                                       onClick={() => setSelectedAssignees([])}>
                                     <div className="d-flex align-items-center gap-2">
                                        <div className={`p-1 mt-1 rounded-circle border ${selectedAssignees.length === 0 ? 'bg-primary border-primary' : 'bg-transparent border-secondary'}`} style={{ width: '10px', height: '10px' }}></div>
                                        <span className={`small fw-black ${selectedAssignees.length === 0 ? 'text-primary' : 'text-muted'}`}>Unassigned Pool</span>
                                     </div>
                                     {selectedAssignees.length === 0 && <CheckCircle size={14} className="text-primary" />}
                                  </div>
                                  
                                  {associates.map(associate => (
                                     <div key={associate.id} 
                                          className={`p-3 rounded-3 border transition-smooth cursor-pointer d-flex align-items-center justify-content-between ${selectedAssignees.includes(associate.id) ? 'border-primary bg-primary bg-opacity-10 shadow-glow' : 'border-white border-opacity-5 bg-surface'}`}
                                          onClick={() => {
                                             if (selectedAssignees.includes(associate.id)) {
                                                setSelectedAssignees(selectedAssignees.filter(id => id !== associate.id));
                                             } else {
                                                setSelectedAssignees([...selectedAssignees, associate.id]);
                                             }
                                          }}>
                                        <div className="d-flex align-items-center gap-2">
                                           <div className={`p-1 mt-1 rounded-circle border ${selectedAssignees.includes(associate.id) ? 'bg-primary border-primary' : 'bg-transparent border-secondary'}`} style={{ width: '10px', height: '10px' }}></div>
                                           <div className="d-flex flex-column">
                                              <span className={`small fw-black ${selectedAssignees.includes(associate.id) ? 'text-primary' : 'text-main'}`}>{associate.name}</span>
                                              <small className="text-muted fw-bold opacity-50 text-uppercase" style={{ fontSize: '8px' }}>{associate.role}</small>
                                           </div>
                                        </div>
                                        {selectedAssignees.includes(associate.id) && <CheckCircle size={14} className="text-primary" />}
                                     </div>
                                  ))}
                               </div>
                               
                               <div className="mt-4 pt-3 border-top border-white border-opacity-5 d-flex justify-content-between align-items-center">
                                  <div className="small fw-bold text-muted opacity-75">Target Assignees:</div>
                                  <div className="fw-black text-main tracking-widest">{selectedAssignees.length > 0 ? `${selectedAssignees.length} SELECTED` : 'POOL'}</div>
                                </div>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="d-flex flex-column gap-4">
              <PaymentHistory role="TEAM_LEADER" />
          </div>
        )}

        {activeTab === 'attendance' && (
          <AttendanceDashboard role="TEAM_LEADER" />
        )}
      </div>

      <BulkUpload
        isOpen={isBulkUploadModalOpen}
        onClose={() => setIsBulkUploadModalOpen(false)}
        uploadUrl={`/tl/leads/bulk-upload${selectedAssignees.length > 0 ? `?assignedToIds=${selectedAssignees.join(',')}` : ''}`}
        onUploadSuccess={() => {
          toast.success("Manifest ingested and distributed accordingly.");
          fetchData();
        }}
      />
    </DashboardLayout>
  );
};

export default TeamLeaderDashboard;
