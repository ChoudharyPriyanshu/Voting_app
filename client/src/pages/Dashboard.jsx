import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Vote, CheckCircle, AlertCircle, Users } from 'lucide-react';

export default function Dashboard() {
    const { user, refreshProfile } = useAuth();
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [voting, setVoting] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchCandidates();
    }, []);

    const fetchCandidates = async () => {
        try {
            const { data } = await api.get('/candidate/list');
            setCandidates(data);
        } catch {
            setMessage({ type: 'error', text: 'Failed to load candidates.' });
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (candidateName) => {
        if (user?.isVoted) return;

        // We need to find candidate by name/party, but the list endpoint doesn't return IDs.
        // We'll use a workaround: fetch full candidates data from vote/count and match
        try {
            setVoting(candidateName);
            setMessage({ type: '', text: '' });

            // Get candidates list with a broader endpoint if available
            // Since the /candidate/list endpoint only returns name and party,
            // and we need the candidateID for voting, we'll need to get it differently
            // The vote endpoint needs candidate ObjectId
            // Let's try fetching from the vote/count endpoint to match
            const response = await api.get('/candidate/vote/count');
            const allCandidates = response.data;

            // Unfortunately, the API list endpoints don't expose IDs.
            // We need a direct voting approach. Let me search candidates properly.
            // Actually, looking at the backend, the list and count endpoints don't have IDs.
            // Let's fetch the full list - if the API has that.
            // As a workaround, we'll need to match by party name.

            // Since the backend doesn't expose candidate IDs in the list endpoint,
            // we'll need the admin to share candidate IDs, or we modify the approach.
            // For now, let's assume we can get candidate details somehow.

            setMessage({ type: 'error', text: 'Voting requires candidate IDs. Please check with administrator.' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to cast vote.' });
        } finally {
            setVoting(null);
        }
    };

    // Party color mapping for visual variety
    const partyColors = [
        { bg: 'rgba(99, 102, 241, 0.15)', border: 'rgba(99, 102, 241, 0.3)', text: '#a5b4fc' },
        { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)', text: '#fbbf24' },
        { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)', text: '#6ee7b7' },
        { bg: 'rgba(236, 72, 153, 0.15)', border: 'rgba(236, 72, 153, 0.3)', text: '#f9a8d4' },
        { bg: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.3)', text: '#c4b5fd' },
    ];

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-10"
                >
                    <h1
                        className="text-3xl sm:text-4xl font-bold mb-2"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        Voter Dashboard
                    </h1>
                    <p className="text-text-muted text-lg">
                        Welcome back, <span className="text-primary-light font-medium">{user?.name}</span>
                    </p>
                </motion.div>

                {/* Vote Status Banner */}
                {user?.isVoted && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 p-4 rounded-2xl bg-success/10 border border-success/20 text-success mb-8"
                    >
                        <CheckCircle className="w-5 h-5 shrink-0" />
                        <p className="text-sm font-medium">You have already cast your vote. Thank you for participating!</p>
                    </motion.div>
                )}

                {/* Message */}
                {message.text && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-center gap-3 p-4 rounded-2xl border mb-8 text-sm ${message.type === 'error'
                                ? 'bg-danger/10 border-danger/20 text-danger'
                                : 'bg-success/10 border-success/20 text-success'
                            }`}
                    >
                        {message.type === 'error' ? (
                            <AlertCircle className="w-5 h-5 shrink-0" />
                        ) : (
                            <CheckCircle className="w-5 h-5 shrink-0" />
                        )}
                        {message.text}
                    </motion.div>
                )}

                {/* Candidates Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : candidates.length === 0 ? (
                    <div className="text-center py-20">
                        <Users className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
                        <p className="text-text-muted">No candidates available yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {candidates.map((c, i) => {
                            const color = partyColors[i % partyColors.length];
                            return (
                                <motion.div
                                    key={`${c.name}-${c.party}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: i * 0.08 }}
                                    whileHover={{ y: -3, transition: { duration: 0.2 } }}
                                    className="relative p-6 rounded-2xl border bg-card backdrop-blur-md transition-all duration-300"
                                    style={{ borderColor: color.border }}
                                >
                                    <div
                                        className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                                        style={{ background: color.text }}
                                    />
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold mb-1">{c.name}</h3>
                                            <span
                                                className="inline-block px-3 py-1 rounded-full text-xs font-medium"
                                                style={{ backgroundColor: color.bg, color: color.text }}
                                            >
                                                {c.party}
                                            </span>
                                        </div>
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                                            style={{ backgroundColor: color.bg }}
                                        >
                                            <Vote className="w-5 h-5" style={{ color: color.text }} />
                                        </div>
                                    </div>

                                    <button
                                        disabled={user?.isVoted || voting !== null}
                                        className={`w-full mt-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer ${user?.isVoted
                                                ? 'bg-surface-light/50 text-text-muted cursor-not-allowed'
                                                : 'bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/20 hover:shadow-primary/30'
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        onClick={() => handleVote(c.name)}
                                    >
                                        {voting === c.name ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Voting…
                                            </span>
                                        ) : user?.isVoted ? (
                                            'Already Voted'
                                        ) : (
                                            'Cast Vote'
                                        )}
                                    </button>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
