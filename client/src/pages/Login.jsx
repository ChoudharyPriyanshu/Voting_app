import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Vote, Eye, EyeOff } from 'lucide-react';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ aadharCardNumber: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.aadharCardNumber || !form.password) {
            toast.error('Please fill in all fields.');
            return;
        }

        setLoading(true);
        try {
            const user = await login(form.aadharCardNumber, form.password);
            navigate(user.role === 'admin' ? '/admin/candidates' : '/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-10">
            {/* Background */}
            <div
                className="fixed inset-0 -z-10"
                style={{
                    background:
                        'radial-gradient(ellipse at 50% 0%, rgba(99, 102, 241, 0.15) 0%, transparent 60%)',
                }}
            />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/15 mb-4">
                        <Vote className="w-7 h-7 text-primary-light" />
                    </div>
                    <h1
                        className="text-2xl sm:text-3xl font-bold mb-2"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        Welcome Back
                    </h1>
                    <p className="text-text-muted text-sm">
                        Sign in with your Aadhar Card Number
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="p-6 sm:p-8 rounded-2xl border border-border bg-card backdrop-blur-md space-y-5"
                    noValidate
                >


                    {/* Aadhar */}
                    <div>
                        <label htmlFor="aadharCardNumber" className="block text-sm font-medium text-text-muted mb-1.5">
                            Aadhar Card Number
                        </label>
                        <input
                            id="aadharCardNumber"
                            name="aadharCardNumber"
                            type="text"
                            inputMode="numeric"
                            maxLength={12}
                            value={form.aadharCardNumber}
                            onChange={handleChange}
                            placeholder="Enter 12-digit Aadhar number"
                            className="w-full px-4 py-3 rounded-xl border border-border bg-surface-light/40 text-text placeholder:text-text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all duration-200 text-sm"
                            autoComplete="username"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-text-muted mb-1.5">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                className="w-full px-4 py-3 pr-11 rounded-xl border border-border bg-surface-light/40 text-text placeholder:text-text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all duration-200 text-sm"
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors cursor-pointer"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/25 hover:shadow-primary/35 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Signing In…
                            </span>
                        ) : (
                            'Sign In'
                        )}
                    </button>

                    <p className="text-center text-sm text-text-muted pt-2">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-primary-light hover:text-primary font-medium transition-colors">
                            Sign Up
                        </Link>
                    </p>
                </form>
            </motion.div>
        </div>
    );
}
