import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import adminService from '../services/adminService';
import PaymentHistory from '../components/PaymentHistory';
import StatCard from '../components/StatCard';
import LeadsTable from './dashboard/components/LeadsTable';
import TeamTree from './dashboard/components/TeamTree';
import RevenueTrendChart from './dashboard/components/RevenueTrendChart';
import FiltersBar from './dashboard/components/FiltersBar';
import DashboardLayout from '../components/layout/DashboardLayout';
import UserEditModal from './dashboard/components/UserEditModal';
import BulkUploadModal from './dashboard/components/BulkUploadModal.jsx';
import AttendanceDashboard from '../components/pages/AttendanceDashboard';
import AttendanceSettings from './dashboard/components/AttendanceSettings';
import CallLogDashboard from './dashboard/components/CallLogDashboard';
import InvoiceModal from './dashboard/components/InvoiceModal';
import paymentService from '../services/paymentService';
import { Button, Card, Input, Table } from '../components/common/Components';
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
  const [teamTree, setTeamTree] = useState(null);
  
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
    userId: null
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

      const [statsRes, perfRes, trendRes, usersRes, permsRes, shiftsRes, leadsRes, treeRes] = await Promise.all([
        adminService.fetchDashboardStats(statsFilters),
        adminService.fetchMemberPerformance(statsFilters),
        adminService.fetchTrendData(trendFilters),
        adminService.fetchUsers(),
        adminService.fetchPermissions(),
        adminService.fetchShifts(),
        adminService.fetchLeads(),
        adminService.fetchTeamTree()
      ]);

      // /dashboard/stats returns Map directly (no ApiResponse wrapper)
      setStats(statsRes.data || {});
      // /reports/member-performance returns List directly
      const perfData = perfRes.data;
      setPerformance(Array.isArray(perfData) ? perfData : (perfData?.data || []));
      // /reports/trend returns ApiResponse-wrapped list
      const trendPayload = trendRes.data;
      setTrendData(Array.isArray(trendPayload) ? trendPayload : (trendPayload?.data || []));
      // paginated endpoints — Page<> has .content
      const usersPayload = usersRes.data;
      setUsers(usersPayload?.content || (Array.isArray(usersPayload) ? usersPayload : []));
      const permsPayload = permsRes.data;
      setAvailablePermissions(Array.isArray(permsPayload) ? permsPayload : (permsPayload?.data || []));
      setAvailableShifts(Array.isArray(shiftsRes.data) ? shiftsRes.data : (shiftsRes.data?.data || []));
      const leadsPayload = leadsRes.data;
      setLeads(leadsPayload?.content || (Array.isArray(leadsPayload) ? leadsPayload : []));
      setTeamTree(treeRes.data || null);
    } catch (err) {
      toast.error('System synchronization failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
    const matchesSearch = l.name?.toLowerCase().includes(searchTerm.toLowerCase()) || l.mobile?.includes(searchTerm);
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
            <div className="row g-3 mb-1">
              <div className="col-12">
                <FiltersBar
                  filters={filters}
                  onChange={setFilters}
                  onSync={handleSync}
                />
                {filters.userId && (
                  <div className="d-flex align-items-center gap-2 mt-3 p-2 bg-primary bg-opacity-10 border border-primary border-opacity-20 rounded-3 animate-fade-in w-fit">
                    <span className="label text-primary" style={{ fontSize: '10px', textTransform: 'uppercase' }}>Focus Node:</span>
                    <span className="value text-main me-2 small fw-bold">Individual Performance Profile</span>
                    <button
                      className="btn btn-sm btn-link p-0 text-primary fw-bold text-decoration-none border-0 shadow-none hover-scale transition-all"
                      onClick={() => setFilters({...filters, userId: null})}
                      style={{ fontSize: '9px' }}
                    >[ CLEAR FOCUS ]</button>
                  </div>
                )}
              </div>
            </div>

            <div className="row g-3">
              <div className="col-12 col-xl-8">
                <Card title="Revenue Trajectory" subtitle="Aggregated Performance Analytics" style={{ height: '100%' }}>
                  <RevenueTrendChart data={trendData} theme={theme} />
                </Card>
              </div>
              <div className="col-12 col-xl-4">
                <div className="d-flex flex-column gap-3 h-100">
                  <StatCard title="Total Managed" value={stats?.leadStats?.TOTAL || 0} sub="Global Operational Records" icon={<Users />} color="primary" />
                  <StatCard title="Success Leads" value={stats?.convertedToday || 0} sub="Paid/Partial Cycle" icon={<CheckCircle />} color="success" />
                  <StatCard title="Lost (Today)" value={stats?.lostToday || 0} sub="Off-Pitch Terminations" icon={<Phone />} color="danger" />
                  <StatCard title="Pending Value" value={stats?.pendingRevenue || 0} sub="INR Projected Margin" icon={<IndianRupee />} color="info" />
                  <StatCard title="Revenue" value={stats?.totalPayments || 0} sub="INR Confirmed Trans" icon={<IndianRupee />} color="success" />
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
                          className="ps-4 fw-bold text-primary cursor-pointer"
                          onClick={() => setFilters({...filters, userId: p.userId})}
                          title="Click to drill into this member's data"
                        >{p.username}</td>
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
          <div className="row g-4 animate-fade-in">
            <div className="col-12 col-xl-4">
               <Card title="Add New User" subtitle="Create System Access">
                  <form className="d-flex flex-column gap-2" onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const data = Object.fromEntries(formData.entries());
                    data.permissions = formData.getAll('permissions');
                    handleCreateUser(data);
                    e.target.reset();
                  }}>
                     <Input label="Full Name" name="name" placeholder="John Doe" required />
                     <Input label="Email Address" name="email" type="email" placeholder="john@nexus.com" required />
                     <Input label="Mobile Number" name="mobile" placeholder="+91 0000000000" required />
                     <Input label="Password" name="password" type="password" required />
                     
                     <div className="mb-3">
                         <label className="text-muted fw-bold small text-uppercase mb-2 d-block" style={{ fontSize: '0.65rem' }}>Select Role</label>
                         <select name="role" className="ui-input py-2" required>
                            <option value="" className="text-dark">Select Role...</option>
                            <option value="ADMIN" className="text-dark">System Administrator</option>
                            <option value="MANAGER" className="text-dark">Branch Manager</option>
                            <option value="TEAM_LEADER" className="text-dark">Team Leader</option>
                            <option value="ASSOCIATE" className="text-dark">Associate Staff</option>
                         </select>
                     </div>

                     <div className="mb-4">
                         <label className="text-muted fw-bold small text-uppercase mb-2 d-block" style={{ fontSize: '0.65rem' }}>Access Privileges</label>
                         <div className="custom-scroll p-3 bg-surface rounded-3 border border-white border-opacity-5" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                            <div className="row g-2">
                               {availablePermissions.map(perm => (
                                  <div key={perm} className="col-12">
                                     <div className="form-check">
                                        <input className="form-check-input" type="checkbox" name="permissions" value={perm} id={`perm-${perm}`} />
                                        <label className="form-check-label small fw-bold text-muted ms-1" htmlFor={`perm-${perm}`}>
                                           {perm.replace(/_/g, ' ')}
                                        </label>
                                     </div>
                                  </div>
                               ))}
                            </div>
                         </div>
                     </div>
                     <Button type="submit" className="w-100 py-3 shadow-glow">PROVISION USER</Button>
                  </form>
               </Card>
            </div>

            <div className="col-12 col-xl-8">
               <Card title="Staff Directory" subtitle="Manage System Access">
                  <Table 
                    headers={['User Details', 'Designation', 'Actions']}
                    data={users}
                    renderRow={(u) => (
                      <>
                        <td className="ps-4">
                          <div className="d-flex align-items-center gap-3 py-1">
                             <div className="p-2 bg-primary bg-opacity-10 rounded-circle text-primary text-center d-flex align-items-center justify-content-center border border-primary border-opacity-10" style={{ width: '36px', height: '36px' }}>
                                <Users size={16} />
                             </div>
                             <div>
                                <p className="mb-0 fw-bold text-main small">{u.name}</p>
                                <small className="text-muted fw-bold opacity-50" style={{ fontSize: '9px' }}>{u.email}</small>
                             </div>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex flex-column gap-1">
                            <span className={`ui-badge text-uppercase fw-black ${
                               u.role === 'ADMIN' ? 'bg-danger bg-opacity-10 text-danger border-danger border-opacity-20' : 
                               u.role === 'MANAGER' ? 'bg-warning bg-opacity-10 text-warning border-warning border-opacity-20' : 
                               'bg-primary bg-opacity-10 text-primary border-primary border-opacity-20'
                            }`} style={{fontSize: '8px'}}>
                               {u.role.replace(/_/g, ' ')}
                            </span>
                            <span className={`fw-black text-uppercase small ${u.active ? 'text-success' : 'text-danger opacity-50'}`} style={{ fontSize: '7px', letterSpacing: '0.05em' }}>
                               {u.active ? '• Active Node' : '• Inactive Node'}
                            </span>
                          </div>
                        </td>
                        <td className="pe-4 text-end">
                           <div className="d-flex align-items-center justify-content-end gap-1">
                              <button onClick={() => handleEditUser(u)} className="btn btn-link text-muted p-2 opacity-50 hover-opacity-100" title="Edit Node"><Edit size={16} /></button>
                              <button 
                                onClick={() => handleDeleteUser(u.id)} 
                                className={`btn btn-link p-2 opacity-50 hover-opacity-100 ${u.active ? 'text-danger' : 'text-success'}`} 
                                disabled={u.email === user?.email}
                                title={u.active ? "Deactivate Node" : "Activate Node"}
                              >
                                <Power size={16} />
                              </button>
                           </div>
                        </td>
                      </>
                    )}
                  />
               </Card>
            </div>
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
          <div className="premium-card overflow-hidden animate-fade-in shadow-lg">
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
                  teamLeaders={users.filter(u => u.role === 'TEAM_LEADER' || u.role === 'MANAGER')}
                />
             </div>
          </div>
        )}

        {activeTab === 'ingestion' && (
          <div className="animate-fade-in h-100">
            <BulkUploadModal 
              isOpen={true}
              isInline={true}
              onClose={() => setActiveTab('pipeline')}
              onSuccess={handleSync}
              assignees={users.filter(u => u.role === 'ASSOCIATE')}
            />
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
