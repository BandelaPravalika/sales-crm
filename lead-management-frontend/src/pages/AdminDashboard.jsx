import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import adminService from '../services/adminService';
import PaymentHistory from '../components/PaymentHistory';
import StatCard from '../components/StatCard';
import LeadsTable from './dashboard/components/LeadsTable';
import TeamTree from './dashboard/components/TeamTree';
import RevenueTrendChart from './dashboard/components/RevenueTrendChart';
import FiltersBar from './dashboard/components/FiltersBar';
import DashboardLayout from '../components/layout/DashboardLayout';
import UserEditModal from './dashboard/components/UserEditModal';
import AttendanceDashboard from '../components/pages/AttendanceDashboard';
import AttendanceSettings from './dashboard/components/AttendanceSettings';
import CallLogDashboard from './dashboard/components/CallLogDashboard';
import InvoiceModal from './dashboard/components/InvoiceModal';
import paymentService from '../services/paymentService';
import {
  UserPlus,
  Users,
  IndianRupee,
  Phone,
  Edit,
  Trash2,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availablePermissions, setAvailablePermissions] = useState([]);
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const statsFilters = { start: filters.from, end: filters.to, userId: filters.userId };
      const trendFilters = { from: filters.from.split('T')[0], to: filters.to.split('T')[0] };

      const [statsRes, perfRes, trendRes, usersRes, permsRes, leadsRes, treeRes] = await Promise.all([
        adminService.fetchDashboardStats(statsFilters),
        adminService.fetchMemberPerformance(statsFilters),
        adminService.fetchTrendData(trendFilters),
        adminService.fetchUsers(),
        adminService.fetchPermissions(),
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
  }, [filters]);

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
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await adminService.updateUser(editingUser.id, editingUser);
      toast.success('User profile updated');
      setIsEditModalOpen(false);
      fetchData();
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
      const res = await paymentService.generateInvoice(lead.id);
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
                  theme="dark"
                />
                {filters.userId && (
                  <div className="d-flex align-items-center gap-2 mt-3 p-2 bg-primary bg-opacity-10 border border-primary border-opacity-20 rounded-3 animate-fade-in">
                    <span className="label text-primary">Viewing:</span>
                    <span className="value text-white me-2">Individual Performance Profile</span>
                    <button
                      className="btn btn-sm btn-link p-0 text-primary fw-bold text-decoration-none border-0 shadow-none"
                      onClick={() => setFilters({...filters, userId: null})}
                    >[ CLEAR FILTER ]</button>
                  </div>
                )}
              </div>
            </div>

            <div className="row g-3">
              <div className="col-12 col-xl-8">
                <div className="premium-card overflow-hidden h-100">
                  <div className="card-header bg-transparent border-0 p-3">
                    <h5 className="fw-black mb-0 px-2 text-primary" style={{ fontSize: '15px' }}>Revenue Trajectory</h5>
                  </div>
                  <div className="card-body p-0">
                    <RevenueTrendChart data={trendData} theme="dark" />
                  </div>
                </div>
              </div>
              <div className="col-12 col-xl-4">
                <div className="d-flex flex-column gap-3 h-100">
                  <StatCard title="Total Managed" value={stats?.leadStats?.TOTAL || 0} sub="Managed Records" icon={<Users />} color="primary" />
                  <StatCard title="Success Leads" value={stats?.convertedToday || 0} sub="Paid/Partial" icon={<CheckCircle />} color="success" />
                  <StatCard title="Lost (Today)" value={stats?.lostToday || 0} sub="Disinterest" icon={<Phone />} color="danger" />
                  <StatCard title="Pending Value" value={stats?.pendingRevenue || 0} sub="INR Projected" icon={<IndianRupee />} color="info" />
                  <StatCard title="Revenue" value={stats?.totalPayments || 0} sub="INR Confirmed" icon={<IndianRupee />} color="success" />
                </div>
              </div>

              <div className="col-12">
                <div className="premium-card overflow-hidden">
                  <div className="card-header bg-transparent p-4 border-0 border-bottom border-white border-opacity-5">
                    <h5 className="fw-semibold mb-0 text-white small">Team Assignment Matrix</h5>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0 table-dark border-0">
                      <thead className="bg-dark bg-opacity-50 border-0">
                        <tr className="small fw-semibold text-muted">
                          <th className="ps-4">Staff Node</th>
                          <th>Role</th>
                          <th className="text-center">Leads</th>
                          <th className="text-center">Converted</th>
                          <th className="text-center">Lost</th>
                          <th className="pe-4 text-end">Success %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {performance.slice(0, 10).map(p => (
                          <tr key={p.userId} className="table-row border-white border-opacity-5">
                            <td
                              className="ps-4 table-cell fw-semibold text-primary"
                              onClick={() => setFilters({...filters, userId: p.userId})}
                              style={{ cursor: 'pointer' }}
                              title="Click to drill into this member's data"
                            >{p.username}</td>
                            <td><span className="badge bg-secondary-subtle text-secondary small">{p.role}</span></td>
                            <td className="text-center table-cell fw-semibold">{p.totalLeads}</td>
                            <td className="text-center table-cell text-success fw-semibold">{p.convertedLeads || 0}</td>
                            <td className="text-center table-cell text-danger fw-semibold">{p.lostLeads || 0}</td>
                            <td className="pe-4 table-cell text-end text-primary fw-semibold">
                              {p.totalLeads > 0 ? ((p.convertedLeads / p.totalLeads) * 100).toFixed(1) : 0}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="row g-4 animate-fade-in">
            <div className="col-12 col-xl-4">
               <div className="card h-100 overflow-hidden">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center gap-2 mb-1">
                        <div className="p-1.5 bg-primary bg-opacity-10 rounded text-primary">
                            <UserPlus size={18} />
                        </div>
                        <h5 className="fw-black mb-0 text-white" style={{ fontSize: '16px' }}>Provision Access</h5>
                    </div>
                    <p className="text-muted fw-bold opacity-50 small mb-4 text-uppercase tracking-wider" style={{ fontSize: '9px' }}>Staff Onboarding</p>
                    
                    <form className="d-flex flex-column gap-3" onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.target);
                      const data = Object.fromEntries(formData.entries());
                      data.permissions = formData.getAll('permissions');
                      handleCreateUser(data);
                      e.target.reset();
                    }}>
                       <div>
                           <label className="text-muted fw-bold small text-uppercase mb-2 d-block" style={{ fontSize: '10px' }}>Full Name</label>
                           <input name="name" type="text" className="glass-input w-100" placeholder="John Doe" required />
                       </div>
                       <div>
                           <label className="text-muted fw-bold small text-uppercase mb-2 d-block" style={{ fontSize: '10px' }}>Email Terminal</label>
                           <input name="email" type="email" className="glass-input w-100" placeholder="john@nexus.com" required />
                       </div>
                       <div>
                           <label className="text-muted fw-bold small text-uppercase mb-2 d-block" style={{ fontSize: '10px' }}>Mobile</label>
                           <input name="mobile" type="text" className="glass-input w-100" placeholder="+91 0000000000" required />
                       </div>
                       <div>
                           <label className="text-muted fw-bold small text-uppercase mb-2 d-block" style={{ fontSize: '10px' }}>Initial Cipher</label>
                           <input name="password" type="password" className="glass-input w-100" required />
                       </div>
                       <div>
                           <label className="text-muted fw-bold small text-uppercase mb-2 d-block" style={{ fontSize: '10px' }}>Designation</label>
                           <select name="role" className="glass-input w-100" required>
                              <option value="">Select Role</option>
                              <option value="ADMIN">System Administrator</option>
                              <option value="MANAGER">Branch Manager</option>
                              <option value="TEAM_LEADER">Team Leader</option>
                              <option value="ASSOCIATE">Associate Staff</option>
                           </select>
                       </div>
                       <div>
                           <label className="text-muted fw-bold small text-uppercase mb-2 d-block" style={{ fontSize: '10px' }}>Access Privileges</label>
                           <div className="bg-dark p-3 rounded-3 shadow-sm overflow-auto text-white border border-secondary border-opacity-25" style={{ maxHeight: '180px', backgroundColor: '#1e2024' }}>
                              <div className="row g-2">
                                 {availablePermissions.map(perm => (
                                    <div key={perm} className="col-12">
                                       <div className="form-check">
                                          <input 
                                             className="form-check-input bg-dark border-secondary" 
                                             type="checkbox" 
                                             name="permissions" 
                                             value={perm} 
                                             id={`new-perm-${perm}`} 
                                          />
                                          <label className="form-check-label small fw-bold" style={{ fontSize: '11px' }} htmlFor={`new-perm-${perm}`}>
                                             {perm.replace(/_/g, ' ')}
                                          </label>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           </div>
                       </div>
                       <button type="submit" className="btn-premium w-100 mt-2 py-3 text-uppercase tracking-widest fw-bold" style={{ fontSize: '11px' }}>Initialize Account</button>
                    </form>
                  </div>
               </div>
            </div>

            <div className="col-12 col-xl-8">
               <div className="card h-100 overflow-hidden">
                  <div className="card-header bg-transparent p-4 border-0 border-bottom border-white border-opacity-5">
                     <h5 className="fw-black mb-0 text-white">Active Operational Staff</h5>
                  </div>
                  <div className="table-responsive custom-scroll">
                     <table className="table table-hover align-middle mb-0 table-dark border-0">
                        <thead>
                           <tr className="text-muted small fw-bold text-uppercase tracking-wider border-bottom border-white border-opacity-5" style={{ fontSize: '10px' }}>
                              <th className="ps-4">User Details</th>
                              <th>Role</th>
                              <th className="pe-4 text-end">Management</th>
                           </tr>
                        </thead>
                        <tbody className="border-0">
                           {users.map(u => (
                              <tr key={u.id} className="border-bottom border-white border-opacity-5 transition-all">
                                 <td className="ps-4 py-4">
                                    <div className="d-flex align-items-center gap-3">
                                       <div className="p-2 bg-primary bg-opacity-10 rounded-circle text-primary text-center d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                          <Users size={18} />
                                       </div>
                                       <div>
                                          <p className="mb-0 fw-bold text-truncate text-white" style={{ maxWidth: '200px' }}>{u.name}</p>
                                          <small className="text-muted fw-medium small opacity-75">{u.email}</small>
                                       </div>
                                    </div>
                                 </td>
                                 <td>
                                    <span className={`badge rounded-sm px-2 py-1 text-uppercase fw-black ${
                                       u.role === 'ADMIN' ? 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-20' : 
                                       u.role === 'MANAGER' ? 'bg-warning bg-opacity-10 text-warning border border-warning border-opacity-20' : 
                                       'bg-primary bg-opacity-10 text-primary border border-primary border-opacity-20'
                                    }`} style={{ fontSize: '9px' }}>
                                       {u.role.toLowerCase().replace(/_/g, ' ')}
                                    </span>
                                 </td>
                                 <td className="pe-4 text-end">
                                    <div className="d-flex align-items-center justify-content-end gap-1">
                                       <button onClick={() => handleEditUser(u)} className="btn btn-sm btn-link text-white opacity-40 hover-opacity-100 p-2 transition-all"><Edit size={16} /></button>
                                       <button onClick={() => handleDeleteUser(u.id)} className="btn btn-sm btn-link text-danger opacity-40 hover-opacity-100 p-2 transition-all" disabled={u.email === user?.email}><Trash2 size={16} /></button>
                                    </div>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
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
          <div className="card overflow-hidden animate-fade-in">
             <div className="card-header bg-transparent p-4 border-0 d-flex justify-content-between align-items-center border-bottom border-white border-opacity-5">
                <div>
                    <h5 className="fw-black mb-0 text-white">System Pipeline Overview</h5>
                    <small className="text-muted fw-bold opacity-50 small text-uppercase tracking-wider" style={{ fontSize: '9px' }}>Global Operational Ledger</small>
                </div>
                <button className="btn-premium btn-sm px-4" onClick={() => fetchData()}>Live Sync</button>
             </div>
             <div className="card-body p-0">
                <LeadsTable
                  leads={filteredLeadsList}
                  theme="dark"
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

        {activeTab === 'attendance-logs' && (
          <AttendanceDashboard role="ADMIN" />
        )}

        {activeTab === 'attendance-settings' && (
          <AttendanceSettings />
        )}

        {activeTab === 'call-logs' && (
          <CallLogDashboard />
        )}

        {activeTab === 'revenue' && (
          <div className="d-flex flex-column gap-4 animate-fade-in h-100">
             <div className="d-flex align-items-center gap-2 mb-1">
                <div className="p-1.5 bg-primary bg-opacity-10 rounded text-primary">
                    <TrendingUp size={18} />
                </div>
                <h5 className="fw-black mb-0 text-white">Financial Transmission Ledger</h5>
            </div>
            <PaymentHistory role="ADMIN" />
          </div>
        )}
      </div>

      <UserEditModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        user={editingUser} 
        setUser={setEditingUser} 
        onSubmit={handleUpdateUser} 
        roles={[{id: 1, name: 'ADMIN'}, {id: 2, name: 'MANAGER'}, {id: 3, name: 'TEAM_LEADER'}, {id: 4, name: 'ASSOCIATE'}]} 
        permissions={availablePermissions}
        teamLeaders={users}
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
