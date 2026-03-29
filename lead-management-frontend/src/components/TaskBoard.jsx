import React, { useState, useMemo } from 'react';
import { Search, Filter, Clock, AlertCircle, Calendar, User, AlignLeft, CheckSquare, RefreshCw } from 'lucide-react';
import CallOutcomeModal from './CallOutcomeModal';
import ManualTaskModal from './ManualTaskModal';
import associateService from '../services/associateService';

const TaskBoard = ({ leads, theme, onUpdateStatus, fetchLeads }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedLead, setSelectedLead] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [cloudTasks, setCloudTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reschedulingTask, setReschedulingTask] = useState(null);
  
  const isDarkMode = theme === 'dark';

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await associateService.fetchHierarchicalTasks();
      // FIX: Robust check for array data to prevent .map() failure
      const taskData = Array.isArray(res.data) ? res.data : [];
      setCloudTasks(taskData);
    } catch (err) {
      console.error("Task fetch failed", err);
      setCloudTasks([]); // Fallback to empty list on error
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadTasks();
  }, [leads]);

  // Extract valid tasks from cloud data
  const tasks = useMemo(() => {
    // FIX: Double-layer safety check for array mapping
    if (!Array.isArray(cloudTasks)) return [];

    return cloudTasks.map(t => {
      // Calculate Priority based on due date
      let priority = 'Low';
      let priorityColor = 'success';
      let timeString = 'No date set';
      
      if (t.dueDate) {
        const due = new Date(t.dueDate);
        const now = new Date();
        const diffMs = due - now;
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        const diffHours = diffMs / (1000 * 60 * 60);
        
        if (diffHours < 0) {
          priority = 'High';
          priorityColor = 'danger';
          timeString = Math.abs(diffHours) < 24 ? `Due ${Math.abs(Math.round(diffHours))}h ago` : `Due ${Math.abs(Math.round(diffDays))}d ago`;
        } else if (diffDays <= 1) {
          priority = 'Medium';
          priorityColor = 'warning';
          timeString = `Due in ${Math.round(diffHours)}h`;
        } else {
          priority = 'Low';
          priorityColor = 'success';
          timeString = `Due in ${Math.round(diffDays)}d`;
        }
      }

      return {
        ...t,
        name: t.lead?.name || 'System Task',
        priority,
        priorityColor,
        timeString,
        isOverdue: priority === 'High'
      };
    }).sort((a, b) => {
      const aVal = a.priority === 'High' ? 0 : a.priority === 'Medium' ? 1 : 2;
      const bVal = b.priority === 'High' ? 0 : b.priority === 'Medium' ? 1 : 2;
      if (aVal !== bVal) return aVal - bVal;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [cloudTasks]);

  // Apply Search and Filters
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            task.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesDate = true;
      if (dateFilter) {
        const taskDateStr = new Date(task.dueDate).toISOString().split('T')[0];
        matchesDate = taskDateStr === dateFilter;
      }
      
      let matchesStatus = true;
      if (statusFilter !== 'ALL') {
        matchesStatus = task.priority.toUpperCase() === statusFilter.toUpperCase();
      }
      
      return matchesSearch && matchesDate && matchesStatus;
    });
  }, [tasks, searchTerm, dateFilter, statusFilter]);

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      await associateService.updateTaskStatus(taskId, newStatus);
      toast.success(`Task marked as ${newStatus.toLowerCase()}`);
      loadTasks();
    } catch (err) {
      toast.error("Failed to update task status");
    }
  };

  const handleLogInteraction = async (data) => {
    if (selectedLead && onUpdateStatus) {
       const leadId = selectedLead.lead?.id || selectedLead.leadId;
       await onUpdateStatus(leadId, data.status, data.note, data.followUpDate);
       setSelectedLead(null);
       loadTasks(); // Refresh list
    }
  };

  return (
    <div className="d-flex flex-column gap-4 animate-fade-in pb-5">
      
      {/* Header section with Refresh */}
      <div className="d-flex align-items-center justify-content-between mb-2">
        <div>
          <h4 className="fw-black text-white mb-0 tracking-tight">Active Assignments</h4>
          <p className="text-secondary small fw-bold mb-0">Priority-ranked tasks following your team hierarchy.</p>
        </div>
        <div className="d-flex align-items-center gap-3">
          <button 
             className="btn btn-primary rounded-pill px-4 fw-black text-uppercase small d-flex align-items-center gap-2 shadow-sm transition-all hover-scale"
             onClick={() => setShowTaskModal(true)}
          >
             <CheckSquare size={16} /> Add Task
          </button>
          <button 
             className="btn btn-dark rounded-circle p-2 border-secondary border-opacity-25 shadow-sm transition-all hover-scale"
             onClick={loadTasks}
             disabled={loading}
             title="Sync Tasks"
          >
             <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
      
      {/* Search and Filters Bar - SOLID DARK */}
      <div className="p-4 rounded-4 shadow-sm border border-secondary border-opacity-10" style={{ background: '#131826' }}>
        <div className="row g-3">
          {/* Search Input */}
          <div className="col-12 col-lg-5">
            <div className="input-group bg-dark bg-opacity-50 rounded-4 overflow-hidden border border-secondary border-opacity-25 focus-within-primary transition-all">
              <span className="input-group-text border-0 bg-transparent text-secondary px-3"><Search size={18} /></span>
              <input 
                type="text" 
                className="form-control border-0 bg-transparent shadow-none text-white py-2 fw-bold"
                placeholder="Search by keyword, client or note..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* Date Filter */}
          <div className="col-12 col-md-6 col-lg-4">
             <div className="input-group bg-dark bg-opacity-50 rounded-4 overflow-hidden border border-secondary border-opacity-25 focus-within-primary transition-all">
              <span className="input-group-text border-0 bg-transparent text-secondary px-3"><Calendar size={18} /></span>
              <input 
                type="date" 
                className="form-control border-0 bg-transparent shadow-none text-white py-2 fw-bold"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
              {dateFilter && (
                <button className="btn btn-link px-3 text-secondary text-decoration-none fw-bold" onClick={() => setDateFilter('')}>CLEAR</button>
              )}
            </div>
          </div>
          
          {/* Priority Status Dropdown */}
          <div className="col-12 col-md-6 col-lg-3">
             <div className="input-group bg-dark bg-opacity-50 rounded-4 overflow-hidden border border-secondary border-opacity-25 focus-within-primary transition-all">
              <span className="input-group-text border-0 bg-transparent text-secondary px-3"><Filter size={18} /></span>
              <select 
                className="form-select border-0 bg-transparent shadow-none text-white py-2 fw-bold"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                <option value="ALL" style={{ background: '#1a1f2e' }}>All Priorities</option>
                <option value="HIGH" style={{ background: '#1a1f2e' }}>High Priority</option>
                <option value="MEDIUM" style={{ background: '#1a1f2e' }}>Today's Tasks</option>
                <option value="LOW" style={{ background: '#1a1f2e' }}>Future Schedule</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Task List container */}
      <div className="d-flex flex-column gap-3">
        {loading ? (
          <div className="text-center p-5">
             <RefreshCw size={40} className="text-primary animate-spin mb-3 opacity-50" />
             <p className="text-secondary fw-black text-uppercase small tracking-widest">Accessing Ledger...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-5 text-center rounded-4 border border-secondary border-opacity-10 shadow-sm" style={{ background: '#131826' }}>
            <div className="bg-dark bg-opacity-50 inline-block p-4 rounded-circle mb-4">
               <CheckSquare size={48} className="text-secondary opacity-25" />
            </div>
            <h5 className="fw-black text-white text-uppercase tracking-wider">Mission Accomplished</h5>
            <p className="text-secondary small fw-bold mb-0">Your pipeline is clear for this selection.</p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div 
              key={task.id} 
              className="card shadow-lg border-secondary border-opacity-10 rounded-4 overflow-hidden transition-all hover-bg-opaque"
              style={{ cursor: 'pointer', background: '#131826' }}
              onClick={() => setSelectedLead(task)}
            >
               <div className="card-body p-4 d-flex gap-4">
                  {/* Task Status Indicator */}
                  <div className="flex-shrink-0 pt-1">
                    <div className={`p-3 rounded-circle bg-opacity-10 border border-opacity-20 d-flex align-items-center justify-content-center bg-${task.priorityColor} border-${task.priorityColor}`}>
                       {task.isOverdue ? (
                         <AlertCircle className="text-danger" size={24} />
                       ) : (
                         <Clock className="text-warning" size={24} />
                       )}
                    </div>
                  </div>
                  
                  {/* Task Content */}
                  <div className="flex-grow-1">
                     <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start mb-3 gap-2">
                        <div>
                          <h5 className="fw-black text-white mb-1 tracking-tight">
                             {task.status === 'EMI' ? 'EMI Collection Call' : 'Follow up Interaction'}
                          </h5>
                          <span className="text-primary fw-bold small text-uppercase tracking-widest">{task.name}</span>
                        </div>
                        <span className={`badge bg-${task.priorityColor} bg-opacity-20 text-${task.priorityColor} rounded-pill px-4 py-2 border border-${task.priorityColor} border-opacity-25 fw-black text-uppercase small`}>
                          {task.priority} Priority
                        </span>
                     </div>
                     
                     <div className="bg-dark bg-opacity-50 p-3 rounded-4 border border-secondary border-opacity-10 mb-4 shadow-inner">
                        <div className="d-flex gap-3">
                           <AlignLeft size={16} className="text-secondary flex-shrink-0 mt-1" />
                           <p className="mb-0 text-secondary fw-bold small leading-relaxed">
                              {task.note || 'Manual system follow-up generated. Please evaluate lead status and document interaction outcome.'}
                           </p>
                        </div>
                     </div>
                     
                     {/* Task Meta Footer */}
                     <div className="d-flex flex-wrap align-items-center gap-4 text-secondary" style={{ fontSize: '11px' }}>
                        <div className={`fw-black text-uppercase tracking-widest d-flex align-items-center gap-2 ${task.isOverdue ? 'text-danger' : 'text-warning'}`}>
                          <Calendar size={14} /> {task.timeString}
                        </div>
                        <div className="d-flex align-items-center gap-2 fw-black text-uppercase tracking-widest text-white text-opacity-75">
                          <User size={14} /> {task.name.split(' ')[0]}
                        </div>
                        <div className="bg-primary bg-opacity-10 text-primary px-3 py-1 rounded-pill fw-black text-uppercase tracking-widest" style={{ fontSize: '9px' }}>
                          Assigned: {task.assignedTo?.name || 'Self'}
                        </div>
                        
                        {/* Task Actions: Complete / Reschedule */}
                        <div className="ms-auto d-flex gap-2">
                           {task.status === 'PENDING' && (
                             <>
                               <button 
                                 className="btn btn-sm btn-outline-success rounded-pill fw-bold px-3 d-flex align-items-center gap-1"
                                 style={{ fontSize: '10px' }}
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   handleUpdateTaskStatus(task.id, 'COMPLETED');
                                 }}
                               >
                                 <CheckSquare size={12} /> Complete
                               </button>
                               <button 
                                 className="btn btn-sm btn-outline-warning rounded-pill fw-bold px-3 d-flex align-items-center gap-1"
                                 style={{ fontSize: '10px' }}
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   setReschedulingTask(task);
                                   setShowTaskModal(true);
                                 }}
                               >
                                 <Calendar size={12} /> Reschedule
                               </button>
                             </>
                           )}
                           {task.status !== 'PENDING' && (
                             <span className={`badge bg-${task.status === 'COMPLETED' ? 'success' : 'secondary'} bg-opacity-10 text-${task.status === 'COMPLETED' ? 'success' : 'secondary'} rounded-pill px-3 fw-bold border border-${task.status === 'COMPLETED' ? 'success' : 'secondary'} border-opacity-25`}>
                               {task.status}
                             </span>
                           )}
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          ))
        )}
      </div>

      {/* Reused Lead Detail Modal Workspace! */}
      <CallOutcomeModal 
         isOpen={!!selectedLead} 
         onClose={() => setSelectedLead(null)} 
         lead={selectedLead?.lead || selectedLead} 
         theme={theme}
         onSubmit={handleLogInteraction} 
      />
      <ManualTaskModal 
         show={showTaskModal} 
         onClose={() => {
           setShowTaskModal(false);
           setReschedulingTask(null);
         }} 
         onTaskCreated={() => {
           if (reschedulingTask) {
             handleUpdateTaskStatus(reschedulingTask.id, 'RESCHEDULED');
           }
           loadTasks();
         }} 
         leads={leads} 
         initialData={reschedulingTask ? {
           leadId: reschedulingTask.lead?.id || reschedulingTask.leadId,
           title: `RESCHEDULED: ${reschedulingTask.title}`,
           description: reschedulingTask.description,
           taskType: reschedulingTask.taskType
         } : null}
      />

      <style>{`
        .fw-black { font-weight: 900; }
        .focus-within-primary:focus-within { border-color: #6366f1 !important; box-shadow: 0 0 0 0.25rem rgba(99, 102, 241, 0.25) !important; outline: 0; }
        .hover-bg-opaque:hover { border-color: rgba(99, 102, 241, 0.4) !important; transform: translateY(-4px); box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5) !important; }
        .animate-spin { animation: spin 1.5s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .tracking-tight { letter-spacing: -0.025em; }
        .tracking-widest { letter-spacing: 0.1em; }
        .hover-scale:hover { transform: scale(1.1); background-color: #1a1f2e !important; }
        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default TaskBoard;
