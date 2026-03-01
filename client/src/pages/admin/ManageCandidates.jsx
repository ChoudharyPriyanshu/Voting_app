import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import {
    Plus, Pencil, Trash2, X,
    Users, Shield, Vote, Calendar,
} from 'lucide-react';

const emptyElectionForm = { title: '', description: '', startDate: '', endDate: '' };
const emptyCandidateForm = { name: '', age: '', party: '' };

export default function ManageCandidates() {
    const [elections, setElections] = useState([]);
    const [selectedElection, setSelectedElection] = useState(null);
    const [showElectionModal, setShowElectionModal] = useState(false);
    const [editingElection, setEditingElection] = useState(null);
    const [electionForm, setElectionForm] = useState(emptyElectionForm);

    const [candidates, setCandidates] = useState([]);
    const [showCandidateModal, setShowCandidateModal] = useState(false);
    const [editingCandidate, setEditingCandidate] = useState(null);
    const [candidateForm, setCandidateForm] = useState(emptyCandidateForm);

    const [loading, setLoading] = useState(true);
    const [loadingCandidates, setLoadingCandidates] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(null);

    useEffect(() => { fetchElections(); }, []);

    // ─── Election CRUD ───
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

    const openAddElection = () => {
        setEditingElection(null);
        setElectionForm(emptyElectionForm);
        setShowElectionModal(true);
    };

    const openEditElection = (el) => {
        setEditingElection(el);
        setElectionForm({
            title: el.title,
            description: el.description || '',
            startDate: el.startDate ? new Date(el.startDate).toISOString().slice(0, 16) : '',
            endDate: el.endDate ? new Date(el.endDate).toISOString().slice(0, 16) : '',
        });
        setShowElectionModal(true);
    };

    const handleElectionSubmit = async (e) => {
        e.preventDefault();
        if (!electionForm.title) { toast.error('Election title is required.'); return; }

        const payload = {
            title: electionForm.title,
            description: electionForm.description,
            startDate: electionForm.startDate ? new Date(electionForm.startDate).toISOString() : null,
            endDate: electionForm.endDate ? new Date(electionForm.endDate).toISOString() : null,
        };

        setSubmitting(true);
        try {
            if (editingElection) {
                await api.put(`/election/${editingElection._id}`, payload);
                toast.success('Election updated!');
            } else {
                await api.post('/election', payload);
                toast.success('Election created!');
            }
            setShowElectionModal(false);
            fetchElections();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Operation failed.');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleElectionStatus = async (el) => {
        const newStatus = el.status === 'active' ? 'completed' : 'active';
        try {
            await api.put(`/election/${el._id}`, { status: newStatus });
            toast.success(`Election marked as ${newStatus}.`);
            fetchElections();
            if (selectedElection?._id === el._id) setSelectedElection({ ...el, status: newStatus });
        } catch {
            toast.error('Failed to update status.');
        }
    };

    const deleteElection = async (id) => {
        setDeleting(id);
        try {
            await api.delete(`/election/${id}`);
            toast.success('Election deleted.');
            if (selectedElection?._id === id) { setSelectedElection(null); setCandidates([]); }
            fetchElections();
        } catch {
            toast.error('Failed to delete election.');
        } finally {
            setDeleting(null);
        }
    };

    // ─── Candidate CRUD ───
    const selectElection = async (el) => {
        setSelectedElection(el);
        setLoadingCandidates(true);
        try {
            const { data } = await api.get(`/candidate/list/${el._id}`);
            setCandidates(data);
        } catch {
            toast.error('Failed to load candidates.');
        } finally {
            setLoadingCandidates(false);
        }
    };

    const openAddCandidate = () => { setEditingCandidate(null); setCandidateForm(emptyCandidateForm); setShowCandidateModal(true); };

    const openEditCandidate = (c) => { setEditingCandidate(c); setCandidateForm({ name: c.name, age: c.age || '', party: c.party }); setShowCandidateModal(true); };

    const handleCandidateSubmit = async (e) => {
        e.preventDefault();
        if (!candidateForm.name || !candidateForm.age || !candidateForm.party) { toast.error('All candidate fields are required.'); return; }
        setSubmitting(true);
        try {
            if (editingCandidate) {
                await api.put(`/candidate/${editingCandidate._id}`, { ...candidateForm, age: Number(candidateForm.age) });
                toast.success('Candidate updated!');
            } else {
                await api.post('/candidate', { ...candidateForm, age: Number(candidateForm.age), election: selectedElection._id });
                toast.success('Candidate added!');
            }
            setShowCandidateModal(false);
            selectElection(selectedElection);
        } catch (err) {
            toast.error(err.response?.data?.message || err.response?.data?.error || 'Operation failed.');
        } finally {
            setSubmitting(false);
        }
    };

    const deleteCandidate = async (id) => {
        setDeleting(id);
        try {
            await api.delete(`/candidate/${id}`);
            toast.success('Candidate deleted.');
            selectElection(selectedElection);
        } catch {
            toast.error('Failed to delete candidate.');
        } finally {
            setDeleting(null);
        }
    };

    // ─── Render ───
    const inputClass = "w-full px-4 py-2.5 rounded-xl border border-border bg-surface-light/40 text-text placeholder:text-text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all duration-200 text-sm";

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-10">
                    <div className="flex items-center gap-2 text-accent text-sm font-medium mb-2">
                        <Shield className="w-4 h-4" /> Admin Panel
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                        Manage Elections & Candidates
                    </h1>
                    <p className="text-text-muted text-lg">Create elections, set deadlines, manage candidates</p>
                </motion.div>

                {/* Two-column */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Elections */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-lg">Elections</h2>
                            <button onClick={openAddElection} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/25 transition-all duration-300 cursor-pointer">
                                <Plus className="w-3.5 h-3.5" /> New
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
                        ) : elections.length === 0 ? (
                            <div className="text-center py-12 border border-dashed border-border rounded-2xl">
                                <Calendar className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-50" />
                                <p className="text-text-muted text-sm mb-3">No elections yet</p>
                                <button onClick={openAddElection} className="text-sm text-primary-light hover:text-primary font-medium cursor-pointer">Create first election</button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {elections.map((el, i) => (
                                    <motion.div key={el._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}
                                        onClick={() => selectElection(el)}
                                        className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${selectedElection?._id === el._id ? 'border-primary/50 bg-primary/10' : 'border-border bg-card hover:border-primary/30'}`}
                                    >
                                        <div className="flex items-start justify-between mb-1">
                                            <h3 className="font-semibold text-sm pr-2">{el.title}</h3>
                                            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${el.status === 'active' ? 'bg-success/15 text-success' : 'bg-text-muted/15 text-text-muted'}`}>{el.status}</span>
                                        </div>
                                        {el.description && <p className="text-xs text-text-muted line-clamp-1">{el.description}</p>}
                                        {(el.startDate || el.endDate) && (
                                            <p className="text-[10px] text-text-muted/60 mt-1">
                                                {el.startDate && <span>Start: {new Date(el.startDate).toLocaleString()}</span>}
                                                {el.startDate && el.endDate && <span> • </span>}
                                                {el.endDate && <span>End: {new Date(el.endDate).toLocaleString()}</span>}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-2 mt-2">
                                            <button onClick={(e) => { e.stopPropagation(); openEditElection(el); }} className="p-1.5 rounded-lg text-text-muted hover:text-primary-light hover:bg-primary/10 transition-all cursor-pointer" aria-label="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                                            <button onClick={(e) => { e.stopPropagation(); toggleElectionStatus(el); }} className="px-2 py-1 rounded-lg text-[10px] font-medium border border-border hover:border-primary/30 text-text-muted hover:text-text transition-all cursor-pointer">{el.status === 'active' ? 'End' : 'Reopen'}</button>
                                            <button onClick={(e) => { e.stopPropagation(); deleteElection(el._id); }} disabled={deleting === el._id} className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-all cursor-pointer disabled:opacity-50" aria-label="Delete">
                                                {deleting === el._id ? <span className="w-3.5 h-3.5 border-2 border-danger/30 border-t-danger rounded-full animate-spin block" /> : <Trash2 className="w-3.5 h-3.5" />}
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Candidates */}
                    <div className="lg:col-span-3">
                        {!selectedElection ? (
                            <div className="flex items-center justify-center h-full min-h-[300px] rounded-2xl border border-dashed border-border">
                                <div className="text-center"><Vote className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-40" /><p className="text-text-muted text-sm">Select an election to manage its candidates</p></div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <div><h2 className="font-semibold text-lg">{selectedElection.title}</h2><p className="text-xs text-text-muted">Candidates in this election</p></div>
                                    <button onClick={openAddCandidate} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/25 transition-all duration-300 cursor-pointer"><Plus className="w-3.5 h-3.5" /> Add</button>
                                </div>
                                {loadingCandidates ? (
                                    <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
                                ) : candidates.length === 0 ? (
                                    <div className="text-center py-12 border border-dashed border-border rounded-2xl">
                                        <Users className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-50" /><p className="text-text-muted text-sm mb-3">No candidates yet</p>
                                        <button onClick={openAddCandidate} className="text-sm text-primary-light hover:text-primary font-medium cursor-pointer">Add first candidate</button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {candidates.map((c, i) => (
                                            <motion.div key={c._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}
                                                className="flex items-center justify-between p-4 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all duration-200"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-sm font-bold text-primary-light">{c.name?.charAt(0)?.toUpperCase()}</div>
                                                    <div><p className="font-semibold text-sm">{c.name}</p><p className="text-xs text-text-muted">{c.party} • Age {c.age}</p></div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => openEditCandidate(c)} className="p-2 rounded-xl text-text-muted hover:text-primary-light hover:bg-primary/10 transition-all cursor-pointer" aria-label={`Edit ${c.name}`}><Pencil className="w-3.5 h-3.5" /></button>
                                                    <button onClick={() => deleteCandidate(c._id)} disabled={deleting === c._id} className="p-2 rounded-xl text-text-muted hover:text-danger hover:bg-danger/10 transition-all cursor-pointer disabled:opacity-50" aria-label={`Delete ${c.name}`}>
                                                        {deleting === c._id ? <span className="w-3.5 h-3.5 border-2 border-danger/30 border-t-danger rounded-full animate-spin block" /> : <Trash2 className="w-3.5 h-3.5" />}
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* ─── Election Modal ─── */}
                <AnimatePresence>
                    {showElectionModal && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setShowElectionModal(false)}>
                            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.3 }}
                                className="w-full max-w-md p-6 sm:p-8 rounded-2xl border border-border" style={{ backgroundColor: 'var(--color-surface)' }} onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{editingElection ? 'Edit Election' : 'New Election'}</h2>
                                    <button onClick={() => setShowElectionModal(false)} className="p-2 rounded-lg hover:bg-surface-light/60 text-text-muted hover:text-text transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
                                </div>
                                <form onSubmit={handleElectionSubmit} className="space-y-4">
                                    <div>
                                        <label htmlFor="elTitle" className="block text-sm font-medium text-text-muted mb-1.5">Title <span className="text-danger">*</span></label>
                                        <input id="elTitle" type="text" value={electionForm.title} onChange={(e) => setElectionForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. 2024 Presidential Election" className={inputClass} />
                                    </div>
                                    <div>
                                        <label htmlFor="elDesc" className="block text-sm font-medium text-text-muted mb-1.5">Description</label>
                                        <textarea id="elDesc" rows={2} value={electionForm.description} onChange={(e) => setElectionForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional description" className={`${inputClass} resize-none`} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label htmlFor="elStart" className="block text-sm font-medium text-text-muted mb-1.5">Start Date</label>
                                            <input id="elStart" type="datetime-local" value={electionForm.startDate} onChange={(e) => setElectionForm(p => ({ ...p, startDate: e.target.value }))} className={`${inputClass} [color-scheme:dark]`} />
                                        </div>
                                        <div>
                                            <label htmlFor="elEnd" className="block text-sm font-medium text-text-muted mb-1.5">End Date</label>
                                            <input id="elEnd" type="datetime-local" value={electionForm.endDate} onChange={(e) => setElectionForm(p => ({ ...p, endDate: e.target.value }))} className={`${inputClass} [color-scheme:dark]`} />
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-text-muted/60">Leave dates empty for elections with no time limit.</p>
                                    <div className="flex items-center gap-3 pt-2">
                                        <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/25 transition-all duration-300 disabled:opacity-50 cursor-pointer">
                                            {submitting ? <span className="flex items-center justify-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</span> : editingElection ? 'Update' : 'Create'}
                                        </button>
                                        <button type="button" onClick={() => setShowElectionModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium border border-border text-text-muted hover:text-text hover:bg-surface-light/40 transition-all cursor-pointer">Cancel</button>
                                    </div>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ─── Candidate Modal ─── */}
                <AnimatePresence>
                    {showCandidateModal && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setShowCandidateModal(false)}>
                            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.3 }}
                                className="w-full max-w-md p-6 sm:p-8 rounded-2xl border border-border" style={{ backgroundColor: 'var(--color-surface)' }} onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{editingCandidate ? 'Edit Candidate' : 'Add Candidate'}</h2>
                                    <button onClick={() => setShowCandidateModal(false)} className="p-2 rounded-lg hover:bg-surface-light/60 text-text-muted hover:text-text transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
                                </div>
                                <form onSubmit={handleCandidateSubmit} className="space-y-4">
                                    <div><label htmlFor="cName" className="block text-sm font-medium text-text-muted mb-1.5">Name <span className="text-danger">*</span></label><input id="cName" type="text" value={candidateForm.name} onChange={(e) => setCandidateForm(p => ({ ...p, name: e.target.value }))} placeholder="Candidate name" className={inputClass} /></div>
                                    <div><label htmlFor="cAge" className="block text-sm font-medium text-text-muted mb-1.5">Age <span className="text-danger">*</span></label><input id="cAge" type="number" value={candidateForm.age} onChange={(e) => setCandidateForm(p => ({ ...p, age: e.target.value }))} placeholder="Age" className={inputClass} /></div>
                                    <div><label htmlFor="cParty" className="block text-sm font-medium text-text-muted mb-1.5">Party <span className="text-danger">*</span></label><input id="cParty" type="text" value={candidateForm.party} onChange={(e) => setCandidateForm(p => ({ ...p, party: e.target.value }))} placeholder="Party name" className={inputClass} /></div>
                                    <div className="flex items-center gap-3 pt-2">
                                        <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/25 transition-all duration-300 disabled:opacity-50 cursor-pointer">
                                            {submitting ? <span className="flex items-center justify-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</span> : editingCandidate ? 'Update' : 'Add'}
                                        </button>
                                        <button type="button" onClick={() => setShowCandidateModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium border border-border text-text-muted hover:text-text hover:bg-surface-light/40 transition-all cursor-pointer">Cancel</button>
                                    </div>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
