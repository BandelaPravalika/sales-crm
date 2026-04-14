import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  IndianRupee,
  Clock,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Target,
  LifeBuoy,
  Zap
} from 'lucide-react';
import TargetModal from './TargetModal';

const MetricCard = ({ title, stats, icon: Icon, color, onClick }) => (
  <div
    className="premium-card h-100 cursor-pointer border border-white border-opacity-10 shadow-lg group hover-active-card overflow-hidden"
    onClick={onClick}
    style={{
      borderRadius: '24px',
      background: 'rgba(255, 255, 255, 0.03)',
      backdropFilter: 'blur(30px)',
      position: 'relative',
      minHeight: '160px'
    }}
  >
    {/* Dynamic Background Glow */}
    <div className={`position-absolute top-0 end-0 bg-${color} opacity-10 rounded-circle`} style={{ width: '120px', height: '120px', filter: 'blur(50px)', transform: 'translate(40%, -40%)' }}></div>

    <div className="p-4 position-relative z-10 d-flex flex-column h-100">
      <div className="mb-2">
        <h6 className="fw-black text-uppercase tracking-widest text-muted mb-0" style={{ fontSize: '9px', opacity: 0.6 }}>{title}</h6>
      </div>

      <div className="flex-grow-1 d-flex align-items-center justify-content-between my-2">
        <div>
          <span className="fs-2 fw-black text-main tabular-nums d-block" style={{ lineHeight: 1, letterSpacing: '-1.5px' }}>{stats.primary.value}</span>
          <span className="fw-bold text-muted text-uppercase" style={{ fontSize: '9px', opacity: 0.4, letterSpacing: '0.5px' }}>{stats.primary.label}</span>
        </div>
        <div className={`p-3 rounded-4 bg-${color} bg-opacity-10 text-${color} border border-${color} border-opacity-20 shadow-glow-sm group-hover:scale-110 transition-transform duration-500`}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
      </div>

      {/* <div className="mt-auto grid-secondary-stats pt-3 border-top border-white border-opacity-5">
        {stats.secondary.map((s, idx) => (
          <div key={idx} className="d-flex flex-column">
            <span className={`fw-black text-${s.color || 'main'} mb-0.5`} style={{ fontSize: '13px', lineHeight: 1 }}>{s.value}</span>
            <span className="text-muted fw-bold text-uppercase" style={{ fontSize: '7px', opacity: 0.4, letterSpacing: '0.4px' }}>{s.label}</span>
          </div>
        ))}
      </div> */}
    </div>
  </div>
);

