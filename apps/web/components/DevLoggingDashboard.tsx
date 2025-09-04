'use client';

import React, { useState, useEffect } from 'react';
import { quickLogging, shouldLog, getLoggingConfig } from '../lib/dev-logging-config';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  cid?: string;
  service?: string;
  action?: string;
  [key: string]: any;
}

export default function DevLoggingDashboard() {
  const [isVisible, setIsVisible] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [config, setConfig] = useState(getLoggingConfig());
  const [autoScroll, setAutoScroll] = useState(true);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterService, setFilterService] = useState<string>('all');

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  useEffect(() => {
    // Listen for console.log messages to capture logs
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;

    const captureLog = (level: string, ...args: any[]) => {
      try {
        const logEntry: LogEntry = {
          timestamp: new Date().toISOString(),
          level,
          message: args.map(arg => 
            typeof arg === 'string' ? arg : JSON.stringify(arg)
          ).join(' '),
        };

        // Try to parse structured logs
        if (args.length === 1 && typeof args[0] === 'string') {
          try {
            const parsed = JSON.parse(args[0]);
            if (parsed.t && parsed.level && parsed.message) {
              Object.assign(logEntry, parsed);
            }
          } catch {
            // Not JSON, keep as is
          }
        }

        setLogs(prev => [...prev.slice(-99), logEntry]); // Keep last 100 logs
      } catch (error) {
        // Silently fail if log capture fails
      }
    };

    console.log = (...args) => {
      captureLog('debug', ...args);
      originalLog(...args);
    };

    console.error = (...args) => {
      captureLog('error', ...args);
      originalError(...args);
    };

    console.warn = (...args) => {
      captureLog('warn', ...args);
      originalWarn(...args);
    };

    console.info = (...args) => {
      captureLog('info', ...args);
      originalInfo(...args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      console.info = originalInfo;
    };
  }, []);

  useEffect(() => {
    if (autoScroll && logs.length > 0) {
      const logContainer = document.getElementById('log-container');
      if (logContainer) {
        logContainer.scrollTop = logContainer.scrollHeight;
      }
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter(log => {
    if (filterLevel !== 'all' && log.level !== filterLevel) return false;
    if (filterService !== 'all' && log.service !== filterService) return false;
    return true;
  });

  const clearLogs = () => setLogs([]);
  
  const exportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shieldai-logs-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-500';
      case 'warn': return 'text-yellow-500';
      case 'info': return 'text-blue-500';
      case 'debug': return 'text-gray-500';
      default: return 'text-gray-300';
    }
  };

  const getServiceIcon = (service?: string) => {
    switch (service) {
      case 'youtube': return '🎬';
      case 'chat': return '💬';
      case 'database': return '💾';
      case 'auth': return '🔐';
      default: return '📝';
    }
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-all duration-200"
        title="Development Logging Dashboard"
      >
        {isVisible ? '📊' : '🔍'}
      </button>

      {/* Dashboard overlay */}
      {isVisible && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 text-white rounded-lg shadow-2xl w-full max-w-6xl h-5/6 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold">🔍 Development Logging Dashboard</h2>
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Controls */}
            <div className="p-4 border-b border-gray-700 space-y-4">
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Quick Actions</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => quickLogging.focusOnYouTube()}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                    >
                      🎬 YouTube Only
                    </button>
                    <button
                      onClick={() => quickLogging.focusOnChat()}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                    >
                      💬 Chat Only
                    </button>
                    <button
                      onClick={() => quickLogging.focusOnDatabase()}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
                    >
                      💾 Database Only
                    </button>
                    <button
                      onClick={() => quickLogging.enableAll()}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm"
                    >
                      🚀 All
                    </button>
                    <button
                      onClick={() => quickLogging.disableAll()}
                      className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
                    >
                      🔇 None
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Filters</label>
                  <div className="flex gap-2">
                    <select
                      value={filterLevel}
                      onChange={(e) => setFilterLevel(e.target.value)}
                      className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm"
                    >
                      <option value="all">All Levels</option>
                      <option value="error">Error</option>
                      <option value="warn">Warning</option>
                      <option value="info">Info</option>
                      <option value="debug">Debug</option>
                    </select>
                    <select
                      value={filterService}
                      onChange={(e) => setFilterService(e.target.value)}
                      className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm"
                    >
                      <option value="all">All Services</option>
                      <option value="youtube">YouTube</option>
                      <option value="chat">Chat</option>
                      <option value="database">Database</option>
                      <option value="auth">Auth</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Options</label>
                  <div className="flex gap-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={autoScroll}
                        onChange={(e) => setAutoScroll(e.target.checked)}
                        className="rounded"
                      />
                      Auto-scroll
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Actions</label>
                  <div className="flex gap-2">
                    <button
                      onClick={clearLogs}
                      className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-sm"
                    >
                      🗑️ Clear
                    </button>
                    <button
                      onClick={exportLogs}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
                    >
                      📥 Export
                    </button>
                  </div>
                </div>
              </div>

              {/* Current Config Status */}
              <div className="text-sm text-gray-300">
                <span className="font-medium">Current Config:</span>
                YouTube: {config.youtube.enabled ? '✅' : '❌'} | 
                Chat: {config.chat.enabled ? '✅' : '❌'} | 
                Database: {config.database.enabled ? '✅' : '❌'} | 
                General: {config.general.enabled ? '✅' : '❌'}
              </div>
            </div>

            {/* Logs */}
            <div className="flex-1 overflow-hidden">
              <div
                id="log-container"
                className="h-full overflow-y-auto p-4 font-mono text-sm space-y-1"
              >
                {filteredLogs.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">
                    No logs to display. Try sending a message to Shield AI or adjust filters.
                  </div>
                ) : (
                  filteredLogs.map((log, index) => (
                    <div
                      key={index}
                      className="border-l-4 border-gray-700 pl-3 py-1 hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 text-xs flex-shrink-0">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className={`font-medium ${getLevelColor(log.level)}`}>
                          {log.level.toUpperCase()}
                        </span>
                        {log.service && (
                          <span className="text-lg" title={log.service}>
                            {getServiceIcon(log.service)}
                          </span>
                        )}
                        {log.cid && (
                          <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                            {log.cid}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-gray-300">
                        {log.message}
                      </div>
                      {log.extra && (
                        <div className="mt-1 text-xs text-gray-500">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(log.extra, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-700 text-sm text-gray-400">
              <div className="flex justify-between items-center">
                <span>
                  Showing {filteredLogs.length} of {logs.length} total logs
                </span>
                <span>
                  Last updated: {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

