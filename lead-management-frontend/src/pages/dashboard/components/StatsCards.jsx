import React from 'react';
import { IndianRupee } from 'lucide-react';

const StatsCards = ({ stats, theme }) => {
  return (
    <div className="row g-4 mb-4">
      <div className="col-12 col-sm-6 col-md-3">
        <div className={`card h-100 border-0 shadow-sm rounded-4 text-white overflow-hidden ${theme === 'dark' ? 'bg-dark border border-secondary border-opacity-25' : 'bg-primary'}`}>
          <div className="card-body p-4 d-flex flex-column justify-content-between position-relative">
            <div className="position-absolute top-0 end-0 p-3 opacity-10">
              <IndianRupee size={80} />
            </div>
            <div>
              <h6 className="text-uppercase fw-bold opacity-75 small mb-1 tracking-wider">Revenue Stream</h6>
              <h3 className="fw-black mb-0">₹ {stats?.totalPayments?.toLocaleString() || 0}</h3>
            </div>
            <div className="d-flex align-items-center gap-2 mt-2">
              <span className="badge border border-white border-opacity-25 rounded-pill small transition-all hover-bg-white-10">{stats?.fullPayments || 0} Full</span>
              <span className="badge border border-white border-opacity-25 rounded-pill small transition-all hover-bg-white-10">{stats?.partPayments || 0} Part</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="col-12 col-sm-6 col-md-3">
        <div className="card h-100 border-0 shadow-sm rounded-4 bg-info bg-opacity-10 border border-info border-opacity-10">
          <div className="card-body p-4 d-flex flex-column justify-content-between">
            <div>
              <h6 className="text-info text-uppercase fw-bold small mb-1 tracking-wider">Operations Log</h6>
              <h3 className="fw-black text-info mb-0">{stats?.callsToday || 0}</h3>
            </div>
            <p className="mb-0 text-muted small mt-2">Calls recorded today</p>
          </div>
        </div>
      </div>

      <div className="col-12 col-sm-6 col-md-3">
        <div className="card h-100 border-0 shadow-sm rounded-4 bg-success bg-opacity-10 border border-success border-opacity-10">
          <div className="card-body p-4 d-flex flex-column justify-content-between">
            <div>
              <h6 className="text-success text-uppercase fw-bold small mb-1 tracking-wider">Interest Level</h6>
              <h3 className="fw-black text-success mb-0">{stats?.interestedToday || 0}</h3>
            </div>
            <p className="mb-0 text-muted small mt-2">Potential conversions</p>
          </div>
        </div>
      </div>

      <div className="col-12 col-sm-6 col-md-3">
        <div className="card h-100 border-0 shadow-sm rounded-4 bg-warning bg-opacity-10 border border-warning border-opacity-10">
          <div className="card-body p-4 d-flex flex-column justify-content-between">
            <div>
              <h6 className="text-warning text-uppercase fw-bold small mb-1 tracking-wider">Strategic Gap</h6>
              <h3 className="fw-black text-warning mb-0">{stats?.notInterestedToday || 0}</h3>
            </div>
            <p className="mb-0 text-muted small mt-2">Lost opportunities</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;
