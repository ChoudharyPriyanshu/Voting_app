import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('voting_token'));
    const [loading, setLoading] = useState(true);

    const fetchProfile = useCallback(async () => {
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            const { data } = await api.get('/user/profile');
            setUser(data.user);
        } catch {
            localStorage.removeItem('voting_token');
            setToken(null);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const login = async (aadharCardNumber, password) => {
        const { data } = await api.post('/user/login', { aadharCardNumber: Number(aadharCardNumber), password });
        localStorage.setItem('voting_token', data.token);
        setToken(data.token);
        // Fetch profile after setting token
        const profile = await api.get('/user/profile', {
            headers: { Authorization: `Bearer ${data.token}` },
        });
        setUser(profile.data.user);
        return profile.data.user;
    };

    const signup = async (userData) => {
        const { data } = await api.post('/user/signup', {
            ...userData,
            aadharCardNumber: Number(userData.aadharCardNumber),
            age: Number(userData.age),
        });
        localStorage.setItem('voting_token', data.token);
        setToken(data.token);
        setUser(data.response);
        return data.response;
    };

    const logout = () => {
        localStorage.removeItem('voting_token');
        setToken(null);
        setUser(null);
    };

    const refreshProfile = async () => {
        try {
            const { data } = await api.get('/user/profile');
            setUser(data.user);
        } catch {
            // silently fail
        }
    };

    const value = {
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === 'admin',
        login,
        signup,
        logout,
        refreshProfile,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
