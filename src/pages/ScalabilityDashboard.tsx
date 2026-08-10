import React, { useState } from 'react';
import { 
  Server, Cpu, ShieldAlert, Database, HardDrive, 
  Layers, Globe, Activity, CheckCircle2, RefreshCw, 
  Zap, ArrowRight, Lock, Radio, CpuIcon, CloudLightning
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

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

  const [queueJobs, setQueueJobs] = useState<number>(42);
  const [processingQueue, setProcessingQueue] = useState<boolean>(false);

  const [cdnRegion, setCdnRegion] = useState<string>('Global Edge (Cloudflare)');

  const handleSimulateQueue = () => {
    setProcessingQueue(true);
    setTimeout(() => {
      setQueueJobs(0);
      setProcessingQueue(false);
    }, 1500);
  };

  const handleAddLoad = () => {
    setLbRequests(prev => prev + 1200);
    setCacheHits(prev => prev + 1150);
    setCacheMisses(prev => prev + 50);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent pointer-events-none"></div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-medium mb-4">
            <Radio className="w-3.5 h-3.5 animate-pulse text-blue-400" /> Enterprise Architecture & Scalability Standard
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">
            10 Problems Every Scalable App Must Solve
          </h1>
          <p className="text-slate-300 mt-2 max-w-2xl text-sm leading-relaxed">
            Inspired by high-availability systems engineering principles, this interactive dashboard maps how NursePrep AI handles peak traffic, caching layers, rate limiting, object storage, background message queues, and global CDN latency.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={handleAddLoad} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-blue-600/35 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-300" /> Simulate High Traffic Spike (+1,200 req/s)
            </Button>
            <Button onClick={() => { setLbRequests(4500); setCacheHits(14280); setBlockedRequests(128); setQueueJobs(42); }} variant="outline" className="border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800 text-xs font-semibold px-4 py-2 rounded-xl">
              <RefreshCw className="w-3.5 h-3.5" /> Reset Telemetry
            </Button>
          </div>
        </div>
      </div>

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
              <ShieldAlert className="w-3.5 h-3.5" /> API Gateway Active
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

      {/* Interactive Simulation Interactive Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Load Balancer & Traffic */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-bold">1</div>
              <div>
                <h3 className="font-bold text-slate-900">High Traffic → Load Balancer</h3>
                <p className="text-xs text-slate-500">Nginx & AWS ALB Traffic Distribution</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium">Active</span>
          </div>

          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Active Compute Nodes:</span>
              <div className="flex gap-2">
                {[2, 3, 5, 8].map(n => (
                  <button 
                    key={n}
                    onClick={() => setLbActiveNodes(n)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${lbActiveNodes === n ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {n} Nodes
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Balancing Algorithm:</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setLbAlgorithm('round-robin')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${lbAlgorithm === 'round-robin' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  Round-Robin
                </button>
                <button 
                  onClick={() => setLbAlgorithm('least-conn')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${lbAlgorithm === 'least-conn' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  Least-Connections
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 text-xs space-y-2">
              <div className="flex justify-between text-slate-700 font-medium">
                <span>Load Per Node ({lbActiveNodes} active instances):</span>
                <span>{Math.round(lbRequests / lbActiveNodes).toLocaleString()} req/s per node</span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${Math.round(lbRequests / lbActiveNodes) > 2000 ? 'bg-amber-500' : 'bg-blue-600'}`}
                  style={{ width: `${Math.min(100, (lbRequests / (lbActiveNodes * 1500)) * 100)}%` }}
                ></div>
              </div>
              <p className="text-slate-500 text-[11px]">
                {lbAlgorithm === 'round-robin' ? 'Distributing incoming requests sequentially across all healthy targets.' : 'Routing traffic to the server with fewest active TCP connections.'}
              </p>
            </div>
          </div>
        </div>

        {/* Panel 2: Slow Database & Caching */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 font-bold">2</div>
              <div>
                <h3 className="font-bold text-slate-900">Slow Database → Cache (Redis)</h3>
                <p className="text-xs text-slate-500">In-Memory Key-Value Caching Layer</p>
              </div>
            </div>
            <button 
              onClick={() => setCacheEnabled(!cacheEnabled)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${cacheEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}
            >
              {cacheEnabled ? 'Cache Enabled' : 'Cache Bypassed'}
            </button>
          </div>

          <div className="mt-5 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <p className="text-xs text-slate-500">Cache Hits</p>
                <p className="text-xl font-bold text-emerald-600 mt-1">{cacheHits.toLocaleString()}</p>
                <span className="text-[10px] text-slate-400">Response time: ~2ms</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <p className="text-xs text-slate-500">DB Queries</p>
                <p className="text-xl font-bold text-amber-600 mt-1">{cacheMisses.toLocaleString()}</p>
                <span className="text-[10px] text-slate-400">Response time: ~145ms</span>
              </div>
            </div>

            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-blue-900 flex items-center justify-between">
              <div>
                <span className="font-semibold block">Database Load Reduction</span>
                <span>Queries saved: {cacheEnabled ? '97.8%' : '0% (Direct DB hammering)'}</span>
              </div>
              <Database className="w-8 h-8 text-blue-500 opacity-60" />
            </div>
          </div>
        </div>
      </div>

      {/* The 10 Scalability Pillars Grid */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-6">The 10 Scalability Pillars & Implementation in NursePrep AI</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* 1 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold mb-4">1</div>
              <h3 className="font-bold text-slate-900 text-base">High Traffic → Load Balancer</h3>
              <p className="text-xs text-slate-500 mt-1">Nginx & AWS ALB</p>
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                Distributes incoming student HTTP and WebSocket requests across multiple container replicas to ensure zero single points of failure.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Configured & Active in Cloud Run Ingress
            </div>
          </div>

          {/* 2 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold mb-4">2</div>
              <h3 className="font-bold text-slate-900 text-base">Slow Database → Cache</h3>
              <p className="text-xs text-slate-500 mt-1">Redis / Memcached</p>
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                Caches frequently accessed NCLEX question banks, rationales, and user session profiles in memory to bypass repetitive Firestore reads.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 98% Cache Hit Efficiency
            </div>
          </div>

          {/* 3 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold mb-4">3</div>
              <h3 className="font-bold text-slate-900 text-base">API Abuse → Rate Limiting</h3>
              <p className="text-xs text-slate-500 mt-1">API Gateway Token Bucket</p>
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                Protects AI quiz generation and exam submission endpoints against bot scrapers and DDoS attacks using IP-based sliding window rate limits.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100 req/min limit per user token
            </div>
          </div>

          {/* 4 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold mb-4">4</div>
              <h3 className="font-bold text-slate-900 text-base">Large File Storage → Object Storage</h3>
              <p className="text-xs text-slate-500 mt-1">AWS S3 / Google Cloud Storage</p>
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                Offloads heavy medical diagrams, student exam PDF uploads, and video lectures from application servers into secure scalable object buckets.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Signed URLs for Secure Access
            </div>
          </div>

          {/* 5 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center font-bold mb-4">5</div>
              <h3 className="font-bold text-slate-900 text-base">Slow Background Tasks → Queue</h3>
              <p className="text-xs text-slate-500 mt-1">Kafka / RabbitMQ / Cloud Tasks</p>
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                Queues heavy computational jobs like AI exam grading, analytics report generation, and bulk email notifications for asynchronous worker processing.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">{queueJobs} jobs pending</span>
              <button onClick={handleSimulateQueue} disabled={processingQueue} className="text-xs bg-purple-600 hover:bg-purple-500 text-white font-medium px-3 py-1 rounded-lg">
                {processingQueue ? 'Processing...' : 'Run Workers'}
              </button>
            </div>
          </div>

          {/* 6 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center font-bold mb-4">6</div>
              <h3 className="font-bold text-slate-900 text-base">Global Latency → CDN</h3>
              <p className="text-xs text-slate-500 mt-1">CloudFront / Cloudflare Edge</p>
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                Caches static assets (JS bundles, CSS, nursing illustrations) at 275+ edge locations worldwide to reduce latency for nursing students globally.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" /> Edge Cache TTL: 24 Hours
            </div>
          </div>

          {/* 7 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center font-bold mb-4">7</div>
              <h3 className="font-bold text-slate-900 text-base">Microservices & Mesh</h3>
              <p className="text-xs text-slate-500 mt-1">Istio / Envoy Service Mesh</p>
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                Secures inter-service communications with mutual TLS (mTLS), automated retries, and distributed tracing across auth, quiz, and AI services.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> mTLS Encryption Enabled
            </div>
          </div>

          {/* 8 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center font-bold mb-4">8</div>
              <h3 className="font-bold text-slate-900 text-base">Distributed Tracing & Logging</h3>
              <p className="text-xs text-slate-500 mt-1">OpenTelemetry & Datadog</p>
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                Tracks every student request across database queries and Gemini AI model calls with unique correlation IDs for instantaneous bottleneck debugging.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Real-time APM Monitoring
            </div>
          </div>

          {/* 9 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center font-bold mb-4">9</div>
              <h3 className="font-bold text-slate-900 text-base">Database Sharding & Replication</h3>
              <p className="text-xs text-slate-500 mt-1">Multi-Region Read Replicas</p>
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                Splits heavy read traffic from write traffic using distributed read replicas, ensuring lightning-fast quiz retrieval during nationwide mock exams.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Sub-10ms Read Latency
            </div>
          </div>

          {/* 10 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between md:col-span-2 lg:col-span-1">
            <div>
              <div className="w-10 h-10 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center font-bold mb-4">10</div>
              <h3 className="font-bold text-slate-900 text-base">Fault Tolerance & Circuit Breakers</h3>
              <p className="text-xs text-slate-500 mt-1">Resilience4j / Fallbacks</p>
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                Gracefully degrades non-essential features (e.g., fallback static questions if AI generation service times out) to keep the core exam engine running.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Automatic Failover Active
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
