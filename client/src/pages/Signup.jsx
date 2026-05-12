import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Eye, EyeOff, ChevronRight, ChevronLeft, Upload, X, AlertTriangle, Check } from 'lucide-react';
import indianStates from '../data/indianStates';

const STEPS = ['Personal Details', 'Address & Identity', 'Account Setup'];

const initialForm = {
    name: '', dob: '', gender: '', mobile: '', email: '',
    state: '', district: '', pincode: '', address: '',
    aadharCardNumber: '', voterIdNumber: '', profilePhoto: null,
    password: '', confirmPassword: '', role: 'voter',
    constituency: '', citizenship: 'Indian', termsAccepted: false,
    organizationName: '', officialEmail: '', employeeId: '',
    designation: '', reasonForAccess: '', verificationDocument: null, linkedInUrl: '',
};

function getPasswordStrength(p) {
    if (!p) return { level: 0, label: '', color: '' };
    let s = 0;
    if (p.length >= 8) s++;
    if (p.length >= 12) s++;
    if (/[a-z]/.test(p)) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[@$!%*?&#+\-_]/.test(p)) s++;
    if (s <= 2) return { level: 1, label: 'Weak', color: '#ef4444' };
    if (s <= 3) return { level: 2, label: 'Fair', color: '#f59e0b' };
    if (s <= 4) return { level: 3, label: 'Strong', color: '#3b82f6' };
    return { level: 4, label: 'Very Strong', color: '#10b981' };
}

function formatAadhaarDisplay(raw) {
    if (!raw) return '';
    const d = raw.replace(/\D/g, '').slice(0, 12);
    // Format as ####-####-####
    if (d.length <= 4) return d;
    if (d.length <= 8) return d.slice(0, 4) + '-' + d.slice(4);
    return d.slice(0, 4) + '-' + d.slice(4, 8) + '-' + d.slice(8);
}

export default function Signup() {
    const { signup } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [form, setForm] = useState(initialForm);
    const [rawAadhaar, setRawAadhaar] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [profilePreview, setProfilePreview] = useState(null);
    const [docPreview, setDocPreview] = useState(null);

    const districts = useMemo(() => form.state ? (indianStates[form.state] || []) : [], [form.state]);
    const pwStrength = getPasswordStrength(form.password);

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        if (type === 'checkbox') {
            setForm(p => ({ ...p, [name]: checked }));
        } else if (type === 'file') {
            const file = files[0];
            if (!file) return;
            setForm(p => ({ ...p, [name]: file }));
            const url = URL.createObjectURL(file);
            if (name === 'profilePhoto') setProfilePreview(url);
            if (name === 'verificationDocument') setDocPreview(url);
        } else {
            setForm(p => ({ ...p, [name]: value }));
            if (name === 'state') setForm(p => ({ ...p, state: value, district: '' }));
        }
        if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
    };

    const handleAadhaarChange = (e) => {
        const raw = e.target.value.replace(/[^0-9]/g, '').slice(0, 12);
        setRawAadhaar(raw);
        setForm(p => ({ ...p, aadharCardNumber: raw }));
        if (errors.aadharCardNumber) setErrors(p => ({ ...p, aadharCardNumber: '' }));
    };

    const removeFile = (field) => {
        setForm(p => ({ ...p, [field]: null }));
        if (field === 'profilePhoto') setProfilePreview(null);
        if (field === 'verificationDocument') setDocPreview(null);
    };

    const validateStep = (s) => {
        const e = {};
        if (s === 0) {
            if (!form.name || form.name.trim().length < 2) e.name = 'Full name is required';
            if (!form.dob) e.dob = 'Date of birth is required';
            else {
                const age = Math.floor((Date.now() - new Date(form.dob)) / 31557600000);
                if (age < 18) e.dob = 'You must be at least 18 years old';
                if (age > 120) e.dob = 'Invalid date of birth';
            }
            if (!form.gender) e.gender = 'Gender is required';
            if (!form.mobile || !/^\d{10}$/.test(form.mobile)) e.mobile = 'Valid 10-digit mobile required';
            if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required';
        } else if (s === 1) {
            if (!form.state) e.state = 'State is required';
            if (!form.district) e.district = 'District is required';
            if (!form.pincode || !/^\d{6}$/.test(form.pincode)) e.pincode = 'Valid 6-digit pincode required';
            if (!form.address || form.address.trim().length < 10) e.address = 'Address required (min 10 chars)';
            if (!rawAadhaar || rawAadhaar.length !== 12) e.aadharCardNumber = '12-digit Aadhaar required';
            if (!form.voterIdNumber || form.voterIdNumber.trim().length < 6) e.voterIdNumber = 'Valid Voter ID required';
        } else if (s === 2) {
            if (!form.password) e.password = 'Password is required';
            else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#+\-_]).{8,}$/.test(form.password))
                e.password = 'Min 8 chars, uppercase, lowercase, number, special char';
            if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
            if (form.role === 'voter') {
                if (!form.constituency) e.constituency = 'Constituency is required';
                if (!form.termsAccepted) e.termsAccepted = 'You must accept terms';
            }
            if (form.role === 'admin') {
                if (!form.organizationName) e.organizationName = 'Organization name required';
                if (!form.officialEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.officialEmail))
                    e.officialEmail = 'Valid official email required';
                if (!form.employeeId) e.employeeId = 'Employee ID required';
                if (!form.designation) e.designation = 'Designation required';
                if (!form.reasonForAccess || form.reasonForAccess.length < 10)
                    e.reasonForAccess = 'Reason required (min 10 chars)';
            }
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const nextStep = () => { if (validateStep(step)) setStep(s => Math.min(s + 1, 2)); };
    const prevStep = () => setStep(s => Math.max(s - 1, 0));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep(2)) return;
        setLoading(true);
        try {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => {
                if (v !== null && v !== undefined && k !== 'profilePhoto' && k !== 'verificationDocument') {
                    fd.append(k, v);
                }
            });
            if (form.profilePhoto) fd.append('profilePhoto', form.profilePhoto);
            if (form.role === 'admin' && form.verificationDocument) fd.append('verificationDocument', form.verificationDocument);

            const data = await signup(fd);
            if (data.needsVerification) {
                toast.success('Account created! Check your email for OTP.');
                navigate('/verify-otp', { state: { email: form.email } });
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.response?.data?.error || 'Signup failed.');
        } finally {
            setLoading(false);
        }
    };

    const inputCls = "w-full px-4 py-2.5 rounded-xl border border-border bg-surface-light/40 text-text placeholder:text-text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all duration-200 text-sm";
    const selectCls = inputCls + " appearance-none cursor-pointer";
    const errCls = "text-danger text-xs mt-1";
    const labelCls = "block text-sm font-medium text-text-muted mb-1.5";

    const renderField = (name, label, type = 'text', opts = {}) => (
        <div className={opts.full ? 'sm:col-span-2' : ''} key={name}>
            <label htmlFor={name} className={labelCls}>
                {label} {opts.required !== false && <span className="text-danger ml-0.5">*</span>}
            </label>
            {opts.type === 'select' ? (
                <select id={name} name={name} value={form[name]} onChange={handleChange} className={selectCls}>
                    <option value="">{opts.placeholder || `Select ${label}`}</option>
                    {(opts.options || []).map(o => typeof o === 'string'
                        ? <option key={o} value={o}>{o}</option>
                        : <option key={o.value} value={o.value}>{o.label}</option>
                    )}
                </select>
            ) : opts.type === 'textarea' ? (
                <textarea id={name} name={name} value={form[name]} onChange={handleChange} placeholder={opts.placeholder}
                    rows={3} className={inputCls + " resize-none"} />
            ) : (
                <input id={name} name={name} type={type} value={form[name]} onChange={handleChange}
                    placeholder={opts.placeholder} maxLength={opts.maxLength} inputMode={opts.inputMode}
                    className={inputCls} autoComplete={opts.autoComplete} />
            )}
            {errors[name] && <p className={errCls}>{errors[name]}</p>}
        </div>
    );

    const stepVariants = {
        enter: (d) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (d) => ({ x: d < 0 ? 80 : -80, opacity: 0 }),
    };
    const [direction, setDirection] = useState(0);

    const goNext = () => { if (validateStep(step)) { setDirection(1); setStep(s => s + 1); } };
    const goPrev = () => { setDirection(-1); setStep(s => s - 1); };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-10">
            <div className="fixed inset-0 -z-10" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(99, 102, 241, 0.15) 0%, transparent 60%)' }} />

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-2xl">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/15 mb-4">
                        <UserPlus className="w-7 h-7 text-primary-light" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>Create Account</h1>
                    <p className="text-text-muted text-sm">Register to cast your vote securely</p>
                </div>

                {/* Step indicator */}
                <div className="flex items-center justify-center gap-2 mb-6">
                    {STEPS.map((s, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${i < step ? 'bg-success text-white' : i === step ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-surface-light text-text-muted'}`}>
                                {i < step ? <Check className="w-4 h-4" /> : i + 1}
                            </div>
                            <span className={`text-xs hidden sm:block ${i === step ? 'text-primary-light font-medium' : 'text-text-muted'}`}>{s}</span>
                            {i < 2 && <div className={`w-8 sm:w-12 h-0.5 ${i < step ? 'bg-success' : 'bg-surface-light'}`} />}
                        </div>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-2xl border border-border bg-card backdrop-blur-md" noValidate>
                    <AnimatePresence mode="wait" custom={direction}>
                        {step === 0 && (
                            <motion.div key="step0" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {renderField('name', 'Full Name', 'text', { placeholder: 'Enter your full name' })}
                                {renderField('dob', 'Date of Birth', 'date', {})}
                                {renderField('gender', 'Gender', 'text', { type: 'select', options: [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }] })}
                                {renderField('mobile', 'Mobile Number', 'tel', { placeholder: '10-digit mobile', maxLength: 10, inputMode: 'numeric' })}
                                {renderField('email', 'Email Address', 'email', { placeholder: 'your@email.com', full: true })}
                            </motion.div>
                        )}

                        {step === 1 && (
                            <motion.div key="step1" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {renderField('state', 'State', 'text', { type: 'select', options: Object.keys(indianStates).sort() })}
                                {renderField('district', 'District', 'text', { type: 'select', options: districts, placeholder: form.state ? 'Select District' : 'Select state first' })}
                                {renderField('pincode', 'Pincode', 'text', { placeholder: '6-digit pincode', maxLength: 6, inputMode: 'numeric' })}
                                {renderField('address', 'Full Address', 'text', { type: 'textarea', placeholder: 'Enter your full address', full: true })}

                                {/* Aadhaar masked input */}
                                <div>
                                    <label htmlFor="aadharCardNumber" className={labelCls}>Aadhaar Number <span className="text-danger ml-0.5">*</span></label>
                                    <input id="aadharCardNumber" type="text" value={formatAadhaarDisplay(rawAadhaar)}
                                        onChange={handleAadhaarChange} placeholder="XXXX-XXXX-XXXX" maxLength={14} inputMode="numeric" className={inputCls} />
                                    <input type="hidden" name="aadharCardNumber" value={rawAadhaar} />
                                    {errors.aadharCardNumber && <p className={errCls}>{errors.aadharCardNumber}</p>}
                                </div>

                                {renderField('voterIdNumber', 'Voter ID Number', 'text', { placeholder: 'e.g. ABC1234567' })}

                                {/* Profile Photo Upload */}
                                <div className="sm:col-span-2">
                                    <label className={labelCls}>Profile Photo <span className="text-text-muted text-xs">(optional, max 5MB)</span></label>
                                    <div className="flex items-center gap-4">
                                        {profilePreview ? (
                                            <div className="relative">
                                                <img src={profilePreview} alt="Preview" className="w-16 h-16 rounded-xl object-cover border border-border" />
                                                <button type="button" onClick={() => removeFile('profilePhoto')}
                                                    className="absolute -top-2 -right-2 w-5 h-5 bg-danger rounded-full flex items-center justify-center cursor-pointer">
                                                    <X className="w-3 h-3 text-white" />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-border bg-surface-light/20 text-text-muted text-sm cursor-pointer hover:border-primary hover:text-primary-light transition-all">
                                                <Upload className="w-4 h-4" /> Choose Photo
                                                <input type="file" name="profilePhoto" accept="image/jpeg,image/png,image/webp" onChange={handleChange} className="hidden" />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div key="step2" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-4">
                                {/* Password */}
                                <div>
                                    <label htmlFor="password" className={labelCls}>Password <span className="text-danger ml-0.5">*</span></label>
                                    <div className="relative">
                                        <input id="password" name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange}
                                            placeholder="Min 8 chars, upper, lower, number, special" className={inputCls + " pr-11"} autoComplete="new-password" />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors cursor-pointer">
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {form.password && (
                                        <div className="mt-2">
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4].map(i => (
                                                    <div key={i} className="h-1.5 flex-1 rounded-full transition-all duration-300"
                                                        style={{ backgroundColor: i <= pwStrength.level ? pwStrength.color : 'rgba(99,102,241,0.15)' }} />
                                                ))}
                                            </div>
                                            <p className="text-xs mt-1" style={{ color: pwStrength.color }}>{pwStrength.label}</p>
                                        </div>
                                    )}
                                    {errors.password && <p className={errCls}>{errors.password}</p>}
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label htmlFor="confirmPassword" className={labelCls}>Confirm Password <span className="text-danger ml-0.5">*</span></label>
                                    <div className="relative">
                                        <input id="confirmPassword" name="confirmPassword" type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={handleChange}
                                            placeholder="Re-enter your password" className={inputCls + " pr-11"} autoComplete="new-password" />
                                        <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors cursor-pointer">
                                            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {errors.confirmPassword && <p className={errCls}>{errors.confirmPassword}</p>}
                                </div>

                                {/* Role */}
                                <div>
                                    <label htmlFor="role" className={labelCls}>Role <span className="text-danger ml-0.5">*</span></label>
                                    <select id="role" name="role" value={form.role} onChange={handleChange} className={selectCls}>
                                        <option value="voter">Voter</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>

                                {/* Voter-specific */}
                                {form.role === 'voter' && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 pt-2 border-t border-border">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {renderField('constituency', 'Constituency', 'text', { placeholder: 'Your constituency' })}
                                            {renderField('citizenship', 'Citizenship', 'text', { placeholder: 'Indian', required: false })}
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <input type="checkbox" id="termsAccepted" name="termsAccepted" checked={form.termsAccepted} onChange={handleChange}
                                                className="mt-1 accent-primary cursor-pointer" />
                                            <label htmlFor="termsAccepted" className="text-sm text-text-muted cursor-pointer">
                                                I accept the <span className="text-primary-light">Terms & Conditions</span> and confirm all information is accurate.
                                            </label>
                                        </div>
                                        {errors.termsAccepted && <p className={errCls}>{errors.termsAccepted}</p>}
                                    </motion.div>
                                )}

                                {/* Admin-specific */}
                                {form.role === 'admin' && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 pt-2 border-t border-border">
                                        <div className="flex items-start gap-3 p-3 rounded-xl bg-accent/10 border border-accent/20">
                                            <AlertTriangle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                                            <p className="text-sm text-accent">Admin accounts require manual approval before activation.</p>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {renderField('organizationName', 'Organization Name', 'text', { placeholder: 'Your organization' })}
                                            {renderField('officialEmail', 'Official Email', 'email', { placeholder: 'official@org.com' })}
                                            {renderField('employeeId', 'Employee/Admin ID', 'text', { placeholder: 'Your employee ID' })}
                                            {renderField('designation', 'Designation', 'text', { placeholder: 'Your designation' })}
                                        </div>
                                        {renderField('reasonForAccess', 'Reason for Admin Access', 'text', { type: 'textarea', placeholder: 'Explain why you need admin access (min 10 chars)', full: true })}
                                        {renderField('linkedInUrl', 'LinkedIn/Profile URL', 'url', { placeholder: 'https://linkedin.com/in/...', required: false })}

                                        {/* Verification Document */}
                                        <div>
                                            <label className={labelCls}>Verification Document <span className="text-text-muted text-xs">(PDF/Image, max 10MB)</span></label>
                                            {docPreview ? (
                                                <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface-light/20">
                                                    <span className="text-sm text-text truncate flex-1">{form.verificationDocument?.name}</span>
                                                    <button type="button" onClick={() => removeFile('verificationDocument')}
                                                        className="text-danger hover:text-danger-dark cursor-pointer"><X className="w-4 h-4" /></button>
                                                </div>
                                            ) : (
                                                <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-border bg-surface-light/20 text-text-muted text-sm cursor-pointer hover:border-primary hover:text-primary-light transition-all">
                                                    <Upload className="w-4 h-4" /> Upload Document
                                                    <input type="file" name="verificationDocument" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={handleChange} className="hidden" />
                                                </label>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Navigation */}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                        {step > 0 ? (
                            <button type="button" onClick={goPrev} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-text border border-border hover:border-primary/50 transition-all cursor-pointer">
                                <ChevronLeft className="w-4 h-4" /> Back
                            </button>
                        ) : <div />}

                        {step < 2 ? (
                            <button type="button" onClick={goNext} className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/25 hover:shadow-primary/35 transition-all cursor-pointer">
                                Next <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/25 hover:shadow-primary/35 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                                {loading ? (
                                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating Account…</>
                                ) : 'Create Account'}
                            </button>
                        )}
                    </div>

                    <p className="text-center text-sm text-text-muted pt-4">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary-light hover:text-primary font-medium transition-colors">Sign In</Link>
                    </p>
                </form>
            </motion.div>
        </div>
    );
}
