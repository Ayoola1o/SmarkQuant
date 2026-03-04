"use client";

import { useState, useEffect, useRef } from "react";
import {
    Radio,
    Play,
    Square,
    Activity,
    Wallet,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Terminal,
    Clock,
    Zap,
    ShieldCheck
} from "lucide-react";
import { toast } from "sonner";

export default function LivePage() {
    const [exchange, setExchange] = useState("Binance Futures");
    const [symbol, setSymbol] = useState("BTC-USDT");
    const [status, setStatus] = useState<any>(null);
    const [metrics, setMetrics] = useState<any>(null);
    const logEndRef = useRef<HTMLDivElement>(null);

    // Poll for status and metrics when running
    useEffect(() => {
        let interval: any;
        if (status?.is_running) {
            interval = setInterval(() => {
                fetchStatus();
                fetchMetrics();
            }, 2000);
        } else {
            fetchStatus();
            fetchMetrics();
        }
        return () => clearInterval(interval);
    }, [status?.is_running]);

    const fetchStatus = async () => {
        try {
            const res = await fetch("http://localhost:8000/jesse/status");
            const data = await res.json();
            setStatus(data);
            if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: "smooth" });
        } catch (e) {
            console.error("Status fetch failed");
        }
    };

    const fetchMetrics = async () => {
        try {
            const res = await fetch("http://localhost:8000/live/metrics");
            const data = await res.json();
            setMetrics(data);
        } catch (e) {
            console.error("Metrics fetch failed");
        }
    };

    const startLive = async () => {
        try {
            const res = await fetch("http://localhost:8000/live/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ exchange, symbol }),
            });
            if (res.ok) {
                toast.success("Live session initiated");
                fetchStatus();
            } else {
                const err = await res.json();
                toast.error(err.detail || "Failed to start live session");
            }
        } catch (e) {
            toast.error("Connection error");
        }
    };

    const stopLive = async () => {
        try {
            const res = await fetch("http://localhost:8000/live/stop", {
                method: "POST",
            });
            if (res.ok) {
                toast.info("Session terminated");
                fetchStatus();
            }
        } catch (e) {
            toast.error("Failed to stop session");
        }
    };

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Radio className={status?.is_running ? "text-red-500 animate-pulse" : "text-slate-500"} />
                        Live Dashboard
                    </h1>
                    <p className="text-slate-400">Monitor active algorithmic trading sessions</p>
                </div>

                <div className="flex items-center gap-4">
                    {status?.is_running ? (
                        <button
                            onClick={stopLive}
                            className="px-6 py-2.5 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-600/30 rounded-xl flex items-center gap-2 font-bold transition-all"
                        >
                            <Square size={18} fill="currentColor" /> Stop Session
                        </button>
                    ) : (
                        <div className="flex items-center gap-3 bg-slate-900 p-1.5 rounded-xl border border-slate-800 shadow-inner">
                            <input
                                type="text"
                                value={symbol}
                                onChange={(e) => setSymbol(e.target.toUpperCase())}
                                className="bg-transparent px-3 py-1 text-sm font-bold w-28 focus:outline-none uppercase"
                                placeholder="BTC-USDT"
                            />
                            <button
                                onClick={startLive}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-2 font-bold text-sm transition-all shadow-lg shadow-blue-600/20"
                            >
                                <Play size={16} fill="currentColor" /> Go Live
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Real-time Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    label="Wallet Balance"
                    value={`$${metrics?.balance?.toLocaleString() || "0.00"}`}
                    icon={<Wallet className="text-blue-400" />}
                    sub="Available Capital"
                />
                <MetricCard
                    label="Smark Equity"
                    value={`$${metrics?.equity?.toLocaleString() || "0.00"}`}
                    icon={<TrendingUp className="text-green-400" />}
                    sub={`+$${metrics?.pnl?.toFixed(2) || "0.00"} Unrealized`}
                />
                <MetricCard
                    label="Active Position"
                    value={metrics?.active_positions?.[0]?.type || "NONE"}
                    icon={<Activity className="text-orange-400" />}
                    sub={metrics?.active_positions?.[0]?.symbol || "No active trades"}
                    trend={metrics?.active_positions?.[0]?.pnl > 0 ? "up" : metrics?.active_positions?.[0]?.pnl < 0 ? "down" : undefined}
                />
                <MetricCard
                    label="Uptime"
                    value={status?.is_running ? `${Math.floor(status.runtime / 60)}m ${Math.floor(status.runtime % 60)}s` : "0s"}
                    icon={<Clock className="text-purple-400" />}
                    sub="Session Duration"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Positions & Signals */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
                            <h2 className="font-bold flex items-center gap-2 italic">
                                <Zap size={18} className="text-yellow-400" /> Open Positions
                            </h2>
                            <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full font-bold uppercase">Real-time</span>
                        </div>
                        <div className="p-0">
                            {metrics?.active_positions?.length > 0 ? (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-[10px] text-slate-500 uppercase tracking-widest border-b border-slate-800 bg-slate-950/30">
                                            <th className="px-6 py-3 font-bold">Symbol</th>
                                            <th className="px-6 py-3 font-bold">Type</th>
                                            <th className="px-6 py-3 font-bold">Entry</th>
                                            <th className="px-6 py-3 font-bold">Current</th>
                                            <th className="px-6 py-3 font-bold">P&L</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {metrics.active_positions.map((pos: any, i: number) => (
                                            <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                                                <td className="px-6 py-4 font-black">{pos.symbol}</td>
                                                <td className="px-6 py-4">
                                                    <span className={pos.type === 'LONG' ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
                                                        {pos.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-slate-400">${pos.entry}</td>
                                                <td className="px-6 py-4 font-mono text-white">${pos.current}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`font-mono font-bold ${pos.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        {pos.pnl >= 0 ? '+' : ''}${pos.pnl.toFixed(2)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-12 text-center text-slate-600 italic">No active positions at the moment.</div>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-center justify-between shadow-xl">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-500/10 rounded-xl">
                                <ShieldCheck size={28} className="text-green-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">Execution Engine</h3>
                                <p className="text-xs text-slate-500">Connected to Jesse Live Driver v0.4.2</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Status</p>
                            <div className="flex items-center gap-2 justify-end">
                                <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/20" />
                                <span className="text-xs font-black text-green-500">OPERATIONAL</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Live Logs Sidebar */}
                <div className="bg-slate-950 border border-slate-800 rounded-3xl flex flex-col h-[600px] shadow-2xl overflow-hidden">
                    <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                        <div className="flex items-center gap-2">
                            <Terminal size={18} className="text-slate-400" />
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">Signal Stream</h3>
                        </div>
                        {status?.is_running && (
                            <div className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-[9px] font-black text-red-500 animate-pulse">LIVE</div>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 font-mono text-[11px] space-y-1.5 selection:bg-blue-500/30">
                        {status?.logs?.length > 0 ? (
                            status.logs.map((log: string, i: number) => (
                                <div key={i} className="text-slate-400 border-l border-slate-800 pl-4 py-0.5 hover:text-white transition-colors">
                                    {log}
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-800">
                                <Radio size={40} className="mb-4 opacity-5" />
                                <p className="text-xs font-bold opacity-20">PENDING CONNECTION...</p>
                            </div>
                        )}
                        <div ref={logEndRef} />
                    </div>
                    <div className="p-4 bg-slate-900/40 border-t border-slate-800 text-[10px] text-slate-500 font-mono text-center">
             // End of stream //
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ label, value, icon, sub, trend }: any) {
    return (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl hover:border-slate-700 transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-slate-800 rounded-xl group-hover:scale-110 transition-transform">
                    {icon}
                </div>
                {trend && (
                    <div className={`p-1 rounded-full ${trend === 'up' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                        {trend === 'up' ? <ArrowUpRight size={16} className="text-green-500" /> : <ArrowDownRight size={16} className="text-red-500" />}
                    </div>
                )}
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-1">{label}</p>
            <p className="text-2xl font-black text-white">{value}</p>
            <p className="text-[11px] text-slate-500 mt-2 font-medium">{sub}</p>
        </div>
    )
}
