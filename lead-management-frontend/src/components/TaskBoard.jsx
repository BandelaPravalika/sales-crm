import React, { useState, useMemo } from 'react';
import { Search, Filter, Clock, AlertCircle, Calendar, User, AlignLeft, CheckSquare, RefreshCw, Plus } from 'lucide-react';
import CallOutcomeModal from './CallOutcomeModal';
import ManualTaskModal from './ManualTaskModal';
import associateService from '../services/associateService';
import { toast } from 'react-toastify';

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
      const s = searchTerm.toLowerCase();
      const matchesSearch =
        (task.title || "").toLowerCase().includes(s) ||
        (task.description || "").toLowerCase().includes(s) ||
        (task.name || "").toLowerCase().includes(s);

      let matchesDate = true;
      if (dateFilter) {
        if (!task.dueDate) return false;
        const taskDateStr = new Date(task.dueDate).toISOString().split('T')[0];
        matchesDate = taskDateStr === dateFilter;
      }

      let matchesStatus = true;
      if (statusFilter !== 'ALL') {
        matchesStatus = task.priority && task.priority.toUpperCase() === statusFilter.toUpperCase();
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

      {/* Unified Search, Filter and Action Bar */}
      <div className="p-4 rounded-4 shadow-sm border border-secondary border-opacity-10 bg-card mb-2">
        <div className="row g-3 align-items-center">
            {/* Search Input */}
            <div className="col-12 col-xl-5">
                <div className="input-group bg-surface bg-opacity-50 rounded-4 overflow-hidden border border-secondary border-opacity-25 focus-within-primary transition-all">
                    <span className="input-group-text border-0 bg-transparent text-muted px-3"><Search size={18} /></span>
                    <input
                        type="text"
                        className="form-control border-0 bg-transparent shadow-none text-main py-2.5 fw-black"
                        placeholder="Search tasks, students or notes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Date Filter & Status */}
            <div className="col-12 col-md-6 col-xl-4">
                <div className="d-flex gap-2">
                    <div className="input-group bg-surface bg-opacity-50 rounded-4 overflow-hidden border border-secondary border-opacity-25 focus-within-primary transition-all flex-grow-1">
                        <span className="input-group-text border-0 bg-transparent text-muted px-3"><Calendar size={18} /></span>
                        <input
                            type="date"
                            className="form-control border-0 bg-transparent shadow-none text-main py-2 fw-black"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                        />
                    </div>
                    <div className="input-group bg-surface bg-opacity-50 rounded-4 overflow-hidden border border-secondary border-opacity-25 focus-within-primary transition-all" style={{ width: '140px' }}>
                        <select
                            className="form-select border-0 bg-transparent shadow-none text-main py-2 fw-black"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="ALL">All States</option>
                            <option value="PENDING">Active</option>
                            <option value="COMPLETED">History</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="col-12 col-md-6 col-xl-3">
                <div className="d-flex gap-2 justify-content-md-end">
                    <button 
                        className="btn btn-primary rounded-4 px-4 py-2.5 fw-black text-uppercase small d-flex align-items-center gap-2 shadow-glow flex-grow-1 justify-content-center"
                        onClick={() => setShowTaskModal(true)}
                    >
                        <Plus size={18} /> ADD TASK
                    </button>
                    <button 
                        className="btn btn-dark rounded-4 px-3 py-2.5 border-secondary border-opacity-25 shadow-sm transition-all hover-up-sm"
                        onClick={loadTasks}
                        disabled={loading}
                        title="Force Sync"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* Task Stream */}
      <div className="d-flex flex-column gap-3">
        {loading ? (
          <div className="text-center p-5 animate-fade-in">
            <RefreshCw size={40} className="text-primary animate-spin mb-3 opacity-50" />
            <p className="text-muted fw-black text-uppercase small tracking-widest">Accessing Ledger...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-5 text-center rounded-4 border border-secondary border-opacity-10 shadow-sm bg-card animate-fade-in">
            <div className="bg-surface bg-opacity-50 inline-block p-4 rounded-circle mb-4">
              <CheckSquare size={48} className="text-muted opacity-25" />
            </div>
            <h5 className="fw-black text-main text-uppercase tracking-wider">Mission Accomplished</h5>
            <p className="text-muted small fw-bold mb-0">Your pipeline is clear for this selection.</p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div
              key={task.id}
              className={`card border-0 rounded-4 shadow-sm transition-all hover-shadow-lg overflow-hidden animate-slide-in ${isDarkMode ? 'bg-secondary bg-opacity-5' : 'bg-white'}`}
              style={{ cursor: 'pointer' }}
              onClick={() => setSelectedLead(task)}
            >
              <div className="card-body p-4">
                  <div className="d-flex flex-column flex-lg-row gap-4">
                    {/* Status Circle */}
                    <div className="d-flex flex-column align-items-center gap-2">
                        <div className={`p-3 rounded-circle d-flex align-items-center justify-content-center shadow-sm border border-opacity-10 ${task.status === 'COMPLETED' ? 'bg-success bg-opacity-10 border-success' : 'bg-primary bg-opacity-10 border-primary'}`}>
                            {task.status === 'COMPLETED' ? (
                            <CheckSquare className="text-success" size={24} />
                            ) : task.isOverdue ? (
                            <AlertCircle className="text-danger" size={24} />
                            ) : (
                            <Clock className="text-warning" size={24} />
                            )}
                        </div>
                    </div>
                   
                    {/* Task Content */}
                    <div className="flex-grow-1">
                      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start mb-3 gap-3">
                         <div>
                           <h5 className="fw-black text-main mb-1 tracking-tight">
                              {task.title || (task.status === 'EMI' ? 'EMI Collection Call' : 
                               task.status === 'COMPLETED' ? 'Interaction Documented' : 'Follow up Interaction')}
                           </h5>
                           <span className="text-primary fw-black small text-uppercase tracking-widest d-block mb-1">{task.name}</span>
                         </div>
                         <div className="d-flex flex-wrap align-items-center gap-2">
                           {task.status === 'COMPLETED' && (
                             <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-1.5 border border-success border-opacity-10 fw-black text-uppercase" style={{ fontSize: '9px' }}>
                               COMPLETED
                             </span>
                           )}
                           <span className={`badge bg-${task.priorityColor} bg-opacity-10 text-${task.priorityColor} rounded-pill px-3 py-1.5 border border-${task.priorityColor} border-opacity-10 fw-black text-uppercase shadow-sm`} style={{ fontSize: '9px' }}>
                             {task.priority || 'Low'} Priority
                           </span>
                        </div>
                     </div>

                     <div className="bg-surface bg-opacity-50 p-3 rounded-4 border border-secondary border-opacity-10 mb-4 shadow-sm">
                        <div className="d-flex gap-3">
                           <AlignLeft size={16} className="text-muted flex-shrink-0 mt-1 opacity-50" />
                           <p className="mb-0 text-muted fw-bold small leading-relaxed">
                              {task.description || 'Manual system follow-up generated. Please evaluate lead status and document interaction outcome.'}
                           </p>
                        </div>
                     </div>

                     <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                        <div className="d-flex flex-wrap align-items-center gap-4 text-muted" style={{ fontSize: '11px' }}>
                            <div className={`fw-black text-uppercase tracking-widest d-flex align-items-center gap-2 ${task.isOverdue ? 'text-danger animate-pulse' : 'text-primary'}`}>
                                <Calendar size={14} /> {task.status === 'COMPLETED' ? 'Node Closed' : task.timeString}
                            </div>
                            <div className="d-flex align-items-center gap-2 fw-black text-uppercase tracking-widest text-main opacity-75">
                                <User size={14} /> Assigned to {task.assignedTo?.name || 'Self'}
                            </div>
                        </div>

                        <div className="d-flex gap-2">
                            {task.status === 'PENDING' && (
                                <>
                                    <button 
                                        className="btn btn-sm btn-success rounded-pill fw-black px-4 py-2 d-flex align-items-center gap-2 shadow-sm border-0"
                                        style={{ fontSize: '10px' }}
                                        onClick={(e) => { e.stopPropagation(); handleUpdateTaskStatus(task.id, 'COMPLETED'); }}
                                    >
                                        <CheckSquare size={14} /> COMPLETE
                                    </button>
                                    <button 
                                        className="btn btn-sm btn-warning rounded-pill fw-black px-4 py-2 d-flex align-items-center gap-2 shadow-sm border-0 text-dark"
                                        style={{ fontSize: '10px' }}
                                        onClick={(e) => { e.stopPropagation(); setReschedulingTask(task); setShowTaskModal(true); }}
                                    >
                                        <Calendar size={14} /> RESCHEDULE
                                    </button>
                                </>
                            )}
                        </div>
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
