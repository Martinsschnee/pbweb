import React, { useState, useEffect } from 'react';
import Background from './components/Background';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkSession();
    }, []);

    const checkSession = async () => {
        try {
            // Try to fetch records as a way to validate session
            // Or we could have a dedicated /me endpoint, but this works for now
            const res = await fetch('/.netlify/functions/getRecords');
            if (res.ok) {
                // If successful, we assume we are logged in. 
                // Ideally the API returns user info, but for now we just set a dummy or parse if available.
                // Let's assume the login flow sets the user state correctly, 
                // but on refresh we need to know who we are. 
                // For this simple app, just knowing we are authorized is enough.
                setUser({ username: 'admin' });
            }
        } catch (error) {
            // Not logged in
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = (userData) => {
        setUser(userData);
    };

    const handleLogout = () => {
        // Clear cookie by setting it to expire
        document.cookie = 'auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        setUser(null);
        window.location.reload(); // Force reload to clear any state/cookies cleanly
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0f0f13] text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <>
            <Background />
            <div className="relative z-10">
                {user ? (
                    <Dashboard user={user} onLogout={handleLogout} />
                ) : (
                    <Login onLogin={handleLogin} />
                )}
            </div>
        </>
    );
}

export default App;
