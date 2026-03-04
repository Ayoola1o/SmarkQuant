"use client";

import { useState, useEffect, useRef } from "react";
import {
    Play,
    Download,
    Activity,
    Calendar,
    BarChart3,
    Terminal,
    AlertCircle,
    TrendingUp,
    TrendingDown,
    Clock
} from "lucide-react";
import { toast } from "sonner";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

export default function BacktestPage() {
    const [startDate, setStartDate] = useState("2023-01-01");
    const [finishDate, setFinishDate] = useState("2024-01-01");
    const [status, setStatus] = useState<any>(null);
    const [results, setResults] = useState<any>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const logEndRef = useRef<HTMLDivElement>(null);

    // Poll for status when running
    useEffect(() => {
        let interval: any;
        if (status?.is_running) {
            interval = setInterval(fetchStatus, 2000);
        } else {
            fetchStatus();
        }
        return () => clearInterval(interval);
    }, [status?.is_running]);

    // Initial results fetch
    useEffect(() => {
        fetchResults();
    }, []);

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

    const fetchResults = async () => {
        setIsRefreshing(true);
        try {
            const res = await fetch("http://localhost:8000/backtest/results");
            const data = await res.json();
            if (data.results) {
                setResults(data.results);
            }
        } catch (e) {
            toast.error("Failed to load backtest results");
        } finally {
            setIsRefreshing(false);
        }
    };

    const runBacktest = async () => {
        try {
            const res = await fetch("http://localhost:8000/backtest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ start_date: startDate, finish_date: finishDate }),
            });
            if (res.ok) {
                toast.success("Backtest started");
                fetchStatus();
            } else {
                const err = await res.json();
                toast.error(err.detail || "Failed to start backtest");
            }
        } catch (e) {
            toast.error("Connection error");
        }
    };

    const equityData = results?.charts?.equity?.map((val: number, i: number) => ({
        name: i,
        equity: val
    })) || [];

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Activity className="text-green-500" />
                        Backtesting Lab
                    </h1>
                    <p className="text-slate-400">Validate your strategies against historical data</p>
                </div>
                <div className="flex items-center gap-4 bg-slate-900 p-2 rounded-xl border border-slate-800">
                    <div className="flex flex-col px-3 border-r border-slate-800">
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Start Date</span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-transparent text-sm focus:outline-none"
                        />
                    </div>
                    <div className="flex flex-col px-3 border-r border-slate-800">
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Finish Date</span>
                        <input
                            type="date"
                            value={finishDate}
                            onChange={(e) => setFinishDate(e.target.value)}
                            className="bg-transparent text-sm focus:outline-none"
                        />
                    </div>
                    <button
                        onClick={runBacktest}
                        disabled={status?.is_running}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-sm font-bold rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
                    >
                        <Play size={18} fill="currentColor" />
                        {status?.is_running ? "Running..." : "Run Backtest"}
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Results Area */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Equity Curve Chart */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-[400px] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <TrendingUp size={20} className="text-blue-400" />
                                Equity Curve
                            </h2>
                            {results && <span className="text-xs text-slate-500 font-mono">{results.filename}</span>}
                        </div>
                        <div className="flex-1 w-full">
                            {results ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={equityData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                        <XAxis dataKey="name" hide />
                                        <YAxis
                                            stroke="#475569"
                                            fontSize={12}
                                            tickFormatter={(val) => `$${val.toLocaleString()}`}
                                            domain={['auto', 'auto']}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
                                            labelStyle={{ display: 'none' }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="equity"
                                            stroke="#3b82f6"
                                            strokeWidth={2}
                                            dot={false}
                                            animationDuration={1000}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-600 border border-dashed border-slate-800 rounded-xl">
                                    <BarChart3 size={48} className="mb-4 opacity-20" />
                                    <p>No backtest results available yet.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: "Net Profit", value: results?.metrics?.net_profit ? `${results.metrics.net_profit.toFixed(2)}%` : "--", icon: TrendingUp },
                            { label: "Win Rate", value: results?.metrics?.win_rate ? `${(results.metrics.win_rate * 100).toFixed(1)}%` : "--", icon: Activity },
                            { label: "Max Drawdown", value: results?.metrics?.max_drawdown ? `${results.metrics.max_drawdown.toFixed(2)}%` : "--", icon: TrendingDown },
                            { label: "Total Trades", value: results?.metrics?.total_trades || "--", icon: List },
                        ].map((m, i) => (
                            <div key={i} className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                                <p className="text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">{m.label}</p>
                                <p className="text-2xl font-black">{m.value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar: Logs & Control */}
                <div className="space-y-6">
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl flex flex-col h-[520px]">
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 rounded-t-2xl">
                            <h3 className="text-sm font-bold flex items-center gap-2">
                                <Terminal size={16} className="text-blue-400" />
                                Live Engine Logs
                            </h3>
                            {status?.is_running && (
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                                    <span className="text-[10px] text-green-500 font-bold uppercase">{status.runtime}s</span>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] space-y-1">
                            {status?.logs?.length > 0 ? (
                                status.logs.map((log: string, i: number) => (
                                    <div key={i} className="text-slate-400 border-l border-slate-800 pl-3 leading-relaxed">
                                        {log}
                                    </div>
                                ))
                            ) : (
                                <div className="text-slate-600 italic">Logs will appear here once a process starts...</div>
                            )}
                            <div ref={logEndRef} />
                        </div>
                        <div className="p-4 border-t border-slate-800 bg-slate-900/30">
                            <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                                <Clock size={14} />
                                <span>Last Run: {status?.last_command || "None"}</span>
                            </div>
                            <button
                                onClick={fetchResults}
                                className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                            >
                                <Download size={14} />
                                Refresh Latest Results
                            </button>
                        </div>
                    </div>

                    <div className="bg-blue-600/10 border border-blue-600/20 p-5 rounded-2xl">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-blue-600/20 rounded-lg">
                                <AlertCircle size={20} className="text-blue-400" />
                            </div>
                            <h4 className="font-bold text-blue-400">Data Check</h4>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Ensure you have imported candles for the selected period before running backtests. You can do this in the <b>Data</b> tab.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

const List = ({ size, className }: { size: number, className?: string }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <line x1="8" y1="6" x2="21" y2="6"></line>
        <line x1="8" y1="12" x2="21" y2="12"></line>
        <line x1="8" y1="18" x2="21" y2="18"></line>
        <line x1="3" y1="6" x2="3.01" y2="6"></line>
        <line x1="3" y1="12" x2="3.01" y2="12"></line>
        <line x1="3" y1="18" x2="3.01" y2="18"></line>
    </svg>
);
