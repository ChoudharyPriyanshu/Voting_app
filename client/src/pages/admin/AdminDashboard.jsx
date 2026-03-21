import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import {
    Users, Vote, TrendingUp, Shield, Download, FileText,
    ChevronDown, ChevronUp, BarChart3, CheckCircle, XCircle, Loader2,
} from 'lucide-react';

function OverviewCard({ icon: Icon, label, value, color = 'primary', delay = 0 }) {
    const colors = {
        primary: { bg: 'rgba(99,102,241,0.12)', text: '#a5b4fc', border: 'rgba(99,102,241,0.25)' },
        success: { bg: 'rgba(16,185,129,0.12)', text: '#6ee7b7', border: 'rgba(16,185,129,0.25)' },
        accent: { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24', border: 'rgba(245,158,11,0.25)' },
        info: { bg: 'rgba(6,182,212,0.12)', text: '#67e8f9', border: 'rgba(6,182,212,0.25)' },
    };
    const c = colors[color];
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay }}
            className="p-5 rounded-2xl border backdrop-blur-md"
            style={{ background: c.bg, borderColor: c.border }}
        >
            <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5">
                    <Icon className="w-4 h-4" style={{ color: c.text }} />
                </div>
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-3xl font-bold" style={{ color: c.text }}>{value}</p>
        </motion.div>
    );
}

function TurnoutRow({ voter, index }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: index * 0.03 }}
            className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0"
        >
            <div>
                <p className="text-sm font-medium">{voter.name}</p>
                {voter.email && <p className="text-xs text-text-muted">{voter.email}</p>}
            </div>
            {voter.hasVoted ? (
                <span className="flex items-center gap-1 text-xs font-medium text-success bg-success/10 px-2.5 py-1 rounded-full">
                    <CheckCircle className="w-3 h-3" /> Voted
                </span>
            ) : (
                <span className="flex items-center gap-1 text-xs font-medium text-text-muted bg-text-muted/10 px-2.5 py-1 rounded-full">
                    <XCircle className="w-3 h-3" /> Not voted
                </span>
            )}
        </motion.div>
    );
}

