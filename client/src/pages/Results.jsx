import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { BarChart3, Trophy, RefreshCw, TrendingUp, Clock } from 'lucide-react';

const barColors = [
    { bar: 'linear-gradient(90deg, #6366f1, #818cf8)', glow: 'rgba(99, 102, 241, 0.3)' },
    { bar: 'linear-gradient(90deg, #f59e0b, #fbbf24)', glow: 'rgba(245, 158, 11, 0.3)' },
    { bar: 'linear-gradient(90deg, #10b981, #34d399)', glow: 'rgba(16, 185, 129, 0.3)' },
    { bar: 'linear-gradient(90deg, #ec4899, #f472b6)', glow: 'rgba(236, 72, 153, 0.3)' },
    { bar: 'linear-gradient(90deg, #8b5cf6, #a78bfa)', glow: 'rgba(139, 92, 246, 0.3)' },
    { bar: 'linear-gradient(90deg, #06b6d4, #22d3ee)', glow: 'rgba(6, 182, 212, 0.3)' },
];

export default function Results() {
    const navigate = useNavigate();
    const [elections, setElections] = useState([]);
    const [selectedElectionId, setSelectedElectionId] = useState('');
    const [results, setResults] = useState([]);
    const [totalVotes, setTotalVotes] = useState(0);
    const [resultsLocked, setResultsLocked] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingResults, setLoadingResults] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchElections();
    }, []);

    const fetchElections = async () => {
        try {
            const { data } = await api.get('/election');
            setElections(data);
            // Auto-select first election if available
            if (data.length > 0) {
                setSelectedElectionId(data[0]._id);
                fetchResults(data[0]._id);
            }
        } catch {
            // silently fail
        } finally {
            setLoading(false);
        }
    };

    const fetchResults = async (electionId, isRefresh = false) => {
        if (!electionId) return;
        if (isRefresh) setRefreshing(true);
        else setLoadingResults(true);
        try {
            const { data } = await api.get(`/candidate/vote/count/${electionId}`);
            setResults(data.results || []);
            setTotalVotes(data.totalVotes || 0);
            setResultsLocked(data.resultsLocked || false);
        } catch {
            setResults([]);
            setTotalVotes(0);
            setResultsLocked(false);
        } finally {
            setLoadingResults(false);
            setRefreshing(false);
        }
    };

    const handleElectionChange = (e) => {
        const id = e.target.value;
        setSelectedElectionId(id);
        fetchResults(id);
    };

    // Auto-refresh every 10s
    useEffect(() => {
        if (!selectedElectionId) return;
        const interval = setInterval(() => fetchResults(selectedElectionId), 10000);
        return () => clearInterval(interval);
    }, [selectedElectionId]);

    const maxVotes = Math.max(...results.map((r) => r.count || 0), 1);
    const selectedElection = elections.find(e => e._id === selectedElectionId);

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8"
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
                    <div className="flex items-center gap-2">
                        {selectedElectionId && (
                            <button
                                onClick={() => navigate(`/election/${selectedElectionId}/stats`)}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-border hover:border-primary/40 hover:bg-primary/5 hover:text-primary-light transition-all duration-200 text-text-muted cursor-pointer"
                            >
                                <TrendingUp className="w-4 h-4" />
                                Detailed Stats
                            </button>
                        )}
                        <button
                            onClick={() => fetchResults(selectedElectionId, true)}
                            disabled={refreshing || !selectedElectionId}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-border hover:border-primary/40 hover:bg-surface-light/40 transition-all duration-200 text-text-muted hover:text-text cursor-pointer disabled:opacity-50"
                            aria-label="Refresh results"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </motion.div>

                {/* Election Selector */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="mb-8"
                >
                    <label htmlFor="electionSelect" className="block text-sm font-medium text-text-muted mb-2">
                        Select Election
                    </label>
                    <div className="relative">
                        <select
                            id="electionSelect"
                            value={selectedElectionId}
                            onChange={handleElectionChange}
                            className="w-full px-4 py-3 rounded-xl border border-border bg-card text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all duration-200 text-sm appearance-none cursor-pointer"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%2394a3b8' viewBox='0 0 16 16'%3E%3Cpath d='M4.646 5.646a.5.5 0 0 1 .708 0L8 8.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E")`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 14px center',
                            }}
                        >
                            {elections.length === 0 && <option value="">No elections available</option>}
                            {elections.map((el) => (
                                <option key={el._id} value={el._id}>
                                    {el.title} ({el.status})
                                </option>
                            ))}
                        </select>
                    </div>
                </motion.div>

                {/* Total Votes Card */}
                {selectedElectionId && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.15 }}
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
                )}

                {/* Results */}
                {loading || loadingResults ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : resultsLocked ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-20 px-6 rounded-3xl border border-dashed border-border bg-card/30 backdrop-blur-sm"
                    >
                        <Clock className="w-12 h-12 text-primary/40 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Voting in progress</h2>
                        <p className="text-text-muted max-w-sm mx-auto">
                            Candidate-wise results are hidden to ensure fairness. Full results will be available after the election deadline.
                        </p>
                    </motion.div>
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
                                    key={`${r.party}-${r.name}`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.4, delay: i * 0.08 }}
                                    className="p-5 rounded-2xl border border-border bg-card backdrop-blur-md"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            {isLeading && <Trophy className="w-5 h-5 text-accent" />}
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-base">{r.name}</span>
                                                {r.symbol && (
                                                    <img 
                                                        src={r.symbol} 
                                                        alt="symbol" 
                                                        className="w-4 h-4 object-contain opacity-80" 
                                                    />
                                                )}
                                                <span className="text-text-muted text-sm ml-1">({r.party})</span>
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold tabular-nums">
                                            {r.count} vote{r.count !== 1 ? 's' : ''}
                                        </span>
                                    </div>

                                    <div className="h-3 rounded-full bg-surface-light/60 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percent}%` }}
                                            transition={{ duration: 0.8, delay: i * 0.08, ease: 'easeOut' }}
                                            className="h-full rounded-full"
                                            style={{ background: color.bar, boxShadow: `0 0 12px ${color.glow}` }}
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
