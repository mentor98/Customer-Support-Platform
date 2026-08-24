import React, { useState } from 'react';
import {
  X,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  Layers,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { TestCaseResult } from '../types';
import { api } from '../lib/api';

interface TestRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestRunnerModal: React.FC<TestRunnerModalProps> = ({ isOpen, onClose }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestCaseResult[]>([]);
  const [summary, setSummary] = useState<{
    total: number;
    passed: number;
    failed: number;
    success: boolean;
    executedAt: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleRunTests = async () => {
    setIsRunning(true);
    try {
      const data = await api.runAutomatedTests();
      setSummary(data.summary);
      setResults(data.results);
    } catch (err) {
      console.error('Test execution error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <PlayCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Automated Test Suite Runner
              </h3>
              <p className="text-xs text-neutral-500">
                Unit, integration & security tests for RBAC, Ticket Lifecycle, SLA Engine & AI Services.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action & Summary Bar */}
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-wrap items-center justify-between gap-4">
          <button
            id="btn-execute-test-suite"
            onClick={handleRunTests}
            disabled={isRunning}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Running Test Suite...' : 'Execute Test Suite'}</span>
          </button>

          {summary && (
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>{summary.passed} Passed</span>
              </div>

              {summary.failed > 0 && (
                <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>{summary.failed} Failed</span>
                </div>
              )}

              <span className="text-neutral-400">|</span>
              <span className="text-neutral-500">{summary.total} Total Assertions</span>
            </div>
          )}
        </div>

        {/* Test Cases Results List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-neutral-50/50 dark:bg-neutral-950/40">
          {results.length === 0 ? (
            <div className="p-12 text-center text-xs text-neutral-400">
              Click "Execute Test Suite" to run automated tests across all backend services.
            </div>
          ) : (
            results.map((test, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs flex items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-3">
                  {test.passed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-neutral-900 dark:text-neutral-100">
                        {test.name}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                        {test.category}
                      </span>
                    </div>
                    {test.error && (
                      <p className="text-red-500 font-mono text-[11px] mt-1">{test.error}</p>
                    )}
                  </div>
                </div>

                <div className="text-[11px] font-mono text-neutral-400 shrink-0">
                  {test.durationMs}ms
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
