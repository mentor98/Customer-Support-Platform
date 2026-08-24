import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Headphones, Mail, CheckCircle2 } from 'lucide-react';
import { Team, User } from '../types';
import { api } from '../lib/api';

export const TeamManagementView: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [agents, setAgents] = useState<User[]>([]);

  const loadData = async () => {
    try {
      const [tms, usrs] = await Promise.all([api.getTeams(), api.getUsers()]);
      setTeams(tms);
      setAgents(usrs.filter(u => u.role === 'agent' || u.role === 'admin'));
    } catch (err) {
      console.error('Failed to load teams:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-50/50 dark:bg-neutral-950/50 overflow-y-auto p-6 md:p-8 space-y-6">
      <div className="max-w-5xl mx-auto space-y-6 w-full">
        {/* Header */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs">
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Support Teams & Routing Groups
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Configure agent routing tiers, escalations, and functional departments for incoming requests.
          </p>
        </div>

        {/* Teams List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map(team => (
            <div
              key={team.id}
              className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    {team.name}
                  </h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300">
                    {team.memberIds.length} Members
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mb-4">
                  {team.description}
                </p>
              </div>

              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
                <span className="text-neutral-400">Team Lead:</span>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  {team.leadId === 'usr-agent-1' ? 'Sarah Jenkins' : team.leadId === 'usr-agent-2' ? 'David Kim' : 'Alex Rivera'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Active Agents Directory */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-xs">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
            <Headphones className="w-4 h-4 text-indigo-600" />
            Support Agent Directory ({agents.length})
          </h3>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {agents.map(agent => (
              <div key={agent.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <img
                    src={agent.avatarUrl}
                    alt={agent.name}
                    className="w-9 h-9 rounded-full object-cover ring-1 ring-neutral-200 dark:ring-neutral-700"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-neutral-900 dark:text-neutral-100">
                        {agent.name}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
                        {agent.role}
                      </span>
                    </div>
                    <span className="text-[11px] text-neutral-400">{agent.email} • {agent.title}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-emerald-600 font-semibold text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Online & Ready</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
