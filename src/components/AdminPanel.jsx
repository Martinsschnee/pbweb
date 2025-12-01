import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LogOut, Activity, Users, Database, RefreshCw, Plus, Trash2, ArrowLeft, Upload } from 'lucide-react';

const AdminPanel = ({ user, onLogout }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'stats'; // 'stats' | 'users' | 'data'

    const [stats, setStats] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    // Data Config State
    const [dataRecords, setDataRecords] = useState([]);
    const [selectedRecords, setSelectedRecords] = useState([]);
    const [targetAssignUser, setTargetAssignUser] = useState('');

    // New User State
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' });

    useEffect(() => {
        if (activeTab === 'stats') fetchStats();
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'data') {
            fetchUsers(); // Need users for dropdown
            fetchDataRecords(); // Default to my records
        }
    }, [activeTab]);

    const setActiveTab = (tab) => {
        setSearchParams({ tab });
    };

    const fetchDataRecords = async (targetUserId = '') => {
        setLoading(true);
        try {
            let url = '/.netlify/functions/getRecords?limit=1000'; // Fetch more for admin view
            if (targetUserId) url += `&targetUserId=${targetUserId}`;

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setDataRecords(data.records || []);
                setSelectedRecords([]); // Clear selection on view change
            }
        } catch (error) {
            console.error('Failed to fetch records', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAssignRecords = async () => {
        if (selectedRecords.length === 0 || !targetAssignUser) return;

        try {
            const res = await fetch('/.netlify/functions/assignRecords', {
                method: 'POST',
                body: JSON.stringify({
                    recordIds: selectedRecords,
                    targetUserId: targetAssignUser
                }),
            });

            if (res.ok) {
                alert('Records assigned successfully');
                fetchDataRecords(); // Refresh current view
                setSelectedRecords([]);
            } else {
                alert('Failed to assign records');
            }
        } catch (error) {
            console.error('Failed to assign records', error);
        }
    };

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await fetch('/.netlify/functions/getStats');
            if (res.ok) {
                const data = await res.json();
                setStats(data.logs || []);
            }
        } catch (error) {
            console.error('Failed to fetch stats', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/.netlify/functions/getUsers');
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
            }
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (id, username) => {
        if (!window.confirm(`Are you sure you want to delete user "${username}"? Their records will be unassigned.`)) return;

        try {
            const res = await fetch('/.netlify/functions/deleteUser', {
                method: 'POST',
                body: JSON.stringify({ id }),
            });

            if (res.ok) {
                fetchUsers();
                alert('User deleted successfully');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete user');
            }
        } catch (error) {
            console.error('Failed to delete user', error);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        if (!newUser.username || !newUser.password) return;

        try {
            const res = await fetch('/.netlify/functions/createUser', {
                method: 'POST',
                body: JSON.stringify(newUser),
            });

            if (res.ok) {
                setNewUser({ username: '', password: '', role: 'user' });
                fetchUsers();
                alert('User created successfully');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to create user');
            }
        } catch (error) {
            console.error('Failed to create user', error);
        }
    };

    return (
        <div className="min-h-screen p-4 md:p-8 pt-20 text-white">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <header className="flex justify-between items-center mb-8 glass-panel p-6 rounded-2xl">
                    <div>
                        <h1 className="text-2xl font-bold">Admin Panel</h1>
                        <p className="text-gray-400 text-sm">Logged in as <span className="text-blue-400">{user.username}</span></p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => window.history.back()}
                            className="px-4 py-2 rounded-lg glass-button text-gray-400 hover:text-white flex items-center gap-2"
                        >
                            <ArrowLeft size={18} /> Back
                        </button>
                        <button
                            onClick={onLogout}
                            className="px-4 py-2 rounded-lg glass-button text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                        >
                            <LogOut size={18} /> Logout
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Sidebar */}
                    <div className="glass-panel p-4 rounded-2xl h-fit space-y-2">
                        <button
                            onClick={() => setActiveTab('stats')}
                            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab === 'stats' ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/5 text-gray-400'}`}
                        >
                            <Activity size={20} /> Live Stats
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab === 'users' ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/5 text-gray-400'}`}
                        >
                            <Users size={20} /> User Config
                        </button>
                        <button
                            onClick={() => setActiveTab('data')}
                            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab === 'data' ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/5 text-gray-400'}`}
                        >
                            <Database size={20} /> Data Config
                        </button>
                        <button
                            onClick={() => window.location.href = '/upload-blobs'}
                            className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors hover:bg-green-500/20 text-green-400"
                        >
                            <Upload size={20} /> Upload Blobs
                        </button>
                    </div>

                    {/* Content */}
                    <div className="md:col-span-3 glass-panel p-6 rounded-2xl min-h-[500px]">
                        {activeTab === 'stats' && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-bold">Live Statistics</h2>
                                    <button onClick={fetchStats} className="p-2 rounded-lg glass-button text-gray-400 hover:text-white">
                                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left text-gray-400">
                                        <thead className="text-xs text-gray-200 uppercase bg-white/5">
                                            <tr>
                                                <th className="px-4 py-3 rounded-tl-lg">Time</th>
                                                <th className="px-4 py-3">Action</th>
                                                <th className="px-4 py-3">User</th>
                                                <th className="px-4 py-3">IP</th>
                                                <th className="px-4 py-3 rounded-tr-lg">User Agent</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.map(log => (
                                                <tr key={log.id} className="border-b border-white/5 hover:bg-white/5">
                                                    <td className="px-4 py-3">{new Date(log.timestamp).toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-white">{log.action}</td>
                                                    <td className="px-4 py-3">{log.username}</td>
                                                    <td className="px-4 py-3 font-mono text-xs">{log.ip}</td>
                                                    <td className="px-4 py-3 max-w-[200px] truncate" title={log.userAgent}>{log.userAgent}</td>
                                                </tr>
                                            ))}
                                            {stats.length === 0 && (
                                                <tr>
                                                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">No logs found</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'users' && (
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <h2 className="text-xl font-bold">Create User</h2>
                                    <form onSubmit={handleCreateUser} className="flex flex-col md:flex-row gap-4 items-end">
                                        <div className="flex-1 space-y-1 w-full">
                                            <label className="text-xs text-gray-400">Username</label>
                                            <input
                                                type="text"
                                                value={newUser.username}
                                                onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                                                className="glass-input w-full px-4 py-2 rounded-xl"
                                                placeholder="Username"
                                            />
                                        </div>
                                        <div className="flex-1 space-y-1 w-full">
                                            <label className="text-xs text-gray-400">Password</label>
                                            <input
                                                type="text"
                                                value={newUser.password}
                                                onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                                className="glass-input w-full px-4 py-2 rounded-xl"
                                                placeholder="Password"
                                            />
                                        </div>
                                        <div className="w-full md:w-auto">
                                            <button type="submit" className="glass-button w-full px-6 py-2 rounded-xl text-white font-medium flex items-center justify-center gap-2 h-[42px]">
                                                <Plus size={20} /> Create
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-xl font-bold">Existing Users</h2>
                                        <button onClick={fetchUsers} className="p-2 rounded-lg glass-button text-gray-400 hover:text-white">
                                            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                                        </button>
                                    </div>
                                    <div className="grid gap-4">
                                        {users.map(u => (
                                            <div key={u.id} className="glass-panel p-4 rounded-xl flex justify-between items-center">
                                                <div>
                                                    <p className="font-bold text-white">{u.username}</p>
                                                    <p className="text-xs text-gray-400">Role: {u.role}</p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-xs text-gray-500">
                                                        Created: {new Date(u.createdAt).toLocaleDateString()}
                                                    </div>
                                                    {u.id !== user.id && (
                                                        <button
                                                            onClick={() => handleDeleteUser(u.id, u.username)}
                                                            className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                                                            title="Delete User"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'data' && (
                            <div className="space-y-6">
                                <div className="flex flex-col md:flex-row gap-4 justify-between items-end">
                                    <div className="space-y-1 flex-1">
                                        <label className="text-xs text-gray-400">View Records For</label>
                                        <select
                                            className="glass-input w-full px-4 py-2 rounded-xl text-white bg-black/20"
                                            onChange={(e) => fetchDataRecords(e.target.value)}
                                        >
                                            <option value="">My Records (Admin)</option>
                                            <option value="unassigned">Unassigned (Legacy)</option>
                                            {users.filter(u => u.id !== user.id).map(u => (
                                                <option key={u.id} value={u.id}>{u.username}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1 flex-1">
                                        <label className="text-xs text-gray-400">Assign Selected To</label>
                                        <div className="flex gap-2">
                                            <select
                                                className="glass-input w-full px-4 py-2 rounded-xl text-white bg-black/20"
                                                onChange={(e) => setTargetAssignUser(e.target.value)}
                                                value={targetAssignUser}
                                            >
                                                <option value="">Select User...</option>
                                                <option value={user.id}>Me (Admin)</option>
                                                {users.filter(u => u.id !== user.id).map(u => (
                                                    <option key={u.id} value={u.id}>{u.username}</option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={handleAssignRecords}
                                                disabled={selectedRecords.length === 0 || !targetAssignUser}
                                                className="glass-button px-6 py-2 rounded-xl text-white font-medium disabled:opacity-50"
                                            >
                                                Assign
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="glass-panel p-4 rounded-xl">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold">Records ({dataRecords.length})</h3>
                                        <span className="text-sm text-gray-400">{selectedRecords.length} selected</span>
                                    </div>
                                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                                        {dataRecords.map(record => (
                                            <div key={record.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRecords.includes(record.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedRecords([...selectedRecords, record.id]);
                                                        } else {
                                                            setSelectedRecords(selectedRecords.filter(id => id !== record.id));
                                                        }
                                                    }}
                                                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
                                                />
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-xs font-mono truncate">{record.rawLine}</p>
                                                    <div className="flex gap-2 text-[10px] text-gray-400">
                                                        <span>Points: {record.parsedData?.Points || 0}</span>
                                                        <span>•</span>
                                                        <span>{new Date(record.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {dataRecords.length === 0 && (
                                            <p className="text-center text-gray-500 py-8">No records found.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
