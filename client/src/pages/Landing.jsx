import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Vote, BarChart3, Shield, ChevronRight, Users, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: 'easeOut', delay: i * 0.1 },
    }),
};

const features = [
    {
        icon: Shield,
        title: 'Secure Authentication',
        desc: 'Aadhar-verified identity ensures one person, one vote.',
    },
    {
        icon: BarChart3,
        title: 'Live Results',
        desc: 'Watch vote counts update in real-time as votes are cast.',
    },
    {
        icon: Users,
        title: 'Transparent Process',
        desc: 'Every vote is recorded and traceable for complete transparency.',
    },
    {
        icon: Lock,
        title: 'Tamper-Proof',
        desc: 'Encrypted data storage with JWT-secured API endpoints.',
    },
];

export default function Landing() {
    const { isAuthenticated, isAdmin } = useAuth();

    return (
        <div className="min-h-screen">
            {/* Hero */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
                {/* Background gradient */}
                <div
                    className="absolute inset-0 opacity-40"
                    style={{
                        background:
                            'radial-gradient(ellipse at 30% 20%, rgba(99, 102, 241, 0.3) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(245, 158, 11, 0.15) 0%, transparent 50%)',
                    }}
                />
                {/* Subtle grid overlay */}
                <div
                    className="absolute inset-0 opacity-5"
                    style={{
                        backgroundImage:
                            'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
                        backgroundSize: '60px 60px',
                    }}
                />

                <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center py-20">
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        custom={0}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary-light text-sm font-medium mb-8"
                    >
                        <Vote className="w-4 h-4" />
                        Secure Digital Voting Platform
                    </motion.div>

                    <motion.h1
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        custom={1}
                        className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight leading-tight mb-6"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        Your Vote,{' '}
                        <span
                            className="bg-clip-text text-transparent"
                            style={{
                                backgroundImage: 'linear-gradient(135deg, #6366f1, #a5b4fc, #f59e0b)',
                            }}
                        >
                            Your Voice
                        </span>
                    </motion.h1>

                    <motion.p
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        custom={2}
                        className="text-lg sm:text-xl text-text-muted max-w-2xl mx-auto mb-10 leading-relaxed"
                    >
                        A secure and transparent online voting platform. Register with your Aadhar
                        card, cast your vote, and track live results — all in one place.
                    </motion.p>

                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        custom={3}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        {isAuthenticated ? (
                            <Link
                                to={isAdmin ? '/admin/candidates' : '/dashboard'}
                                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-all duration-300 hover:-translate-y-0.5"
                            >
                                Go to {isAdmin ? 'Admin Panel' : 'Dashboard'}
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        ) : (
                            <>
                                <Link
                                    to="/signup"
                                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-all duration-300 hover:-translate-y-0.5"
                                >
                                    Get Started
                                    <ChevronRight className="w-4 h-4" />
                                </Link>
                                <Link
                                    to="/login"
                                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold border border-border hover:border-primary/50 text-text hover:bg-surface-light/40 transition-all duration-300"
                                >
                                    Sign In
                                </Link>
                            </>
                        )}
                    </motion.div>
                </div>
            </section>

            {/* Features */}
            <section className="py-24 px-4 sm:px-6">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-16"
                    >
                        <h2
                            className="text-3xl sm:text-4xl font-bold mb-4"
                            style={{ fontFamily: 'var(--font-display)' }}
                        >
                            Why Choose VoteApp?
                        </h2>
                        <p className="text-text-muted text-lg max-w-xl mx-auto">
                            Built for security, transparency, and ease of use.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((f, i) => (
                            <motion.div
                                key={f.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-60px' }}
                                transition={{ duration: 0.4, delay: i * 0.1 }}
                                whileHover={{ y: -4 }}
                                className="group relative p-6 rounded-2xl border border-border bg-card backdrop-blur-md hover:border-primary/40 transition-all duration-300"
                            >
                                <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-5 group-hover:bg-primary/25 transition-colors duration-300">
                                    <f.icon className="w-6 h-6 text-primary-light" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                                <p className="text-sm text-text-muted leading-relaxed">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 px-4 sm:px-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="max-w-3xl mx-auto text-center p-10 sm:p-14 rounded-3xl border border-border bg-card backdrop-blur-md"
                >
                    <h2
                        className="text-2xl sm:text-3xl font-bold mb-4"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        Ready to Cast Your Vote?
                    </h2>
                    <p className="text-text-muted mb-8 max-w-lg mx-auto">
                        Join thousands of citizens exercising their democratic right through our secure platform.
                    </p>
                    <Link
                        to={isAuthenticated ? '/dashboard' : '/signup'}
                        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-all duration-300 hover:-translate-y-0.5"
                    >
                        {isAuthenticated ? 'Go to Dashboard' : 'Create Account'}
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </motion.div>
            </section>

            {/* Footer */}
            <footer className="border-t border-border py-8 px-4 text-center text-sm text-text-muted">
                <p>© {new Date().getFullYear()} VoteApp by Priyanshu Choudhary. All rights reserved.</p>
            </footer>
        </div>
    );
}
