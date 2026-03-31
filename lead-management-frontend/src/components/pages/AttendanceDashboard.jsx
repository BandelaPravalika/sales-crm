import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Filter, 
  Search, 
  Download, 
  Clock, 
  Coffee,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  X
} from 'lucide-react';

import attendanceService from '../../services/attendanceService';

const AttendanceDashboard = ({ role }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [userId, setUserId] = useState('');

  // User History Detail Modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [userHistory, setUserHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showModal, setShowModal] = useState(false);


  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await attendanceService.getAdminSummaries(date, userId);
      if (response.success) {
        setLogs(response.data);
        setError(null);
      }
    } catch (err) {
      setError('Failed to fetch attendance logs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserHistory = async (user) => {
    if (!user || (!user.id && !user.userId)) return;
    try {
      setLoadingHistory(true);
      setSelectedUser(user);
      setShowModal(true);
      const response = await attendanceService.getAdminSummaries(null, user.id || user.userId);
      if (response.success) {
        setUserHistory(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch user history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [date, userId]);


  const formatMinutes = (mins) => {
    if (mins === null || mins === undefined || isNaN(mins)) return "0h 0m";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  return (
    <div className="container-fluid p-4 animate-fade-in">
      {/* Header Area */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold text-white mb-1">Attendance Activity</h4>
          <p className="text-white opacity-50 small mb-0">Monitor team productivity and daily work sessions</p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2 rounded-3 shadow-sm px-4">
          <Download size={18} /> Export Logs
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card border-0 shadow-sm glass-panel rounded-4 mb-4">
        <div className="card-body p-3">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="small text-white opacity-50 mb-1 d-block">Filter by Date</label>
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white bg-opacity-10 border-0 text-white">
                  <Calendar size={16} />
                </span>
                <input 
                  type="date" 
                  className="form-control bg-white bg-opacity-10 border-0 text-white shadow-none"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-4">
              <label className="small text-white opacity-50 mb-1 d-block">Search User ID</label>
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white bg-opacity-10 border-0 text-white">
                  <Search size={16} />
                </span>
                <input 
                  type="text" 
                  className="form-control bg-white bg-opacity-10 border-0 text-white shadow-none"
                  placeholder="Enter User ID..."
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card border-0 shadow-sm glass-panel rounded-4 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover table-borderless align-middle mb-0">
            <thead className="premium-bg-surface border-bottom border-white border-opacity-5">
              <tr>
                <th className="px-4 py-3 small fw-bold opacity-50">USER</th>
                <th className="px-4 py-3 small fw-bold opacity-50 text-center">DATE</th>
                <th className="px-4 py-3 small fw-bold opacity-50 text-center">WORK</th>
                <th className="px-4 py-3 small fw-bold opacity-50 text-center">BREAK</th>
                <th className="px-4 py-3 small fw-bold opacity-50 text-center">EXITS</th>
                <th className="px-4 py-3 small fw-bold opacity-50 text-end">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5">

                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                    <span className="opacity-50">Syncing logs...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 opacity-25">
                    No activities found for the selected filters
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={`${log.userId}-${log.date}`} className="border-bottom border-white border-opacity-5">
                    <td className="px-4 py-3">
                      <div 
                        className="d-flex align-items-center gap-3 cursor-pointer hover-translate-x" 
                        style={{ cursor: 'pointer' }}
                        onClick={() => fetchUserHistory(log.user || { id: log.userId, name: log.userName })}
                      >
                        <div className="p-2 bg-primary bg-opacity-10 rounded-circle text-primary">
                          <Users size={16} />
                        </div>
                        <div>
                          <div className="fw-bold small d-flex align-items-center gap-2">
                             {log.userName || log.user?.name || `User ID: ${log.userId || log.user?.id || '?'}`}
                             <ExternalLink size={12} className="opacity-50" />
                          </div>
                          <div className="small opacity-25" style={{fontSize: '0.7rem'}}>{log.user?.email || 'N/A'}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center small text-white opacity-75">
                      {log.date}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="d-inline-flex align-items-center gap-2 px-3 py-1 bg-success bg-opacity-10 text-success rounded-pill small border border-success border-opacity-25">
                        <Clock size={12} />
                        {formatMinutes(log.totalWorkMinutes)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="d-inline-flex align-items-center gap-2 px-3 py-1 bg-warning bg-opacity-10 text-warning rounded-pill small border border-warning border-opacity-25">
                        <Coffee size={12} />
                        {formatMinutes(log.totalBreakMinutes)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="d-inline-flex align-items-center gap-2 px-3 py-1 bg-info bg-opacity-10 text-info rounded-pill small border border-info border-opacity-25">
                        <AlertCircle size={12} />
                        {log.outsideCount || 0} Exits
                      </div>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <div className={`badge rounded-pill px-3 py-2 ${
                        log.status === 'PRESENT' ? 'bg-success bg-opacity-25 text-success' : 
                        log.status === 'HALF_DAY' ? 'bg-warning bg-opacity-25 text-warning' : 
                        'bg-danger bg-opacity-25 text-danger border border-danger border-opacity-25'
                      }`}>
                        {log.status === 'PRESENT' ? (
                          <div className="d-flex align-items-center gap-1">
                            <CheckCircle size={12} /> PRESENT
                          </div>
                        ) : log.status === 'HALF_DAY' ? (
                          <div className="d-flex align-items-center gap-1">
                            <Clock size={12} /> HALF DAY
                          </div>
                        ) : (
                          <div className="d-flex align-items-center gap-1">
                            <XCircle size={12} /> ABSENT
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

        </div>
      </div>

      {/* User Detail History Modal */}
      {showModal && selectedUser && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 1060, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="card border-0 shadow-lg bg-dark text-white rounded-4 w-100 mx-3" style={{ maxWidth: '900px', maxHeight: '90vh' }}>
            <div className="card-header border-bottom border-white border-opacity-10 p-4 d-flex justify-content-between align-items-center">
              <div>
                <h5 className="fw-bold mb-1">Attendance History: {selectedUser.name}</h5>
                <p className="text-white opacity-50 small mb-0">Detailed activity log and monthly performance</p>
              </div>
              <button onClick={() => setShowModal(false)} className="btn btn-link text-white opacity-50 p-0 border-0">
                <X size={24} />
              </button>
            </div>
            
            <div className="card-body p-4 overflow-auto">
              {loadingHistory ? (
                <div className="text-center py-5">
                   <div className="spinner-border text-primary mb-3"></div>
                   <p className="opacity-50">Calculating monthly performance...</p>
                </div>
              ) : (
                <>
                  {/* Monthly Stats Summary */}
                  <div className="row g-3 mb-4">
                    <div className="col-md-3">
                      <div className="p-3 bg-white bg-opacity-5 rounded-4 border border-white border-opacity-5">
                        <div className="small text-white opacity-50 mb-1">Monthly Work</div>
                        <div className="h4 fw-bold text-success mb-0">
                          {formatMinutes(userHistory.reduce((acc, log) => acc + (log.totalWorkMinutes || 0), 0))}
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="p-3 bg-white bg-opacity-5 rounded-4 border border-white border-opacity-5">
                        <div className="small text-white opacity-50 mb-1">Presents</div>
                        <div className="h4 fw-bold text-primary mb-0">
                          {userHistory.filter(h => h.status === 'PRESENT').length} Days
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="p-3 bg-white bg-opacity-5 rounded-4 border border-white border-opacity-5">
                        <div className="small text-white opacity-50 mb-1">Half Days</div>
                        <div className="h4 fw-bold text-warning mb-0">
                          {userHistory.filter(h => h.status === 'HALF_DAY').length} Days
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="p-3 bg-white bg-opacity-5 rounded-4 border border-white border-opacity-5">
                        <div className="small text-white opacity-50 mb-1">Geofence Exits</div>
                        <div className="h4 fw-bold text-info mb-0">
                          {userHistory.reduce((acc, log) => acc + (log.outsideCount || 0), 0)} Total
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="table-responsive rounded-3">
                    <table className="table table-dark table-hover table-sm border-white border-opacity-5 small">
                      <thead className="bg-white bg-opacity-5">
                        <tr>
                          <th className="p-2 opacity-50">DATE</th>
                          <th className="p-2 opacity-50 text-center">WORK</th>
                          <th className="p-2 opacity-50 text-center">BREAK</th>
                          <th className="p-2 opacity-50 text-center">EXITS</th>
                          <th className="p-2 opacity-50 text-end">STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userHistory.map((h) => (
                          <tr key={h.id}>
                            <td className="p-2">{h.date}</td>
                            <td className="p-2 text-center text-success fw-bold">{formatMinutes(h.totalWorkMinutes)}</td>
                            <td className="p-2 text-center opacity-75">{formatMinutes(h.totalBreakMinutes)}</td>
                            <td className="p-2 text-center text-info">{h.outsideCount || 0}</td>
                            <td className="p-2 text-end">
                              <span className={`badge rounded-pill ${
                                h.status === 'PRESENT' ? 'bg-success text-success' : 
                                h.status === 'HALF_DAY' ? 'bg-warning text-warning' : 'bg-danger text-danger'
                              } bg-opacity-10 border border-current border-opacity-10`}>
                                {h.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default AttendanceDashboard;
