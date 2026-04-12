import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import adminService from '../services/adminService';
import PaymentHistory from '../components/PaymentHistory';
import StatCard from '../components/StatCard';
import LeadsTable from './dashboard/components/LeadsTable';
import TeamTree from './dashboard/components/TeamTree';
import TeamManagement from './dashboard/components/TeamManagement';
import RevenueTrendChart from './dashboard/components/RevenueTrendChart';
import FiltersBar from './dashboard/components/FiltersBar';
import DashboardLayout from '../components/layout/DashboardLayout';
import UserEditModal from './dashboard/components/UserEditModal';
import AttendanceDashboard from '../components/pages/AttendanceDashboard';
import AttendanceSettings from './dashboard/components/AttendanceSettings';
import CallLogDashboard from './dashboard/components/CallLogDashboard';
import CallAnalyticsGrid from './dashboard/components/CallAnalyticsGrid';
import InvoiceModal from './dashboard/components/InvoiceModal';
import paymentService from '../services/paymentService';
import BulkUploadModal from './dashboard/components/BulkUploadModal';
import LeadForm from '../components/LeadForm';
import TicketManager from '../components/TicketManager';

import MetricCommandCenter from './dashboard/components/MetricCommandCenter';
import { Button, Card, Input, Table } from '../components/common/Components';
import TaskBoard from '../components/TaskBoard';
import {
  UserPlus,
  Users,
  IndianRupee,
  Phone,
  Edit,
  Trash2,
  CheckCircle,
  TrendingUp,
  Power,
  Zap,
} from 'lucide-react';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [availableShifts, setAvailableShifts] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [leads, setLeads] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [callStats, setCallStats] = useState(null);
  const [teamTree, setTeamTree] = useState(null);
  const [summary, setSummary] = useState(null);
  
  // Pipeline state
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUnassigned, setFilterUnassigned] = useState(false);
  const [bulkAssignTlId, setBulkAssignTlId] = useState('');

  // Invoice state
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedInvoiceData, setSelectedInvoiceData] = useState(null);

  const [filters, setFilters] = useState({
    from: new Date().toISOString().split('T')[0] + 'T00:00:00',
    to:   new Date().toISOString().split('T')[0] + 'T23:59:59',
    userId: null,
    currentUserId: user?.id
  });

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const handleSync = () => setRefreshTrigger(prev => prev + 1);

  const fetchData = async () => {
    setLoading(true);
    try {
      const statsFilters = { start: filters.from, end: filters.to, userId: filters.userId };
      const trendFilters = { 
        from: filters.from.split('T')[0], 
        to: filters.to.split('T')[0],
        userId: filters.userId 
      };

      const [statsRes, perfRes, trendRes, usersRes, permsRes, shiftsRes, leadsRes, treeRes, callStatsRes, summaryRes] = await Promise.all([
        adminService.fetchDashboardStats(statsFilters),
        adminService.fetchMemberPerformance(statsFilters),
        adminService.fetchTrendData(trendFilters),
        adminService.fetchUsers(),
        adminService.fetchPermissions(),
        adminService.fetchShifts(),
        adminService.fetchLeads(),
        adminService.fetchTeamTree(),
        adminService.fetchGlobalCallStats({ date: filters.from.split('T')[0] }),
        adminService.fetchDashboardSummary({ from: filters.from.split('T')[0], to: filters.to.split('T')[0] })
      ]);

      setStats(statsRes.data || {});
      setSummary(summaryRes.data);
      const perfData = perfRes.data;
      setPerformance(Array.isArray(perfData) ? perfData : (perfData?.data || []));
      const trendPayload = trendRes.data;
      setTrendData(Array.isArray(trendPayload) ? trendPayload : (trendPayload?.data || []));
      const usersPayload = usersRes.data;
      setUsers(usersPayload?.content || (Array.isArray(usersPayload) ? usersPayload : []));
      const permsPayload = permsRes.data;
      setAvailablePermissions(Array.isArray(permsPayload) ? permsPayload : (permsPayload?.data || []));
      setAvailableShifts(Array.isArray(shiftsRes.data) ? shiftsRes.data : (shiftsRes.data?.data || []));
      const leadsPayload = leadsRes.data;
      setLeads(leadsPayload?.content || (Array.isArray(leadsPayload) ? leadsPayload : []));
      setTeamTree(treeRes.data || null);
      setCallStats(callStatsRes.data?.data || callStatsRes.data);
    } catch (err) {
      toast.error('System synchronization failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-scroll to top on filter change to ensure user sees updated charts/stats immediately
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [filters, refreshTrigger]);

  const handleDeleteUser = async (id) => {
    if (window.confirm('Terminate this user access permanently?')) {
      try {
        await adminService.deleteUser(id);
        toast.success('User access revoked');
        fetchData();
      } catch (err) {
        toast.error('Deletion failed');
      }
    }
  };

  const handleEditUser = (u) => {
    setEditingUser({ ...u });
    // Deep clone to detach from parent list
    setEditingUser(JSON.parse(JSON.stringify(u)));
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await adminService.updateUser(editingUser.id, editingUser);
      toast.success('User profile updated');
      
      // Close first
      setIsEditModalOpen(false);
      
      // Delay refresh to prevent race conditions
      setTimeout(() => {
        fetchData();
      }, 300);
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const handleAddLead = async (leadData) => {
    try {
      await adminService.addLead(leadData);
      toast.success('Lead initialized in global pool');
      fetchData();
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lead transmission failed - duplicate entry or system error');
      return false;
    }
  };

  const handleCreateUser = async (formData) => {
    try {
      await adminService.createUser(formData);
      toast.success('Account provisioned successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Creation failed');
    }
  };

  const handleAssignLead = async (leadId, tlId) => {
    try {
      toast.info('Assigning lead...');
      await adminService.assignLead(leadId, tlId);
      toast.success('Lead assignment confirmed');
      fetchData();
    } catch (err) {
      toast.error('Assignment failed - logic error');
    }
  };


  const handleAssignSupervisor = async (assocId, supId) => {
    try {
      await adminService.assignSupervisor(assocId, supId);
      toast.success('Direct reporting relationship synchronized');
      fetchData();
    } catch (err) {
      toast.error('Hierarchy update failed');
    }
  };

  const handleBulkAssign = async () => {
    if (!bulkAssignTlId || selectedLeadIds.length === 0) return;
    try {
      toast.info(`Provisioning ${selectedLeadIds.length} lead assignments...`);
      await adminService.bulkAssignLeads(selectedLeadIds, bulkAssignTlId);
      toast.success(`${selectedLeadIds.length} leads assigned successfully`);
      setSelectedLeadIds([]);
      fetchData();
    } catch (err) {
      toast.error('Bulk assignment failed - system error');
    }
  };


  const handleViewInvoice = async (lead) => {
    try {
      toast.info('Generating official invoice document...');
      const res = await paymentService.fetchInvoiceByLead(lead.id);
      setSelectedInvoiceData(res.data);
      setIsInvoiceModalOpen(true);
    } catch (err) {
      toast.error('Failed to retrieve invoice - no confirmed payment found');
    }
  };


  const toggleSelection = (id) => {
    setSelectedLeadIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredLeadsList = leads.filter(l => {
    const matchesSearch = 
      l.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      l.mobile?.includes(searchTerm) ||
      l.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUnassigned = filterUnassigned ? !l.assignedToId : true;
    return matchesSearch && matchesUnassigned;
  });

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      role="ADMIN"
    >
      <div className="animate-fade-in">
        {activeTab === 'overview' && (
          <div className="d-flex flex-column gap-3">
            {filters.userId && (
              <div className="d-flex align-items-center justify-content-between p-3 bg-primary bg-opacity-10 border border-primary border-opacity-20 rounded-4 animate-slide-in mb-3 shadow-glow">
                <div className="d-flex align-items-center gap-3">
                  <div className="p-3 bg-primary bg-opacity-20 rounded-circle text-primary border border-primary border-opacity-30">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <h4 className="fw-black mb-0 text-main text-uppercase tracking-widest">Performance Profile</h4>
                    <p className="text-muted small mb-0 fw-bold opacity-75">Viewing specialized analytical data for selected staff node</p>
                  </div>
                </div>
                <button
                  className="ui-btn ui-btn-outline btn-sm px-4 rounded-pill border-primary border-opacity-30 fw-black text-uppercase tracking-wider"
                  onClick={() => setFilters({...filters, userId: null})}
                  style={{ fontSize: '11px' }}
                >
                  ← Back to Global Overview
                </button>
              </div>
            )}
            
            <div className="mb-2">
               <MetricCommandCenter stats={{...summary, performance}} role="ADMIN" filters={filters} onNavigate={setActiveTab} />
            </div>
            <div className="row g-3 mb-1">
              <div className="col-12">
                <FiltersBar
                  filters={filters}
                  onChange={setFilters}
                  onSync={handleSync}
                  users={users}
                  role="ADMIN"
                />
              </div>
            </div>

            <div className="row g-3">
              <div className="col-12 col-xl-8">
                <Card title="Revenue Trajectory" subtitle="Aggregated Performance Analytics" className="h-100">
                  <div className="py-2" style={{ height: '380px' }}>
                    <RevenueTrendChart data={trendData} theme={theme} />
                  </div>
                </Card>
              </div>
              <div className="col-12 col-xl-4">
                <div className="row g-3">
                  <div className="col-12">
                    <StatCard title="Total Managed" value={stats?.totalGlobalLeads || 0} sub="Global Operational Records" icon={<Users />} color="primary" />
                  </div>
                  <div className="col-12 col-sm-6 col-xl-6">
                    <StatCard title="Success Leads" value={stats?.convertedToday || 0} sub="Paid Today" icon={<CheckCircle />} color="success" />
                  </div>
                  <div className="col-12 col-sm-6 col-xl-6">
                    <StatCard title="Lost (Today)" value={stats?.lostToday || 0} sub="Off-Pitch" icon={<Phone />} color="danger" />
                  </div>
                  <div className="col-12 col-sm-6 col-xl-6">
                    <StatCard title="Pending Value" value={stats?.pendingRevenue || 0} sub="Projected" icon={<IndianRupee />} color="info" unit="Trans" />
                  </div>
                  <div className="col-12 col-sm-6 col-xl-6">
                    <StatCard title="Revenue" value={stats?.totalPayments || 0} sub="Confirmed" icon={<IndianRupee />} color="success" unit="Trans" />
                  </div>
                </div>
              </div>

              <div className="col-12 text-main">
                <Card title="Management Matrix" subtitle="Global User Efficiency Snapshot">
                  <Table 
                    headers={[
                      'Staff Node', 
                      'Operational Slot', 
                      <div className="text-center">Load</div>, 
                      <div className="text-center">Success</div>, 
                      <div className="text-center">Risk</div>, 
                      'Sync Rate'
                    ]}
                    data={performance.slice(0, 10)}
                    renderRow={(p) => (
                      <>
                        <td
                          className="ps-4 fw-bold text-primary cursor-pointer hover-scale transition-all"
                          onClick={() => {
                            setFilters({...filters, userId: p.userId});
                            toast.info(`Drilling into performance profile for ${p.username}`);
                          }}
                          title="Click to drill into this member's data"
                        >
                          <div className="d-flex align-items-center gap-2">
                            <Zap size={10} className="text-warning animate-pulse" />
                            {p.username}
                          </div>
                        </td>
                        <td><span className="ui-badge bg-surface text-muted small">{p.role}</span></td>
                        <td className="text-center fw-bold">{p.totalLeads}</td>
                        <td className="text-center text-success fw-bold">{p.convertedLeads || 0}</td>
                        <td className="text-center text-danger fw-bold">{p.lostLeads || 0}</td>
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

         {activeTab === 'users' && (
          <div className="animate-fade-in">
            <TeamManagement 
              teamLeaders={users}
              roles={[{id: 1, name: 'ADMIN'}, {id: 2, name: 'MANAGER'}, {id: 3, name: 'TEAM_LEADER'}, {id: 4, name: 'ASSOCIATE'}]}
              permissions={availablePermissions}
              handleCreateUser={handleCreateUser}
              handleDeleteUser={handleDeleteUser}
              handleEditUser={handleEditUser}
              handleAssignSupervisor={handleAssignSupervisor}
              setSelectedPerfUserId={(id) => setFilters({...filters, userId: id})}
              setActiveTab={setActiveTab}
            />
          </div>
        )}

        {activeTab === 'hierarchy' && (
          <div className="animate-fade-in row">
            <div className="col-12">
              <TeamTree
                data={teamTree}
                onFocus={(id) => setFilters({...filters, userId: id})}
                currentFocusId={filters.userId}
              />
            </div>
          </div>
        )}

        {activeTab === 'pipeline' && (
          <div className="animate-fade-in d-flex flex-column gap-4">
            <div className="row">
              <div className="col-12">
                 <div className="premium-card overflow-hidden animate-fade-in shadow-lg h-100">
                    <div className="card-header bg-transparent p-4 border-0 d-flex justify-content-between align-items-center border-bottom border-white border-opacity-5">
                       <div>
                           <h5 className="fw-black mb-0 text-main text-uppercase tracking-widest small">Global Pipeline Ledger</h5>
                           <small className="text-muted fw-bold opacity-50 small text-uppercase tracking-wider" style={{ fontSize: '9px' }}>IDENTIFICATION & ASSIGNMENT NODE</small>
                       </div>
                       <button className="ui-btn ui-btn-primary btn-sm px-4 rounded-pill shadow-glow" onClick={() => fetchData()}>LIVE SYNC</button>
                    </div>
                    <div className="card-body p-0">
                       <LeadsTable
                         leads={filteredLeadsList}
                         searchTerm={searchTerm}
                         setSearchTerm={setSearchTerm}
                         filterUnassigned={filterUnassigned}
                         setFilterUnassigned={setFilterUnassigned}
                         selectedLeadIds={selectedLeadIds}
                         toggleSelection={toggleSelection}
                         toggleSelectAll={() => setSelectedLeadIds(selectedLeadIds.length === filteredLeadsList.length ? [] : filteredLeadsList.map(l => l.id))}
                         bulkAssignTlId={bulkAssignTlId}
                         setBulkAssignTlId={setBulkAssignTlId}
                         handleAssignLead={handleAssignLead}
                         onViewInvoice={handleViewInvoice}
                         onRecordCallOutcome={async (lead, data) => {
                           try {
                             await adminService.recordCallOutcome(lead.id, data);
                             toast.success('Outcome recorded');
                             fetchData();
                           } catch (err) {
                             toast.error('Failed to record outcome');
                           }
                         }}
                         teamLeaders={users.filter(u => u.role === 'TEAM_LEADER' || u.role === 'MANAGER' || u.role === 'ASSOCIATE')}
                       />
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}


        {activeTab === 'attendance-logs' && (
          <div className="animate-fade-in">
             <AttendanceDashboard role="ADMIN" />
          </div>
        )}

        {activeTab === 'attendance-settings' && (
          <div className="animate-fade-in">
             <AttendanceSettings />
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="animate-fade-in">
            <TaskBoard
              leads={leads}
              theme={theme}
              onUpdateStatus={handleUpdateUser} // Generic refresh
              fetchLeads={fetchData}
            />
          </div>
        )}

        {activeTab === 'call-logs' && (
          <CallLogDashboard />
        )}

        {activeTab === 'revenue' && (
          <div className="d-flex flex-column gap-4 animate-fade-in">
             <div className="d-flex align-items-center gap-3 mb-1">
                <div className="p-2 bg-primary bg-opacity-10 rounded text-primary border border-primary border-opacity-10">
                    <TrendingUp size={18} />
                </div>
                <div>
                   <h5 className="fw-black mb-0 text-main text-uppercase small tracking-widest">Financial Transmission Ledger</h5>
                   <p className="text-muted small mb-0 fw-bold opacity-50" style={{fontSize: '9px'}}>AGGREGATED TRANSACTIONAL ARCHIVE</p>
                </div>
            </div>
            <PaymentHistory role="ADMIN" />
          </div>
        )}
        {activeTab === 'ingestion' && (
          <div className="animate-fade-in d-flex flex-column gap-4">
            <div className="row g-4">
              <div className="col-12 col-xl-4">
                 <div className="d-flex flex-column gap-4 h-100">
                   <LeadForm onSubmit={handleAddLead} title="Seed Global Lead" />
                 </div>
              </div>
              <div className="col-12 col-xl-8">
                 <BulkUploadModal 
                    isInline={true} 
                    assignees={users.filter(u => u.role === 'TEAM_LEADER' || u.role === 'MANAGER' || u.role === 'ASSOCIATE')}
                    onSuccess={fetchData} 
                 />
              </div>
            </div>
          </div>
        )}
        {activeTab === 'tickets' && (
          <div className="animate-fade-in">
             <TicketManager role="ADMIN" />
          </div>
        )}
      </div>

      <UserEditModal 
        key={editingUser?.id}
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        user={editingUser} 
        setUser={setEditingUser} 
        onSubmit={handleUpdateUser}
        roles={[{id: 1, name: 'ADMIN'}, {id: 2, name: 'MANAGER'}, {id: 3, name: 'TEAM_LEADER'}, {id: 4, name: 'ASSOCIATE'}]} 
        permissions={availablePermissions}
        teamLeaders={users}
        shifts={availableShifts}
      />

      <InvoiceModal 
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        invoiceData={selectedInvoiceData}
      />
    </DashboardLayout>
  );
};

export default AdminDashboard;
