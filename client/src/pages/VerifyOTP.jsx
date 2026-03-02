import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Mail, RefreshCw } from 'lucide-react';

export default function VerifyOTP() {
    const navigate = useNavigate();
    const location = useLocation();
    const { refreshProfile } = useAuth();
    const email = location.state?.email || '';

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const inputRefs = useRef([]);

    // Redirect if no email
    useEffect(() => {
        if (!email) {
            navigate('/signup');
        }
    }, [email, navigate]);

    // Cooldown timer
    useEffect(() => {
        if (cooldown <= 0) return;
        const id = setInterval(() => setCooldown((c) => c - 1), 1000);
        return () => clearInterval(id);
    }, [cooldown]);

    const handleChange = (index, value) => {
        if (!/^\d*$/.test(value)) return; // digits only
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            setOtp(pasted.split(''));
            inputRefs.current[5]?.focus();
        }
    };

    const handleVerify = async () => {
        const code = otp.join('');
        if (code.length !== 6) {
            toast.error('Please enter the complete 6-digit code.');
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.post('/user/verify-otp', { email, otp: code });
            localStorage.setItem('voting_token', data.token);
            toast.success('Email verified successfully!');
            await refreshProfile();
            navigate(data.user?.role === 'admin' ? '/admin/candidates' : '/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Verification failed.');
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (cooldown > 0) return;
        setResending(true);
        try {
            await api.post('/user/resend-otp', { email });
            toast.success('New OTP sent to your email!');
            setCooldown(60);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to resend OTP.');
        } finally {
            setResending(false);
        }
    };

    // Auto-submit when all 6 digits entered
    useEffect(() => {
        if (otp.every((d) => d !== '')) {
            handleVerify();
        }
    }, [otp]);

    return (
        <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-10">
            <div
                className="fixed inset-0 -z-10"
                style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(99, 102, 241, 0.15) 0%, transparent 60%)' }}
            />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/15 mb-4">
                        <Mail className="w-7 h-7 text-primary-light" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                        Verify Your Email
                    </h1>
                    <p className="text-text-muted text-sm">
                        We sent a 6-digit code to{' '}
                        <span className="text-primary-light font-medium">{email}</span>
                    </p>
                </div>

                <div className="p-6 sm:p-8 rounded-2xl border border-border bg-card backdrop-blur-md">
                    {/* OTP Inputs */}
                    <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6" onPaste={handlePaste}>
                        {otp.map((digit, i) => (
                            <input
                                key={i}
                                ref={(el) => (inputRefs.current[i] = el)}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(i, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(i, e)}
                                className="w-11 h-13 sm:w-13 sm:h-15 text-center text-xl sm:text-2xl font-bold rounded-xl border border-border bg-surface-light/40 text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                                autoFocus={i === 0}
                            />
                        ))}
                    </div>

                    {/* Verify Button */}
                    <button
                        onClick={handleVerify}
                        disabled={loading || otp.some((d) => d === '')}
                        className="w-full py-3 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mb-4"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Verifying…
                            </span>
                        ) : (
                            'Verify Email'
                        )}
                    </button>

                    {/* Resend */}
                    <div className="text-center">
                        <p className="text-sm text-text-muted mb-2">Didn't receive the code?</p>
                        <button
                            onClick={handleResend}
                            disabled={resending || cooldown > 0}
                            className="inline-flex items-center gap-1.5 text-sm text-primary-light hover:text-primary font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
