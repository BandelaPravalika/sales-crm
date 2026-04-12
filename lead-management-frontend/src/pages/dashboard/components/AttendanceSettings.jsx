import React, { useState, useEffect } from 'react';
import adminService from '../../../services/adminService';
import { MapPin, Shield, Clock, Plus, Trash2, Save, RefreshCw, Edit } from 'lucide-react';
import { toast } from 'react-toastify';

const AttendanceSettings = () => {
    const [offices, setOffices] = useState([]);
    const [policies, setPolicies] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('offices');
    const [editingPolicyId, setEditingPolicyId] = useState(null);
    const [editingShiftId, setEditingShiftId] = useState(null);

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
                adminService.fetchAttendanceShifts()
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
            if (editingShiftId) {
                await adminService.updateShift(editingShiftId, newShift);
                toast.success('Work shift updated');
            } else {
                await adminService.createShift(newShift);
                toast.success('Work shift created');
            }
            setEditingShiftId(null);
            setNewShift({ name: '', startTime: '09:00', endTime: '18:00', graceMinutes: 15, minHalfDayMinutes: 240, minFullDayMinutes: 480 });
            fetchData();
        } catch (err) {
            toast.error(editingShiftId ? 'Failed to update shift' : 'Failed to create shift');
        }
    };

    const handleCreatePolicy = async (e) => {
        e.preventDefault();
        if (!newPolicy.officeId) return toast.warning('Select an office first');
        try {
            if (editingPolicyId) {
                await adminService.updatePolicy(editingPolicyId, newPolicy);
                toast.success('Policy updated successfully');
            } else {
                await adminService.createPolicy(newPolicy);
                toast.success('Policy active');
            }
            setEditingPolicyId(null);
            setNewPolicy({ 
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
            fetchData();
        } catch (err) {
            toast.error(editingPolicyId ? 'Failed to update policy' : 'Failed to create policy');
        }
    };
    
    const handleEditPolicy = (policy) => {
        setEditingPolicyId(policy.id);
        setNewPolicy({
            officeId: policy.officeId,
            trackingIntervalSec: policy.trackingIntervalSec,
            shortBreakStartTime: policy.shortBreakStartTime,
            shortBreakEndTime: policy.shortBreakEndTime,
            longBreakStartTime: policy.longBreakStartTime,
            longBreakEndTime: policy.longBreakEndTime,
            gracePeriodMinutes: policy.gracePeriodMinutes,
            maxAccuracyMeters: policy.maxAccuracyMeters || 100,
            minimumWorkMinutes: policy.minimumWorkMinutes,
            maxIdleMinutes: policy.maxIdleMinutes || 30
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const handleEditShift = (shift) => {
        setEditingShiftId(shift.id);
        setNewShift({
            name: shift.name,
            startTime: shift.startTime,
            endTime: shift.endTime,
            graceMinutes: shift.graceMinutes,
            minHalfDayMinutes: shift.minHalfDayMinutes,
            minFullDayMinutes: shift.minFullDayMinutes
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
                    <div className="premium-card border-0 shadow-sm rounded-4 overflow-hidden p-0">
                        <div className="list-group list-group-flush border-0">
                            <button 
                                onClick={() => setActiveSection('offices')}
                                className={`list-group-item list-group-item-action border-0 p-3 d-flex align-items-center gap-3 transition-all ${activeSection === 'offices' ? 'bg-primary text-white' : 'bg-transparent text-muted hover-bg-surface'}`}
                            >
                                <MapPin size={18} />
                                <span className="fw-bold small text-uppercase tracking-widest">Office Locations</span>
                            </button>
                            <button 
                                onClick={() => setActiveSection('policies')}
                                className={`list-group-item list-group-item-action border-0 p-3 d-flex align-items-center gap-3 transition-all ${activeSection === 'policies' ? 'bg-primary text-white' : 'bg-transparent text-muted hover-bg-surface'}`}
                            >
                                <Shield size={18} />
                                <span className="fw-bold small text-uppercase tracking-widest">Compliance Policies</span>
                            </button>
                            <button 
                                onClick={() => setActiveSection('shifts')}
                                className={`list-group-item list-group-item-action border-0 p-3 d-flex align-items-center gap-3 transition-all ${activeSection === 'shifts' ? 'bg-primary text-white' : 'bg-transparent text-muted hover-bg-surface'}`}
                            >
                                <Clock size={18} />
                                <span className="fw-bold small text-uppercase tracking-widest">Work Shifts</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="col-12 col-md-9">
                    {activeSection === 'offices' && (
                        <div className="d-flex flex-column gap-4">
                            <div className="premium-card p-4">
                                <h6 className="text-main fw-black mb-4 d-flex align-items-center gap-2">
                                    <Plus size={18} className="text-primary" />
                                    ADD NEW BRANCH IDENTITY
                                </h6>
                                <form onSubmit={handleCreateOffice} className="p-2">
                                    <div className="row g-4">
                                        <div className="col-md-6 border-end border-white border-opacity-5">
                                            <div className="mb-4">
                                                <label className="text-muted small fw-bold text-uppercase mb-2 d-block" style={{fontSize: '0.65rem'}}>Branch Identifier</label>
                                                <input 
                                                    type="text" className="ui-input py-2" 
                                                    value={newOffice.name} onChange={e => setNewOffice({...newOffice, name: e.target.value})}
                                                    placeholder="e.g. Hyderabad Tech Park" required
                                                />
                                            </div>
                                            <div className="mb-0">
                                                <label className="text-muted small fw-bold text-uppercase mb-2 d-block" style={{fontSize: '0.65rem'}}>Geofence Radius (meters)</label>
                                                <input 
                                                    type="number" className="ui-input py-2" 
                                                    value={newOffice.radius || 100} onChange={e => setNewOffice({...newOffice, radius: parseInt(e.target.value) || 0})}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="mb-4">
                                                <label className="text-muted small fw-bold text-uppercase mb-2 d-block" style={{fontSize: '0.65rem'}}>Coordinate Latitude</label>
                                                <input 
                                                    type="number" step="any" className="ui-input py-2" 
                                                    value={newOffice.latitude || 0} onChange={e => setNewOffice({...newOffice, latitude: parseFloat(e.target.value) || 0})}
                                                    required
                                                />
                                            </div>
                                            <div className="mb-0">
                                                <label className="text-muted small fw-bold text-uppercase mb-2 d-block" style={{fontSize: '0.65rem'}}>Coordinate Longitude</label>
                                                <input 
                                                    type="number" step="any" className="ui-input py-2" 
                                                    value={newOffice.longitude || 0} onChange={e => setNewOffice({...newOffice, longitude: parseFloat(e.target.value) || 0})}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="d-flex justify-content-end mt-4 pt-3 border-top border-white border-opacity-5">
                                        <button type="submit" className="ui-btn ui-btn-primary px-5 rounded-pill shadow-glow">
                                            <Save size={18} />
                                            Initialize Operational Node
                                        </button>
                                    </div>
                                </form>
                            </div>

                            <div className="row g-3">
                                {offices.map(office => (
                                    <div key={office.id} className="col-md-6 col-lg-4">
                                        <div className="premium-card h-100 p-3 hover-lift transition-all border-opacity-5">
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <h6 className="mb-0 fw-bold text-main">{office.name}</h6>
                                                <button onClick={() => handleDeleteOffice(office.id)} className="btn btn-link text-danger p-0 border-0 opacity-50 hover-opacity-100">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <div className="small text-muted d-flex flex-column gap-1">
                                                <span className="opacity-75 tracking-tighter">Lat: {office.latitude}</span>
                                                <span className="opacity-75 tracking-tighter">Lng: {office.longitude}</span>
                                                <div className="mt-2 text-primary fw-black" style={{fontSize: '0.65rem'}}>RADIUS: {office.radius}M GEOZONE</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeSection === 'policies' && (
                        <div className="d-flex flex-column gap-4">
                            <div className="premium-card p-4">
                                <h6 className="text-main fw-black mb-4 d-flex align-items-center gap-2">
                                    <Shield size={18} className="text-primary" />
                                    {editingPolicyId ? 'MODIFY COMPLIANCE PROTOCOL' : 'DEFINE COMPLIANCE GATEWAYS'}
                                </h6>
                                <form onSubmit={handleCreatePolicy} className="p-2">
                                    <div className="row g-4">
                                        <div className="col-lg-4 border-end border-white border-opacity-5 pe-lg-4">
                                            <div className="mb-4">
                                                <label className="text-muted small fw-bold text-uppercase mb-2 d-block" style={{fontSize: '0.65rem'}}>Operational Target</label>
                                                <select 
                                                    className="ui-input py-2" 
                                                    value={newPolicy.officeId} onChange={e => setNewPolicy({...newPolicy, officeId: e.target.value})}
                                                    required
                                                >
                                                    <option value="" className="text-dark">Select Location...</option>
                                                    {offices.map(o => (
                                                        <option key={o.id} value={o.id} className="text-dark">{o.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="row g-3">
                                                <div className="col-6">
                                                    <label className="text-muted small fw-bold text-uppercase mb-2 d-block" style={{fontSize: '0.65rem'}}>Sync Rate (s)</label>
                                                    <input 
                                                        type="number" className="ui-input py-2" 
                                                        value={newPolicy.trackingIntervalSec} onChange={e => setNewPolicy({...newPolicy, trackingIntervalSec: parseInt(e.target.value)})}
                                                        placeholder="300" required
                                                    />
                                                </div>
                                                <div className="col-6">
                                                    <label className="text-muted small fw-bold text-uppercase mb-2 d-block" style={{fontSize: '0.65rem'}}>Grace (m)</label>
                                                    <input 
                                                        type="number" className="ui-input py-2" 
                                                        value={newPolicy.gracePeriodMinutes || 0} onChange={e => setNewPolicy({...newPolicy, gracePeriodMinutes: parseInt(e.target.value) || 0})}
                                                        placeholder="2" required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="col-lg-5 border-end border-white border-opacity-5 px-lg-4">
                                            <label className="text-primary small fw-black text-uppercase mb-3 d-block" style={{fontSize: '0.65rem'}}>Recess & Intervals</label>
                                            <div className="d-flex flex-column gap-3">
                                                <div className="p-3 bg-surface rounded-3 border border-white border-opacity-5">
                                                    <span className="small text-muted fw-bold d-block mb-2 opacity-75" style={{fontSize: '0.65rem'}}>SHORT BREAK WINDOW</span>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <input type="time" className="ui-input px-2 border-0 bg-dark bg-opacity-50 text-center" style={{height: '34px'}}
                                                           value={newPolicy.shortBreakStartTime} onChange={e => setNewPolicy({...newPolicy, shortBreakStartTime: e.target.value})} />
                                                        <span className="text-muted small fw-black opacity-25">➔</span>
                                                        <input type="time" className="ui-input px-2 border-0 bg-dark bg-opacity-50 text-center" style={{height: '34px'}}
                                                           value={newPolicy.shortBreakEndTime} onChange={e => setNewPolicy({...newPolicy, shortBreakEndTime: e.target.value})} />
                                                    </div>
                                                </div>
                                                <div className="p-3 bg-surface rounded-3 border border-white border-opacity-5">
                                                    <span className="small text-muted fw-bold d-block mb-2 opacity-75" style={{fontSize: '0.65rem'}}>LONG BREAK WINDOW</span>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <input type="time" className="ui-input px-2 border-0 bg-dark bg-opacity-50 text-center" style={{height: '34px'}}
                                                           value={newPolicy.longBreakStartTime} onChange={e => setNewPolicy({...newPolicy, longBreakStartTime: e.target.value})} />
                                                        <span className="text-muted small fw-black opacity-25">➔</span>
                                                        <input type="time" className="ui-input px-2 border-0 bg-dark bg-opacity-50 text-center" style={{height: '34px'}}
                                                           value={newPolicy.longBreakEndTime} onChange={e => setNewPolicy({...newPolicy, longBreakEndTime: e.target.value})} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="col-lg-3 d-flex flex-column justify-content-between ps-lg-4">
                                            <div>
                                                <div className="mb-4">
                                                    <label className="text-muted small fw-bold text-uppercase mb-2 d-block" style={{fontSize: '0.65rem'}}>Work Threshold (min)</label>
                                                    <input 
                                                        type="number" className="ui-input py-2" 
                                                        value={newPolicy.minimumWorkMinutes || 0} onChange={e => setNewPolicy({...newPolicy, minimumWorkMinutes: parseInt(e.target.value) || 0})}
                                                        placeholder="240" required
                                                    />
                                                </div>
                                                <div className="mb-4">
                                                    <label className="text-muted small fw-bold text-uppercase mb-2 d-block" style={{fontSize: '0.65rem'}}>Idle Timeout (min)</label>
                                                    <input 
                                                        type="number" className="ui-input py-2" 
                                                        value={newPolicy.maxIdleMinutes || 0} onChange={e => setNewPolicy({...newPolicy, maxIdleMinutes: parseInt(e.target.value) || 0})}
                                                        placeholder="30" required
                                                    />
                                                </div>
                                            </div>
                                            <button type="submit" className="ui-btn ui-btn-primary w-100 rounded-3 shadow-glow py-3">
                                                <Save size={18} />
                                                {editingPolicyId ? 'SYNCHRONIZE POLICY' : 'ACTIVATE POLICY'}
                                            </button>
                                            {editingPolicyId && (
                                                <button 
                                                    type="button" 
                                                    className="btn btn-link text-muted small mt-2 w-100" 
                                                    onClick={() => {
                                                        setEditingPolicyId(null);
                                                        setNewPolicy({ officeId: '', trackingIntervalSec: 300, shortBreakStartTime: '17:00', shortBreakEndTime: '17:10', longBreakStartTime: '13:00', longBreakEndTime: '14:00', gracePeriodMinutes: 2, maxAccuracyMeters: 100, minimumWorkMinutes: 240, maxIdleMinutes: 30});
                                                    }}
                                                >Cancel Edit</button>
                                            )}
                                        </div>
                                    </div>
                                </form>
                            </div>

                             <div className="premium-card p-4">
                                <h6 className="fw-black mb-4 text-main small tracking-widest text-uppercase">COMPLIANCE LEDGER ARCHIVE</h6>
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle border-0 text-main">
                                        <thead>
                                            <tr className="text-muted small text-uppercase fw-black border-bottom border-white border-opacity-5">
                                                <th className="ps-0 border-0 pt-0">Impacted Node</th>
                                                <th className="border-0 pt-0">Sync Matrix</th>
                                                <th className="border-0 pt-0">Short Interval</th>
                                                <th className="border-0 pt-0">Long Interval</th>
                                                <th className="border-0 pt-0">Work Load</th>
                                                <th className="pe-0 border-0 pt-0 text-end">Management</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {policies.map(p => (
                                                <tr key={p.id} className="border-bottom border-white border-opacity-5">
                                                    <td className="fw-bold text-primary ps-0">{p.officeName || `Office ID: ${p.officeId}`}</td>
                                                    <td>
                                                       <div className="small fw-bold text-main">{p.trackingIntervalSec}s ping</div>
                                                       <div className="small text-muted opacity-50">{p.gracePeriodMinutes}m grace</div>
                                                    </td>
                                                    <td>
                                                       <span className="ui-badge bg-info bg-opacity-10 text-info">
                                                           {p.shortBreakStartTime} - {p.shortBreakEndTime}
                                                       </span>
                                                    </td>
                                                    <td>
                                                       <span className="ui-badge bg-primary bg-opacity-10 text-primary">
                                                           {p.longBreakStartTime} - {p.longBreakEndTime}
                                                       </span>
                                                    </td>
                                                    <td><span className="fw-bold text-main">{p.minimumWorkMinutes}m</span></td>

                                                    <td className="pe-0 text-end">
                                                        <div className="d-flex justify-content-end gap-2">
                                                            <button 
                                                                onClick={() => handleEditPolicy(p)}
                                                                className="btn btn-link text-primary p-0 border-0 opacity-50 hover-opacity-100 transition-all"
                                                                title="Edit Policy"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeletePolicy(p.id)}
                                                                className="btn btn-link text-danger p-0 border-0 opacity-30 hover-opacity-100 transition-all"
                                                                title="Delete Policy"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {policies.length === 0 && (
                                                <tr>
                                                    <td colSpan="6" className="text-center py-5">
                                                        <div className="d-flex flex-column align-items-center opacity-20">
                                                            <Shield size={48} className="mb-3 text-muted" />
                                                            <p className="mb-0 fw-black text-uppercase small tracking-widest">ZERO COMPLIANCE PROTOCOLS</p>
                                                        </div>
                                                    </td>
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
                             <div className="premium-card p-4">
                                <h6 className="text-main fw-black mb-4 d-flex align-items-center gap-2">
                                    <Clock size={18} className="text-primary" />
                                    {editingShiftId ? 'MODIFY SYSTEM SHIFT' : 'CONFIGURE SYSTEM SHIFT'}
                                </h6>
                                <form onSubmit={handleCreateShift}>
                                    <div className="row g-4">
                                        <div className="col-md-6">
                                            <div className="mb-4">
                                                <label className="text-muted small fw-bold text-uppercase mb-2 d-block" style={{fontSize: '0.65rem'}}>Shift Nomenclature</label>
                                                <input 
                                                    type="text" className="ui-input py-2" 
                                                    value={newShift.name} onChange={e => setNewShift({...newShift, name: e.target.value})}
                                                    placeholder="e.g. Standard Day Shift" required
                                                />
                                            </div>
                                            <div className="row g-3">
                                                <div className="col-6">
                                                    <label className="text-muted small fw-bold text-uppercase mb-2 d-block" style={{fontSize: '0.65rem'}}>Inaugural Bell</label>
                                                    <input 
                                                        type="time" className="ui-input py-2" 
                                                        value={newShift.startTime} onChange={e => setNewShift({...newShift, startTime: e.target.value})}
                                                        required
                                                    />
                                                </div>
                                                <div className="col-6">
                                                    <label className="text-muted small fw-bold text-uppercase mb-2 d-block" style={{fontSize: '0.65rem'}}>Termination Bell</label>
                                                    <input 
                                                        type="time" className="ui-input py-2" 
                                                        value={newShift.endTime} onChange={e => setNewShift({...newShift, endTime: e.target.value})}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6 d-flex flex-column justify-content-between">
                                            <div className="mb-4">
                                                <label className="text-muted small fw-bold text-uppercase mb-2 d-block" style={{fontSize: '0.65rem'}}>Arrival Grace Margin (mins)</label>
                                                <input 
                                                    type="number" className="ui-input py-2" 
                                                    value={newShift.graceMinutes} onChange={e => setNewShift({...newShift, graceMinutes: parseInt(e.target.value)})}
                                                    required
                                                />
                                            </div>
                                            <div className="d-flex justify-content-end">
                                                <button type="submit" className="ui-btn ui-btn-primary px-5 rounded-pill shadow-glow">
                                                    <Save size={18} />
                                                    {editingShiftId ? 'Update Shift' : 'Synchronize Shift'}
                                                </button>
                                                {editingShiftId && (
                                                    <button 
                                                        type="button" 
                                                        className="btn btn-link text-muted small mt-2 w-100" 
                                                        onClick={() => {
                                                            setEditingShiftId(null);
                                                            setNewShift({ name: '', startTime: '09:00', endTime: '18:00', graceMinutes: 15, minHalfDayMinutes: 240, minFullDayMinutes: 480 });
                                                        }}
                                                    >Cancel Edit</button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>

                            <div className="row g-3">
                                 {shifts.map(shift => (
                                    <div key={shift.id} className="col-md-6 col-lg-4">
                                        <div className="premium-card h-100 p-4 hover-lift transition-all border-opacity-5">
                                            <div className="d-flex align-items-center gap-3 mb-3">
                                                <div className="p-3 bg-primary bg-opacity-10 rounded-circle text-primary position-relative shadow-glow">
                                                    <Clock size={24} />
                                                    <button 
                                                        onClick={() => handleDeleteShift(shift.id)}
                                                        className="btn btn-sm btn-danger rounded-circle position-absolute top-0 end-0 p-1 border-white border-opacity-25"
                                                        style={{ transform: 'translate(50%, -50%)', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    >
                                                        <Trash2 size={10} />
                                                    </button>
                                                </div>
                                                <div className="flex-grow-1 overflow-hidden">
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <h6 className="mb-0 fw-bold text-main text-truncate">{shift.name}</h6>
                                                        <button 
                                                            onClick={() => handleEditShift(shift)}
                                                            className="btn btn-link text-primary p-0 border-0 opacity-50 hover-opacity-100 transition-all"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                    </div>
                                                    <span className="text-muted fw-black opacity-50" style={{fontSize: '8px', textTransform: 'uppercase'}}>Identity: {shift.id}</span>
                                                </div>
                                            </div>
                                            <div className="d-flex justify-content-between border-top pt-3 border-white border-opacity-5 mt-2">
                                                <div className="text-center px-2 border-end border-white border-opacity-5 flex-grow-1">
                                                    <p className="text-muted small mb-0 fw-bold text-uppercase opacity-50" style={{fontSize: '8px'}}>START</p>
                                                    <span className="fw-black text-main">{shift.startTime.slice(0, 5)}</span>
                                                </div>
                                                <div className="text-center px-2 flex-grow-1">
                                                    <p className="text-muted small mb-0 fw-bold text-uppercase opacity-50" style={{fontSize: '8px'}}>END</p>
                                                    <span className="fw-black text-main">{shift.endTime.slice(0, 5)}</span>
                                                </div>
                                            </div>
                                            <div className="mt-3 bg-primary bg-opacity-10 p-2 rounded-3 text-center border border-primary border-opacity-10">
                                                <span className="small fw-black text-primary text-uppercase" style={{fontSize: '9px'}}>ALLOWED GRACE: {shift.graceMinutes} MINS</span>
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
