import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Background from './components/Background';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import BlobUploader from './components/BlobUploader';


const ProtectedRoute = ({ children, user, role }) => {
    const location = useLocation();
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    if (role && user.role !== role) {
        return <Navigate to="/dashboard" replace />;
    }
    return children;
};

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkSession();
    }, []);

    const checkSession = async () => {
        try {
            const res = await fetch('/.netlify/functions/me');
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Session check failed", error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = (userData) => {
        setUser(userData);
    };

    const handleLogout = () => {
        document.cookie = 'auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        setUser(null);
        window.location.href = '/login';
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0f0f13] text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <Router>
            <Background />
            <div className="relative z-10">
                <Routes>
                    <Route path="/login" element={
                        user ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />
                    } />

                    <Route path="/dashboard" element={
                        <ProtectedRoute user={user}>
                            <Dashboard user={user} onLogout={handleLogout} />
                        </ProtectedRoute>
                    } />

                    <Route path="/admin" element={
                        <ProtectedRoute user={user} role="admin">
                            <AdminPanel user={user} onLogout={handleLogout} />
                        </ProtectedRoute>
                    } />

                    <Route path="/upload-blobs" element={
                        <ProtectedRoute user={user} role="admin">
                            <BlobUploader />
                        </ProtectedRoute>
                    } />

                    <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
