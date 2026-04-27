'use client';

import { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Database,
  Globe,
  CreditCard,
  Zap,
  Users,
  TrendingUp
} from 'lucide-react';

interface HealthCheck {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  responseTime?: number;
  message?: string;
  lastCheck: string;
}

interface SystemMetrics {
  totalUsers: number;
  activeSubscriptions: number;
  totalCreditsUsed: number;
  jobsToday: number;
  successRate: number;
  avgResponseTime: number;
}

// Check if we're in demo mode
const isDemoMode = () => {
  // First check server-side environment variable
  if (process.env.NEXT_PUBLIC_APP_ENV === 'demo' || process.env.DEMO_MODE === 'true') {
    return true;
  }
  
  // Only check client-side if we're in a browser environment
  try {
    if (typeof window !== 'undefined' && window?.location?.search?.includes('demo=true')) {
      return true;
    }
  } catch (error) {
    // Ignore errors when window is not available
  }
  
  return false;
};

export default function HealthDashboard() {
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const demoMode = isDemoMode();

  useEffect(() => {
    fetchHealthData();
    
    // Only set up polling in non-demo mode
    if (!demoMode) {
      const interval = setInterval(fetchHealthData, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [demoMode]);

  async function fetchHealthData() {
    try {
      // In demo mode, return mock data immediately
      if (demoMode) {
        const mockChecks: HealthCheck[] = [
          {
            name: 'API Server',
            status: 'healthy',
            responseTime: 45,
            message: 'Demo mode - all systems operational',
            lastCheck: new Date().toISOString(),
          },
          {
            name: 'Database',
            status: 'healthy',
            responseTime: 23,
            message: 'Demo mode - mock database connection',
            lastCheck: new Date().toISOString(),
          },
          {
            name: 'Replicate AI',
            status: 'healthy',
            responseTime: 150,
            message: 'Demo mode - AI services simulated',
            lastCheck: new Date().toISOString(),
          },
          {
            name: 'Stripe Payments',
            status: 'healthy',
            responseTime: 89,
            message: 'Demo mode - payment processing simulated',
            lastCheck: new Date().toISOString(),
          }
        ];
        
        const mockMetrics: SystemMetrics = {
          totalUsers: 1250,
          activeSubscriptions: 890,
          totalCreditsUsed: 45230,
          jobsToday: 342,
          successRate: 98.7,
          avgResponseTime: 125,
        };
        
        setHealthChecks(mockChecks);
        setMetrics(mockMetrics);
        setLastUpdate(new Date());
        setLoading(false);
        return;
      }
      
      // Health checks
      const healthResponse = await fetch('/api/health');
      const healthData = await healthResponse.json();
      
      const checks: HealthCheck[] = [
        {
          name: 'API Server',
          status: healthResponse.ok ? 'healthy' : 'error',
          responseTime: healthData.responseTime,
          message: healthData.message,
          lastCheck: new Date().toISOString(),
        }
      ];

      // Database check
      try {
        const dbResponse = await fetch('/api/health/database');
        const dbData = await dbResponse.json();
        checks.push({
          name: 'Database',
          status: dbResponse.ok ? 'healthy' : 'error',
          responseTime: dbData.responseTime,
          message: dbData.message,
          lastCheck: new Date().toISOString(),
        });
      } catch (error) {
        checks.push({
          name: 'Database',
          status: 'error',
          message: 'Connection failed',
          lastCheck: new Date().toISOString(),
        });
      }

      // Replicate API check
      try {
        const replicateResponse = await fetch('/api/health/replicate');
        const replicateData = await replicateResponse.json();
        checks.push({
          name: 'Replicate AI',
          status: replicateResponse.ok ? 'healthy' : 'warning',
          responseTime: replicateData.responseTime,
          message: replicateData.message,
          lastCheck: new Date().toISOString(),
        });
      } catch (error) {
        checks.push({
          name: 'Replicate AI',
          status: 'error',
          message: 'Service unreachable',
          lastCheck: new Date().toISOString(),
        });
      }

      // Stripe check
      try {
        const stripeResponse = await fetch('/api/health/stripe');
        const stripeData = await stripeResponse.json();
        checks.push({
          name: 'Stripe Payments',
          status: stripeResponse.ok ? 'healthy' : 'warning',
          responseTime: stripeData.responseTime,
          message: stripeData.message,
          lastCheck: new Date().toISOString(),
        });
      } catch (error) {
        checks.push({
          name: 'Stripe Payments',
          status: 'error',
          message: 'Service unreachable',
          lastCheck: new Date().toISOString(),
        });
      }

      setHealthChecks(checks);

      // System metrics
      try {
        const metricsResponse = await fetch('/api/admin/metrics');
        if (metricsResponse.ok) {
          const metricsData = await metricsResponse.json();
          setMetrics(metricsData);
        }
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch health data:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusIcon = (status: HealthCheck['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: HealthCheck['status']) => {
    switch (status) {
      case 'healthy':
        return 'border-green-500 bg-green-500/10';
      case 'warning':
        return 'border-yellow-500 bg-yellow-500/10';
      case 'error':
        return 'border-red-500 bg-red-500/10';
    }
  };

  const overallStatus = healthChecks.length > 0 
    ? healthChecks.some(check => check.status === 'error') 
      ? 'error'
      : healthChecks.some(check => check.status === 'warning')
      ? 'warning'
      : 'healthy'
    : 'error';

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center space-x-3">
              <Activity className="w-8 h-8" />
              <span>KlipCam Health Dashboard</span>
            </h1>
            <p className="text-gray-400 mt-2">
              Real-time system health and performance metrics
            </p>
          </div>
          
          <div className="text-right">
            <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full border ${getStatusColor(overallStatus)}`}>
              {getStatusIcon(overallStatus)}
              <span className="font-medium">
                {overallStatus === 'healthy' ? 'All Systems Operational' : 
                 overallStatus === 'warning' ? 'Some Issues Detected' : 
                 'System Problems'}
              </span>
            </div>
            <p className="text-gray-400 text-sm mt-1">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* System Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center space-x-3">
                <Users className="w-8 h-8 text-blue-400" />
                <div>
                  <div className="text-2xl font-bold">{metrics.totalUsers.toLocaleString()}</div>
                  <div className="text-gray-400 text-sm">Total Users</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center space-x-3">
                <CreditCard className="w-8 h-8 text-green-400" />
                <div>
                  <div className="text-2xl font-bold">{metrics.activeSubscriptions.toLocaleString()}</div>
                  <div className="text-gray-400 text-sm">Active Subs</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center space-x-3">
                <Zap className="w-8 h-8 text-yellow-400" />
                <div>
                  <div className="text-2xl font-bold">{metrics.totalCreditsUsed.toLocaleString()}</div>
                  <div className="text-gray-400 text-sm">Credits Used</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-8 h-8 text-purple-400" />
                <div>
                  <div className="text-2xl font-bold">{metrics.jobsToday.toLocaleString()}</div>
                  <div className="text-gray-400 text-sm">Jobs Today</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-8 h-8 text-green-400" />
                <div>
                  <div className="text-2xl font-bold">{metrics.successRate.toFixed(1)}%</div>
                  <div className="text-gray-400 text-sm">Success Rate</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center space-x-3">
                <Clock className="w-8 h-8 text-orange-400" />
                <div>
                  <div className="text-2xl font-bold">{metrics.avgResponseTime}ms</div>
                  <div className="text-gray-400 text-sm">Avg Response</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Health Checks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {healthChecks.map((check, index) => (
            <div
              key={index}
              className={`border rounded-2xl p-6 ${getStatusColor(check.status)}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(check.status)}
                  <div>
                    <h3 className="text-lg font-semibold">{check.name}</h3>
                    <p className="text-gray-400 text-sm">
                      {check.status === 'healthy' ? 'Operational' : 
                       check.status === 'warning' ? 'Degraded' : 'Down'}
                    </p>
                  </div>
                </div>
                
                {check.responseTime && (
                  <div className="text-right">
                    <div className="text-lg font-bold">{check.responseTime}ms</div>
                    <div className="text-gray-400 text-xs">Response Time</div>
                  </div>
                )}
              </div>
              
              {check.message && (
                <div className="bg-black/20 rounded-lg p-3 mb-3">
                  <p className="text-sm">{check.message}</p>
                </div>
              )}
              
              <div className="text-xs text-gray-400">
                Last checked: {new Date(check.lastCheck).toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* Refresh Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => {
              setLoading(true);
              fetchHealthData();
            }}
            disabled={loading}
            className="px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
          >
            {loading ? 'Refreshing...' : 'Refresh Status'}
          </button>
        </div>
      </div>
    </div>
  );
}