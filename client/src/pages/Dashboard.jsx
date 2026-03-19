import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import ConfirmVoteModal from '../components/ConfirmVoteModal';
import VoteReceiptModal from '../components/VoteReceiptModal';
import { Vote, CheckCircle, Users, ChevronLeft, Calendar, Clock, Timer } from 'lucide-react';

const partyColors = [
    { bg: 'rgba(99, 102, 241, 0.15)', border: 'rgba(99, 102, 241, 0.3)', text: '#a5b4fc' },
    { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)', text: '#fbbf24' },
    { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)', text: '#6ee7b7' },
    { bg: 'rgba(236, 72, 153, 0.15)', border: 'rgba(236, 72, 153, 0.3)', text: '#f9a8d4' },
    { bg: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.3)', text: '#c4b5fd' },
];

// ─── Countdown Hook ───
function useCountdown(targetDate) {
    const [timeLeft, setTimeLeft] = useState(calcTimeLeft(targetDate));

    useEffect(() => {
        if (!targetDate) return;
        const id = setInterval(() => setTimeLeft(calcTimeLeft(targetDate)), 1000);
        return () => clearInterval(id);
    }, [targetDate]);

    return timeLeft;
}

function calcTimeLeft(target) {
    if (!target) return null;
    const diff = new Date(target) - new Date();
    if (diff <= 0) return { expired: true };
    return {
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
        expired: false,
    };
}

function CountdownBadge({ endDate, startDate }) {
    const endCountdown = useCountdown(endDate);
    const startCountdown = useCountdown(startDate);
    const now = new Date();
    const hasStarted = !startDate || now >= new Date(startDate);
    const hasEnded = endDate && now >= new Date(endDate);

    if (hasEnded || endCountdown?.expired) {
        return (
            <span className="flex items-center gap-1 text-[10px] font-medium text-text-muted bg-text-muted/10 px-2 py-1 rounded-full">
                <Clock className="w-3 h-3" /> Ended
            </span>
        );
    }

    if (!hasStarted && startCountdown && !startCountdown.expired) {
        const s = startCountdown;
        return (
            <span className="flex items-center gap-1 text-[10px] font-medium text-accent bg-accent/10 px-2 py-1 rounded-full">
                <Timer className="w-3 h-3" />
                Starts in {s.days > 0 ? `${s.days}d ` : ''}{String(s.hours).padStart(2, '0')}:{String(s.minutes).padStart(2, '0')}:{String(s.seconds).padStart(2, '0')}
            </span>
        );
    }

    if (endCountdown && !endCountdown.expired) {
        const t = endCountdown;
        return (
            <span className="flex items-center gap-1 text-[10px] font-medium text-success bg-success/10 px-2 py-1 rounded-full">
                <Timer className="w-3 h-3" />
                {t.days > 0 ? `${t.days}d ` : ''}{String(t.hours).padStart(2, '0')}:{String(t.minutes).padStart(2, '0')}:{String(t.seconds).padStart(2, '0')} left
            </span>
        );
    }

    return null;
}

