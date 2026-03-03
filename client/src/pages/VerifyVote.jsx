import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../api/axios';
import {
    Search, Shield, CheckCircle, XCircle, Loader2, Calendar, Vote,
} from 'lucide-react';

export default function VerifyVote() {
    const [receiptInput, setReceiptInput] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [result, setResult] = useState(null);

    const handleVerify = async (e) => {
        e.preventDefault();
        const hash = receiptInput.trim();
        if (!hash) { toast.error('Please enter a receipt ID.'); return; }
        setVerifying(true);
        setResult(null);
        try {
            const { data } = await api.get(`/candidate/vote/receipt/${hash}`);
            setResult(data);
        } catch (err) {
            if (err.response?.status === 404) {
                setResult({ valid: false, message: 'Receipt not found. Check the ID and try again.' });
            } else {
                toast.error('Verification failed.');
            }
        } finally {
            setVerifying(false);
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6">
            <div
                className="fixed inset-0 -z-10"
                style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.1) 0%, transparent 55%)' }}
            />
            <div className="max-w-xl mx-auto">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-10 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-5">
                        <Shield className="w-8 h-8 text-primary-light" />
                    </div>
                    <h1
                        className="text-3xl sm:text-4xl font-bold mb-3"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        Verify Your Vote
                    </h1>
                    <p className="text-text-muted text-base max-w-md mx-auto">
                        Paste the receipt ID you received after voting to confirm your vote was securely recorded.
                    </p>
                </motion.div>

                {/* Input Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
                    className="p-6 sm:p-8 rounded-2xl border border-border bg-card backdrop-blur-md"
                >
                    <form onSubmit={handleVerify} className="space-y-4">
                        <div>
                            <label htmlFor="receiptHash" className="block text-sm font-medium text-text-muted mb-2">
                                Vote Receipt ID
                            </label>
                            <input
                                id="receiptHash"
                                type="text"
                                value={receiptInput}
                                onChange={(e) => { setReceiptInput(e.target.value); setResult(null); }}
                                placeholder="Enter your SHA-256 receipt hash"
                                className="w-full px-4 py-3 rounded-xl border border-border bg-surface-light/40 text-text placeholder:text-text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all duration-200 text-sm font-mono"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={verifying || !receiptInput.trim()}
                            className="w-full py-3 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                        >
                            {verifying ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</>
                            ) : (
                                <><Search className="w-4 h-4" /> Verify Receipt</>
                            )}
                        </button>
                    </form>

                    {/* Result */}
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            className={`mt-6 p-5 rounded-xl border ${result.valid
                                    ? 'border-success/30 bg-success/8'
                                    : 'border-red-500/30 bg-red-500/8'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                {result.valid ? (
                                    <CheckCircle className="w-6 h-6 text-success shrink-0 mt-0.5" />
                                ) : (
                                    <XCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                                )}
                                <div>
                                    <p className={`text-base font-semibold mb-1.5 ${result.valid ? 'text-success' : 'text-red-400'}`}>
                                        {result.valid ? 'Vote Verified ✓' : 'Receipt Not Found'}
                                    </p>
                                    <p className="text-sm text-text-muted">{result.message}</p>
                                    {result.valid && (
                                        <div className="mt-3 space-y-1.5 text-sm text-text-muted">
                                            <p className="flex items-center gap-2">
                                                <Vote className="w-3.5 h-3.5 text-primary-light" />
                                                <span className="text-text font-medium">Election:</span> {result.election}
                                            </p>
                                            <p className="flex items-center gap-2">
                                                <Shield className="w-3.5 h-3.5 text-primary-light" />
                                                <span className="text-text font-medium">Status:</span> {result.electionStatus}
                                            </p>
                                            {result.votedAt && (
                                                <p className="flex items-center gap-2">
                                                    <Calendar className="w-3.5 h-3.5 text-primary-light" />
                                                    <span className="text-text font-medium">Voted at:</span> {new Date(result.votedAt).toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Info */}
                    <div className="mt-6 flex items-start gap-2.5 p-3.5 rounded-xl bg-primary/6 border border-primary/12 text-xs text-text-muted">
                        <Shield className="w-4 h-4 shrink-0 text-primary-light mt-0.5" />
                        <span>
                            Your receipt proves your vote was recorded without revealing your choice.
                            This ID was shown to you immediately after voting.
                        </span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