const MetricCommandCenter = ({ stats, role, filters, onNavigate }) => {
  const navigate = useNavigate();
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);

  if (!stats) return null;

  const isPersonalAdminView = role === 'ADMIN' && filters?.userId === filters?.currentUserId;

  const handleNav = (tab, path) => {
    if (onNavigate) {
      onNavigate(tab);
    } else {
      navigate(path);
    }
  };

  const getCount = (k) => stats.userBreakdown?.[k] || stats.userBreakdown?.[k.toLowerCase()] || 0;
  const totalUsers = getCount('TOTAL') || getCount('total') || (getCount('ADMIN') + getCount('MANAGER') + getCount('TEAM_LEADER') + getCount('ASSOCIATE'));

  return (
    <div className="row g-3 mb-4 animate-fade-in-up">
      {/* 1. Attendance Card - Note (1) */}
      <div className="col-12 col-md-4 col-xl-3" style={{ flex: '0 0 25%', maxWidth: '25%' }}>
        <MetricCard
          title="Attendance"
          icon={Users}
          color="primary"
          onClick={() => handleNav('attendance-logs', `/attendance-logs?from=${filters.from}&to=${filters.to}`)}
          stats={{
            primary: { value: stats.presentCount || 0, label: 'Present' },
            secondary: [
              { label: 'Absent', value: stats.absentCount || 0, color: 'danger' },
              { label: 'Late', value: stats.lateCount || 0, color: 'warning' },
              { label: 'Ratio', value: `${stats.presentCount > 0 ? ((stats.presentCount / (stats.presentCount + stats.absentCount)) * 100).toFixed(0) : 0}%`, color: 'success' }
            ]
          }}
        />
      </div>

      {/* 2. User Matrix Card - Note (2) */}
      <div className="col-12 col-md-4 col-xl-3" style={{ flex: '0 0 25%', maxWidth: '25%' }}>
        <MetricCard
          title="Users"
          icon={Users}
          color="info"
          onClick={() => handleNav('users', '/users')}
          stats={{
            primary: { value: totalUsers, label: 'Staff' },
            secondary: [
              { label: 'Manager', value: getCount('MANAGER') },
              { label: 'TL', value: getCount('TEAM_LEADER'), color: 'info' },
              { label: 'BDA', value: getCount('ASSOCIATE'), color: 'warning' }
            ]
          }}
        />
      </div>

      {/* 3. Follow-ups Card - Note (3) */}
      <div className="col-12 col-md-4 col-xl-3" style={{ flex: '0 0 25%', maxWidth: '25%' }}>
        <MetricCard
          title="Follow ups"
          icon={Clock}
          color="warning"
          onClick={() => handleNav('tasks', '/tasks')}
          stats={{
            primary: { value: stats.todayFollowups || 0, label: 'Scheduled Today' },
            secondary: [
              { label: 'Leads', value: stats.todayFollowups || 0, color: 'primary' },
              { label: 'Revenue', value: stats.pendingFollowups || 0, color: 'danger' },
              // { label: 'Active', value: 'Ready', color: 'success' }
            ]
          }}
        />
      </div>

      {/* 4. Supports Lifecycle - Note (4) - COMMENTED OUT BY USER REQUEST */}
      {/* {!isPersonalAdminView && (
        <div className="col-12 col-md-4 col-xl-2.4" style={{ flex: '0 0 20%', maxWidth: '20%' }}>
          <MetricCard
            title="Supports"
            icon={LifeBuoy}
            color="primary"
            onClick={() => handleNav('support-queue', '/support-queue')}
            stats={{
              primary: { value: (stats.supportStats?.NEW || 0) + (stats.supportStats?.ACTIVE || 0), label: 'Active' },
              secondary: [
                { label: 'Pending', value: stats.supportStats?.NEW || 0, color: 'warning' },
                { label: 'Resolved', value: stats.supportStats?.EXISTING || 0, color: 'success' },
                { label: 'Review', value: stats.disposedStats?.PENDING_FINANCE || 0, color: 'danger' }
              ]
            }}
          />
        </div>
      )} */}

      {/* 5. Pending Followups Card - Note (5) */}
      <div className="col-12 col-md-4 col-xl-3" style={{ flex: '0 0 25%', maxWidth: '25%' }}>
        <MetricCard
          title="Pending Followups"
          icon={Zap}
          color="danger"
          onClick={() => handleNav('revenue', '/revenue')}
          stats={{
            primary: { value: stats.pendingFollowups || 0, label: 'Pending Review' },
            secondary: [
              { label: 'revenue', value: stats.pendingFollowups || 0, color: 'danger' },
              { label: 'leads', value: stats.pendingFollowups || 0, color: 'warning' },
              // { label: 'Priority', value: 'High', color: 'danger' }
            ]
          }}
        />
      </div>

      <style>{`
        .premium-card { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); min-height: 90px; position: relative; overflow: hidden; }
        .hover-active-card:hover { transform: translateY(-3px) scale(1.01); background: rgba(255,255,255,0.05) !important; border-color: rgba(255,255,255,0.15) !important; box-shadow: 0 10px 20px -10px rgba(0,0,0,0.4) !important; }
        .grid-secondary-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.25rem; }
        .shadow-glow-sm { box-shadow: 0 0 8px currentColor; }
        .duration-300 { transition-duration: 300ms; }
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default MetricCommandCenter;
