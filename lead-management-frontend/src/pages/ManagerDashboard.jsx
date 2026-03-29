import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  UserPlus, 
  IndianRupee, 
  ShieldHalf,
  BarChart3,
  TrendingUp,
  Zap,
  Phone,
  LayoutDashboard,
  ClipboardList,
  GitBranch, 
  Upload,
  CheckCircle
} from 'lucide-react';
import { toast } from 'react-toastify';

// Internal Hooks & Services
import { useDashboardData } from './dashboard/hooks/useDashboardData';
import { useLeads } from './dashboard/hooks/useLeads';
import managerService from '../services/managerService';

// Modular Components
import FiltersBar from './dashboard/components/FiltersBar';
import StatsCards from './dashboard/components/StatsCards';
import LeadsTable from './dashboard/components/LeadsTable';
import TeamTree from './dashboard/components/TeamTree';
import TeamManagement from './dashboard/components/TeamManagement';
import UserEditModal from './dashboard/components/UserEditModal';
import BulkUploadModal from './dashboard/components/BulkUploadModal.jsx';
import PaymentHistory from '../components/PaymentHistory';
import RevenueTrendChart from './dashboard/components/RevenueTrendChart';
import StatCard from '../components/StatCard';
import DashboardLayout from '../components/layout/DashboardLayout';

