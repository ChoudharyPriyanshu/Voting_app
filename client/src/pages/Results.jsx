import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../api/axios';
import { BarChart3, Trophy, RefreshCw } from 'lucide-react';

const barColors = [
    { bar: 'linear-gradient(90deg, #6366f1, #818cf8)', glow: 'rgba(99, 102, 241, 0.3)' },
    { bar: 'linear-gradient(90deg, #f59e0b, #fbbf24)', glow: 'rgba(245, 158, 11, 0.3)' },
    { bar: 'linear-gradient(90deg, #10b981, #34d399)', glow: 'rgba(16, 185, 129, 0.3)' },
    { bar: 'linear-gradient(90deg, #ec4899, #f472b6)', glow: 'rgba(236, 72, 153, 0.3)' },
    { bar: 'linear-gradient(90deg, #8b5cf6, #a78bfa)', glow: 'rgba(139, 92, 246, 0.3)' },
    { bar: 'linear-gradient(90deg, #06b6d4, #22d3ee)', glow: 'rgba(6, 182, 212, 0.3)' },
];

export default function Results() {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchResults = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        try {
            const { data } = await api.get('/candidate/vote/count');
            setResults(data);
        } catch {
            // silently fail
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchResults();
        const interval = setInterval(() => fetchResults(), 10000);
        return () => clearInterval(interval);
    }, []);

    const maxVotes = Math.max(...results.map((r) => r.count), 1);
    const totalVotes = results.reduce((sum, r) => sum + r.count, 0);

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10"
                >
                    <div>
                        <h1
                            className="text-3xl sm:text-4xl font-bold mb-2"
                            style={{ fontFamily: 'var(--font-display)' }}
                        >
                            Live Results
                        </h1>
                        <p className="text-text-muted text-lg">
                            Real-time vote count • Auto-refreshes every 10s
                        </p>
                    </div>
                    <button
                        onClick={() => fetchResults(true)}
                        disabled={refreshing}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-border hover:border-primary/40 hover:bg-surface-light/40 transition-all duration-200 text-text-muted hover:text-text cursor-pointer disabled:opacity-50"
                        aria-label="Refresh results"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </motion.div>

                {/* Total Votes Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="flex items-center gap-4 p-5 rounded-2xl border border-border bg-card backdrop-blur-md mb-8"
                >
                    <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-primary-light" />
                    </div>
                    <div>
                        <p className="text-sm text-text-muted">Total Votes Cast</p>
                        <p className="text-2xl font-bold">{totalVotes}</p>
                    </div>
                </motion.div>

                {/* Results */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : results.length === 0 ? (
                    <div className="text-center py-20">
                        <BarChart3 className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
                        <p className="text-text-muted">No votes recorded yet.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {results.map((r, i) => {
                            const color = barColors[i % barColors.length];
                            const percent = maxVotes > 0 ? (r.count / maxVotes) * 100 : 0;
                            const isLeading = i === 0 && r.count > 0;

                            return (
                                <motion.div
                                    key={r.party}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.4, delay: i * 0.08 }}
                                    className="p-5 rounded-2xl border border-border bg-card backdrop-blur-md"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            {isLeading && (
                                                <Trophy className="w-5 h-5 text-accent" />
                                            )}
                                            <span className="font-semibold text-base">{r.party}</span>
                                        </div>
                                        <span className="text-sm font-bold tabular-nums">
                                            {r.count} vote{r.count !== 1 ? 's' : ''}
                                        </span>
                                    </div>

                                    {/* Bar */}
                                    <div className="h-3 rounded-full bg-surface-light/60 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percent}%` }}
                                            transition={{ duration: 0.8, delay: i * 0.08, ease: 'easeOut' }}
                                            className="h-full rounded-full"
                                            style={{
                                                background: color.bar,
                                                boxShadow: `0 0 12px ${color.glow}`,
                                            }}
                                        />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
