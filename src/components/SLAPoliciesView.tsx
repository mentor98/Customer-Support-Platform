import React, { useState, useEffect } from 'react';
import { Clock, ShieldAlert, CheckCircle2, Save, AlertTriangle } from 'lucide-react';
import { SLAPolicy } from '../types';
import { api } from '../lib/api';

export const SLAPoliciesView: React.FC = () => {
  const [policies, setPolicies] = useState<SLAPolicy[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const loadPolicies = async () => {
    try {
      const data = await api.getSLAPolicies();
      setPolicies(data);
    } catch (err) {
      console.error('Failed to load SLA policies:', err);
    }
  };

  useEffect(() => {
    loadPolicies();
  }, []);

  const handleUpdatePolicy = async (id: string, updates: Partial<SLAPolicy>) => {
    try {
      await api.updateSLAPolicy(id, updates);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      await loadPolicies();
    } catch (err) {
      console.error('Failed to update SLA policy:', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-50/50 dark:bg-neutral-950/50 overflow-y-auto p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6 w-full">
        {/* Header */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                SLA Service Level Agreement Targets
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Configure target countdown timers for first response and complete resolution based on ticket urgency.
              </p>
            </div>
            {savedSuccess && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-lg flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Policies Updated
              </span>
            )}
          </div>
        </div>

        {/* SLA Matrix Table / Cards */}
        <div className="space-y-4">
          {policies.map(policy => (
            <div
              key={policy.id}
              className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
                      {policy.priority} Priority
                    </span>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      {policy.name}
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    {policy.description}
                  </p>
                </div>

                {/* Editable Timer Fields */}
                <div className="flex items-center gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">
                      1st Response (Mins)
                    </label>
                    <input
                      type="number"
                      value={policy.firstResponseMinutes}
                      onChange={e =>
                        handleUpdatePolicy(policy.id, {
                          firstResponseMinutes: parseInt(e.target.value) || 15
                        })
                      }
                      className="w-24 p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">
                      Resolution (Mins)
                    </label>
                    <input
                      type="number"
                      value={policy.resolutionMinutes}
                      onChange={e =>
                        handleUpdatePolicy(policy.id, {
                          resolutionMinutes: parseInt(e.target.value) || 60
                        })
                      }
                      className="w-24 p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