function ElectionTurnoutCard({ election, index }) {
    const navigate = useNavigate();
    const [turnout, setTurnout] = useState(null);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [exporting, setExporting] = useState(null);

    const loadTurnout = useCallback(async () => {
        if (turnout) return; // already loaded
        setLoading(true);
        try {
            const { data } = await api.get(`/election/${election._id}/turnout`);
            setTurnout(data);
        } catch {
            toast.error('Failed to load turnout data.');
        } finally {
            setLoading(false);
        }
    }, [election._id, turnout]);

    const toggleExpand = () => {
        if (!expanded) loadTurnout();
        setExpanded(e => !e);
    };

    const handleExport = async (format) => {
        setExporting(format);
        try {
            const response = await api.get(`/election/${election._id}/export/${format}`, {
                responseType: 'blob',
            });
            const mimeType = format === 'csv' ? 'text/csv' : 'application/pdf';
            const ext = format;
            const blob = new Blob([response.data], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `election-results-${election.title.replace(/[^a-z0-9]/gi, '_')}.${ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success(`${format.toUpperCase()} downloaded!`);
        } catch {
            toast.error(`Failed to export as ${format.toUpperCase()}.`);
        } finally {
            setExporting(null);
        }
    };

    const pct = turnout ? turnout.participationRate : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 + index * 0.07 }}
            className="rounded-2xl border border-border bg-card backdrop-blur-md overflow-hidden"
        >
            {/* Card Header */}
            <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                        <h3 className="font-semibold text-base mb-0.5">{election.title}</h3>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[9px] font-mono font-bold text-primary-light/80 bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10 tracking-wider">
                                {election.electionId}
                            </span>
                            <span className={`text-[10px] font-medium uppercase px-2 py-0.5 rounded-full ${election.status === 'active' ? 'bg-success/15 text-success' : 'bg-text-muted/15 text-text-muted'}`}>
                                {election.status}
                            </span>
                        </div>
                    </div>

                    {/* Export Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => navigate(`/election/${election._id}/stats`)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:border-primary/40 hover:bg-primary/5 text-text-muted hover:text-primary-light transition-all cursor-pointer"
                            title="View detailed stats"
                        >
                            <BarChart3 className="w-3.5 h-3.5" /> Stats
                        </button>
                        <button
                            onClick={() => handleExport('csv')}
                            disabled={exporting === 'csv'}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:border-success/40 hover:bg-success/5 text-text-muted hover:text-success transition-all cursor-pointer disabled:opacity-50"
                            title="Download CSV"
                        >
                            {exporting === 'csv' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} CSV
                        </button>
                        <button
                            onClick={() => handleExport('pdf')}
                            disabled={exporting === 'pdf'}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:border-accent/40 hover:bg-accent/5 text-text-muted hover:text-accent transition-all cursor-pointer disabled:opacity-50"
                            title="Download PDF"
                        >
                            {exporting === 'pdf' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />} PDF
                        </button>
                    </div>
                </div>

                {/* Turnout Progress Bar */}
                {turnout && (
                    <div>
                        <div className="flex items-center justify-between mb-1.5 text-sm">
                            <span className="text-text-muted text-xs">Voter Turnout</span>
                            <div className="flex items-center gap-3 text-xs text-text-muted">
                                <span className="text-success font-medium">{turnout.votedCount} voted</span>
                                <span>{turnout.notVotedCount} not voted</span>
                                <span className="font-bold text-text">{pct}%</span>
                            </div>
                        </div>
                        <div className="h-2.5 rounded-full bg-surface-light/40 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.9, ease: 'easeOut' }}
                                className="h-full rounded-full"
                                style={{ background: 'linear-gradient(90deg,#6366f1,#10b981)', boxShadow: '0 0 10px rgba(99,102,241,0.4)' }}
                            />
                        </div>
                    </div>
                )}

                {/* Expand toggle */}
                <button
                    onClick={toggleExpand}
                    className="flex items-center gap-1.5 mt-4 text-xs text-text-muted hover:text-primary-light transition-colors cursor-pointer"
                >
                    {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {expanded ? 'Hide voter list' : 'Show voter list'}
                </button>
            </div>

            {/* Voter List */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-border overflow-hidden"
                    >
                        <div className="p-5 max-h-72 overflow-y-auto">
                            {loading ? (
                                <div className="flex justify-center py-6">
                                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : turnout?.voters.length === 0 ? (
                                <p className="text-center text-sm text-text-muted py-4">No registered voters yet.</p>
                            ) : (
                                turnout?.voters.map((v, i) => <TurnoutRow key={v._id} voter={v} index={i} />)
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default function AdminDashboard() {
    const [elections, setElections] = useState([]);
    const [overview, setOverview] = useState({ totalVoters: 0, totalElections: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [electionsRes, overviewRes] = await Promise.all([
                    api.get('/election'),
                    api.get('/user/profile'), // just to confirm auth; overview comes from first election stats
                ]);
                const els = electionsRes.data;
                setElections(els);
                setOverview(prev => ({ ...prev, totalElections: els.length }));

                // Get total voter count from first available stats
                if (els.length > 0) {
                    try {
                        const statsRes = await api.get(`/election/${els[0]._id}/stats`);
                        setOverview({ totalVoters: statsRes.data.totalRegisteredVoters, totalElections: els.length });
                    } catch {
                        // silent
                    }
                }
            } catch {
                toast.error('Failed to load dashboard.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const activeElections = elections.filter(e => e.status === 'active').length;

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6">
            <div
                className="fixed inset-0 -z-10"
                style={{ background: 'radial-gradient(ellipse at 40% 0%, rgba(99,102,241,0.12) 0%, transparent 60%)' }}
            />
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-10">
                    <div className="flex items-center gap-2 text-accent text-sm font-medium mb-2">
                        <Shield className="w-4 h-4" /> Admin Panel
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                        Analytics Dashboard
                    </h1>
                    <p className="text-text-muted text-lg">Turnout tracking, stats, and result exports for every election</p>
                </motion.div>

                {/* Overview Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
                    <OverviewCard icon={Vote} label="Total Elections" value={overview.totalElections} color="primary" delay={0} />
                    <OverviewCard icon={TrendingUp} label="Active Now" value={activeElections} color="success" delay={0.07} />
                    <OverviewCard icon={Users} label="Registered Voters" value={loading ? '…' : overview.totalVoters} color="accent" delay={0.14} />
                    <OverviewCard icon={BarChart3} label="Completed" value={elections.filter(e => e.status === 'completed').length} color="info" delay={0.21} />
                </div>

                {/* Election Turnout List */}
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary-light" /> Voter Turnout — All Elections
                </h2>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : elections.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-border rounded-2xl">
                        <Vote className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-40" />
                        <p className="text-text-muted text-sm">No elections found. Create one from Manage Candidates.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {elections.map((el, i) => (
                            <ElectionTurnoutCard key={el._id} election={el} index={i} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
