import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, RefreshCw, LogOut, CheckCircle, List, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import RecordCard from './RecordCard';
import { parseRecord } from '../utils/parser';

const Dashboard = ({ user, onLogout }) => {
    const [searchParams, setSearchParams] = useSearchParams();

    // State from URL or defaults
    const activeTab = searchParams.get('tab') || 'active'; // 'active' | 'checked'
    const minPoints = searchParams.get('minPoints') || '';
    const sortOrder = searchParams.get('sort') || 'desc'; // 'desc' | 'asc'

    const [records, setRecords] = useState([]);
    const [checkedRecords, setCheckedRecords] = useState([]);
    const [inputLine, setInputLine] = useState('');
    const [loading, setLoading] = useState(false);

    // Pagination State
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const LIMIT = 50;

    // Helper to update specific params while keeping others
    const updateParams = (updates) => {
        const newParams = new URLSearchParams(searchParams);
        Object.entries(updates).forEach(([key, value]) => {
            if (value === null || value === '') {
                newParams.delete(key);
            } else {
                newParams.set(key, value);
            }
        });
        setSearchParams(newParams);
    };

    const setActiveTab = (tab) => updateParams({ tab });
    const setMinPoints = (val) => updateParams({ minPoints: val });
    const setSortOrder = (val) => updateParams({ sort: val });

    const fetchRecords = async (pageNum = 1, append = false) => {
        setLoading(true);
        try {
            const res = await fetch(`/.netlify/functions/getRecords?page=${pageNum}&limit=${LIMIT}`);
            if (res.ok) {
                const data = await res.json();
                if (append) {
                    setRecords(prev => [...prev, ...data.records]);
                } else {
                    setRecords(data.records || []);
                }

                if (!append) setCheckedRecords(data.checked || []);

                setHasMore(data.records.length === LIMIT);
                setPage(pageNum);
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

    const handleLoadMore = () => {
        fetchRecords(page + 1, true);
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!inputLine.trim()) return;

        const lines = inputLine.split('\n').filter(l => l.trim());
        const payload = [];

        for (const line of lines) {
            const parsed = parseRecord(line);
            if (parsed) {
                payload.push({ rawLine: line, parsedData: parsed });
            }
        }

        if (payload.length === 0) {
            alert("Could not parse any lines.");
            return;
        }

        try {
            const res = await fetch('/.netlify/functions/addRecord', {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setInputLine('');
                fetchRecords(1, false); // Refresh list
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
                // Optimistic update
                const record = records.find(r => r.id === id);
                if (record) {
                    setRecords(prev => prev.filter(r => r.id !== id));
                    // We can't easily add to checkedRecords without full data if it was just an ID, 
                    // but here we have the record.
                    // However, for simplicity and consistency with backend, we might just refresh or accept it disappears from Active.
                    // If we want it to appear in Checked immediately:
                    // setCheckedRecords(prev => [...prev, record]); 
                    // But let's stick to simple removal from active for now, user can refresh to see in checked if needed, 
                    // or we can fetch. Fetching resets pagination which is annoying.
                    // Let's just remove from active.
                }
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
                setRecords(prev => prev.filter(r => r.id !== id));
                setCheckedRecords(prev => prev.filter(r => r.id !== id));
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
                setCheckedRecords([]);
                fetchRecords(1, false);
            }
        } catch (error) {
            console.error('Failed to clear checked records', error);
        }
    };

    const filteredRecords = records
        .filter(record => {
            if (!minPoints) return true;
            const points = parseInt(record.parsedData.Points) || 0;
            return points >= parseInt(minPoints);
        })
        .sort((a, b) => {
            const pointsA = parseInt(a.parsedData.Points) || 0;
            const pointsB = parseInt(b.parsedData.Points) || 0;
            return sortOrder === 'desc' ? pointsB - pointsA : pointsA - pointsB;
        });

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
                        <div className="relative">
                            <input
                                type="number"
                                placeholder="Min Points"
                                value={minPoints}
                                onChange={(e) => setMinPoints(e.target.value)}
                                className="glass-input px-3 py-2 rounded-lg text-sm w-32"
                            />
                        </div>
                        <button
                            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                            className="p-2 rounded-lg glass-button text-gray-400 hover:text-white flex items-center gap-2"
                            title={`Sort by Points (${sortOrder === 'desc' ? 'High to Low' : 'Low to High'})`}
                        >
                            {sortOrder === 'desc' ? <ArrowDown size={20} /> : <ArrowUp size={20} />}
                        </button>
                        <button
                            onClick={() => fetchRecords(1, false)}
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
                    <form onSubmit={handleAdd} className="flex gap-4 items-start">
                        <textarea
                            value={inputLine}
                            onChange={(e) => setInputLine(e.target.value)}
                            placeholder="Paste record lines here (one per line)"
                            className="glass-input flex-1 px-4 py-3 rounded-xl font-mono text-sm min-h-[50px] resize-y"
                            rows={1}
                        />
                        <button
                            type="submit"
                            disabled={!inputLine.trim()}
                            className="glass-button px-6 py-3 rounded-xl text-white font-medium flex items-center gap-2 disabled:opacity-50 h-[50px]"
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
                            <List size={16} /> Active ({filteredRecords.length})
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
                        <>
                            {filteredRecords.length > 0 ? (
                                filteredRecords.map(record => (
                                    <RecordCard key={record.id} record={record} onCheck={handleCheck} onDelete={handleDelete} isChecked={false} />
                                ))
                            ) : (
                                <div className="col-span-full text-center py-12 text-gray-500">No active records found.</div>
                            )}

                            {hasMore && (
                                <div className="col-span-full flex justify-center mt-4">
                                    <button
                                        onClick={handleLoadMore}
                                        disabled={loading}
                                        className="glass-button px-6 py-2 rounded-xl text-white font-medium disabled:opacity-50"
                                    >
                                        {loading ? 'Loading...' : 'Load More'}
                                    </button>
                                </div>
                            )}
                        </>
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
