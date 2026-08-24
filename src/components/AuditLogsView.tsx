import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Filter, Calendar, User, ArrowRight } from 'lucide-react';
import { AuditLog } from '../types';
import { api } from '../lib/api';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadLogs = async () => {
    try {
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(l =>
    l.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.details.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-50/50 dark:bg-neutral-950/50 overflow-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 p-4 shrink-0 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              Compliance & Security Audit Trail
            </h2>
            <p className="text-xs text-neutral-500">
              Immutable timestamped ledger of all ticket state modifications, agent assignments, and security events.
            </p>
          </div>

          <div className="relative w-64 md:w-80">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search audit trail..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Log list */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-3">
          {filteredLogs.map(log => (
            <div
              key={log.id}
              className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-neutral-600 dark:text-neutral-300 shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-neutral-900 dark:text-neutral-100">
                      {log.actorName}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                      {log.actorRole}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                      [{log.action}]
                    </span>
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400 font-mono text-[11px]">
                    {log.details}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0 text-[11px] text-neutral-400 flex sm:flex-col items-center sm:items-end justify-between">
                <span>{new Date(log.timestamp).toLocaleString()}</span>
                {log.ipAddress && <span className="font-mono text-[10px]">{log.ipAddress}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
