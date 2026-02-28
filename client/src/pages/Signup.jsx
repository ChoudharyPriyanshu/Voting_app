import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Eye, EyeOff, AlertCircle } from 'lucide-react';

const initialForm = {
    name: '',
    age: '',
    mobile: '',
    email: '',
    address: '',
    aadharCardNumber: '',
    password: '',
};

export default function Signup() {
    const { signup } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState(initialForm);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Basic validation
        if (!form.name || !form.age || !form.address || !form.aadharCardNumber || !form.password) {
            setError('Please fill in all required fields.');
            return;
        }
        if (form.aadharCardNumber.length !== 12) {
            setError('Aadhar Card Number must be exactly 12 digits.');
            return;
        }
        if (form.password.length < 4) {
            setError('Password must be at least 4 characters.');
            return;
        }

        setLoading(true);
        try {
            await signup(form);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.message || 'Signup failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fields = [
        { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Enter your full name', required: true },
        { name: 'age', label: 'Age', type: 'number', placeholder: 'Your age', required: true, inputMode: 'numeric' },
        { name: 'mobile', label: 'Mobile', type: 'tel', placeholder: 'Mobile number (optional)' },
        { name: 'email', label: 'Email', type: 'email', placeholder: 'Email address (optional)' },
        { name: 'address', label: 'Address', type: 'text', placeholder: 'Your address', required: true },
        { name: 'aadharCardNumber', label: 'Aadhar Card Number', type: 'text', placeholder: '12-digit Aadhar number', required: true, maxLength: 12, inputMode: 'numeric' },
    ];

    return (
        <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-10">
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
                className="w-full max-w-lg"
            >
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/15 mb-4">
                        <UserPlus className="w-7 h-7 text-primary-light" />
                    </div>
                    <h1
                        className="text-2xl sm:text-3xl font-bold mb-2"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        Create Account
                    </h1>
                    <p className="text-text-muted text-sm">Register to cast your vote securely</p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="p-6 sm:p-8 rounded-2xl border border-border bg-card backdrop-blur-md space-y-4"
                    noValidate
                >
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-start gap-3 p-3.5 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm"
                            role="alert"
                        >
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            {error}
                        </motion.div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {fields.map((f) => (
                            <div key={f.name} className={f.name === 'address' || f.name === 'aadharCardNumber' ? 'sm:col-span-2' : ''}>
                                <label htmlFor={f.name} className="block text-sm font-medium text-text-muted mb-1.5">
                                    {f.label}
                                    {f.required && <span className="text-danger ml-0.5">*</span>}
                                </label>
                                <input
                                    id={f.name}
                                    name={f.name}
                                    type={f.type}
                                    value={form[f.name]}
                                    onChange={handleChange}
                                    placeholder={f.placeholder}
                                    maxLength={f.maxLength}
                                    inputMode={f.inputMode}
                                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface-light/40 text-text placeholder:text-text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all duration-200 text-sm"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Password */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-text-muted mb-1.5">
                            Password <span className="text-danger ml-0.5">*</span>
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Create a strong password"
                                className="w-full px-4 py-2.5 pr-11 rounded-xl border border-border bg-surface-light/40 text-text placeholder:text-text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all duration-200 text-sm"
                                autoComplete="new-password"
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

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/25 hover:shadow-primary/35 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Creating Account…
                            </span>
                        ) : (
                            'Create Account'
                        )}
                    </button>

                    <p className="text-center text-sm text-text-muted pt-1">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary-light hover:text-primary font-medium transition-colors">
                            Sign In
                        </Link>
                    </p>
                </form>
            </motion.div>
        </div>
    );
}