const ManagerDashboard = () => {
    const { logout } = useAuth();
    const [theme] = useState(localStorage.getItem('theme') || 'dark');
    const [activeTab, setActiveTab] = useState(localStorage.getItem('mgr_activeTab') || 'stats');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterUnassigned, setFilterUnassigned] = useState(false);
    const [bulkAssignTlId, setBulkAssignTlId] = useState('');
    const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);

    const [filters, setFilters] = useState({
        from: new Date().toISOString().split('T')[0] + 'T00:00:00',
        to: new Date().toISOString().split('T')[0] + 'T23:59:59',
        userId: null
    });

    // Custom Hooks
    const { stats, performance, teamTree, trend, reload } = useDashboardData(filters);
    const { 
        leads, 
        loadLeads, 
        selectedLeadIds, 
        setSelectedLeadIds, 
        toggleSelection, 
        handleAssignLead, 
        handleBulkAssign 
    } = useLeads();

    // Secondary Data
    const [teamLeaders, setTeamLeaders] = useState([]);
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const fetchLookupData = async () => {
        try {
            const [tlRes, rolesRes, permRes] = await Promise.all([
                managerService.fetchTeamLeaders(),
                managerService.fetchRoles(),
                managerService.fetchPermissions()
            ]);
            setTeamLeaders(tlRes.data);
            setRoles(rolesRes.data);
            setPermissions(permRes.data);
        } catch (err) {
            toast.error('Lookup data sync failed');
        }
    };

    useEffect(() => {
        fetchLookupData();
    }, []);

    useEffect(() => {
        localStorage.setItem('mgr_activeTab', activeTab);
    }, [activeTab]);

    const handleCreateUser = async (formData) => {
        try {
            await managerService.createUser(formData);
            toast.success('Account created successfully');
            fetchLookupData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Creation failed');
        }
    };

    const handleDeleteUser = async (id) => {
        if (window.confirm('Delete this account permanently?')) {
            try {
                await managerService.deleteUser(id);
                toast.success('Account deleted');
                fetchLookupData();
            } catch (err) {
                toast.error('Deletion failed');
            }
        }
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        try {
            await managerService.updateUser(editingUser.id, editingUser);
            toast.success('Profile updated');
            setIsEditModalOpen(false);
            fetchLookupData();
        } catch (err) {
            toast.error('Update failed');
        }
    };

    const handleAssignSupervisor = async (assocId, supId) => {
        try {
            await managerService.assignSupervisor(assocId, supId);
            toast.success('Relationship updated');
            fetchLookupData();
        } catch (err) {
            toast.error('Assignment failed');
        }
    };

    const handleRecordCallOutcome = async (leadId, data) => {
        try {
            await managerService.recordCallOutcome(leadId, data);
            toast.success('Outcome synchronized');
            loadLeads();
            reload();
        } catch (err) {
            toast.error('Sync failed');
        }
    };

    const handleBulkUploadSuccess = () => {
        setIsBulkUploadModalOpen(false);
        loadLeads();
        reload();
    };

    const filteredLeadsList = leads.filter(l => {
        const matchesSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) || l.mobile.includes(searchTerm);
        const matchesUnassigned = filterUnassigned ? !l.assignedToId : true;
        return matchesSearch && matchesUnassigned;
    });

    return (
        <DashboardLayout
            title="Strategic Operations"
            subtitle="Manager Control Hub"
            activeTab={activeTab}
            onTabChange={setActiveTab}
            role="MANAGER"
        >
            <div className="animate-fade-in d-flex flex-column gap-4">
                {/* Strategic Overview Tab */}
                {activeTab === 'stats' && (
                  <div className="d-flex flex-column gap-4">
                    <div className="row g-4 mb-2">
                       <div className="col-12">
                          <FiltersBar 
                              filters={filters} 
                              onChange={setFilters} 
                              theme={theme} 
                          />
                       </div>
                    </div>

                    <div className="row g-4 animate-fade-in">
                        <div className="col-12 col-xl-8">
                            <div className="premium-card overflow-hidden h-100">
                               <div className="card-header bg-transparent border-0 p-4">
                                   <h5 className="fw-semibold mb-0 px-2 text-primary">Team Conversion History</h5>
                               </div>
                               <div className="card-body p-0">
                                   <RevenueTrendChart data={trend} theme={theme} />
                               </div>
                            </div>
                        </div>
                        <div className="col-12 col-xl-4">
                             <div className="d-flex flex-column gap-3 h-100">
                                <StatCard title="Success Leads" value={stats?.convertedToday || 0} sub="Paid/Partial" icon={<CheckCircle />} color="success" />
                                <StatCard title="Pending Revenue" value={stats?.pendingRevenue || 0} sub="Projected INR" icon={<IndianRupee />} color="info" />
                                <StatCard title="Lost (Today)" value={stats?.lostToday || 0} sub="Disinterest" icon={<Phone />} color="danger" />
                                <StatCard title="Revenue" value={stats?.totalPayments || 0} sub="Confirmed INR" icon={<IndianRupee />} color="primary" />
                             </div>
                        </div>

                        <div className="col-12 col-xl-12">
                             <div className="premium-card overflow-hidden">
                                <div className="card-header bg-transparent p-4 border-0 border-bottom border-white border-opacity-5">
                                    <h5 className="fw-semibold mb-0 text-white small">Team Assignment Matrix</h5>
                                </div>
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0 table-dark border-0">
                                        <thead className="bg-dark bg-opacity-50 border-0">
                                             <tr className="small fw-semibold text-muted">
                                                 <th className="ps-4">Staff Member</th>
                                                 <th className="text-center">Leads</th>
                                                 <th className="text-center">Converted</th>
                                                 <th className="text-center">Lost</th>
                                                 <th className="pe-4 text-end">Success %</th>
                                             </tr>
                                        </thead>
                                        <tbody>
                                             {performance.slice(0, 10).map(p => (
                                                 <tr key={p.userId} className="border-white border-opacity-5">
                                                     <td className="ps-4 fw-semibold text-primary">{p.username}</td>
                                                     <td className="text-center fw-semibold">{p.totalLeads}</td>
                                                     <td className="text-center text-success fw-semibold">{p.convertedLeads}</td>
                                                     <td className="text-center text-danger fw-semibold">{p.lostLeads}</td>
                                                     <td className="pe-4 text-end text-primary fw-semibold">
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

                {/* Staff Hierarchy Tab */}
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

                {/* Leads Pipeline Tab */}
                {activeTab === 'leads' && (
                    <div className="premium-card overflow-hidden animate-fade-in">
                        <div className="card-header bg-transparent p-4 border-0 d-flex justify-content-between align-items-center border-bottom border-white border-opacity-5">
                            <h5 className="fw-semibold mb-0 text-white small">My Pipeline Leads</h5>
                        </div>
                        <LeadsTable 
                            leads={filteredLeadsList}
                            theme={theme}
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            filterUnassigned={filterUnassigned}
                            setFilterUnassigned={setFilterUnassigned}
                            selectedLeadIds={selectedLeadIds}
                            toggleSelection={toggleSelection}
                            toggleSelectAll={() => setSelectedLeadIds(selectedLeadIds.length === filteredLeadsList.length ? [] : filteredLeadsList.map(l => l.id))}
                            bulkAssignTlId={bulkAssignTlId}
                            setBulkAssignTlId={setBulkAssignTlId}
                            handleBulkAssign={handleBulkAssign}
                            handleAssignLead={handleAssignLead}
                            onRecordCallOutcome={handleRecordCallOutcome}
                            teamLeaders={teamLeaders.filter(u => u.role === 'TEAM_LEADER')} 
                        />
                    </div>
                )}

                {activeTab === 'ingestion' && (
                  <div className="animate-fade-in h-100">
                    <BulkUploadModal 
                      isOpen={true}
                      isInline={true}
                      onClose={() => setActiveTab('leads')}
                      onSuccess={handleBulkUploadSuccess}
                      teamLeaders={teamLeaders.filter(u => u.role === 'TEAM_LEADER')}
                    />
                  </div>
                )}

                {activeTab === 'users' && (
                    <div className="animate-fade-in mb-4">
                        <TeamManagement 
                            teamLeaders={teamLeaders}
                            roles={roles}
                            permissions={permissions}
                            theme={theme}
                            handleCreateUser={handleCreateUser}
                            handleDeleteUser={handleDeleteUser}
                            handleEditUser={(u) => { setEditingUser(u); setIsEditModalOpen(true); }}
                            handleAssignSupervisor={handleAssignSupervisor}
                            setSelectedPerfUserId={(id) => setFilters({...filters, userId: id})}
                            setActiveTab={setActiveTab}
                        />
                    </div>
                )}

                {activeTab === 'payments' && (
                    <div className="animate-fade-in d-flex flex-column gap-4">
                        <div className="premium-card overflow-hidden mb-4">
                            <div className="card-header bg-transparent p-4 border-0 d-flex justify-content-between align-items-center border-bottom border-white border-opacity-5">
                                <h5 className="fw-semibold mb-0 text-white small">Associate Performance Snapshot</h5>
                                {filters.userId && (
                                    <button className="btn btn-primary btn-sm rounded-pill px-4" onClick={() => setFilters({...filters, userId: null})}>
                                        Reset Context
                                    </button>
                                )}
                            </div>
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0 text-white border-0">
                                    <thead className="table-dark">
                                         <tr className="text-uppercase small fw-bold text-muted">
                                             <th className="ps-4">Staff Member</th>
                                             <th className="text-center">Leads</th>
                                             <th className="text-center">Converted</th>
                                             <th className="text-center">Lost</th>
                                             <th className="pe-4 text-end">Conversion %</th>
                                         </tr>
                                    </thead>
                                    <tbody>
                                         {performance.filter(p => !filters.userId || p.userId === filters.userId).map(p => (
                                             <tr key={p.userId} className="border-white border-opacity-5">
                                                 <td className="ps-4 fw-bold text-primary">{p.username}</td>
                                                 <td className="text-center fw-bold">{p.totalLeads}</td>
                                                 <td className="text-center text-success fw-bold">{p.convertedLeads}</td>
                                                 <td className="text-center text-danger fw-bold">{p.lostLeads}</td>
                                                 <td className="pe-4 text-end text-primary fw-bold">
                                                     {p.totalLeads > 0 ? ((p.convertedLeads / p.totalLeads) * 100).toFixed(1) : 0}%
                                                 </td>
                                             </tr>
                                         ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <PaymentHistory role="MANAGER" />
                    </div>
                )}
            </div>

            {isEditModalOpen && (
                <UserEditModal 
                    isOpen={isEditModalOpen} 
                    onClose={() => setIsEditModalOpen(false)} 
                    user={editingUser} 
                    setUser={setEditingUser} 
                    onSubmit={handleUpdateUser} 
                    roles={roles} 
                    permissions={permissions}
                    teamLeaders={teamLeaders}
                />
            )}

            {isBulkUploadModalOpen && (
                <BulkUploadModal 
                    isOpen={isBulkUploadModalOpen}
                    onClose={() => setIsBulkUploadModalOpen(false)}
                    onSuccess={handleBulkUploadSuccess}
                    teamLeaders={teamLeaders}
                />
            )}
        </DashboardLayout>
    );
};

export default ManagerDashboard;
