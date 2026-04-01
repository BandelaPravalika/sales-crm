import React, { useState, useEffect } from 'react';
import { Button, Card, Input, Table } from '../components/common/Components';
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
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
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
import AttendanceDashboard from '../components/pages/AttendanceDashboard';
import CallLogDashboard from './dashboard/components/CallLogDashboard';
import InvoiceModal from './dashboard/components/InvoiceModal';
import paymentService from '../services/paymentService';

const ManagerDashboard = () => {
    const { logout } = useAuth();
    const { isDarkMode } = useTheme();
    const theme = isDarkMode ? 'dark' : 'light';
    const [activeTab, setActiveTab] = useState(localStorage.getItem('mgr_activeTab') || 'overview');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterUnassigned, setFilterUnassigned] = useState(false);
    const [bulkAssignTlId, setBulkAssignTlId] = useState('');
    const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);

    // Invoice state
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [selectedInvoiceData, setSelectedInvoiceData] = useState(null);

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
    const [shifts, setShifts] = useState([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const fetchLookupData = async () => {
        try {
            const [tlRes, rolesRes, permRes, shiftRes] = await Promise.all([
                managerService.fetchTeamLeaders(),
                managerService.fetchRoles(),
                managerService.fetchPermissions(),
                managerService.fetchShifts()
            ]);
            setTeamLeaders(Array.isArray(tlRes.data) ? tlRes.data : (tlRes.data?.data || []));
            setRoles(Array.isArray(rolesRes.data) ? rolesRes.data : (rolesRes.data?.data || []));
            setPermissions(Array.isArray(permRes.data) ? permRes.data : (permRes.data?.data || []));
            setShifts(Array.isArray(shiftRes.data) ? shiftRes.data : (shiftRes.data?.data || []));
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
            
            // Close first
            setIsEditModalOpen(false);
            
            // Delay refresh
            setTimeout(() => {
                fetchLookupData();
            }, 300);
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

    const handleViewInvoice = async (lead) => {
        try {
            toast.info('Retrieving official invoice document...');
            const res = await paymentService.generateInvoice(lead.id);
            setSelectedInvoiceData(res.data);
            setIsInvoiceModalOpen(true);
        } catch (err) {
            toast.error('Failed to retrieve invoice - no confirmed payment found');
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
        <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab} role="MANAGER">
            <div className="animate-fade-in d-flex flex-column gap-4">
                {activeTab === 'overview' && (
                  <div className="d-flex flex-column gap-4">
                    <FiltersBar filters={filters} onChange={setFilters} onSync={reload} />
                    {filters.userId && (
                      <div className="d-flex align-items-center gap-2 mt-3 p-2 bg-primary bg-opacity-10 border border-primary border-opacity-20 rounded-3 animate-fade-in w-fit">
                        <span className="label text-primary" style={{fontSize: '10px', textTransform: 'uppercase'}}>Focus Node:</span>
                        <span className="value text-main me-2 small fw-bold">Individual Performance Profile</span>
                        <button 
                          className="btn btn-sm btn-link p-0 text-primary fw-bold text-decoration-none border-0 shadow-none hover-scale transition-all"
                          onClick={() => setFilters({...filters, userId: null})}
                          style={{fontSize: '9px'}}
                        >
                          [ CLEAR FOCUS ]
                        </button>
                      </div>
                    )}
                    <div className="row g-4 animate-fade-in">
                        <div className="col-12 col-xl-8">
                            <Card title="Team Conversion History" subtitle="Sales Performance Velocity" style={{ height: '100%' }}>
                                <RevenueTrendChart data={trend} theme={theme} />
                            </Card>
                        </div>
                        <div className="col-12 col-xl-4">
                             <div className="d-flex flex-column gap-3 h-100">
                                <StatCard title="Success Leads" value={stats?.convertedToday || 0} sub="Targets Synchronized" icon={<CheckCircle />} color="success" />
                                <StatCard title="Revenue (INR)" value={stats?.totalPayments || 0} sub="Confirmed Transmission" icon={<IndianRupee />} color="primary" />
                                <StatCard title="Lost (Today)" value={stats?.lostToday || 0} sub="Off-Pitch Segments" icon={<Phone />} color="danger" />
                                <StatCard title="Pending Rev" value={stats?.pendingRevenue || 0} sub="Projected Margin" icon={<IndianRupee />} color="info" />
                             </div>
                        </div>
                        <div className="col-12 text-main">
                             <Card title="Operational Performance Snapshot" subtitle="Global User Efficiency Snapshot">
                                <Table 
                                    headers={['Staff Node', 'Designation', 'Load', 'Success', 'Risk', 'Sync Rate']}
                                    data={performance.slice(0, 10)}
                                    renderRow={(p) => (
                                        <>
                                            <td className="ps-4 fw-bold text-primary cursor-pointer" onClick={() => setFilters({...filters, userId: p.userId})}>{p.username}</td>
                                            <td className="text-center fw-bold small text-muted"><span className="ui-badge bg-surface">{p.role}</span></td>
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

                {activeTab === 'hierarchy' && (
                    <div className="animate-fade-in row">
                        <div className="col-12">
                            <TeamTree data={teamTree} onFocus={(id) => setFilters({...filters, userId: id})} currentFocusId={filters.userId} />
                        </div>
                    </div>
                )}

                {activeTab === 'pipeline' && (
                    <div className="premium-card overflow-hidden animate-fade-in shadow-lg">
                        <div className="card-header bg-transparent p-4 border-0 d-flex justify-content-between align-items-center border-bottom border-white border-opacity-5">
                            <div>
                                <h5 className="fw-black mb-0 text-main text-uppercase tracking-widest small">Global Pipeline Ledger</h5>
                                <p className="text-muted small mb-0 fw-bold opacity-50" style={{fontSize: '9px'}}>IDENTIFICATION & ASSIGNMENT NODE</p>
                            </div>
                            <button className="ui-btn ui-btn-primary btn-sm px-4 rounded-pill shadow-glow" onClick={() => loadLeads()}>SYNC DATA</button>
                        </div>
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
                            handleBulkAssign={handleBulkAssign}
                            handleAssignLead={handleAssignLead}
                            onRecordCallOutcome={handleRecordCallOutcome}
                            onViewInvoice={handleViewInvoice}
                            teamLeaders={teamLeaders.filter(u => u.role === 'TEAM_LEADER' || u.role === 'ASSOCIATE')} 
                        />
                    </div>
                )}

                {activeTab === 'ingestion' && (
                  <div className="animate-fade-in d-flex flex-column gap-4">
                    <BulkUploadModal 
                      isOpen={true}
                      isInline={true}
                      onClose={() => setActiveTab('pipeline')}
                      onSuccess={handleBulkUploadSuccess}
                      assignees={teamLeaders.filter(u => u.role === 'ASSOCIATE')}
                    />

                    {/* Unassigned Leads Pool Section */}
                    <div className="premium-card overflow-hidden shadow-lg border-0 mt-4">
                       <div className="card-header bg-transparent p-4 border-0 border-bottom border-white border-opacity-5">
                          <h6 className="fw-black mb-0 text-main tracking-widest small">UNASSIGNED LEADS POOL</h6>
                          <small className="text-muted fw-bold opacity-50" style={{ fontSize: '8px' }}>ORPHAN DATA NODES AWAITING ASSIGNMENT</small>
                       </div>
                       <div className="card-body p-0">
                          <LeadsTable 
                            leads={leads.filter(l => !l.assignedToId)}
                            searchTerm=""
                            setSearchTerm={() => {}}
                            filterUnassigned={true}
                            setFilterUnassigned={() => {}}
                            selectedLeadIds={selectedLeadIds}
                            toggleSelection={toggleSelection}
                            toggleSelectAll={() => setSelectedLeadIds(selectedLeadIds.length === leads.filter(l => !l.assignedToId).length ? [] : leads.filter(l => !l.assignedToId).map(l => l.id))}
                            bulkAssignTlId={bulkAssignTlId}
                            setBulkAssignTlId={setBulkAssignTlId}
                            handleBulkAssign={handleBulkAssign}
                            handleAssignLead={handleAssignLead}
                            teamLeaders={teamLeaders}
                            showFilters={false}
                          />
                       </div>
                    </div>
                  </div>
                )}

                {activeTab === 'users' && (
                    <div className="animate-fade-in mb-4">
                        <TeamManagement 
                            teamLeaders={teamLeaders}
                            roles={roles}
                            permissions={permissions}
                            handleCreateUser={handleCreateUser}
                            handleDeleteUser={handleDeleteUser}
                            handleEditUser={(u) => { 
                                // Deep clone for stability
                                setEditingUser(JSON.parse(JSON.stringify(u))); 
                                setIsEditModalOpen(true); 
                            }}
                            handleAssignSupervisor={handleAssignSupervisor}
                            setSelectedPerfUserId={(id) => setFilters({...filters, userId: id})}
                            setActiveTab={setActiveTab}
                        />
                    </div>
                )}

                {activeTab === 'attendance-logs' && (
                  <div className="animate-fade-in">
                    <AttendanceDashboard role="MANAGER" />
                  </div>
                )}

                {activeTab === 'call-logs' && <CallLogDashboard />}

                {activeTab === 'payments' && (
                    <div className="d-flex flex-column gap-4 animate-fade-in">
                        <div className="d-flex align-items-center gap-3 mb-1">
                            <div className="p-2 bg-primary bg-opacity-10 rounded text-primary border border-primary border-opacity-10"><IndianRupee size={18} /></div>
                            <div>
                                <h5 className="fw-black mb-0 text-main text-uppercase tracking-widest small">Financial Transmission Ledger</h5>
                                <p className="text-muted small mb-0 fw-bold opacity-50" style={{fontSize: '9px'}}>AGGREGATED TRANSACTIONAL ARCHIVE</p>
                            </div>
                        </div>
                        <PaymentHistory role="MANAGER" />
                    </div>
                )}
            </div>

            {isEditModalOpen && (
                <UserEditModal 
                    key={editingUser?.id}
                    isOpen={isEditModalOpen} 
                    onClose={() => setIsEditModalOpen(false)} 
                    user={editingUser} 
                    setUser={setEditingUser} 
                    onSubmit={handleUpdateUser} 
                    roles={roles} 
                    permissions={permissions}
                    teamLeaders={teamLeaders}
                    shifts={shifts}
                />
            )}

            {isBulkUploadModalOpen && (
                <BulkUploadModal 
                    isOpen={isBulkUploadModalOpen}
                    onClose={() => setIsBulkUploadModalOpen(false)}
                    onSuccess={handleBulkUploadSuccess}
                    assignees={teamLeaders}
                />
            )}

            <InvoiceModal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} invoiceData={selectedInvoiceData} />
        </DashboardLayout>
    );
};

export default ManagerDashboard;
