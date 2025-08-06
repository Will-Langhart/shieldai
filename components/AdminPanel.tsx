import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  BarChart3, 
  Users, 
  Settings, 
  Database, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  MessageSquare,
  BookOpen,
  X
} from 'lucide-react';
import AnalyticsDashboard from './AnalyticsDashboard';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
  user?: any;
}

interface SystemStatus {
  apiHealth: 'healthy' | 'degraded' | 'down';
  databaseHealth: 'healthy' | 'degraded' | 'down';
  aiServiceHealth: 'healthy' | 'degraded' | 'down';
  bibleApiHealth: 'healthy' | 'degraded' | 'down';
  lastUpdated: string;
}

interface QuickStats {
  totalUsers: number;
  activeUsers: number;
  totalConversations: number;
  errorRate: number;
  responseTime: number;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  theme = 'dark',
  user
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'users' | 'system' | 'settings'>('overview');
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    apiHealth: 'healthy',
    databaseHealth: 'healthy',
    aiServiceHealth: 'healthy',
    bibleApiHealth: 'healthy',
    lastUpdated: new Date().toISOString()
  });
  const [quickStats, setQuickStats] = useState<QuickStats>({
    totalUsers: 1247,
    activeUsers: 892,
    totalConversations: 3456,
    errorRate: 0.02,
    responseTime: 245
  });
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Check if user has admin privileges
  const isAdmin = user?.email === 'langhartcw@gmail.com' || user?.role === 'admin';

  useEffect(() => {
    if (isOpen && isAdmin) {
      // Load system status and stats
      loadSystemStatus();
      loadQuickStats();
    }
  }, [isOpen, isAdmin]);

  const loadSystemStatus = async () => {
    try {
      // In production, this would call actual health check endpoints
      const response = await fetch('/api/health');
      if (response.ok) {
        const data = await response.json();
        setSystemStatus(data);
      }
    } catch (error) {
      console.error('Failed to load system status:', error);
    }
  };

  const loadQuickStats = async () => {
    try {
      // In production, this would call analytics endpoints
      // For now, using mock data
      setQuickStats({
        totalUsers: 1247,
        activeUsers: 892,
        totalConversations: 3456,
        errorRate: 0.02,
        responseTime: 245
      });
    } catch (error) {
      console.error('Failed to load quick stats:', error);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';
      case 'down': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />;
      case 'degraded': return <AlertTriangle className="w-4 h-4" />;
      case 'down': return <X className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'system', label: 'System', icon: Database },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 rounded-lg border ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Total Users</p>
              <p className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>{quickStats.totalUsers.toLocaleString()}</p>
            </div>
            <Users className={`w-8 h-8 ${
              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
            }`} />
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Active Users</p>
              <p className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>{quickStats.activeUsers.toLocaleString()}</p>
            </div>
            <TrendingUp className={`w-8 h-8 ${
              theme === 'dark' ? 'text-green-400' : 'text-green-600'
            }`} />
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Conversations</p>
              <p className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>{quickStats.totalConversations.toLocaleString()}</p>
            </div>
            <MessageSquare className={`w-8 h-8 ${
              theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
            }`} />
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Response Time</p>
              <p className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>{quickStats.responseTime}ms</p>
            </div>
            <Activity className={`w-8 h-8 ${
              theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
            }`} />
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className={`p-6 rounded-lg border ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>System Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3">
            <div className={getHealthColor(systemStatus.apiHealth)}>
              {getHealthIcon(systemStatus.apiHealth)}
            </div>
            <div>
              <p className={`font-medium ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>API</p>
              <p className={`text-sm capitalize ${getHealthColor(systemStatus.apiHealth)}`}>
                {systemStatus.apiHealth}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className={getHealthColor(systemStatus.databaseHealth)}>
              {getHealthIcon(systemStatus.databaseHealth)}
            </div>
            <div>
              <p className={`font-medium ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Database</p>
              <p className={`text-sm capitalize ${getHealthColor(systemStatus.databaseHealth)}`}>
                {systemStatus.databaseHealth}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className={getHealthColor(systemStatus.aiServiceHealth)}>
              {getHealthIcon(systemStatus.aiServiceHealth)}
            </div>
            <div>
              <p className={`font-medium ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>AI Service</p>
              <p className={`text-sm capitalize ${getHealthColor(systemStatus.aiServiceHealth)}`}>
                {systemStatus.aiServiceHealth}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className={getHealthColor(systemStatus.bibleApiHealth)}>
              {getHealthIcon(systemStatus.bibleApiHealth)}
            </div>
            <div>
              <p className={`font-medium ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Bible API</p>
              <p className={`text-sm capitalize ${getHealthColor(systemStatus.bibleApiHealth)}`}>
                {systemStatus.bibleApiHealth}
              </p>
            </div>
          </div>
        </div>
        <p className={`text-sm mt-4 ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Last updated: {new Date(systemStatus.lastUpdated).toLocaleString()}
        </p>
      </div>

      {/* Quick Actions */}
      <div className={`p-6 rounded-lg border ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setShowAnalytics(true)}
            className={`p-4 rounded-lg border transition-colors ${
              theme === 'dark'
                ? 'border-gray-600 hover:border-blue-500 hover:bg-gray-700'
                : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
            }`}
          >
            <BarChart3 className={`w-6 h-6 mb-2 ${
              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
            }`} />
            <p className={`font-medium ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>View Analytics</p>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>Detailed metrics and insights</p>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`p-4 rounded-lg border transition-colors ${
              theme === 'dark'
                ? 'border-gray-600 hover:border-green-500 hover:bg-gray-700'
                : 'border-gray-300 hover:border-green-500 hover:bg-green-50'
            }`}
          >
            <Users className={`w-6 h-6 mb-2 ${
              theme === 'dark' ? 'text-green-400' : 'text-green-600'
            }`} />
            <p className={`font-medium ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Manage Users</p>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>User administration</p>
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`p-4 rounded-lg border transition-colors ${
              theme === 'dark'
                ? 'border-gray-600 hover:border-orange-500 hover:bg-gray-700'
                : 'border-gray-300 hover:border-orange-500 hover:bg-orange-50'
            }`}
          >
            <Settings className={`w-6 h-6 mb-2 ${
              theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
            }`} />
            <p className={`font-medium ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>System Config</p>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>Configure settings</p>
          </button>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className={`relative p-8 rounded-2xl shadow-2xl ${
          theme === 'dark' ? 'bg-gray-900' : 'bg-white'
        }`}>
          <div className="text-center">
            <Shield className={`w-16 h-16 mx-auto mb-4 ${
              theme === 'dark' ? 'text-red-400' : 'text-red-600'
            }`} />
            <h2 className={`text-xl font-bold mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Access Denied</h2>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              You don't have permission to access the admin panel.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className={`relative w-full max-w-7xl mx-4 rounded-2xl shadow-2xl overflow-y-auto max-h-[95vh] ${
          theme === 'dark' ? 'bg-gray-900' : 'bg-white'
        }`}>
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Admin Panel</h2>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>System administration and analytics</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark' 
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className={`flex border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-6 py-4 transition-colors ${
                    isActive
                      ? theme === 'dark'
                        ? 'text-blue-400 border-b-2 border-blue-400'
                        : 'text-blue-600 border-b-2 border-blue-600'
                      : theme === 'dark'
                        ? 'text-gray-400 hover:text-gray-300'
                        : 'text-gray-600 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'analytics' && (
              <div className="text-center py-8">
                <BarChart3 className={`w-16 h-16 mx-auto mb-4 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`} />
                <p className={`text-lg ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Analytics Dashboard</p>
                <button
                  onClick={() => setShowAnalytics(true)}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Open Analytics
                </button>
              </div>
            )}
            {activeTab === 'users' && (
              <div className="text-center py-8">
                <Users className={`w-16 h-16 mx-auto mb-4 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`} />
                <p className={`text-lg ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>User Management</p>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Coming soon...</p>
              </div>
            )}
            {activeTab === 'system' && (
              <div className="text-center py-8">
                <Database className={`w-16 h-16 mx-auto mb-4 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`} />
                <p className={`text-lg ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>System Configuration</p>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Coming soon...</p>
              </div>
            )}
            {activeTab === 'settings' && (
              <div className="text-center py-8">
                <Settings className={`w-16 h-16 mx-auto mb-4 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`} />
                <p className={`text-lg ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Admin Settings</p>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Coming soon...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Analytics Dashboard Modal */}
      {showAnalytics && (
        <AnalyticsDashboard
          isOpen={showAnalytics}
          onClose={() => setShowAnalytics(false)}
          theme={theme}
        />
      )}
    </>
  );
};

export default AdminPanel;