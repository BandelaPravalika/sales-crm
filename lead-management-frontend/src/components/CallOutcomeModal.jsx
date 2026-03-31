import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
  ArrowLeft, Mail, Phone, BookOpen, MessageSquare, 
  CheckCircle, Plus, Calendar, AlertCircle, ShieldCheck, User, Zap, IndianRupee, Copy, MessageCircle,
  Clock
} from 'lucide-react';
import { toast } from 'react-toastify';
import associateService from '../services/associateService';
import adminService from '../services/adminService';

const CallOutcomeModal = ({ isOpen, onClose, lead, onSubmit, theme, onSendPaymentLink }) => {
  const [outcome, setOutcome] = useState('CONTACTED');
  const [note, setNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('499');
  const [taskData, setTaskData] = useState({ title: '', taskType: 'FOLLOW_UP', dueDate: '', description: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isDurationLoading, setIsDurationLoading] = useState(false);
  
  const userRole = localStorage.getItem('role');
  const isAdminOrManager = ['ADMIN', 'MANAGER'].includes(userRole);

  useEffect(() => {
    if (lead) {
      setOutcome(lead.status === 'NEW' ? 'CONTACTED' : lead.status);
    }
  }, [lead]);

  if (!isOpen || !lead) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const scheduledDate = (outcome === 'EMI' || outcome === 'FOLLOW_UP') ? followUpDate : null;
      
      await onSubmit({
        status: outcome,
        note: note,
        followUpDate: scheduledDate
      });

      // Also record as a Persistent Task if date is provided
      if (scheduledDate) {
        await associateService.addLeadTask(lead.id, {
          title: outcome === 'EMI' ? 'EMI Collection' : 'Follow-up Call',
          description: note,
          dueDate: scheduledDate.includes('T') ? scheduledDate : `${scheduledDate}T10:00:00`,
          taskType: outcome
        });
        toast.success('Task added to planner');
      }

      setShowAddNote(false);
      setNote('');
    } catch (err) {
      toast.error('Failed to log outcome');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Online payment generation removed. 
  // Manual payments are now the only supported workflow.


  const handleFileUpload = async () => {
    if (!selectedFile) return toast.warning('Please select an audio file first.');
    
    setIsUploading(true);
    try {
      await adminService.uploadCallRecord({
        file: selectedFile,
        leadId: lead.id,
        phoneNumber: lead.mobile,
        callType: 'OUTGOING',
        status: outcome,
        note: note || 'Individual manual upload from Lead Details',
        duration: audioDuration
      });
      toast.success('Call record uploaded successfully!');
      setSelectedFile(null);
      setAudioDuration(0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const isDarkMode = theme === 'dark';
  
  // Define pipeline stages
  const pipelineStages = [
    { id: 'NEW', label: 'New', color: 'primary' },
    { id: 'WORKING', label: 'Working', color: 'info' },
    { id: 'PENDING_MESSAGES', label: 'Messages', color: 'primary' },
    { id: 'RETRY', label: 'Retry', color: 'warning' },
    { id: 'CONTACTED', label: 'Contacted', color: 'info' },
    { id: 'INTERESTED', label: 'Interested', color: 'warning' },
    { id: 'FOLLOW_UP', label: 'Under Review', color: 'secondary' },
    { id: 'PAID', label: 'Converted', color: 'success' },
    { id: 'LOST', label: 'Lost', color: 'danger' }
  ];

  // Map backend status to stepper index
  const getStageIndex = (status) => {
    switch(status) {
      case 'NEW': return 0;
      case 'WORKING': return 1;
      case 'PENDING_MESSAGES': return 2;
      case 'RETRY': return 3;
      case 'CONTACTED': return 4;
      case 'INTERESTED': return 5;
      case 'FOLLOW_UP': return 6;
      case 'PAID': return 7;
      case 'LOST': return 8;
      default: return 0;
    }
  };

  const currentStageIndex = getStageIndex(lead.status);
  const selectedStageIndex = getStageIndex(outcome);

  // Helper date formatter
  const formatDate = (dateString) => {
    if (!dateString) return 'System Time';
    return new Date(dateString).toLocaleString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true 
    });
  };

  const modalContent = (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10500, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* Fullscreen modal with specific background color matching demo */}
      <div className="modal-dialog modal-fullscreen m-0 h-100" style={{ maxWidth: '100vw' }}>
        <div className={`modal-content border-0 rounded-0 h-100 bg-dark`} style={{ backgroundColor: '#0B0F1A', color: '#fff' }}>
          
          {/* Top Header - Premium Glassmorphism */}
          <div className="px-4 py-3 border-bottom border-white border-opacity-5 glass-header d-flex align-items-center justify-content-between sticky-top" style={{ zIndex: 10 }}>
            <div className="d-flex align-items-center gap-3">
              <button 
                type="button" 
                className="btn btn-dark p-2 text-decoration-none rounded-circle transition-all border-white border-opacity-10 hover-bg-primary hover-text-white shadow-soft" 
                onClick={onClose}
              >
                <ArrowLeft size={20} />
              </button>
              <h4 className="fw-black mb-0 d-flex align-items-center gap-3 text-white tracking-tighter">
                {lead.name}
                <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill small fw-black ls-1" style={{ fontSize: '0.6em', padding: '0.4em 1em', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                  ALPHA-NODE-{lead.id || '1000'}
                </span>
              </h4>
            </div>
            
            <div className="d-flex align-items-center gap-4">
              <div className="text-end d-none d-md-block">
                <span className="fw-black small text-primary text-uppercase tracking-widest d-block ls-2">Interaction Portal</span>
                <span className="text-muted small fw-bold opacity-50">Operational Intelligence Module</span>
              </div>
            </div>
          </div>
          
          {/* Main Layout Grid */}
          <div className="container-fluid p-4 overflow-auto custom-scroll" style={{ flexGrow: 1, minHeight: 0 }}>
            <div className="row g-4" style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '2rem' }}>
              
              {/* LEFT COLUMN: Profile & Quick Actions */}
              <div className="col-12 col-lg-4 d-flex flex-column gap-4">
                
                {/* Profile Card */}
                <div className={`card shadow-sm border-0 rounded-4 overflow-hidden position-relative ${isDarkMode ? 'bg-secondary bg-opacity-10' : 'bg-white'}`}>
                  {/* Top color bar matching screenshot */}
                  <div className="bg-primary bg-gradient" style={{ height: '4px', width: '100%' }}></div>
                  
                  <div className="card-body p-4">
                    <div className="d-flex flex-column align-items-center text-center mb-4">
                      <div 
                        className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center text-primary fw-bold mb-3 shadow-sm border border-primary border-opacity-25" 
                        style={{ width: '80px', height: '80px', fontSize: '2rem' }}
                      >
                        {lead.name ? lead.name.charAt(0).toUpperCase() : <User />}
                      </div>
                      <h4 className={`fw-bold mb-1 ${isDarkMode ? 'text-white' : 'text-dark'}`}>{lead.name}</h4>
                      <div className="d-flex align-items-center justify-content-center gap-1 text-muted small">
                        <User size={12} /> <span className="fw-medium">Assigned Lead</span>
                      </div>
                    </div>
                    
                    <div className="d-flex flex-column gap-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="p-2 bg-light text-muted rounded-circle"><Mail size={16} /></div>
                        <span className={`small fw-medium ${isDarkMode ? 'text-white text-opacity-75' : 'text-dark text-opacity-75'}`}>{lead.email || 'No email provided'}</span>
                      </div>
                      <div className="d-flex align-items-center gap-3">
                        <div className="p-2 bg-light text-muted rounded-circle"><Phone size={16} /></div>
                        <span className={`small fw-medium ${isDarkMode ? 'text-white text-opacity-75' : 'text-dark text-opacity-75'}`}>{lead.mobile || 'No number provided'}</span>
                      </div>
                      <div className="d-flex align-items-center gap-3">
                        <div className="p-2 bg-light text-muted rounded-circle"><BookOpen size={16} /></div>
                        <span className={`small fw-medium ${isDarkMode ? 'text-white text-opacity-75' : 'text-dark text-opacity-75'}`}>{lead.courseName || 'Lead Inquiry'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions Card */}
                <div className={`card shadow-sm border-0 rounded-4 overflow-hidden p-4 ${isDarkMode ? 'bg-secondary bg-opacity-10' : 'bg-white'}`}>
                  <h6 className={`fw-bold text-uppercase mb-3 tracking-wider small ${isDarkMode ? 'text-white text-opacity-50' : 'text-muted'}`}>Quick Actions</h6>
                  
                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <a href={`tel:${lead.mobile}`} className="btn btn-outline-success w-100 fw-bold rounded-3 d-flex align-items-center justify-content-center gap-2 py-2">
                         <Phone size={16} /> Call
                      </a>
                    </div>
                    <div className="col-6">
                      <a href={`mailto:${lead.email}`} className="btn btn-outline-primary w-100 fw-bold rounded-3 d-flex align-items-center justify-content-center gap-2 py-2" onClick={(e) => !lead.email && e.preventDefault()}>
                         <Mail size={16} /> Email
                      </a>
                    </div>
                  </div>
                  
                  <div className="d-flex flex-column gap-3">
                    <a 
                      href={`https://wa.me/${lead.mobile?.replace(/\D/g, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn w-100 fw-bold rounded-3 d-flex align-items-center justify-content-center gap-2 py-2 text-white shadow-sm border-0"
                      style={{ backgroundColor: '#128c7e' }}
                    >
                      <MessageSquare size={16} /> WhatsApp
                    </a>
                  </div>

                  <div className="mt-4 border-top border-secondary border-opacity-10 pt-3">
                    <h6 className={`fw-bold text-uppercase mb-2 tracking-wider small ${isDarkMode ? 'text-white text-opacity-50' : 'text-muted'}`}>Upload Call Recording</h6>
                    <div className="d-flex flex-column gap-2">
                      <label className="small text-muted mb-1">MP3 / WAV file</label>
                      <input 
                        type="file" 
                        accept="audio/*"
                        className="form-control form-control-sm bg-dark text-white border-secondary border-opacity-25"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          setSelectedFile(file);
                          setIsDurationLoading(true);
                          
                          // Auto-detect duration from audio metadata
                          const url = URL.createObjectURL(file);
                          const audio = new Audio(url);
                          audio.addEventListener('loadedmetadata', () => {
                            const secs = Math.round(audio.duration) || 0;
                            setAudioDuration(secs);
                            setIsDurationLoading(false);
                            URL.revokeObjectURL(url);
                          });
                          audio.addEventListener('error', () => {
                            setIsDurationLoading(false);
                            toast.error("Could not read audio duration");
                          });
                        }}
                      />
                      {selectedFile && (
                        <div className="d-flex align-items-center gap-2 mt-1">
                          <Clock size={12} className="text-muted" />
                          <input
                            type="number"
                            min="0"
                            className="form-control form-control-sm bg-dark text-white border-secondary border-opacity-25"
                            style={{ maxWidth: '120px' }}
                            value={audioDuration}
                            onChange={(e) => setAudioDuration(parseInt(e.target.value) || 0)}
                          />
                          <span className="small text-muted">seconds</span>
                        </div>
                      )}
                        <button 
                        className="btn btn-sm btn-primary w-100 fw-bold d-flex align-items-center justify-content-center gap-2 py-2 mt-2 shadow-glow border-0"
                        disabled={!selectedFile || isUploading || isDurationLoading}
                        onClick={handleFileUpload}
                      >
                        {isUploading || isDurationLoading ? (
                          <span className="spinner-border spinner-border-sm"></span>
                        ) : (
                          <ShieldCheck size={14} />
                        )}
                        {isDurationLoading ? 'Detecting Length...' : 'Finalize Record Upload'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* TASK SCHEDULER WIDGET - Replaced Payments as requested */}
                <div className={`card shadow border-2 border-primary border-opacity-50 rounded-4 overflow-hidden animate-fade-in ${isDarkMode ? 'bg-secondary bg-opacity-10' : 'bg-white'}`}>
                  <div className="card-header bg-primary bg-opacity-10 border-0 p-3">
                    <h6 className="fw-bold text-primary mb-0 d-flex align-items-center gap-2">
                       <Calendar size={16} /> Schedule Next Activity
                    </h6>
                  </div>
                  <div className="card-body p-4">
                     <div className="d-flex flex-column gap-3">
                        <div>
                          <label className="form-label x-small fw-bold text-muted text-uppercase mb-1">Objective</label>
                          <input 
                            type="text" 
                            className={`form-control form-control-sm rounded-3 ${isDarkMode ? 'bg-dark text-white border-secondary border-opacity-25' : 'bg-light border-0'}`}
                            placeholder="e.g. Call for Admission"
                            value={taskData.title}
                            onChange={(e) => setTaskData({...taskData, title: e.target.value})}
                          />
                        </div>
                        <div className="row g-2">
                           <div className="col-6">
                              <label className="form-label x-small fw-bold text-muted text-uppercase mb-1">Type</label>
                              <select 
                                className={`form-select form-select-sm rounded-3 ${isDarkMode ? 'bg-dark text-white border-secondary border-opacity-25' : 'bg-light border-0'}`}
                                value={taskData.taskType}
                                onChange={(e) => setTaskData({...taskData, taskType: e.target.value})}
                              >
                                <option value="FOLLOW_UP">Follow-up</option>
                                <option value="EMI">EMI Call</option>
                                <option value="INVITATION">Invite</option>
                              </select>
                           </div>
                           <div className="col-6">
                              <label className="form-label x-small fw-bold text-muted text-uppercase mb-1">Due Date</label>
                              <input 
                                type="date" 
                                className={`form-control form-control-sm rounded-3 ${isDarkMode ? 'bg-dark text-white border-secondary border-opacity-25' : 'bg-light border-0'}`}
                                value={taskData.dueDate}
                                onChange={(e) => setTaskData({...taskData, dueDate: e.target.value})}
                              />
                           </div>
                        </div>
                        <button 
                          className="btn btn-primary btn-sm w-100 rounded-pill fw-bold py-2 mt-2 shadow-sm"
                          onClick={async () => {
                            if (!taskData.title || !taskData.dueDate) return toast.error("Title & Date required");
                            try {
                              await associateService.addLeadTask(lead.id, {
                                ...taskData,
                                dueDate: `${taskData.dueDate}T10:00:00`
                              });
                              toast.success("Task scheduled successfully!");
                              setTaskData({ title: '', taskType: 'FOLLOW_UP', dueDate: '', description: '' });
                            } catch (err) {
                              toast.error("Failed to schedule task");
                            }
                          }}
                        >
                          Confirm & Add Task
                        </button>
                     </div>
                  </div>
                </div>

              </div>
              
              {/* RIGHT COLUMN: Pipeline & Audit Timeline */}
              <div className="col-12 col-lg-8 d-flex flex-column gap-4">
                
                {/* Sales Pipeline Stage */}
                <div className={`card shadow-sm border-0 rounded-4 overflow-hidden p-4 ${isDarkMode ? 'bg-secondary bg-opacity-10' : 'bg-white'}`}>
                  <h6 className={`fw-bold mb-4 ${isDarkMode ? 'text-white' : 'text-dark'}`}>Sales Pipeline Stage</h6>
                  
                  <div className="d-flex justify-content-between position-relative align-items-center px-2 mb-4 w-100 overflow-auto py-2 custom-scroll" style={{ whiteSpace: 'nowrap' }}>
                    {/* Connecting background line */}
                    <div className="position-absolute bg-secondary bg-opacity-25" style={{ height: '2px', top: '50%', left: '5%', right: '5%', zIndex: 1 }}></div>

                    {pipelineStages.map((stage, index) => {
                      const isCompleted = currentStageIndex >= index;
                      const isCurrent = currentStageIndex === index;
                      const isSelected = selectedStageIndex === index;
                      
                      let btnClass = isDarkMode ? 'btn-outline-secondary text-white bg-dark' : 'btn-light border bg-white';
                      if (isCompleted || isSelected) {
                        btnClass = `bg-${stage.color} text-white border-0 shadow-sm`;
                      }

                      return (
                        <button 
                          key={stage.id} 
                          className={`btn rounded-pill d-flex align-items-center gap-2 px-3 py-1 position-relative fw-bold mx-1 transition-smooth`}
                          style={{ zIndex: 2, fontSize: '0.8rem', minWidth: '120px', justifyContent: 'center' }}
                          onClick={() => setOutcome(stage.id)}
                        >
                          {(isCompleted || isSelected) && <CheckCircle size={14} />} 
                          {!isCompleted && !isSelected && <div className="rounded-circle bg-secondary bg-opacity-50" style={{ width: '6px', height: '6px' }}></div>}
                          {stage.label}
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="d-flex align-items-center gap-2 text-muted small mt-2">
                    <AlertCircle size={14} /> 
                    <span>Users can only move leads to the next immediate logical stage. Select a stage to configure update log.</span>
                  </div>
                </div>

                {/* Task Planner & Engagement Card */}
                <div className={`card shadow-sm border-0 rounded-4 overflow-hidden p-4 mb-4 ${isDarkMode ? 'bg-secondary bg-opacity-10' : 'bg-white'}`}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className={`fw-bold mb-0 text-uppercase small tracking-widest ${isDarkMode ? 'text-white text-opacity-50' : 'text-muted'}`}>
                      Next Professional Engagement
                    </h6>
                    <div className="badge bg-primary bg-opacity-10 text-primary px-2 py-1 rounded-pill small">Engagement Planner</div>
                  </div>
                  
                  {/* Engagement Planner */}
                  <div className={`p-3 rounded-4 mb-3 border ${isDarkMode ? 'bg-dark bg-opacity-50 border-secondary border-opacity-25' : 'bg-light border-light'}`}>
                    {lead.followUpDate ? (
                    <div className="p-3 rounded-4 bg-primary bg-opacity-10 border border-primary border-opacity-25 animate-fade-in">
                       <div className="d-flex justify-content-between align-items-start mb-2">
                          <div className="d-flex align-items-center gap-2 text-primary">
                             <Clock size={16} />
                             <span className="fw-bold small text-uppercase">Scheduled Follow-up</span>
                          </div>
                          <span className="badge bg-primary rounded-pill small">{lead.followUpType || 'ACTIVE'}</span>
                       </div>
                       <h5 className={`fw-black mb-1 ${isDarkMode ? 'text-white' : 'text-dark'}`}>{new Date(lead.followUpDate).toLocaleString()}</h5>
                       <p className="small text-muted mb-3 italic">This task will appear in your main TaskBoard for focus tracking.</p>
                       <button className="btn btn-sm btn-primary w-100 rounded-pill fw-bold py-2" onClick={() => setShowAddNote(true)}>
                          Update / Reschedule
                       </button>
                    </div>
                  ) : (
                    <div className="p-4 text-center rounded-4 border border-dashed border-secondary border-opacity-25 opacity-75">
                       <Calendar size={32} className="text-muted mb-3" />
                       <h6 className="fw-bold text-muted mb-2">No Future Tasks</h6>
                       <p className="x-small text-muted mb-3 px-3">Schedule a follow-up or EMI collection to ensure this lead doesn't go cold.</p>
                       <button className="btn btn-sm btn-outline-primary rounded-pill px-4 fw-bold" onClick={() => setShowAddNote(true)}>
                          <Plus size={14} className="me-1" /> Schedule Task
                       </button>
                    </div>
                  )}
                </div>
              </div>

                {/* Interaction Log Input - Shown when 'Add Note' is clicked or when changing state */}
                {showAddNote && (
                  <div className={`card shadow border border-primary border-opacity-25 border-2 rounded-4 overflow-hidden animate-fade-in ${isDarkMode ? 'bg-dark' : 'bg-white'}`}>
                    <div className="card-header bg-primary bg-opacity-10 border-0 p-3">
                      <h6 className="fw-bold text-primary mb-0 d-flex align-items-center gap-2">
                        <Plus size={16} /> Append New Interaction
                      </h6>
                    </div>
                    <div className="card-body p-4">
                       <form id="callOutcomeForm" onSubmit={handleSubmit}>
                          <div className="row g-3">
                            <div className="col-12 col-md-6">
                              <label className="form-label small fw-bold text-uppercase text-muted mb-2 tracking-wider">Status Override</label>
                              <select 
                                className={`form-select fw-bold shadow-sm ${isDarkMode ? 'bg-secondary bg-opacity-25 text-white border-secondary border-opacity-50' : 'bg-light text-dark'}`}
                                value={outcome}
                                onChange={(e) => setOutcome(e.target.value)}
                                style={{ cursor: 'pointer' }}
                              >
                                {pipelineStages.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                <option value="EMI">EMI PLAN SCHEDULED</option>
                              </select>
                            </div>

                            {(outcome === 'EMI' || outcome === 'FOLLOW_UP') && (
                              <div className="col-12 col-md-6 animate-fade-in">
                                <label className="form-label small fw-bold text-uppercase text-primary mb-2 tracking-wider">
                                  {outcome === 'EMI' ? 'Next EMI Installment Date' : 'Scheduled Follow-up Date'}
                                </label>
                                <div className={`input-group rounded-3 overflow-hidden shadow-sm ${isDarkMode ? 'bg-secondary bg-opacity-25 border border-secondary border-opacity-50' : 'bg-light border'}`}>
                                  <span className="input-group-text border-0 bg-transparent text-primary"><Calendar size={18} /></span>
                                  <input 
                                    type="datetime-local" 
                                    className={`form-control border-0 bg-transparent shadow-none fw-bold ${isDarkMode ? 'text-white' : 'text-dark'}`}
                                    value={followUpDate}
                                    onChange={(e) => setFollowUpDate(e.target.value)}
                                    required
                                  />
                                </div>
                              </div>
                            )}

                            <div className="col-12 mt-3">
                              <label className="form-label small fw-bold text-uppercase text-muted mb-2 tracking-wider">Historical Note</label>
                              <div className={`rounded-3 overflow-hidden d-flex shadow-sm ${isDarkMode ? 'bg-secondary bg-opacity-25 border border-secondary border-opacity-50' : 'bg-light border'}`}>
                                <span className={`p-3 border-end ${isDarkMode ? 'text-white border-secondary border-opacity-50 text-opacity-50' : 'text-muted border-light'}`}>
                                  <MessageSquare size={18} />
                                </span>
                                <textarea 
                                  className={`form-control border-0 bg-transparent shadow-none py-3 ${isDarkMode ? 'text-white' : 'text-dark'}`}
                                  rows="3" 
                                  placeholder="Enter discussion details, lead requirements, etc..."
                                  value={note}
                                  onChange={(e) => setNote(e.target.value)}
                                  required
                                ></textarea>
                              </div>
                            </div>
                          </div>
                          
                          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top border-secondary border-opacity-10">
                            <button type="button" className={`btn btn-link text-decoration-none fw-bold small ${isDarkMode ? 'text-white text-opacity-50' : 'text-muted'}`} onClick={() => setShowAddNote(false)}>Discard</button>
                            <button 
                              type="submit" 
                              className="btn btn-primary rounded-pill fw-bold text-uppercase px-4 py-2 shadow-sm d-flex align-items-center gap-2"
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? (
                                <span className="spinner-border spinner-border-sm"></span>
                              ) : (
                                <ShieldCheck size={16} />
                              )}
                              Save Log Entry
                            </button>
                          </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Audit & Activity Timeline Card */}
                <div className={`card shadow-sm border-0 rounded-4 overflow-hidden p-4 flex-grow-1 ${isDarkMode ? 'bg-secondary bg-opacity-10' : 'bg-white'}`}>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h6 className={`fw-bold mb-0 ${isDarkMode ? 'text-white' : 'text-dark'}`}>Audit & Activity Timeline</h6>
                    {!showAddNote && (
                      <button 
                        className="btn btn-sm btn-outline-primary rounded-pill fw-bold d-flex align-items-center gap-1 px-3"
                        onClick={() => setShowAddNote(true)}
                      >
                        <Plus size={14} /> Add Note
                      </button>
                    )}
                  </div>
                  
                  {/* Timeline Logic */}
                  <div className="position-relative ps-4 py-2 h-100">
                    {/* Vertical Timeline Bar */}
                    <div className="position-absolute bg-primary bg-opacity-25" style={{ width: '2px', top: '10px', bottom: '0', left: '11px' }}></div>
                    
                    {/* Current Historical Note / Latest Note */}
                    {lead.note ? (
                      <div className="position-relative mb-4">
                         <div className="position-absolute bg-primary rounded-circle shadow-sm" style={{ width: '10px', height: '10px', left: '-31px', top: '6px' }}></div>
                         <div className={`p-3 rounded-3 shadow-sm border ${isDarkMode ? 'bg-dark border-secondary border-opacity-25' : 'bg-light border-light'}`} style={{ backgroundColor: isDarkMode ? '#1a1a1a' : '#fffdf3' }}>
                            <h6 className="small fw-bold text-warning text-uppercase mb-2 d-flex align-items-center gap-2">
                               <MessageSquare size={12} /> INTERNAL NOTE
                            </h6>
                            <p className={`mb-2 fw-medium ${isDarkMode ? 'text-white' : 'text-dark'}`}>{lead.note}</p>
                            <div className="d-flex align-items-center gap-3 text-muted small">
                              <span className="d-flex align-items-center gap-1"><User size={12} /> System Admin</span>
                              <span className="d-flex align-items-center gap-1"><Calendar size={12} /> {formatDate(lead.updatedAt || lead.createdAt)}</span>
                              <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill">{lead.status}</span>
                            </div>
                         </div>
                      </div>
                    ) : null}

                    {/* Origination Log */}
                    <div className="position-relative">
                       <div className="position-absolute bg-secondary bg-opacity-50 rounded-circle shadow-sm" style={{ width: '10px', height: '10px', left: '-31px', top: '6px' }}></div>
                       <div className={`p-3 rounded-3 shadow-sm border ${isDarkMode ? 'bg-dark border-secondary border-opacity-25' : 'bg-white border-light'}`}>
                          <h6 className="small fw-bold text-primary text-uppercase mb-2 d-flex align-items-center gap-2">
                             <CheckCircle size={12} /> LEAD CREATED
                          </h6>
                          <p className={`mb-2 font-monospace small ${isDarkMode ? 'text-white text-opacity-75' : 'text-muted'}`}>Lead L-{lead.id} added to pipeline.</p>
                          <div className="d-flex align-items-center gap-2 text-muted small">
                            <Calendar size={12} /> {formatDate(lead.createdAt)}
                          </div>
                       </div>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default CallOutcomeModal;