// ─── Dashboard Component ───
export default function Dashboard() {
    const { user, refreshProfile, hasVotedInElection } = useAuth();
    const [elections, setElections] = useState([]);
    const [selectedElection, setSelectedElection] = useState(null);
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingCandidates, setLoadingCandidates] = useState(false);
    const [voting, setVoting] = useState(null);

    // Confirmation modal state
    const [confirmCandidate, setConfirmCandidate] = useState(null);

    // Vote receipt state
    const [receiptHash, setReceiptHash] = useState(null);

    useEffect(() => { fetchElections(); }, []);

    const fetchElections = async () => {
        try {
            const { data } = await api.get('/election');
            setElections(data);
        } catch {
            toast.error('Failed to load elections.');
        } finally {
            setLoading(false);
        }
    };

    const selectElection = async (election) => {
        setSelectedElection(election);
        setLoadingCandidates(true);
        try {
            const { data } = await api.get(`/candidate/list/${election._id}`);
            setCandidates(data);
        } catch {
            toast.error('Failed to load candidates.');
        } finally {
            setLoadingCandidates(false);
        }
    };

    const goBack = () => {
        setSelectedElection(null);
        setCandidates([]);
    };

    // Open confirmation modal
    const promptVote = (candidate) => {
        setConfirmCandidate(candidate);
    };

    // Confirm vote
    const handleVote = async () => {
        if (!confirmCandidate || !selectedElection) return;
        if (hasVotedInElection(selectedElection._id)) return;

        try {
            setVoting(confirmCandidate._id);
            const { data } = await api.post(`/candidate/vote/${confirmCandidate._id}`);
            toast.success('Your vote has been recorded successfully!');
            await refreshProfile();

            // Show receipt modal with the hash
            if (data.receiptHash) {
                setReceiptHash(data.receiptHash);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to cast vote.');
        } finally {
            setVoting(null);
            setConfirmCandidate(null);
        }
    };

    const alreadyVoted = selectedElection ? hasVotedInElection(selectedElection._id) : false;

    // Determine if election is currently votable
    const isVotable = (el) => {
        if (el.status === 'completed') return false;
        const now = new Date();
        if (el.startDate && now < new Date(el.startDate)) return false;
        if (el.endDate && now > new Date(el.endDate)) return false;
        return true;
    };

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
                    <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
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
                        <p className="text-sm font-medium">You have already voted in this election. Thank you!</p>
                    </motion.div>
                )}

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
                                    const votable = isVotable(el);
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
                                                <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${votable ? 'bg-success/15 text-success' : 'bg-text-muted/15 text-text-muted'
                                                    }`}>
                                                    {votable ? 'active' : el.status === 'completed' ? 'completed' : 'scheduled'}
                                                </span>
                                            </div>
                                            {el.description && (
                                                <p className="text-sm text-text-muted mb-3 line-clamp-2">{el.description}</p>
                                            )}
                                            <div className="flex items-center flex-wrap gap-2">
                                                {voted && (
                                                    <span className="flex items-center gap-1 text-xs text-success font-medium">
                                                        <CheckCircle className="w-3.5 h-3.5" /> Voted
                                                    </span>
                                                )}
                                                <CountdownBadge endDate={el.endDate} startDate={el.startDate} />
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
                        {/* Countdown for selected election */}
                        {(selectedElection.endDate || selectedElection.startDate) && (
                            <div className="mb-6">
                                <CountdownBadge endDate={selectedElection.endDate} startDate={selectedElection.startDate} />
                            </div>
                        )}

                        {candidates.length === 0 ? (
                            <div className="text-center py-20">
                                <Users className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
                                <p className="text-text-muted">No candidates in this election yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {candidates.map((c, i) => {
                                    const color = partyColors[i % partyColors.length];
                                    const canVote = !alreadyVoted && isVotable(selectedElection);
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
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-border overflow-hidden shrink-0">
                                                    {c.photo ? (
                                                        <img src={c.photo} alt={c.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xl font-bold text-primary-light bg-primary/15">
                                                            {c.name?.charAt(0)?.toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="text-lg font-bold truncate">{c.name}</h3>
                                                        {c.symbol && (
                                                            <img 
                                                                src={c.symbol} 
                                                                alt="Symbol" 
                                                                className="w-5 h-5 object-contain" 
                                                                title={`${c.party} Symbol`}
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: color.bg, color: color.text }}>
                                                            {c.party}
                                                        </span>
                                                        {c.position && (
                                                            <span className="text-[10px] font-medium text-text-muted bg-surface-light px-2 py-0.5 rounded-full border border-border">
                                                                {c.position}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {c.description && (
                                                <p className="text-xs text-text-muted mb-4 line-clamp-2 italic">
                                                    "{c.description}"
                                                </p>
                                            )}

                                            <button
                                                disabled={!canVote || voting !== null}
                                                className={`w-full mt-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer ${!canVote
                                                    ? 'bg-surface-light/50 text-text-muted cursor-not-allowed'
                                                    : 'bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/20 hover:shadow-primary/30'
                                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                onClick={() => promptVote(c)}
                                            >
                                                {voting === c._id ? (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        Voting…
                                                    </span>
                                                ) : alreadyVoted ? (
                                                    'Already Voted'
                                                ) : !isVotable(selectedElection) ? (
                                                    'Election Not Active'
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

            {/* Confirmation Modal */}
            <ConfirmVoteModal
                isOpen={!!confirmCandidate}
                candidate={confirmCandidate}
                onConfirm={handleVote}
                onCancel={() => setConfirmCandidate(null)}
                loading={voting !== null}
            />

            {/* Vote Receipt Modal */}
            <VoteReceiptModal
                isOpen={!!receiptHash}
                receiptHash={receiptHash}
                onClose={() => setReceiptHash(null)}
            />
        </div>
    );
}
