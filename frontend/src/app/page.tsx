import { TrendingUp, Activity, Box, Database } from 'lucide-react';

export default function Home() {
  return (
    <div className="p-8 space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-slate-400">Welcome to your trading lab overview</p>
        </div>
        <div className="px-4 py-2 bg-green-500/10 text-green-500 border border-green-500/20 rounded-full text-sm flex items-center gap-2">
          <Activity size={16} />
          <span>System Online</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Active Strategy', value: 'SampleStrategy', icon: Box, color: 'text-blue-500' },
          { label: 'Routes Configured', value: '1', icon: TrendingUp, color: 'text-purple-500' },
          { label: 'Candles Cached', value: '124k', icon: Database, color: 'text-orange-500' },
          { label: 'Bot Status', value: 'Idle', icon: Activity, color: 'text-yellow-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-xl hover:border-slate-700 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <stat.icon className={stat.color} size={24} />
              <span className="text-xs text-slate-500 font-mono">FR-0{i + 1}</span>
            </div>
            <p className="text-sm text-slate-400 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Market Watch</h2>
            <div className="h-64 flex items-center justify-center border border-dashed border-slate-700 rounded-lg text-slate-500">
              Live Equity Curve Placeholder
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Active Routes</h2>
            <table className="w-full text-left">
              <thead className="text-sm text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="pb-3">Exchange</th>
                  <th className="pb-3">Pair</th>
                  <th className="pb-3">Timeframe</th>
                  <th className="pb-3">Strategy</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                <tr className="border-b border-slate-800/50">
                  <td className="py-4 font-medium uppercase">Binance Futures</td>
                  <td className="py-4">BTC-USDT</td>
                  <td className="py-2"><span className="px-2 py-1 bg-slate-800 rounded text-xs">4h</span></td>
                  <td className="py-4">SampleStrategy</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Recent Logs</h2>
            <div className="space-y-3 font-mono text-xs">
              <p className="text-slate-500">[18:32:01] <span className="text-green-500">INFO:</span> System initialized</p>
              <p className="text-slate-500">[18:32:05] <span className="text-blue-500">DEBUG:</span> Loaded 1 strategy class</p>
              <p className="text-slate-500">[18:32:10] <span className="text-yellow-500">WARN:</span> Historical candles outdated</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-6 text-white">
            <h3 className="text-lg font-bold mb-2">JesseGPT Copilot</h3>
            <p className="text-sm text-white/80 mb-4">Ready to help you write strategies or DNA strings.</p>
            <button className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors">
              Open Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
