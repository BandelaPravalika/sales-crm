import { useState, useEffect } from 'react';
import managerService from '../../../services/managerService';
import { toast } from 'react-toastify';

export const useLeads = () => {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedLeadIds, setSelectedLeadIds] = useState([]);

    const loadLeads = async () => {
        setLoading(true);
        try {
            const res = await managerService.fetchLeads();
            setLeads(Array.isArray(res.data) ? res.data : (res.data?.content || []));
        } catch (err) {
            toast.error('Failed to sync leads');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLeads();
    }, []);

    const handleAssignLead = async (leadId, tlId, teamLeaders) => {
        if (!tlId) return;
        const tlName = teamLeaders.find(tl => tl.id === parseInt(tlId))?.name || 'Assigned';
        
        toast.info(`Assignment: Provisioning to ${tlName}...`);
        // Optimistic UI update
        const originalLeads = [...leads];
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, assignedToId: parseInt(tlId), assignedToName: tlName } : l));
        
        try {
            await managerService.assignLead(leadId, tlId);
            toast.success(`Success: Transfer to ${tlName} confirmed`);
        } catch (err) {
            toast.error('Sync Error: Pipeline update failed');
            setLeads(originalLeads);
        }
    };


    const handleBulkAssign = async (tlId, teamLeaders) => {
        if (!tlId) {
            toast.warning('Select a Team Leader first');
            return;
        }
        const tlName = teamLeaders.find(tl => tl.id === parseInt(tlId))?.name || 'Assigned';
        const originalLeads = [...leads];

        setLeads(prev => prev.map(l => 
            selectedLeadIds.includes(l.id) 
                ? { ...l, assignedToId: parseInt(tlId), assignedToName: tlName } 
                : l
        ));

        try {
            await managerService.bulkAssignLeads(selectedLeadIds, tlId);
            toast.success(`Successfully assigned ${selectedLeadIds.length} leads`);
            setSelectedLeadIds([]);
            loadLeads();
        } catch (err) {
            toast.error('Bulk assignment failed');
            setLeads(originalLeads);
        }
    };

    const handleUpdateLead = async (id, leadData) => {
        try {
            await managerService.updateLead(id, leadData);
            toast.success('Lead details updated');
            loadLeads();
            return true;
        } catch (err) {
            toast.error('Update failed');
            return false;
        }
    };

    const toggleSelection = (id) => {
        setSelectedLeadIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    return { 
        leads, 
        setLeads,
        loading, 
        loadLeads, 
        selectedLeadIds, 
        setSelectedLeadIds,
        toggleSelection,
        handleAssignLead,
        handleBulkAssign,
        handleUpdateLead
    };
};
