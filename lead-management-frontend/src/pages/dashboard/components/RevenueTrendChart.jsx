import React from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { TrendingUp, BarChart3 } from 'lucide-react';

const RevenueTrendChart = ({ data }) => {
  const { isDarkMode } = useTheme();

  if (!data || data.length === 0) {
    return (
      <div className="premium-card h-100 p-5 text-center bg-transparent border-0 d-flex flex-column align-items-center justify-content-center">
        <BarChart3 className="text-muted mb-3 opacity-25" size={48} />
        <h5 className="fw-bold text-muted text-uppercase mb-0 small tracking-widest">Synchronization Required</h5>
        <p className="text-muted small">Select a date range to visualize the revenue pipeline</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded shadow-lg border-0 glass-panel`} style={{ zIndex: 1000, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <p className="fw-bold mb-2 small text-uppercase opacity-75" style={{ color: 'var(--text-muted)' }}>{new Date(label).toDateString()}</p>
          <div className="d-flex flex-column gap-1">
            <div className="d-flex align-items-center justify-content-between gap-4">
              <span className="small d-flex align-items-center gap-2" style={{ color: 'var(--text-main)' }}>
                <div className="rounded-circle bg-primary" style={{ width: 8, height: 8 }}></div>
                Leads Generated
              </span>
              <span className="fw-black text-primary">{payload[0].value}</span>
            </div>
            <div className="d-flex align-items-center justify-content-between gap-4 border-top border-white border-opacity-10 pt-1 mt-1">
              <span className="small d-flex align-items-center gap-2" style={{ color: 'var(--text-main)' }}>
                <div className="rounded-circle bg-danger" style={{ width: 8, height: 8 }}></div>
                Lost Leads
              </span>
              <span className="fw-black text-danger">{payload[1]?.value || 0}</span>
            </div>
            <div className="d-flex align-items-center justify-content-between gap-4 border-top border-white border-opacity-10 pt-1 mt-1">
              <span className="small d-flex align-items-center gap-2" style={{ color: 'var(--text-main)' }}>
                <div className="rounded-circle bg-success" style={{ width: 8, height: 8 }}></div>
                Revenue Value
              </span>
              <span className="fw-black text-success">₹ {payload[2]?.value ? payload[2].value.toLocaleString() : 0}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="premium-card overflow-hidden h-100 bg-transparent border-0">
      <div className="card-header bg-transparent border-0 p-4 d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-3">
          <div className="p-2 bg-success bg-opacity-10 text-success rounded shadow-sm">
            <TrendingUp size={20} />
          </div>
          <div>
            <h5 className="card-title fw-bold mb-0">Revenue Analytics Pipeline</h5>
            <small className="text-muted small text-uppercase" style={{ fontSize: '9px' }}>Correlation: Leads Generated vs Conversion Value</small>
          </div>
        </div>
      </div>
      <div className="card-body p-4 pt-0" style={{ height: '350px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--success)" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorLost" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--danger)" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="var(--danger)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
            />
            <YAxis 
              yAxisId="left"
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              tickFormatter={(val) => `₹${val>=1000 ? val/1000 + 'k' : val}`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--primary)', strokeWidth: 1, strokeDasharray: '3 3' }} />
            <Area 
              yAxisId="left"
              type="monotone" 
              dataKey="leadsCount" 
              stroke="var(--primary)" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorLeads)" 
              name="Leads"
              activeDot={{ r: 6, stroke: 'var(--primary)', strokeWidth: 2, fill: 'var(--bg-card)' }}
            />
            <Area 
              yAxisId="left"
              type="monotone" 
              dataKey="lostCount" 
              stroke="var(--danger)" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorLost)" 
              name="Lost"
              activeDot={{ r: 6, stroke: 'var(--danger)', strokeWidth: 2, fill: 'var(--bg-card)' }}
            />
            <Area 
              yAxisId="right"
              type="monotone" 
              dataKey="revenue" 
              stroke="var(--success)" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorRev)" 
              name="Revenue"
              activeDot={{ r: 6, stroke: 'var(--success)', strokeWidth: 2, fill: 'var(--bg-card)' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="card-footer bg-transparent border-top border-white border-opacity-5 p-3">
        <div className="d-flex justify-content-center gap-4">
          <div className="d-flex align-items-center gap-2">
            <div className="rounded-circle bg-primary" style={{ width: 10, height: 10 }}></div>
            <span className="small fw-bold text-muted">Lead Gen Pipeline</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <div className="rounded-circle bg-success" style={{ width: 10, height: 10 }}></div>
            <span className="small fw-bold text-muted">Conversion Value</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <div className="rounded-circle bg-danger" style={{ width: 10, height: 10 }}></div>
            <span className="small fw-bold text-muted">Lost Leads</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueTrendChart;
