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
import PaymentHistory from '../components/PaymentHistory';
import RevenueTrendChart from './dashboard/components/RevenueTrendChart';
import StatCard from '../components/StatCard';
import DashboardLayout from '../components/layout/DashboardLayout';
import AttendanceDashboard from '../components/pages/AttendanceDashboard';
import CallLogDashboard from './dashboard/components/CallLogDashboard';
import CallAnalyticsGrid from './dashboard/components/CallAnalyticsGrid';
import InvoiceModal from './dashboard/components/InvoiceModal';
import paymentService from '../services/paymentService';
import TaskBoard from '../components/TaskBoard';
import LeadForm from '../components/LeadForm';
import BulkUploadModal from './dashboard/components/BulkUploadModal';

import MetricCommandCenter from './dashboard/components/MetricCommandCenter';
import TicketManager from '../components/TicketManager';

const ManagerDashboard = () => {
    const { user, logout } = useAuth();
    const { isDarkMode } = useTheme();
    const theme = isDarkMode ? 'dark' : 'light';
    const [activeTab, setActiveTab] = useState(localStorage.getItem('mgr_activeTab') || 'overview');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterUnassigned, setFilterUnassigned] = useState(false);
    const [bulkAssignTlId, setBulkAssignTlId] = useState('');


    // Invoice state
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [selectedInvoiceData, setSelectedInvoiceData] = useState(null);

    const [filters, setFilters] = useState({
        from: new Date().toISOString().split('T')[0] + 'T00:00:00',
        to: new Date().toISOString().split('T')[0] + 'T23:59:59',
        userId: null
    });

    // Custom Hooks
    const { stats, performance, teamTree, trend, callStats, loading, reload } = useDashboardData(filters);
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
            const tlData = Array.isArray(tlRes.data) ? tlRes.data : (tlRes.data?.data || []);
            // Add current manager for self-assignment capability
            const selfManager = { id: user.id, name: `${user.name} (Self)`, role: user.role };
            setTeamLeaders([selfManager, ...tlData]);
            
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
        // Auto-scroll to top when drilling into a specific user's data
        if (filters.userId) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [filters.userId]);

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

    const handleAddLead = async (leadData) => {
        try {
            await managerService.addLead(leadData);
            toast.success('Lead added to nodal pipeline');
            loadLeads();
            return true;
        } catch (err) {
            toast.error(err.response?.data?.message || 'Lead ingestion failed: Constraint violation');
            return false;
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


    const filteredLeadsList = leads.filter(l => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = 
            (l.name && l.name.toLowerCase().includes(term)) || 
            (l.mobile && l.mobile.includes(searchTerm)) ||
            (l.email && l.email.toLowerCase().includes(term));
        const matchesUnassigned = filterUnassigned ? !l.assignedToId : true;
        return matchesSearch && matchesUnassigned;
    });

    return (
        <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab} role="MANAGER">
            <div className="animate-fade-in d-flex flex-column gap-4">
                {activeTab === 'my-stats' && (
                  <div className="d-flex flex-column gap-3 animate-fade-in">
                    <div className="px-1">
                       <h5 className="fw-black text-main mb-1 text-uppercase tracking-widest small">Personal Command Center</h5>
                       <p className="text-muted small fw-bold opacity-50 mb-0" style={{ fontSize: '9px' }}>VIEWING INDIVIDUAL OPERATIONAL PERFORMANCE</p>
                    </div>
                    <MetricCommandCenter 
                       stats={{...stats, performance: performance.filter(p => p.userId === user.id)}} 
                       role={user.role} 
                       filters={{...filters, userId: user.id, currentUserId: user.id}} 
                       onNavigate={setActiveTab} 
                    />
                  </div>
                )}
                {activeTab === 'overview' && (
                  <div className="d-flex flex-column gap-3">
                    {filters.userId && (
                      <div className="d-flex align-items-center justify-content-between p-3 bg-primary bg-opacity-10 border border-primary border-opacity-20 rounded-4 animate-slide-in mb-1 shadow-glow">
                        <div className="d-flex align-items-center gap-3">
                          <div className="p-3 bg-primary bg-opacity-20 rounded-circle text-primary border border-primary border-opacity-30">
                            <TrendingUp size={24} />
                          </div>
                          <div>
                            <h4 className="fw-black mb-0 text-main text-uppercase tracking-widest">Operational Deep-Dive</h4>
                            <p className="text-muted small mb-0 fw-bold opacity-75">Analyzing specialized focus data for the selected team node</p>
                          </div>
                        </div>
                        <button 
                          className="ui-btn ui-btn-outline btn-sm px-4 rounded-pill border-primary border-opacity-30 fw-black text-uppercase tracking-wider shadow-none"
                          onClick={() => setFilters({...filters, userId: null})}
                          style={{fontSize: '11px'}}
                        >
                          ← GLOBAL VIEW
                        </button>
                      </div>
                    )}
                    <div className="mb-2">
                      <MetricCommandCenter stats={{...stats, performance}} role="MANAGER" filters={filters} onNavigate={setActiveTab} />
                    </div>
                    <FiltersBar 
                      filters={{...filters, currentUserId: user?.id}} 
                      onChange={setFilters} 
                      onSync={reload} 
                      users={teamLeaders}
                      role="MANAGER"
                    />
                    <div className="row g-4 animate-fade-in">
                        <div className="col-12 col-xl-8">
                            <Card title="Team Conversion History" subtitle="Sales Performance Velocity" className="h-100">
                                <div className="py-2" style={{ height: '360px' }}>
                                    <RevenueTrendChart data={trend} theme={theme} />
                                </div>
                            </Card>
                        </div>
                        <div className="col-12 col-xl-4">
                             <div className="row g-3">
                                <div className="col-12">
                                    <StatCard title="Total Managed" value={stats?.totalGlobalLeads || 0} sub="Global Operational Scope" icon={<Users />} color="primary" />
                                </div>
                                <div className="col-12 col-sm-6 col-xl-6">
                                    <StatCard title="Total Success" value={stats?.leadStats?.SUCCESS || stats?.leadStats?.PAID || 0} sub="All Time Converted" icon={<CheckCircle />} color="success" />
                                </div>
                                <div className="col-12 col-sm-6 col-xl-6">
                                    <StatCard title="Revenue" value={stats?.totalPayments || 0} sub="Today Confirmed" icon={<IndianRupee />} color="primary" unit="Trans" />
                                </div>
                                <div className="col-12 col-sm-6 col-xl-6">
                                    <StatCard title="Lost (Today)" value={stats?.lostToday || 0} sub="Today Off-Pitch" icon={<Phone />} color="danger" />
                                </div>
                                <div className="col-12 col-sm-6 col-xl-6">
                                    <StatCard title="Pending Rev" value={stats?.pendingRevenue || 0} sub="Team Projected" icon={<IndianRupee />} color="info" unit="Trans" />
                                </div>
                             </div>
                        </div>
                        <div className="col-12 text-main">
                             <Card title="Operational Performance Snapshot" subtitle="Global User Efficiency Snapshot">
                                <Table 
                                    headers={['Staff Node', 'Designation', 'Load', 'Success', 'Risk', 'Sync Rate']}
                                    data={performance.slice(0, 10)}
                                    renderRow={(p) => (
                                        <>
                                            <td 
                                                className="ps-4 fw-bold text-primary cursor-pointer hover-scale transition-all" 
                                                onClick={() => {
                                                    setFilters({...filters, userId: p.userId});
                                                    toast.info(`Focusing on ${p.username}'s operational metrics`);
                                                }}
                                            >
                                                <div className="d-flex align-items-center gap-2">
                                                    <TrendingUp size={10} className="text-primary" />
                                                    {p.username}
                                                </div>
                                            </td>
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
                  <div className="animate-fade-in d-flex flex-column gap-4">
                    <div className="row">
                      <div className="col-12">
                        <div className="premium-card overflow-hidden animate-fade-in shadow-lg h-100">
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
                              teamLeaders={teamLeaders} 
                          />
                        </div>
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

                {activeTab === 'call-logs' && (
                    <CallLogDashboard />
                )}

                {activeTab === 'tasks' && (
                  <div className="animate-fade-in">
                    <TaskBoard
                      leads={leads}
                      theme={theme}
                      onUpdateStatus={() => loadLeads()} 
                      fetchLeads={loadLeads}
                    />
                  </div>
                )}

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
                            assignees={teamLeaders}
                            onSuccess={loadLeads} 
                         />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'tickets' && (
                  <div className="animate-fade-in">
                     <TicketManager role="MANAGER" />
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


            <InvoiceModal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} invoiceData={selectedInvoiceData} />
        </DashboardLayout>
    );
};

export default ManagerDashboard;
