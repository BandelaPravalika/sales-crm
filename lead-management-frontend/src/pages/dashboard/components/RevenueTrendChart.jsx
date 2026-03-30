import React from 'react';
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

const RevenueTrendChart = ({ data, theme }) => {
  const isDark = theme === 'dark';

  if (!data || data.length === 0) {
    return (
      <div className="card shadow-sm border-0 rounded-4 h-100 p-5 text-center bg-secondary bg-opacity-5">
        <BarChart3 className="text-muted mb-3 opacity-25" size={48} />
        <h5 className="fw-bold text-muted text-uppercase mb-0">Synchronization Required</h5>
        <p className="text-muted small">Select a date range to visualize the revenue pipeline</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded shadow-lg border-0 ${isDark ? 'bg-dark text-white' : 'bg-white text-dark'}`} style={{ zIndex: 1000 }}>
          <p className="fw-bold mb-2 small text-uppercase opacity-75">{new Date(label).toDateString()}</p>
          <div className="d-flex flex-column gap-1">
            <div className="d-flex align-items-center justify-content-between gap-4">
              <span className="small d-flex align-items-center gap-2">
                <div className="rounded-circle bg-primary" style={{ width: 8, height: 8 }}></div>
                Leads Generated
              </span>
              <span className="fw-black text-primary">{payload[0].value}</span>
            </div>
            <div className="d-flex align-items-center justify-content-between gap-4 border-top pt-1 mt-1">
              <span className="small d-flex align-items-center gap-2">
                <div className="rounded-circle bg-danger" style={{ width: 8, height: 8 }}></div>
                Lost Leads
              </span>
              <span className="fw-black text-danger">{payload[2]?.value || 0}</span>
            </div>
            <div className="d-flex align-items-center justify-content-between gap-4 border-top pt-1 mt-1">
              <span className="small d-flex align-items-center gap-2">
                <div className="rounded-circle bg-success" style={{ width: 8, height: 8 }}></div>
                Revenue Value
              </span>
              <span className="fw-black text-success">₹ {payload[1].value.toLocaleString()}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card shadow-sm border-0 rounded-4 overflow-hidden h-100 bg-secondary bg-opacity-5">
      <div className="card-header bg-transparent border-0 p-4 d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-3">
          <div className="p-2 bg-success bg-opacity-10 text-success rounded shadow-sm">
            <TrendingUp size={20} />
          </div>
          <div>
            <h5 className="card-title fw-bold mb-0 text-white">Revenue Analytics Pipeline</h5>
            <small className="text-muted small text-uppercase" style={{ fontSize: '9px' }}>Correlation: Leads Generated vs Conversion Value</small>
          </div>
        </div>
      </div>
      <div className="card-body p-4 pt-0" style={{ height: '350px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0d6efd" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#0d6efd" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#198754" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#198754" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorLost" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#dc3545" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#dc3545" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#444' : '#eee'} />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: isDark ? '#888' : '#666' }}
              tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
            />
            <YAxis 
              yAxisId="left"
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: isDark ? '#888' : '#666' }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: isDark ? '#888' : '#666' }}
              tickFormatter={(val) => `₹${val>=1000 ? val/1000 + 'k' : val}`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#0d6efd', strokeWidth: 1, strokeDasharray: '3 3' }} />
            <Area 
              yAxisId="left"
              type="monotone" 
              dataKey="leadsCount" 
              stroke="#0d6efd" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorLeads)" 
              name="Leads"
              activeDot={{ r: 6, stroke: '#0d6efd', strokeWidth: 2, fill: '#fff' }}
            />
            <Area 
              yAxisId="left"
              type="monotone" 
              dataKey="lostCount" 
              stroke="#dc3545" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorLost)" 
              name="Lost"
              activeDot={{ r: 6, stroke: '#dc3545', strokeWidth: 2, fill: '#fff' }}
            />
            <Area 
              yAxisId="right"
              type="monotone" 
              dataKey="revenue" 
              stroke="#198754" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorRev)" 
              name="Revenue"
              activeDot={{ r: 6, stroke: '#198754', strokeWidth: 2, fill: '#fff' }}
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
