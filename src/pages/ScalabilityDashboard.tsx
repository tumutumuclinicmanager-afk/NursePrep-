import React, { useState, useEffect } from 'react';
import { 
  Server, Cpu, ShieldAlert, Database, HardDrive, 
  Layers, Globe, Activity, CheckCircle2, RefreshCw, 
  Zap, ArrowRight, Lock, Radio, CpuIcon, CloudLightning,
  Clock, ShieldCheck, AlertTriangle, Play, Sliders,
  Save, RotateCcw, Sparkles, Check, ChevronRight,
  Shield, Key, Flame
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface RateTestLog {
  id: string;
  time: string;
  status: number;
  message: string;
  remaining?: string | number;
  retryAfter?: number;
}

interface RatePolicy {
  id: string;
  name: string;
  category: string;
  scope: string;
  max: number;
  windowMinutes: number;
  enabled: boolean;
  limit?: string;
  description: string;
}

export default function ScalabilityDashboard() {
  // Simulator States
  const [lbActiveNodes, setLbActiveNodes] = useState<number>(3);
  const [lbAlgorithm, setLbAlgorithm] = useState<'round-robin' | 'least-conn'>('round-robin');
  const [lbRequests, setLbRequests] = useState<number>(4500);

  const [cacheEnabled, setCacheEnabled] = useState<boolean>(true);
  const [cacheHits, setCacheHits] = useState<number>(14280);
  const [cacheMisses, setCacheMisses] = useState<number>(310);

  const [rateLimitEnabled, setRateLimitEnabled] = useState<boolean>(true);
  const [blockedRequests, setBlockedRequests] = useState<number>(128);

  // Live Rate Limiter Test Lab & Policy Manager State
  const [liveTestLogs, setLiveTestLogs] = useState<RateTestLog[]>([]);
  const [isTestingRateLimit, setIsTestingRateLimit] = useState<boolean>(false);
  const [policies, setPolicies] = useState<RatePolicy[]>([]);
  const [isSavingPolicies, setIsSavingPolicies] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');
  const [rateLimitCooldownSec, setRateLimitCooldownSec] = useState<number>(0);
  const [activePreset, setActivePreset] = useState<string>('balanced');

  const [queueJobs, setQueueJobs] = useState<number>(42);
  const [processingQueue, setProcessingQueue] = useState<boolean>(false);

  const [cdnRegion, setCdnRegion] = useState<string>('Global Edge (Cloudflare)');

  const fetchPolicies = async () => {
    try {
      const res = await fetch('/api/rate-limit-status');
      const data = await res.json();
      if (data.policies && Array.isArray(data.policies)) {
        setPolicies(data.policies);
      }
    } catch (e) {
      console.warn("Failed to fetch rate limit policies:", e);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  // Cooldown countdown
  useEffect(() => {
    if (rateLimitCooldownSec <= 0) return;
    const interval = setInterval(() => {
      setRateLimitCooldownSec(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [rateLimitCooldownSec]);

  const handlePolicyChange = (id: string, field: 'max' | 'windowMinutes' | 'enabled', value: any) => {
    setPolicies(prev => prev.map(p => {
      if (p.id === id) {
        const updated = { ...p, [field]: value };
        updated.limit = updated.enabled ? `${updated.max} req / ${updated.windowMinutes} min` : 'Disabled (Bypassed)';
        return updated;
      }
      return p;
    }));
  };

  const handleApplyPreset = (presetKey: 'strict' | 'balanced' | 'surge') => {
    setActivePreset(presetKey);
    if (presetKey === 'strict') {
      setPolicies(prev => prev.map(p => {
        if (p.id === 'general') return { ...p, max: 40, windowMinutes: 15, enabled: true };
        if (p.id === 'ai') return { ...p, max: 10, windowMinutes: 10, enabled: true };
        if (p.id === 'upload') return { ...p, max: 3, windowMinutes: 15, enabled: true };
        if (p.id === 'payment') return { ...p, max: 3, windowMinutes: 10, enabled: true };
        if (p.id === 'test') return { ...p, max: 2, windowMinutes: 1, enabled: true };
        return p;
      }));
    } else if (presetKey === 'surge') {
      setPolicies(prev => prev.map(p => {
        if (p.id === 'general') return { ...p, max: 300, windowMinutes: 15, enabled: true };
        if (p.id === 'ai') return { ...p, max: 75, windowMinutes: 10, enabled: true };
        if (p.id === 'upload') return { ...p, max: 30, windowMinutes: 15, enabled: true };
        if (p.id === 'payment') return { ...p, max: 15, windowMinutes: 10, enabled: true };
        if (p.id === 'test') return { ...p, max: 15, windowMinutes: 1, enabled: true };
        return p;
      }));
    } else {
      // Balanced
      setPolicies(prev => prev.map(p => {
        if (p.id === 'general') return { ...p, max: 100, windowMinutes: 15, enabled: true };
        if (p.id === 'ai') return { ...p, max: 25, windowMinutes: 10, enabled: true };
        if (p.id === 'upload') return { ...p, max: 10, windowMinutes: 15, enabled: true };
        if (p.id === 'payment') return { ...p, max: 5, windowMinutes: 10, enabled: true };
        if (p.id === 'test') return { ...p, max: 5, windowMinutes: 1, enabled: true };
        return p;
      }));
    }
  };

  const handleSavePoliciesToServer = async () => {
    setIsSavingPolicies(true);
    setSaveSuccessMsg('');
    try {
      const res = await fetch('/api/admin/rate-limit-policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policies })
      });
      const data = await res.json();
      if (res.ok) {
        setSaveSuccessMsg('Active rate limiting policies updated and enforced across all API routes!');
        if (data.policies) setPolicies(data.policies);
        setTimeout(() => setSaveSuccessMsg(''), 4000);
      } else {
        alert(data.error || 'Failed to save policies');
      }
    } catch (e: any) {
      alert('Error updating rate limits on server');
    } finally {
      setIsSavingPolicies(false);
    }
  };

  const handleResetDefaults = async () => {
    if (!confirm("Are you sure you want to restore all rate limit quotas to system defaults?")) return;
    setIsSavingPolicies(true);
    try {
      const res = await fetch('/api/admin/rate-limit-reset', { method: 'POST' });
      const data = await res.json();
      if (data.policies) {
        setPolicies(data.policies);
        setActivePreset('balanced');
        setSaveSuccessMsg('Restored system default rate limit rules.');
        setTimeout(() => setSaveSuccessMsg(''), 3000);
      }
    } catch (e) {
      alert("Failed to reset rate limit defaults");
    } finally {
      setIsSavingPolicies(false);
    }
  };

  const handleTestRateLimitRequest = async () => {
    setIsTestingRateLimit(true);
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    try {
      const res = await fetch('/api/test-rate-limit');
      const data = await res.json();
      
      if (res.status === 429) {
        setBlockedRequests(prev => prev + 1);
        const retry = data.retryAfterSeconds || 60;
        setRateLimitCooldownSec(retry);
        setLiveTestLogs(prev => [
          {
            id: `log-${Date.now()}`,
            time: now,
            status: 429,
            message: data.error || '429 Rate Limit Exceeded: Quota reached for category',
            remaining: 0,
            retryAfter: retry
          },
          ...prev.slice(0, 7)
        ]);
      } else {
        setLiveTestLogs(prev => [
          {
            id: `log-${Date.now()}`,
            time: now,
            status: 200,
            message: data.message || '200 OK: Probe accepted within configured category quota',
            remaining: data.quotaRemaining ?? 'Allowed'
          },
          ...prev.slice(0, 7)
        ]);
      }
    } catch (err: any) {
      setLiveTestLogs(prev => [
        {
          id: `log-${Date.now()}`,
          time: now,
          status: 500,
          message: err?.message || 'Network error probe execution'
        },
        ...prev.slice(0, 7)
      ]);
    } finally {
      setIsTestingRateLimit(false);
    }
  };

  const handleAddLoad = () => {
    setLbRequests(prev => prev + 1200);
    setCacheHits(prev => prev + 1150);
    setCacheMisses(prev => prev + 50);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Live Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Inbound Traffic</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{lbRequests.toLocaleString()} req/s</h3>
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 99.99% Uptime
            </span>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Cache Hit Rate</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {cacheEnabled ? `${((cacheHits / (cacheHits + cacheMisses || 1)) * 100).toFixed(1)}%` : 'Disabled'}
            </h3>
            <span className="text-xs text-blue-600 font-medium flex items-center gap-1 mt-1">
              <Zap className="w-3.5 h-3.5" /> Redis In-Memory
            </span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <Database className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Rate Limiter</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{blockedRequests} Blocked</h3>
            <span className="text-xs text-indigo-600 font-medium flex items-center gap-1 mt-1">
              <ShieldAlert className="w-3.5 h-3.5" /> Dynamic Rules Enforced
            </span>
          </div>
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <Lock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Background Jobs</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{queueJobs} Queued</h3>
            <span className="text-xs text-amber-600 font-medium flex items-center gap-1 mt-1">
              <Cpu className="w-3.5 h-3.5" /> RabbitMQ Workers
            </span>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
            <CloudLightning className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* SUPER ADMIN DYNAMIC RATE LIMITING POLICY CONFIGURATOR */}
      <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-bold">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-bold mb-1">
                <ShieldCheck className="w-3 h-3 text-indigo-600" /> Super Admin Active Policy Engine
              </div>
              <h2 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">Active Rate Limiting Policies & Category Quotas</h2>
              <p className="text-xs text-slate-500">
                Adjust the number of allowed HTTP requests and sliding time windows for each functional category in real-time.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Presets */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => handleApplyPreset('strict')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all ${
                  activePreset === 'strict' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="w-3 h-3 text-rose-500" /> Strict Defense
              </button>
              <button
                onClick={() => handleApplyPreset('balanced')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all ${
                  activePreset === 'balanced' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3 h-3 text-blue-500" /> Balanced (Rec)
              </button>
              <button
                onClick={() => handleApplyPreset('surge')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all ${
                  activePreset === 'surge' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Flame className="w-3 h-3 text-amber-500" /> High Surge
              </button>
            </div>

            <Button
              onClick={handleResetDefaults}
              variant="outline"
              className="text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 border-slate-200 hover:bg-slate-50 text-slate-600"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Defaults
            </Button>

            <Button
              onClick={handleSavePoliciesToServer}
              disabled={isSavingPolicies}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              {isSavingPolicies ? 'Applying to Express...' : 'Save & Enforce Policies'}
            </Button>
          </div>
        </div>

        {saveSuccessMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold rounded-2xl flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {saveSuccessMsg}
          </div>
        )}

        {/* Dynamic Policy Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {policies.map((policy) => (
            <div 
              key={policy.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                policy.enabled 
                  ? 'bg-slate-50/70 border-slate-200/90 shadow-xs' 
                  : 'bg-slate-100/60 border-slate-200 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 text-[10px] font-black uppercase tracking-wider">
                    {policy.category}
                  </span>
                  
                  {/* Status Toggle Switch */}
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold">
                    <input
                      type="checkbox"
                      checked={policy.enabled}
                      onChange={(e) => handlePolicyChange(policy.id, 'enabled', e.target.checked)}
                      className="sr-only"
                    />
                    <span className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors ${policy.enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                      <span className={`bg-white w-3.5 h-3.5 rounded-full shadow-xs transform transition-transform ${policy.enabled ? 'translate-x-3.5' : 'translate-x-0'}`}></span>
                    </span>
                    <span className="text-[11px] text-slate-500">{policy.enabled ? 'Active' : 'Bypassed'}</span>
                  </label>
                </div>

                <h3 className="font-extrabold text-slate-900 text-sm">{policy.name}</h3>
                <p className="text-slate-500 text-[11px] mt-0.5 font-mono">{policy.scope}</p>
                <p className="text-slate-600 text-xs mt-2 leading-relaxed">{policy.description}</p>
              </div>

              {/* Adjustable Controls */}
              <div className="mt-4 pt-3 border-t border-slate-200/70 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Max Requests
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="5000"
                        value={policy.max}
                        onChange={(e) => handlePolicyChange(policy.id, 'max', parseInt(e.target.value) || 1)}
                        className="w-full pl-2.5 pr-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                      <span className="text-[10px] text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2">req</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Window (Mins)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="1440"
                        value={policy.windowMinutes}
                        onChange={(e) => handlePolicyChange(policy.id, 'windowMinutes', parseInt(e.target.value) || 1)}
                        className="w-full pl-2.5 pr-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                      <span className="text-[10px] text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2">min</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500">
                  <span>Enforced Rule:</span>
                  <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                    {policy.enabled ? `${policy.max} req / ${policy.windowMinutes} min` : 'Unrestricted'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Live Probe Sandbox & 429 Test Console */}
        <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Live Sandbox Probe Tester</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Verify your active rate limiter in real time. Sending rapid probes will test the configured limits and trigger instant <strong>HTTP 429 Too Many Requests</strong> responses once your quota is reached.
            </p>

            <div className="pt-2">
              <Button
                onClick={handleTestRateLimitRequest}
                disabled={isTestingRateLimit || rateLimitCooldownSec > 0}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                {rateLimitCooldownSec > 0 ? (
                  <>
                    <Clock className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    <span>Rate Limited Cooldown Active ({rateLimitCooldownSec}s)</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Send Test Probe against Endpoint</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Probe Execution Telemetry Log</span>
              <span className="text-[11px] text-slate-400 font-mono">/api/test-rate-limit</span>
            </div>

            <div className="bg-slate-950 text-slate-200 rounded-2xl p-4 font-mono text-xs space-y-2 min-h-[160px] border border-slate-800 flex flex-col justify-start">
              {liveTestLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center py-6">
                  <Activity className="w-5 h-5 mb-1.5 text-slate-600 animate-pulse" />
                  <p>Click "Send Test Probe" to fire live requests against the active rate limiter.</p>
                </div>
              ) : (
                liveTestLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-2 text-[11px] pb-1.5 border-b border-slate-800/60 last:border-0">
                    <span className="text-slate-500">[{log.time}]</span>
                    <span className={`px-1.5 py-0.2 rounded font-bold ${log.status === 200 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
                      HTTP {log.status}
                    </span>
                    <span className={log.status === 200 ? 'text-slate-300' : 'text-rose-300'}>
                      {log.message}
                    </span>
                    {log.remaining !== undefined && (
                      <span className="text-slate-500 ml-auto shrink-0">
                        Remaining: {log.remaining}
                      </span>
                    )}
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
