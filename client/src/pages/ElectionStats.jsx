import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../api/axios';
import {
    BarChart3, Users, TrendingUp, Trophy, ChevronLeft,
    Calendar, Clock
} from 'lucide-react';

function StatCard({ icon: Icon, label, value, sub, color = 'primary', delay = 0 }) {
    const colors = {
        primary: { bg: 'rgba(99,102,241,0.12)', text: '#a5b4fc', border: 'rgba(99,102,241,0.25)' },
        success: { bg: 'rgba(16,185,129,0.12)', text: '#6ee7b7', border: 'rgba(16,185,129,0.25)' },
        accent: { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24', border: 'rgba(245,158,11,0.25)' },
    };
    const c = colors[color];
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className="p-5 rounded-2xl border backdrop-blur-md"
            style={{ background: c.bg, borderColor: c.border }}
        >
            <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <Icon className="w-4.5 h-4.5" style={{ color: c.text }} />
                </div>
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-3xl font-bold mb-1" style={{ color: c.text }}>{value}</p>
            {sub && <p className="text-xs text-text-muted">{sub}</p>}
        </motion.div>
    );
}

// Pure-SVG vote timeline chart
function VoteTimeline({ data }) {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-40 text-text-muted text-sm opacity-60">
                <Clock className="w-5 h-5 mr-2" /> No timeline data yet
            </div>
        );
    }

    const maxCount = Math.max(...data.map(d => d.count), 1);
    const W = 560;
    const H = 160;
    const padL = 36, padR = 16, padT = 12, padB = 40;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;
    const barW = Math.max(8, Math.floor(chartW / data.length) - 4);

    return (
        <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 280 }}>
                {/* Y grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
                    const y = padT + chartH - frac * chartH;
                    const val = Math.round(frac * maxCount);
                    return (
                        <g key={i}>
                            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                            <text x={padL - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#64748b">{val}</text>
                        </g>
                    );
                })}

                {/* Bars */}
                {data.map((d, i) => {
                    const barH = (d.count / maxCount) * chartH;
                    const x = padL + (i / data.length) * chartW + (chartW / data.length - barW) / 2;
                    const y = padT + chartH - barH;
                    const label = new Date(d.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    return (
                        <g key={i}>
                            <defs>
                                <linearGradient id={`bar${i}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#818cf8" />
                                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.7" />
                                </linearGradient>
                            </defs>
                            <rect x={x} y={y} width={barW} height={barH}
                                fill={`url(#bar${i})`} rx="3"
                                style={{ filter: 'drop-shadow(0 0 6px rgba(99,102,241,0.4))' }}
                            />
                            {/* Count label on bar */}
                            {barH > 18 && (
                                <text x={x + barW / 2} y={y + 13} textAnchor="middle" fontSize="9" fill="#e2e8f0" fontWeight="600">{d.count}</text>
                            )}
                            {/* Time label below */}
                            {i % Math.max(1, Math.floor(data.length / 6)) === 0 && (
                                <text x={x + barW / 2} y={H - 5} textAnchor="middle" fontSize="8" fill="#64748b">{label}</text>
                            )}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

const candidateColors = [
    { bg: 'rgba(99,102,241,0.15)', bar: '#818cf8', text: '#a5b4fc' },
    { bg: 'rgba(245,158,11,0.15)', bar: '#fbbf24', text: '#fbbf24' },
    { bg: 'rgba(16,185,129,0.15)', bar: '#34d399', text: '#6ee7b7' },
    { bg: 'rgba(236,72,153,0.15)', bar: '#f472b6', text: '#f9a8d4' },
    { bg: 'rgba(139,92,246,0.15)', bar: '#a78bfa', text: '#c4b5fd' },
    { bg: 'rgba(6,182,212,0.15)', bar: '#22d3ee', text: '#67e8f9' },
];

export default function ElectionStats() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        api.get(`/election/${id}/stats`)
            .then(({ data }) => setStats(data))
            .catch(() => toast.error('Failed to load election stats.'))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-text-muted">Stats not available for this election.</p>
            </div>
        );
    }

    const { election, totalRegisteredVoters, totalVotes, participationRate, candidateStats, voteTimeline, resultsLocked } = stats;
    const isStatVisible = !resultsLocked;

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6">
            <div
                className="fixed inset-0 -z-10"
                style={{ background: 'radial-gradient(ellipse at 60% 0%, rgba(99,102,241,0.12) 0%, transparent 55%)' }}
            />
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1.5 text-sm text-text-muted hover:text-primary-light transition-colors mb-4 cursor-pointer"
                    >
                        <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                    <div className="flex items-center gap-2 text-primary-light text-sm font-medium mb-2">
                        <BarChart3 className="w-4 h-4" /> Election Analytics
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                        {election.title}
                    </h1>
                    <div className="flex items-center gap-3 flex-wrap text-sm text-text-muted mb-4">
                        <span className="text-xs font-mono font-bold text-primary-light bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20 tracking-widest">
                            {election.electionId}
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${election.status === 'active' ? 'bg-success/15 text-success' : 'bg-text-muted/15'}`}>
                            {election.status}
                        </span>


                        {election.startDate && (
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(election.startDate).toLocaleDateString()}
                                {election.endDate && ` — ${new Date(election.endDate).toLocaleDateString()}`}
                            </span>
                        )}
                        {resultsLocked && (
                            <span className="flex items-center gap-1 text-primary-light bg-primary/10 px-2.5 py-1 rounded-full text-xs font-semibold">
                                <Clock className="w-3 h-3" /> Results Locked
                            </span>
                        )}
                    </div>
                </motion.div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <StatCard icon={Users} label="Registered Voters" value={totalRegisteredVoters} sub="Verified voter accounts" color="primary" delay={0} />
                    <StatCard icon={BarChart3} label="Votes Cast" value={totalVotes} sub={`in this election`} color="success" delay={0.08} />
                    <StatCard icon={TrendingUp} label="Participation Rate" value={`${participationRate}%`} sub="voters participated" color="accent" delay={0.16} />
                </div>

                {!isStatVisible ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="p-10 rounded-2xl border border-border bg-card backdrop-blur-md text-center"
                    >
                        <Clock className="w-16 h-16 text-primary/30 mx-auto mb-6" />
                        <h2 className="text-2xl font-bold mb-3">Voting in progress</h2>
                        <p className="text-text-muted max-w-md mx-auto text-lg leading-relaxed">
                            To maintain election integrity, candidate-wise results and vote timelines are hidden until the voting period concludes.
                        </p>
                        <div className="mt-8 pt-8 border-t border-border/50">
                            <p className="text-sm text-text-muted italic">
                                Check back after the deadline to see the final results and full analytics breakdown.
                            </p>
                        </div>
                    </motion.div>
                ) : (
                    <>
                        {/* Candidate Breakdown */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
                            className="p-6 rounded-2xl border border-border bg-card backdrop-blur-md mb-8"
                        >
                            <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-accent" /> Candidate Results
                            </h2>
                            {candidateStats.length === 0 ? (
                                <p className="text-text-muted text-sm text-center py-6">No candidates yet.</p>
                            ) : (
                                <div className="space-y-4">
                                    {candidateStats.map((c, i) => {
                                        const col = candidateColors[i % candidateColors.length];
                                        const pct = parseFloat(c.votePercent);
                                        return (
                                            <motion.div
                                                key={c._id}
                                                initial={{ opacity: 0, x: -16 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.4, delay: 0.25 + i * 0.07 }}
                                            >
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <div className="flex items-center gap-2">
                                                        {i === 0 && totalVotes > 0 && <Trophy className="w-4 h-4 text-accent shrink-0" />}
                                                        <span className="font-semibold text-sm">{c.name}</span>
                                                        <span className="text-xs text-text-muted px-2 py-0.5 rounded-full" style={{ background: col.bg, color: col.text }}>
                                                            {c.party}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm">
                                                        <span className="font-bold tabular-nums">{c.voteCount}</span>
                                                        <span className="text-text-muted w-12 text-right">{c.votePercent}%</span>
                                                    </div>
                                                </div>
                                                <div className="h-2.5 rounded-full bg-surface-light/40 overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${pct}%` }}
                                                        transition={{ duration: 0.9, delay: 0.3 + i * 0.07, ease: 'easeOut' }}
                                                        className="h-full rounded-full"
                                                        style={{ background: col.bar, boxShadow: `0 0 10px ${col.bar}55` }}
                                                    />
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </motion.div>

                        {/* Vote Timeline */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }}
                            className="p-6 rounded-2xl border border-border bg-card backdrop-blur-md"
                        >
                            <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-primary-light" /> Vote Timeline
                                <span className="text-xs text-text-muted font-normal">(votes per hour)</span>
                            </h2>
                            <VoteTimeline data={voteTimeline} />
                        </motion.div>
                    </>
                )}
            </div>
        </div>
    );
}
