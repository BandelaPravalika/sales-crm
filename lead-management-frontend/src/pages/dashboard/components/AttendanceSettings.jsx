import React, { useState, useEffect } from 'react';
import adminService from '../../../services/adminService';
import { MapPin, Shield, Clock, Plus, Trash2, Save, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';

const AttendanceSettings = () => {
    const [offices, setOffices] = useState([]);
    const [policies, setPolicies] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('offices');

    const [newOffice, setNewOffice] = useState({ name: '', latitude: 0, longitude: 0, radius: 100 });
    const [newShift, setNewShift] = useState({ name: '', startTime: '09:00', endTime: '18:00', graceMinutes: 15, minHalfDayMinutes: 240, minFullDayMinutes: 480 });
    const [newPolicy, setNewPolicy] = useState({ 
        officeId: '', 
        trackingIntervalSec: 300, 
        shortBreakStartTime: '17:00', 
        shortBreakEndTime: '17:10', 
        longBreakStartTime: '13:00', 
        longBreakEndTime: '14:00', 
        gracePeriodMinutes: 2,
        maxAccuracyMeters: 100, 
        minimumWorkMinutes: 240,
        maxIdleMinutes: 30
    });


    const fetchData = async () => {
        setLoading(true);
        try {
            const [officesRes, policiesRes, shiftsRes] = await Promise.all([
                adminService.fetchOffices(),
                adminService.fetchPolicies(),
                adminService.fetchShifts()
            ]);
            
            const offData = officesRes.data.data;
            setOffices(Array.isArray(offData) ? offData : (offData?.content || []));
            
            const polData = policiesRes.data.data;
            setPolicies(Array.isArray(polData) ? polData : (polData?.content || []));
            
            const shiftData = shiftsRes.data.data;
            setShifts(Array.isArray(shiftData) ? shiftData : (shiftData?.content || []));
        } catch (err) {
            toast.error('Failed to load attendance settings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateOffice = async (e) => {
        e.preventDefault();
        try {
            await adminService.createOffice(newOffice);
            toast.success('Office location added');
            setNewOffice({ name: '', latitude: 0, longitude: 0, radius: 100 });
            fetchData();
        } catch (err) {
            toast.error('Failed to create office');
        }
    };

    const handleDeleteOffice = async (id) => {
        if (!window.confirm('Delete this office location? This may affect existing policies.')) return;
        try {
            await adminService.deleteOffice(id);
            toast.success('Office removed');
            fetchData();
        } catch (err) {
            toast.error('Failed to delete office');
        }
    };

    const handleDeletePolicy = async (id) => {
        if (!window.confirm('Delete this compliance policy?')) return;
        try {
            await adminService.deletePolicy(id);
            toast.success('Policy removed');
            fetchData();
        } catch (err) {
            toast.error('Failed to delete policy');
        }
    };

    const handleCreateShift = async (e) => {
        e.preventDefault();
        try {
            await adminService.createShift(newShift);
            toast.success('Work shift created');
            setNewShift({ name: '', startTime: '09:00', endTime: '18:00', graceMinutes: 15, minHalfDayMinutes: 240, minFullDayMinutes: 480 });
            fetchData();
        } catch (err) {
            toast.error('Failed to create shift');
        }
    };

    const handleCreatePolicy = async (e) => {
        e.preventDefault();
        if (!newPolicy.officeId) return toast.warning('Select an office first');
        try {
            await adminService.createPolicy(newPolicy);
            toast.success('Policy active');
            fetchData();
        } catch (err) {
            toast.error('Failed to create policy');
        }
    };

    const handleDeleteShift = async (id) => {
        if (!window.confirm('Delete this shift?')) return;
        try {
            await adminService.deleteShift(id);
            toast.success('Shift removed');
            fetchData();
        } catch (err) {
            toast.error('Failed to delete shift');
        }
    };

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center p-5">
            <RefreshCw className="animate-spin text-primary" size={32} />
        </div>
    );

    return (
        <div className="container-fluid p-0 animate-fade-in">
            <div className="row g-4">
                {/* Sidebar Navigation */}
                <div className="col-12 col-md-3">
                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                        <div className="list-group list-group-flush">
                            <button 
                                onClick={() => setActiveSection('offices')}
                                className={`list-group-item list-group-item-action border-0 p-3 d-flex align-items-center gap-3 ${activeSection === 'offices' ? 'bg-primary text-white' : 'bg-transparent text-muted'}`}
                            >
                                <MapPin size={18} />
                                <span className="fw-semibold">Office Locations</span>
                            </button>
                            <button 
                                onClick={() => setActiveSection('policies')}
                                className={`list-group-item list-group-item-action border-0 p-3 d-flex align-items-center gap-3 ${activeSection === 'policies' ? 'bg-primary text-white' : 'bg-transparent text-muted'}`}
                            >
                                <Shield size={18} />
                                <span className="fw-semibold">Compliance Policies</span>
                            </button>
                            <button 
                                onClick={() => setActiveSection('shifts')}
                                className={`list-group-item list-group-item-action border-0 p-3 d-flex align-items-center gap-3 ${activeSection === 'shifts' ? 'bg-primary text-white' : 'bg-transparent text-muted'}`}
                            >
                                <Clock size={18} />
                                <span className="fw-semibold">Work Shifts</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="col-12 col-md-9">
                    {activeSection === 'offices' && (
                        <div className="d-flex flex-column gap-4">
                            <div className="card border-0 shadow-sm rounded-4 p-4 bg-dark bg-opacity-25">
                                <h6 className="text-white fw-bold mb-4 d-flex align-items-center gap-2">
                                    <Plus size={18} className="text-primary" />
                                    Add New Branch/Office
                                </h6>
                                <form onSubmit={handleCreateOffice} className="row g-3">
                                    <div className="col-md-3">
                                        <label className="small text-muted mb-1">Office Name</label>
                                        <input 
                                            type="text" className="form-control form-control-sm bg-dark border-secondary text-white" 
                                            value={newOffice.name} onChange={e => setNewOffice({...newOffice, name: e.target.value})}
                                            placeholder="e.g. Head Office" required
                                        />
                                        <div className="small text-muted mt-1" style={{fontSize: '0.6rem'}}>
                                            Paste Lat/Lng separately using decimal points (e.g. 17.430)
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <label className="small text-muted mb-1">Latitude</label>
                                        <input 
                                            type="number" step="any" className="form-control form-control-sm bg-dark border-secondary text-white" 
                                            value={newOffice.latitude || 0} onChange={e => setNewOffice({...newOffice, latitude: parseFloat(e.target.value) || 0})}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="small text-muted mb-1">Longitude</label>
                                        <input 
                                            type="number" step="any" className="form-control form-control-sm bg-dark border-secondary text-white" 
                                            value={newOffice.longitude || 0} onChange={e => setNewOffice({...newOffice, longitude: parseFloat(e.target.value) || 0})}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-2">
                                        <label className="small text-muted mb-1">Radius (m)</label>
                                        <input 
                                            type="number" className="form-control form-control-sm bg-dark border-secondary text-white" 
                                            value={newOffice.radius || 100} onChange={e => setNewOffice({...newOffice, radius: parseInt(e.target.value) || 0})}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-1 d-flex align-items-end">
                                        <button type="submit" className="btn btn-primary btn-sm w-100"><Save size={16} /></button>
                                    </div>
                                </form>
                            </div>

                            <div className="row g-3">
                                {offices.map(office => (
                                    <div key={office.id} className="col-md-6 col-lg-4">
                                        <div className="card h-100 border-0 shadow-sm rounded-4 p-3 hover-lift transition-all">
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <h6 className="mb-0 fw-bold">{office.name}</h6>
                                                <button onClick={() => handleDeleteOffice(office.id)} className="btn btn-link text-danger p-0 border-0">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <div className="small text-muted d-flex flex-column gap-1">
                                                <span>Lat: {office.latitude}</span>
                                                <span>Lng: {office.longitude}</span>
                                                <span className="badge bg-primary bg-opacity-10 text-primary w-fit">Radius: {office.radius}m</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeSection === 'policies' && (
                        <div className="d-flex flex-column gap-4">
                            <div className="card border-0 shadow-sm rounded-4 p-4 bg-dark bg-opacity-25">
                                <h6 className="text-white fw-bold mb-4 d-flex align-items-center gap-2">
                                    <Plus size={18} className="text-primary" />
                                    Define Attendance Rules
                                </h6>
                                <form onSubmit={handleCreatePolicy} className="row g-3">
                                    <div className="col-md-3">
                                        <label className="small text-muted mb-1">Target Office</label>
                                        <select 
                                            className="form-select form-select-sm bg-dark border-secondary text-white" 
                                            value={newPolicy.officeId} onChange={e => setNewPolicy({...newPolicy, officeId: e.target.value})}
                                            required
                                        >
                                            <option value="">Select Office...</option>
                                            {offices.map(o => (
                                                <option key={o.id} value={o.id}>{o.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-2">
                                        <label className="small text-muted mb-1">Ping (s)</label>
                                        <input 
                                            type="number" className="form-control form-control-sm bg-dark border-secondary text-white" 
                                            value={newPolicy.trackingIntervalSec} onChange={e => setNewPolicy({...newPolicy, trackingIntervalSec: parseInt(e.target.value)})}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-2">
                                        <label className="small text-muted mb-1">Grace (m)</label>
                                        <input 
                                            type="number" className="form-control form-control-sm bg-dark border-secondary text-white" 
                                            value={newPolicy.gracePeriodMinutes || 0} onChange={e => setNewPolicy({...newPolicy, gracePeriodMinutes: parseInt(e.target.value) || 0})}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-4 d-flex gap-2">
                                       <div className="flex-grow-1">
                                           <label className="small text-muted mb-1 text-nowrap">Short Break (Start-End)</label>
                                           <div className="d-flex gap-1">
                                               <input type="time" className="form-control form-control-sm bg-dark border-secondary text-white py-1" 
                                                   value={newPolicy.shortBreakStartTime} onChange={e => setNewPolicy({...newPolicy, shortBreakStartTime: e.target.value})} />
                                               <input type="time" className="form-control form-control-sm bg-dark border-secondary text-white py-1" 
                                                   value={newPolicy.shortBreakEndTime} onChange={e => setNewPolicy({...newPolicy, shortBreakEndTime: e.target.value})} />
                                           </div>
                                       </div>
                                       <div className="flex-grow-1">
                                           <label className="small text-muted mb-1 text-nowrap">Lunch/Long (Start-End)</label>
                                           <div className="d-flex gap-1">
                                               <input type="time" className="form-control form-control-sm bg-dark border-secondary text-white py-1" 
                                                   value={newPolicy.longBreakStartTime} onChange={e => setNewPolicy({...newPolicy, longBreakStartTime: e.target.value})} />
                                               <input type="time" className="form-control form-control-sm bg-dark border-secondary text-white py-1" 
                                                   value={newPolicy.longBreakEndTime} onChange={e => setNewPolicy({...newPolicy, longBreakEndTime: e.target.value})} />
                                           </div>
                                       </div>
                                    </div>
                                    <div className="col-md-1 d-flex align-items-end">
                                        <button type="submit" className="btn btn-primary btn-sm w-100 py-1.5"><Save size={16} /></button>
                                    </div>

                                </form>
                            </div>

                            <div className="card border-0 shadow-sm rounded-4 p-4">
                                <h6 className="fw-bold mb-4">Active Compliance Archive</h6>
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle border-0">
                                        <thead>
                                            <tr className="text-muted small text-uppercase fw-bold border-bottom">
                                                <th>Office Context</th>
                                                <th>Ping/Grace</th>
                                                <th>Short Break Window</th>
                                                <th>Long Break Window</th>
                                                <th>Min Work</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {policies.map(p => (
                                                <tr key={p.id}>
                                                    <td className="fw-semibold">Office ID: {p.officeId}</td>
                                                    <td>
                                                       <div className="small fw-bold">{p.trackingIntervalSec}s ping</div>
                                                       <div className="small text-muted">{p.gracePeriodMinutes}m grace</div>
                                                    </td>
                                                    <td>
                                                       <span className="badge bg-info bg-opacity-10 text-info">
                                                           {p.shortBreakStartTime} - {p.shortBreakEndTime}
                                                       </span>
                                                    </td>
                                                    <td>
                                                       <span className="badge bg-primary bg-opacity-10 text-primary">
                                                           {p.longBreakStartTime} - {p.longBreakEndTime}
                                                       </span>
                                                    </td>
                                                    <td>{p.minimumWorkMinutes}m</td>

                                                    <td>
                                                        <button 
                                                            onClick={() => handleDeletePolicy(p.id)}
                                                            className="btn btn-link text-danger p-0 border-0 opacity-50 hover-opacity-100"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {policies.length === 0 && (
                                                <tr>
                                                    <td colSpan="6" className="text-center py-4 text-muted small italic">No tracking rules found for any branch.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'shifts' && (
                        <div className="d-flex flex-column gap-4">
                             <div className="card border-0 shadow-sm rounded-4 p-4 bg-dark bg-opacity-25">
                                <h6 className="text-white fw-bold mb-4 d-flex align-items-center gap-2">
                                    <Clock size={18} className="text-primary" />
                                    Configure New Shift
                                </h6>
                                <form onSubmit={handleCreateShift} className="row g-3">
                                    <div className="col-md-3">
                                        <label className="small text-muted mb-1">Shift Name</label>
                                        <input 
                                            type="text" className="form-control form-control-sm bg-dark border-secondary text-white" 
                                            value={newShift.name} onChange={e => setNewShift({...newShift, name: e.target.value})}
                                            placeholder="e.g. Morning Shift" required
                                        />
                                    </div>
                                    <div className="col-md-2">
                                        <label className="small text-muted mb-1">Start Time</label>
                                        <input 
                                            type="time" className="form-control form-control-sm bg-dark border-secondary text-white" 
                                            value={newShift.startTime} onChange={e => setNewShift({...newShift, startTime: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-2">
                                        <label className="small text-muted mb-1">End Time</label>
                                        <input 
                                            type="time" className="form-control form-control-sm bg-dark border-secondary text-white" 
                                            value={newShift.endTime} onChange={e => setNewShift({...newShift, endTime: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-2">
                                        <label className="small text-muted mb-1">Grace (m)</label>
                                        <input 
                                            type="number" className="form-control form-control-sm bg-dark border-secondary text-white" 
                                            value={newShift.graceMinutes} onChange={e => setNewShift({...newShift, graceMinutes: parseInt(e.target.value)})}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-1 d-flex align-items-end">
                                        <button type="submit" className="btn btn-primary btn-sm w-100"><Save size={16} /></button>
                                    </div>
                                </form>
                            </div>

                            <div className="row g-3">
                                {shifts.map(shift => (
                                    <div key={shift.id} className="col-md-6 col-lg-4">
                                        <div className="card h-100 border-0 shadow-sm rounded-4 p-4 hover-lift transition-all">
                                            <div className="d-flex align-items-center gap-3 mb-3">
                                                <div className="p-3 bg-primary bg-opacity-10 rounded-circle text-primary position-relative">
                                                    <Clock size={24} />
                                                    <button 
                                                        onClick={() => handleDeleteShift(shift.id)}
                                                        className="btn btn-sm btn-danger rounded-circle position-absolute top-0 end-0 p-1"
                                                        style={{ transform: 'translate(50%, -50%)', width: '20px', height: '20px', fontSize: '10px' }}
                                                    >
                                                        <Trash2 size={10} />
                                                    </button>
                                                </div>
                                                <div className="flex-grow-1">
                                                    <h6 className="mb-0 fw-bold">{shift.name}</h6>
                                                    <span className="small text-muted text-uppercase fw-bold tracking-wider" style={{fontSize: '9px'}}>System Identity: {shift.id}</span>
                                                </div>
                                            </div>
                                            <div className="d-flex justify-content-between border-top pt-3 border-white border-opacity-5 mt-2">
                                                <div className="text-center px-2 border-end border-white border-opacity-5 flex-grow-1">
                                                    <p className="text-muted small mb-0 fw-bold uppercase" style={{fontSize: '9px'}}>Start</p>
                                                    <span className="fw-bold">{shift.startTime.slice(0, 5)}</span>
                                                </div>
                                                <div className="text-center px-2 flex-grow-1">
                                                    <p className="text-muted small mb-0 fw-bold uppercase" style={{fontSize: '9px'}}>End</p>
                                                    <span className="fw-bold">{shift.endTime.slice(0, 5)}</span>
                                                </div>
                                            </div>
                                            <div className="mt-3 bg-primary bg-opacity-5 p-2 rounded text-center">
                                                <span className="small fw-semibold text-primary">Allowed Grace: {shift.graceMinutes} mins</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttendanceSettings;
