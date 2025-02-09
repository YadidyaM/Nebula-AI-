import React, { useState, useEffect } from 'react';
import { MessageSquare, AlertTriangle, Loader, Shield, Activity, RefreshCcw, CheckCircle, XCircle, MessageCircle, BookmarkPlus, PlaySquare } from 'lucide-react';
import { processQuery } from '../services/aiAgent';
import { AutonomousAgent } from '../services/autonomousAgent';
import { DataService } from '../services/dataService';
import MissionChat from './collaboration/MissionChat';
import MissionAnnotations from './collaboration/MissionAnnotations';
import MissionPlayback from './collaboration/MissionPlayback';

const dataService = new DataService();
const agent = new AutonomousAgent();

interface Alert {
  id: string;
  type: 'warning' | 'critical';
  message: string;
  timestamp: string;
  recommendations?: string[];
  resolution?: {
    status: string;
    actions: string[];
  };
}

const MissionControl = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [agentStatus, setAgentStatus] = useState<'idle' | 'running' | 'error'>('idle');
  const [agentEvents, setAgentEvents] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const [resolutions, setResolutions] = useState<Map<string, any>>(new Map());

  useEffect(() => {
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 3;
    const RECONNECT_INTERVAL = 5000;

    const checkConnection = async () => {
      try {
        const status = await dataService.getLatestSystemStatus();
        if (status) {
          setConnectionStatus('connected');
          reconnectAttempts = 0;
          setLastUpdateTime(new Date());
        } else {
          throw new Error('Connection lost');
        }
      } catch (error) {
        setConnectionStatus('disconnected');
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          setConnectionStatus('reconnecting');
          setTimeout(checkConnection, RECONNECT_INTERVAL);
        }
      }
    };

    const connectionCheck = setInterval(checkConnection, 10000);

    // Initialize autonomous agent event listeners
    agent.on('status', (status) => {
      setAgentStatus(status.state);
      addAgentEvent('STATUS', status);
    });

    agent.on('error', (error) => {
      addAgentEvent('ERROR', error);
      setAgentStatus('error');
    });

    // Enhanced event listeners
    agent.on('healthAlert', (alert) => {
      addAgentEvent('HEALTH_ALERT', alert);
      if (alert.issues && alert.issues.length > 0) {
        alert.issues.forEach((issue: any) => {
          const alertId = `health-${Date.now()}-${Math.random()}`;
          const newAlert: Alert = {
            id: alertId,
            type: issue.severity === 'HIGH' ? 'critical' : 'warning',
            message: `${issue.component}: ${issue.status} - ${issue.impact}`,
            timestamp: new Date().toISOString(),
            recommendations: issue.recommendations
          };
          setAlerts(prev => [newAlert, ...prev]);
        });
      }
    });

    agent.on('anomalyAlert', (anomaly) => {
      addAgentEvent('ANOMALY_ALERT', anomaly);
      if (anomaly) {
        const alertId = anomaly.id || `anomaly-${Date.now()}-${Math.random()}`;
        const newAlert: Alert = {
          id: alertId,
          type: anomaly.severity === 'CRITICAL' ? 'critical' : 'warning',
          message: `${anomaly.type}: ${anomaly.description}`,
          timestamp: anomaly.timestamp,
          recommendations: anomaly.recommendations
        };
        setAlerts(prev => [newAlert, ...prev]);
      }
    });

    // Update alert resolution listener
    agent.on('alertResolved', (resolution) => {
      addAgentEvent('ALERT_RESOLVED', resolution);
      setAlerts(prev => prev.filter(alert => alert.id !== resolution.alertId));
      setResolutions(prev => new Map(prev.set(resolution.alertId, resolution)));
    });

    return () => {
      clearInterval(connectionCheck);
      if (agentStatus === 'running') {
        agent.stop();
      }
    };
  }, []);

  const addAgentEvent = (type: string, data: any) => {
    const eventId = `${type.toLowerCase()}-${Date.now()}-${Math.random()}`;
    setAgentEvents(prev => [{
      id: eventId,
      type,
      data,
      timestamp: new Date().toISOString()
    }, ...prev.slice(0, 49)]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }

    setLoading(true);
    try {
      const result = await processQuery(query.trim());
      setResponse(result);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to process query');
      setResponse('');
    } finally {
      setLoading(false);
    }
  };

  const toggleAgent = async () => {
    try {
      if (agentStatus !== 'running') {
        await agent.start();
      } else {
        agent.stop();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to toggle agent');
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'HEALTH_ALERT': return 'border-red-500 bg-red-50';
      case 'WEATHER_ALERT': return 'border-yellow-500 bg-yellow-50';
      case 'ANOMALY_ALERT': return 'border-orange-500 bg-orange-50';
      case 'TASK_OPTIMIZATION': return 'border-green-500 bg-green-50';
      case 'RESOURCE_STATUS': return 'border-blue-500 bg-blue-50';
      case 'ERROR': return 'border-red-500 bg-red-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className={`fixed top-4 right-4 flex items-center space-x-2 px-4 py-2 rounded-full ${
        connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
        connectionStatus === 'reconnecting' ? 'bg-yellow-100 text-yellow-800' :
        'bg-red-100 text-red-800'
      }`}>
        {connectionStatus === 'connected' ? (
          <CheckCircle className="h-4 w-4" />
        ) : connectionStatus === 'reconnecting' ? (
          <RefreshCcw className="h-4 w-4 animate-spin" />
        ) : (
          <XCircle className="h-4 w-4" />
        )}
        <span className="text-sm font-medium capitalize">{connectionStatus}</span>
        {connectionStatus === 'connected' && (
          <span className="text-xs">
            Last update: {new Date(lastUpdateTime).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* System Health Overview */}
      {systemHealth && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="flex items-center space-x-3">
              <Shield className={`h-6 w-6 ${
                systemHealth.health.propulsion === 'Operational' ? 'text-green-500' : 'text-yellow-500'
              }`} />
              <div>
                <p className="text-sm text-gray-500">Propulsion</p>
                <p className="font-semibold">{systemHealth.health.propulsion}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="flex items-center space-x-3">
              <Activity className={`h-6 w-6 ${
                systemHealth.health.thermal === 'Good' ? 'text-green-500' : 'text-yellow-500'
              }`} />
              <div>
                <p className="text-sm text-gray-500">Thermal</p>
                <p className="font-semibold">{systemHealth.health.thermal}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant Interface */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Mission Control Assistant</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="query" className="block text-sm font-medium text-gray-700">
              Ask your question
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="text"
                name="query"
                id="query"
                className={`flex-1 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 ${
                  error ? 'border-red-300' : ''
                }`}
                placeholder="e.g., Show me the health status of the propulsion system"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setError(null);
                }}
              />
              <button
                type="submit"
                disabled={loading || connectionStatus !== 'connected'}
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Processing...
                  </>
                ) : (
                  'Send Query'
                )}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>
        </form>
      </div>

      {/* Response Display */}
      {response && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <MessageSquare className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-semibold">Assistant Response</h3>
          </div>
          <p className="text-gray-700 whitespace-pre-wrap">{response}</p>
        </div>
      )}

      {/* Active Alerts */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-semibold">Active Alerts</h3>
          </div>
          <div className="text-sm text-gray-500">
            <span>{alerts.length} active {alerts.length === 1 ? 'alert' : 'alerts'}</span>
            <span className="mx-2">•</span>
            <span>{resolutions.size} resolved</span>
          </div>
        </div>
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-md ${
                alert.type === 'critical' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium">{alert.message}</p>
                    {alert.recommendations && alert.recommendations.length > 0 && (
                      <div className="mt-2 text-sm">
                        <p className="font-medium">AI Agent Resolving:</p>
                        <ul className="list-disc list-inside ml-2">
                          {alert.recommendations.map((rec, idx) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <p className="text-sm opacity-75">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    alert.type === 'critical' ? 'bg-red-200' : 'bg-yellow-200'
                  }`}>
                    {alert.type.toUpperCase()}
                  </span>
                  <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    AI RESOLVING
                  </span>
                </div>
              </div>
            </div>
          ))}
          {alerts.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              No active alerts
            </div>
          )}
        </div>
      </div>

      {/* Autonomous Agent Control */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Autonomous Agent</h3>
          <button
            onClick={toggleAgent}
            disabled={connectionStatus !== 'connected'}
            className={`px-4 py-2 rounded-md ${
              agentStatus === 'running'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            } text-white transition-colors duration-200 disabled:opacity-50`}
          >
            {agentStatus === 'running' ? 'Stop Agent' : 'Start Agent'}
          </button>
        </div>
        
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {agentEvents.map((event) => (
            <div 
              key={event.id}
              className={`border-l-4 pl-4 py-2 ${getEventColor(event.type)}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  {event.type}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <pre className="mt-2 text-sm bg-white p-2 rounded overflow-x-auto">
                {JSON.stringify(event.data, null, 2)}
              </pre>
            </div>
          ))}
          {agentEvents.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              No agent events
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MissionControl;