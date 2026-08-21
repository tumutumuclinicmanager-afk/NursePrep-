import React, { useState, useEffect, useRef } from 'react';
import { 
  Server, Cpu, ShieldAlert, Database, HardDrive, 
  Activity, RefreshCw, CheckCircle2, AlertTriangle, 
  Zap, Sliders, Play, RotateCcw, ShieldCheck, 
  Clock, ArrowUpRight, BarChart2, Radio, Lock
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, BarChart, Bar, CartesianGrid 
} from 'recharts';

interface Policy {
  id: string;
  name: string;
  category: string;
  scope: string;
  max: number;
  windowMinutes: number;
  enabled: boolean;
  description: string;
  limit?: string;
}

interface ProbeLog {
  id: string;
  timestamp: string;
  status: number;
  statusText: string;
  message: string;
  category?: string;
  retryAfter?: number;
  durationMs: number;
}

export default function ScalabilityDashboard() {
  const [policies, setPolicies] = useState<Policy[]>([
    {
      id: "general",
      name: "General API Traffic",
      category: "Core API Gateway",
      scope: "/api/*",
      max: 100,
      windowMinutes: 15,
      enabled: true,
      description: "Standard REST API endpoints across user dashboards and listings."
    },
    {
      id: "ai",
      name: "AI Study Mentor & Quiz Generation",
      category: "AI Generation",
      scope: "/api/study-assistant, /api/generate-quiz",
      max: 25,
      windowMinutes: 10,
      enabled: true,
      description: "Limits expensive LLM tokens and automated question generation per IP window."
    },
    {
      id: "upload",
      name: "Exam PDF Extraction & OCR",
      category: "File Uploads",
      scope: "/api/upload-exam",
      max: 10,
      windowMinutes: 15,
      enabled: true,
      description: "Limits server-intensive PDF document parsing and OCR extraction."
    },
    {
      id: "payment",
      name: "M-Pesa STK Push Payment",
      category: "Financial / Payments",
      scope: "/api/payment/stkpush",
      max: 5,
      windowMinutes: 10,
      enabled: true,
      description: "Prevents STK push spam and protects Safaricom Daraja integration."
    },
    {
      id: "test",
      name: "Demo Test & Probe Endpoint",
      category: "Testing & Sandbox",
      scope: "/api/test-rate-limit",
      max: 5,
      windowMinutes: 1,
      enabled: true,
      description: "Interactive probe endpoint for admins to verify HTTP 429 response handling."
    }
  ]);

  const [clientIp, setClientIp] = useState<string>('127.0.0.1');
  const [serverEngine, setServerEngine] = useState<string>('express-rate-limit + token-bucket dynamic engine');
  const [serverTime, setServerTime] = useState<string>(new Date().toISOString());
  const [isFetchingStatus, setIsFetchingStatus] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Probe Test State
  const [probeLogs, setProbeLogs] = useState<ProbeLog[]>([]);
  const [isProbing, setIsProbing] = useState<boolean>(false);
  const [burstCount, setBurstCount] = useState<number>(6);
  const [consecutive429s, setConsecutive429s] = useState<number>(0);
  const [quotaRemaining, setQuotaRemaining] = useState<string | number>('Active');

  // Traffic Telemetry simulation data
  const [trafficTelemetry, setTrafficTelemetry] = useState<any[]>([
    { time: '10:00', requests: 140, aiTokens: 1800, blocked429: 0 },
    { time: '10:05', requests: 220, aiTokens: 2900, blocked429: 1 },
    { time: '10:10', requests: 310, aiTokens: 4100, blocked429: 3 },
    { time: '10:15', requests: 280, aiTokens: 3800, blocked429: 2 },
    { time: '10:20', requests: 460, aiTokens: 6200, blocked429: 8 },
    { time: '10:25', requests: 390, aiTokens: 5300, blocked429: 4 },
    { time: '10:30', requests: 520, aiTokens: 7100, blocked429: 12 },
  ]);

  const fetchLiveStatus = async () => {
    setIsFetchingStatus(true);
    try {
      const res = await fetch('/api/rate-limit-status');
      if (res.ok) {
        const data = await res.json();
        if (data.policies && Array.isArray(data.policies)) {
          setPolicies(data.policies);
        }
        if (data.clientIp) setClientIp(data.clientIp);
        if (data.provider) setServerEngine(data.provider);
        if (data.serverTime) setServerTime(data.serverTime);
      }
    } catch (e) {
      console.warn("Could not reach rate-limit-status endpoint, using cached state.", e);
    } finally {
      setIsFetchingStatus(false);
    }
  };

  useEffect(() => {
    fetchLiveStatus();
  }, []);

  const handleUpdatePolicy = (id: string, field: 'max' | 'windowMinutes' | 'enabled', value: any) => {
    setPolicies(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, [field]: value };
      }
      return p;
    }));
  };

  const handleSavePolicies = async () => {
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/admin/rate-limit-policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policies })
      });
      if (res.ok) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus(null), 3500);
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      setSaveStatus('error');
    }
  };

  const handleResetDefaults = async () => {
    if (!window.confirm("Reset all rate limit policies to factory defaults?")) return;
    try {
      const res = await fetch('/api/admin/rate-limit-reset', { method: 'POST' });
      if (res.ok) {
        await fetchLiveStatus();
        setSaveStatus('reset');
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const executeSingleProbe = async (): Promise<ProbeLog> => {
    const start = performance.now();
    try {
      const res = await fetch('/api/test-rate-limit', { method: 'GET' });
      const durationMs = Math.round(performance.now() - start);
      const data = await res.json();

      if (res.status === 429) {
        setConsecutive429s(prev => prev + 1);
        setQuotaRemaining(0);
        return {
          id: Math.random().toString(36).substring(7),
          timestamp: new Date().toLocaleTimeString(),
          status: 429,
          statusText: 'Too Many Requests',
          message: data.error || 'Rate limit triggered. Cooldown active.',
          category: data.category || 'test',
          retryAfter: data.retryAfterSeconds || 60,
          durationMs
        };
      } else {
        setQuotaRemaining(data.quotaRemaining ?? 'OK');
        return {
          id: Math.random().toString(36).substring(7),
          timestamp: new Date().toLocaleTimeString(),
          status: res.status,
          statusText: '200 OK',
          message: data.message || 'Probe request allowed.',
          durationMs
        };
      }
    } catch (err: any) {
      const durationMs = Math.round(performance.now() - start);
      return {
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toLocaleTimeString(),
        status: 500,
        statusText: 'Network Error',
        message: err.message || 'Connection failed',
        durationMs
      };
    }
  };

  const handleRunBurstProbe = async () => {
    setIsProbing(true);
    const newLogs: ProbeLog[] = [];

    for (let i = 0; i < burstCount; i++) {
      const log = await executeSingleProbe();
      newLogs.unshift(log);
      setProbeLogs(prev => [log, ...prev].slice(0, 30));
      // Small stagger to simulate high throughput
      await new Promise(r => setTimeout(r, 120));
    }

    setIsProbing(false);
  };

  const handleClearLogs = () => {
    setProbeLogs([]);
    setConsecutive429s(0);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" /> Live Telemetry
            </span>
            <span className="text-xs text-slate-400 font-mono">IP: {clientIp}</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Cloud Infrastructure & Traffic Telemetry</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Real-time rate limiting rules, token bucket policies, and traffic probe diagnostics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchLiveStatus}
            disabled={isFetchingStatus}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition-colors border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetchingStatus ? 'animate-spin' : ''}`} /> Sync Engine
          </button>
          <button
            onClick={handleSavePolicies}
            disabled={saveStatus === 'saving'}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
          >
            <ShieldCheck className="w-4 h-4" /> Save Policies
          </button>
        </div>
      </div>

      {saveStatus === 'success' && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Dynamic rate limiting policies deployed live to the API gateway.
        </div>
      )}
      {saveStatus === 'reset' && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <RotateCcw className="w-4 h-4 text-blue-600" /> Default policy parameters successfully restored.
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Active Policies</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900">{policies.filter(p => p.enabled).length} / {policies.length}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Enforced rate limit layers</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Inbound Traffic</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900">520 req / min</h3>
            <p className="text-xs text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> Normal operating range
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">AI Token Telemetry</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900">7.1k tok / min</h3>
            <p className="text-xs text-slate-500 mt-0.5">Gemini 2.5 Flash pipeline</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Blocked 429 Probes</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900">{consecutive429s} Blocked</h3>
            <p className="text-xs text-slate-500 mt-0.5">Current test sandbox window</p>
          </div>
        </div>
      </div>

      {/* Traffic Telemetry Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Real-time Gateway Throughput & AI Telemetry</h2>
            <p className="text-xs text-slate-500">Continuous sampling of API requests, token burn, and 429 throttling triggers.</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 font-medium text-slate-600">
              <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Requests
            </div>
            <div className="flex items-center gap-1.5 font-medium text-slate-600">
              <span className="w-3 h-3 rounded-full bg-purple-500 inline-block" /> AI Tokens (x10)
            </div>
            <div className="flex items-center gap-1.5 font-medium text-slate-600">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" /> 429 Throttles
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trafficTelemetry} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="colorAi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="requests" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorReq)" name="API Requests" />
              <Area type="monotone" dataKey="aiTokens" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorAi)" name="AI Tokens" />
              <Area type="monotone" dataKey="blocked429" stroke="#f43f5e" strokeWidth={2} fill="#f43f5e" fillOpacity={0.2} name="429 Rate Limits" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Layout: Rate Limit Policy Matrix & Probe Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Dynamic Policy Matrix (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" /> Rate Limiting Policies & Token Buckets
              </h2>
              <p className="text-xs text-slate-500">Fine-tune allowed quotas and time windows across server endpoints.</p>
            </div>
            <button
              onClick={handleResetDefaults}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Reset Defaults
            </button>
          </div>

          <div className="space-y-4">
            {policies.map((policy) => (
              <div 
                key={policy.id} 
                className={`p-4 rounded-xl border transition-all ${
                  policy.enabled 
                    ? 'bg-slate-50/50 border-slate-200' 
                    : 'bg-slate-100/60 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{policy.name}</h4>
                      <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono text-[10px]">
                        {policy.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{policy.description}</p>
                    <p className="text-[11px] font-mono text-indigo-600 mt-0.5">{policy.scope}</p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={policy.enabled} 
                      onChange={(e) => handleUpdatePolicy(policy.id, 'enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {/* Sliders and Controls */}
                {policy.enabled && (
                  <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-200/80">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700">Max Requests</span>
                        <span className="font-mono font-bold text-indigo-700">{policy.max} req</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max={policy.id === 'general' ? 500 : policy.id === 'ai' ? 100 : 50} 
                        value={policy.max}
                        onChange={(e) => handleUpdatePolicy(policy.id, 'max', Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700">Window Period</span>
                        <span className="font-mono font-bold text-indigo-700">{policy.windowMinutes} min</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="60" 
                        value={policy.windowMinutes}
                        onChange={(e) => handleUpdatePolicy(policy.id, 'windowMinutes', Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Interactive Probe Sandbox & Live Telemetry Log (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Probe Trigger Card */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" /> Gateway Rate-Limit Probe
                </h3>
                <p className="text-xs text-slate-400">Dispatch burst requests to test HTTP 429 responses and cooldowns.</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                quotaRemaining === 0 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                Quota: {quotaRemaining}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1.5">
                  Burst Volume (Simultaneous requests to <code className="text-indigo-300">/api/test-rate-limit</code>):
                </label>
                <div className="flex items-center gap-2">
                  {[3, 6, 10, 15].map((n) => (
                    <button
                      key={n}
                      onClick={() => setBurstCount(n)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        burstCount === n 
                          ? 'bg-indigo-600 text-white shadow-xs' 
                          : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      {n} Hits
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleRunBurstProbe}
                  disabled={isProbing}
                  className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-slate-900 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
                >
                  <Play className={`w-3.5 h-3.5 fill-current ${isProbing ? 'animate-pulse' : ''}`} />
                  {isProbing ? 'Firing Request Burst...' : `Execute Burst (${burstCount} Requests)`}
                </button>
                <button
                  onClick={handleClearLogs}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                  title="Clear telemetry logs"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Telemetry Output Log */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-slate-600" /> Probe Execution Telemetry Log
              </span>
              <span className="text-[11px] text-slate-400 font-mono">{probeLogs.length} events logged</span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {probeLogs.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs italic">
                  No probe runs logged yet. Click "Execute Burst" above to test the rate limiting throttle.
                </div>
              ) : (
                probeLogs.map((log) => (
                  <div 
                    key={log.id}
                    className={`p-2.5 rounded-xl text-xs border flex items-start justify-between gap-2 ${
                      log.status === 429 
                        ? 'bg-rose-50/80 border-rose-200 text-rose-900' 
                        : log.status === 200 
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                          log.status === 429 ? 'bg-rose-200 text-rose-800' : 'bg-emerald-200 text-emerald-800'
                        }`}>
                          HTTP {log.status}
                        </span>
                        <span className="font-semibold text-slate-900">{log.statusText}</span>
                      </div>
                      <p className="text-[11px] text-slate-600">{log.message}</p>
                      {log.retryAfter && (
                        <p className="text-[10px] font-mono text-rose-600 font-bold">
                          Retry-After Header: {log.retryAfter}s cooldown
                        </p>
                      )}
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <span className="text-[10px] text-slate-400 font-mono block">{log.timestamp}</span>
                      <span className="text-[10px] font-mono text-slate-500 font-semibold">{log.durationMs}ms</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
