import React, { useState } from 'react';
import { Copy, Check, User, Calendar, CreditCard, Lock, Mail } from 'lucide-react';

const RecordCard = ({ record, onCheck, isChecked }) => {
    const [copied, setCopied] = useState(null);
    const { parsedData, rawLine, createdAt, checkedAt } = record;

    const handleCopy = (text, label) => {
        navigator.clipboard.writeText(text);
        setCopied(label);
        setTimeout(() => setCopied(null), 2000);
    };

    const Field = ({ icon: Icon, label, value, copyable = true }) => (
        <div className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5 mb-2">
            <div className="flex items-center gap-3 overflow-hidden">
                {Icon && <Icon size={16} className="text-blue-400 shrink-0" />}
                <div className="flex flex-col overflow-hidden">
                    <span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span>
                    <span className="text-sm font-mono text-white truncate">{value || '-'}</span>
                </div>
            </div>
            {copyable && (
                <button
                    onClick={() => handleCopy(value, label)}
                    className="p-1.5 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-white"
                    title="Copy"
                >
                    {copied === label ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                </button>
            )}
        </div>
    );

    return (
        <div className={`glass-panel rounded-xl p-4 transition-all duration-300 ${isChecked ? 'opacity-75 grayscale' : 'hover:scale-[1.01]'}`}>
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isChecked ? 'bg-green-500' : 'bg-blue-500 animate-pulse'}`}></span>
                    <span className="text-xs text-gray-500">
                        {isChecked ? `Checked: ${new Date(checkedAt).toLocaleString()}` : `Added: ${new Date(createdAt).toLocaleString()}`}
                    </span>
                </div>
                {!isChecked && (
                    <button
                        onClick={() => onCheck(record.id)}
                        className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-green-400 bg-green-400/10 hover:bg-green-400/20 border border-green-400/20 rounded-full transition-all"
                    >
                        <Check size={12} />
                        Mark Checked
                    </button>
                )}
            </div>

            <div className="space-y-1">
                {parsedData.email && <Field icon={Mail} label="Email" value={parsedData.email} />}
                {parsedData.password && <Field icon={Lock} label="Password" value={parsedData.password} />}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    {parsedData.Points && <Field label="Points" value={parsedData.Points} />}
                    {parsedData.Locked && <Field label="Locked" value={parsedData.Locked} />}
                    {parsedData.Card && <Field icon={CreditCard} label="Card" value={parsedData.Card} />}
                    {parsedData.Name && <Field icon={User} label="Name" value={parsedData.Name} />}
                    {parsedData.DOB && <Field icon={Calendar} label="DOB" value={parsedData.DOB} />}
                </div>
            </div>

            <div className="mt-3 pt-3 border-t border-white/5">
                <div className="flex justify-between items-center">
                    <code className="text-[10px] text-gray-600 truncate max-w-[200px]">{rawLine}</code>
                    <button
                        onClick={() => handleCopy(rawLine, 'raw')}
                        className="text-[10px] text-blue-400 hover:text-blue-300"
                    >
                        {copied === 'raw' ? 'Copied!' : 'Copy Raw Line'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecordCard;
