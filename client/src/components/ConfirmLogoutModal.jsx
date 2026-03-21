import { motion, AnimatePresence } from 'framer-motion';
import { LogOut } from 'lucide-react';

export default function ConfirmLogoutModal({ isOpen, onConfirm, onCancel }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={onCancel}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 0 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="w-full max-w-[340px] bg-card border border-border rounded-3xl p-6 shadow-2xl overflow-hidden text-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex flex-col items-center">
                            <div className="w-14 h-14 rounded-full bg-danger/10 flex items-center justify-center mb-4">
                                <LogOut className="w-7 h-7 text-danger" />
                            </div>
                            
                            <h2 className="text-xl font-bold mb-2">Logout</h2>
                            <p className="text-text-muted text-sm mb-6">
                                Are you sure you want to log out?
                            </p>

                            <div className="flex flex-col w-full gap-2">
                                <button
                                    onClick={onConfirm}
                                    className="w-full py-3 rounded-2xl bg-danger hover:bg-danger-dark text-white text-sm font-bold transition-all cursor-pointer shadow-lg shadow-danger/20"
                                >
                                    Logout
                                </button>
                                <button
                                    onClick={onCancel}
                                    className="w-full py-3 rounded-2xl bg-surface-light text-text hover:bg-surface-light/80 text-sm font-semibold transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

