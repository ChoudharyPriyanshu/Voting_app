import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Vote, CheckCircle, AlertCircle, Users, ChevronLeft, Calendar, Tag } from 'lucide-react';

const partyColors = [
    { bg: 'rgba(99, 102, 241, 0.15)', border: 'rgba(99, 102, 241, 0.3)', text: '#a5b4fc' },
    { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)', text: '#fbbf24' },
    { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)', text: '#6ee7b7' },
    { bg: 'rgba(236, 72, 153, 0.15)', border: 'rgba(236, 72, 153, 0.3)', text: '#f9a8d4' },
    { bg: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.3)', text: '#c4b5fd' },
];

export default function Dashboard() {
    const { user, refreshProfile, hasVotedInElection } = useAuth();
    const [elections, setElections] = useState([]);
    const [selectedElection, setSelectedElection] = useState(null);
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingCandidates, setLoadingCandidates] = useState(false);
    const [voting, setVoting] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchElections();
    }, []);

    const fetchElections = async () => {
        try {
            const { data } = await api.get('/election');
            setElections(data);
        } catch {
            setMessage({ type: 'error', text: 'Failed to load elections.' });
        } finally {
            setLoading(false);
        }
    };

    const selectElection = async (election) => {
        setSelectedElection(election);
        setMessage({ type: '', text: '' });
        setLoadingCandidates(true);
        try {
            const { data } = await api.get(`/candidate/list/${election._id}`);
            setCandidates(data);
        } catch {
            setMessage({ type: 'error', text: 'Failed to load candidates.' });
        } finally {
            setLoadingCandidates(false);
        }
    };

    const goBack = () => {
        setSelectedElection(null);
        setCandidates([]);
        setMessage({ type: '', text: '' });
    };

    const handleVote = async (candidateId) => {
        if (!selectedElection) return;
        if (hasVotedInElection(selectedElection._id)) return;

        try {
            setVoting(candidateId);
            setMessage({ type: '', text: '' });
            await api.post(`/candidate/vote/${candidateId}`);
            setMessage({ type: 'success', text: 'Your vote has been recorded successfully!' });
            await refreshProfile();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to cast vote.' });
        } finally {
            setVoting(null);
        }
    };

    const alreadyVoted = selectedElection ? hasVotedInElection(selectedElection._id) : false;

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
                    {selectedElection && (
                        <button
                            onClick={goBack}
                            className="flex items-center gap-1 text-sm text-text-muted hover:text-primary-light transition-colors mb-4 cursor-pointer"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Back to Elections
                        </button>
                    )}
                    <h1
                        className="text-3xl sm:text-4xl font-bold mb-2"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        {selectedElection ? selectedElection.title : 'Voter Dashboard'}
                    </h1>
                    <p className="text-text-muted text-lg">
                        {selectedElection
                            ? selectedElection.description || 'Select a candidate and cast your vote'
                            : <>Welcome back, <span className="text-primary-light font-medium">{user?.name}</span>. Choose an election to vote in.</>
                        }
                    </p>
                </motion.div>

                {/* Voted Banner */}
                {alreadyVoted && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 p-4 rounded-2xl bg-success/10 border border-success/20 text-success mb-8"
                    >
                        <CheckCircle className="w-5 h-5 shrink-0" />
                        <p className="text-sm font-medium">You have already voted in this election. Thank you for participating!</p>
                    </motion.div>
                )}

                {/* Message */}
                <AnimatePresence>
                    {message.text && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={`flex items-center gap-3 p-4 rounded-2xl border mb-8 text-sm ${message.type === 'error'
                                    ? 'bg-danger/10 border-danger/20 text-danger'
                                    : 'bg-success/10 border-success/20 text-success'
                                }`}
                        >
                            {message.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle className="w-5 h-5 shrink-0" />}
                            {message.text}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Loading */}
                {(loading || loadingCandidates) && (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {/* Elections List */}
                {!loading && !selectedElection && !loadingCandidates && (
                    <>
                        {elections.length === 0 ? (
                            <div className="text-center py-20">
                                <Calendar className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
                                <p className="text-text-muted">No elections available yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {elections.map((el, i) => {
                                    const voted = hasVotedInElection(el._id);
                                    return (
                                        <motion.button
                                            key={el._id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.4, delay: i * 0.08 }}
                                            whileHover={{ y: -3, transition: { duration: 0.2 } }}
                                            onClick={() => selectElection(el)}
                                            className="relative text-left p-6 rounded-2xl border border-border bg-card backdrop-blur-md hover:border-primary/40 transition-all duration-300 cursor-pointer"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <h3 className="text-lg font-semibold pr-4">{el.title}</h3>
                                                <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${el.status === 'active'
                                                        ? 'bg-success/15 text-success'
                                                        : 'bg-text-muted/15 text-text-muted'
                                                    }`}>
                                                    {el.status}
                                                </span>
                                            </div>
                                            {el.description && (
                                                <p className="text-sm text-text-muted mb-3 line-clamp-2">{el.description}</p>
                                            )}
                                            <div className="flex items-center gap-3">
                                                {voted && (
                                                    <span className="flex items-center gap-1 text-xs text-success font-medium">
                                                        <CheckCircle className="w-3.5 h-3.5" /> Voted
                                                    </span>
                                                )}
                                                <span className="text-xs text-text-muted/60">
                                                    {new Date(el.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                {/* Candidates for Selected Election */}
                {selectedElection && !loadingCandidates && (
                    <>
                        {candidates.length === 0 ? (
                            <div className="text-center py-20">
                                <Users className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
                                <p className="text-text-muted">No candidates in this election yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {candidates.map((c, i) => {
                                    const color = partyColors[i % partyColors.length];
                                    return (
                                        <motion.div
                                            key={c._id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.4, delay: i * 0.08 }}
                                            whileHover={{ y: -3, transition: { duration: 0.2 } }}
                                            className="relative p-6 rounded-2xl border bg-card backdrop-blur-md transition-all duration-300"
                                            style={{ borderColor: color.border }}
                                        >
                                            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: color.text }} />
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
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: color.bg }}>
                                                    <Vote className="w-5 h-5" style={{ color: color.text }} />
                                                </div>
                                            </div>

                                            <button
                                                disabled={alreadyVoted || voting !== null || selectedElection.status === 'completed'}
                                                className={`w-full mt-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer ${alreadyVoted || selectedElection.status === 'completed'
                                                        ? 'bg-surface-light/50 text-text-muted cursor-not-allowed'
                                                        : 'bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/20 hover:shadow-primary/30'
                                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                onClick={() => handleVote(c._id)}
                                            >
                                                {voting === c._id ? (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        Voting…
                                                    </span>
                                                ) : alreadyVoted ? (
                                                    'Already Voted'
                                                ) : selectedElection.status === 'completed' ? (
                                                    'Election Ended'
                                                ) : (
                                                    'Cast Vote'
                                                )}
                                            </button>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
