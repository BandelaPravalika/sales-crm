import React, { useState, useEffect } from 'react';
import adminService from '../../../services/adminService';
import tlService from '../../../services/tlService';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { Phone, PhoneOutgoing, Clock, User, Calendar, Search, Play, FileText, Upload } from 'lucide-react';
import BulkUploadCallModal from './BulkUploadCallModal';
import { toast } from 'react-toastify';

const CallLogDashboard = () => {
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const role = user?.role;
    const [logs, setLogs] = useState([]);
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [playingId, setPlayingId] = useState(null);
    const [audioObj, setAudioObj] = useState(null);
    
    const [filters, setFilters] = useState({
        date: new Date().toISOString().split('T')[0],
        userId: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const activeFilters = Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => v !== '' && v !== null)
            );

            let logsCall, usersCall, statsCall;

            if (role === 'ADMIN') {
                logsCall = adminService.fetchCallLogsAdmin(activeFilters);
                usersCall = adminService.fetchUsers();
                statsCall = adminService.fetchGlobalCallStats();
            } else if (role === 'TEAM_LEADER') {
                // Assuming tlService has similar methods or fallback
                logsCall = tlService.fetchCallLogs ? tlService.fetchCallLogs(activeFilters) : adminService.fetchCallLogsAdmin(activeFilters);
                usersCall = tlService.fetchSubordinates();
                statsCall = tlService.fetchGlobalCallStats ? tlService.fetchGlobalCallStats() : adminService.fetchGlobalCallStats();
            } else {
                logsCall = adminService.fetchCallLogsAdmin(activeFilters);
                usersCall = adminService.fetchUsers();
                statsCall = adminService.fetchGlobalCallStats();
            }

            const [logsRes, usersRes, statsRes] = await Promise.all([logsCall, usersCall, statsCall]);

            const logsPayload = logsRes.data;
            setLogs(Array.isArray(logsPayload) ? logsPayload : (logsPayload?.data || []));

            const usersPayload = usersRes.data;
            setUsers(usersPayload?.content || (Array.isArray(usersPayload) ? usersPayload : []));

            const statsPayload = statsRes.data;
            setStats(statsPayload?.data || statsPayload || null);
        } catch (err) {
            toast.error('Failed to sync call logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filters]);

    const formatDuration = (seconds) => {
        if (!seconds) return '0s';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    };

    const toggleAudio = (id) => {
        if (playingId === id) {
            audioObj.pause();
            setPlayingId(null);
            setAudioObj(null);
        } else {
            if (audioObj) audioObj.pause();
            const token = localStorage.getItem('token');
            const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/call-records/${id}/audio?token=${token}`;
            const audio = new Audio(url);
            audio.play().catch(err => toast.error("Could not play audio"));
            audio.onended = () => setPlayingId(null);
            setAudioObj(audio);
            setPlayingId(id);
        }
    };

    return (
        <div className="container-fluid p-0 animate-fade-in mt-2">
            <div className="mb-4 d-flex justify-content-between align-items-end">
               <div>
                  <h5 className="fw-black text-main text-uppercase mb-1 tracking-widest small">Communication Hub</h5>
                  <p className="text-muted small mb-0 fw-bold opacity-50" style={{ fontSize: '9px' }}>GLOBAL TEAM INTERACTION LEDGER</p>
               </div>
               <button 
                    className="ui-btn ui-btn-primary px-4 rounded-pill shadow-glow py-2"
                    onClick={() => setIsUploadModalOpen(true)}
                    style={{ fontSize: '11px' }}
                >
                    <Upload size={14} /> IMPORT LOGS
                </button>
            </div>

            {/* Premium Stat Cards */}
            <div className="row g-4 mb-4">
                <div className="col-12 col-md-4">
                    <div className="premium-card p-4 d-flex flex-row align-items-center gap-4 transition-all hover-lift">
                        <div className="p-3 bg-primary bg-opacity-10 text-primary rounded-4 shadow-sm border border-primary border-opacity-10">
                            <Phone size={24} />
                        </div>
                        <div>
                            <h6 className="text-muted small mb-1 fw-bold text-uppercase tracking-wider" style={{ fontSize: '9px' }}>Total Interactions</h6>
                            <h3 className="fw-black mb-0 text-main" style={{ letterSpacing: '-0.02em' }}>{stats?.totalCalls || 0}</h3>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-md-4">
                    <div className="premium-card p-4 d-flex flex-row align-items-center gap-4 transition-all hover-lift">
                        <div className="p-3 bg-success bg-opacity-10 text-success rounded-4 shadow-sm border border-success border-opacity-10">
                            <PhoneOutgoing size={24} />
                        </div>
                        <div>
                            <h6 className="text-muted small mb-1 fw-bold text-uppercase tracking-wider" style={{ fontSize: '9px' }}>Connected Contacts</h6>
                            <h3 className="fw-black mb-0 text-main" style={{ letterSpacing: '-0.02em' }}>{stats?.connectedCalls || 0}</h3>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-md-4">
                    <div className="premium-card p-4 d-flex flex-row align-items-center gap-4 transition-all hover-lift">
                        <div className="p-3 bg-info bg-opacity-10 text-info rounded-4 shadow-sm border border-info border-opacity-10">
                            <Clock size={24} />
                        </div>
                        <div>
                            <h6 className="text-muted small mb-1 fw-bold text-uppercase tracking-wider" style={{ fontSize: '9px' }}>Average Sync Path</h6>
                            <h3 className="fw-black mb-0 text-main" style={{ letterSpacing: '-0.02em' }}>{Math.round(stats?.avgDuration || 0)}s</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="premium-card overflow-hidden">
                <div className="card-header bg-transparent border-bottom border-white border-opacity-5 p-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                    <div className="d-flex align-items-center gap-2">
                        <div className="p-2 bg-surface rounded text-primary border border-white border-opacity-5">
                           <FileText size={18} />
                        </div>
                        <h6 className="fw-bold text-main mb-0 small text-uppercase tracking-wider">Interaction Archive</h6>
                    </div>
                    
                    <div className="d-flex flex-column flex-sm-row align-items-sm-center gap-3">
                        <div className="input-group input-group-sm rounded-pill shadow-sm overflow-hidden border border-white border-opacity-10" style={{ width: 'auto' }}>
                            <span className="input-group-text bg-surface border-0 text-muted ps-3"><Calendar size={14} /></span>
                            <input 
                                type="date" 
                                className="form-control bg-surface border-0 shadow-none text-main fw-bold px-2 py-2" 
                                value={filters.date} 
                                onChange={e => setFilters({...filters, date: e.target.value})}
                                style={{ fontSize: '11px' }}
                            />
                        </div>

                        <select 
                            className="form-select form-select-sm bg-surface border-white border-opacity-10 shadow-sm rounded-pill fw-bold text-main py-2 px-3"
                            style={{ fontSize: '11px', minWidth: '160px' }}
                            value={filters.userId} 
                            onChange={e => setFilters({...filters, userId: e.target.value})}
                        >
                            <option value="" className="text-dark">All Team Members</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id} className="text-dark">{u.name} ({u.role})</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="table-responsive p-0">
                    <table className="table table-hover align-middle mb-0 border-0 bg-transparent text-main">
                        <thead>
                            <tr className="border-bottom border-white border-opacity-5">
                                <th className="ps-4 py-3 text-muted small fw-black text-uppercase tracking-widest" style={{ fontSize: '9px' }}>Staff Identifier</th>
                                <th className="py-3 text-muted small fw-black text-uppercase tracking-widest" style={{ fontSize: '9px' }}>Operational Slot</th>
                                <th className="py-3 text-muted small fw-black text-uppercase tracking-widest" style={{ fontSize: '9px' }}>Channel</th>
                                <th className="py-3 text-muted small fw-black text-uppercase tracking-widest" style={{ fontSize: '9px' }}>Node / Contact</th>
                                <th className="py-3 text-muted small fw-black text-uppercase tracking-widest" style={{ fontSize: '9px' }}>Resolution</th>
                                <th className="py-3 text-muted small fw-black text-uppercase tracking-widest" style={{ fontSize: '9px' }}>Memo</th>
                                <th className="pe-4 py-3 text-end text-muted small fw-black text-uppercase tracking-widest" style={{ fontSize: '9px' }}>Media</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => {
                                const isConnected = log.status === 'CONNECTED' || log.status === 'PAID';
                                const isFailed = log.status === 'NOT_INTERESTED' || log.status === 'PAYMENT_FAILED';

                                return (
                                    <tr key={log.id} className="border-bottom border-white border-opacity-5 transition-all">
                                        <td className="ps-4 py-3">
                                            <div className="d-flex align-items-center gap-2">
                                                <div className="p-1.5 bg-surface rounded-circle text-muted border border-white border-opacity-5">
                                                    <User size={12} />
                                                </div>
                                                <span className="fw-bold text-main" style={{ fontSize: '13px' }}>{log.user?.name || "Unknown"}</span>
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <div className="d-flex flex-column">
                                                <span className="fw-bold text-main" style={{ fontSize: '12px' }}>{new Date(log.startTime).toLocaleDateString()}</span>
                                                <span className="text-muted fw-bold opacity-50" style={{ fontSize: '9px' }}>{new Date(log.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <span className={`ui-badge rounded-pill fw-black ${log.callType === 'OUTGOING' ? 'bg-primary bg-opacity-10 text-primary border-primary border-opacity-20' : 'bg-info bg-opacity-10 text-info border-info border-opacity-20'}`} style={{ fontSize: '8px' }}>
                                                {log.callType}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            <div className="d-flex flex-column">
                                                <span className="fw-bold text-main" style={{ fontSize: '13px' }}>{log.lead?.name || "Manual Log"}</span>
                                                <span className="text-muted font-monospace opacity-50" style={{ fontSize: '10px' }}>{log.phoneNumber}</span>
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <div className="d-flex flex-column gap-1">
                                                <span className={`badge rounded-1 px-2 py-1 text-uppercase fw-black ${isConnected ? 'bg-success bg-opacity-10 text-success' : isFailed ? 'bg-danger bg-opacity-10 text-danger' : 'bg-warning bg-opacity-10 text-warning'}`} style={{ fontSize: '8px', width: 'fit-content' }}>
                                                    {log.status.replace(/_/g, ' ')}
                                                </span>
                                                <span className="text-muted d-flex align-items-center gap-1 fw-bold" style={{ fontSize: '9px' }}><Clock size={10} /> {formatDuration(log.duration)}</span>
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <div className="text-muted small fw-medium" style={{ maxWidth: '200px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {log.note || '--'}
                                            </div>
                                        </td>
                                        <td className="pe-4 py-3 text-end">
                                            {log.recordingPath ? (
                                                <button 
                                                    className={`ui-btn btn-sm rounded-pill px-3 fw-black shadow-glow d-flex align-items-center gap-1 ms-auto ${
                                                        playingId === log.id ? 'ui-btn-primary' : 'ui-btn-secondary'
                                                    }`}
                                                    onClick={() => toggleAudio(log.id)}
                                                    style={{ fontSize: '10px' }}
                                                >
                                                    {playingId === log.id ? (
                                                        <>
                                                            <div className="spinner-grow spinner-grow-sm" role="status" style={{ width: '8px', height: '8px' }}></div> LIVE
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Play size={10} fill="currentColor" /> ARCHIVE
                                                        </>
                                                    )}
                                                </button>
                                            ) : (
                                                <span className="text-muted fw-black opacity-25" style={{ fontSize: '9px' }}>NO MEDIA</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {logs.length === 0 && !loading && (
                        <div className="text-center py-5 d-flex flex-column align-items-center opacity-20">
                            <div className="mb-2 p-4 bg-surface rounded-circle">
                               <Search size={32} className="text-muted" />
                            </div>
                            <p className="fw-black text-muted text-uppercase mb-0 tracking-widest small">DATA TRANSMISSION NULL</p>
                        </div>
                    )}
                </div>
            </div>

            {isUploadModalOpen && (
                <BulkUploadCallModal onClose={() => setIsUploadModalOpen(false)} onUploadSuccess={() => { setIsUploadModalOpen(false); fetchData(); }} />
            )}
        </div>
    );
};

export default CallLogDashboard;
