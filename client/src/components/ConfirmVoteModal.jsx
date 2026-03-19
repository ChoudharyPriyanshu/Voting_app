import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Shield } from 'lucide-react';
import api from '../api/axios';

export default function ConfirmVoteModal({ isOpen, candidate, onConfirm, onCancel, loading }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center px-4"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
                    onClick={onCancel}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.25 }}
                        className="w-full max-w-sm p-6 rounded-2xl border border-border"
                        style={{ backgroundColor: 'var(--color-surface)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Candidate Identity */}
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-light/40 border border-border mb-6">
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-primary/10 border border-border shrink-0">
                                {candidate?.photo ? (
                                    <img src={candidate.photo} alt={candidate.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xl font-bold text-primary-light">
                                        {candidate?.name?.charAt(0)?.toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-lg truncate">{candidate?.name}</h3>
                                    {candidate?.symbol && (
                                        <img src={candidate.symbol} alt="symbol" className="w-5 h-5 object-contain" />
                                    )}
                                </div>
                                <p className="text-sm text-primary-light font-medium">{candidate?.party}</p>
                                {candidate?.position && <p className="text-[10px] text-text-muted uppercase tracking-wider">{candidate.position}</p>}
                            </div>
                        </div>

                        {/* Warning */}
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs mb-6">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            This action cannot be undone. You can only vote once per election.
                        </div>

                        {/* Buttons */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onCancel}
                                disabled={loading}
                                className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-border text-text-muted hover:text-text hover:bg-surface-light/40 transition-all cursor-pointer disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={loading}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/25 transition-all duration-300 disabled:opacity-50 cursor-pointer"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Voting…
                                    </span>
                                ) : (
                                    'Confirm Vote'
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
