import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import adminService from '../services/adminService';
import PaymentHistory from '../components/PaymentHistory';
import StatCard from '../components/StatCard';
import LeadTable from '../components/LeadTable';
import RevenueTrendChart from './dashboard/components/RevenueTrendChart';
import DashboardLayout from '../components/layout/DashboardLayout';
import UserEditModal from './dashboard/components/UserEditModal';
import { 
  Settings, 
  UserPlus, 
  Users, 
  LogOut, 
  LayoutDashboard, 
  BarChart3, 
  ShieldCheck, 
  ClipboardList, 
  IndianRupee, 
  Zap, 
  Phone,
  Edit,
  Trash2,
  CheckCircle,
  TrendingUp,
  Layers
} from 'lucide-react';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [leads, setLeads] = useState([]);

  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0] + 'T00:00:00',
    end: new Date().toISOString().split('T')[0] + 'T23:59:59'
  });
  const [performance, setPerformance] = useState([]);
  const [trendData, setTrendData] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const statsFilters = { start: dateRange.start, end: dateRange.end };
      const trendFilters = { from: dateRange.start.split('T')[0], to: dateRange.end.split('T')[0] };

      const [statsRes, perfRes, trendRes, usersRes, permsRes, leadsRes] = await Promise.all([
        adminService.fetchDashboardStats(statsFilters),
        adminService.fetchMemberPerformance(statsFilters),
        adminService.fetchTrendData(trendFilters),
        adminService.fetchUsers(),
        adminService.fetchPermissions(),
        adminService.fetchLeads()
      ]);

      setStats(statsRes.data);
      setPerformance(perfRes.data);
      setTrendData(trendRes.data);
      setUsers(usersRes.data);
      setAvailablePermissions(permsRes.data);
      setLeads(leadsRes.data);
    } catch (err) {
      toast.error('System synchronization failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

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

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      role="ADMIN"
    >
      <div className="animate-fade-in">
        {activeTab === 'overview' && (
          <>
            <div className="d-flex flex-column flex-md-row justify-content-end align-items-md-center mb-4 gap-3">
              <div className="d-flex gap-2 align-items-center bg-dark bg-opacity-50 p-2 rounded-pill px-3 border border-white border-opacity-5 shadow-sm">
                <span className="text-muted small me-1">Range:</span>
                <input 
                  type="date" 
                  className="form-control form-control-sm border-0 bg-transparent text-white shadow-none px-2"
                  value={dateRange.start.split('T')[0]}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value + 'T00:00:00'})}
                  style={{ width: '130px', fontSize: '11px', colorScheme: 'dark' }}
                />
                <span className="text-muted opacity-25">|</span>
                <input 
                  type="date" 
                  className="form-control form-control-sm border-0 bg-transparent text-white shadow-none px-2"
                  value={dateRange.end.split('T')[0]}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value + 'T23:59:59'})}
                  style={{ width: '130px', fontSize: '11px', colorScheme: 'dark' }}
                />
              </div>
            </div>

            <div className="row g-4 mb-4">
              <div className="col-12 col-lg-8">
                <div className="card shadow-sm border-0 rounded-4 overflow-hidden h-100">
                  <div className="card-header bg-transparent border-0 p-4">
                     <h6 className="fw-semibold mb-0">Revenue Trajectory</h6>
                  </div>
                  <div className="card-body p-0">
                    <RevenueTrendChart data={trendData} theme={theme} />
                  </div>
                </div>
              </div>
              <div className="col-12 col-lg-4">
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <StatCard title="Total Managed" value={stats?.leadStats?.TOTAL || 0} sub="Managed Records" icon={<Users />} color="primary" />
                  </div>
                  <div className="col-12 col-md-6">
                    <StatCard title="Success Leads" value={stats?.convertedToday || 0} sub="Paid/Partial" icon={<CheckCircle />} color="success" />
                  </div>
                  <div className="col-12 col-md-6">
                    <StatCard title="Lost (Today)" value={stats?.lostToday || 0} sub="Disinterest" icon={<Phone />} color="danger" />
                  </div>
                  <div className="col-12 col-md-6">
                    <StatCard title="Pending Value" value={stats?.pendingRevenue || 0} sub="INR Projected" icon={<IndianRupee />} color="info" />
                  </div>
                  <div className="col-12 col-md-6">
                    <StatCard title="Revenue" value={stats?.totalPayments || 0} sub="INR Confirmed" icon={<IndianRupee />} color="success" />
                  </div>
                </div>
              </div>
            </div>

            <div className="card shadow-sm border-0 rounded-4 overflow-hidden mb-5 bg-secondary bg-opacity-5">
              <div className="card-header bg-transparent p-4 border-0">
                 <h5 className="fw-semibold mb-0 text-white">Operational Efficiency Report</h5>
              </div>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-dark">
                    <tr className="text-muted small fw-semibold">
                      <th className="ps-4">Staff Node</th>
                      <th>Role</th>
                      <th className="text-center">Leads</th>
                      <th className="text-center">Interested</th>
                      <th className="text-center">Converted</th>
                      <th className="pe-4 text-end">Lost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performance.map((p) => (
                      <tr key={p.userId}>
                        <td className="ps-4 fw-semibold text-primary">{p.username}</td>
                        <td><span className="badge bg-secondary-subtle text-secondary small">{p.role}</span></td>
                        <td className="text-center fw-semibold">{p.totalLeads}</td>
                        <td className="text-center text-info fw-semibold">{p.interestedLeads || 0}</td>
                        <td className="text-center text-success fw-semibold">{p.convertedLeads || 0}</td>
                        <td className="pe-4 text-end text-danger fw-semibold">{p.lostLeads || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
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

        {activeTab === 'pipeline' && (
          <div className="card overflow-hidden animate-fade-in">
             <div className="card-header bg-transparent p-4 border-0 d-flex justify-content-between align-items-center border-bottom border-white border-opacity-5">
                <div>
                    <h5 className="fw-black mb-0 text-white">Macro Pipeline Explorer</h5>
                    <small className="text-muted fw-bold opacity-50 small text-uppercase tracking-wider" style={{ fontSize: '9px' }}>Consolidated Environment</small>
                </div>
                <button className="btn-premium btn-sm px-4" onClick={() => fetchData()}>Sync Live</button>
             </div>
             <div className="card-body p-0">
                <LeadTable 
                    leads={leads} 
                    role="ADMIN" 
                    showActions={false}
                    theme={theme}
                />
             </div>
          </div>
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
    </DashboardLayout>
  );
};

export default AdminDashboard;
