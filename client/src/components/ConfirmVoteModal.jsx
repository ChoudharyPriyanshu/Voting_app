import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

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
                        {/* Icon */}
                        <div className="flex justify-center mb-4">
                            <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center">
                                <AlertTriangle className="w-7 h-7 text-accent" />
                            </div>
                        </div>

                        {/* Content */}
                        <h3
                            className="text-xl font-bold text-center mb-2"
                            style={{ fontFamily: 'var(--font-display)' }}
                        >
                            Confirm Your Vote
                        </h3>
                        <p className="text-center text-text-muted text-sm mb-1">
                            You are about to vote for:
                        </p>
                        <div className="text-center mb-4">
                            <p className="text-lg font-semibold text-primary-light">{candidate?.name}</p>
                            <p className="text-sm text-text-muted">{candidate?.party}</p>
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
