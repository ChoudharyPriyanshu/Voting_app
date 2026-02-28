import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';
import {
    Plus,
    Pencil,
    Trash2,
    X,
    AlertCircle,
    CheckCircle,
    Users,
    Shield,
} from 'lucide-react';

const emptyForm = { name: '', age: '', party: '' };

export default function ManageCandidates() {
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(null);
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

    const openAddModal = () => {
        setEditingId(null);
        setForm(emptyForm);
        setShowModal(true);
    };

    const openEditModal = (candidate) => {
        setEditingId(candidate._id || null);
        setForm({ name: candidate.name, age: candidate.age || '', party: candidate.party });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingId(null);
        setForm(emptyForm);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (!form.name || !form.age || !form.party) {
            setMessage({ type: 'error', text: 'All fields are required.' });
            return;
        }

        setSubmitting(true);
        try {
            if (editingId) {
                await api.put(`/candidate/${editingId}`, {
                    ...form,
                    age: Number(form.age),
                });
                setMessage({ type: 'success', text: 'Candidate updated successfully!' });
            } else {
                await api.post('/candidate', {
                    ...form,
                    age: Number(form.age),
                });
                setMessage({ type: 'success', text: 'Candidate added successfully!' });
            }
            closeModal();
            fetchCandidates();
        } catch (err) {
            setMessage({
                type: 'error',
                text: err.response?.data?.error || err.response?.data?.message || 'Operation failed.',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (candidateId) => {
        if (!candidateId) return;
        setDeleting(candidateId);
        setMessage({ type: '', text: '' });
        try {
            await api.delete(`/candidate/${candidateId}`);
            setMessage({ type: 'success', text: 'Candidate deleted successfully!' });
            fetchCandidates();
        } catch (err) {
            setMessage({
                type: 'error',
                text: err.response?.data?.error || 'Failed to delete candidate.',
            });
        } finally {
            setDeleting(null);
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10"
                >
                    <div>
                        <div className="flex items-center gap-2 text-accent text-sm font-medium mb-2">
                            <Shield className="w-4 h-4" />
                            Admin Panel
                        </div>
                        <h1
                            className="text-3xl sm:text-4xl font-bold mb-2"
                            style={{ fontFamily: 'var(--font-display)' }}
                        >
                            Manage Candidates
                        </h1>
                        <p className="text-text-muted text-lg">Add, edit, or remove candidates</p>
                    </div>
                    <button
                        onClick={openAddModal}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/25 transition-all duration-300 cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        Add Candidate
                    </button>
                </motion.div>

                {/* Message */}
                <AnimatePresence>
                    {message.text && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={`flex items-center gap-3 p-4 rounded-2xl border text-sm mb-8 ${message.type === 'error'
                                ? 'bg-danger/10 border-danger/20 text-danger'
                                : 'bg-success/10 border-success/20 text-success'
                                }`}
                            role="alert"
                        >
                            {message.type === 'error' ? (
                                <AlertCircle className="w-5 h-5 shrink-0" />
                            ) : (
                                <CheckCircle className="w-5 h-5 shrink-0" />
                            )}
                            {message.text}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Candidates List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : candidates.length === 0 ? (
                    <div className="text-center py-20">
                        <Users className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
                        <p className="text-text-muted mb-4">No candidates added yet.</p>
                        <button
                            onClick={openAddModal}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-dark text-white transition-all duration-300 cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            Add First Candidate
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {candidates.map((c, i) => (
                            <motion.div
                                key={`${c.name}-${c.party}`}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: i * 0.06 }}
                                className="flex items-center justify-between p-5 rounded-2xl border border-border bg-card backdrop-blur-md hover:border-primary/30 transition-all duration-200"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center text-lg font-bold text-primary-light">
                                        {c.name?.charAt(0)?.toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{c.name}</p>
                                        <p className="text-sm text-text-muted">{c.party}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => openEditModal(c)}
                                        className="p-2.5 rounded-xl text-text-muted hover:text-primary-light hover:bg-primary/10 transition-all duration-200 cursor-pointer"
                                        aria-label={`Edit ${c.name}`}
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(c._id)}
                                        disabled={deleting === c._id}
                                        className="p-2.5 rounded-xl text-text-muted hover:text-danger hover:bg-danger/10 transition-all duration-200 cursor-pointer disabled:opacity-50"
                                        aria-label={`Delete ${c.name}`}
                                    >
                                        {deleting === c._id ? (
                                            <span className="w-4 h-4 border-2 border-danger/30 border-t-danger rounded-full animate-spin block" />
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Modal */}
                <AnimatePresence>
                    {showModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center px-4"
                            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
                            onClick={closeModal}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                                className="w-full max-w-md p-6 sm:p-8 rounded-2xl border border-border bg-surface"
                                style={{ backgroundColor: 'var(--color-surface)' }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                                        {editingId ? 'Edit Candidate' : 'Add Candidate'}
                                    </h2>
                                    <button
                                        onClick={closeModal}
                                        className="p-2 rounded-lg hover:bg-surface-light/60 text-text-muted hover:text-text transition-colors cursor-pointer"
                                        aria-label="Close modal"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label htmlFor="candidateName" className="block text-sm font-medium text-text-muted mb-1.5">
                                            Name <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            id="candidateName"
                                            type="text"
                                            value={form.name}
                                            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                                            placeholder="Candidate name"
                                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface-light/40 text-text placeholder:text-text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all duration-200 text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="candidateAge" className="block text-sm font-medium text-text-muted mb-1.5">
                                            Age <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            id="candidateAge"
                                            type="number"
                                            value={form.age}
                                            onChange={(e) => setForm((p) => ({ ...p, age: e.target.value }))}
                                            placeholder="Age"
                                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface-light/40 text-text placeholder:text-text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all duration-200 text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="candidateParty" className="block text-sm font-medium text-text-muted mb-1.5">
                                            Party <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            id="candidateParty"
                                            type="text"
                                            value={form.party}
                                            onChange={(e) => setForm((p) => ({ ...p, party: e.target.value }))}
                                            placeholder="Party name"
                                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface-light/40 text-text placeholder:text-text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all duration-200 text-sm"
                                        />
                                    </div>

                                    <div className="flex items-center gap-3 pt-2">
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                        >
                                            {submitting ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Saving…
                                                </span>
                                            ) : editingId ? (
                                                'Update Candidate'
                                            ) : (
                                                'Add Candidate'
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="px-5 py-2.5 rounded-xl text-sm font-medium border border-border text-text-muted hover:text-text hover:bg-surface-light/40 transition-all duration-200 cursor-pointer"
                                        >
                                            Cancel
                                        </button>
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
