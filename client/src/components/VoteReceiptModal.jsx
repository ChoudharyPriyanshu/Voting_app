import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Copy, X, Shield } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function VoteReceiptModal({ isOpen, receiptHash, onClose }) {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(receiptHash);
            setCopied(true);
            toast.success('Receipt ID copied!');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('Failed to copy');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center px-4"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.25 }}
                        className="w-full max-w-md p-6 rounded-2xl border border-border"
                        style={{ backgroundColor: 'var(--color-surface)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Success Icon */}
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-14 h-14 rounded-2xl bg-success/15 flex items-center justify-center">
                                <CheckCircle className="w-7 h-7 text-success" />
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-lg hover:bg-surface-light/60 text-text-muted hover:text-text transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Title */}
                        <h3
                            className="text-xl font-bold mb-1"
                            style={{ fontFamily: 'var(--font-display)' }}
                        >
                            Vote Recorded Successfully!
                        </h3>
                        <p className="text-text-muted text-sm mb-5">
                            Your vote has been securely recorded. Save your receipt ID below to verify your vote later.
                        </p>

                        {/* Receipt Hash */}
                        <div className="mb-5">
                            <div className="flex items-center gap-2 text-xs text-text-muted mb-2">
                                <Shield className="w-3.5 h-3.5 text-primary-light" />
                                <span className="uppercase tracking-wider font-medium">Vote Receipt ID</span>
                            </div>
                            <div
                                className="relative group p-4 rounded-xl border border-border bg-surface-light/30 break-all font-mono text-xs text-text-muted leading-relaxed cursor-pointer hover:border-primary/40 transition-colors"
                                onClick={copyToClipboard}
                            >
                                {receiptHash}
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Copy className="w-4 h-4 text-primary-light" />
                                </div>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/8 border border-primary/15 text-xs text-text-muted mb-5">
                            <Shield className="w-3.5 h-3.5 shrink-0 text-primary-light mt-0.5" />
                            <span>
                                This receipt proves your vote was recorded without revealing your choice.
                                You can verify it anytime from your Profile page.
                            </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={copyToClipboard}
                                className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-border text-text-muted hover:text-text hover:bg-surface-light/40 transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                                <Copy className="w-4 h-4" />
                                {copied ? 'Copied!' : 'Copy Receipt'}
                            </button>
                            <button
                                onClick={onClose}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/25 transition-all duration-300 cursor-pointer"
                            >
                                Done
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
