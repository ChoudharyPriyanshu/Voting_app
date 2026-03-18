import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
    User,
    Mail,
    Phone,
    MapPin,
    CreditCard,
    Calendar,
    Shield,
    CheckCircle,
    XCircle,
    Eye,
    EyeOff,
    Lock,
} from 'lucide-react';

export default function Profile() {
    const { user, refreshProfile } = useAuth();
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [loading, setLoading] = useState(false);

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (!passwordForm.currentPassword || !passwordForm.newPassword) {
            toast.error('Please fill in both fields.');
            return;
        }
        if (passwordForm.newPassword.length < 4) {
            toast.error('New password must be at least 4 characters.');
            return;
        }

        setLoading(true);
        try {
            await api.put('/user/profile/password', passwordForm);
            toast.success('Password updated successfully!');
            setPasswordForm({ currentPassword: '', newPassword: '' });
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update password.');
        } finally {
            setLoading(false);
        }
    };

    const profileFields = [
        { icon: User, label: 'Full Name', value: user?.name },
        { icon: Calendar, label: 'Age', value: user?.age },
        { icon: Mail, label: 'Email', value: user?.email || '—' },
        { icon: Phone, label: 'Mobile', value: user?.mobile || '—' },
        { icon: MapPin, label: 'Address', value: user?.address },
        { icon: CreditCard, label: 'Aadhar Card', value: user?.aadharCardNumber ? `XXXX-XXXX-${String(user.aadharCardNumber).slice(-4)}` : '—' },
        { icon: Shield, label: 'Role', value: user?.role === 'admin' ? 'Administrator' : 'Voter' },
    ];

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto">
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
                        Your Profile
                    </h1>
                    <p className="text-text-muted text-lg">Manage your account information</p>
                </motion.div>

                {/* Profile Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="p-6 sm:p-8 rounded-2xl border border-border bg-card backdrop-blur-md mb-8"
                >
                    {/* Avatar + Status */}
                    <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border/50">
                        <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary-light">
                            {user?.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">{user?.name}</h2>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-sm text-text-muted capitalize">{user?.role}</span>
                                <span className="text-text-muted/30">•</span>
                                <span className={`flex items-center gap-1 text-sm ${user?.votedElections?.length > 0 ? 'text-success' : 'text-text-muted'}`}>
                                    {user?.votedElections?.length > 0 ? (
                                        <>
                                            <CheckCircle className="w-3.5 h-3.5" /> Voted in {user.votedElections.length} election{user.votedElections.length !== 1 ? 's' : ''}
                                        </>
                                    ) : user?.role === 'admin' ? (
                                        <>
                                            <Shield className="w-3.5 h-3.5 text-accent" /> Admin cannot vote
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="w-3.5 h-3.5" /> Not voted yet
                                        </>
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {profileFields.map(({ icon: Icon, label, value }) => (
                            <div key={label} className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-lg bg-surface-light/60 flex items-center justify-center shrink-0 mt-0.5">
                                    <Icon className="w-4 h-4 text-text-muted" />
                                </div>
                                <div>
                                    <p className="text-xs text-text-muted mb-0.5">{label}</p>
                                    <p className="text-sm font-medium">{value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Change Password */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="p-6 sm:p-8 rounded-2xl border border-border bg-card backdrop-blur-md"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                            <Lock className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">Change Password</h3>
                            <p className="text-sm text-text-muted">Update your password for security</p>
                        </div>
                    </div>



                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                            <label htmlFor="currentPassword" className="block text-sm font-medium text-text-muted mb-1.5">
                                Current Password
                            </label>
                            <div className="relative">
                                <input
                                    id="currentPassword"
                                    type={showCurrent ? 'text' : 'password'}
                                    value={passwordForm.currentPassword}
                                    onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
                                    placeholder="Enter current password"
                                    className="w-full px-4 py-2.5 pr-11 rounded-xl border border-border bg-surface-light/40 text-text placeholder:text-text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all duration-200 text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrent(!showCurrent)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors cursor-pointer"
                                    aria-label="Toggle visibility"
                                >
                                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-text-muted mb-1.5">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    id="newPassword"
                                    type={showNew ? 'text' : 'password'}
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                                    placeholder="Enter new password"
                                    className="w-full px-4 py-2.5 pr-11 rounded-xl border border-border bg-surface-light/40 text-text placeholder:text-text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all duration-200 text-sm"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNew(!showNew)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors cursor-pointer"
                                    aria-label="Toggle visibility"
                                >
                                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-accent hover:bg-accent-dark text-black shadow-lg shadow-accent/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    Updating…
                                </span>
                            ) : (
                                'Update Password'
                            )}
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
