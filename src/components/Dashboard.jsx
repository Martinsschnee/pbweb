import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, LogOut, CheckCircle, List, Trash2 } from 'lucide-react';
import RecordCard from './RecordCard';
import { parseRecord } from '../utils/parser';

const Dashboard = ({ user, onLogout }) => {
    const [records, setRecords] = useState([]);
    const [checkedRecords, setCheckedRecords] = useState([]);
    const [inputLine, setInputLine] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('active'); // 'active' | 'checked'

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const res = await fetch('/.netlify/functions/getRecords');
            if (res.ok) {
                const data = await res.json();
                setRecords(data.records || []);
                setCheckedRecords(data.checked || []);
            } else if (res.status === 401) {
                onLogout();
            }
        } catch (error) {
            console.error('Failed to fetch records', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!inputLine.trim()) return;

        const parsed = parseRecord(inputLine);
        if (!parsed) {
            alert("Could not parse line format.");
            return;
        }

        try {
            const res = await fetch('/.netlify/functions/addRecord', {
                method: 'POST',
                body: JSON.stringify({ rawLine: inputLine, parsedData: parsed }),
            });

            if (res.ok) {
                setInputLine('');
                fetchRecords();
            }
        } catch (error) {
            console.error('Failed to add record', error);
        }
    };

    const handleCheck = async (id) => {
        try {
            const res = await fetch('/.netlify/functions/checkRecord', {
                method: 'POST',
                body: JSON.stringify({ id }),
            });

            if (res.ok) {
                fetchRecords();
            }
        } catch (error) {
            console.error('Failed to check record', error);
        }
    };

    const handleDelete = async (id) => {
        try {
            const res = await fetch('/.netlify/functions/deleteRecord', {
                method: 'POST',
                body: JSON.stringify({ id }),
            });

            if (res.ok) {
                fetchRecords();
            }
        } catch (error) {
            console.error('Failed to delete record', error);
        }
    };

    const handleClearChecked = async () => {
        if (!window.confirm('Are you sure you want to delete ALL checked records? This cannot be undone.')) return;

        try {
            const res = await fetch('/.netlify/functions/clearChecked', {
                method: 'POST',
            });

            if (res.ok) {
                fetchRecords();
            }
        } catch (error) {
            console.error('Failed to clear checked records', error);
        }
    };

    return (
        <div className="min-h-screen p-4 md:p-8 pt-20">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-center gap-4 glass-panel p-6 rounded-2xl">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Secure Vault</h1>
                        <p className="text-gray-400 text-sm">Logged in as <span className="text-blue-400">{user.username}</span></p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchRecords}
                            className="p-2 rounded-lg glass-button text-gray-400 hover:text-white"
                            title="Refresh"
                        >
                            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <button
                            onClick={onLogout}
                            className="px-4 py-2 rounded-lg glass-button text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                        >
                            <LogOut size={18} /> Logout
                        </button>
                    </div>
                </header>

                {/* Input Section */}
                <div className="glass-panel p-6 rounded-2xl">
                    <form onSubmit={handleAdd} className="flex gap-4">
                        <input
                            type="text"
                            value={inputLine}
                            onChange={(e) => setInputLine(e.target.value)}
                            placeholder="Paste record line here (email:pass | Points = ...)"
                            className="glass-input flex-1 px-4 py-3 rounded-xl font-mono text-sm"
                        />
                        <button
                            type="submit"
                            disabled={!inputLine.trim()}
                            className="glass-button px-6 py-3 rounded-xl text-white font-medium flex items-center gap-2 disabled:opacity-50"
                        >
                            <Plus size={20} /> Add
                        </button>
                    </form>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 border-b border-white/10 justify-between items-end">
                    <div className="flex gap-4">
                        <button
                            onClick={() => setActiveTab('active')}
                            className={`pb-3 px-2 text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'active' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <List size={16} /> Active ({records.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('checked')}
                            className={`pb-3 px-2 text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'checked' ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <CheckCircle size={16} /> Checked ({checkedRecords.length})
                        </button>
                    </div>
                    {activeTab === 'checked' && checkedRecords.length > 0 && (
                        <button
                            onClick={handleClearChecked}
                            className="mb-2 text-xs text-red-400 hover:text-red-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                        >
                            <Trash2 size={14} /> Delete All Checked
                        </button>
                    )}
                </div>

                {/* List */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {activeTab === 'active' ? (
                        records.length > 0 ? (
                            records.map(record => (
                                <RecordCard key={record.id} record={record} onCheck={handleCheck} onDelete={handleDelete} isChecked={false} />
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12 text-gray-500">No active records found.</div>
                        )
                    ) : (
                        checkedRecords.length > 0 ? (
                            checkedRecords.map(record => (
                                <RecordCard key={record.id} record={record} onDelete={handleDelete} isChecked={true} />
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12 text-gray-500">No checked records found.</div>
                        )
                    )}
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
