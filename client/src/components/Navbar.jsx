import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
    Vote,
    LogOut,
    User,
    BarChart3,
    Shield,
    Menu,
    X,
    Home,
    History,
} from 'lucide-react';

export default function Navbar() {
    const { isAuthenticated, isAdmin, user, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = () => {
        logout();
        setMobileOpen(false);
        navigate('/');
    };

    const navLinks = isAuthenticated
        ? [
            ...(isAdmin
                ? [
                    { to: '/admin/dashboard', label: 'Dashboard', icon: BarChart3 },
                    { to: '/admin/candidates', label: 'Manage', icon: Shield },
                    { to: '/admin/audit-log', label: 'Audit', icon: History },
                ]
                : [{ to: '/dashboard', label: 'Dashboard', icon: Home }]),
            { to: '/results', label: 'Results', icon: BarChart3 },
            { to: '/profile', label: 'Profile', icon: User },
        ]
        : [
            { to: '/results', label: 'Results', icon: BarChart3 },
            { to: '/login', label: 'Login', icon: User },
        ];

    return (
        <motion.nav
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="fixed top-0 left-0 right-0 z-50 border-b border-border"
            style={{ backdropFilter: 'blur(16px)', backgroundColor: 'rgba(15, 10, 42, 0.8)' }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link
                        to="/"
                        className="flex items-center gap-2 text-primary-light font-bold text-lg hover:text-primary transition-colors duration-200"
                        aria-label="Home"
                    >
                        <Vote className="w-6 h-6" />
                        <span className="font-display">VoteApp</span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map(({ to, label, icon: Icon }) => (
                            <Link
                                key={to}
                                to={to}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-text-muted hover:text-text hover:bg-surface-light/50 transition-all duration-200"
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                            </Link>
                        ))}
                        {isAuthenticated ? (
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 ml-2 px-4 py-2 rounded-lg text-sm font-medium text-danger hover:bg-danger/10 transition-all duration-200 cursor-pointer"
                                aria-label="Logout"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        ) : (
                            <Link
                                to="/signup"
                                className="ml-2 px-5 py-2 rounded-lg text-sm font-semibold bg-primary hover:bg-primary-dark text-white transition-all duration-200 shadow-lg shadow-primary/25"
                            >
                                Sign Up
                            </Link>
                        )}
                    </div>

                    {/* Mobile Hamburger */}
                    <button
                        className="md:hidden p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface-light/50 transition-colors cursor-pointer"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Toggle menu"
                    >
                        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="md:hidden border-t border-border overflow-hidden"
                        style={{ backgroundColor: 'rgba(15, 10, 42, 0.95)' }}
                    >
                        <div className="px-4 py-4 space-y-1">
                            {isAuthenticated && user && (
                                <div className="px-3 py-2 mb-2 text-xs text-text-muted border-b border-border/50 pb-3">
                                    Signed in as <span className="text-primary-light font-medium">{user.name}</span>
                                </div>
                            )}
                            {navLinks.map(({ to, label, icon: Icon }) => (
                                <Link
                                    key={to}
                                    to={to}
                                    onClick={() => setMobileOpen(false)}
                                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-text-muted hover:text-text hover:bg-surface-light/50 transition-all duration-200"
                                >
                                    <Icon className="w-4 h-4" />
                                    {label}
                                </Link>
                            ))}
                            {isAuthenticated ? (
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm font-medium text-danger hover:bg-danger/10 transition-all duration-200 cursor-pointer"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Logout
                                </button>
                            ) : (
                                <Link
                                    to="/signup"
                                    onClick={() => setMobileOpen(false)}
                                    className="block text-center mt-2 px-5 py-3 rounded-lg text-sm font-semibold bg-primary hover:bg-primary-dark text-white transition-all duration-200"
                                >
                                    Sign Up
                                </Link>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
}
