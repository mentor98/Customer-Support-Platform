import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Star,
  Users,
  TrendingUp,
  Award
} from 'lucide-react';
import { AnalyticsSummary } from '../types';
import { api } from '../lib/api';

export const AnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);

  const loadAnalytics = async () => {
    try {
      const data = await api.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (!analytics) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-neutral-400 text-xs">
        Loading analytics & CSAT reports...
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50/50 dark:bg-neutral-950/50 p-6 md:p-8 space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            Support Operations & CSAT Analytics
          </h2>
          <p className="text-xs text-neutral-500">
            Real-time performance metrics, SLA compliance rates, and agent efficiency scorecards.
          </p>
        </div>

        {/* 6 Key Metric KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Total Tickets</span>
            <p className="text-xl font-extrabold text-neutral-900 dark:text-neutral-100 mt-1">
              {analytics.totalTickets}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Open Backlog</span>
            <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              {analytics.openTickets}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">SLA Compliance</span>
            <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {analytics.slaComplianceRate}%
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Avg 1st Response</span>
            <p className="text-xl font-extrabold text-neutral-900 dark:text-neutral-100 mt-1">
              {analytics.avgFirstResponseMinutes}m
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Avg Resolution</span>
            <p className="text-xl font-extrabold text-neutral-900 dark:text-neutral-100 mt-1">
              {analytics.avgResolutionHours}h
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">CSAT Score</span>
            <p className="text-xl font-extrabold text-amber-500 flex items-center gap-1 mt-1">
              ★ {analytics.averageCsat}/5
            </p>
          </div>
        </div>

        {/* Middle Section: Breakdown charts & meters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
            <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 mb-4">
              Ticket Volume by Category
            </h3>

            <div className="space-y-3">
              {analytics.ticketsByCategory.map(item => {
                const percentage = Math.round((item.count / (analytics.totalTickets || 1)) * 100);
                return (
                  <div key={item.category} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="capitalize text-neutral-700 dark:text-neutral-300">
                        {item.category.replace('_', ' ')}
                      </span>
                      <span className="text-neutral-400">
                        {item.count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Priority Breakdown */}
          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
            <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 mb-4">
              Ticket Volume by Priority
            </h3>

            <div className="space-y-3">
              {analytics.ticketsByPriority.map(item => {
                const percentage = Math.round((item.count / (analytics.totalTickets || 1)) * 100);
                const color =
                  item.priority === 'urgent'
                    ? 'bg-red-500'
                    : item.priority === 'high'
                    ? 'bg-orange-500'
                    : item.priority === 'medium'
                    ? 'bg-blue-500'
                    : 'bg-neutral-400';
                return (
                  <div key={item.priority} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="uppercase text-neutral-700 dark:text-neutral-300">
                        {item.priority}
                      </span>
                      <span className="text-neutral-400">
                        {item.count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-full`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Agent Leaderboard */}
        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            Support Agent Performance Leaderboard
          </h3>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {analytics.agentPerformance.map((agent, idx) => (
              <div key={agent.agentId} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-neutral-400 w-4">#{idx + 1}</span>
                  <img
                    src={agent.avatarUrl}
                    alt={agent.agentName}
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-neutral-200 dark:ring-neutral-700"
                  />
                  <div>
                    <p className="font-bold text-neutral-900 dark:text-neutral-100">{agent.agentName}</p>
                    <span className="text-[10px] text-neutral-400">Avg 1st Resp: {agent.avgFirstResponseMin}m</span>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="text-neutral-400 text-[10px]">Resolved</span>
                    <p className="font-bold text-neutral-900 dark:text-neutral-100">{agent.solved}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-neutral-400 text-[10px]">CSAT</span>
                    <p className="font-bold text-amber-500">★ {agent.avgCsat}/5</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
