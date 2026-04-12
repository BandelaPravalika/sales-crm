import { useState, useEffect } from 'react';
import managerService from '../../../services/managerService';
import { toast } from 'react-toastify';

export const useDashboardData = (filters) => {
    const [data, setData] = useState({
        stats: null,
        performance: [],
        teamTree: null,
        trend: [],
        callStats: null,
        summary: null
    });
    const [loading, setLoading] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const [statsRes, perfRes, treeRes, trendRes, callRes, summaryRes] = await managerService.fetchDashboardData(filters);
            setData({
                stats: statsRes.data,
                performance: perfRes.data,
                teamTree: treeRes.data,
                trend: trendRes.data,
                callStats: callRes.data?.data || callRes.data,
                summary: summaryRes.data
            });
        } catch (err) {
            toast.error('Dashboard synchronization failed');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [filters.from, filters.to, filters.userId]);

    return { ...data, loading, reload: load };
};
