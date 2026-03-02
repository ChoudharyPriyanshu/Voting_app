import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyOTP from './pages/VerifyOTP';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Results from './pages/Results';
import ElectionStats from './pages/ElectionStats';
import ManageCandidates from './pages/admin/ManageCandidates';
import AdminDashboard from './pages/admin/AdminDashboard';

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Navbar />
                <main>
                    <Routes>
                        <Route path="/" element={<Landing />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/verify-otp" element={<VerifyOTP />} />
                        <Route path="/results" element={<Results />} />
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <Dashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/profile"
                            element={
                                <ProtectedRoute>
                                    <Profile />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/candidates"
                            element={
                                <AdminRoute>
                                    <ManageCandidates />
                                </AdminRoute>
                            }
                        />
                        <Route
                            path="/admin/dashboard"
                            element={
                                <AdminRoute>
                                    <AdminDashboard />
                                </AdminRoute>
                            }
                        />
                        <Route
                            path="/election/:id/stats"
                            element={
                                <ProtectedRoute>
                                    <ElectionStats />
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </main>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 3500,
                        style: {
                            background: '#1e1b4b',
                            color: '#e2e8f0',
                            border: '1px solid rgba(99, 102, 241, 0.2)',
                            borderRadius: '16px',
                            fontSize: '14px',
                            padding: '12px 16px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                        },
                        success: {
                            iconTheme: { primary: '#10b981', secondary: '#1e1b4b' },
                        },
                        error: {
                            iconTheme: { primary: '#ef4444', secondary: '#1e1b4b' },
                        },
                    }}
                />
            </AuthProvider>
        </BrowserRouter>
    );
}
