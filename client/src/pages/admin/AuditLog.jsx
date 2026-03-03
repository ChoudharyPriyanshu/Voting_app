import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import {
    History, Shield, Users, Vote, ChevronDown, Loader2,
    Plus, Pencil, Trash2, ToggleRight,
} from 'lucide-react';

const actionConfig = {
    election_created: { icon: Plus, color: '#6ee7b7', label: 'Created Election' },
    election_updated: { icon: Pencil, color: '#a5b4fc', label: 'Updated Election' },
    election_deleted: { icon: Trash2, color: '#fca5a5', label: 'Deleted Election' },
    election_status_changed: { icon: ToggleRight, color: '#fbbf24', label: 'Status Changed' },
    candidate_added: { icon: Plus, color: '#6ee7b7', label: 'Added Candidate' },
    candidate_updated: { icon: Pencil, color: '#a5b4fc', label: 'Updated Candidate' },
    candidate_deleted: { icon: Trash2, color: '#fca5a5', label: 'Deleted Candidate' },
};

const ACTION_FILTERS = [
    { value: '', label: 'All Actions' },
    { value: 'election_created', label: 'Created Election' },
    { value: 'election_updated', label: 'Updated Election' },
    { value: 'election_deleted', label: 'Deleted Election' },
    { value: 'election_status_changed', label: 'Status Changed' },
    { value: 'candidate_added', label: 'Added Candidate' },
    { value: 'candidate_updated', label: 'Updated Candidate' },
    { value: 'candidate_deleted', label: 'Deleted Candidate' },
];

export default function AuditLog() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [actionFilter, setActionFilter] = useState('');

    const fetchLogs = async (pg = 1, action = '') => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: pg, limit: 20 });
            if (action) params.append('action', action);
            const { data } = await api.get(`/audit?${params}`);
            setLogs(data.logs || []);
            setTotalPages(data.totalPages || 1);
            setPage(data.page || 1);
        } catch {
            toast.error('Failed to load audit logs.');
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLogs(1, actionFilter); }, [actionFilter]);

    const formatTime = (ts) => {
        const d = new Date(ts);
        const now = new Date();
        const diffMs = now - d;
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return 'Just now';
        if (diffMin < 60) return `${diffMin}m ago`;
        const diffHrs = Math.floor(diffMin / 60);
        if (diffHrs < 24) return `${diffHrs}h ago`;
        const diffDays = Math.floor(diffHrs / 24);
        if (diffDays < 7) return `${diffDays}d ago`;
        return d.toLocaleDateString();
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6">
            <div
                className="fixed inset-0 -z-10"
                style={{ background: 'radial-gradient(ellipse at 30% 0%, rgba(245,158,11,0.08) 0%, transparent 55%)' }}
            />
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
                    <div className="flex items-center gap-2 text-accent text-sm font-medium mb-2">
                        <Shield className="w-4 h-4" /> Admin Panel
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                        Audit Log
                    </h1>
                    <p className="text-text-muted text-lg">
                        Track all administrative actions on elections and candidates
                    </p>
                </motion.div>

                {/* Filter */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
                    className="mb-6"
                >
                    <div className="relative inline-block">
                        <select
                            value={actionFilter}
                            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                            className="appearance-none px-4 py-2.5 pr-10 rounded-xl text-sm font-medium border border-border bg-card text-text cursor-pointer focus:outline-none focus:border-primary/50 transition-all"
                        >
                            {ACTION_FILTERS.map(f => (
                                <option key={f.value} value={f.value}>{f.label}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                    </div>
                </motion.div>

                {/* Log List */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-7 h-7 text-primary animate-spin" />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-border rounded-2xl">
                        <History className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-40" />
                        <p className="text-text-muted text-sm">No audit logs found.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {logs.map((log, i) => {
                            const cfg = actionConfig[log.action] || { icon: History, color: '#94a3b8', label: log.action };
                            const Icon = cfg.icon;
                            return (
                                <motion.div
                                    key={log._id}
                                    initial={{ opacity: 0, x: -12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: i * 0.03 }}
                                    className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:border-border/80 transition-colors"
                                >
                                    <div
                                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                                        style={{ background: `${cfg.color}15` }}
                                    >
                                        <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <span className="text-sm font-semibold" style={{ color: cfg.color }}>
                                                {cfg.label}
                                            </span>
                                            <span className="text-xs text-text-muted shrink-0" title={new Date(log.timestamp).toLocaleString()}>
                                                {formatTime(log.timestamp)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-text-muted truncate">{log.details}</p>
                                        <p className="text-xs text-text-muted/60 mt-1">
                                            by <span className="text-text-muted">{log.adminName || 'Admin'}</span>
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 mt-8">
                        <button
                            onClick={() => fetchLogs(page - 1, actionFilter)}
                            disabled={page <= 1}
                            className="px-4 py-2 rounded-xl text-sm font-medium border border-border hover:border-primary/40 text-text-muted hover:text-text transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-text-muted">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => fetchLogs(page + 1, actionFilter)}
                            disabled={page >= totalPages}
                            className="px-4 py-2 rounded-xl text-sm font-medium border border-border hover:border-primary/40 text-text-muted hover:text-text transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
