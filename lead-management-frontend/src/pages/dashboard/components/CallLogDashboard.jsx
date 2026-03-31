import React, { useState, useEffect } from 'react';
import adminService from '../../../services/adminService';
import { Phone, PhoneOutgoing, Clock, User, Calendar, Search, Play, FileText, Upload } from 'lucide-react';
import BulkUploadCallModal from './BulkUploadCallModal';
import { toast } from 'react-toastify';

const CallLogDashboard = () => {
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

            const [logsRes, usersRes, statsRes] = await Promise.all([
                adminService.fetchCallLogsAdmin(activeFilters),
                adminService.fetchUsers(),
                adminService.fetchGlobalCallStats()
            ]);

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
        <div className="container-fluid p-0 animate-fade-in mt-4">
            <div className="mb-4">
               <p className="text-muted small mb-0">Global team interaction ledger and recording archive.</p>
            </div>

            {/* Premium Stat Cards */}
            <div className="row g-4 mb-5">
                <div className="col-12 col-md-4">
                    <div className="card shadow-sm border-0 rounded-4 p-4 d-flex flex-row align-items-center gap-4 transition-all hover-scale" style={{ backgroundColor: '#ffffff' }}>
                        <div className="p-3 bg-primary bg-opacity-10 text-primary rounded-4 shadow-sm">
                            <Phone size={24} />
                        </div>
                        <div>
                            <h6 className="text-muted small mb-1 fw-bold text-uppercase tracking-wider" style={{ fontSize: '10px' }}>Total Interactions</h6>
                            <h3 className="fw-black mb-0 text-dark" style={{ letterSpacing: '-0.02em' }}>{stats?.totalCalls || 0}</h3>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-md-4">
                    <div className="card shadow-sm border-0 rounded-4 p-4 d-flex flex-row align-items-center gap-4 transition-all hover-scale" style={{ backgroundColor: '#ffffff' }}>
                        <div className="p-3 bg-success bg-opacity-10 text-success rounded-4 shadow-sm">
                            <PhoneOutgoing size={24} />
                        </div>
                        <div>
                            <h6 className="text-muted small mb-1 fw-bold text-uppercase tracking-wider" style={{ fontSize: '10px' }}>Successful Contacts</h6>
                            <h3 className="fw-black mb-0 text-dark" style={{ letterSpacing: '-0.02em' }}>{stats?.connectedCalls || 0}</h3>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-md-4">
                    <div className="card shadow-sm border-0 rounded-4 p-4 d-flex flex-row align-items-center gap-4 transition-all hover-scale" style={{ backgroundColor: '#ffffff' }}>
                        <div className="p-3 bg-info bg-opacity-10 text-info rounded-4 shadow-sm">
                            <Clock size={24} />
                        </div>
                        <div>
                            <h6 className="text-muted small mb-1 fw-bold text-uppercase tracking-wider" style={{ fontSize: '10px' }}>Average Duration</h6>
                            <h3 className="fw-black mb-0 text-dark" style={{ letterSpacing: '-0.02em' }}>{Math.round(stats?.avgDuration || 0)}s</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="card shadow-sm border-0 rounded-4 overflow-hidden mb-5" style={{ backgroundColor: '#ffffff' }}>
                <div className="card-header bg-white border-bottom p-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                    <div className="d-flex align-items-center gap-2">
                        <FileText size={18} className="text-muted" />
                        <h5 className="fw-bold text-dark mb-0" style={{ letterSpacing: '-0.01em' }}>Interaction Archive</h5>
                    </div>
                    
                    <div className="d-flex flex-column flex-sm-row align-items-sm-center gap-3">
                        <div className="input-group input-group-sm rounded-pill shadow-sm overflow-hidden" style={{ width: 'auto' }}>
                            <span className="input-group-text bg-light border-0 text-muted ps-3"><Calendar size={14} /></span>
                            <input 
                                type="date" 
                                className="form-control bg-light border-0 shadow-none text-dark fw-medium px-2 py-2" 
                                value={filters.date} 
                                onChange={e => setFilters({...filters, date: e.target.value})}
                                style={{ fontSize: '12px' }}
                            />
                        </div>

                        <select 
                            className="form-select form-select-sm bg-light border-0 shadow-sm rounded-pill fw-medium text-dark py-2 px-3"
                            style={{ fontSize: '12px', minWidth: '160px' }}
                            value={filters.userId} 
                            onChange={e => setFilters({...filters, userId: e.target.value})}
                        >
                            <option value="">All Team Members</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                            ))}
                        </select>

                        <button 
                            className="btn btn-outline-dark btn-sm rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2 py-2"
                            onClick={() => setIsUploadModalOpen(true)}
                            style={{ fontSize: '11px' }}
                        >
                            <Upload size={14} /> Import Logs
                        </button>
                    </div>
                </div>

                <div className="table-responsive p-0">
                    <table className="table table-hover align-middle mb-0 border-0 bg-transparent">
                        <thead>
                            <tr className="border-bottom border-light">
                                <th className="ps-4 py-3 text-muted small fw-black text-uppercase tracking-widest" style={{ fontSize: '10px' }}>Staff Member</th>
                                <th className="py-3 text-muted small fw-black text-uppercase tracking-widest" style={{ fontSize: '10px' }}>Timestamp</th>
                                <th className="py-3 text-muted small fw-black text-uppercase tracking-widest" style={{ fontSize: '10px' }}>Type</th>
                                <th className="py-3 text-muted small fw-black text-uppercase tracking-widest" style={{ fontSize: '10px' }}>Entity / Contact</th>
                                <th className="py-3 text-muted small fw-black text-uppercase tracking-widest" style={{ fontSize: '10px' }}>Outcome</th>
                                <th className="py-3 text-muted small fw-black text-uppercase tracking-widest" style={{ fontSize: '10px' }}>Notes</th>
                                <th className="pe-4 py-3 text-end text-muted small fw-black text-uppercase tracking-widest" style={{ fontSize: '10px' }}>Recording</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => {
                                const isConnected = log.status === 'CONNECTED' || log.status === 'PAID';
                                const isFailed = log.status === 'NOT_INTERESTED' || log.status === 'PAYMENT_FAILED';

                                return (
                                    <tr key={log.id} className="border-bottom border-light transition-all">
                                        <td className="ps-4 py-3">
                                            <div className="d-flex align-items-center gap-2">
                                                <div className="p-1 bg-light rounded text-muted">
                                                    <User size={14} />
                                                </div>
                                                <span className="fw-bold text-dark" style={{ fontSize: '13px' }}>{log.user?.name || "Unknown"}</span>
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <div className="d-flex flex-column">
                                                <span className="fw-bold text-dark" style={{ fontSize: '12px' }}>{new Date(log.startTime).toLocaleDateString()}</span>
                                                <span className="text-muted" style={{ fontSize: '10px' }}>{new Date(log.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <span className={`badge bg-opacity-10 rounded-pill px-2 py-1 border fw-bold ${log.callType === 'OUTGOING' ? 'bg-primary text-primary border-primary border-opacity-25' : 'bg-info text-info border-info border-opacity-25'}`} style={{ fontSize: '9px' }}>
                                                {log.callType}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            <div className="d-flex flex-column">
                                                <span className="fw-bold text-dark" style={{ fontSize: '13px' }}>{log.lead?.name || "Manual Log"}</span>
                                                <span className="text-muted font-monospace" style={{ fontSize: '11px' }}>{log.phoneNumber}</span>
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <div className="d-flex flex-column gap-1">
                                                <span className={`badge rounded-sm px-2 py-1 text-uppercase fw-bold ${isConnected ? 'bg-success bg-opacity-10 text-success' : isFailed ? 'bg-danger bg-opacity-10 text-danger' : 'bg-warning bg-opacity-10 text-warning'}`} style={{ fontSize: '9px', width: 'fit-content' }}>
                                                    {log.status.replace(/_/g, ' ')}
                                                </span>
                                                <span className="text-muted d-flex align-items-center gap-1" style={{ fontSize: '10px' }}><Clock size={10} /> {formatDuration(log.duration)}</span>
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <div className="text-muted" style={{ fontSize: '12px', maxWidth: '200px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {log.note || '--'}
                                            </div>
                                        </td>
                                        <td className="pe-4 py-3 text-end">
                                            {log.recordingPath ? (
                                                <button 
                                                    className={`btn btn-sm rounded-pill px-3 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-1 ms-auto transition-all ${
                                                        playingId === log.id ? 'btn-primary' : 'btn-dark'
                                                    }`}
                                                    onClick={() => toggleAudio(log.id)}
                                                    style={{ fontSize: '11px', padding: '6px 12px' }}
                                                >
                                                    {playingId === log.id ? (
                                                        <>
                                                            <span className="spinner-grow spinner-grow-sm" role="status" style={{ width: '10px', height: '10px' }}></span> Playback
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Play size={10} fill="currentColor" /> Listen
                                                        </>
                                                    )}
                                                </button>
                                            ) : (
                                                <span className="text-muted fst-italic fw-medium" style={{ fontSize: '10px' }}>No recording</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {logs.length === 0 && !loading && (
                        <div className="text-center py-5">
                            <div className="mb-3">
                               <Search size={32} className="text-muted opacity-25" />
                            </div>
                            <p className="fw-bold text-muted text-uppercase mb-0 tracking-widest" style={{ fontSize: '12px' }}>No interaction records found</p>
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
