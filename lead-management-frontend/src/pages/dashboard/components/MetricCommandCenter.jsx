import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  IndianRupee, 
  Calendar, 
  Clock, 
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Target
} from 'lucide-react';
import TargetModal from './TargetModal';

const MetricCard = ({ title, stats, icon: Icon, color, onClick, subtitle }) => (
  <div 
    className={`premium-card p-4 h-100 cursor-pointer hover-scale transition-all border-0 shadow-lg bg-surface animate-fade-in`}
    onClick={onClick}
  >
    <div className="d-flex justify-content-between align-items-center mb-3">
      <div className={`p-3 rounded-4 bg-${color} bg-opacity-10 text-${color} border border-${color} border-opacity-10 shadow-sm`}>
        <Icon size={24} />
      </div>
      <ArrowRight size={16} className="text-muted opacity-25" />
    </div>
    
    <div>
      <h6 className="fw-black text-uppercase tracking-widest text-muted mb-1" style={{fontSize: '11px'}}>{title}</h6>
      <div className="d-flex align-items-end gap-2 mb-2">
        <span className="fs-3 fw-black text-main tabular-nums">{stats.primary.value}</span>
        <span className="small fw-bold text-muted mb-1" style={{fontSize: '10px'}}>{stats.primary.label}</span>
      </div>
      
      <div className="d-flex flex-wrap gap-3 pt-3 border-top border-white border-opacity-5">
        {stats.secondary.map((s, idx) => (
          <div key={idx} className="d-flex flex-column">
            <span className={`small fw-black text-${s.color || 'main'} opacity-75`}>{s.value}</span>
            <span className="text-muted fw-bold text-uppercase" style={{fontSize: '8px', letterSpacing: '1px'}}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const MetricCommandCenter = ({ stats, role, filters, onNavigate }) => {
  const navigate = useNavigate();
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);

  if (!stats) return null;

  const handleNav = (tab, path) => {
    if (onNavigate) {
      onNavigate(tab);
    } else {
      navigate(path);
    }
  };

  return (
    <div className="row g-4 mb-4">
      {/* 1. Attendance Card */}
      <div className="col-12 col-md-4">
        <MetricCard 
          title="Attendance Command"
          icon={Users}
          color="primary"
          onClick={() => handleNav('attendance', `/attendance?from=${filters.from}&to=${filters.to}`)}
          stats={{
            primary: { value: stats.presentCount, label: 'Present Today' },
            secondary: [
              { label: 'Absent', value: stats.absentCount, color: 'danger' },
              { label: 'Late Login', value: stats.lateCount, color: 'warning' }
            ]
          }}
        />
      </div>

      {/* 2. Revenue Card */}
      <div className="col-12 col-md-4">
        <MetricCard 
          title="Revenue Transmission"
          icon={IndianRupee}
          color="success"
          onClick={() => handleNav('revenue', '/revenue')}
          stats={{
            primary: { value: `₹${(stats.monthlyRevenue || 0).toLocaleString()}`, label: 'Monthly Collection' },
            secondary: [
              { label: 'Daily', value: `₹${(stats.dailyRevenue || 0).toLocaleString()}` },
              { label: 'Target', value: `₹${(stats.monthlyTarget || 0).toLocaleString()}`, color: 'info' },
              { label: 'ACHIEVED', value: `${stats.targetAchievement?.toFixed(1) || 0}%`, color: stats.targetAchievement >= 100 ? 'success' : 'warning' }
            ]
          }}
        />
        {(role === 'ADMIN' || role === 'MANAGER') && (
          <div 
            className="position-absolute top-0 end-0 p-3" 
            onClick={(e) => { e.stopPropagation(); setIsTargetModalOpen(true); }}
            title="Set Monthly Target"
          >
            <div className="p-1 bg-white bg-opacity-5 rounded-circle hover-scale text-primary cursor-pointer border border-white border-opacity-10">
              <Target size={14} />
            </div>
          </div>
        )}

        <TargetModal 
          isOpen={isTargetModalOpen} 
          onClose={() => setIsTargetModalOpen(false)} 
          userId={filters.userId || filters.currentUserId} 
          onSuccess={() => onNavigate && onNavigate('overview')}
        />
      </div>

      {/* 3. Follow-ups Card */}
      <div className="col-12 col-md-4">
        <MetricCard 
          title="Engagement Matrix"
          icon={Clock}
          color="warning"
          onClick={() => handleNav('tasks', '/tasks')}
          stats={{
            primary: { value: stats.todayFollowups, label: 'Today Follow-ups' },
            secondary: [
              { label: 'Pending', value: stats.pendingFollowups, color: 'danger' },
              { label: 'Efficiency', value: 'High', color: 'success' }
            ]
          }}
        />
      </div>

      {/* 4. Revenue Leaderboard (New) */}
      <div className="col-12 mt-2">
        <div className="premium-card border-0 shadow-lg overflow-hidden animate-slide-up bg-surface">
          <div className="card-header bg-transparent border-bottom border-white border-opacity-5 p-3 d-flex justify-content-between align-items-center">
             <div className="d-flex align-items-center gap-2">
                <div className="p-2 bg-success bg-opacity-10 text-success rounded border border-success border-opacity-10">
                   <TrendingUp size={16} />
                </div>
                <div>
                   <h6 className="fw-black mb-0 text-main text-uppercase small tracking-widest">Revenue Leaderboard</h6>
                   <p className="text-muted fw-bold mb-0 opacity-50" style={{ fontSize: '8px' }}>TARGET VS ACHIEVED REAL-TIME SYNC</p>
                </div>
             </div>
             <div className="d-flex gap-4">
                <div className="text-end">
                   <div className="small fw-black text-main tabular-nums">₹{(stats.monthlyRevenue || 0).toLocaleString()}</div>
                   <div className="text-muted fw-bold text-uppercase" style={{fontSize: '7px'}}>Total Collection</div>
                </div>
                <div className="text-end">
                   <div className="small fw-black text-primary tabular-nums">₹{(stats.pendingRevenue || 0).toLocaleString()}</div>
                   <div className="text-muted fw-bold text-uppercase" style={{fontSize: '7px'}}>Total Receivables</div>
                </div>
             </div>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 border-0">
              <thead className="bg-surface bg-opacity-50">
                <tr>
                  <th className="ps-4 py-3 small fw-black text-muted text-uppercase tracking-widest" style={{ fontSize: '9px' }}>SNo</th>
                  <th className="py-3 small fw-black text-muted text-uppercase tracking-widest" style={{ fontSize: '9px' }}>Employee Name</th>
                  <th className="py-3 small fw-black text-muted text-uppercase tracking-widest text-center" style={{ fontSize: '9px' }}>Target</th>
                  <th className="py-3 small fw-black text-muted text-uppercase tracking-widest text-center" style={{ fontSize: '9px' }}>Achieved</th>
                  <th className="py-3 small fw-black text-muted text-uppercase tracking-widest text-center" style={{ fontSize: '9px' }}>Ratio %</th>
                  <th className="pe-4 py-3 small fw-black text-muted text-uppercase tracking-widest text-end" style={{ fontSize: '9px' }}>Receivables</th>
                </tr>
              </thead>
              <tbody className="border-0">
                {(!stats.performance || stats.performance.length === 0) ? (
                   <tr>
                     <td colSpan="6" className="text-center py-4 opacity-50 small fw-bold text-muted">AWAITING PERFORMANCE PROTOCOL...</td>
                   </tr>
                ) : (
                  stats.performance.map((p, idx) => (
                    <tr key={p.userId} className="border-bottom border-white border-opacity-5 transition-smooth hover-bg-surface-light cursor-pointer" onClick={() => onNavigate && onNavigate('performance', p.userId)}>
                      <td className="ps-4 py-3 text-muted small fw-bold">{idx + 1}</td>
                      <td className="py-3">
                        <div className="d-flex align-items-center gap-2">
                          <div className="p-1 rounded-circle bg-primary bg-opacity-10 text-primary border border-primary border-opacity-10">
                            <Users size={10} />
                          </div>
                          <span className="fw-black text-main small">{p.username}</span>
                        </div>
                      </td>
                      <td className="py-3 text-center small fw-bold text-muted tabular-nums">₹{(p.monthlyTarget || 0).toLocaleString()}</td>
                      <td className="py-3 text-center small fw-black text-success tabular-nums">₹{(p.revenueGenerated || 0).toLocaleString()}</td>
                      <td className="py-3 text-center">
                        <div className="d-flex flex-column align-items-center gap-1">
                           <div className="small fw-black text-main" style={{ fontSize: '10px' }}>{p.targetAchievement?.toFixed(1) || 0}%</div>
                           <div className="progress w-100" style={{ height: '3px', maxWidth: '60px', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                              <div 
                                className={`progress-bar transition-all duration-1000 bg-${p.targetAchievement >= 100 ? 'success' : 'primary'}`} 
                                style={{ width: `${Math.min(p.targetAchievement || 0, 100)}%` }}
                              ></div>
                           </div>
                        </div>
                      </td>
                      <td className="pe-4 py-3 text-end small fw-black text-primary tabular-nums">₹{(p.pendingReceivables || 0).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricCommandCenter;
